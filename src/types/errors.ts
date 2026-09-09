/**
 * Error codes for different failure modes
 */
export type ErrorCode = 
  | 'INVALID_INPUT'
  | 'INVALID_LENS'
  | 'PARSE_ERROR'
  | 'VALIDATION_ERROR'
  | 'AI_ERROR'
  | 'RATE_LIMIT'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Application error
 */
export interface AppError extends Error {
  code: ErrorCode;
  message: string;
  details?: unknown;
  recoverable: boolean;
  timestamp: Date;
}

/**
 * Validation result
 */
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationErrorDetail[];
}

export interface ValidationErrorDetail {
  field: string;
  message: string;
  value?: unknown;
}
