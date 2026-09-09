/**
 * Complete pipeline for handling AI responses
 * From raw response → parsed → validated → normalized → ready for UI
 */

import { SomaAnalysis, AnalysisRequest } from '@/types/analysis';
import { ValidatedAIResponse } from '@/types/ai';
import { fullParseAndValidate } from './json';
import { SomaAnalysisResponseSchema, type SomaAnalysisResponse } from './schemas';
import { normalizeAnalysis, createFallbackAnalysis } from './normalize';

export interface ParsePipelineResult {
  success: boolean;
  analysis: SomaAnalysis;
  validatedResponse?: ValidatedAIResponse;
  debug?: {
    parseErrors?: Array<{ message: string; attempt?: number }>;
    validationErrors?: Array<{ field: string; message: string }>;
  };
}

/**
 * Main pipeline: Process raw AI response into structured analysis
 */
export function processPipeline(
  rawResponse: string,
  request: AnalysisRequest,
  debug: boolean = false,
): ParsePipelineResult {
  // Step 1: Parse and validate
  const validated = fullParseAndValidate(rawResponse, SomaAnalysisResponseSchema);
  
  if (debug) {
    console.log('[SOMA DEBUG] Validation result:', {
      success: validated.success,
      parseErrors: validated.parseErrors?.length || 0,
      validationErrors: validated.validationErrors?.length || 0,
    });
  }
  
  // Step 2: Normalize to internal format
  let analysis: SomaAnalysis;
  
  if (validated.success && validated.data) {
    // Success path: use parsed data
    analysis = normalizeAnalysis(validated.data as SomaAnalysisResponse, request);
  } else {
    // Error path: create fallback with error details
    const error = new Error(
      validated.validationErrors?.[0]?.message ||
      validated.parseErrors?.[0]?.message ||
      'Unknown parsing error'
    );
    analysis = createFallbackAnalysis(request, rawResponse, error);
  }
  
  return {
    success: validated.success,
    analysis,
    validatedResponse: debug ? validated : undefined,
    debug: debug ? {
      parseErrors: validated.parseErrors?.map(e => ({
        message: e.message,
        attempt: e.attempt,
      })),
      validationErrors: validated.validationErrors?.map(e => ({
        field: e.field,
        message: e.message,
      })),
    } : undefined,
  };
}

/**
 * Handle streaming responses
 * Accumulate chunks and parse complete result when done
 */
export class StreamingAnalysisProcessor {
  private buffer = '';
  private isDone = false;
  
  addChunk(chunk: string): void {
    this.buffer += chunk;
  }
  
  markDone(): void {
    this.isDone = true;
  }
  
  process(request: AnalysisRequest, debug?: boolean): ParsePipelineResult {
    if (!this.isDone) {
      throw new Error('Stream not yet complete');
    }
    return processPipeline(this.buffer, request, debug);
  }
  
  getPartialBuffer(): string {
    return this.buffer;
  }
}
