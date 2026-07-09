/**
 * ES256 (ECDSA P-256) JWT implementation for asymmetric signing.
 * Provides stronger security guarantees than HS256 by using
 * a public/private key pair instead of a shared secret.
 *
 * In production, keys can be loaded from env or a secure vault.
 * In development, a one-time key pair is generated on startup.
 *
 * @module jwt
 */

import crypto from 'crypto';

/**
 * Generates or loads an ES256 key pair.
 * In production, JWT_PRIVATE_KEY (PEM) and JWT_PUBLIC_KEY (PEM) must be set.
 * In development, a one-time key pair is auto-generated.
 * @returns {{ publicKey: crypto.KeyObject, privateKey: crypto.KeyObject }}
 */
function getKeyPair() {
  if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) {
    return {
      privateKey: crypto.createPrivateKey(process.env.JWT_PRIVATE_KEY),
      publicKey: crypto.createPublicKey(process.env.JWT_PUBLIC_KEY),
    };
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set in production.');
  }
  return crypto.generateKeyPairSync('ec', { namedCurve: 'P-256' });
}

let keyPair = null;
const JWT_EXPIRY = 3600;

/**
 * Signs a payload with ES256 (ECDSA using P-256 and SHA-256).
 * @param {object} payload - The JWT payload (must be a plain object).
 * @returns {string} A signed JWT string (header.body.signature).
 */
export function signToken(payload) {
  if (!keyPair) keyPair = getKeyPair();
  const header = Buffer.from(JSON.stringify({ alg: 'ES256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(
    JSON.stringify({
      ...payload,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + JWT_EXPIRY,
    }),
  ).toString('base64url');
  const sig = crypto.sign('sha256', Buffer.from(`${header}.${body}`), keyPair.privateKey);
  return `${header}.${body}.${Buffer.from(sig).toString('base64url')}`;
}

/**
 * Verifies an ES256 JWT.
 * @param {string} token - The JWT string to verify.
 * @returns {object|null} The decoded payload, or null if invalid/expired.
 */
export function verifyToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    if (!keyPair) keyPair = getKeyPair();

    const verified = crypto.verify(
      'sha256',
      Buffer.from(`${header}.${body}`),
      keyPair.publicKey,
      Buffer.from(sig, 'base64url'),
    );
    if (!verified) return null;

    const data = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (data.exp && Date.now() / 1000 > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}
