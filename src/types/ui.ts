import { AnalysisStatus } from './analysis';
import { Lens } from './lens';

/**
 * UI state for composer
 */
export interface ComposerState {
  input: string;
  lens: Lens;
  isExpanded: boolean;
  hasAttachments: boolean;
  isSubmitting: boolean;
  characterCount: number;
}

/**
 * UI state for analysis view
 */
export interface AnalysisViewState {
  analysisId: string | null;
  status: AnalysisStatus;
  scrollPosition: number;
  expandedSections: Set<string>;
  selectedEvidence: string | null;
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
  action?: NotificationAction;
}

export interface NotificationAction {
  label: string;
  onClick: () => void;
}

/**
 * Toast message
 */
export interface Toast {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}

/**
 * Modal state
 */
export interface ModalState {
  isOpen: boolean;
  type?: 'settings' | 'save' | 'share' | 'help';
  data?: unknown;
}

/**
 * Sidebar state
 */
export interface SidebarState {
  isOpen: boolean;
  view: 'home' | 'history' | 'saved' | 'settings';
}
