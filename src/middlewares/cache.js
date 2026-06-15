const redisClient = require('../config/redis');
const logger = require('../config/logger');

/**
 * Redis Cache Middleware
 * 
 * @param {number} duration - Cache duration in seconds
 * @param {boolean} isPersonalized - Whether to include userId in key (default true)
 */
const cache = (duration, isPersonalized = true) => {
  return async (req, res, next) => {
    // Shudhu GET request cache korbo (POST/PATCH/DELETE cache kora jay na)
    if (req.method !== 'GET') {
      return next();
    }

    // Key creation: URL
    let key = `cache:${req.originalUrl || req.url}`;
    
    // Logic: Personalized route hole User ID add korbo key-te
    if (isPersonalized && req.user && req.user.id) {
      key = `${key}:user:${req.user.id}`;
    }

    try {
      // Step 1: Redis theke data khujo
      const cachedData = await redisClient.get(key);
      
      if (cachedData) {
        // Step 2: Data paile seta Parse kore direct pathiye dao (Fast!)
        logger.info(`[Redis] Cache hit for key: ${key}`);
        return res.status(200).send(JSON.parse(cachedData));
      }

      // Step 3: Data na paile, original response pathanor somoy seta save korar jugari koro
      res.originalSend = res.send;
      res.send = (body) => {
        res.originalSend(body); // User-ke data pathiye dao
        
        // Response 200 (Success) holei shudhu cache korbo
        if (res.statusCode === 200) {
          try {
            const dataToCache = typeof body === 'string' ? body : JSON.stringify(body);
            // Redis-e save koro 'duration' somoyer jonno
            redisClient.setEx(key, duration, dataToCache);
            logger.info(`[Redis] Cache set for key: ${key} (TTL: ${duration}s)`);
          } catch (err) {
            logger.error('[Redis] Error caching response', err);
          }
        }
      };

      next(); // Controller-e pathao DB theke data ante
    } catch (err) {
      logger.error('[Redis] Cache Middleware Error', err);
      next(); // Redis fail korle DB theke data anbe (Safe fallback)
    }
  };
};

/**
 * Clear cache by pattern
 * 
 * Logic:
 * Data update hole purono cache delete korte hoy, nahole user stale data pabe.
 * @param {string} pattern - Key-er pattern (e.g., 'cache:/api/v1/app/categories*')
 */
const clearCache = async (pattern) => {
  try {
    // Pattern diye shob match kora key khuje ber koro
    const keys = await redisClient.keys(pattern);
    if (keys && keys.length > 0) {
      // Paile delete kore dao
      await redisClient.del(keys);
      logger.info(`[Redis] Cleared cache for pattern: ${pattern} (${keys.length} keys removed)`);
    } else {
      logger.info(`[Redis] No cache keys found for pattern: ${pattern}`);
    }
  } catch (err) {
    logger.error(`[Redis] Error clearing cache for pattern ${pattern}`, err);
  }
};

module.exports = {
  cache,
  clearCache,
};
