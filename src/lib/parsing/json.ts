/**
 * Core parsing and normalization for AI responses
 * Handles imperfect, streamed, or malformed responses from any provider
 */

import { z } from 'zod';
import { ValidatedAIResponse, ParseError, ValidationError } from '@/types/ai';

/**
 * Extract JSON from text that may contain markdown fences or extra text
 */
export function extractJSON(text: string): string | null {
  // Try 1: Look for markdown code fence
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (markdownMatch) {
    return markdownMatch[1].trim();
  }
  
  // Try 2: Look for raw JSON object/array
  const trimmed = text.trim();
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return trimmed;
  }
  
  // Try 3: Find JSON within the text
  const jsonMatch = text.match(/([{\[].*?[\]}])(?=\s*$|\s*["\w])/s);
  if (jsonMatch) {
    return jsonMatch[1];
  }
  
  return null;
}

/**
 * Attempt to repair common JSON formatting issues
 */
export function repairJSON(jsonStr: string): string {
  let repaired = jsonStr;
  
  // Remove trailing commas before closing braces/brackets
  repaired = repaired.replace(/,\s*([\]}])/g, '$1');
  
  // Fix unquoted keys (simple cases)
  repaired = repaired.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
  
  // Fix single quotes to double quotes (simple cases)
  repaired = repaired.replace(/'([^']*?)'/g, '"$1"');
  
  // Remove control characters
  repaired = repaired.replace(/[\x00-\x1F\x7F]/g, ' ');
  
  return repaired;
}

/**
 * Safely parse JSON with repair attempts
 */
export function parseJSON(text: string): { success: boolean; data: unknown; error?: string } {
  // Extract JSON from markdown or surrounding text
  const extracted = extractJSON(text);
  if (!extracted) {
    return { success: false, data: null, error: 'No JSON found in response' };
  }
  
  // Try direct parse
  try {
    return { success: true, data: JSON.parse(extracted) };
  } catch (e) {
    // Try with repairs
    const repaired = repairJSON(extracted);
    try {
      return { success: true, data: JSON.parse(repaired) };
    } catch (e2) {
      return {
        success: false,
        data: null,
        error: `JSON parse failed: ${e instanceof Error ? e.message : String(e)}`,
      };
    }
  }
}

/**
 * Validate parsed data against a Zod schema
 */
export function validateAgainstSchema<T>(
  data: unknown,
  schema: z.ZodType<T>,
): { success: boolean; data?: T; errors?: ValidationError[] } {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: ValidationError[] = error.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
        expected: String(e.expected),
        received: String(e.received),
      }));
      return { success: false, errors };
    }
    return {
      success: false,
      errors: [
        {
          field: 'root',
          message: error instanceof Error ? error.message : String(error),
        },
      ],
    };
  }
}

/**
 * Complete parsing pipeline: extract → repair → parse → validate
 */
export function fullParseAndValidate<T>(
  responseText: string,
  schema: z.ZodType<T>,
): ValidatedAIResponse {
  const parseErrors: ParseError[] = [];
  const validationErrors: ValidationError[] = [];
  
  // Step 1: Extract JSON
  const extracted = extractJSON(responseText);
  if (!extracted) {
    parseErrors.push({
      message: 'No JSON found in response',
      location: 'extraction',
      attempt: 1,
    });
    return {
      success: false,
      rawContent: responseText,
      parseErrors,
      validationErrors,
    };
  }
  
  // Step 2: Try to parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(extracted);
  } catch (e) {
    // Try repair
    const repaired = repairJSON(extracted);
    try {
      parsed = JSON.parse(repaired);
    } catch (e2) {
      parseErrors.push({
        message: `JSON parsing failed: ${e instanceof Error ? e.message : String(e)}`,
        location: 'parse',
        attempt: 1,
      });
      parseErrors.push({
        message: `Repair and retry failed: ${e2 instanceof Error ? e2.message : String(e2)}`,
        location: 'parse',
        attempt: 2,
      });
      return {
        success: false,
        rawContent: responseText,
        parseErrors,
        validationErrors,
      };
    }
  }
  
  // Step 3: Validate against schema
  try {
    const result = schema.parse(parsed);
    return {
      success: true,
      data: result,
      rawContent: responseText,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach((e) => {
        validationErrors.push({
          field: e.path.join('.'),
          message: e.message,
          expected: String(e.expected),
          received: String(e.received),
        });
      });
    } else {
      validationErrors.push({
        field: 'root',
        message: error instanceof Error ? error.message : String(error),
      });
    }
    return {
      success: false,
      rawContent: responseText,
      parseErrors,
      validationErrors,
    };
  }
}
