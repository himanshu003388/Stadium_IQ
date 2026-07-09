// server/utils/logger.js
/**
 * A lightweight structured logger to replace raw console.* calls.
 * Ensures compatibility with strict linting rules (no-console) and
 * provides a unified JSON-friendly format for production.
 */

const isProduction = process.env.NODE_ENV === 'production';

function formatMessage(level, message, meta) {
  const ts = new Date().toISOString();
  if (isProduction) {
    return JSON.stringify({ level, timestamp: ts, message, meta: meta || {} });
  }
  const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

const logger = {
  info: (message, meta) => {
    // eslint-disable-next-line no-console
    console.log(formatMessage('info', message, meta));
  },
  warn: (message, meta) => {
    // eslint-disable-next-line no-console
    console.warn(formatMessage('warn', message, meta));
  },
  error: (message, meta) => {
    // eslint-disable-next-line no-console
    console.error(formatMessage('error', message, meta));
  },
};

export default logger;
