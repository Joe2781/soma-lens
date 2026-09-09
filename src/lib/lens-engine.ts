/**
 * Lens analysis engine
 * Routes input through appropriate analytical lens
 */

import { Lens } from '@/types/lens';
import { AIRequest } from '@/types/ai';
import { LENS_PROMPTS, SYSTEM_PROMPT } from '@/lib/prompts';
import { v4 as uuidv4 } from 'uuid';

export interface LensEngineRequest {
  input: string;
  lens: Lens;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
}

export function createAIRequest(lensRequest: LensEngineRequest): AIRequest {
  const lensPrompt = LENS_PROMPTS[lensRequest.lens];
  
  const prompt = `${lensPrompt}\n\nUSER INPUT:\n\n${lensRequest.input}`;
  
  return {
    id: uuidv4(),
    prompt,
    systemPrompt: lensRequest.systemPrompt || SYSTEM_PROMPT,
    model: process.env.GEMINI_MODEL || 'gemini-1.5-flash',
    maxTokens: lensRequest.maxTokens || 8000,
    temperature: lensRequest.temperature ?? 0.7,
  };
}
