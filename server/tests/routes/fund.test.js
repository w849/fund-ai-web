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

// Mock fundController 以返回固定数据
const mockFundListData = [
  { code: '000001', name: '测试基金A', nav: 1.5, yearReturn: 12.5, type: '混合型' },
  { code: '000002', name: '测试基金B', nav: 2.0, yearReturn: 8.3, type: '股票型' },
];

jest.mock('../../src/controllers/fundController', () => ({
  getFundList: (req, res) => res.json({ code: 200, data: mockFundListData, msg: '获取基金列表成功' }),
  fundScreening: (req, res) => res.json({ code: 200, data: mockFundListData, msg: '基金初筛成功' }),
  smartSelect: (req, res) => res.json({ code: 200, data: mockFundListData, msg: 'AI智能选基成功' }),
  getNavHistory: (req, res) => res.json({ code: 200, data: [], msg: '获取历史净值成功' }),
  getHotList: (req, res) => res.json({ code: 200, data: mockFundListData, msg: '获取热门榜单成功' }),
  getFundDetail: (req, res) => res.json({ code: 200, data: mockFundListData[0], msg: '获取基金详情成功' }),
  getFundEstimate: (req, res) => res.json({ code: 200, data: null, msg: '暂无估值数据' }),
  fundBacktest: (req, res) => res.json({ code: 200, data: {}, msg: '定投回测成功' }),
  strategyCompare: (req, res) => res.json({ code: 200, data: {}, msg: '策略对比成功' }),
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

describe('GET /api/funds', () => {
  it('应返回 200 状态码', async () => {
    const res = await request(app).get('/api/funds');
    expect(res.status).toBe(200);
  });

  it('应返回基金列表数据', async () => {
    const res = await request(app).get('/api/funds');
    expect(res.body.code).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('应支持 keyword 查询参数', async () => {
    const res = await request(app).get('/api/funds?keyword=测试');
    expect(res.status).toBe(200);
  });
});

describe('GET /api/funds 参数校验', () => {
  it('无效的 sortBy 应返回 400', async () => {
    const res = await request(app).get('/api/funds?sortBy=invalid');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
  });

  it('无效的 sortOrder 应返回 400', async () => {
    const res = await request(app).get('/api/funds?sortOrder=invalid');
    expect(res.status).toBe(400);
  });

  it('minRating 超出范围应返回 400', async () => {
    const res = await request(app).get('/api/funds?minRating=10');
    expect(res.status).toBe(400);
  });
});

describe('GET /api/funds/hot-list', () => {
  it('应返回 200', async () => {
    const res = await request(app).get('/api/funds/hot-list');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
  });
});

describe('GET /api/funds/:code', () => {
  it('有效的 code 应返回 200', async () => {
    const res = await request(app).get('/api/funds/000001');
    expect(res.status).toBe(200);
    expect(res.body.code).toBe(200);
  });

  it('过短的 code 应返回 400', async () => {
    const res = await request(app).get('/api/funds/123');
    expect(res.status).toBe(400);
    expect(res.body.code).toBe(400);
  });
});

describe('GET /api/funds/smart-select', () => {
  it('应返回 200', async () => {
    const res = await request(app).get('/api/funds/smart-select');
    expect(res.status).toBe(200);
  });
});
