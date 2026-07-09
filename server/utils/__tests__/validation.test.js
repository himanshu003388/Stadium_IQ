import { describe, it, expect } from 'vitest';
import { sanitizeInput, validateChatInput } from '../validation.js';

describe('validation.js - sanitizeInput', () => {
  it('should sanitize script tags and html', () => {
    expect(sanitizeInput('<script>alert("hack")</script>hello')).toBe('hello');
    expect(sanitizeInput('<div>test</div>')).toBe('test');
  });

  it('should handle non-string inputs', () => {
    expect(sanitizeInput(null)).toBe('');
    expect(sanitizeInput(undefined)).toBe('');
    expect(sanitizeInput(123)).toBe('');
  });
});

describe('validation.js - validateChatInput', () => {
  it('should validate typical request body', () => {
    const validBody = {
      message: 'Hello',
      language: 'en',
      contextData: { stadium: { name: 'Stadium A' } },
    };
    expect(validateChatInput(validBody)).toHaveLength(0);
  });

  it('should reject invalid language code', () => {
    const invalidBody = {
      message: 'Hello',
      language: 'invalid',
    };
    expect(validateChatInput(invalidBody)).toContain('language must be a valid 2-letter ISO code');
  });
});
