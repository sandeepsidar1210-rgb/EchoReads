const Redis = require('ioredis');

let redis = null;
let isRedisAvailable = false;

// Initialize Redis client gracefully
try {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  
  // We configure ioredis with strict timeout limits and minimal retries so it fails fast if Redis is down
  redis = new Redis(redisUrl, {
    maxRetriesPerRequest: 1,
    connectTimeout: 1000,
    retryStrategy(times) {
      if (times > 1) {
        // Stop retrying quickly to fallback to DB
        return null;
      }
      return 50; 
    }
  });

  redis.on('error', (err) => {
    if (isRedisAvailable) {
      console.warn('⚠️ Redis client connection lost. Falling back to direct database queries.');
      isRedisAvailable = false;
    }
  });

  redis.on('connect', () => {
    console.log('🚀 Redis cache connected successfully.');
    isRedisAvailable = true;
  });
} catch (err) {
  console.warn('⚠️ Failed to initialize Redis client. Caching is disabled.');
  redis = null;
  isRedisAvailable = false;
}

/**
 * Get a value from cache
 */
async function get(key) {
  if (!isRedisAvailable || !redis) return null;
  try {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    return null;
  }
}

/**
 * Set a value in cache with a TTL (Time To Live)
 */
async function set(key, value, ttlSeconds = 300) {
  if (!isRedisAvailable || !redis) return false;
  try {
    const serialized = JSON.stringify(value);
    await redis.set(key, serialized, 'EX', ttlSeconds);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Delete a key from cache
 */
async function del(key) {
  if (!isRedisAvailable || !redis) return false;
  try {
    await redis.del(key);
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Flush keys matching a pattern
 */
async function flushPattern(pattern) {
  if (!isRedisAvailable || !redis) return false;
  try {
    const keys = await redis.keys(pattern);
    if (keys && keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  get,
  set,
  del,
  flushPattern,
  get isAvailable() { return isRedisAvailable; }
};
