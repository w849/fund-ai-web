/**
 * 均线定投策略
 * 基于净值与均线的偏离度调整定投金额
 * 偏离度分档：<-10%→2倍, -5%~-10%→1.5倍, ±5%→1倍, >5%→0.5倍, >10%→暂停
 */
const BaseStrategy = require('./baseStrategy');

class MAStrategy extends BaseStrategy {
  constructor() {
    super('ma');
  }

  get displayName() { return '均线定投'; }
  get description() { return '参考指数均线，净值低于均线多投，高于均线少投。MA200作为参考基准。'; }

  async calculate(navHistory, params) {
    const { amount, period, startDate, endDate, maPeriod } = params;
    const ma = maPeriod || 200; // 默认 MA200

    const filtered = this._filterNavHistory(navHistory, startDate, endDate);
    if (filtered.length < 2) {
      return this._emptyResult(filtered);
    }

    const actualStartDate = filtered[0].date;
    const actualEndDate = filtered[filtered.length - 1].date;
    const investDates = this._generateInvestDates(actualStartDate, actualEndDate, period);

    // 先计算均线
    const maValues = this._calcMA(filtered, ma);

    let totalShares = 0;
    let totalInvest = 0;
    const chartData = [];

    for (const invDate of investDates) {
      const navEntry = this._findNearestNav(filtered, invDate);
      if (!navEntry) continue;

      // 获取当日均线值
      const maVal = this._getMAValue(maValues, navEntry.date) || 0;
      const deviation = maVal > 0 ? ((navEntry.nav - maVal) / maVal) * 100 : 0;

      // 根据偏离度计算倍数
      const multiple = this._getMultiple(deviation);
      const investAmount = amount * multiple;

      if (investAmount <= 0) {
        // 暂停投入
        chartData.push({
          date: navEntry.date,
          nav: parseFloat(navEntry.nav.toFixed(4)),
          invest: 0,
          shares: 0,
          totalShares: parseFloat(totalShares.toFixed(4)),
          totalValue: parseFloat((totalShares * navEntry.nav).toFixed(2)),
          totalInvest,
          deviation: parseFloat(deviation.toFixed(2)),
          maValue: parseFloat(maVal.toFixed(4)),
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
        deviation: parseFloat(deviation.toFixed(2)),
        maValue: parseFloat(maVal.toFixed(4)),
        multiple,
      });
    }

    if (chartData.length === 0) {
      return this._emptyResult(filtered, '在可用数据范围内无法匹配到有效的定投日期。');
    }

    const summary = this._computeSummary(chartData, filtered);
    const lumpSumCompare = this._computeLumpSum(filtered);

    return { summary, chartData, lumpSumCompare, strategy: 'ma' };
  }

  /**
   * 计算移动平均线
   */
  _calcMA(filtered, period) {
    const result = [];
    for (let i = 0; i < filtered.length; i++) {
      if (i < period - 1) {
        result.push({ date: filtered[i].date, ma: null });
        continue;
      }
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) {
        sum += filtered[j].nav;
      }
      result.push({ date: filtered[i].date, ma: sum / period });
    }
    return result;
  }

  /**
   * 获取某日的均线值
   */
  _getMAValue(maValues, date) {
    const entry = maValues.find(m => m.date === date);
    return entry ? entry.ma : null;
  }

  /**
   * 根据偏离度计算倍数
   */
  _getMultiple(deviation) {
    if (deviation < -10) return 2.0;
    if (deviation < -5) return 1.5;
    if (deviation <= 5) return 1.0;
    if (deviation <= 10) return 0.5;
    return 0; // >10% 暂停
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
      strategy: 'ma',
    };
  }
}

module.exports = MAStrategy;
