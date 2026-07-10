import NodeCache from 'node-cache';
import { createClient } from 'redis';
import logger from './logger.js';

const localCache = new NodeCache({ stdTTL: 300, checkperiod: 60, maxKeys: 1000 });

let redisClient = null;
let isRedisConnected = false;

if (process.env.REDIS_URL) {
  logger.info(
    `[CACHE] REDIS_URL detected: ${process.env.REDIS_URL}. Initializing distributed cache...`,
  );
  try {
    redisClient = createClient({ url: process.env.REDIS_URL });
    redisClient.on('error', (err) => {
      logger.error(`[CACHE] Redis Client Error: ${err.message}`);
    });
    redisClient
      .connect()
      .then(() => {
        isRedisConnected = true;
        logger.info(`[CACHE] Connected to Redis. Distributed cache mode active.`);
      })
      .catch((err) => {
        logger.error(`[CACHE] Redis Connection Failed: ${err.message}`);
      });
  } catch (err) {
    logger.error(`[CACHE] Redis Client initialization failed: ${err.message}`);
  }
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
        await redisClient.set(key, String(val), { EX: ttl || 300 });
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
