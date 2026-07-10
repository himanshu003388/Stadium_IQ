import { Router } from 'express';

const router = Router();

router.get('/api/health', (_req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const geminiActive =
    !!apiKey && apiKey !== 'YOUR_GEMINI_API_KEY' && apiKey !== 'YOUR_GEMINI_API_KEY_HERE';
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    geminiActive,
  });
});

export default router;
