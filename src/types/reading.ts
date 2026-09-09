import { Evidence } from './evidence';

/**
 * A technical reading - the central object type
 * NOT a chat transcript - a curated understanding
 */
export interface Reading {
  id: string;
  title: string;
  subtitle?: string;
  
  // Main narrative
  sections: ReadingSection[];
  
  // What is established
  whatIsEstablished: string[];
  
  // What is not established
  whatIsNotEstablished: string[];
  
  // Key insight
  coreInsight?: string;
  
  // Progression
  progression?: ReadingProgression[];
}

/**
 * A section within a reading
 */
export interface ReadingSection {
  id: string;
  title: string;
  type: 'narrative' | 'evidence' | 'mechanism' | 'challenge' | 'comparison' | 'risk' | 'opportunity';
  content: string;
  subsections?: ReadingSubsection[];
  visualization?: string; // Diagram ID
}

/**
 * A subsection for nested content
 */
export interface ReadingSubsection {
  id: string;
  title: string;
  content: string;
}

/**
 * Shows progression of logic or mechanism
 */
export interface ReadingProgression {
  step: number;
  label: string;
  description?: string;
  implies?: string; // What does this imply or lead to?
}

/**
 * For scientific/medical readings - mechanism visualization
 */
export interface MechanismReading extends Reading {
  mechanism: MechanismStep[];
  unknownSteps?: MechanismGap[];
}

/**
 * A step in a mechanism
 */
export interface MechanismStep {
  id: string;
  order: number;
  name: string;
  description: string;
  evidence: EvidenceLevel;
  nextSteps?: string[]; // IDs of what follows
  alternatives?: string[]; // Alternative outcomes
  markers?: string[]; // Markers, proteins, measures, etc.
}

/**
 * Gap in our understanding of mechanism
 */
export interface MechanismGap {
  between: [string, string]; // Step IDs
  what: string; // What's missing
  why: string; // Why it matters
}

/**
 * How well established a mechanism step is
 */
export type EvidenceLevel = 'demonstrated' | 'strongly_suggested' | 'suggested' | 'possible' | 'speculative';
