import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getGenAI, getBestAvailableModel, buildSystemPrompt } from '../genai.js';

describe('genai.js', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should return null if API key is missing or is the default dummy key', () => {
    process.env.GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
    const instance = getGenAI();
    expect(instance).toBeNull();
  });

  it('should return flash model as fallback if fetch fails', async () => {
    const model = await getBestAvailableModel('dummy');
    expect(model).toBe('gemini-1.5-flash');
  });

  it('should build a system prompt containing safeContext', () => {
    const prompt = buildSystemPrompt('Safe context text', 'en');
    expect(prompt).toContain('Safe context text');
    expect(prompt).toContain('en');
  });
});
