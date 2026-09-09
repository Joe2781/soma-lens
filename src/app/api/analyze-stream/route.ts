import { NextRequest, NextResponse } from 'next/server';
import { getGeminiProvider } from '@/lib/ai';
import { validateAnalysisInput, validateLens } from '@/lib/validation';
import { StreamingAnalysisProcessor, processPipeline } from '@/lib/parsing';
import { createAIRequest } from '@/lib/lens-engine';
import { AnalysisRequest } from '@/types/analysis';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/analyze-stream
 * Stream analysis response as it's generated
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
    
    // Return streaming response
    return new NextResponse(
      new ReadableStream({
        async start(controller) {
          try {
            const processor = new StreamingAnalysisProcessor();
            const debugMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
            
            // Send status: analyzing
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({ type: 'status', status: 'analyzing' }) + '\n',
              ),
            );
            
            // Stream from provider
            for await (const chunk of provider.stream(aiRequest)) {
              processor.addChunk(chunk.content);
              
              // Send chunk
              controller.enqueue(
                new TextEncoder().encode(
                  JSON.stringify({
                    type: 'chunk',
                    content: chunk.content,
                    isDone: chunk.isDone,
                  }) + '\n',
                ),
              );
              
              if (chunk.isDone) {
                processor.markDone();
              }
            }
            
            // Process complete response
            const pipelineResult = processPipeline(
              processor.getPartialBuffer(),
              analysisRequest,
              debugMode,
            );
            
            // Send final result
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  type: 'complete',
                  success: pipelineResult.success,
                  analysis: pipelineResult.analysis,
                  debug: debugMode ? pipelineResult.debug : undefined,
                }) + '\n',
              ),
            );
            
            controller.close();
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({ type: 'error', message }) + '\n',
              ),
            );
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Transfer-Encoding': 'chunked',
          'Cache-Control': 'no-cache',
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[SOMA API] Stream error:', message);
    
    return NextResponse.json(
      { error: 'Stream failed', message },
      { status: 500 },
    );
  }
}
