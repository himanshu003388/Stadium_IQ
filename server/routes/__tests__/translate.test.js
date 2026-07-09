import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../middleware/auth.js', () => ({
  authenticateApiKey: (req, res, next) => next(),
  csrfProtection: (req, res, next) => next(),
  jwtAuth: (req, res, next) => next(),
}));

// Mock genai before importing router
vi.mock('../../utils/genai.js', () => ({
  getGenAI: vi.fn(),
  getBestAvailableModel: vi.fn().mockResolvedValue('gemini-1.5-flash'),
}));

import translateRouter from '../translate.js';

describe('server/routes/translate.js', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      url: '/api/ai/translate',
      body: {},
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
    };
    next = vi.fn();

    // Clear mocks
    vi.clearAllMocks();
  });

  it('should return 400 if text is missing', async () => {
    req.body = { targetLanguage: 'ES' };
    await translateRouter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('required') }),
    );
  });

  it('should return 400 if targetLanguage is missing', async () => {
    req.body = { text: 'hello' };
    await translateRouter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('required') }),
    );
  });

  it('should return 400 if text is too long', async () => {
    req.body = { text: 'a'.repeat(2001), targetLanguage: 'ES' };
    await translateRouter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('exceeds maximum length') }),
    );
  });

  it('should return 400 if targetLanguage is too long', async () => {
    req.body = { text: 'hello', targetLanguage: 'ES_LONG_CODE_HERE' };
    await translateRouter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('exceeds maximum length') }),
    );
  });

  it('should use fallback if API key is missing (fallback object mapping)', async () => {
    req.body = { text: 'Hello', targetLanguage: 'FR' };
    await translateRouter(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        translatedText: expect.any(String),
        fallback: true,
      }),
    );
  });
});
