import express from 'express';
import cors from 'cors';
import compression from 'compression';
import logger from './utils/logger.js';

import {
  installHelmet,
  hppGuard,
  antiPrototypePollution,
  httpsRedirect,
  extraHeaders,
} from './middleware/security.js';
import { apiLimiter } from './middleware/rateLimit.js';

import healthRouter from './routes/health.js';
import csrfRouter from './routes/csrf.js';
import chatRouter from './routes/chat.js';
import authRouter from './routes/auth.js';
import predictiveRouter from './routes/predictive.js';
import translateRouter from './routes/translate.js';
import dispatchRouter from './routes/dispatch.js';

const isProduction = process.env.NODE_ENV === 'production';

// Startup guard: warn loudly if ALLOWED_ORIGINS is absent in production
if (isProduction && !process.env.ALLOWED_ORIGINS) {
  logger.warn(
    '[SECURITY] ALLOWED_ORIGINS env var is not set in production. All cross-origin requests will be rejected by CORS. Set ALLOWED_ORIGINS to a comma-separated list of allowed origins.',
  );
}

const app = express();

app.use(compression());
installHelmet(app);

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

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

app.use(hppGuard);
app.use(antiPrototypePollution);

if (isProduction) {
  app.use(httpsRedirect);
}

app.use('/api/', apiLimiter);

app.use(healthRouter);
app.use(csrfRouter);
app.use(authRouter);
app.use(chatRouter);
app.use(predictiveRouter);
app.use(translateRouter);
app.use(dispatchRouter);

app.use(extraHeaders);

if (isProduction) {
  app.use(express.static('dist'));
  app.get('/{*path}', (req, res) => {
    res.sendFile('dist/index.html', { root: '.' });
  });
}

// Global error handling middleware
app.use((err, req, res, _next) => {
  logger.error('Unhandled server exception:', err);
  const status = err.status || 500;
  const message = isProduction ? 'An unexpected server error occurred.' : err.message;
  res.status(status).json({
    error: message,
    requestId: req.headers['x-request-id'] || 'system',
  });
});

export default app;
