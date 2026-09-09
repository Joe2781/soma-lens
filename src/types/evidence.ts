/**
 * Certainty level for a piece of evidence or claim
 */
export type EvidenceType = 
  | 'directly_stated'
  | 'source_claim'
  | 'supported_interpretation'
  | 'association'
  | 'possible_contributor'
  | 'compensatory_response'
  | 'inference'
  | 'unknown'
  | 'recommendation';

/**
 * Severity level for risks
 */
export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * A piece of evidence or claim with explicit certainty
 */
export interface Evidence {
  id: string;
  type: EvidenceType;
  content: string;
  severity?: Severity;
  justification?: string;
  source?: string;
  relatedConcepts?: string[];
}

/**
 * Observed facts directly present in input
 */
export interface Observed extends Evidence {
  type: 'directly_stated';
}

/**
 * Interpretation of what information means
 */
export interface Interpretation extends Evidence {
  type: 'supported_interpretation';
  basedOn: string[]; // IDs of evidence it's based on
}

/**
 * Reasonable conclusion not explicitly stated
 */
export interface Inferred extends Evidence {
  type: 'inference';
  confidence: 'high' | 'moderate' | 'low';
  assumptions: string[];
}

/**
 * What cannot be established
 */
export interface Unknown extends Evidence {
  type: 'unknown';
  whyUnknown: string;
  whatCouldChange?: string;
}

/**
 * Suggested action or investigation
 */
export interface Recommendation extends Evidence {
  type: 'recommendation';
  priority: 'high' | 'medium' | 'low';
  effort?: 'high' | 'medium' | 'low';
}

/**
 * Association without causal claim
 */
export interface Association extends Evidence {
  type: 'association';
  bidirectional: boolean;
}

/**
 * Something that may contribute but isn't established
 */
export interface PossibleContributor extends Evidence {
  type: 'possible_contributor';
  likelihood: 'probable' | 'possible' | 'speculative';
}

/**
 * Compensatory or secondary response
 */
export interface CompensatoryResponse extends Evidence {
  type: 'compensatory_response';
  primaryMechanism: string;
}

/**
 * Source claim from material (paper, doc, etc.)
 */
export interface SourceClaim extends Evidence {
  type: 'source_claim';
  sourceLocation: string;
  directQuote?: string;
}
