/**
 * 基于 fund-api 库的数据源实现
 * 作为主数据源使用
 */
const { funds } = require('fund-api');
const BaseDataSource = require('./baseDataSource');
const { logger } = require('../../utils/logger');

class FundApiDataSource extends BaseDataSource {
  constructor() {
    super('fund-api');
    this.timeout = 10000; // 10秒超时
  }

  /**
   * 带超时的 fetch 封装
   */
  async _fetchWithTimeout(promise, timeoutMs) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('请求超时')), timeoutMs || this.timeout)
    );
    return Promise.race([promise, timeout]);
  }

  async getFundDetail(code) {
    try {
      const result = await this._fetchWithTimeout(funds.auto.getFund(code));
      return result || null;
    } catch (err) {
      logger.warn(`[${this.name}] getFundDetail(${code}) 失败: ${err.message}`);
      return null;
    }
  }

  async getFundNav(code) {
    try {
      const result = await this._fetchWithTimeout(funds.auto.getFund(code));
      if (!result) return null;
      return {
        nav: result.nav,
        accNav: result.accNav,
        change: result.change,
        navDate: result.navDate,
      };
    } catch (err) {
      logger.warn(`[${this.name}] getFundNav(${code}) 失败: ${err.message}`);
      return null;
    }
  }

  async getNavHistory(code, startDate, endDate) {
    try {
      const history = await this._fetchWithTimeout(funds.auto.getNavHistory(code));
      if (!history || !Array.isArray(history)) return [];

      let result = history.map(h => ({
        date: h.date,
        nav: h.nav,
        accNav: h.accNav,
      }));

      // 按日期筛选
      if (startDate) {
        result = result.filter(h => h.date >= startDate);
      }
      if (endDate) {
        result = result.filter(h => h.date <= endDate);
      }

      return result;
    } catch (err) {
      logger.warn(`[${this.name}] getNavHistory(${code}) 失败: ${err.message}`);
      return [];
    }
  }

  async searchFunds(keyword) {
    try {
      const results = await this._fetchWithTimeout(funds.auto.searchFunds(keyword));
      return (results || []).map(f => ({
        code: f.code,
        name: f.name,
        type: f.type,
        nav: f.nav,
      }));
    } catch (err) {
      logger.warn(`[${this.name}] searchFunds(${keyword}) 失败: ${err.message}`);
      return [];
    }
  }

  async getFundRank(type, sortBy) {
    // fund-api 暂无排行榜接口，返回空
    logger.debug(`[${this.name}] getFundRank() 未实现，返回空`);
    return [];
  }

  async getMarketIndices() {
    // fund-api 暂无指数接口，返回空
    logger.debug(`[${this.name}] getMarketIndices() 未实现，返回空`);
    return [];
  }

  async getSectorRanking() {
    return [];
  }

  async getFundEstimate(code) {
    return null;
  }

  async getMarketOverview() {
    return null;
  }
}

module.exports = FundApiDataSource;
