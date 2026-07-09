import crypto from 'crypto';
import { validateCsrfToken } from '../utils/csrf.js';
import { verifyToken } from '../utils/jwt.js';

const isProduction = process.env.NODE_ENV === 'production';
const API_AUTH_KEY = process.env.API_AUTH_KEY;

function safeTimingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

export function authenticateApiKey(req, res, next) {
  // --- Case 1: No API key scheme configured in production ---
  // Fall back to CSRF-only authentication.
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

  // --- Case 2: Development with no API key configured ---
  // Allow all requests (dev convenience).
  if (!isProduction && (!API_AUTH_KEY || API_AUTH_KEY === 'your-api-auth-key')) {
    return next();
  }

  // --- Case 3: API key scheme IS active ---
  // Check X-API-Key header. If correct, pass through.
  const providedKey = req.headers['x-api-key'];
  if (providedKey && safeTimingSafeEqual(providedKey, API_AUTH_KEY)) {
    return next();
  }

  // API key is wrong or missing — fall back to CSRF-token authentication.
  // This allows browser-based clients (same origin, no API key) to authenticate
  // via CSRF token while external API callers must use a valid API key.
  const csrfToken = req.headers['x-csrf-token'];
  if (csrfToken) {
    if (validateCsrfToken(csrfToken, req)) return next();
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }

  // Neither API key nor CSRF token provided — reject.
  return res.status(401).json({ error: 'Unauthorized. Valid API key or CSRF token required.' });
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
