/**
 * Analysis lens - determines the analytical perspective
 */
export type Lens = 
  | 'automatic'
  | 'explain'
  | 'debug'
  | 'research'
  | 'architecture'
  | 'risk'
  | 'summarize';

/**
 * Metadata for a lens
 */
export interface LensMetadata {
  id: Lens;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  resultSchema: string;
  examples: string[];
}

/**
 * Configuration for Automatic lens
 */
export interface AutomaticLensConfig {
  analyzeInputType: boolean;
  selectLens: boolean;
}

/**
 * Configuration for Explain lens
 */
export interface ExplainLensConfig {
  targetAudience?: 'beginner' | 'intermediate' | 'expert';
  includeExamples: boolean;
  includeVisuals: boolean;
}

/**
 * Configuration for Debug lens
 */
export interface DebugLensConfig {
  traceExecutionFlow: boolean;
  identifyLikelyRootCauses: boolean;
  suggestDiagnosticSteps: boolean;
  rankByProbability: boolean;
}

/**
 * Configuration for Research lens
 */
export interface ResearchLensConfig {
  mapMethodology: boolean;
  identifyVariables: boolean;
  separateClaimed: boolean;
  identifyLimitations: boolean;
  flagAlternativeExplanations: boolean;
}

/**
 * Configuration for Architecture lens
 */
export interface ArchitectureLensConfig {
  mapComponents: boolean;
  traceDataFlow: boolean;
  identifyDependencies: boolean;
  findBottlenecks: boolean;
  identifyFailurePoints: boolean;
}

/**
 * Configuration for Risk lens
 */
export interface RiskLensConfig {
  surfaceRisks: boolean;
  identifyAssumptions: boolean;
  mapDependencies: boolean;
  surfaceFailureModes: boolean;
  suggestMitigation: boolean;
}

/**
 * Configuration for Summarize lens
 */
export interface SummarizeLensConfig {
  targetLength: 'brief' | 'moderate' | 'detailed';
  preserveSignal: boolean;
  highlightKey: boolean;
}

export type LensConfig = 
  | AutomaticLensConfig
  | ExplainLensConfig
  | DebugLensConfig
  | ResearchLensConfig
  | ArchitectureLensConfig
  | RiskLensConfig
  | SummarizeLensConfig;
