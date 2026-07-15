/**
 * Redis 客户端封装
 * 支持连接错误自动重连，提供常用方法封装
 */
const Redis = require('ioredis');
const { logger } = require('./logger');

const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: true,
};

let redis = null;
let isConnected = false;

try {
  redis = new Redis(REDIS_CONFIG);

  redis.on('connect', () => {
    isConnected = true;
    logger.info('Redis 连接成功');
  });

  redis.on('ready', () => {
    isConnected = true;
    logger.info('Redis 就绪');
  });

  redis.on('error', (err) => {
    isConnected = false;
    logger.warn(`Redis 连接错误: ${err.message}`);
  });

  redis.on('close', () => {
    isConnected = false;
    logger.warn('Redis 连接关闭');
  });

  redis.on('reconnecting', (delay) => {
    logger.info(`Redis 正在重连，延迟 ${delay}ms`);
  });

  // 非阻塞连接（连接失败不阻止应用启动）
  redis.connect().catch(err => {
    logger.warn(`Redis 初次连接失败，将使用本地缓存降级: ${err.message}`);
    isConnected = false;
  });
} catch (err) {
  logger.warn(`Redis 初始化失败: ${err.message}`);
  redis = null;
}

/**
 * 检查 Redis 是否就绪
 */
function isReady() {
  return redis !== null && isConnected && redis.status === 'ready';
}

/**
 * 获取缓存值（自动 JSON 反序列化）
 */
async function get(key) {
  if (!isReady()) return null;
  try {
    const val = await redis.get(key);
    if (val === null) return null;
    return JSON.parse(val);
  } catch (err) {
    logger.warn(`Redis get 失败 (key=${key}): ${err.message}`);
    return null;
  }
}

/**
 * 设置缓存值（自动 JSON 序列化）
 * @param {string} key
 * @param {*} value
 * @param {number} ttl - 过期时间（秒）
 */
async function set(key, value, ttl) {
  if (!isReady()) return false;
  try {
    const str = JSON.stringify(value);
    if (ttl && ttl > 0) {
      await redis.setex(key, ttl, str);
    } else {
      await redis.set(key, str);
    }
    return true;
  } catch (err) {
    logger.warn(`Redis set 失败 (key=${key}): ${err.message}`);
    return false;
  }
}

/**
 * 删除缓存
 */
async function del(key) {
  if (!isReady()) return false;
  try {
    await redis.del(key);
    return true;
  } catch (err) {
    logger.warn(`Redis del 失败 (key=${key}): ${err.message}`);
    return false;
  }
}

/**
 * 设置过期时间
 */
async function expire(key, ttl) {
  if (!isReady()) return false;
  try {
    await redis.expire(key, ttl);
    return true;
  } catch (err) {
    logger.warn(`Redis expire 失败 (key=${key}): ${err.message}`);
    return false;
  }
}

/**
 * 自增计数（用于限流）
 */
async function incr(key) {
  if (!isReady()) return null;
  try {
    return await redis.incr(key);
  } catch (err) {
    logger.warn(`Redis incr 失败 (key=${key}): ${err.message}`);
    return null;
  }
}

/**
 * 获取剩余过期时间（毫秒）
 */
async function pttl(key) {
  if (!isReady()) return -2;
  try {
    return await redis.pttl(key);
  } catch {
    return -2;
  }
}

module.exports = {
  redis,
  isReady,
  get,
  set,
  del,
  expire,
  incr,
  pttl,
};
