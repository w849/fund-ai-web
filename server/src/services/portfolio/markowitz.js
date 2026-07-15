/**
 * Markowitz 均值-方差优化
 * 使用 numeric.js 的 solveQP 求解二次规划
 */
const numeric = require('numeric')

/**
 * 求解有效前沿上的多个点
 * @param {number[]} expectedReturns - 各资产预期年化收益率
 * @param {number[][]} covMatrix - 协方差矩阵 (n x n)
 * @param {Object} [constraints]
 * @param {number} [constraints.minWeight=0] - 单资产下限
 * @param {number} [constraints.maxWeight=0.5] - 单资产上限
 * @param {number} [points=20] - 有效前沿上点数
 * @returns {Array<{ret, risk, weights, sharpe}>}
 */
function efficientFrontier(expectedReturns, covMatrix, constraints = {}, points = 20) {
  const n = expectedReturns.length
  const { minWeight = 0, maxWeight = 0.5 } = constraints

  // 1. 最小方差组合（左端点）
  const minVarW = minVariancePortfolio(covMatrix, constraints)

  // 2. 最大收益组合（右端点）：在约束下最大化收益
  const maxRetW = Array(n).fill(minWeight)
  let rem = 1 - minWeight * n
  const sortedByRet = expectedReturns.map((r, i) => i).sort((a, b) => expectedReturns[b] - expectedReturns[a])
  for (const idx of sortedByRet) {
    if (rem <= 0) break
    const add = Math.min(rem, maxWeight - minWeight)
    maxRetW[idx] += add
    rem -= add
  }

  // 3. 在最小方差→最大收益之间进行凸组合插值
  //    有效前沿上的任意点都是两个有效组合的凸组合
  const frontier = []
  for (let k = 0; k < points; k++) {
    const alpha = k / (points - 1)  // 0~1, 从 minVar 到 maxRet
    let w = minVarW.map((v, i) => (1 - alpha) * v + alpha * maxRetW[i])

    // 裁剪 + 归一化
    w = w.map(v => Math.max(minWeight, Math.min(maxWeight, v)))
    const total = w.reduce((s, v) => s + v, 0)
    if (total > 0) {
      w = w.map(v => v / total)
    }

    const ret = portfolioReturn(expectedReturns, w)
    const risk = portfolioVolatility(covMatrix, w)
    const sharpe = risk > 1e-10 ? (ret - 0.02) / risk : 0
    frontier.push({ ret: parseFloat(ret.toFixed(4)), risk: parseFloat(risk.toFixed(4)), weights: w, sharpe: parseFloat(sharpe.toFixed(4)) })
  }

  return frontier
}

/**
 * 最小方差组合
 */
function minVariancePortfolio(covMatrix, constraints = {}) {
  const n = covMatrix.length
  const { minWeight = 0, maxWeight = 0.5 } = constraints

  // 目标：最小化 0.5 * w' Σ w
  // 约束：sum(w) = 1, minWeight ≤ w_i ≤ maxWeight
  // 二次规划形式：min 0.5 x' D x - d' x, s.t. A x ≥ b
  // 对于最小方差：D = 2*Σ (因为 numeric 的 solveQP 用 0.5 x' D x)
  // 所以 D = 2*covMatrix, 但 numeric 的 solveQP 用的是 0.5*x'*D*x - d'*x
  // 所以要最小化 0.5*w'*(2Σ)*w = w'Σw，即 D = 2*covMatrix
  // 但 numeric.solveQP 的 objective 是 0.5*x'*D*x - d'*x
  // 所以设 D = 2*covMatrix, d = 0

  const D = numeric.mul(2, covMatrix)
  const d = Array(n).fill(0)

  // 约束条件
  const constraints_list = buildConstraints(n, minWeight, maxWeight)

  return solveQP(D, d, constraints_list)
}

/**
 * 给定目标收益率的组合
 */
function targetReturnPortfolio(expectedReturns, covMatrix, targetRet, constraints = {}) {
  const n = covMatrix.length
  const { minWeight = 0, maxWeight = 0.5 } = constraints

  // 目标：最小化 0.5 * w' Σ w
  // 约束：sum(w) = 1, w'μ = targetRet, minWeight ≤ w_i ≤ maxWeight
  const D = numeric.mul(2, covMatrix)
  const d = Array(n).fill(0)

  const constraints_list = buildConstraints(n, minWeight, maxWeight)

  // 添加收益率约束：∑ w_i * μ_i ≥ targetRet
  constraints_list.A.push(expectedReturns.map(r => r))
  constraints_list.b.push(targetRet)

  const w = solveQP(D, d, constraints_list)
  return w
}

/**
 * 最大夏普比率组合
 */
function maxSharpePortfolio(expectedReturns, covMatrix, riskFree = 2.0, constraints = {}) {
  const n = expectedReturns.length
  const { minWeight = 0, maxWeight = 0.5 } = constraints

  // 方法：最大化 Sharpe = (μ_p - rf) / σ_p
  // 使用数值方法在有效前沿上搜索
  const frontier = efficientFrontier(expectedReturns, covMatrix, constraints, 50)
  let best = frontier[0]
  for (const p of frontier) {
    if (p.sharpe > best.sharpe) best = p
  }
  return best
}

