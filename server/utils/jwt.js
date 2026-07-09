import crypto from 'crypto';

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'FATAL SECURITY ERROR: JWT_SECRET environment variable must be defined in production.',
    );
  }
  JWT_SECRET = crypto.randomBytes(64).toString('hex');
}
const JWT_EXPIRY = 3600;

export function signToken(payload) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
    }),
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    const sigBuf = Buffer.from(sig);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (data.exp && Date.now() / 1000 > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}
