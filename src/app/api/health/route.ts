import { NextRequest, NextResponse } from 'next/server';
import { getGeminiProvider } from '@/lib/ai';

/**
 * GET /api/health
 * Check if the application and AI provider are healthy
 */
export async function GET(request: NextRequest) {
  const provider = getGeminiProvider();
  const debugMode = process.env.NEXT_PUBLIC_DEV_MODE === 'true';
  
  return NextResponse.json({
    status: 'ok',
    provider: {
      name: provider.name,
      configured: provider.isConfigured,
      models: debugMode ? provider.models : provider.models.map(m => ({ name: m.name, version: m.version })),
    },
    debug: debugMode,
  });
}
