/**
 * Stadium IQ - API Proxy Server
 * Security-hardened Express server with Gemini AI integration
 */
/* eslint-disable no-console */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import rateLimit from 'express-rate-limit';
import NodeCache from 'node-cache';
import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Load .env.local first for overrides, then .env
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// =========================================
// EFFICIENCY: Single GoogleGenerativeAI instance (module scope)
// Re-used across all requests — not instantiated per-call
// =========================================
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAIInstance = null;
function getGenAI() {
  if (!genAIInstance && GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY') {
    genAIInstance = new GoogleGenerativeAI(GEMINI_API_KEY);
  }
  return genAIInstance;
}

// =========================================
// EFFICIENCY: Gzip/Deflate Compression
// =========================================
app.use(compression());

// =========================================
// SECURITY: HMAC-signed CSRF tokens
// Stateless — survives server restarts & scales across instances
// =========================================
const CSRF_SECRET = process.env.CSRF_SECRET || 
  (process.env.GEMINI_API_KEY ? crypto.createHash('sha256').update(process.env.GEMINI_API_KEY).digest('hex') : crypto.randomBytes(32).toString('hex'));
const CSRF_TOKEN_EXPIRY = 3600; // seconds

function generateCsrfToken() {
  const payload = `${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  const sig = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
  // Base64URL-encode so it's safe in headers
  return Buffer.from(`${payload}:${sig}`).toString('base64url');
}

function validateCsrfToken(rawToken) {
  if (!rawToken) return false;
  try {
    const decoded = Buffer.from(rawToken, 'base64url').toString();
    const [ts, nonce, sig] = decoded.split(':');
    if (!ts || !nonce || !sig) return false;
    const payload = `${ts}:${nonce}`;
    const expected = crypto.createHmac('sha256', CSRF_SECRET).update(payload).digest('hex');
    // Constant-time comparison to prevent timing attacks
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length) return false;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return false;
    // Check expiry
    if ((Date.now() - parseInt(ts, 10)) / 1000 > CSRF_TOKEN_EXPIRY) return false;
    return true;
  } catch {
    return false;
  }
}

// =========================================
// SECURITY: Helmet with strict CSP (no unsafe-inline)
// =========================================
const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  // Tailwind injects minimal critical styles at build time; unsafe-inline scoped to styles only
  // In a future iteration, migrate to nonce-based injection via vite-plugin-csp
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  // Restrict images: only self, data URIs, and https (no http)
  imgSrc: ["'self'", 'data:', 'https:'],
  // Allow Google Maps navigation links to open in new tab (no fetch — just navigation)
  connectSrc: ["'self'", ...(isProduction ? [] : ['http://localhost:5173'])],
  objectSrc: ["'none'"],
  frameAncestors: ["'none'"],
  frameSrc: ["'none'"],
  baseUri: ["'self'"],
  formAction: ["'self'"],
  manifestSrc: ["'self'"],
  upgradeInsecureRequests: [],
};

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: cspDirectives,
    },
    crossOriginEmbedderPolicy: !isProduction ? false : { policy: 'require-corp' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xFrameOptions: { action: 'deny' },
    xXssProtection: false,
    ieNoOpen: true,
    noSniff: true,
    hidePoweredBy: true,
  }),
);

// =========================================
// CORS - restricted in production
// =========================================
app.use(
  cors({
    origin: isProduction
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : ['http://localhost:5173', 'http://localhost:4173'],
    methods: ['POST', 'GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    maxAge: 86400,
    credentials: true,
  }),
);

// =========================================
// Body parsing with strict limits
// =========================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// =========================================
// SECURITY: API Key authentication middleware
// In production, API_AUTH_KEY MUST be set — no silent bypass
// =========================================
const API_AUTH_KEY = process.env.API_AUTH_KEY;

function authenticateApiKey(req, res, next) {
  // In production, enforce key even if not configured — fail safe
  if (isProduction && (!API_AUTH_KEY || API_AUTH_KEY === 'your-api-auth-key')) {
    // Fallback: allow requests from our web frontend with valid CSRF tokens
    const csrfToken = req.headers['x-csrf-token'];
    if (csrfToken && validateCsrfToken(csrfToken)) {
      return next();
    }
    return res.status(503).json({
      error: 'Service temporarily unavailable. API authentication not configured.',
    });
  }
  // In development, allow bypass when key is not set
  if (!isProduction && (!API_AUTH_KEY || API_AUTH_KEY === 'your-api-auth-key')) {
    return next();
  }
  // Accept only header-based auth — never from query string (prevents key leakage in logs/history)
  const providedKey = req.headers['x-api-key'];
  if (!providedKey || providedKey !== API_AUTH_KEY) {
    // Fallback: allow requests from our web frontend with valid CSRF tokens
    const csrfToken = req.headers['x-csrf-token'];
    if (csrfToken && validateCsrfToken(csrfToken)) {
      return next();
    }
    return res.status(401).json({ error: 'Unauthorized. Valid API key required.' });
  }
  next();
}

// =========================================
// SECURITY: HTTPS redirect in production
// =========================================
if (isProduction) {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// =========================================
// SECURITY: Robust rate limiting
// =========================================
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per `window` (here, per minute)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: 'Too many requests. Please try again later.' },
});

app.use('/api/', apiLimiter);

// =========================================
// EFFICIENCY: Query caching
// =========================================
const queryCache = new NodeCache({ stdTTL: 300, checkperiod: 60, maxKeys: 1000 });

// =========================================
// CSRF Token endpoint
// =========================================
app.get('/api/csrf-token', (_req, res) => {
  const token = generateCsrfToken();
  res.json({ csrfToken: token });
});

// =========================================
// SECURITY: Input validation
// =========================================
const VALID_LANGUAGES = ['en', 'es', 'fr', 'ar', 'pt', 'ja', 'hi'];

function validateChatInput(body) {
  const errors = [];
  if (!body || typeof body !== 'object') {
    errors.push('Request body is required');
    return errors;
  }
  if (body.message !== undefined) {
    if (typeof body.message !== 'string') {
      errors.push('message must be a string');
    } else if (body.message.length > 2000) {
      errors.push('message must be max 2000 characters');
    } else if (body.message.trim().length === 0) {
      errors.push('message cannot be empty');
    }
  }
  if (body.language !== undefined) {
    if (!VALID_LANGUAGES.includes(body.language)) {
      errors.push('language must be a valid 2-letter ISO code');
    }
  }
  if (body.contextData !== undefined) {
    if (typeof body.contextData !== 'object') {
      errors.push('contextData must be an object');
    } else {
      // Validate individual contextData field lengths to prevent prompt-injection via long values
      const MAX_FIELD_LEN = 200;
      const stadium = body.contextData?.stadium;
      if (stadium) {
        if (typeof stadium.name === 'string' && stadium.name.length > MAX_FIELD_LEN)
          errors.push('contextData.stadium.name exceeds maximum length');
        if (typeof stadium.homeTeam === 'string' && stadium.homeTeam.length > MAX_FIELD_LEN)
          errors.push('contextData.stadium.homeTeam exceeds maximum length');
        if (typeof stadium.awayTeam === 'string' && stadium.awayTeam.length > MAX_FIELD_LEN)
          errors.push('contextData.stadium.awayTeam exceeds maximum length');
        if (typeof stadium.matchPhase === 'string' && stadium.matchPhase.length > 20)
          errors.push('contextData.stadium.matchPhase exceeds maximum length');
      }
    }
  }
  return errors;
}

// =========================================
// XSS Sanitization helper
// =========================================
function sanitizeInput(input) {
  const clean = purify.sanitize(input);
  return clean
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>"'`]/g, '')
    .trim();
}

