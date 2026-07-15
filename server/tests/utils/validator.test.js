const {
  validate,
  fundListSchema,
  smartSelectSchema,
  codeParamSchema,
  aiRecommendSchema,
  backtestSchema,
  strategyCompareSchema,
} = require('../../src/utils/validator');

describe('validate 中间件', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {}, query: {}, params: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('正常路径', () => {
    it('参数校验通过时应调用 next()', () => {
      req.query = { keyword: '基金', type: '混合型' };
      const middleware = validate(fundListSchema, 'query');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('校验通过后应使用转换后的值替换 req[source]', () => {
      req.body = { riskLevel: 'balanced' };
      const middleware = validate(smartSelectSchema, 'body');
      middleware(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.body).toEqual({ riskLevel: 'balanced' });
    });
  });

  describe('异常路径', () => {
    it('参数校验失败时应返回 400 状态码', () => {
      req.query = { sortBy: 'invalid_field' };
      const middleware = validate(fundListSchema, 'query');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalled();
    });

    it('校验失败返回的 body 应包含 code: 400', () => {
      req.params = {}; // code 必填但缺失
      const middleware = validate(codeParamSchema, 'params');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.code).toBe(400);
      expect(jsonArg).toHaveProperty('data');
      expect(jsonArg).toHaveProperty('msg');
    });

    it('校验失败时 msg 应包含 "参数校验失败:" 前缀', () => {
      req.query = { startDate: 'invalid-date' };
      const middleware = validate(backtestSchema, 'query');
      middleware(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      const jsonArg = res.json.mock.calls[0][0];
      expect(jsonArg.msg).toMatch(/^参数校验失败:/);
    });
  });
});

describe('fundListSchema', () => {
  it('空对象应通过校验', () => {
    const { error } = fundListSchema.validate({});
    expect(error).toBeUndefined();
  });

  it('有效的 keyword 应通过校验', () => {
    const { error } = fundListSchema.validate({ keyword: '沪深300' });
    expect(error).toBeUndefined();
  });

  it('keyword 超过最大长度应不通过', () => {
    const { error } = fundListSchema.validate({ keyword: 'a'.repeat(51) });
    expect(error).toBeDefined();
  });

  it('有效的 type 应通过校验', () => {
    const { error } = fundListSchema.validate({ type: '混合型' });
    expect(error).toBeUndefined();
  });

  it('有效的 sortBy 应通过校验', () => {
    const vals = ['nav', 'yearReturn', 'yearReturn3', 'monthReturn', 'quarterReturn', 'fundScale', 'fundScaleNum', 'rating', 'maxDrawdown'];
    vals.forEach((v) => {
      const { error } = fundListSchema.validate({ sortBy: v });
      expect(error).toBeUndefined();
    });
  });

  it('无效的 sortBy 应不通过', () => {
    const { error } = fundListSchema.validate({ sortBy: 'invalid' });
    expect(error).toBeDefined();
  });

  it('有效的 sortOrder 应通过校验', () => {
    const { error } = fundListSchema.validate({ sortOrder: 'asc' });
    expect(error).toBeUndefined();
  });

  it('无效的 sortOrder 应不通过', () => {
    const { error } = fundListSchema.validate({ sortOrder: 'invalid' });
    expect(error).toBeDefined();
  });

  it('minRating 超出范围应不通过', () => {
    const { error } = fundListSchema.validate({ minRating: 10 });
    expect(error).toBeDefined();
  });

  it('establishFrom 超出范围应不通过', () => {
    const { error } = fundListSchema.validate({ establishFrom: 1999 });
    expect(error).toBeDefined();
  });
});

describe('smartSelectSchema', () => {
  it('空对象应通过校验', () => {
    const { error } = smartSelectSchema.validate({});
    expect(error).toBeUndefined();
  });

  it('有效的 riskLevel 应通过', () => {
    const vals = ['conservative', 'steady', 'balanced', 'aggressive', 'radical'];
    vals.forEach((v) => {
      const { error } = smartSelectSchema.validate({ riskLevel: v });
      expect(error).toBeUndefined();
    });
  });

  it('无效的 riskLevel 应不通过', () => {
    const { error } = smartSelectSchema.validate({ riskLevel: '超高' });
    expect(error).toBeDefined();
  });

  it('有效的 budget 应通过', () => {
    const { error } = smartSelectSchema.validate({ budget: 1000 });
    expect(error).toBeUndefined();
  });

  it('负数 budget 应不通过', () => {
    const { error } = smartSelectSchema.validate({ budget: -1 });
    expect(error).toBeDefined();
  });
});

describe('codeParamSchema', () => {
  it('有效的 code 应通过', () => {
    const { error } = codeParamSchema.validate({ code: '000001' });
    expect(error).toBeUndefined();
  });

  it('code 缺失应不通过', () => {
    const { error } = codeParamSchema.validate({});
    expect(error).toBeDefined();
  });

  it('code 长度不足应不通过', () => {
    const { error } = codeParamSchema.validate({ code: '123' });
    expect(error).toBeDefined();
  });

  it('code 为空字符串应不通过', () => {
    const { error } = codeParamSchema.validate({ code: '' });
    expect(error).toBeDefined();
  });
});

describe('aiRecommendSchema', () => {
  it('空对象应通过校验', () => {
    const { error } = aiRecommendSchema.validate({});
    expect(error).toBeUndefined();
  });

  it('有效的 riskLevel 应通过', () => {
    const { error } = aiRecommendSchema.validate({ riskLevel: 'aggressive' });
    expect(error).toBeUndefined();
  });

  it('无效的 riskLevel 应不通过', () => {
    const { error } = aiRecommendSchema.validate({ riskLevel: 'invalid' });
    expect(error).toBeDefined();
  });

  it('有效的 industries 数组应通过', () => {
    const { error } = aiRecommendSchema.validate({ industries: ['科技', '消费'] });
    expect(error).toBeUndefined();
  });

  it('industries 超过最大数量应不通过', () => {
    const { error } = aiRecommendSchema.validate({ industries: ['a', 'b', 'c', 'd', 'e', 'f'] });
    expect(error).toBeDefined();
  });

  it('有效的 investStyle 应通过', () => {
    const { error } = aiRecommendSchema.validate({ investStyle: 'growth' });
    expect(error).toBeUndefined();
  });
});

describe('backtestSchema', () => {
  it('完整的有效参数应通过', () => {
    const { error } = backtestSchema.validate({
      amount: 1000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(error).toBeUndefined();
  });

  it('amount 缺失应不通过', () => {
    const { error } = backtestSchema.validate({
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(error).toBeDefined();
  });

  it('amount 小于 1 应不通过', () => {
    const { error } = backtestSchema.validate({
      amount: 0,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(error).toBeDefined();
  });

  it('startDate 缺失应不通过', () => {
    const { error } = backtestSchema.validate({
      amount: 1000,
      endDate: '2024-12-31',
    });
    expect(error).toBeDefined();
  });

  it('endDate 缺失应不通过', () => {
    const { error } = backtestSchema.validate({
      amount: 1000,
      startDate: '2024-01-01',
    });
    expect(error).toBeDefined();
  });

  it('endDate 早于 startDate 应不通过', () => {
    const { error } = backtestSchema.validate({
      amount: 1000,
      startDate: '2024-12-31',
      endDate: '2024-01-01',
    });
    expect(error).toBeDefined();
  });

  it('无效的日期格式应不通过', () => {
    const { error } = backtestSchema.validate({
      amount: 1000,
      startDate: '01-01-2024',
      endDate: '2024-12-31',
    });
    expect(error).toBeDefined();
  });

  it('有效的 period 应通过', () => {
    const { error } = backtestSchema.validate({
      amount: 1000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      period: 'weekly',
    });
    expect(error).toBeUndefined();
  });

  it('无效的 period 应不通过', () => {
    const { error } = backtestSchema.validate({
      amount: 1000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      period: 'yearly',
    });
    expect(error).toBeDefined();
  });

  it('默认 period 应为 monthly', () => {
    const { value } = backtestSchema.validate({
      amount: 1000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(value.period).toBe('monthly');
  });
});

describe('strategyCompareSchema', () => {
  it('完整的有效参数应通过', () => {
    const { error } = strategyCompareSchema.validate({
      code: '000001',
      amount: 1000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(error).toBeUndefined();
  });

  it('code 缺失应不通过', () => {
    const { error } = strategyCompareSchema.validate({
      amount: 1000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(error).toBeDefined();
  });

  it('有效的 strategies 值应通过', () => {
    const { error } = strategyCompareSchema.validate({
      code: '000001',
      amount: 1000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      strategies: ['fixed', 'value'],
    });
    expect(error).toBeUndefined();
  });

  it('无效的 strategies 值应不通过', () => {
    const { error } = strategyCompareSchema.validate({
      code: '000001',
      amount: 1000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      strategies: ['invalid'],
    });
    expect(error).toBeDefined();
  });

  it('默认 strategies 应为四种策略', () => {
    const { value } = strategyCompareSchema.validate({
      code: '000001',
      amount: 1000,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(value.strategies).toEqual(['fixed', 'value', 'ma', 'smart']);
  });
});
