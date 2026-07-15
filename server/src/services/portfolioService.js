/**
 * 资产配置服务 - 编排 Markowitz 优化
 */
const { ASSETS, correlationMatrix, groupByCategory } = require('./portfolio/assetPool')
const markowitz = require('./portfolio/markowitz')

/**
 * 构建协方差矩阵
 * Σ_ij = σ_i * σ_j * ρ_ij
 */
function buildCovMatrix(assets) {
  const n = assets.length
  const ids = assets.map(a => a.id)
  const vols = assets.map(a => a.volatility / 100)  // 转小数
  const corr = correlationMatrix(ids)

  const cov = []
  for (let i = 0; i < n; i++) {
    cov[i] = []
    for (let j = 0; j < n; j++) {
      cov[i][j] = vols[i] * vols[j] * corr[i][j]
    }
  }
  return cov
}

/**
 * 获取资产池（含协方差矩阵）
 */
function getAssetPool() {
  const assets = ASSETS.map(a => ({
    id: a.id, name: a.name, code: a.code,
    type: a.type, typeLabel: a.typeLabel,
    expectedReturn: a.expectedReturn,
    volatility: a.volatility,
    color: a.color,
  }))

  const covMatrix = buildCovMatrix(ASSETS)
  const returns = ASSETS.map(a => a.expectedReturn / 100)  // 转小数

  return { assets, covMatrix, returns }
}

/**
 * 获取有效前沿
 */
function getEfficientFrontier() {
  const { assets, covMatrix, returns } = getAssetPool()
  // 使用适中的约束使有效前沿有区分度
  const constraints = { minWeight: 0.01, maxWeight: 0.35 }
  const frontier = markowitz.efficientFrontier(returns, covMatrix, constraints, 30)

  // 找到最大夏普组合
  let maxSharpe = frontier[0]
  for (const p of frontier) {
    if (p.sharpe > maxSharpe.sharpe) maxSharpe = p
  }

  // 最小方差组合
  const minVarW = markowitz.minVariancePortfolio(covMatrix, constraints)
  const minVar = {
    ret: markowitz.portfolioReturn(returns, minVarW),
    risk: markowitz.portfolioVolatility(covMatrix, minVarW),
  }

  return {
    frontier: frontier.map(p => ({ ret: parseFloat((p.ret * 100).toFixed(2)), risk: parseFloat((p.risk * 100).toFixed(2)), sharpe: p.sharpe })),
    maxSharpe: { ret: parseFloat((maxSharpe.ret * 100).toFixed(2)), risk: parseFloat((maxSharpe.risk * 100).toFixed(2)), sharpe: maxSharpe.sharpe },
    minVariance: { ret: parseFloat((minVar.ret * 100).toFixed(2)), risk: parseFloat((minVar.risk * 100).toFixed(2)) },
  }
}

/**
 * 根据风险偏好推荐配置
 * 不同风险等级在有效前沿上选取不同位置
 */
function recommendByRiskLevel(riskLevel, totalAmount = 0) {
  const { assets, covMatrix, returns } = getAssetPool()

  // 计算完整有效前沿
  const catConfig = getCategoryConstraints(riskLevel, assets)
  const constraints = {
    minWeight: catConfig.minPerAsset,
    maxWeight: catConfig.maxPerAsset,
  }

  // 沿有效前沿取 50 个点
  const frontier = markowitz.efficientFrontier(returns, covMatrix, constraints, 50)

  // 根据风险等级选择前沿上的不同位置
  const positionMap = {
    conservative: 0,    // 最左边（最小方差）
    '稳健': 0.2,
    balanced: 0.4,      // 中间偏左
    '进取': 0.6,
    aggressive: 0.8,    // 右边（高收益）
  }
  const pct = positionMap[riskLevel] !== undefined ? positionMap[riskLevel] : 0.4
  const idx = Math.min(Math.floor(pct * frontier.length), frontier.length - 1)
  const selected = frontier[idx]

  // 构建详细配置
  const weights = selected.weights
  const allocations = assets.map((a, i) => ({
    id: a.id, name: a.name, code: a.code,
    type: a.type, typeLabel: a.typeLabel,
    weight: parseFloat((weights[i] * 100).toFixed(2)),
    amount: totalAmount > 0 ? parseFloat((weights[i] * totalAmount).toFixed(2)) : 0,
    expectedReturn: a.expectedReturn,
    volatility: a.volatility,
    color: a.color,
  }))

  // 按大类汇总
  const byCategory = aggregateByCategory(allocations)

  return {
    riskLevel,
    allocations,
    byCategory,
    expectedReturn: parseFloat(((selected.ret * 100)).toFixed(2)),
    volatility: parseFloat(((selected.risk * 100)).toFixed(2)),
    sharpe: parseFloat(selected.sharpe.toFixed(4)),
    riskNotes: getRiskDescription(riskLevel),
    catNotes: catConfig.notes,
    summary: generateSummary(riskLevel, { expectedReturn: parseFloat((selected.ret * 100).toFixed(2)), volatility: parseFloat((selected.risk * 100).toFixed(2)), sharpe: selected.sharpe ? parseFloat(selected.sharpe.toFixed(4)) : 0 }, byCategory),
  }
}

