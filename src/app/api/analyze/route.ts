import { NextRequest, NextResponse } from 'next/server';
import { getGeminiProvider } from '@/lib/ai';
import { validateAnalysisInput, validateLens } from '@/lib/validation';
import { processPipeline } from '@/lib/parsing';
import { createAIRequest } from '@/lib/lens-engine';
import { AnalysisRequest } from '@/types/analysis';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/analyze
 * Submit an analysis request and get a complete response
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { input, lens } = body;
    
    // Validate input
    const inputValidation = validateAnalysisInput(input);
    if (!inputValidation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: inputValidation.errors },
        { status: 400 },
      );
    }
    
    // Validate lens
    const lensValidation = validateLens(lens);
    if (!lensValidation.success) {
      return NextResponse.json(
        { error: 'Invalid lens', details: lensValidation.errors },
        { status: 400 },
      );
    }
    
    // Get provider
    const provider = getGeminiProvider();
    if (!provider.isConfigured) {
      return NextResponse.json(
        { error: 'AI provider not configured' },
        { status: 503 },
      );
    }
    
    // Create analysis request
    const analysisRequest: AnalysisRequest = {
      id: uuidv4() as any,
      input: inputValidation.data!,
      lens: lensValidation.data! as any,
      createdAt: new Date(),
    };
    
    // Create AI request
    const aiRequest = createAIRequest({
      input: analysisRequest.input,
      lens: analysisRequest.lens,
    });
    
    // Get response from provider
    const aiResponse = await provider.request(aiRequest);
    
    // Process through parsing pipeline
    const debugMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
    const pipelineResult = processPipeline(aiResponse.content, analysisRequest, debugMode);
    
    return NextResponse.json(
      {
        success: pipelineResult.success,
        analysis: pipelineResult.analysis,
        debug: debugMode ? pipelineResult.debug : undefined,
      },
      { status: pipelineResult.success ? 200 : 207 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SOMA API] Analysis error:', message);
    
    return NextResponse.json(
      { error: 'Analysis failed', message },
      { status: 500 },
    );
  }
}
