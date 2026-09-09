/**
 * Normalization: Convert various AI response formats into consistent internal schema
 */

import { SomaAnalysis, AnalysisRequest, AnalysisId } from '@/types/analysis';
import { SomaAnalysisResponse } from './schemas';
import { v4 as uuidv4 } from 'uuid';

/**
 * Normalize a parsed AI response into our internal SomaAnalysis format
 */
export function normalizeAnalysis(
  response: SomaAnalysisResponse,
  request: AnalysisRequest,
): SomaAnalysis {
  const id: AnalysisId = (request.id || uuidv4()) as AnalysisId;
  
  return {
    id,
    request,
    lens: request.lens,
    status: 'complete',
    title: response.title,
    summary: response.summary,
    reading: response.reading,
    observed: response.observed,
    interpretation: response.interpretation,
    inferred: response.inferred,
    unknown: response.unknown,
    recommendations: response.recommendations || [],
    relationships: response.relationships || [],
    diagrams: [],
    followUpQuestions: [
      'Explain simpler',
      'Go deeper',
      'Show an example',
      'Challenge this',
      'Find weaknesses',
      'Compare alternatives',
    ],
    followUps: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
  };
}

/**
 * Create a fallback analysis when parsing/validation fails
 * This preserves the raw response and error information
 */
export function createFallbackAnalysis(
  request: AnalysisRequest,
  rawResponse: string,
  error: Error,
): SomaAnalysis {
  const id: AnalysisId = (request.id || uuidv4()) as AnalysisId;
  
  return {
    id,
    request,
    lens: request.lens,
    status: 'error',
    title: 'Analysis Error',
    summary: `The analysis could not be completed: ${error.message}`,
    reading: {
      id: uuidv4(),
      title: 'Error Details',
      sections: [
        {
          id: uuidv4(),
          title: 'Error',
          type: 'narrative',
          content: error.message,
        },
      ],
      whatIsEstablished: [],
      whatIsNotEstablished: [],
    },
    observed: [],
    interpretation: [],
    inferred: [],
    unknown: [],
    recommendations: [],
    relationships: [],
    diagrams: [],
    followUpQuestions: [],
    followUps: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    error: {
      code: 'PARSE_ERROR',
      message: error.message,
      details: { rawResponse },
      recoverable: true,
    },
  };
}
