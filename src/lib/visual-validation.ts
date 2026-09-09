/**
 * Visual validation and security hardening
 */

import { Visual, VisualSchema } from '@/types/visual';
import { validateDiagramReferences } from './visual-render';
import { sanitizeImageReference, validateImageGenerationRequest } from './image-provider';
import { z } from 'zod';

export interface VisualValidationError {
  visual: string; // Visual ID
  errors: string[];
}

/**
 * Validate a visual object before rendering
 * Returns validation errors or null if valid
 */
export function validateVisual(visual: unknown): VisualValidationError | null {
  const errors: string[] = [];
  
  // Step 1: Zod schema validation
  try {
    VisualSchema.parse(visual);
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((e) => {
        errors.push(`${e.path.join('.')}: ${e.message}`);
      });
    } else {
      errors.push('Unknown validation error');
    }
    return { visual: (visual as any)?.id || 'unknown', errors };
  }
  
  const v = visual as Visual;
  
  // Step 2: Format-specific validation
  if (v.format === 'diagram') {
    if (!v.diagram) {
      errors.push('format="diagram" requires diagram field');
    } else {
      // Validate diagram structure
      if (!Array.isArray(v.diagram.nodes) || v.diagram.nodes.length === 0) {
        errors.push('diagram must have at least one node');
      }
      
      if (!Array.isArray(v.diagram.edges)) {
        errors.push('diagram.edges must be an array');
      }
      
      // Check for unique node IDs
      const nodeIds = new Set<string>();
      v.diagram.nodes.forEach((node) => {
        if (nodeIds.has(node.id)) {
          errors.push(`Duplicate node ID: "${node.id}"`);
        }
        nodeIds.add(node.id);
      });
      
      // Check for unique edge IDs
      const edgeIds = new Set<string>();
      v.diagram.edges.forEach((edge) => {
        if (edgeIds.has(edge.id)) {
          errors.push(`Duplicate edge ID: "${edge.id}"`);
        }
        edgeIds.add(edge.id);
      });
      
      // Validate edge references
      const refErrors = validateDiagramReferences(v.diagram);
      errors.push(...refErrors);
    }
  } else if (v.format === 'image') {
    if (!v.image) {
      errors.push('format="image" requires image field');
    } else {
      // Sanitize and validate image reference
      const sanitized = sanitizeImageReference(v.image);
      if (!sanitized) {
        errors.push('Invalid or unsafe image reference');
      }
    }
  } else {
    errors.push(`Unknown format: "${v.format}"`);
  }
  
  // Step 3: Validate evidence basis
  if (!Array.isArray(v.evidenceBasis) || v.evidenceBasis.length === 0) {
    errors.push('evidenceBasis must be a non-empty array');
  }
  
  // Step 4: Validate confidence
  if (!['high', 'medium', 'low'].includes(v.confidence)) {
    errors.push(`Invalid confidence: "${v.confidence}"`);
  }
  
  return errors.length > 0 ? { visual: v.id, errors } : null;
}

/**
 * Validate an array of visuals
 */
export function validateVisuals(visuals: unknown[]): VisualValidationError[] {
  const errors: VisualValidationError[] = [];
  
  visuals.forEach((visual) => {
    const error = validateVisual(visual);
    if (error) {
      errors.push(error);
    }
  });
  
  return errors;
}

/**
 * Sanitize visuals array - remove invalid ones and sanitize valid ones
 */
export function sanitizeVisuals(visuals: unknown[]): Visual[] {
  const sanitized: Visual[] = [];
  
  visuals.forEach((visual) => {
    const error = validateVisual(visual);
    if (error) {
      console.warn(`[SOMA] Skipping invalid visual ${error.visual}:`, error.errors);
      return;
    }
    
    const v = visual as Visual;
    
    // If it has an image reference, sanitize it
    if (v.format === 'image' && v.image) {
      const sanitized_image = sanitizeImageReference(v.image);
      if (!sanitized_image) {
        console.warn(`[SOMA] Skipping visual with unsafe image: ${v.id}`);
        return;
      }
      v.image = sanitized_image;
    }
    
    sanitized.push(v);
  });
  
  return sanitized;
}
