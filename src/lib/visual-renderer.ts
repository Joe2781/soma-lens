/**
 * Deterministic visual renderer
 * Converts structured diagram data to renderable format
 */

import { StructuredDiagram, VisualNode, VisualEdge } from '@/types/visual';

/**
 * Mermaid diagram configuration
 * Deterministic, text-based, renders without external services
 */
export interface MermaidConfig {
  theme: 'default' | 'dark' | 'forest' | 'neutral';
  flowchart: {
    useMaxWidth: boolean;
    htmlLabels: boolean;
    curve: 'linear' | 'natural' | 'basis';
  };
}

/**
 * Convert structured diagram to Mermaid syntax
 * Mermaid is:
 * - Deterministic (same input always produces same output)
 * - Text-based (easy to debug)
 * - Client-side rendering (no external service calls)
 * - Works offline
 * - Accessible (renders as SVG with proper text)
 */
export function diagramToMermaid(diagram: StructuredDiagram): string {
  const lines: string[] = [];
  
  // Determine graph type based on layout
  let graphType = 'flowchart TD';
  
  if (diagram.layout === 'circular') {
    graphType = 'graph TB';
  } else if (diagram.layout === 'linear' || diagram.layout === 'force-directed') {
    graphType = 'flowchart LR';
  }
  
  lines.push(graphType);
  
  // Add node definitions with shapes and labels
  diagram.nodes.forEach((node) => {
    lines.push(generateNodeDefinition(node));
  });
  
  // Add edge definitions
  diagram.edges.forEach((edge) => {
    lines.push(generateEdgeDefinition(edge));
  });
  
  // Add styling based on node status
  diagram.nodes.forEach((node) => {
    if (node.status && node.status !== 'normal') {
      lines.push(generateNodeStyle(node));
    }
  });
  
  return lines.join('\n');
}

/**
 * Generate Mermaid node definition
 */
function generateNodeDefinition(node: VisualNode): string {
  const nodeId = escapeId(node.id);
  const label = escapeLabel(node.label);
  
  // Choose shape based on node type
  let shape = '';
  
  switch (node.shape) {
    case 'circle':
      shape = `(( ${label} ))`;
      break;
    case 'diamond':
      shape = `{ ${label} }`;
      break;
    case 'cylinder':
      shape = `[( ${label} )]`;
      break;
    case 'parallelogram':
      shape = `[/ ${label} /]`;
      break;
    case 'box':
    default:
      shape = `[ ${label} ]`;
  }
  
  return `  ${nodeId}${shape}`;
}

/**
 * Generate Mermaid edge definition
 */
function generateEdgeDefinition(edge: VisualEdge): string {
  const source = escapeId(edge.source);
  const target = escapeId(edge.target);
  const label = edge.label ? `|${escapeLabel(edge.label)}|` : '';
  
  // Arrow style based on type and bidirectionality
  let arrow = '-->';
  
  if (edge.bidirectional) {
    arrow = '<-->';
  } else if (edge.style === 'dashed') {
    arrow = '-..->';
  } else if (edge.style === 'dotted') {
    arrow = '=====>';
  }
  
  return `  ${source} ${arrow} ${label} ${target}`;
}

/**
 * Generate Mermaid style definition for nodes
 */
function generateNodeStyle(node: VisualNode): string {
  const nodeId = escapeId(node.id);
  
  if (node.status === 'critical') {
    return `  style ${nodeId} fill:#ff6b6b,stroke:#c92a2a,color:#fff`;
  } else if (node.status === 'warning') {
    return `  style ${nodeId} fill:#ffd43b,stroke:#f08c00,color:#000`;
  } else if (node.status === 'success') {
    return `  style ${nodeId} fill:#51cf66,stroke:#2f9e44,color:#fff`;
  }
  
  return '';
}

/**
 * Escape ID for Mermaid (alphanumeric + underscore only)
 */
function escapeId(id: string): string {
  return id
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .substring(0, 64); // Mermaid ID length limit
}

/**
 * Escape label for Mermaid (prevent injection)
 */
function escapeLabel(label: string): string {
  return label
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ')
    .substring(0, 200); // Reasonable label length
}

/**
 * Calculate estimated diagram size based on node/edge count
 */
export function estimateDiagramSize(
  diagram: StructuredDiagram,
): { minWidth: number; minHeight: number } {
  const nodeCount = diagram.nodes.length;
  const layout = diagram.layout || 'hierarchical';
  
  const baseNodeSize = 120;
  const basePadding = 50;
  
  if (layout === 'hierarchical') {
    const levels = Math.ceil(Math.sqrt(nodeCount));
    return {
      minWidth: Math.max(400, nodeCount * baseNodeSize * 0.6),
      minHeight: Math.max(300, levels * 150),
    };
  }
  
  if (layout === 'circular') {
    const radius = Math.max(150, nodeCount * 40);
    return {
      minWidth: radius * 2 + basePadding * 2,
      minHeight: radius * 2 + basePadding * 2,
    };
  }
  
  if (layout === 'linear') {
    return {
      minWidth: Math.max(600, nodeCount * baseNodeSize),
      minHeight: 250,
    };
  }
  
  return {
    minWidth: 600,
    minHeight: 400,
  };
}
