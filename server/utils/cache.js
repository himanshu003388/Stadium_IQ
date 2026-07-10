import NodeCache from 'node-cache';
import logger from './logger.js';

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60, maxKeys: 1000 });

/**
 * Wrapped node-cache instance providing cache hit/miss metric logging.
 */
export const queryCache = {
  get(key) {
    const val = cache.get(key);
    if (val !== undefined) {
      logger.info(`[CACHE] Hit for key: ${key}`);
    } else {
      logger.info(`[CACHE] Miss for key: ${key}`);
    }
    return val;
  },
  set(key, val, ttl) {
    logger.info(`[CACHE] Set key: ${key}`);
    return cache.set(key, val, ttl);
  },
  keys() {
    return cache.keys();
  },
  flushAll() {
    return cache.flushAll();
  },
  getStats() {
    return cache.getStats();
  },
};
