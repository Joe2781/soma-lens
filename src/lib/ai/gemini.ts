/**
 * Production-grade Gemini provider
 * 
 * Features:
 * - Configurable model via GEMINI_MODEL env var
 * - Proper system prompt handling (not concatenated)
 * - Typed error handling with safe user messages
 * - Streaming with stable generation ID
 * - Proper finish reason mapping
 * - No API key exposure
 * - Timeout support
 * - Request/response validation
 */

import { GenerativeModel, GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { AIRequest, AIResponse, AIStreamChunk } from '@/types/ai';
import { BaseAIProvider } from './provider';
import { createProviderError, ProviderError } from './errors';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const REQUEST_TIMEOUT_MS = parseInt(process.env.GEMINI_TIMEOUT || '30000', 10);

/**
 * Map Gemini finish reasons to internal enum
 */
function mapFinishReason(geminiReason?: string): 'stop' | 'length' | 'error' {
  if (!geminiReason) return 'error';
  
  switch (geminiReason) {
    case 'STOP':
      return 'stop';
    case 'MAX_TOKENS':
      return 'length';
    case 'SAFETY':
    case 'OTHER':
    case 'RECITATION':
      return 'error';
    default:
      return 'error';
  }
}

export class GeminiProvider extends BaseAIProvider {
  name = 'gemini';
  isConfigured: boolean;
  
  models = [
    {
      provider: 'gemini' as const,
      name: MODEL_NAME,
      version: '1.5',
      maxTokens: 100000,
      costPer1kInputTokens: 0.075, // gemini-1.5-flash pricing
      costPer1kOutputTokens: 0.3,
    },
  ];
  
  private model: GenerativeModel | null = null;
  private client: GoogleGenerativeAI | null = null;
  private configError: ProviderError | null = null;
  
  constructor() {
    super();
    
    // Validate configuration
    if (!API_KEY) {
      this.isConfigured = false;
      this.configError = createProviderError(
        'MISSING_API_KEY',
        'GEMINI_API_KEY is not set',
        'AI provider is not configured. Please set up your API credentials.',
        false,
      );
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[SOMA] Gemini API key not configured. Analysis will not work.');
      }
      return;
    }
    
    try {
      this.client = new GoogleGenerativeAI(API_KEY);
      this.model = this.client.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: this.getSystemInstruction(),
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_UNSPECIFIED,
            threshold: HarmBlockThreshold.BLOCK_NONE,
          },
        ],
      });
      this.isConfigured = true;
    } catch (error) {
      this.isConfigured = false;
      this.configError = createProviderError(
        'INVALID_MODEL',
        `Failed to initialize Gemini with model '${MODEL_NAME}': ${error instanceof Error ? error.message : String(error)}`,
        'AI provider configuration failed. Please check your settings.',
        false,
        { modelName: MODEL_NAME, error: error instanceof Error ? error.message : String(error) },
      );
      if (process.env.NODE_ENV !== 'production') {
        console.error('[SOMA] Gemini configuration error:', this.configError);
      }
    }
  }
  
  /**
   * Get system instruction separate from user input
   */
  private getSystemInstruction(): string {
    return `You are Soma Lens, an AI technical-intelligence workspace.

Your job is to:
1. Understand complex technical material
2. Identify important relationships and dependencies
3. Distinguish evidence from inference
4. Surface uncertainty honestly
5. Challenge weak reasoning
6. Expose hidden assumptions
7. Suggest next steps for investigation

Always separate what is directly stated from what you infer.
Never present associations as causation.
Never invent studies, citations, or data.
Always note what remains unknown.

Respond ONLY with valid JSON. Your entire response must be parseable JSON with no additional text.`;
  }
  
  async request(req: AIRequest): Promise<AIResponse> {
    if (!this.isConfigured || !this.model) {
      throw this.configError || createProviderError(
        'PROVIDER_UNAVAILABLE',
        'Gemini provider not configured',
        'AI provider is not available',
        false,
      );
    }
    
    // Validate request
    if (!req.prompt || req.prompt.trim().length === 0) {
      throw createProviderError(
        'INVALID_REQUEST',
        'Empty prompt provided',
        'Request prompt is empty',
        false,
      );
    }
    
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      
      try {
        const generationConfig = {
          maxOutputTokens: Math.min(req.maxTokens || 8000, 100000),
          temperature: req.temperature ?? 0.7,
          topP: 0.95,
          topK: 40,
          stopSequences: req.stopSequences || [],
        };
        
        const response = await this.model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: req.prompt }],
            },
          ],
          generationConfig,
        });
        
        clearTimeout(timeoutHandle);
        
        // Validate response structure
        if (!response.response) {
          throw createProviderError(
            'INVALID_RESPONSE',
            'Gemini returned invalid response structure',
            'Received malformed response from AI provider',
            true,
          );
        }
        
        const result = response.response;
        const candidates = result.candidates || [];
        
        if (candidates.length === 0) {
          throw createProviderError(
            'INVALID_RESPONSE',
            'Gemini returned no candidates',
            'AI provider returned empty response',
            true,
          );
        }
        
        const candidate = candidates[0];
        const content = candidate.content?.parts?.[0]?.text || '';
        
        if (!content || content.trim().length === 0) {
          throw createProviderError(
            'INVALID_RESPONSE',
            'Gemini returned empty content',
            'AI provider returned empty analysis',
            true,
          );
        }
        
        const usage = result.usageMetadata;
        const finishReason = candidate.finishReason || 'OTHER';
        
        // Check for safety/filtering
        if (finishReason === 'SAFETY') {
          throw createProviderError(
            'INVALID_REQUEST',
            'Request was blocked by safety filters',
            'Your request could not be processed due to safety guidelines',
            false,
          );
        }
        
        return {
          id: `${req.id}-${Date.now()}`,
          requestId: req.id,
          model: MODEL_NAME,
          content,
          finishReason: mapFinishReason(finishReason),
          usage: {
            inputTokens: usage?.promptTokenCount || 0,
            outputTokens: usage?.candidatesTokenCount || 0,
            totalTokens: usage?.totalTokenCount || 0,
          },
          createdAt: new Date(),
        };
      } finally {
        clearTimeout(timeoutHandle);
      }
    } catch (error) {
      // If already a ProviderError, re-throw
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      // Handle specific error types
      const message = error instanceof Error ? error.message : String(error);
      
      if (message.includes('429') || message.includes('rate')) {
        throw createProviderError(
          'RATE_LIMIT_EXCEEDED',
          `Rate limited: ${message}`,
          'Too many requests. Please try again in a moment.',
          true,
          { originalError: message },
        );
      }
      
      if (message.includes('401') || message.includes('auth')) {
        throw createProviderError(
          'AUTHENTICATION_FAILED',
          `Authentication failed: ${message}`,
          'Authentication with AI provider failed.',
          false,
          { originalError: message },
        );
      }
      
      if (message.includes('quota')) {
        throw createProviderError(
          'QUOTA_EXCEEDED',
          `Quota exceeded: ${message}`,
          'API quota exceeded. Please try again later.',
          true,
          { originalError: message },
        );
      }
      
      if (message.includes('timeout') || message.includes('abort')) {
        throw createProviderError(
          'REQUEST_TIMEOUT',
          `Request timed out after ${REQUEST_TIMEOUT_MS}ms`,
          'Request took too long. Please try again.',
          true,
        );
      }
      
      throw createProviderError(
        'UNKNOWN_ERROR',
        `Gemini error: ${message}`,
        'An unexpected error occurred with the AI provider.',
        true,
        { originalError: message },
      );
    }
  }
  
  async *stream(req: AIRequest): AsyncIterable<AIStreamChunk> {
    if (!this.isConfigured || !this.model) {
      throw this.configError || createProviderError(
        'PROVIDER_UNAVAILABLE',
        'Gemini provider not configured',
        'AI provider is not available',
        false,
      );
    }
    
    if (!req.prompt || req.prompt.trim().length === 0) {
      throw createProviderError(
        'INVALID_REQUEST',
        'Empty prompt provided',
        'Request prompt is empty',
        false,
      );
    }
    
    const streamId = `stream-${req.id}-${Date.now()}`;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let buffer = '';
    let hasError = false;
    
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    
    try {
      const generationConfig = {
        maxOutputTokens: Math.min(req.maxTokens || 8000, 100000),
        temperature: req.temperature ?? 0.7,
        topP: 0.95,
        topK: 40,
        stopSequences: req.stopSequences || [],
      };
      
      const response = await this.model.generateContentStream({
        contents: [
          {
            role: 'user',
            parts: [{ text: req.prompt }],
          },
        ],
        generationConfig,
      });
      
      for await (const chunk of response.stream) {
        // Check for abort
        if (controller.signal.aborted) {
          throw createProviderError(
            'STREAM_ERROR',
            'Stream was interrupted',
            'Stream was interrupted. Please try again.',
            true,
          );
        }
        
        if (!chunk) continue;
        
        const candidates = chunk.candidates || [];
        if (candidates.length === 0) continue;
        
        const candidate = candidates[0];
        const part = candidate.content?.parts?.[0];
        const content = 'text' in part ? (part.text || '') : '';
        
        if (content) {
          buffer += content;
        }
        
        // Accumulate usage
        const usage = chunk.usageMetadata;
        if (usage) {
          totalInputTokens = usage.promptTokenCount || 0;
          totalOutputTokens = usage.candidatesTokenCount || 0;
        }
        
        const isDone = !!candidate.finishReason;
        
        yield {
          id: streamId,
          requestId: req.id,
          model: MODEL_NAME,
          content,
          isDone,
          usage: isDone ? {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
          } : undefined,
        };
      }
      
      clearTimeout(timeoutHandle);
      
      // Ensure we got something
      if (!buffer || buffer.trim().length === 0) {
        throw createProviderError(
          'INVALID_RESPONSE',
          'Stream returned empty content',
          'AI provider returned empty analysis',
          true,
        );
      }
    } catch (error) {
      clearTimeout(timeoutHandle);
      hasError = true;
      
      if (error instanceof Error && 'code' in error) {
        throw error;
      }
      
      const message = error instanceof Error ? error.message : String(error);
      
      if (message.includes('abort')) {
        throw createProviderError(
          'REQUEST_TIMEOUT',
          `Stream timed out after ${REQUEST_TIMEOUT_MS}ms`,
          'Stream took too long. Please try again.',
          true,
        );
      }
      
      throw createProviderError(
        'STREAM_ERROR',
        `Stream error: ${message}`,
        'An error occurred while streaming. Please try again.',
        true,
        { originalError: message },
      );
    }
  }
}

// Singleton instance (lazy-initialized on first use)
let instance: GeminiProvider | null = null;

export function getGeminiProvider(): GeminiProvider {
  if (!instance) {
    instance = new GeminiProvider();
  }
  return instance;
}
