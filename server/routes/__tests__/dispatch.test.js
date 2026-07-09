import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../middleware/auth.js', () => ({
  authenticateApiKey: (req, res, next) => next(),
  csrfProtection: (req, res, next) => next(),
  jwtAuth: (req, res, next) => next(),
}));

vi.mock('../../utils/genai.js', () => ({
  getGenAI: vi.fn(),
  getBestAvailableModel: vi.fn().mockResolvedValue('gemini-1.5-flash'),
}));

import dispatchRouter from '../dispatch.js';

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
    vi.clearAllMocks();
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

  it('should return fallback dispatch logic when API is offline', async () => {
    req.body = {
      task: {
        id: 'T2',
        description: 'Need help',
        requiredLanguage: 'en',
        requiredSkill: 'first-aid',
        zone: 'north',
      },
      volunteers: [
        {
          id: 'V1',
          name: 'Alice',
          languages: ['en'],
          skills: ['first-aid'],
          currentLoad: 1,
          maxLoad: 5,
          status: 'active',
          zone: 'north',
        },
        {
          id: 'V2',
          name: 'Bob',
          languages: ['en'],
          skills: ['first-aid'],
          currentLoad: 3,
          maxLoad: 5,
          status: 'active',
          zone: 'south',
        },
      ],
    };
    await dispatchRouter(req, res, next);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        suggestion: expect.objectContaining({ volunteerId: 'V1' }),
        fallback: true,
      }),
    );
  });
});
