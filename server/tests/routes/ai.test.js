// ====== 全局 Mock（在加载 app 前执行） ======
jest.mock('../../src/utils/redis', () => ({
  isReady: () => false,
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  redis: null,
  expire: jest.fn(),
  incr: jest.fn(),
  pttl: jest.fn(),
}));

jest.mock('../../src/services/websocket', () => ({
  init: jest.fn(),
  getStats: jest.fn().mockReturnValue({ clients: 0, rooms: [], uptime: 0 }),
  broadcast: jest.fn(),
  broadcastAll: jest.fn(),
  close: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  requestLogger: (req, res, next) => next(),
}));

jest.mock('../../src/jobs/fundSyncJob', () => ({
  startSchedule: jest.fn(),
  runSync: jest.fn(),
  getSyncStatus: jest.fn(),
}));

jest.mock('node-schedule', () => ({
  scheduleJob: jest.fn(),
}));

jest.mock('fund-api', () => ({
  funds: {
    auto: {
      searchFunds: jest.fn(),
      getFund: jest.fn(),
      getNavHistory: jest.fn(),
    },
  },
}));

// Mock rateLimiter 为无操作中间件
jest.mock('../../src/utils/rateLimiter', () => ({
  createRedisRateLimiter: () => (req, res, next) => next(),
}));

// Mock aiController
jest.mock('../../src/controllers/aiController', () => ({
  recommend: (req, res) => res.json({
    code: 200,
    data: {
      recommendations: [],
      top5: [],
      overall_advice: 'test',
      market_outlook: '',
    },
    msg: 'AI 智能推荐成功',
  }),
  status: (req, res) => res.json({
    code: 200,
    data: { configured: false, message: 'DeepSeek API 未配置' },
    msg: '操作成功',
  }),
}));

const request = require('supertest');
let app;

beforeAll(() => {
  process.env.PORT = '0';
  app = require('../../src/app');
});

afterAll(() => {
  delete process.env.PORT;
});

describe('GET /api/ai/status', () => {
  it('应返回 200 状态码', async () => {
    const res = await request(app).get('/api/ai/status');
    expect(res.status).toBe(200);
  });

  it('应返回 code: 200', async () => {
    const res = await request(app).get('/api/ai/status');
    expect(res.body.code).toBe(200);
  });

  it('应包含 data 字段', async () => {
    const res = await request(app).get('/api/ai/status');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('configured');
    expect(res.body.data).toHaveProperty('message');
  });

  it('应包含 msg 字段', async () => {
    const res = await request(app).get('/api/ai/status');
    expect(res.body).toHaveProperty('msg');
  });
});
