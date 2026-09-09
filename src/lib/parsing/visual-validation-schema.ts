/**
 * Update parsing schemas to include safety validation for visuals
 */

import { z } from 'zod';
import { VisualSchema } from '@/types/visual';

/**
 * Safe visual schema that validates image URLs
 */
const SafeImageReferenceSchema = z.object({
  type: z.enum(['ai_generated', 'reference', 'user_uploaded', 'screenshot']),
  url: z.string().url().max(2048),
  altText: z.string().min(1).max(500),
  caption: z.string().max(500).optional(),
  source: z.string().max(500).optional(),
  attribution: z.string().max(500).optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

/**
 * Safe visual schema with image validation
 */
export const SafeVisualSchema = VisualSchema.extend({
  image: SafeImageReferenceSchema.optional(),
}).refine(
  (visual) => {
    // If format is image, must have image field
    if (visual.format === 'image') {
      return visual.image !== undefined;
    }
    // If format is diagram, must have diagram field
    if (visual.format === 'diagram') {
      return visual.diagram !== undefined;
    }
    return false;
  },
  { message: 'Visual format and content mismatch' },
);

export type SafeVisual = z.infer<typeof SafeVisualSchema>;
