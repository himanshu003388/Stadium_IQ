import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockGenerateContent = vi.fn().mockResolvedValue({
  response: { text: () => 'OK' },
});

const mockGetGenerativeModel = vi.fn().mockReturnValue({
  generateContent: mockGenerateContent,
});

vi.mock('@google/generative-ai', () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(function () {
      return {
        getGenerativeModel: mockGetGenerativeModel,
      };
    }),
  };
});

import {
  getGenAI,
  getBestAvailableModel,
  buildSystemPrompt,
  resetGenAIInstance,
} from '../genai.js';

describe('genai.js', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.clearAllMocks();
    resetGenAIInstance();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return null if API key is missing or is the default dummy key', () => {
    process.env.GEMINI_API_KEY = 'YOUR_GEMINI_API_KEY';
    const instance = getGenAI();
    expect(instance).toBeNull();
  });

  it('should return flash model as fallback if fetch fails', async () => {
    // Force a fetch failure by making mock throw an error
    mockGenerateContent.mockRejectedValueOnce(new Error('API offline'));
    process.env.GEMINI_API_KEY = 'mock-key';
    const model = await getBestAvailableModel();
    expect(model).toBe('gemini-1.5-flash');
  });

  it('should rethrow programmer errors (e.g. ReferenceError) instead of masking them', async () => {
    // Force a ReferenceError in generation
    mockGenerateContent.mockRejectedValueOnce(new ReferenceError('x is not defined'));
    process.env.GEMINI_API_KEY = 'mock-key';
    await expect(getBestAvailableModel()).rejects.toThrow(ReferenceError);
  });

  it('should cache the model name and deduplicate concurrent requests', async () => {
    process.env.GEMINI_API_KEY = 'mock-key';
    mockGenerateContent.mockResolvedValue({
      response: { text: () => 'OK' },
    });

    // Make two concurrent calls to test deduplication
    const [m1, m2] = await Promise.all([getBestAvailableModel(), getBestAvailableModel()]);

    expect(m1).toBe('gemini-2.5-flash');
    expect(m2).toBe('gemini-2.5-flash');

    // Due to deduplication, generateContent should only be called once
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);

    // Clean calls after cache is set should hit cache directly and not call generateContent
    const m3 = await getBestAvailableModel();
    expect(m3).toBe('gemini-2.5-flash');
    expect(mockGenerateContent).toHaveBeenCalledTimes(1);
  });

  it('should build a system prompt containing safeContext', () => {
    const prompt = buildSystemPrompt('Safe context text', 'en');
    expect(prompt).toContain('Safe context text');
    expect(prompt).toContain('en');
  });
});
