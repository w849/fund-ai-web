/**
 * 资产池 — 覆盖大类资产的代表性基金
 * 每只资产包含：预期年化收益率、年化波动率、与其他资产的相关系数
 */
const ASSETS = [
  {
    id: 'hs300',
    name: '沪深300指数',
    code: '110003',
    type: '股票型',
    typeLabel: 'A股大盘',
    expectedReturn: 8.5,   // 年化 %
    volatility: 24.0,       // 年化 %
    color: '#f56c6c',
  },
  {
    id: 'zz500',
    name: '中证500指数',
    code: '161017',
    type: '股票型',
    typeLabel: 'A股中盘',
    expectedReturn: 10.0,
    volatility: 27.0,
    color: '#e6a23c',
  },
  {
    id: 'cyb',
    name: '创业板指数',
    code: '110026',
    type: '股票型',
    typeLabel: 'A股成长',
    expectedReturn: 12.0,
    volatility: 31.0,
    color: '#d53f8c',
  },
  {
    id: 'bond_aaa',
    name: '纯债基金',
    code: '003949',
    type: '债券型',
    typeLabel: '信用债',
    expectedReturn: 4.2,
    volatility: 3.0,
    color: '#409eff',
  },
  {
    id: 'bond_treasury',
    name: '国债指数',
    code: '001061',
    type: '债券型',
    typeLabel: '利率债',
    expectedReturn: 3.5,
    volatility: 2.0,
    color: '#337ecc',
  },
  {
    id: 'bond_convert',
    name: '可转债基金',
    code: '310518',
    type: '债券型',
    typeLabel: '可转债',
    expectedReturn: 6.0,
    volatility: 8.0,
    color: '#66b1ff',
  },
  {
    id: 'gold',
    name: '黄金ETF联接',
    code: '002611',
    type: '黄金/商品',
    typeLabel: '黄金',
    expectedReturn: 5.5,
    volatility: 14.0,
    color: '#e6a23c',
  },
  {
    id: 'sp500',
    name: '标普500指数(QDII)',
    code: '050025',
    type: '海外QDII',
    typeLabel: '美股',
    expectedReturn: 10.0,
    volatility: 19.0,
    color: '#67c23a',
  },
  {
    id: 'nasdaq',
    name: '纳斯达克100(QDII)',
    code: '040046',
    type: '海外QDII',
    typeLabel: '美股科技',
    expectedReturn: 13.0,
    volatility: 24.0,
    color: '#529b2e',
  },
  {
    id: 'hkg',
    name: '恒生指数(QDII)',
    code: '110031',
    type: '海外QDII',
    typeLabel: '港股',
    expectedReturn: 7.5,
    volatility: 22.0,
    color: '#b37feb',
  },
  {
    id: 'money_market',
    name: '货币基金A',
    code: '003022',
    type: '货币基金',
    typeLabel: '现金管理',
    expectedReturn: 2.5,
    volatility: 0.5,
    color: '#909399',
  },
]

// 大类资产分类
const CATEGORIES = {
  '股票型': { label: '股票资产', color: '#f56c6c' },
  '债券型': { label: '债券资产', color: '#409eff' },
  '黄金/商品': { label: '黄金/商品', color: '#e6a23c' },
  '海外QDII': { label: '海外资产', color: '#67c23a' },
  '货币基金': { label: '现金管理', color: '#909399' },
}

/**
 * 生成相关系数矩阵
 * 基于历史经验值，用于构建协方差矩阵
 */
function correlationMatrix(ids) {
  const n = ids.length
  const mat = Array.from({ length: n }, () => Array(n).fill(0))

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        mat[i][j] = 1.0
      } else {
        mat[i][j] = estimateCorrelation(ids[i], ids[j])
      }
    }
  }
  return mat
}

/** 估算两类资产间的相关系数 */
function estimateCorrelation(idA, idB) {
  const map = {
    hs300: 0, zz500: 1, cyb: 2,
    bond_aaa: 3, bond_treasury: 4, bond_convert: 5,
    gold: 6,
    sp500: 7, nasdaq: 8, hkg: 9,
    money_market: 10,
  }
  const i = map[idA], j = map[idB]
  if (i == null || j == null) return 0.3

  // 同类股票间高相关
  if ([0,1,2].includes(i) && [0,1,2].includes(j)) return 0.85
  // 股票与债券低相关
  if ([0,1,2].includes(i) && [3,4,5].includes(j)) return -0.1
  if ([3,4,5].includes(i) && [0,1,2].includes(j)) return -0.1
  // 可转债与股票中等相关
  if ((i===5 && [0,1,2].includes(j)) || (j===5 && [0,1,2].includes(i))) return 0.5
  // 债券间高相关
  if ([3,4,5].includes(i) && [3,4,5].includes(j)) return 0.9
  // 黄金与股票低相关
  if ((i===6 && [0,1,2].includes(j)) || (j===6 && [0,1,2].includes(i))) return 0.05
  // 海外与A股低相关
  if ([7,8,9].includes(i) && [0,1,2].includes(j)) return 0.35
  if ([0,1,2].includes(i) && [7,8,9].includes(j)) return 0.35
  // 海外间高相关
  if ([7,8,9].includes(i) && [7,8,9].includes(j)) return 0.8
  // 货币与一切极低
  if (i === 10 || j === 10) return 0.05
  return 0.3
}

/**
 * 对资产按大类分组
 */
function groupByCategory(assets) {
  const groups = {}
  for (const a of assets) {
    const cat = a.type
    if (!groups[cat]) groups[cat] = { label: CATEGORIES[cat]?.label || cat, color: CATEGORIES[cat]?.color || '#909399', assets: [], totalWeight: 0 }
    groups[cat].assets.push(a)
  }
  return groups
}

module.exports = { ASSETS, CATEGORIES, correlationMatrix, groupByCategory }
