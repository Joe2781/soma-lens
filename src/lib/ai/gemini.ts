import { GenerativeModel, GoogleGenerativeAI } from '@google/generative-ai';
import { AIRequest, AIResponse, AIStreamChunk } from '@/types/ai';
import { BaseAIProvider } from './provider';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error('GEMINI_API_KEY is not set in environment variables');
}

const client = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export class GeminiProvider extends BaseAIProvider {
  name = 'gemini';
  
  models = [
    {
      provider: 'gemini' as const,
      name: 'gemini-1.5-pro',
      version: '1.5',
      maxTokens: 100000,
      costPer1kInputTokens: 0.005,
      costPer1kOutputTokens: 0.015,
    },
  ];
  
  private model: GenerativeModel | null = null;
  
  constructor() {
    super();
    if (client) {
      this.model = client.getGenerativeModel({ model: 'gemini-1.5-pro' });
    }
  }
  
  async request(req: AIRequest): Promise<AIResponse> {
    if (!this.model) {
      throw new Error('Gemini API not configured');
    }
    
    try {
      const generationConfig = {
        maxOutputTokens: req.maxTokens || 8000,
        temperature: req.temperature ?? 0.7,
        stopSequences: req.stopSequences || [],
      };
      
      const systemPrompt = req.systemPrompt || '';
      
      const response = await this.model.generateContent({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: systemPrompt ? `${systemPrompt}\n\n${req.prompt}` : req.prompt,
              },
            ],
          },
        ],
        generationConfig,
      });
      
      const result = response.result;
      const content = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const usage = result.usageMetadata;
      
      return {
        id: `gemini-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        requestId: req.id,
        model: req.model,
        content,
        finishReason: 'stop',
        usage: {
          inputTokens: usage?.promptTokenCount || 0,
          outputTokens: usage?.candidatesTokenCount || 0,
          totalTokens: usage?.totalTokenCount || 0,
        },
        createdAt: new Date(),
      };
    } catch (error) {
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  async *stream(req: AIRequest): AsyncIterable<AIStreamChunk> {
    if (!this.model) {
      throw new Error('Gemini API not configured');
    }
    
    try {
      const generationConfig = {
        maxOutputTokens: req.maxTokens || 8000,
        temperature: req.temperature ?? 0.7,
        stopSequences: req.stopSequences || [],
      };
      
      const systemPrompt = req.systemPrompt || '';
      
      const response = await this.model.generateContentStream({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: systemPrompt ? `${systemPrompt}\n\n${req.prompt}` : req.prompt,
              },
            ],
          },
        ],
        generationConfig,
      });
      
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let isDone = false;
      
      for await (const chunk of response.stream) {
        const content = chunk.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const usage = chunk.usageMetadata;
        
        if (usage) {
          totalInputTokens = usage.promptTokenCount || 0;
          totalOutputTokens = usage.candidatesTokenCount || 0;
        }
        
        if (chunk.candidates?.[0]?.finishReason) {
          isDone = true;
        }
        
        yield {
          id: `gemini-chunk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          requestId: req.id,
          model: req.model,
          content,
          isDone,
          usage: isDone ? {
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            totalTokens: totalInputTokens + totalOutputTokens,
          } : undefined,
        };
      }
    } catch (error) {
      throw new Error(`Gemini stream error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export const geminiProvider = new GeminiProvider();
