const fundService = require('../services/fundService');
const Response = require('../utils/response');
const BusinessError = require('../utils/BusinessError');

exports.getFundList = async (req, res, next) => {
  try {
    const funds = await fundService.getFundList(req.query);
    res.json(Response.success(funds, '获取基金列表成功'));
  } catch (err) {
    next(err);
  }
};

exports.fundScreening = async (req, res, next) => {
  try {
    const result = await fundService.fundScreening(req.query);
    res.json(Response.success(result, '基金初筛成功'));
  } catch (err) {
    next(err);
  }
};

exports.smartSelect = async (req, res, next) => {
  try {
    const result = await fundService.smartSelect(req.query);
    res.json(Response.success(result, 'AI智能选基成功'));
  } catch (err) {
    next(err);
  }
};

exports.getNavHistory = async (req, res, next) => {
  try {
    const { code } = req.params;
    const history = await fundService.getNavHistory(code);
    res.json(Response.success(history, '获取历史净值成功'));
  } catch (err) {
    next(err);
  }
};

exports.getHotList = async (_req, res, next) => {
  try {
    const all = await fundService.getFundList({ sortBy: 'fundScale', sortOrder: 'desc' });
    const hot = all.slice(0, 8).map(f => ({
      code: f.code,
      name: f.name,
      nav: f.nav,
      change: f.change,
      yearReturn: f.yearReturn,
      rating: f.rating,
      type: f.type,
    }));
    res.json(Response.success(hot, '获取热门榜单成功'));
  } catch (err) {
    next(err);
  }
};

exports.getFundEstimate = async (req, res, next) => {
  try {
    const { code } = req.params;
    const dataSourceManager = require('../services/dataSource');
    const estimate = await dataSourceManager.getFundEstimate(code);
    if (!estimate) {
      return res.json(Response.success(null, '暂无估值数据'));
    }
    res.json(Response.success(estimate, '获取盘中估值成功'));
  } catch (err) {
    next(err);
  }
};

