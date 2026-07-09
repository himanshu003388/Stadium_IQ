import { Router } from 'express';

const router = Router();

router.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  });
});

export default router;
