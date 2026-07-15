/**
 * 数据源管理器
 * 支持主备数据源切换，自动降级
 */
const FundApiDataSource = require('./fundApiDataSource');
const EastMoneyDataSource = require('./eastmoneyDataSource');
const { logger } = require('../../utils/logger');

class DataSourceManager {
  constructor() {
    // 按优先级排列的数据源（索引越小优先级越高）
    this.sources = [
      { instance: new FundApiDataSource(), name: 'fund-api', priority: 1 },
      { instance: new EastMoneyDataSource(), name: 'eastmoney', priority: 2 },
    ];

    // 数据源健康状态
    this.healthMap = {};
    this.sources.forEach(s => { this.healthMap[s.name] = true; });
  }

  /**
   * 获取所有数据源实例
   */
  getAll() {
    return this.sources.map(s => s.instance);
  }

  /**
   * 获取主数据源（优先级最高且健康）
   */
  getPrimary() {
    for (const s of this.sources) {
      if (this.healthMap[s.name] !== false) {
        return s.instance;
      }
    }
    // 全部不可用，返回第一个
    return this.sources[0].instance;
  }

  /**
   * 标记数据源为不可用
   */
  markUnhealthy(name) {
    if (this.healthMap[name] !== false) {
      this.healthMap[name] = false;
      logger.warn(`[数据源] ${name} 已标记为不可用`);
      // 30分钟后自动恢复
      setTimeout(() => {
        this.healthMap[name] = true;
        logger.info(`[数据源] ${name} 已自动恢复`);
      }, 30 * 60 * 1000);
    }
  }

  /**
   * 带降级的方法调用
   * 依次尝试各数据源，直至成功
   * @param {string} method - 方法名
   * @param {Array} args - 参数列表
   * @param {*} fallbackValue - 全部失败时的降级返回值
   */
  async executeWithFallback(method, args = [], fallbackValue = null) {
    let lastError = null;

    for (const source of this.sources) {
      if (this.healthMap[source.name] === false) {
        logger.debug(`[数据源] ${source.name} 已标记不可用，跳过`);
        continue;
      }

      try {
        const result = await source.instance[method](...args);
        if (result !== null && result !== undefined) {
          logger.debug(`[数据源] ${source.name}.${method}() 成功`);
          return result;
        }
      } catch (err) {
        lastError = err;
        logger.warn(`[数据源] ${source.name}.${method}() 失败: ${err.message}`);
        this.markUnhealthy(source.name);
      }
    }

    logger.warn(`[数据源] 所有数据源 ${method}() 均失败，使用降级数据`);
    return fallbackValue;
  }

  // ===== 便捷方法 =====

  async getFundDetail(code) {
    return this.executeWithFallback('getFundDetail', [code], null);
  }

  async getFundNav(code) {
    return this.executeWithFallback('getFundNav', [code], null);
  }

  async getNavHistory(code, startDate, endDate) {
    return this.executeWithFallback('getNavHistory', [code, startDate, endDate], []);
  }

  async searchFunds(keyword) {
    return this.executeWithFallback('searchFunds', [keyword], []);
  }

  async getFundRank(type, sortBy) {
    return this.executeWithFallback('getFundRank', [type, sortBy], []);
  }

  async getMarketIndices() {
    // 优先使用 eastmoney 获取实时行情
    const em = this.sources[1].instance; // eastmoney
    try {
      const result = await em.getMarketIndices();
      if (result && result.length > 0) return result;
    } catch {
      // ignore
    }
    // 降级 fund-api
    try {
      return await this.sources[0].instance.getMarketIndices();
    } catch {
      return em._getFallbackIndices();
    }
  }

  async getSectorRanking() {
    const em = this.sources[1].instance;
    try {
      const result = await em.getSectorRanking();
      if (result && result.length > 0) return result;
    } catch {
      // ignore
    }
    return em._getFallbackSectors();
  }

  async getFundEstimate(code) {
    const em = this.sources[1].instance;
    try {
      return await em.getFundEstimate(code);
    } catch {
      return null;
    }
  }

  async getMarketOverview() {
    const em = this.sources[1].instance;
    try {
      return await em.getMarketOverview();
    } catch {
      return {
        indices: em._getFallbackIndices(),
        hotSectors: em._getFallbackSectors(),
        updateTime: new Date().toISOString(),
      };
    }
  }

  /**
   * 获取数据源健康状态
   */
  getHealthStatus() {
    const status = {};
    this.sources.forEach(s => {
      status[s.name] = this.healthMap[s.name] ? 'healthy' : 'unhealthy';
    });
    return status;
  }
}

// 单例
const manager = new DataSourceManager();

module.exports = manager;
