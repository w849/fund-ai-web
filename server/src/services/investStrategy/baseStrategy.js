/**
 * 定投策略基类
 * 定义统一计算接口
 */
class BaseStrategy {
  constructor(name) {
    this.name = name || 'base';
  }

  /**
   * 策略中文名
   */
  get displayName() {
    return this.name;
  }

  /**
   * 策略描述
   */
  get description() {
    return '';
  }

  /**
   * 执行定投回测计算
   * @param {Array} navHistory - [{date, nav, accNav}]
   * @param {Object} params
   * @param {number} params.amount - 基础定投金额
   * @param {string} params.period - weekly/biweekly/monthly
   * @param {string} params.startDate
   * @param {string} params.endDate
   * @returns {Object} { summary, chartData, lumpSumCompare }
   */
  async calculate(navHistory, params) {
    throw new Error(`[${this.name}] calculate() 未实现`);
  }

  /**
   * 根据日期范围筛选净值
   */
  _filterNavHistory(navHistory, startDate, endDate) {
    const sorted = [...navHistory].sort((a, b) => new Date(a.date) - new Date(b.date));
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    return sorted.filter(h => {
      const d = new Date(h.date);
      return d >= start && d <= end;
    });
  }

  /**
   * 生成定投日期列表
   */
  _generateInvestDates(startDate, endDate, period) {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    let current = new Date(start);

    while (current <= end) {
      dates.push(new Date(current));
      if (period === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else if (period === 'biweekly') {
        current.setDate(current.getDate() + 14);
      } else {
        current.setMonth(current.getMonth() + 1);
      }
    }
    return dates;
  }

  /**
   * 找到定投日最近的净值
   */
  _findNearestNav(filtered, invDate, maxDays = 15) {
    const id = new Date(invDate);
    return filtered.find(h => {
      const hd = new Date(h.date);
      return hd >= id && (hd - id) < maxDays * 24 * 60 * 60 * 1000;
    });
  }

  /**
   * 计算最终汇总指标
   */
  _computeSummary(chartData, filtered) {
    if (!chartData || chartData.length === 0) {
      return { totalInvest: 0, totalValue: 0, totalProfit: 0, totalReturn: 0, annualizedReturn: 0, maxDrawdown: 0, totalTimes: 0 };
    }

    const lastEntry = chartData[chartData.length - 1];
    const totalValue = lastEntry.totalValue;
    const totalInvest = lastEntry.totalInvest;
    const totalProfit = totalValue - totalInvest;
    const totalReturn = totalInvest > 0 ? (totalProfit / totalInvest) * 100 : 0;

    const startDateStr = filtered[0].date;
    const endDateStr = filtered[filtered.length - 1].date;
    const years = (new Date(endDateStr) - new Date(startDateStr)) / (365.25 * 24 * 60 * 60 * 1000);
    const annualizedReturn = years > 0 && totalInvest > 0 && totalValue > 0
      ? (Math.pow(totalValue / totalInvest, 1 / years) - 1) * 100
      : 0;

    let maxDrawdown = 0;
    let peakValue = 0;
    for (const point of chartData) {
      if (point.totalValue > peakValue) peakValue = point.totalValue;
      const dd = peakValue > 0 ? (point.totalValue - peakValue) / peakValue : 0;
      if (dd < maxDrawdown) maxDrawdown = dd;
    }

    return {
      totalInvest: parseFloat(totalInvest.toFixed(2)),
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalReturn: parseFloat(totalReturn.toFixed(2)),
      annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
      maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(2)),
      totalTimes: chartData.length,
      startDate: startDateStr,
      endDate: endDateStr,
    };
  }

  /**
   * 一次性投入对比
   */
  _computeLumpSum(filtered) {
    const firstNav = filtered[0].nav;
    const lastNav = filtered[filtered.length - 1].nav;
    const startDateStr = filtered[0].date;
    const endDateStr = filtered[filtered.length - 1].date;
    const years = (new Date(endDateStr) - new Date(startDateStr)) / (365.25 * 24 * 60 * 60 * 1000);
    const lumpSumReturn = firstNav > 0 ? ((lastNav - firstNav) / firstNav) * 100 : 0;
    const lumpSumAnnualized = years > 0 ? (Math.pow(lastNav / firstNav, 1 / years) - 1) * 100 : 0;

    return {
      totalReturn: parseFloat(lumpSumReturn.toFixed(2)),
      annualizedReturn: parseFloat(lumpSumAnnualized.toFixed(2)),
    };
  }
}

module.exports = BaseStrategy;
