import { Router } from 'express';
import { generateCsrfToken } from '../utils/csrf.js';
import { csrfLimiter } from '../middleware/rateLimit.js';

const router = Router();

router.get('/api/csrf-token', csrfLimiter, (req, res) => {
  const token = generateCsrfToken(req, res);
  res.json({ csrfToken: token });
});

export default router;
