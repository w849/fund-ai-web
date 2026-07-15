/**
 * 普通定额定投策略
 * 每期投入固定金额
 */
const BaseStrategy = require('./baseStrategy');

class FixedAmountStrategy extends BaseStrategy {
  constructor() {
    super('fixed');
  }

  get displayName() { return '普通定额'; }
  get description() { return '每期投入固定金额，简单稳健，适合长期投资者。'; }

  async calculate(navHistory, params) {
    const { amount, period, startDate, endDate } = params;

    const filtered = this._filterNavHistory(navHistory, startDate, endDate);
    if (filtered.length < 2) {
      return this._emptyResult(filtered);
    }

    const actualStartDate = filtered[0].date;
    const actualEndDate = filtered[filtered.length - 1].date;
    const investDates = this._generateInvestDates(actualStartDate, actualEndDate, period);

    let totalShares = 0;
    let totalInvest = 0;
    const chartData = [];

    for (const invDate of investDates) {
      const navEntry = this._findNearestNav(filtered, invDate);
      if (!navEntry) continue;

      const shares = amount / navEntry.nav;
      totalShares += shares;
      totalInvest += amount;

      chartData.push(this._makePoint(navEntry, amount, shares, totalShares, totalInvest));
    }

    if (chartData.length === 0) {
      return this._emptyResult(filtered, '在可用数据范围内无法匹配到有效的定投日期。');
    }

    const summary = this._computeSummary(chartData, filtered);
    const lumpSumCompare = this._computeLumpSum(filtered);

    return { summary, chartData, lumpSumCompare, strategy: 'fixed' };
  }

  _makePoint(navEntry, amount, shares, totalShares, totalInvest) {
    return {
      date: navEntry.date,
      nav: parseFloat(navEntry.nav.toFixed(4)),
      invest: amount,
      shares: parseFloat(shares.toFixed(2)),
      totalShares: parseFloat(totalShares.toFixed(4)),
      totalValue: parseFloat((totalShares * navEntry.nav).toFixed(2)),
      totalInvest,
    };
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
      strategy: 'fixed',
    };
  }
}

module.exports = FixedAmountStrategy;
