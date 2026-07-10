import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import chatRouter from '../../server/routes/chat.js';
import * as genai from '../../server/utils/genai.js';
import { queryCache } from '../../server/utils/cache.js';

vi.mock('../../server/middleware/auth.js', () => ({
  authenticateApiKey: (req, res, next) => next(),
  csrfProtection: (req, res, next) => next(),
}));

vi.mock('../../server/utils/genai.js', () => ({
  getGenAI: vi.fn(),
  getBestAvailableModel: vi.fn().mockResolvedValue('gemini-1.5-flash'),
  buildSystemPrompt: vi.fn().mockReturnValue('Mock System Prompt'),
}));

const app = express();
app.use(express.json());
app.use(chatRouter);

describe('SSE Streaming Endpoint (/api/chat/stream)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryCache.flushAll();
  });

  it('streams chunks successfully to the client', async () => {
    genai.getGenAI.mockReturnValue({
      getGenerativeModel: () => ({
        generateContentStream: vi.fn().mockResolvedValue({
          stream: (async function* () {
            yield { text: () => 'Hello ' };
            yield { text: () => 'World!' };
          })(),
        }),
      }),
    });

    const contextData = {
      stadium: { name: 'Test Stadium', capacity: 100000 },
      gates: [],
      incidents: [],
    };

    const response = await request(app)
      .post('/api/chat/stream')
      .send({
        message: 'Hello',
        language: 'en',
        contextData,
      })
      .expect('Content-Type', /text\/event-stream/)
      .expect(200);

    expect(response.text).toContain('"chunk":"Hello "');
    expect(response.text).toContain('"chunk":"World!"');
    expect(response.text).toContain('"done":true');
  });

  it('handles stream errors gracefully', async () => {
    genai.getGenAI.mockReturnValue({
      getGenerativeModel: () => ({
        generateContentStream: vi.fn().mockRejectedValue(new Error('AI generation failed')),
      }),
    });

    const contextData = {
      stadium: { name: 'Test Stadium', capacity: 100000 },
      gates: [],
      incidents: [],
    };

    const response = await request(app)
      .post('/api/chat/stream')
      .send({
        message: 'Hello',
        language: 'en',
        contextData,
      })
      .expect('Content-Type', /text\/event-stream/)
      .expect(200);

    expect(response.text).toContain('"error":"Stream failed"');
  });
});
