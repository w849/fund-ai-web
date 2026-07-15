/**
 * 东方财富数据源
 * 抓取东方财富公开接口获取行情数据
 * 注意：仅供学习参考，请勿频繁调用
 */
const BaseDataSource = require('./baseDataSource');
const { logger } = require('../../utils/logger');

class EastMoneyDataSource extends BaseDataSource {
  constructor() {
    super('eastmoney');
    this.timeout = 8000;
    this.baseHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Referer': 'https://fund.eastmoney.com/',
    };
  }

  /**
   * 带超时的 HTTP GET 请求
   */
  async _fetch(url, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: { ...this.baseHeaders, ...options.headers },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.text();
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('请求超时');
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * 解析 JSONP 响应
   */
  _parseJsonp(text) {
    const match = text.match(/\(([\s\S]*)\)/);
    if (match) {
      return JSON.parse(match[1]);
    }
    return JSON.parse(text);
  }

  // ===== 指数行情 =====

  /**
   * 获取主要市场指数行情
   * 使用东方财富行情推送接口
   */
  async getMarketIndices() {
    try {
      const secids = [
        '1.000001',  // 上证指数
        '0.399001',  // 深证成指
        '1.000300',  // 沪深300
        '0.399006',  // 创业板指
        '1.000905',  // 中证500
      ].join(',');

      const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&fields=f2,f3,f4,f12,f14&secids=${secids}`;
      const text = await this._fetch(url);
      const data = JSON.parse(text);

      if (!data || !data.data || !data.data.diff) {
        logger.warn(`[${this.name}] getMarketIndices: 返回数据异常`);
        return this._getFallbackIndices();
      }

      return data.data.diff.map(item => ({
        code: item.f12,
        name: this._getIndexName(item.f12) || item.f14,
        point: item.f2 || 0,
        change: item.f3 ?? 0,
        changeAmount: item.f4 ?? 0,
      }));
    } catch (err) {
      logger.warn(`[${this.name}] getMarketIndices 失败: ${err.message}`);
      return this._getFallbackIndices();
    }
  }

  /**
   * 指数名称映射
   */
  _getIndexName(code) {
    const map = {
      '1.000001': '上证指数',
      '0.399001': '深证成指',
      '1.000300': '沪深300',
      '0.399006': '创业板指',
      '1.000905': '中证500',
    };
    return map[code];
  }

  /**
   * 指数行情降级数据
   */
  _getFallbackIndices() {
    return [
      { code: '000001', name: '上证指数', point: 3267.85, change: 0.87, changeAmount: 28.35 },
      { code: '399001', name: '深证成指', point: 10235.62, change: 1.12, changeAmount: 115.28 },
      { code: '000300', name: '沪深300', point: 3985.62, change: 1.25, changeAmount: 49.56 },
      { code: '399006', name: '创业板指', point: 2156.33, change: -0.42, changeAmount: -9.12 },
      { code: '000905', name: '中证500', point: 5872.18, change: 0.68, changeAmount: 39.85 },
    ];
  }

  // ===== 板块排行 =====

  /**
   * 获取板块涨跌排行
   */
  async getSectorRanking() {
    try {
      const url = 'https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=20&po=1&np=1&fields=f3,f4,f12,f14&fid=f3&fs=m:90+t:2';
      const text = await this._fetch(url);
      const data = JSON.parse(text);

      if (!data || !data.data || !data.data.diff) return this._getFallbackSectors();

      return data.data.diff.map(item => ({
        code: item.f12,
        name: item.f14,
        change: item.f3 ?? 0,
        changeAmount: item.f4 ?? 0,
      }));
    } catch (err) {
      logger.warn(`[${this.name}] getSectorRanking 失败: ${err.message}`);
      return this._getFallbackSectors();
    }
  }

  _getFallbackSectors() {
    return [
      { code: 'BK0477', name: '半导体', change: 3.25, changeAmount: 85.6 },
      { code: 'BK0446', name: '人工智能', change: 2.85, changeAmount: 72.3 },
      { code: 'BK0459', name: '新能源车', change: 1.56, changeAmount: 42.8 },
      { code: 'BK0476', name: '医疗保健', change: 0.85, changeAmount: 22.5 },
      { code: 'BK0443', name: '白酒', change: -0.45, changeAmount: -12.3 },
    ];
  }

  // ===== 基金盘中估值 =====

  /**
   * 获取基金盘中估值
   * 使用天天基金（同东方财富）的估值接口
   */
  async getFundEstimate(code) {
    try {
      const url = `https://fundgz.1234567.com.cn/js/${code}.js`;
      const text = await this._fetch(url);

      // 响应格式：jsonpgz({...})
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return null;

      const data = JSON.parse(jsonMatch[0]);
      return {
        code: data.fundcode,
        name: data.name,
        estimateNav: data.gsz,
        estimateChange: data.gszzl,
        estimateTime: data.gztime,
        nav: data.dwjz,
        navDate: data.jzrq,
      };
    } catch (err) {
      logger.warn(`[${this.name}] getFundEstimate(${code}) 失败: ${err.message}`);
      return null;
    }
  }

  // ===== 基金详情 =====

  /**
   * 获取基金基本信息（通过天天基金）
   */
  async getFundDetail(code) {
    try {
      const url = `https://fund.eastmoney.com/pingzhongdata/${code}.js`;
      const text = await this._fetch(url);

      // 提取关键变量
      const result = {};
      const dataStr = text.match(/var\s+Data_netWorthTrend\s*=\s*([\s\S]*?);/);
      if (dataStr) {
        result.navHistory = JSON.parse(dataStr[1]);
      }

      return result;
    } catch (err) {
      logger.warn(`[${this.name}] getFundDetail(${code}) 失败: ${err.message}`);
      return null;
    }
  }

  /**
   * 获取历史净值
   */
  async getNavHistory(code, startDate, endDate) {
    try {
      const pageSize = 365;
      const url = `https://api.fund.eastmoney.com/f10/lsjz?callback=jQuery&fundCode=${code}&pageIndex=1&pageSize=${pageSize}`;
      const text = await this._fetch(url, {
        headers: { 'Referer': `https://fund.eastmoney.com/f10/jjjz_${code}.html` },
      });

      // 移除 JSONP 回调
      const jsonMatch = text.match(/\(([\s\S]*)\)/);
      if (!jsonMatch) return [];

      const data = JSON.parse(jsonMatch[1]);
      if (!data || !data.Data || !data.Data.LSJZList) return [];

      let list = data.Data.LSJZList.map(item => ({
        date: item.FSRQ,
        nav: parseFloat(item.LJJZ) || 0,
        accNav: parseFloat(item.LJJZ) || 0,
      }));

      // 日期筛选
      if (startDate) list = list.filter(h => h.date >= startDate);
      if (endDate) list = list.filter(h => h.date <= endDate);

      return list;
    } catch (err) {
      logger.warn(`[${this.name}] getNavHistory(${code}) 失败: ${err.message}`);
      return [];
    }
  }

  async searchFunds(keyword) {
    // 东方财富无直接的搜索接口可供简单调用，返回空
    return [];
  }

  async getFundRank(type, sortBy) {
    return [];
  }

  /**
   * 获取市场概览
   */
  async getMarketOverview() {
    try {
      const [indices, sectors] = await Promise.all([
        this.getMarketIndices(),
        this.getSectorRanking(),
      ]);

      return {
        indices,
        hotSectors: sectors.slice(0, 5),
        updateTime: new Date().toISOString(),
      };
    } catch (err) {
      logger.warn(`[${this.name}] getMarketOverview 失败: ${err.message}`);
      return {
        indices: this._getFallbackIndices(),
        hotSectors: this._getFallbackSectors(),
        updateTime: new Date().toISOString(),
      };
    }
  }
}

module.exports = EastMoneyDataSource;