/**
 * 根据风险偏好获得配置
 * @param {string} riskLevel - conservative/balanced/aggressive 等
 */
function portfolioByRiskLevel(riskLevel, expectedReturns, covMatrix, customConstraints) {
  const constraints = customConstraints || riskConstraints(riskLevel, expectedReturns.length)

  // 最大夏普组合
  const best = maxSharpePortfolio(expectedReturns, covMatrix, 0.02, constraints)

  return {
    weights: best.weights,
    expectedReturn: best.ret,
    volatility: best.risk,
    sharpe: best.sharpe,
    riskLevel,
  }
}

/**
 * 根据风险等级返回约束
 */
function riskConstraints(level, n) {
  const map = {
    conservative: { minWeight: 0, maxWeight: 0.15 },  // 保守：单资产上限 15%
   稳健: { minWeight: 0, maxWeight: 0.20 },
    balanced: { minWeight: 0, maxWeight: 0.25 },
   进取: { minWeight: 0, maxWeight: 0.30 },
    aggressive: { minWeight: 0, maxWeight: 0.35 },
  }
  return map[level] || map.balanced
}

/**
 * 大类资产比例限制
 */
function categoryConstraints(n, categories) {
  const A = []
  const b = []

  // 如果传入了分类约束，可以在此添加
  return { A, b }
}

// ─── 内部工具 ───

function buildConstraints(n, minWeight, maxWeight) {
  // 约束均为不等式 (A x ≥ b)：
  //   sum(w) ≥ 1
  //   w_i ≥ minWeight
  //   -w_i ≥ -maxWeight  (即 w_i ≤ maxWeight)
  // 注：不使用 meq 参数，solver 全部按不等式处理，
  //     在后处理中通过归一化保证 sum(w)=1
  const rows = []
  const rhs = []

  // sum(w) ≥ 1
  rows.push(Array(n).fill(1));   rhs.push(1)

  // w_i ≥ minWeight
  for (let i = 0; i < n; i++) {
    const row = Array(n).fill(0); row[i] = 1
    rows.push(row)
    rhs.push(minWeight)
  }

  // -w_i ≥ -maxWeight  →  w_i ≤ maxWeight
  for (let i = 0; i < n; i++) {
    const row = Array(n).fill(0); row[i] = -1
    rows.push(row)
    rhs.push(-maxWeight)
  }

  return { A: rows, b: rhs, minWeightArg: minWeight, maxWeightArg: maxWeight }
}

function solveQP(Dmat, dvec, constraints) {
  const n = dvec.length
  const minW = constraints.minWeightArg || 0
  const maxW = constraints.maxWeightArg || 0.5

  // numeric.solveQP(D, d, A, b)
  // min 0.5 x' D x - d' x  s.t. A x ≥ b (全部不等式)
  const A = constraints.A
  const b = constraints.b

  let result
  try {
    result = numeric.solveQP(Dmat, dvec, A, b)
  } catch (e) {
    console.warn('[Markowitz] QP solver failed, fallback:', e.message)
    // 退化为按约束的保守分配
    return allocateByConstraints(n, minW, maxW)
  }

  if (!result || !result.solution) {
    return allocateByConstraints(n, minW, maxW)
  }

  // 提取并处理权重
  let w = result.solution.slice()

  // Step 1: 裁剪到 [minW, maxW]
  w = w.map(v => {
    if (v < minW) return minW
    if (v > maxW) return maxW
    return v
  })

  // Step 2: 归一化到总和为 1
  const total = w.reduce((s, v) => s + v, 0)
  if (Math.abs(total - 1) > 1e-6 && total > 0) {
    w = w.map(v => v / total)
  }

  // Step 3: 再次裁剪可能被归一化破坏的边界
  w = w.map(v => {
    if (v < 1e-6) return 0
    if (v > maxW) return maxW
    return v
  })

  // Step 4: 最终归一化
  const finalTotal = w.reduce((s, v) => s + v, 0)
  if (Math.abs(finalTotal - 1) > 1e-6 && finalTotal > 0) {
    w = w.map(v => v / finalTotal)
  }

  return w
}

/**
 * 当 QP 求解失败时的兜底方案
 * 按约束均匀分配权重
 */
function allocateByConstraints(n, minW, maxW) {
  // 尝试所有资产都给 minW，剩余分配给前几个资产（不超过 maxW）
  const w = Array(n).fill(minW)
  let remaining = 1 - minW * n
  if (remaining <= 0) return w.map(v => v / (minW * n))  // 超了，归一化

  for (let i = 0; i < n && remaining > 1e-6; i++) {
    const add = Math.min(remaining, maxW - minW)
    w[i] += add
    remaining -= add
  }
  return w
}

function portfolioReturn(returns, weights) {
  return numeric.dot(returns, weights)
}

function portfolioVolatility(covMatrix, weights) {
  // σ = sqrt(w' Σ w)
  const w = weights
  const n = w.length
  let var_p = 0
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      var_p += w[i] * w[j] * covMatrix[i][j]
    }
  }
  return Math.sqrt(Math.max(0, var_p))
}

module.exports = {
  efficientFrontier,
  minVariancePortfolio,
  maxSharpePortfolio,
  portfolioByRiskLevel,
  portfolioReturn,
  portfolioVolatility,
  riskConstraints,
}
