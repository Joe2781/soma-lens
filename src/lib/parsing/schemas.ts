/**
 * Schemas for AI response validation
 * Uses Zod for runtime type checking
 */

import { z } from 'zod';
import { EvidenceType } from '@/types/evidence';
import { Lens } from '@/types/lens';

// Evidence schema
const EvidenceSchema = z.object({
  id: z.string(),
  type: z.enum([
    'directly_stated',
    'source_claim',
    'supported_interpretation',
    'association',
    'possible_contributor',
    'compensatory_response',
    'inference',
    'unknown',
    'recommendation',
  ] as const),
  content: z.string(),
  severity: z.enum(['critical', 'high', 'medium', 'low', 'info']).optional(),
  justification: z.string().optional(),
  source: z.string().optional(),
  relatedConcepts: z.array(z.string()).optional(),
});

// Reading schema
const ReadingSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string().optional(),
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    type: z.enum(['narrative', 'evidence', 'mechanism', 'challenge', 'comparison', 'risk', 'opportunity']),
    content: z.string(),
  })),
  whatIsEstablished: z.array(z.string()),
  whatIsNotEstablished: z.array(z.string()),
  coreInsight: z.string().optional(),
});

// Analysis response schema
const SomaAnalysisResponseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  reading: ReadingSchema,
  observed: z.array(EvidenceSchema),
  interpretation: z.array(EvidenceSchema),
  inferred: z.array(EvidenceSchema),
  unknown: z.array(EvidenceSchema),
  recommendations: z.array(EvidenceSchema).optional().default([]),
  relationships: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    type: z.enum(['depends_on', 'causes', 'relates_to', 'supports', 'contradicts', 'examples']),
    strength: z.enum(['strong', 'moderate', 'weak']),
    description: z.string().optional(),
  })).optional().default([]),
});

export type SomaAnalysisResponse = z.infer<typeof SomaAnalysisResponseSchema>;
export { SomaAnalysisResponseSchema, EvidenceSchema, ReadingSchema };
