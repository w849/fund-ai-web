/**
 * Redis 滑动窗口限流器
 * 使用 Redis INCR + EXPIRE 实现，支持多实例共享限流状态
 */
const redis = require('./redis');
const { logger } = require('./logger');

/**
 * 创建 Redis 限流中间件
 * @param {Object} options
 * @param {number} options.windowMs - 时间窗口（毫秒）
 * @param {number} options.max - 窗口内最大请求数
 * @param {string} options.keyPrefix - Redis key 前缀
 * @param {string} options.message - 限流提示信息
 */
function createRedisRateLimiter(options = {}) {
  const {
    windowMs = 60 * 1000,
    max = 3,
    keyPrefix = 'rate:default:',
    message = '请求过于频繁，请稍后重试',
  } = options;

  return async function rateLimiter(req, res, next) {
    // Redis 不可用时，不限制（降级）
    if (!redis.isReady()) {
      logger.debug('[限流] Redis 不可用，跳过限流');
      return next();
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `${keyPrefix}${ip}`;

    try {
      const count = await redis.incr(key);

      // 首次请求设置过期时间
      if (count === 1) {
        await redis.expire(key, Math.ceil(windowMs / 1000));
      }

      // 获取剩余过期时间
      const ttlMs = await redis.pttl(key);
      const remaining = Math.max(0, max - count);

      // 设置响应头
      res.setHeader('X-RateLimit-Limit', max);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil((Date.now() + (ttlMs > 0 ? ttlMs : windowMs)) / 1000));

      if (count > max) {
        logger.warn(`[限流] IP ${ip} 请求超限 (${count}/${max})`);
        return res.status(429).json({
          code: 429,
          data: null,
          msg: message,
        });
      }

      next();
    } catch (err) {
      logger.warn(`[限流] Redis 操作失败，跳过限流: ${err.message}`);
      next();
    }
  };
}

module.exports = { createRedisRateLimiter };
