/**
 * Provider-agnostic interface for AI models
 * Allows swapping Gemini with future Soma Intelligence or other providers
 */

import { AIRequest, AIResponse, AIStreamChunk, ModelInfo } from '@/types/ai';

export interface AIProvider {
  name: string;
  models: ModelInfo[];
  
  /**
   * Send a single request and wait for complete response
   */
  request(req: AIRequest): Promise<AIResponse>;
  
  /**
   * Send a request and stream the response
   * Yields chunks as they arrive
   */
  stream(req: AIRequest): AsyncIterable<AIStreamChunk>;
  
  /**
   * Get cost estimate before making request
   */
  estimateCost(tokens: number): number;
}

export abstract class BaseAIProvider implements AIProvider {
  abstract name: string;
  abstract models: ModelInfo[];
  
  abstract request(req: AIRequest): Promise<AIResponse>;
  abstract stream(req: AIRequest): AsyncIterable<AIStreamChunk>;
  
  estimateCost(tokens: number): number {
    const model = this.models[0];
    return (tokens * model.costPer1kInputTokens) / 1000;
  }
}
