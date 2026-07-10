import { Router } from 'express';
import crypto from 'crypto';
import { signToken } from '../utils/jwt.js';
import { loginLimiter } from '../middleware/loginRateLimit.js';

const router = Router();

if (!process.env.ADMIN_PASSWORD || !process.env.OPERATOR_PASSWORD) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL SECURITY ERROR: ADMIN_PASSWORD and OPERATOR_PASSWORD environment variables must be defined.',
    );
  }
}

const CREDENTIALS = {
  admin: process.env.ADMIN_PASSWORD || crypto.randomBytes(16).toString('hex'),
  operator: process.env.OPERATOR_PASSWORD || crypto.randomBytes(16).toString('hex'),
};

function safeTimingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

router.post('/api/auth/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  const validPassword = CREDENTIALS[username];
  if (!validPassword || !safeTimingSafeEqual(password, validPassword)) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  const token = signToken({
    sub: username,
    role: username === 'admin' ? 'admin' : 'operator',
  });
  res.json({ token, expiresIn: 3600 });
});

router.get('/api/auth/token', (req, res) => {
  const token = signToken(
    {
      sub: 'session_' + crypto.randomBytes(8).toString('hex'),
      role: 'operator',
    },
    30,
  );
  res.json({ token, expiresIn: 30 });
});

export default router;
