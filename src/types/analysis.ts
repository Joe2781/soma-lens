import { Lens } from './lens';
import { Evidence } from './evidence';
import { Reading } from './reading';
import { Diagram } from './diagram';

/**
 * Unique identifier for an analysis
 */
export type AnalysisId = string & { readonly __brand: 'AnalysisId' };

/**
 * Status of an ongoing analysis
 */
export type AnalysisStatus = 
  | 'idle'
  | 'submitting'
  | 'analyzing'
  | 'structuring'
  | 'building'
  | 'complete'
  | 'error'
  | 'interrupted';

/**
 * A user's request for analysis
 */
export interface AnalysisRequest {
  id: AnalysisId;
  input: string;
  lens: Lens;
  attachments?: AnalysisAttachment[];
  followUpTo?: AnalysisId;
  createdAt: Date;
}

/**
 * Attachment to an analysis request (code, file, link, etc.)
 */
export interface AnalysisAttachment {
  id: string;
  type: 'code' | 'file' | 'link' | 'text';
  content: string;
  language?: string;
  filename?: string;
  mime?: string;
}

/**
 * The complete analysis result
 */
export interface SomaAnalysis {
  id: AnalysisId;
  request: AnalysisRequest;
  lens: Lens;
  status: AnalysisStatus;
  
  // Content
  title: string;
  summary: string;
  reading: Reading;
  
  // Structured intelligence
  observed: Evidence[];
  interpretation: Evidence[];
  inferred: Evidence[];
  unknown: Evidence[];
  recommendations: Evidence[];
  
  // Relationships and flow
  relationships: Relationship[];
  diagrams: Diagram[];
  
  // Follow-up
  followUpQuestions: string[];
  followUps: FollowUp[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  estimatedTokens?: TokenUsage;
  error?: AnalysisError;
}

/**
 * A relationship between concepts in the analysis
 */
export interface Relationship {
  id: string;
  source: string;
  target: string;
  type: 'depends_on' | 'causes' | 'relates_to' | 'supports' | 'contradicts' | 'examples';
  strength: 'strong' | 'moderate' | 'weak';
  description?: string;
}

/**
 * Follow-up action on an analysis
 */
export type FollowUp = 
  | { type: 'explain_simpler' }
  | { type: 'go_deeper' }
  | { type: 'show_example' }
  | { type: 'challenge_this' }
  | { type: 'find_weaknesses' }
  | { type: 'compare_alternatives' }
  | { type: 'custom_question'; question: string };

/**
 * Error during analysis
 */
export interface AnalysisError {
  code: string;
  message: string;
  details?: unknown;
  recoverable: boolean;
}

/**
 * Token usage tracking
 */
export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost?: number;
}

/**
 * Streaming event during analysis
 */
export type StreamingEvent = 
  | { type: 'started'; timestamp: Date }
  | { type: 'status_change'; status: AnalysisStatus; timestamp: Date }
  | { type: 'section_start'; section: string; timestamp: Date }
  | { type: 'section_content'; section: string; content: string; timestamp: Date }
  | { type: 'section_complete'; section: string; timestamp: Date }
  | { type: 'token_usage'; usage: TokenUsage; timestamp: Date }
  | { type: 'completed'; timestamp: Date }
  | { type: 'error'; error: AnalysisError; timestamp: Date }
  | { type: 'interrupted'; timestamp: Date };
