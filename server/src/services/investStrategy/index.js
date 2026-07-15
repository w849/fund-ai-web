/**
 * 定投策略管理器
 */
const FixedAmountStrategy = require('./fixedAmountStrategy');
const ValueAveragingStrategy = require('./valueAveragingStrategy');
const MAStrategy = require('./maStrategy');
const SmartStrategy = require('./smartStrategy');

// 所有策略实例
const strategies = {
  fixed: new FixedAmountStrategy(),
  value: new ValueAveragingStrategy(),
  ma: new MAStrategy(),
  smart: new SmartStrategy(),
};

/**
 * 获取指定策略
 */
function getStrategy(name) {
  return strategies[name] || null;
}

/**
 * 获取所有策略列表
 */
function getAllStrategies() {
  return Object.entries(strategies).map(([key, s]) => ({
    key,
    name: s.displayName,
    description: s.description,
  }));
}

/**
 * 执行多策略对比
 * @param {Array} navHistory - 净值数据
 * @param {Object} params - 定投参数
 * @param {string[]} params.strategies - 要执行的策略列表
 * @returns {Object} { strategies: {...}, comparison: {...} }
 */
async function compareStrategies(navHistory, params) {
  const { strategies: selectedKeys = ['fixed', 'value', 'ma', 'smart'] } = params;
  const results = {};

  for (const key of selectedKeys) {
    const strategy = getStrategy(key);
    if (!strategy) continue;
    results[key] = await strategy.calculate(navHistory, params);
  }

  // 计算对比结论
  const comparison = computeComparison(results);

  return { strategies: results, comparison };
}

/**
 * 计算策略对比结论
 */
function computeComparison(results) {
  let bestReturn = -Infinity;
  let bestReturnKey = null;
  let bestDrawdown = Infinity;
  let bestDrawdownKey = null;
  let lowestInvest = Infinity;
  let lowestInvestKey = null;

  for (const [key, result] of Object.entries(results)) {
    const s = result.summary;
    if (!s || s.totalTimes === 0) continue;

    if (s.totalReturn > bestReturn) {
      bestReturn = s.totalReturn;
      bestReturnKey = key;
    }
    if (s.maxDrawdown < bestDrawdown) {
      bestDrawdown = s.maxDrawdown;
      bestDrawdownKey = key;
    }
    if (s.totalInvest < lowestInvest) {
      lowestInvest = s.totalInvest;
      lowestInvestKey = key;
    }
  }

  return {
    winner_ret: bestReturnKey,
    bestReturn: bestReturn === -Infinity ? 0 : parseFloat(bestReturn.toFixed(2)),
    winner_drawdown: bestDrawdownKey,
    bestDrawdown: bestDrawdown === Infinity ? 0 : parseFloat(bestDrawdown.toFixed(2)),
    winner_cost: lowestInvestKey,
    lowestInvest: lowestInvest === Infinity ? 0 : parseFloat(lowestInvest.toFixed(2)),
    strategyCount: Object.keys(results).length,
  };
}

module.exports = {
  getStrategy,
  getAllStrategies,
  compareStrategies,
};
