/**
 * Image provider abstraction layer
 * Allows pluggable image generation and retrieval
 * Strict controls to prevent arbitrary URL rendering
 */

import { ImageReference } from '@/types/visual';

/**
 * Image source provider interface
 */
export interface ImageProvider {
  name: string;
  generateImage(prompt: string, options?: GenerationOptions): Promise<ImageReference>;
  retrieveImage(source: string, options?: RetrievalOptions): Promise<ImageReference | null>;
  validateImageUrl(url: string): boolean;
}

export interface GenerationOptions {
  width?: number;
  height?: number;
  style?: string;
}

export interface RetrievalOptions {
  maxSize?: number;
  timeout?: number;
}

/**
 * Whitelist of trusted external image sources
 * Only these domains can be used for reference images
 */
const TRUSTED_DOMAINS = new Set([
  'commons.wikimedia.org',
  'upload.wikimedia.org',
  'en.wikipedia.org',
  'github.com', // For architecture diagrams, code screenshots
  // Add more trusted scientific/technical image sources as needed
]);

/**
 * Validate an image URL against security constraints
 */
export function validateImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    
    // Only allow HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }
    
    // Check against trusted domains
    const hostname = parsed.hostname || '';
    const isWhitelisted = Array.from(TRUSTED_DOMAINS).some(
      (domain) => hostname === domain || hostname.endsWith('.' + domain),
    );
    
    if (!isWhitelisted) {
      return false;
    }
    
    // Ensure URL is reasonably short (prevent extremely long URLs)
    if (url.length > 2048) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Sanitize image reference to prevent injection
 */
export function sanitizeImageReference(image: Partial<ImageReference>): ImageReference | null {
  if (!image.url || !image.altText) {
    return null;
  }
  
  // Validate URL based on type
  if (image.type === 'reference' || image.type === 'screenshot') {
    if (!validateImageUrl(image.url)) {
      console.warn('[SOMA] Invalid image URL rejected:', image.url);
      return null;
    }
  }
  
  // If it's user-uploaded or AI-generated, we handle it differently
  // (These should come from our own secure storage)
  if (image.type === 'user_uploaded' || image.type === 'ai_generated') {
    // Validate it's from our own domain or storage service
    if (!image.url.includes(process.env.NEXT_PUBLIC_APP_URL || 'localhost')) {
      console.warn('[SOMA] Non-local image URL rejected:', image.url);
      return null;
    }
  }
  
  // Sanitize text fields to prevent XSS
  const sanitizedAlt = sanitizeText(image.altText);
  const sanitizedCaption = image.caption ? sanitizeText(image.caption) : undefined;
  const sanitizedAttribution = image.attribution ? sanitizeText(image.attribution) : undefined;
  const sanitizedSource = image.source ? sanitizeText(image.source) : undefined;
  
  return {
    type: image.type || 'reference',
    url: image.url,
    altText: sanitizedAlt,
    caption: sanitizedCaption,
    source: sanitizedSource,
    attribution: sanitizedAttribution,
    width: image.width,
    height: image.height,
  };
}

/**
 * Sanitize text to prevent XSS
 */
function sanitizeText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .slice(0, 500); // Max 500 chars
}

/**
 * Extract image generation request from LLM output
 * Model should NOT provide URLs directly
 * Only provide imagePrompt for our image service to handle
 */
export interface ImageGenerationRequest {
  type: 'diagram_illustration' | 'concept_visualization' | 'technical_figure';
  prompt: string;
  description: string;
  style?: 'wireframe' | 'schematic' | 'photorealistic' | 'illustrated';
  width?: number;
  height?: number;
}

/**
 * Validate image generation request
 */
export function validateImageGenerationRequest(req: unknown): req is ImageGenerationRequest {
  if (typeof req !== 'object' || req === null) return false;
  
  const r = req as any;
  return (
    typeof r.type === 'string' &&
    typeof r.prompt === 'string' &&
    typeof r.description === 'string' &&
    r.prompt.length > 0 &&
    r.prompt.length < 1000 &&
    r.description.length > 0 &&
    r.description.length < 1000
  );
}

/**
 * Future: Placeholder for actual image generation service
 * This would call an image generation API (DALL-E, Midjourney, etc.)
 * For now, returns null to indicate no image was generated
 */
export async function generateImage(
  request: ImageGenerationRequest,
): Promise<ImageReference | null> {
  // TODO: Implement actual image generation when service is available
  // For MVP, we don't generate images - only use structured diagrams
  console.log('[SOMA] Image generation requested but not yet implemented:', request);
  return null;
}
