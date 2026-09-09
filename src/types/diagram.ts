/**
 * Diagram types for visualizing relationships, architecture, mechanisms
 */
export type DiagramType = 
  | 'architecture'
  | 'mechanism'
  | 'flow'
  | 'dependency'
  | 'state'
  | 'sequence'
  | 'risk_matrix';

/**
 * A diagram in the analysis
 */
export interface Diagram {
  id: string;
  type: DiagramType;
  title: string;
  description?: string;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  style?: DiagramStyle;
}

/**
 * Node in a diagram
 */
export interface DiagramNode {
  id: string;
  label: string;
  type: 'component' | 'service' | 'database' | 'process' | 'decision' | 'risk' | 'state' | 'entity';
  description?: string;
  properties?: Record<string, string>;
  status?: 'normal' | 'warning' | 'critical';
  metadata?: unknown;
}

/**
 * Edge/relationship between nodes
 */
export interface DiagramEdge {
  id: string;
  source: string; // Node ID
  target: string; // Node ID
  label?: string;
  type: 'flow' | 'dependency' | 'data_flow' | 'causes' | 'relates_to' | 'supports' | 'contradicts';
  strength?: 'strong' | 'moderate' | 'weak';
  bidirectional?: boolean;
}

/**
 * Visual styling for diagram
 */
export interface DiagramStyle {
  layout?: 'hierarchical' | 'circular' | 'force' | 'linear';
  theme?: 'light' | 'dark';
  showLabels?: boolean;
  nodeSize?: 'small' | 'medium' | 'large';
}

/**
 * Architecture diagram - shows system components and data flow
 */
export interface ArchitectureDiagram extends Diagram {
  type: 'architecture';
  layers?: string[]; // e.g., 'client', 'api', 'service', 'database'
}

/**
 * Mechanism diagram - shows biological/scientific steps
 */
export interface MechanismDiagram extends Diagram {
  type: 'mechanism';
  steps: DiagramNode[]; // Ordered steps
  evidence: Map<string, 'demonstrated' | 'suggested' | 'possible'>;
}

/**
 * Risk matrix - shows risk vs impact
 */
export interface RiskMatrixDiagram extends Diagram {
  type: 'risk_matrix';
  quadrants: {
    high_probability_high_impact: string[];
    high_probability_low_impact: string[];
    low_probability_high_impact: string[];
    low_probability_low_impact: string[];
  };
}
