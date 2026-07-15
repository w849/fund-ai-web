/**
 * 数据源抽象基类
 * 定义所有数据源必须实现的统一接口
 */
class BaseDataSource {
  constructor(name) {
    this.name = name || 'BaseDataSource';
  }

  /**
   * 获取基金基本信息
   * @param {string} code - 基金代码
   * @returns {Promise<Object|null>}
   */
  async getFundDetail(code) {
    throw new Error(`[${this.name}] getFundDetail() 未实现`);
  }

  /**
   * 获取基金最新净值
   * @param {string} code - 基金代码
   * @returns {Promise<Object|null>}
   */
  async getFundNav(code) {
    throw new Error(`[${this.name}] getFundNav() 未实现`);
  }

  /**
   * 获取历史净值
   * @param {string} code - 基金代码
   * @param {string} [startDate] - 开始日期 YYYY-MM-DD
   * @param {string} [endDate] - 结束日期 YYYY-MM-DD
   * @returns {Promise<Array>}
   */
  async getNavHistory(code, startDate, endDate) {
    throw new Error(`[${this.name}] getNavHistory() 未实现`);
  }

  /**
   * 搜索基金
   * @param {string} keyword - 搜索关键字
   * @returns {Promise<Array>}
   */
  async searchFunds(keyword) {
    throw new Error(`[${this.name}] searchFunds() 未实现`);
  }

  /**
   * 获取基金排行榜
   * @param {string} type - 基金类型
   * @param {string} sortBy - 排序字段
   * @returns {Promise<Array>}
   */
  async getFundRank(type, sortBy) {
    throw new Error(`[${this.name}] getFundRank() 未实现`);
  }

  /**
   * 获取主要市场指数行情
   * @returns {Promise<Array>}
   */
  async getMarketIndices() {
    throw new Error(`[${this.name}] getMarketIndices() 未实现`);
  }

  /**
   * 获取板块涨跌排行
   * @returns {Promise<Array>}
   */
  async getSectorRanking() {
    throw new Error(`[${this.name}] getSectorRanking() 未实现`);
  }

  /**
   * 获取基金盘中估值
   * @param {string} code - 基金代码
   * @returns {Promise<Object|null>}
   */
  async getFundEstimate(code) {
    throw new Error(`[${this.name}] getFundEstimate() 未实现`);
  }

  /**
   * 获取市场概览数据
   * @returns {Promise<Object>}
   */
  async getMarketOverview() {
    throw new Error(`[${this.name}] getMarketOverview() 未实现`);
  }
}

module.exports = BaseDataSource;
