import { dataService } from './dataService';
import type { FilterState, FileManifestEntry } from '../types';

/**
 * High-performance filtering using Set intersections.
 * Time Complexity: O(M * K) where M is number of active filters and K is result set size.
 * Previous Complexity: O(N) where N is total dataset size.
 */
export function filterFiles(filters: FilterState): FileManifestEntry[] {
  const fullManifest = dataService.getManifest();
  
  // Optimization: If no filters active, return all immediately (O(1))
  const hasText = !!filters.searchQuery.trim();
  const hasDiag = filters.diagnoses.length > 0;
  const hasCenter = filters.centers.length > 0;
  const hasAssay = filters.assayTypes.length > 0;
  const hasPanel = filters.panelIds.length > 0;
  const hasAb = filters.antibodies.length > 0;
  const hasCat = filters.categories.length > 0;

  if (!hasText && !hasDiag && !hasCenter && !hasAssay && !hasPanel && !hasAb && !hasCat) {
    return fullManifest;
  }

  // We start with null, representing "All files potentially valid"
  // As we apply filters, we intersect this set.
  let candidateSet: Set<FileManifestEntry> | null = null;

  const applySetFilter = (subset: Set<FileManifestEntry>) => {
    if (candidateSet === null) {
      candidateSet = subset; // First filter applied becomes the base
    } else {
      // Intersect: Keep only items present in both
      // Optimization: Iterate over the smaller set
      if (subset.size < candidateSet.size) {
        candidateSet = new Set([...subset].filter(x => candidateSet!.has(x)));
      } else {
        candidateSet = new Set([...candidateSet].filter(x => subset.has(x)));
      }
    }
  };

  // 1. Metadata Filters (Using Fast Indexes)
  
  if (hasDiag) {
    const index = dataService.getDiagnosisIndex();
    const matches = new Set<FileManifestEntry>();
    // Union of all selected diagnoses
    filters.diagnoses.forEach(d => {
      const s = index.get(d);
      if (s) s.forEach(f => matches.add(f));
    });
    applySetFilter(matches);
    if (candidateSet?.size === 0) return [];
  }

  if (hasCenter) {
    const index = dataService.getCenterIndex();
    const matches = new Set<FileManifestEntry>();
    filters.centers.forEach(c => {
      const s = index.get(c);
      if (s) s.forEach(f => matches.add(f));
    });
    applySetFilter(matches);
    if (candidateSet?.size === 0) return [];
  }

  // 2. Computed Filters (Antibodies/Panels)
  // These are derived but we can still optimize
  
  if (hasPanel) {
    const matches = new Set<FileManifestEntry>();
    filters.panelIds.forEach(pid => {
      dataService.getFilesForPanel(pid).forEach(f => matches.add(f));
    });
    applySetFilter(matches);
    if (candidateSet?.size === 0) return [];
  }

  if (hasAb) {
    // Logic: File must contain ALL selected antibodies (AND)
    // We can just grab the files for the *first* antibody, then intersect for the rest
    // This is faster than iterating all files.
    let abMatches: Set<FileManifestEntry> | null = null;
    
    for (const ab of filters.antibodies) {
      const filesWithAb = new Set(dataService.getFilesWithAntibody(ab));
      if (abMatches === null) {
        abMatches = filesWithAb;
      } else {
        // Intersect
        abMatches = new Set([...abMatches].filter(x => filesWithAb.has(x)));
      }
      if (abMatches.size === 0) break; 
    }
    
    if (abMatches) applySetFilter(abMatches);
    if (candidateSet?.size === 0) return [];
  }

  if (hasCat) {
    const panels = dataService.getPanels();
    const library = dataService.getLibrary();
    // This is the most expensive filter, requires panel lookup
    // We iterate over the candidate set (if exists) or all files
    const source = candidateSet ? Array.from(candidateSet) : fullManifest;
    
    const filtered = source.filter(f => {
      const p = panels[f.panel_id];
      if (!p) return false;
      return p.targets.some(target => {
        const entry = library[target];
        if (!entry) return false;
        return entry.categories.some(cat => filters.categories.includes(cat));
      });
    });
    
    // Reset candidate set to this result
    candidateSet = new Set(filtered);
    if (candidateSet.size === 0) return [];
  }

  // 3. Text Search (Always last, as it's the most expensive per-item check)
  let finalResults = candidateSet ? Array.from(candidateSet) : fullManifest;

  if (hasText) {
    const q = filters.searchQuery.toLowerCase();
    finalResults = finalResults.filter(f => 
      f.file_id.toLowerCase().includes(q) ||
      f.participant_id.toLowerCase().includes(q) ||
      (f.diagnosis && f.diagnosis.toLowerCase().includes(q))
    );
  }

  return finalResults;
}

export function getStats(files: FileManifestEntry[]) {
  // Stats calculation is still O(N) over the *result set*, which is fine
  const uniquePanels = new Set(files.map(f => f.panel_id));
  const uniqueDiagnoses = new Set<string>();
  const uniqueCenters = new Set<string>();
  
  const panels = dataService.getPanels();
  const uniqueAntibodies = new Set<string>();

  const diagnosisCounts: Record<string, number> = {};
  const centerCounts: Record<string, number> = {};

  files.forEach(f => {
    if (f.diagnosis) {
      uniqueDiagnoses.add(f.diagnosis);
      diagnosisCounts[f.diagnosis] = (diagnosisCounts[f.diagnosis] || 0) + 1;
    }
    uniqueCenters.add(f.center);
    centerCounts[f.center] = (centerCounts[f.center] || 0) + 1;

    const p = panels[f.panel_id];
    if (p) {
      p.targets.forEach(t => uniqueAntibodies.add(t));
    }
  });

  return {
    totalFiles: files.length,
    totalPanels: uniquePanels.size,
    totalAntibodies: uniqueAntibodies.size,
    centersCount: uniqueCenters.size,
    diagnosesCount: uniqueDiagnoses.size,
    uniqueDiagnoses: Array.from(uniqueDiagnoses).sort(),
    uniqueCenters: Array.from(uniqueCenters).sort(),
    filesPerCenter: Object.entries(centerCounts).map(([name, value]) => ({ name, value })),
    filesPerDiagnosis: Object.entries(diagnosisCounts).map(([name, value]) => ({ name, value }))
  };
}

export function searchLibrary(query: string) {
  const library = dataService.getLibrary();
  const lowerQ = query.toLowerCase();
  
  if (!lowerQ) {
    return Object.entries(library).slice(0, 20).map(([name, entry]) => ({ name, ...entry }));
  }

  return Object.entries(library)
    .filter(([name, entry]) => {
      return name.toLowerCase().includes(lowerQ) ||
             (entry.protein_name && entry.protein_name.toLowerCase().includes(lowerQ)) ||
             (entry.function && entry.function.toLowerCase().includes(lowerQ)) ||
             entry.categories.some(c => c.toLowerCase().includes(lowerQ));
    })
    .map(([name, entry]) => ({ name, ...entry }));
}

export function findPanelsByTargets(targets: string[]) {
  const panels = dataService.getPanels();
  const results = [];
  
  for (const [id, config] of Object.entries(panels)) {
    const present = targets.filter(t => config.targets.includes(t));
    if (present.length > 0) {
      results.push({
        panelId: id,
        center: config.center,
        matchedTargets: present,
        matchCount: present.length,
        totalTargets: config.targets.length,
        assayType: config.assay_type
      });
    }
  }
  return results.sort((a, b) => b.matchCount - a.matchCount);
}