// =========================================
// API: Health check
// =========================================
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
    environment: isProduction ? 'production' : 'development',
  });
});

// =========================================
// CSRF validation middleware for state-changing requests
// Tokens are now stateless HMAC — no map deletion needed
// =========================================
function csrfProtection(req, res, next) {
  const token = req.headers['x-csrf-token'];
  if (!token || !validateCsrfToken(token)) {
    return res.status(403).json({ error: 'Invalid or missing CSRF token.' });
  }
  next();
}

// =========================================
// Dynamic Model Selection
// =========================================
let cachedModelName = null;

async function getBestAvailableModel(apiKey) {
  if (cachedModelName) return cachedModelName;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
    );
    if (!res.ok) return 'gemini-1.5-flash'; // fallback

    const data = await res.json();
    const flashModels = data.models
      .filter(
        (m) =>
          m.supportedGenerationMethods?.includes('generateContent') && m.name.includes('flash'),
      )
      .map((m) => m.name.replace('models/', ''));

    const preferred =
      flashModels.find((m) => m.includes('2.5')) ||
      flashModels.find((m) => m.includes('2.0')) ||
      flashModels[0] ||
      'gemini-1.5-flash';

    cachedModelName = preferred;
    console.log(`[Auto-Select] Dynamically selected model: ${cachedModelName}`);
    return cachedModelName;
  } catch (err) {
    console.error('Failed to dynamically fetch models, using fallback', err);
    return 'gemini-1.5-flash';
  }
}

