import crypto from 'crypto';

let CSRF_SECRET = process.env.CSRF_SECRET;
if (!CSRF_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL SECURITY ERROR: CSRF_SECRET environment variable must be defined in production.',
    );
  }
  CSRF_SECRET = 'development-csrf-secret-fallback-stadium-iq';
}
const CSRF_TOKEN_EXPIRY = 3600;

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    cookies[name] = decodeURIComponent(value);
  });
  return cookies;
}

export function generateCsrfToken(req, res) {
  let sessionId = '';
  if (req && req.headers && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    sessionId = cookies['session_id'] || '';
  }
  if (!sessionId) {
    sessionId = crypto.randomBytes(16).toString('hex');
    const isProd = process.env.NODE_ENV === 'production';
    if (res && typeof res.cookie === 'function') {
      res.cookie('session_id', sessionId, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'strict',
        maxAge: 3600000 * 24,
      });
    } else if (res && typeof res.setHeader === 'function') {
      const secureFlag = isProd ? '; Secure' : '';
      res.setHeader(
        'Set-Cookie',
        `session_id=${sessionId}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400${secureFlag}`,
      );
    }
  }

  const payload = `${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  const hashInput = `${payload}:${sessionId}`;
  const sig = crypto.createHmac('sha256', CSRF_SECRET).update(hashInput).digest('hex');
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

export function validateCsrfToken(rawToken, req) {
  if (!rawToken || !req) return false;
  try {
    const cookieHeader = req.headers?.cookie;
    if (!cookieHeader) return false;
    const cookies = parseCookies(cookieHeader);
    const sessionId = cookies['session_id'];
    if (!sessionId) return false;

    const decoded = Buffer.from(rawToken, 'base64url').toString();
    const [ts, nonce, sig] = decoded.split(':');
    if (!ts || !nonce || !sig) return false;

    const hashInput = `${ts}:${nonce}:${sessionId}`;
    const expected = crypto.createHmac('sha256', CSRF_SECRET).update(hashInput).digest('hex');
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expected, 'hex');

    if (sigBuf.length !== expBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;
    if ((Date.now() - parseInt(ts, 10)) / 1000 > CSRF_TOKEN_EXPIRY) return false;
    return true;
  } catch {
    return false;
  }
}
