import crypto from 'crypto';
import { validateCsrfToken } from '../utils/csrf.js';
import { verifyToken } from '../utils/jwt.js';

const isProduction = process.env.NODE_ENV === 'production';
const API_AUTH_KEY = process.env.API_AUTH_KEY;

export function authenticateApiKey(req, res, next) {
  if (isProduction && (!API_AUTH_KEY || API_AUTH_KEY === 'your-api-auth-key')) {
    const csrfToken = req.headers['x-csrf-token'];
    if (csrfToken) {
      if (validateCsrfToken(csrfToken, req)) return next();
      return res.status(403).json({ error: 'Invalid CSRF token.' });
    }
    return res
      .status(503)
      .json({ error: 'Service temporarily unavailable. API authentication not configured.' });
  }
  if (!isProduction && (!API_AUTH_KEY || API_AUTH_KEY === 'your-api-auth-key')) {
    return next();
  }
  const providedKey = req.headers['x-api-key'];
  if (
    !providedKey ||
    !crypto.timingSafeEqual(Buffer.from(providedKey), Buffer.from(API_AUTH_KEY))
  ) {
    const csrfToken = req.headers['x-csrf-token'];
    if (csrfToken) {
      if (validateCsrfToken(csrfToken, req)) return next();
      return res.status(403).json({ error: 'Invalid CSRF token.' });
    }
    return res.status(401).json({ error: 'Unauthorized. Valid API key required.' });
  }
  next();
}

export function csrfProtection(req, res, next) {
  const token = req.headers['x-csrf-token'];
  if (!token || !validateCsrfToken(token, req)) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token.' });
  }
  next();
}

export function jwtAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header.' });
  }
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
  req.user = payload;
  next();
}
