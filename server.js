/* eslint-disable no-console */
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

// Fail-closed verification for production security variables
if (process.env.NODE_ENV === 'production') {
  const missingKeys = [];
  if (!process.env.CSRF_SECRET) missingKeys.push('CSRF_SECRET');
  if (!process.env.ADMIN_PASSWORD) missingKeys.push('ADMIN_PASSWORD');
  if (!process.env.OPERATOR_PASSWORD) missingKeys.push('OPERATOR_PASSWORD');

  if (missingKeys.length > 0) {
    console.error(
      `[FATAL SECURITY ERROR] Missing required security environment variables in production: ${missingKeys.join(', ')}. The server is shutting down to prevent insecure operation.`,
    );
    process.exit(1);
  }

  if (!process.env.JWT_PRIVATE_KEY || !process.env.JWT_PUBLIC_KEY) {
    console.warn(
      '[SECURITY WARNING] JWT_PRIVATE_KEY and JWT_PUBLIC_KEY are not set in production. Falling back to a transient in-memory P-256 key pair.',
    );
  }
}

import { installRedact } from './server/utils/redact.js';
installRedact();

import app from './server/app.js';
import logger from './server/utils/logger.js';
import { initWebSocketServer } from './server/utils/socket.js';

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

const server = app.listen(PORT, () => {
  initWebSocketServer(server);
  logger.info(`Stadium IQ server running on port ${PORT}`);
  logger.info(`Environment: ${isProduction ? 'production' : 'development'}`);

  // Environment Verification Logs
  if (isProduction) {
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
setInterval(() => {}, 10000);
