import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../middleware/auth.js', () => ({
  authenticateApiKey: (req, res, next) => next(),
  csrfProtection: (req, res, next) => next(),
  jwtAuth: (req, res, next) => next(),
}));

import translateRouter from '../translate.js';
import dispatchRouter from '../dispatch.js';

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
});

describe('server/routes/dispatch.js', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      method: 'POST',
      url: '/api/ai/volunteer-dispatch',
      body: {},
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      setHeader: vi.fn(),
    };
    next = vi.fn();
  });

  it('should return 400 if task or volunteers is missing', async () => {
    req.body = { task: {} }; // missing volunteers
    await dispatchRouter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if task description is too long', async () => {
    req.body = {
      task: {
        id: 'T1',
        description: 'a'.repeat(501),
        requiredLanguage: 'en',
        requiredSkill: 'first-aid',
      },
      volunteers: [],
    };
    await dispatchRouter(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('exceeds maximum length') }),
    );
  });
});
