/**
 * Stadium IQ - API Proxy Server
 * Security-hardened Express server with Gemini AI integration
 */
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
dotenv.config();

import { installRedact } from './server/utils/redact.js';
installRedact();

import app from './server/app.js';

import logger from './server/utils/logger.js';

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

const server = app.listen(PORT, () => {
  logger.info(`Stadium IQ server running on port ${PORT}`);
  logger.info(`Environment: ${isProduction ? 'production' : 'development'}`);

  // Environment Verification Logs
  if (isProduction) {
    if (!process.env.CSRF_SECRET) {
      logger.warn(
        `CSRF_SECRET is not defined in production environment. A default fallback will be used, posing security risks!`,
      );
    }
    if (!process.env.API_AUTH_KEY) {
      logger.warn(
        `API_AUTH_KEY is not defined in production. Proxy routes will rely solely on CSRF token validation.`,
      );
    }
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY') {
    logger.info(
      `GEMINI_API_KEY is missing or set to placeholder. Express server will run with offline mock fallbacks.`,
    );
  } else {
    logger.info(`GEMINI_API_KEY detected. Gemini AI endpoints are active.`);
  }
});

server.keepAliveTimeout = 60000;
server.headersTimeout = 61000;