/**
 * 获取大类资产约束
 */
function getCategoryConstraints(riskLevel, assets) {
  const map = {
    conservative: {
      minPerAsset: 0.02, maxPerAsset: 0.15,
      notes: '保守型以债券和货币为主，股票≤20%，控制整体波动在5%以内',
    },
    稳健: {
      minPerAsset: 0.02, maxPerAsset: 0.20,
      notes: '稳健型股债平衡配置，股票30%-50%，债券40%-60%',
    },
    balanced: {
      minPerAsset: 0.02, maxPerAsset: 0.25,
      notes: '平衡型股票和债券各半，加入黄金和海外分散风险',
    },
    进取: {
      minPerAsset: 0.02, maxPerAsset: 0.30,
      notes: '进取型以股票为主（60%-80%），搭配债券和海外资产',
    },
    aggressive: {
      minPerAsset: 0.02, maxPerAsset: 0.35,
      notes: '激进型高仓位股票（80%+），少量债券和现金管理',
    },
  }
  return map[riskLevel] || map.balanced
}

/**
 * 按大类汇总
 */
function aggregateByCategory(allocations) {
  const groups = {}
  for (const a of allocations) {
    if (a.weight < 0.01) continue
    if (!groups[a.type]) {
      groups[a.type] = {
        type: a.type,
        label: a.type,
        totalWeight: 0,
        totalAmount: 0,
        assets: [],
      }
    }
    groups[a.type].totalWeight += a.weight
    groups[a.type].totalAmount += a.amount
    groups[a.type].assets.push(a)
  }

  return Object.values(groups)
    .map(g => ({
      ...g,
      totalWeight: parseFloat(g.totalWeight.toFixed(2)),
      totalAmount: parseFloat(g.totalAmount.toFixed(2)),
    }))
    .sort((a, b) => b.totalWeight - a.totalWeight)
}

/**
 * 风险等级描述
 */
function getRiskDescription(level) {
  const map = {
    conservative: {
      label: '保守型',
      desc: '低风险偏好，追求本金安全，可承受5%以内亏损',
      color: '#67c23a',
    },
    稳健: {
      label: '稳健型',
      desc: '中低风险偏好，追求稳定增值，可承受5%-10%亏损',
      color: '#409eff',
    },
    balanced: {
      label: '平衡型',
      desc: '中等风险偏好，追求收益与风险平衡，可承受10%-15%亏损',
      color: '#e6a23c',
    },
    进取: {
      label: '进取型',
      desc: '中高风险偏好，追求较高收益，可承受15%-25%亏损',
      color: '#d53f8c',
    },
    aggressive: {
      label: '激进型',
      desc: '高风险偏好，追求高收益，可承受25%以上亏损',
      color: '#f56c6c',
    },
  }
  return map[level] || map.balanced
}

/**
 * 生成配置建议文字
 */
function generateSummary(riskLevel, result, byCategory) {
  const totalStock = byCategory.find(c => c.type === '股票型')
  const totalBond = byCategory.find(c => c.type === '债券型')
  const stockPct = totalStock?.totalWeight || 0
  const bondPct = totalBond?.totalWeight || 0

  const parts = []
  parts.push(`根据您的风险偏好，建议配置 **${stockPct.toFixed(0)}% 股票资产** + **${bondPct.toFixed(0)}% 债券资产**`)
  
  const otherCats = byCategory.filter(c => c.type !== '股票型' && c.type !== '债券型')
  if (otherCats.length > 0) {
    const others = otherCats.map(c => `${c.totalWeight.toFixed(0)}% ${c.label}`).join(' + ')
    parts.push(`，搭配 ${others} 分散风险。`)
  } else {
    parts.push('。')
  }

  parts.push(`预期年化收益 **${result.expectedReturn}%**，组合波动率 **${result.volatility}%**，夏普比率 **${result.sharpe}**。`)

  if (result.expectedReturn > 10) {
    parts.push("该配置收益预期较高，建议长期持有并定期再平衡(每半年一次)，以控制风险。")
  } else if (result.expectedReturn > 6) {
    parts.push('该配置攻守兼备，建议长期持有，在市场大幅波动时进行再平衡调整。')
  } else {
    parts.push('该配置较为稳健，适合作为资产配置的底仓，搭配少量权益类资产提升收益弹性。')
  }

  return parts.join('')
}

module.exports = { getAssetPool, getEfficientFrontier, recommendByRiskLevel }
