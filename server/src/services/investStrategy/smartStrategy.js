/**
 * 估值定投策略
 * 基于指数 PE/PB 估值百分位调整定投金额
 * 用净值在历史区间的位置作为估值代理
 * 低估（后30%）→1.5倍, 正常（30%-70%）→1倍, 高估（前30%）→0.5倍
 */
const BaseStrategy = require('./baseStrategy');

class SmartStrategy extends BaseStrategy {
  constructor() {
    super('smart');
  }

  get displayName() { return '估值定投'; }
  get description() { return '基于历史估值百分位，低估时多投，高估时少投。参考PE/PB分位自动调节。'; }

  async calculate(navHistory, params) {
    const { amount, period, startDate, endDate } = params;

    const filtered = this._filterNavHistory(navHistory, startDate, endDate);
    if (filtered.length < 2) {
      return this._emptyResult(filtered);
    }

    const actualStartDate = filtered[0].date;
    const actualEndDate = filtered[filtered.length - 1].date;
    const investDates = this._generateInvestDates(actualStartDate, actualEndDate, period);

    // 计算全局 NAV 百分位
    const allNavs = filtered.map(h => h.nav).sort((a, b) => a - b);

    let totalShares = 0;
    let totalInvest = 0;
    const chartData = [];

    for (const invDate of investDates) {
      const navEntry = this._findNearestNav(filtered, invDate);
      if (!navEntry) continue;

      // 计算当前净值在历史区间的百分位（越低越便宜）
      const percentile = this._calcPercentile(allNavs, navEntry.nav);

      // 根据百分位计算倍数
      const multiple = this._getMultiple(percentile);
      const investAmount = amount * multiple;

      if (investAmount <= 0) {
        chartData.push({
          date: navEntry.date,
          nav: parseFloat(navEntry.nav.toFixed(4)),
          invest: 0,
          shares: 0,
          totalShares: parseFloat(totalShares.toFixed(4)),
          totalValue: parseFloat((totalShares * navEntry.nav).toFixed(2)),
          totalInvest,
          percentile: parseFloat(percentile.toFixed(2)),
          multiple,
        });
        continue;
      }

      const shares = investAmount / navEntry.nav;
      totalShares += shares;
      totalInvest += investAmount;

      chartData.push({
        date: navEntry.date,
        nav: parseFloat(navEntry.nav.toFixed(4)),
        invest: parseFloat(investAmount.toFixed(2)),
        shares: parseFloat(shares.toFixed(2)),
        totalShares: parseFloat(totalShares.toFixed(4)),
        totalValue: parseFloat((totalShares * navEntry.nav).toFixed(2)),
        totalInvest: parseFloat(totalInvest.toFixed(2)),
        percentile: parseFloat(percentile.toFixed(2)),
        multiple,
      });
    }

    if (chartData.length === 0) {
      return this._emptyResult(filtered, '在可用数据范围内无法匹配到有效的定投日期。');
    }

    const summary = this._computeSummary(chartData, filtered);
    const lumpSumCompare = this._computeLumpSum(filtered);

    return { summary, chartData, lumpSumCompare, strategy: 'smart' };
  }

  /**
   * 计算净值在历史区间的百分位（0-100）
   * 0 = 最低价（最便宜/低估），100 = 最高价（最贵/高估）
   */
  _calcPercentile(sortedNavs, nav) {
    if (sortedNavs.length < 2) return 50;
    const min = sortedNavs[0];
    const max = sortedNavs[sortedNavs.length - 1];
    if (max === min) return 50;

    // 统计低于当前净值的数量
    let countBelow = 0;
    for (const n of sortedNavs) {
      if (n <= nav) countBelow++;
    }
    return (countBelow / sortedNavs.length) * 100;
  }

  /**
   * 根据百分位计算倍数
   * 后30%（低估）→1.5倍
   * 30%-70%（正常）→1倍
   * 前30%（高估）→0.5倍
   * 前10%（极高估）→暂停
   */
  _getMultiple(percentile) {
    if (percentile <= 30) return 1.5;   // 低估
    if (percentile <= 70) return 1.0;   // 正常
    if (percentile <= 90) return 0.5;   // 高估
    return 0;                            // 极高估，暂停
  }

  _emptyResult(filtered, note) {
    return {
      summary: {
        totalInvest: 0, totalValue: 0, totalProfit: 0,
        totalReturn: 0, annualizedReturn: 0, maxDrawdown: 0,
        totalTimes: 0,
        startDate: filtered[0]?.date || '', endDate: filtered[filtered.length - 1]?.date || '',
        note: note || '历史净值数据不足，无法计算。',
      },
      chartData: [],
      lumpSumCompare: { totalReturn: 0, annualizedReturn: 0 },
      strategy: 'smart',
    };
  }
}

module.exports = SmartStrategy;
