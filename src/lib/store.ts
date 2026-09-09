/**
 * Store for managing application state
 * Uses Zustand for simplicity and performance
 */

import { create } from 'zustand';
import { SomaAnalysis, AnalysisRequest, AnalysisStatus } from '@/types/analysis';
import { HistoryEntry, SavedAnalysis, Workspace } from '@/types/history';

interface AppState {
  // Current analysis
  currentAnalysis: SomaAnalysis | null;
  isAnalyzing: boolean;
  analysisStatus: AnalysisStatus;
  
  // History
  history: HistoryEntry[];
  savedAnalyses: SavedAnalysis[];
  
  // Workspace
  workspace: Workspace | null;
  
  // Actions
  setCurrentAnalysis: (analysis: SomaAnalysis | null) => void;
  setIsAnalyzing: (value: boolean) => void;
  setAnalysisStatus: (status: AnalysisStatus) => void;
  addToHistory: (entry: HistoryEntry) => void;
  saveAnalysis: (analysis: SomaAnalysis, title: string, tags: string[]) => void;
  unsaveAnalysis: (id: string) => void;
  setWorkspace: (workspace: Workspace | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentAnalysis: null,
  isAnalyzing: false,
  analysisStatus: 'idle',
  history: [],
  savedAnalyses: [],
  workspace: null,
  
  setCurrentAnalysis: (analysis) => set({ currentAnalysis: analysis }),
  setIsAnalyzing: (value) => set({ isAnalyzing: value }),
  setAnalysisStatus: (status) => set({ analysisStatus: status }),
  
  addToHistory: (entry) => set((state) => ({
    history: [entry, ...state.history].slice(0, 100), // Keep last 100
  })),
  
  saveAnalysis: (analysis, title, tags) => set((state) => {
    const saved: SavedAnalysis = {
      id: analysis.id,
      title,
      lens: analysis.lens,
      fullAnalysis: analysis,
      savedAt: new Date(),
      tags,
    };
    return {
      savedAnalyses: [saved, ...state.savedAnalyses],
    };
  }),
  
  unsaveAnalysis: (id) => set((state) => ({
    savedAnalyses: state.savedAnalyses.filter((a) => a.id !== id),
  })),
  
  setWorkspace: (workspace) => set({ workspace }),
}));
