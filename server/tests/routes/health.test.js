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

const request = require('supertest');
let app;

beforeAll(() => {
  // 使用随机端口避免冲突
  process.env.PORT = '0';
  app = require('../../src/app');
});

afterAll(() => {
  // 清理
  delete process.env.PORT;
});

describe('GET /api/health', () => {
  it('应返回 200 状态码', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
  });

  it('应返回 code: 200', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.code).toBe(200);
  });

  it('应包含 status 字段', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('status');
    expect(res.body.data.status).toBe('ok');
  });

  it('应包含 uptime 字段且为数字', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.data).toHaveProperty('uptime');
    expect(typeof res.body.data.uptime).toBe('number');
  });

  it('应包含 redis 字段', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.data).toHaveProperty('redis');
    // 由于 mock 了 redis，isReady 返回 false
    expect(res.body.data.redis).toBe('disconnected');
  });

  it('应包含 msg 字段', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body).toHaveProperty('msg');
  });
});

describe('404 路由', () => {
  it('访问不存在的接口应返回 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });

  it('404 返回的 body.code 应为 404', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.body.code).toBe(404);
  });

  it('404 返回的 body.msg 应包含接口路径', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.body.msg).toContain('/api/nonexistent');
  });
});
