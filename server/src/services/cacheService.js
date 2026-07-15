/**
 * 统一缓存服务层
 * 优先使用 Redis，不可用时自动降级到 node-cache（兼容模式）
 * 缓存 key 统一加前缀：fund:list:xxx、fund:detail:xxx、fund:nav:xxx 等
 */
const NodeCache = require('node-cache');
const redis = require('../utils/redis');
const { logger } = require('../utils/logger');

// 本地降级缓存（Redis 不可用时使用）
const localCache = new NodeCache({ checkperiod: 600 });

// 缓存 key 前缀常量
const PREFIX = {
  FUND_LIST: 'fund:list:',
  FUND_DETAIL: 'fund:detail:',
  FUND_NAV: 'fund:nav:',
  NAV_HISTORY: 'fund:navhistory:',
  SCREENING: 'fund:screening:',
  SMART_SELECT: 'fund:smart:',
  HOT_LIST: 'fund:hot:',
  AI_RECOMMEND: 'ai:recommend:',
};

/**
 * 获取缓存值
 * @param {string} key - 完整缓存 key（含前缀）
 * @returns {*|null}
 */
async function get(key) {
  // 优先 Redis
  if (redis.isReady()) {
    try {
      const val = await redis.get(key);
      if (val !== null && val !== undefined) {
        logger.debug(`[Cache] Redis HIT: ${key}`);
        return val;
      }
    } catch (err) {
      logger.warn(`[Cache] Redis get 失败，降级到本地: ${err.message}`);
    }
  }

  // 降级到本地缓存
  const localVal = localCache.get(key);
  if (localVal !== undefined) {
    logger.debug(`[Cache] Local HIT: ${key}`);
    return localVal;
  }

  logger.debug(`[Cache] MISS: ${key}`);
  return null;
}

/**
 * 设置缓存值
 * @param {string} key - 完整缓存 key（含前缀）
 * @param {*} value - 值（自动 JSON 序列化）
 * @param {number} ttl - 过期时间（秒）
 */
async function set(key, value, ttl) {
  // 写入本地缓存
  localCache.set(key, value, ttl);

  // 异步写入 Redis（不阻塞）
  if (redis.isReady()) {
    try {
      await redis.set(key, value, ttl);
    } catch (err) {
      logger.warn(`[Cache] Redis set 失败: ${err.message}`);
    }
  }
}

/**
 * 删除缓存
 * @param {string} key - 完整缓存 key（含前缀）
 */
async function del(key) {
  localCache.del(key);
  if (redis.isReady()) {
    try {
      await redis.del(key);
    } catch (err) {
      logger.warn(`[Cache] Redis del 失败: ${err.message}`);
    }
  }
}

/**
 * 清空所有基金和 AI 相关缓存
 */
async function flushAll() {
  localCache.flushAll();
  if (redis.isReady() && redis.redis) {
    try {
      const keys = await redis.redis.keys('fund:*');
      const aiKeys = await redis.redis.keys('ai:*');
      const allKeys = [...keys, ...aiKeys];
      if (allKeys.length > 0) {
        await redis.redis.del(allKeys);
        logger.info(`[Cache] Redis 已清除 ${allKeys.length} 个缓存 key`);
      }
    } catch (err) {
      logger.warn(`[Cache] Redis flush 失败: ${err.message}`);
    }
  }
  logger.info('[Cache] 所有缓存已清除');
}

module.exports = { get, set, del, flushAll, PREFIX };