exports.getFundDetail = async (req, res, next) => {
  try {
    const { code } = req.params;
    const detail = await fundService.getFundDetail(code);
    if (!detail) {
      throw new BusinessError('基金不存在', 404);
    }
    res.json(Response.success(detail, '获取基金详情成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 多策略定投对比
 * POST /api/funds/strategy-compare
 */
exports.strategyCompare = async (req, res, next) => {
  try {
    const { code, amount, period, startDate, endDate, strategies } = req.body;

    const detail = await fundService.getFundDetail(code);
    if (!detail) {
      throw new BusinessError('基金不存在', 404);
    }

    const navHistory = await fundService.getNavHistory(code);
    if (!navHistory || navHistory.length === 0) {
      throw new BusinessError('暂无该基金的历史净值数据', 400);
    }

    const investStrategy = require('../services/investStrategy');
    const result = await investStrategy.compareStrategies(navHistory, {
      amount: parseFloat(amount),
      period: period || 'monthly',
      startDate,
      endDate,
      strategies: strategies || ['fixed', 'value', 'ma', 'smart'],
    });

    res.json(Response.success(result, '策略对比成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 定投回测
 * GET /api/funds/backtest/:code
 */
exports.fundBacktest = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { amount, period, startDate, endDate, dividendType } = req.query;

    // 1. 检查基金是否存在
    const detail = await fundService.getFundDetail(code);
    if (!detail) {
      throw new BusinessError('基金不存在', 404);
    }

    // 2. 获取历史净值
    const navHistory = await fundService.getNavHistory(code);
    if (!navHistory || navHistory.length === 0) {
      throw new BusinessError('暂无该基金的历史净值数据', 400);
    }

    // 3. 计算定投
    const result = calculateBacktest(navHistory, {
      code,
      amount: parseFloat(amount),
      period: period || 'monthly',
      startDate,
      endDate,
      dividendType: dividendType || 'reinvest',
    });

    res.json(Response.success(result, '定投回测成功'));
  } catch (err) {
    next(err);
  }
};

/**
 * 定投回测计算
 */
function calculateBacktest(navHistory, params) {
  const { amount, period, startDate, endDate } = params;

  // 按日期排序
  const sorted = [...navHistory].sort((a, b) => new Date(a.date) - new Date(b.date));

  // 筛选日期范围内的数据
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  const filtered = sorted.filter(h => {
    const d = new Date(h.date);
    return d >= start && d <= end;
  });

  if (filtered.length < 2) {
    // 数据不足时用全部数据
    const actualStart = sorted[0];
    const actualEnd = sorted[sorted.length - 1];
    return {
      summary: {
        totalInvest: 0, totalValue: 0, totalProfit: 0,
        totalReturn: 0, annualizedReturn: 0, maxDrawdown: 0,
        totalTimes: 0,
        startDate: actualStart.date, endDate: actualEnd.date,
        actualDataRange: true,
        note: `所选日期范围内历史净值数据不足（仅${filtered.length}条），无法计算定投收益。可用数据范围：${actualStart.date} ~ ${actualEnd.date}`,
      },
      chartData: [],
      lumpSumCompare: { totalReturn: 0, annualizedReturn: 0 },
    };
  }

  // 实际日期范围
  const actualStartDate = filtered[0].date;
  const actualEndDate = filtered[filtered.length - 1].date;

  // 生成定投日期
  const investDates = generateInvestDates(actualStartDate, actualEndDate, period);

  // 执行定投
  let totalShares = 0;
  let totalInvest = 0;
  const chartData = [];

  for (const invDate of investDates) {
    // 找到定投日当天或之后最近的净值
    const navEntry = filtered.find(h => {
      const hd = new Date(h.date);
      const id = new Date(invDate);
      // 定投日前15天内
      return hd >= id && (hd - id) < 15 * 24 * 60 * 60 * 1000;
    });

    if (!navEntry) continue;

    const shares = amount / navEntry.nav;
    totalShares += shares;
    totalInvest += amount;

    chartData.push({
      date: navEntry.date,
      nav: parseFloat(navEntry.nav.toFixed(4)),
      invest: amount,
      shares: parseFloat(shares.toFixed(2)),
      totalShares: parseFloat(totalShares.toFixed(4)),
      totalValue: parseFloat((totalShares * navEntry.nav).toFixed(2)),
      totalInvest: totalInvest,
    });
  }

  if (chartData.length === 0) {
    return {
      summary: {
        totalInvest: 0, totalValue: 0, totalProfit: 0,
        totalReturn: 0, annualizedReturn: 0, maxDrawdown: 0,
        totalTimes: 0, startDate: actualStartDate, endDate: actualEndDate,
        note: '在可用数据范围内无法匹配到有效的定投日期，请检查日期范围或定投周期。',
      },
      chartData: [],
      lumpSumCompare: { totalReturn: 0, annualizedReturn: 0 },
    };
  }

  // 最终价值
  const lastNav = filtered[filtered.length - 1].nav;
  const totalValue = totalShares * lastNav;
  const totalProfit = totalValue - totalInvest;
  const totalReturn = totalInvest > 0 ? (totalProfit / totalInvest) * 100 : 0;

  // 年化收益率（简化：期末/期初的几何年化）
  const years = (new Date(actualEndDate) - new Date(actualStartDate)) / (365.25 * 24 * 60 * 60 * 1000);
  const annualizedReturn = years > 0 && totalInvest > 0 && totalValue > 0
    ? (Math.pow(totalValue / totalInvest, 1 / years) - 1) * 100
    : 0;

  // 最大回撤（从累计投入角度）
  let maxDrawdown = 0;
  let peakValue = 0;
  for (const point of chartData) {
    if (point.totalValue > peakValue) peakValue = point.totalValue;
    const drawdown = peakValue > 0 ? (point.totalValue - peakValue) / peakValue : 0;
    if (drawdown < maxDrawdown) maxDrawdown = drawdown;
  }

  // 一次性投入对比
  const firstNav = filtered[0].nav;
  const lumpSumReturn = firstNav > 0 ? ((lastNav - firstNav) / firstNav) * 100 : 0;
  const lumpSumAnnualized = years > 0 ? (Math.pow(lastNav / firstNav, 1 / years) - 1) * 100 : 0;

  return {
    summary: {
      totalInvest: parseFloat(totalInvest.toFixed(2)),
      totalValue: parseFloat(totalValue.toFixed(2)),
      totalProfit: parseFloat(totalProfit.toFixed(2)),
      totalReturn: parseFloat(totalReturn.toFixed(2)),
      annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
      maxDrawdown: parseFloat((maxDrawdown * 100).toFixed(2)),
      totalTimes: chartData.length,
      startDate: actualStartDate,
      endDate: actualEndDate,
    },
    chartData,
    lumpSumCompare: {
      totalReturn: parseFloat(lumpSumReturn.toFixed(2)),
      annualizedReturn: parseFloat(lumpSumAnnualized.toFixed(2)),
    },
  };
}

/**
 * 生成定投日期列表
 */
function generateInvestDates(startDate, endDate, period) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  // 首次定投日：从 startDate 后的第一个交易日（使用 startDate 本身）
  let current = new Date(start);

  while (current <= end) {
    dates.push(new Date(current));

    if (period === 'weekly') {
      current.setDate(current.getDate() + 7);
    } else if (period === 'biweekly') {
      current.setDate(current.getDate() + 14);
    } else {
      // monthly: 下个月同一天
      current.setMonth(current.getMonth() + 1);
    }
  }

  return dates;
}
