import { describe, it, expect } from 'vitest';
import { sanitizeInput, validateChatInput } from '../../../server/utils/validation.js';

describe('validation.js - sanitizeInput edge cases', () => {
  it('handles empty string', () => {
    expect(sanitizeInput('')).toBe('');
  });

  it('handles strings with only special characters', () => {
    expect(sanitizeInput('<>"\'`')).toBe('');
  });

  it('handles nested script tags multiple levels deep', () => {
    const input = '<scr<script>ipt>alert(1)</scr</script>ipt>';
    const result = sanitizeInput(input);
    expect(result).not.toContain('alert');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });
});

describe('validation.js - validateChatInput edge cases', () => {
  it('handles body with only language field', () => {
    expect(validateChatInput({ language: 'en' })).toHaveLength(0);
  });

  it('handles body with only contextData field', () => {
    expect(validateChatInput({ contextData: { stadium: { name: 'Test' } } })).toHaveLength(0);
  });

  it('accepts message at exactly 2000 character boundary', () => {
    expect(validateChatInput({ message: 'a'.repeat(2000) })).toHaveLength(0);
  });

  it('rejects message at 2001 character boundary', () => {
    expect(validateChatInput({ message: 'a'.repeat(2001) })).not.toHaveLength(0);
  });

  it('rejects non-string contextData', () => {
    const errors = validateChatInput({ message: 'Hi', contextData: 'invalid' });
    expect(errors).toContain('contextData must be an object');
  });

  it('handles missing message in body', () => {
    expect(validateChatInput({ language: 'es' })).toHaveLength(0);
  });
});
