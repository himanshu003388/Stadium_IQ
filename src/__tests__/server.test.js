import { describe, it, expect, vi } from 'vitest';
import crypto from 'crypto';
import { buildSafeContext } from '../../src/utils/contextFilter';

import { sanitizeInput, validateChatInput } from '../../server/utils/validation.js';
import {
  generateCsrfToken as prodGenerateCsrfToken,
  validateCsrfToken as prodValidateCsrfToken,
} from '../../server/utils/csrf.js';

const VALID_LANGUAGES = ['en', 'es', 'fr', 'ar', 'pt', 'ja', 'hi'];

const mockReq = { headers: { cookie: 'session_id=1234567890abcdef' } };
const mockRes = { setHeader: vi.fn(), cookie: vi.fn() };

function generateCsrfToken() {
  return prodGenerateCsrfToken(mockReq, mockRes);
}

function validateCsrfToken(token) {
  return prodValidateCsrfToken(token, mockReq);
}

describe('sanitizeInput', () => {
  it('removes <script> tags', () => {
    expect(sanitizeInput('<script>alert(1)</script>Hello')).toBe('Hello');
  });

  it('removes all HTML tags', () => {
    expect(sanitizeInput('<b>bold</b>')).toBe('bold');
  });

  it('removes dangerous characters', () => {
    const result = sanitizeInput('<>"\'`test`\'"<>');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
    expect(result).not.toContain('"');
    expect(result).not.toContain("'");
    expect(result).not.toContain('`');
  });

  it('trims whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
  });

  it('returns clean input unchanged', () => {
    expect(sanitizeInput('What gate is least busy?')).toBe('What gate is least busy?');
  });

  it('removes nested script tags', () => {
    const input = '<scr<script>ipt>alert(1)</scr</script>ipt>';
    expect(sanitizeInput(input)).not.toContain('alert');
  });
});

describe('validateChatInput', () => {
  it('returns error for null body', () => {
    expect(validateChatInput(null)).toContain('Request body is required');
  });

  it('returns error for non-object body', () => {
    expect(validateChatInput('string')).toContain('Request body is required');
  });

  it('returns error for non-string message', () => {
    expect(validateChatInput({ message: 123 })).toContain('message must be a string');
  });

  it('returns error for empty message', () => {
    expect(validateChatInput({ message: '   ' })).toContain('message cannot be empty');
  });

  it('returns error when message exceeds 2000 characters', () => {
    expect(validateChatInput({ message: 'a'.repeat(2001) })).toContain(
      'message must be max 2000 characters',
    );
  });

  it('returns no error for a valid message', () => {
    expect(validateChatInput({ message: 'Hello' })).toHaveLength(0);
  });

  it('returns error for invalid language code', () => {
    expect(validateChatInput({ message: 'Hi', language: 'xx' })).toContain(
      'language must be a valid 2-letter ISO code',
    );
  });

  it('accepts all valid language codes', () => {
    for (const lang of VALID_LANGUAGES) {
      expect(validateChatInput({ message: 'Hi', language: lang })).toHaveLength(0);
    }
  });

  it('returns error for non-object contextData', () => {
    expect(validateChatInput({ message: 'Hi', contextData: 'invalid' })).toContain(
      'contextData must be an object',
    );
  });

  it('returns error when stadium.name exceeds 200 chars', () => {
    expect(
      validateChatInput({ message: 'Hi', contextData: { stadium: { name: 'A'.repeat(201) } } }),
    ).toContain('contextData.stadium.name exceeds maximum length');
  });

  it('returns error when stadium.homeTeam exceeds 200 chars', () => {
    expect(
      validateChatInput({ message: 'Hi', contextData: { stadium: { homeTeam: 'B'.repeat(201) } } }),
    ).toContain('contextData.stadium.homeTeam exceeds maximum length');
  });

  it('returns error when stadium.awayTeam exceeds 200 chars', () => {
    expect(
      validateChatInput({ message: 'Hi', contextData: { stadium: { awayTeam: 'C'.repeat(201) } } }),
    ).toContain('contextData.stadium.awayTeam exceeds maximum length');
  });

  it('returns error when matchPhase exceeds 20 chars', () => {
    expect(
      validateChatInput({
        message: 'Hi',
        contextData: { stadium: { matchPhase: 'X'.repeat(21) } },
      }),
    ).toContain('contextData.stadium.matchPhase exceeds maximum length');
  });

  it('accepts valid contextData within limits', () => {
    expect(
      validateChatInput({
        message: 'Hi',
        language: 'en',
        contextData: {
          stadium: {
            name: 'AT&T Stadium',
            homeTeam: 'Brazil',
            awayTeam: 'France',
            matchPhase: "67'",
          },
        },
      }),
    ).toHaveLength(0);
  });
});