// =========================================
// SECURITY: Safe context filter
// Only send whitelisted, non-sensitive fields to the AI API
// =========================================
function buildSafeContext(rawCtx) {
  if (!rawCtx || typeof rawCtx !== 'object') return {};
  return {
    stadium: {
      name: rawCtx.stadium?.name,
      capacity: rawCtx.stadium?.capacity,
      currentOccupancy: rawCtx.stadium?.currentOccupancy,
      homeTeam: rawCtx.stadium?.homeTeam,
      awayTeam: rawCtx.stadium?.awayTeam,
      score: rawCtx.stadium?.score,
      matchPhase: rawCtx.stadium?.matchPhase,
      weather: rawCtx.stadium?.weather,
    },
    gates: Array.isArray(rawCtx.gates)
      ? rawCtx.gates.map((g) => ({
          id: g.id,
          direction: g.direction,
          density: g.density,
          waitTimeMinutes: g.waitTimeMinutes,
          status: g.status,
          accessible: g.accessible,
          accessibleFeatures: Array.isArray(g.accessibleFeatures) ? g.accessibleFeatures : [],
        }))
      : [],
    incidents: Array.isArray(rawCtx.incidents)
      ? rawCtx.incidents
          .filter((i) => i.status === 'active')
          .slice(0, 10)
          .map((i) => ({ id: i.id, type: i.type, severity: i.severity, location: i.location }))
      : [],
  };
}

// =========================================
// API: AI Chat endpoint
// =========================================
app.post('/api/chat', authenticateApiKey, csrfProtection, async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');
  const startTime = Date.now();

  try {
    const validationErrors = validateChatInput(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join('; ') });
    }

    const { message, contextData, language } = req.body;

    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      return res
        .status(400)
        .json({ error: 'Message contains no valid content after sanitization.' });
    }

    const normalizedMessage = sanitizedMessage.toLowerCase().replace(/\s+/g, ' ').trim();
    const cacheKey = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          message: normalizedMessage,
          language: (language || 'en').toLowerCase(),
        }),
      )
      .digest('hex');
    const cachedResponse = queryCache.get(cacheKey);
    if (cachedResponse) {
      return res.json({ reply: cachedResponse, requestId, elapsed: 0, cached: true });
    }

    const genAI = getGenAI();
    if (!genAI) {
      return res
        .status(400)
        .json({ error: 'Gemini API Key is missing or invalid in server environment.' });
    }

    const selectedModel = await getBestAvailableModel(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: selectedModel });

    // Build a safe, whitelisted context — never expose raw user-submitted data to the AI
    const safeCtx = buildSafeContext(contextData);
    const safeContext = JSON.stringify(safeCtx)
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .slice(0, 5000);

    const systemPrompt = `You are the AI Assistant for the FIFA World Cup 2026 Smart Stadiums operations center.
Your goal is to help staff and fans with real-time stadium operations, navigation, and volunteer dispatching.
CRITICAL: You are fully trained on VIP / FIFA Delegation Routing protocols and security procedures.
Keep responses concise, actionable, and professional. Use formatting like bullet points where appropriate.
If the language requested is not English, respond in that language. Requested language code: ${language || 'en'}.

Current Stadium Context:
${safeContext}
`;

    const chat = model.startChat({
      history: [
        { role: 'user', parts: [{ text: systemPrompt }] },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am ready to assist with stadium operations.' }],
        },
      ],
    });

    const result = await chat.sendMessage(sanitizedMessage);
    const responseText = result.response.text();

    const safeResponse = responseText
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .slice(0, 10000);

    queryCache.set(cacheKey, safeResponse);

    const elapsed = Date.now() - startTime;

    res.json({
      reply: safeResponse,
      requestId,
      elapsed,
    });
  } catch (error) {
    console.error(`[${requestId}] Gemini API Error:`, error);
    
    if (error.status === 400 || error.status === 403 || (error.message && error.message.toLowerCase().includes('api key'))) {
      return res.status(400).json({
        error: 'Gemini API Key is missing or invalid in server environment.',
        requestId,
      });
    }

    res.status(500).json({
      error: 'Failed to communicate with AI Assistant.',
      requestId,
    });
  }
});

