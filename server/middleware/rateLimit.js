import rateLimit from 'express-rate-limit';
import { SERVER_CONFIG } from '../../src/utils/constants.js';

export const apiLimiter = rateLimit({
  windowMs: SERVER_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: SERVER_CONFIG.RATE_LIMIT_API_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

export const csrfLimiter = rateLimit({
  windowMs: SERVER_CONFIG.RATE_LIMIT_WINDOW_MS,
  max: SERVER_CONFIG.RATE_LIMIT_CSRF_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many token requests.' },
});
