import type { Library, FileManifest, Panels, FileManifestEntry } from '../types';

// Inverted Index Type
type InvertedIndex = Map<string, Set<FileManifestEntry>>;

class DataService {
  private library: Library | null = null;
  private manifest: FileManifest | null = null;
  private panels: Panels | null = null;

  // Primary Indexes
  private panelToFiles = new Map<string, FileManifestEntry[]>();
  private antibodyToFiles = new Map<string, FileManifestEntry[]>();
  
  // Inverted Indexes for High Performance Filtering
  private diagnosisIndex: InvertedIndex = new Map();
  private centerIndex: InvertedIndex = new Map();
  private assayIndex: InvertedIndex = new Map();
  
  // Sets for UI Options
  private diagnosisSet = new Set<string>();
  private centerSet = new Set<string>();
  private assayTypeSet = new Set<string>();
  private categorySet = new Set<string>();

  async initialize(): Promise<void> {
    console.time("DataFetch");
    try {
        const [libraryRes, manifestRes, panelsRes] = await Promise.all([
            fetch('data/library_full.json'),
            fetch('data/manifest_full.json'),
            fetch('data/panels_full.json')
        ]);

        if (!libraryRes.ok || !manifestRes.ok || !panelsRes.ok) {
            throw new Error(`Failed to load data: Lib ${libraryRes.status}, Man ${manifestRes.status}, Pan ${panelsRes.status}`);
        }

        this.library = await libraryRes.json();
        this.manifest = await manifestRes.json();
        this.panels = await panelsRes.json();
        console.timeEnd("DataFetch");

        console.time("Indexing");
        this.buildIndexes();
        console.timeEnd("Indexing");
        
        console.log(`✓ Data loaded: ${this.manifest?.length} files, ${Object.keys(this.library || {}).length} antibodies`);

    } catch (e) {
        console.error("Critical Error: Failed to initialize DataService", e);
        // Fallback or rethrow based on app needs. For now, we throw to alert the UI.
        throw e;
    }
  }

  private buildIndexes(): void {
    if (!this.manifest || !this.panels || !this.library) return;

    this.manifest.forEach(file => {
      // 1. Panel -> Files
      if (!this.panelToFiles.has(file.panel_id)) {
        this.panelToFiles.set(file.panel_id, []);
      }
      this.panelToFiles.get(file.panel_id)!.push(file);

      // 2. Build Inverted Indexes (Value -> Set of Files)
      this.addToIndex(this.diagnosisIndex, file.diagnosis || 'Unspecified', file);
      this.addToIndex(this.centerIndex, file.center, file);
      this.addToIndex(this.assayIndex, file.assay_type, file);

      // 3. UI Sets
      if (file.diagnosis) this.diagnosisSet.add(file.diagnosis);
      this.centerSet.add(file.center);
      this.assayTypeSet.add(file.assay_type);
    });

    // 4. Antibody Indexing
    Object.entries(this.panels).forEach(([panelId, config]) => {
      const filesForPanel = this.panelToFiles.get(panelId) || [];
      config.targets.forEach(target => {
        if (!this.antibodyToFiles.has(target)) {
          this.antibodyToFiles.set(target, []);
        }
        // Note: For extreme performance with huge datasets, we would use a Set here too
        this.antibodyToFiles.get(target)!.push(...filesForPanel);
      });
    });

    // 5. Category Indexing
    Object.values(this.library).forEach(entry => {
      entry.categories.forEach(c => this.categorySet.add(c));
    });
  }

  // Helper to build map of sets
  private addToIndex(index: InvertedIndex, key: string, file: FileManifestEntry) {
    if (!index.has(key)) {
      index.set(key, new Set());
    }
    index.get(key)!.add(file);
  }

  getLibrary() { return this.library || {}; }
  getManifest() { return this.manifest || []; }
  getPanels() { return this.panels || {}; }

  // Accessors for Indices
  getDiagnosisIndex() { return this.diagnosisIndex; }
  getCenterIndex() { return this.centerIndex; }
  getAssayIndex() { return this.assayIndex; }

  getFilterOptions() {
    return {
      diagnoses: Array.from(this.diagnosisSet).sort(),
      centers: Array.from(this.centerSet).sort(),
      assayTypes: Array.from(this.assayTypeSet).sort(),
      antibodies: Array.from(this.antibodyToFiles.keys()).sort(),
      categories: Array.from(this.categorySet).sort(),
    };
  }

  getAntibodiesForFile(fileId: string): string[] {
    const file = this.manifest?.find(f => f.file_id === fileId);
    if (!file || !this.panels) return [];
    return this.panels[file.panel_id]?.targets || [];
  }

  getFilesWithAntibody(antibody: string): FileManifestEntry[] {
    return this.antibodyToFiles.get(antibody) || [];
  }

  getFilesForPanel(panelId: string): FileManifestEntry[] {
    return this.panelToFiles.get(panelId) || [];
  }
}

export const dataService = new DataService();