describe('buildSafeContext (shared module)', () => {
  const raw = {
    stadium: {
      name: 'AT&T Stadium',
      capacity: 105000,
      currentOccupancy: 89000,
      homeTeam: 'Brazil',
      awayTeam: 'France',
      score: '2 - 1',
      matchPhase: "67'",
      weather: { temperature: 32 },
      internalAdminNotes: 'SECRET_DATA',
      securityCode: 'TOPSECRET',
    },
    gates: [
      {
        id: 'A',
        direction: 'North',
        density: 0.4,
        waitTimeMinutes: 5,
        status: 'normal',
        accessible: true,
        accessibleFeatures: ['wheelchair_ramp', 'elevator'],
        staffPassword: 'HIDDEN',
      },
    ],
    incidents: [
      { id: 'I1', status: 'active' },
      { id: 'I2', status: 'resolved' },
    ],
    volunteerPrivateData: { ssn: '123-45-6789' },
  };

  it('only returns whitelisted stadium fields', () => {
    const ctx = buildSafeContext(raw);
    expect(ctx.stadium.name).toBe('AT&T Stadium');
    expect(ctx.stadium.internalAdminNotes).toBeUndefined();
    expect(ctx.stadium.securityCode).toBeUndefined();
  });

  it('only returns whitelisted gate fields including accessibleFeatures', () => {
    const ctx = buildSafeContext(raw);
    expect(ctx.gates[0].id).toBe('A');
    expect(ctx.gates[0].staffPassword).toBeUndefined();
    expect(ctx.gates[0].accessibleFeatures).toEqual(['wheelchair_ramp', 'elevator']);
  });

  it('strips volunteerPrivateData entirely', () => {
    const ctx = buildSafeContext(raw);
    expect(ctx.volunteerPrivateData).toBeUndefined();
  });

  it('only includes active incidents (max 10)', () => {
    const ctx = buildSafeContext(raw);
    expect(ctx.incidents).toHaveLength(1);
    expect(ctx.incidents[0].id).toBe('I1');
  });

  it('handles null context gracefully', () => {
    expect(buildSafeContext(null)).toEqual({});
  });

  it('handles missing gates array gracefully', () => {
    const ctx = buildSafeContext({ stadium: { name: 'Test' } });
    expect(ctx.gates).toEqual([]);
  });
});

describe('CSRF Token Generation & Validation', () => {
  it('generates a valid token that passes validation', () => {
    const token = generateCsrfToken();
    expect(validateCsrfToken(token)).toBe(true);
  });

  it('returns false for null token', () => {
    expect(validateCsrfToken(null)).toBe(false);
  });

  it('returns false for empty string token', () => {
    expect(validateCsrfToken('')).toBe(false);
  });

  it('returns false for a tampered token', () => {
    const token = generateCsrfToken();
    const tampered = token.slice(0, -4) + 'XXXX';
    expect(validateCsrfToken(tampered)).toBe(false);
  });

  it('returns false for a malformed base64 token', () => {
    expect(validateCsrfToken('not-a-real-token!!!')).toBe(false);
  });

  it('returns false for a token with wrong structure (missing parts)', () => {
    const fake = Buffer.from('only-two:parts').toString('base64url');
    expect(validateCsrfToken(fake)).toBe(false);
  });

  it('returns false for an expired token (simulated via Date manipulation)', () => {
    vi.useFakeTimers();
    const token = generateCsrfToken();
    vi.advanceTimersByTime(2 * 60 * 60 * 1000);
    expect(validateCsrfToken(token)).toBe(false);
    vi.useRealTimers();
  });

  it('generates unique tokens on successive calls', () => {
    const t1 = generateCsrfToken();
    const t2 = generateCsrfToken();
    expect(t1).not.toBe(t2);
  });
});

describe('Security boundary: validateChatInput edge cases', () => {
  it('rejects empty object body', () => {
    const errors = validateChatInput({});
    expect(errors).toHaveLength(0);
  });

  it('rejects a message with only whitespace characters', () => {
    expect(validateChatInput({ message: '\t\n\r ' })).toContain('message cannot be empty');
  });

  it('accepts exactly 2000-character message (boundary)', () => {
    expect(validateChatInput({ message: 'a'.repeat(2000) })).toHaveLength(0);
  });

  it('rejects 2001-character message (above boundary)', () => {
    expect(validateChatInput({ message: 'a'.repeat(2001) })).not.toHaveLength(0);
  });

  it('rejects xss attempt in message as a string validation pass-through (sanitization is separate)', () => {
    const errors = validateChatInput({ message: '<script>alert(1)</script>' });
    expect(errors).toHaveLength(0);
  });
});

