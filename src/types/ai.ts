/**
 * AI provider type
 */
export type AIProvider = 'gemini' | 'future_external' | 'soma_intelligence';

/**
 * Model information
 */
export interface ModelInfo {
  provider: AIProvider;
  name: string;
  version: string;
  maxTokens: number;
  costPer1kInputTokens: number;
  costPer1kOutputTokens: number;
}

/**
 * Request to AI provider
 */
export interface AIRequest {
  id: string;
  prompt: string;
  systemPrompt?: string;
  model: string;
  maxTokens?: number;
  temperature?: number;
  stopSequences?: string[];
  createdAt: Date;
}

/**
 * Response from AI provider
 */
export interface AIResponse {
  id: string;
  requestId: string;
  model: string;
  content: string;
  finishReason: 'stop' | 'length' | 'error';
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  createdAt: Date;
}

/**
 * Streaming chunk from AI provider
 */
export interface AIStreamChunk {
  id: string;
  requestId: string;
  model: string;
  content: string;
  isDone: boolean;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

/**
 * Parsed and validated AI response
 */
export interface ValidatedAIResponse {
  success: boolean;
  data?: unknown;
  rawContent: string;
  parseErrors?: ParseError[];
  validationErrors?: ValidationError[];
}

export interface ParseError {
  message: string;
  location?: string;
  attempt?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  expected?: string;
  received?: string;
}

/**
 * Raw model output for debug mode
 */
export interface DebugModelOutput {
  request: AIRequest;
  response: AIResponse;
  parsed: ValidatedAIResponse;
  latency: number;
}
