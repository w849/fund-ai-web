jest.mock('../../src/services/cacheService');

jest.mock('fund-api', () => ({
  funds: {
    auto: {
      searchFunds: jest.fn(),
      getFund: jest.fn(),
      getNavHistory: jest.fn(),
    },
  },
}));

const fundService = require('../../src/services/fundService');

describe('fundService', () => {
  it('应是一个对象', () => {
    expect(fundService).toBeInstanceOf(Object);
    expect(typeof fundService).toBe('object');
  });

  it('应导出 getFundList 方法', () => {
    expect(fundService).toHaveProperty('getFundList');
    expect(typeof fundService.getFundList).toBe('function');
  });

  it('应导出 getFundDetail 方法', () => {
    expect(fundService).toHaveProperty('getFundDetail');
    expect(typeof fundService.getFundDetail).toBe('function');
  });

  it('应导出 getNavHistory 方法', () => {
    expect(fundService).toHaveProperty('getNavHistory');
    expect(typeof fundService.getNavHistory).toBe('function');
  });

  it('应导出 fundScreening 方法', () => {
    expect(fundService).toHaveProperty('fundScreening');
    expect(typeof fundService.fundScreening).toBe('function');
  });

  it('应导出 smartSelect 方法', () => {
    expect(fundService).toHaveProperty('smartSelect');
    expect(typeof fundService.smartSelect).toBe('function');
  });

  it('getFundList 应返回数组', async () => {
    // getFundList relies on fund-api and funds.json, so we just verify it resolves
    // Without real data, it may return an empty array or throw
    const result = await fundService.getFundList({});
    expect(Array.isArray(result)).toBe(true);
  });
});
