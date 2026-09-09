/**
 * Utilities for validating user input
 */

import { ValidationResult } from '@/types/errors';

export function validateAnalysisInput(input: string): ValidationResult<string> {
  const trimmed = input.trim();
  
  if (!trimmed) {
    return {
      success: false,
      errors: [{
        field: 'input',
        message: 'Please provide something to analyze',
      }],
    };
  }
  
  if (trimmed.length > 50000) {
    return {
      success: false,
      errors: [{
        field: 'input',
        message: 'Input is too long (max 50,000 characters)',
      }],
    };
  }
  
  return {
    success: true,
    data: trimmed,
  };
}

export function validateLens(lens: string): ValidationResult<string> {
  const validLenses = ['automatic', 'explain', 'debug', 'research', 'architecture', 'risk', 'summarize'];
  
  if (!validLenses.includes(lens)) {
    return {
      success: false,
      errors: [{
        field: 'lens',
        message: `Invalid lens. Must be one of: ${validLenses.join(', ')}`,
      }],
    };
  }
  
  return {
    success: true,
    data: lens,
  };
}
