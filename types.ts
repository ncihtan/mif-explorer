
// Data Layer Types
export interface LibraryEntry {
  protein_name: string | null;
  uniprot: string | null;
  function: string | null;
  location: string[];
  categories: string[];
  organism?: string | null;
  confidence?: number;
}

export interface Library {
  [targetName: string]: LibraryEntry;
}

export interface FileManifestEntry {
  file_id: string;
  entity_id: string; // Synapse ID usually
  data_file_id?: string;
  participant_id: string;
  diagnosis: string | null;
  center: string;
  assay_type: string;
  panel_id: string;
}

export type FileManifest = FileManifestEntry[];

export interface PanelConfig {
  targets: string[];
  channels: Record<string, string>;
  center?: string;
  assay_date?: string;
  assay_type?: string;
}

export interface Panels {
  [panelId: string]: PanelConfig;
}

// UI State Types
export interface FilterState {
  searchQuery: string;
  diagnoses: string[];
  centers: string[];
  assayTypes: string[];
  antibodies: string[];
  categories: string[];
  panelIds: string[];
}

export type ViewMode = 'dashboard' | 'files' | 'panels' | 'antibodies';

// Stats
export interface DataStats {
  totalFiles: number;
  totalPanels: number;
  totalAntibodies: number;
  centersCount: number;
  diagnosesCount: number;
  uniqueDiagnoses: string[];
  uniqueCenters: string[];
  filesPerCenter: { name: string; value: number }[];
  filesPerDiagnosis: { name: string; value: number }[];
}

export interface SearchResult {
  files: FileManifestEntry[];
  totalCount: number;
  matchedFilters: Record<keyof FilterState, number>;
}