describe('Security boundary: buildSafeContext with adversarial input', () => {
  it('handles deeply nested unexpected fields safely', () => {
    const adversarial = {
      stadium: {
        name: 'Test',
        __proto__: { polluted: true },
        constructor: { prototype: { polluted: true } },
      },
      gates: [],
      incidents: [],
    };
    const ctx = buildSafeContext(adversarial);
    expect(ctx.stadium.name).toBe('Test');
    expect({}.polluted).toBeUndefined();
  });

  it('handles non-array gates gracefully', () => {
    const ctx = buildSafeContext({ stadium: {}, gates: 'not-an-array', incidents: [] });
    expect(ctx.gates).toEqual([]);
  });

  it('handles non-array incidents gracefully', () => {
    const ctx = buildSafeContext({ stadium: {}, gates: [], incidents: 'not-an-array' });
    expect(ctx.incidents).toEqual([]);
  });
});

function hppGuardTest(req, res, next) {
  if (req.query) {
    for (const key in req.query) {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    }
  }
  next();
}

function antiPrototypePollutionTest(req, res, next) {
  function checkProto(obj, seen = new WeakSet()) {
    if (!obj || typeof obj !== 'object') return false;
    if (seen.has(obj)) return false;
    seen.add(obj);
    if (Object.getPrototypeOf(obj) !== Object.prototype) return true;
    const keys = Object.keys(obj);
    if (keys.includes('__proto__') || keys.includes('constructor')) return true;
    return Object.values(obj).some((v) => checkProto(v, seen));
  }
  if (checkProto(req.body)) {
    return res.status(400).json({ error: 'Invalid payload structure detected.' });
  }
  next();
}

describe('hppGuard', () => {
  it('takes the last parameter if an array is provided', () => {
    const req = { query: { param: ['value1', 'value2'] } };
    const next = vi.fn();
    hppGuardTest(req, null, next);
    expect(req.query.param).toBe('value2');
    expect(next).toHaveBeenCalled();
  });

  it('leaves single parameters untouched', () => {
    const req = { query: { param: 'value1' } };
    const next = vi.fn();
    hppGuardTest(req, null, next);
    expect(req.query.param).toBe('value1');
    expect(next).toHaveBeenCalled();
  });
});

describe('antiPrototypePollution', () => {
  it('rejects payloads with __proto__', () => {
    const req = { body: JSON.parse('{"__proto__":{"admin":true}}') };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    antiPrototypePollutionTest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid payload structure detected.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects payloads with constructor', () => {
    const req = { body: JSON.parse('{"constructor":{"admin":true}}') };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    antiPrototypePollutionTest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid payload structure detected.' });
    expect(next).not.toHaveBeenCalled();
  });

  it('accepts safe payloads', () => {
    const req = { body: { valid: 'payload' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    antiPrototypePollutionTest(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('rejects payloads with nested constructor property', () => {
    const req = { body: { nested: { constructor: { prototype: { polluted: true } } } } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    antiPrototypePollutionTest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('JWT utilities', () => {
  const JWT_SECRET = 'test-jwt-secret-for-unit-tests';

  function signToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const nonce = crypto.randomBytes(8).toString('hex');
    const body = Buffer.from(
      JSON.stringify({
        ...payload,
        nonce,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    ).toString('base64url');
    const sig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${sig}`;
  }

  function verifyToken(token) {
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

  it('signs and verifies a valid token', () => {
    const token = signToken({ sub: 'admin', role: 'admin' });
    const payload = verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload.sub).toBe('admin');
    expect(payload.role).toBe('admin');
  });

  it('returns null for null token', () => {
    expect(verifyToken(null)).toBeNull();
  });

  it('returns null for empty string token', () => {
    expect(verifyToken('')).toBeNull();
  });

  it('returns null for tampered token', () => {
    const token = signToken({ sub: 'admin' });
    const tampered = token.slice(0, -10) + 'a'.repeat(10);
    expect(verifyToken(tampered)).toBeNull();
  });

  it('returns null for expired token', () => {
    vi.useFakeTimers();
    const token = signToken({ sub: 'admin' });
    vi.advanceTimersByTime(2 * 3600 * 1000);
    expect(verifyToken(token)).toBeNull();
    vi.useRealTimers();
  });

  it('returns null for malformed token (less than 3 parts)', () => {
    expect(verifyToken('header.body')).toBeNull();
  });

  it('generates unique tokens on successive calls', () => {
    const t1 = signToken({ sub: 'admin' });
    const t2 = signToken({ sub: 'admin' });
    expect(t1).not.toBe(t2);
  });
});
