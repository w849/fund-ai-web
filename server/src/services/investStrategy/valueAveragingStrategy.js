/**
 * 价值平均策略（目标市值法）
 * 每期目标市值 = 期初目标市值 + 固定增长额
 * 涨了少投，跌了多投
 */
const BaseStrategy = require('./baseStrategy');

class ValueAveragingStrategy extends BaseStrategy {
  constructor() {
    super('value');
  }

  get displayName() { return '价值平均'; }
  get description() { return '目标市值策略，每期市值固定增长。跌了多买，涨了少买，自动低吸高抛。'; }

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
    let targetValue = 0;       // 当前目标市值
    const monthlyGrowth = amount; // 每期目标增长金额
    const chartData = [];

    for (const invDate of investDates) {
      const navEntry = this._findNearestNav(filtered, invDate);
      if (!navEntry) continue;

      // 目标市值 = 上期目标市值 + 固定增长额
      targetValue += monthlyGrowth;

      // 当前实际市值
      const currentValue = totalShares * navEntry.nav;

      // 本期需要投入金额（目标市值 - 当前市值）
      let investAmount = Math.max(0, targetValue - currentValue);

      // 限制最大投入（避免极端情况）
      const maxInvest = amount * 5;
      investAmount = Math.min(investAmount, maxInvest);

      if (investAmount <= 0) {
        // 不投入，但记录数据
        chartData.push({
          date: navEntry.date,
          nav: parseFloat(navEntry.nav.toFixed(4)),
          invest: 0,
          shares: 0,
          totalShares: parseFloat(totalShares.toFixed(4)),
          totalValue: parseFloat(currentValue.toFixed(2)),
          totalInvest,
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
      });
    }

    if (chartData.length === 0) {
      return this._emptyResult(filtered, '在可用数据范围内无法匹配到有效的定投日期。');
    }

    const summary = this._computeSummary(chartData, filtered);
    const lumpSumCompare = this._computeLumpSum(filtered);

    return { summary, chartData, lumpSumCompare, strategy: 'value' };
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
      strategy: 'value',
    };
  }
}

module.exports = ValueAveragingStrategy;
