import { AnalysisId } from './analysis';
import { Lens } from './lens';

/**
 * History entry for a completed analysis
 */
export interface HistoryEntry {
  id: AnalysisId;
  title: string;
  lens: Lens;
  inputPreview: string;
  timestamp: Date;
  saved: boolean;
  tags?: string[];
}

/**
 * Saved analysis - persisted for later retrieval
 */
export interface SavedAnalysis {
  id: AnalysisId;
  title: string;
  lens: Lens;
  fullAnalysis: unknown; // Serialized SomaAnalysis
  savedAt: Date;
  tags: string[];
  notes?: string;
}

/**
 * User workspace
 */
export interface Workspace {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  settings: WorkspaceSettings;
}

/**
 * Workspace settings
 */
export interface WorkspaceSettings {
  theme: 'light' | 'dark' | 'auto';
  defaultLens: Lens;
  autoSave: boolean;
  maxHistoryItems: number;
  privacyMode: boolean;
}
