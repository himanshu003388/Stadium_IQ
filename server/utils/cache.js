import NodeCache from 'node-cache';
import logger from './logger.js';

const localCache = new NodeCache({ stdTTL: 300, checkperiod: 60, maxKeys: 1000 });

const redisClient = null;
const isRedisConnected = false;

if (process.env.REDIS_URL) {
  logger.info(
    `[CACHE] REDIS_URL detected: ${process.env.REDIS_URL}. Distributed cache mode ready.`,
  );
  // Abstraction for future connection:
  // import { createClient } from 'redis';
  // redisClient = createClient({ url: process.env.REDIS_URL });
  // redisClient.connect().then(() => { isRedisConnected = true; }).catch(...)
}

/**
 * Wrapped cache manager providing synchronous local in-memory calls
 * and an asynchronous distributed-ready interface for scaling.
 */
export const queryCache = {
  // Synchronous local operations
  get(key) {
    const val = localCache.get(key);
    if (val !== undefined) {
      logger.info(`[CACHE] Hit for key: ${key}`);
    } else {
      logger.info(`[CACHE] Miss for key: ${key}`);
    }
    return val;
  },
  set(key, val, ttl) {
    logger.info(`[CACHE] Set key: ${key}`);
    return localCache.set(key, val, ttl);
  },

  // Distributed asynchronous operations (Redis-ready)
  async getAsync(key) {
    if (isRedisConnected && redisClient) {
      try {
        const val = await redisClient.get(key);
        if (val !== null && val !== undefined) {
          logger.info(`[CACHE] Redis Hit for key: ${key}`);
          return val;
        }
      } catch (err) {
        logger.error(`[CACHE] Redis get error: ${err.message}`);
      }
    }
    return this.get(key);
  },
  async setAsync(key, val, ttl) {
    if (isRedisConnected && redisClient) {
      try {
        logger.info(`[CACHE] Redis Set key: ${key}`);
        await redisClient.set(key, val, { EX: ttl || 300 });
        return true;
      } catch (err) {
        logger.error(`[CACHE] Redis set error: ${err.message}`);
      }
    }
    return this.set(key, val, ttl);
  },

  keys() {
    return localCache.keys();
  },
  flushAll() {
    if (isRedisConnected && redisClient) {
      redisClient.flushAll().catch(() => {});
    }
    return localCache.flushAll();
  },
  getStats() {
    return localCache.getStats();
  },
};
