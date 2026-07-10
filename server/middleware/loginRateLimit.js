import rateLimit from 'express-rate-limit';

/**
 * Stricter rate limiter dedicated to login requests.
 * Restricts an IP address to 5 login attempts per 15 minutes.
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});
