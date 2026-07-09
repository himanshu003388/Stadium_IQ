import { Router } from 'express';
import crypto from 'crypto';
import { signToken } from '../utils/jwt.js';

const router = Router();

const CREDENTIALS = {
  admin: process.env.ADMIN_PASSWORD || 'stadium-iq-admin',
  operator: process.env.OPERATOR_PASSWORD || 'stadium-iq-operator',
};

router.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required.' });
  }
  const validPassword = CREDENTIALS[username];
  if (
    !validPassword ||
    !crypto.timingSafeEqual(Buffer.from(password), Buffer.from(validPassword))
  ) {
    return res.status(401).json({ error: 'Invalid credentials.' });
  }
  const token = signToken({
    sub: username,
    role: username === 'admin' ? 'admin' : 'operator',
  });
  res.json({ token, expiresIn: 3600 });
});

export default router;
