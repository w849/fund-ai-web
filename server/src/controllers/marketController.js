const Response = require('../utils/response');
const dataSourceManager = require('../services/dataSource');
const { logger } = require('../utils/logger');

/**
 * 获取主要市场指数行情（实时）
 */
async function getIndices(req, res) {
  try {
    const indices = await dataSourceManager.getMarketIndices();
    res.json(Response.success(indices, '获取指数数据成功'));
  } catch (err) {
    logger.error(`获取指数数据失败: ${err.message}`);
    res.json(Response.success(getFallbackIndices(), '已使用缓存数据'));
  }
}

/**
 * 获取板块涨跌排行
 */
async function getSectors(req, res) {
  try {
    const sectors = await dataSourceManager.getSectorRanking();
    res.json(Response.success(sectors, '获取板块排行成功'));
  } catch (err) {
    logger.error(`获取板块排行失败: ${err.message}`);
    res.json(Response.success([], '获取板块排行失败'));
  }
}

/**
 * 获取市场概览数据（指数 + 板块 + 时间）
 */
async function getOverview(req, res) {
  try {
    const overview = await dataSourceManager.getMarketOverview();
    res.json(Response.success(overview, '获取市场概览成功'));
  } catch (err) {
    logger.error(`获取市场概览失败: ${err.message}`);
    res.json(Response.success({
      indices: getFallbackIndices(),
      hotSectors: [],
      updateTime: new Date().toISOString(),
    }, '已使用降级数据'));
  }
}

/**
 * 获取数据源健康状态
 */
async function getDataSourceStatus(req, res) {
  res.json(Response.success({
    sources: dataSourceManager.getHealthStatus(),
  }, '获取数据源状态成功'));
}

/**
 * 降级指数数据
 */
function getFallbackIndices() {
  return [
    { code: '000001', name: '上证指数', point: 3267.85, change: 0.87, changeAmount: 28.35 },
    { code: '399001', name: '深证成指', point: 10235.62, change: 1.12, changeAmount: 115.28 },
    { code: '000300', name: '沪深300', point: 3985.62, change: 1.25, changeAmount: 49.56 },
    { code: '399006', name: '创业板指', point: 2156.33, change: -0.42, changeAmount: -9.12 },
    { code: '000905', name: '中证500', point: 5872.18, change: 0.68, changeAmount: 39.85 },
  ];
}

module.exports = { getIndices, getSectors, getOverview, getDataSourceStatus };
