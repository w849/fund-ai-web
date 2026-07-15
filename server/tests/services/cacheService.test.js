// Mock redis before requiring cacheService
jest.mock('../../src/utils/redis', () => {
  const mockRedis = {
    isReady: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    redis: {
      keys: jest.fn(),
      del: jest.fn(),
    },
    expire: jest.fn(),
    incr: jest.fn(),
    pttl: jest.fn(),
  };
  return mockRedis;
});

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

const cacheService = require('../../src/services/cacheService');
const redis = require('../../src/utils/redis');

describe('cacheService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('PREFIX 常量', () => {
    it('应包含所有前缀常量', () => {
      expect(cacheService.PREFIX).toHaveProperty('FUND_LIST');
      expect(cacheService.PREFIX).toHaveProperty('FUND_DETAIL');
      expect(cacheService.PREFIX).toHaveProperty('FUND_NAV');
      expect(cacheService.PREFIX).toHaveProperty('NAV_HISTORY');
      expect(cacheService.PREFIX).toHaveProperty('SCREENING');
      expect(cacheService.PREFIX).toHaveProperty('SMART_SELECT');
      expect(cacheService.PREFIX).toHaveProperty('HOT_LIST');
      expect(cacheService.PREFIX).toHaveProperty('AI_RECOMMEND');
    });

    it('FUND_LIST 前缀值应为 fund:list:', () => {
      expect(cacheService.PREFIX.FUND_LIST).toBe('fund:list:');
    });

    it('AI_RECOMMEND 前缀值应为 ai:recommend:', () => {
      expect(cacheService.PREFIX.AI_RECOMMEND).toBe('ai:recommend:');
    });

    it('所有 PREFIX 值应以冒号结尾', () => {
      Object.values(cacheService.PREFIX).forEach((prefix) => {
        expect(prefix).toMatch(/:$/);
      });
    });
  });

  describe('get', () => {
    it('Redis 可用时应从 Redis 获取并返回', async () => {
      redis.isReady.mockReturnValue(true);
      redis.get.mockResolvedValue({ data: 'test' });

      const result = await cacheService.get('test:key');
      expect(redis.get).toHaveBeenCalledWith('test:key');
      expect(result).toEqual({ data: 'test' });
    });

    it('Redis 返回 null 应降级到本地缓存', async () => {
      redis.isReady.mockReturnValue(true);
      redis.get.mockResolvedValue(null);

      // 先写入本地缓存
      await cacheService.set('test:key', 'local-value', 60);
      jest.clearAllMocks();

      redis.isReady.mockReturnValue(true);
      redis.get.mockResolvedValue(null);

      const result = await cacheService.get('test:key');
      expect(result).toBe('local-value');
    });

    it('Redis 不可用时应返回本地缓存内容', async () => {
      redis.isReady.mockReturnValue(false);
      await cacheService.set('test:key', 'local-value', 60);

      redis.isReady.mockReturnValue(false);
      const result = await cacheService.get('test:key');
      expect(result).toBe('local-value');
    });

    it('Redis 不可用且本地无缓存时应返回 null', async () => {
      redis.isReady.mockReturnValue(false);
      const result = await cacheService.get('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('Redis 可用时应同时写入 Redis 和本地缓存', async () => {
      redis.isReady.mockReturnValue(true);
      redis.set.mockResolvedValue(true);

      await cacheService.set('test:key', { value: 123 }, 60);
      expect(redis.set).toHaveBeenCalledWith('test:key', { value: 123 }, 60);

      // 验证本地缓存也已写入
      const localResult = await cacheService.get('test:key');
      expect(localResult).toEqual({ value: 123 });
    });

    it('Redis 不可用时仅写入本地缓存', async () => {
      redis.isReady.mockReturnValue(false);

      await cacheService.set('test:key', 'local-only', 60);
      expect(redis.set).not.toHaveBeenCalled();

      const result = await cacheService.get('test:key');
      expect(result).toBe('local-only');
    });
  });

  describe('del', () => {
    it('应删除本地缓存和 Redis 缓存', async () => {
      redis.isReady.mockReturnValue(true);
      await cacheService.set('test:key', 'value', 60);

      await cacheService.del('test:key');
      expect(redis.del).toHaveBeenCalledWith('test:key');

      const result = await cacheService.get('test:key');
      expect(result).toBeNull();
    });

    it('Redis 不可用时仅删除本地缓存', async () => {
      redis.isReady.mockReturnValue(false);
      await cacheService.set('test:key', 'value', 60);

      await cacheService.del('test:key');
      expect(redis.del).not.toHaveBeenCalled();

      const result = await cacheService.get('test:key');
      expect(result).toBeNull();
    });
  });

  describe('flushAll', () => {
    it('应清空所有本地缓存', async () => {
      redis.isReady.mockReturnValue(false);

      await cacheService.set('test:key1', 'value1', 60);
      await cacheService.set('test:key2', 'value2', 60);
      await cacheService.flushAll();

      const result1 = await cacheService.get('test:key1');
      const result2 = await cacheService.get('test:key2');
      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it('Redis 可用时应清除 Redis 中 fund:* 和 ai:* 的缓存', async () => {
      redis.isReady.mockReturnValue(true);
      redis.redis.keys
        .mockResolvedValueOnce(['fund:list:1', 'fund:detail:1'])
        .mockResolvedValueOnce(['ai:recommend:abc']);
      redis.redis.del.mockResolvedValue(3);

      await cacheService.flushAll();

      expect(redis.redis.keys).toHaveBeenCalledWith('fund:*');
      expect(redis.redis.keys).toHaveBeenCalledWith('ai:*');
      expect(redis.redis.del).toHaveBeenCalledWith(['fund:list:1', 'fund:detail:1', 'ai:recommend:abc']);
    });
  });

  describe('TTL 过期', () => {
    it('缓存应在 TTL 过期后失效', async () => {
      redis.isReady.mockReturnValue(false);

      await cacheService.set('test:ttl', 'temp', 1);

      // 立即获取应存在
      let result = await cacheService.get('test:ttl');
      expect(result).toBe('temp');

      // 等待 TTL 过期
      await new Promise((r) => setTimeout(r, 1100));

      // 过期后应为 null
      result = await cacheService.get('test:ttl');
      expect(result).toBeNull();
    }, 5000);
  });
});
