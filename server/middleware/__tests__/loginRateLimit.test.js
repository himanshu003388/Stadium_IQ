import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { loginLimiter } from '../loginRateLimit.js';

describe('loginRateLimit.js', () => {
  it('allows up to 5 requests but blocks the 6th with 429', async () => {
    const app = express();
    app.post('/login', loginLimiter, (req, res) => {
      res.status(200).json({ success: true });
    });

    // Send 5 requests (which should succeed)
    for (let i = 0; i < 5; i++) {
      const res = await request(app).post('/login');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    }

    // Send the 6th request (which should be rate-limited)
    const res6 = await request(app).post('/login');
    expect(res6.status).toBe(429);
    expect(res6.body.error).toContain('Too many login attempts');
  });
});
