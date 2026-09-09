/**
 * Typed errors for AI provider operations
 * Never expose API keys or sensitive details to the client
 */

export type ProviderErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_MODEL'
  | 'AUTHENTICATION_FAILED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'QUOTA_EXCEEDED'
  | 'PROVIDER_UNAVAILABLE'
  | 'REQUEST_TIMEOUT'
  | 'INVALID_RESPONSE'
  | 'STREAM_ERROR'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_ERROR';

export interface ProviderError extends Error {
  code: ProviderErrorCode;
  message: string;
  userMessage: string; // Safe message for frontend
  retryable: boolean;
  details?: Record<string, unknown>; // For debug mode only
}

export function createProviderError(
  code: ProviderErrorCode,
  message: string,
  userMessage: string,
  retryable: boolean,
  details?: Record<string, unknown>,
): ProviderError {
  const error = new Error(message) as ProviderError;
  error.code = code;
  error.message = message;
  error.userMessage = userMessage;
  error.retryable = retryable;
  if (details) {
    error.details = details;
  }
  return error;
}

/**
 * Check if error is a provider error
 */
export function isProviderError(error: unknown): error is ProviderError {
  return error instanceof Error && 'code' in error && 'userMessage' in error;
}
