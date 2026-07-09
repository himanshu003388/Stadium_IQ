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

const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

const server = app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Stadium IQ server running on port ${PORT}`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
});

server.keepAliveTimeout = 60000;
server.headersTimeout = 61000;