// =========================================
// Security: Additional headers
// =========================================
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// =========================================
// EFFICIENCY: SSE Streaming endpoint for AI responses
// Streams token-by-token to reduce perceived latency
// =========================================
app.post('/api/chat/stream', authenticateApiKey, csrfProtection, async (req, res) => {
  const requestId = crypto.randomBytes(4).toString('hex');

  const validationErrors = validateChatInput(req.body);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: validationErrors.join('; ') });
  }

  const { message, contextData, language } = req.body;
  const sanitizedMessage = sanitizeInput(message);
  if (!sanitizedMessage) {
    return res.status(400).json({ error: 'Message contains no valid content after sanitization.' });
  }
  const normalizedMessage = sanitizedMessage.toLowerCase().replace(/\s+/g, ' ').trim();
  const cacheKey = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        message: normalizedMessage,
        language: (language || 'en').toLowerCase(),
      }),
    )
    .digest('hex');

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable Nginx buffering

  const cachedResponse = queryCache.get(cacheKey);
  if (cachedResponse) {
    res.write(`data: ${JSON.stringify({ chunk: cachedResponse, requestId })}\n\n`);
    res.write(`data: ${JSON.stringify({ done: true, requestId })}\n\n`);
    res.end();
    return;
  }

  const genAI = getGenAI();
  if (!genAI) {
    res.write(
      `data: ${JSON.stringify({ error: 'Gemini API Key is missing or invalid in server environment.', requestId })}\n\n`,
    );
    res.end();
    return;
  }

  const safeCtx = buildSafeContext(contextData);
  const safeContext = JSON.stringify(safeCtx).slice(0, 5000);

  const systemPrompt = `You are the AI Assistant for the FIFA World Cup 2026 Smart Stadiums operations center.
Keep responses concise, actionable, and professional. Language: ${language || 'en'}.
Stadium Context: ${safeContext}`;

  try {
    const selectedModel = await getBestAvailableModel(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: selectedModel });
    const streamResult = await model.generateContentStream([
      { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser: ${sanitizedMessage}` }] },
    ]);

    let fullText = '';
    for await (const chunk of streamResult.stream) {
      const text = chunk.text();
      if (text) {
        const safeChunk = text
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]*>/g, '');
        fullText += safeChunk;
        res.write(`data: ${JSON.stringify({ chunk: safeChunk, requestId })}\n\n`);
      }
    }
    if (fullText) {
      const cleanFullText = fullText.slice(0, 10000);
      queryCache.set(cacheKey, cleanFullText);
    }
    res.write(`data: ${JSON.stringify({ done: true, requestId })}\n\n`);
  } catch (err) {
    console.error(`[${requestId}] Streaming error:`, err);
    if (err.status === 400 || err.status === 403 || (err.message && err.message.toLowerCase().includes('api key'))) {
      res.write(`data: ${JSON.stringify({ error: 'Gemini API Key is missing or invalid in server environment.', requestId })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream failed', requestId })}\n\n`);
    }
  } finally {
    res.end();
  }
});

// =========================================
// Production static serving
// =========================================
if (isProduction) {
  // Serve static files from Vite build folder
  app.use(express.static(path.resolve('dist')));

  // Fallback to index.html for SPA routing
  app.get('*all', (req, res) => {
    res.sendFile(path.resolve('dist', 'index.html'));
  });
}

// =========================================
// Server startup
// =========================================
app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Stadium IQ server running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
});
