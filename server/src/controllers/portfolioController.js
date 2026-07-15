const portfolioService = require('../services/portfolioService')

/**
 * 获取资产池
 */
exports.getAssetPool = (req, res) => {
  try {
    const data = portfolioService.getAssetPool()
    res.json({ code: 200, data: { assets: data.assets }, msg: 'ok' })
  } catch (err) {
    console.error('[Portfolio] getAssetPool error:', err)
    res.status(500).json({ code: 500, data: null, msg: err.message })
  }
}

/**
 * 计算最优配置
 */
exports.optimize = (req, res) => {
  try {
    const { riskLevel = 'balanced', totalAmount = 0 } = req.body
    const result = portfolioService.recommendByRiskLevel(riskLevel, totalAmount)
    res.json({ code: 200, data: result, msg: 'ok' })
  } catch (err) {
    console.error('[Portfolio] optimize error:', err)
    res.status(500).json({ code: 500, data: null, msg: err.message })
  }
}

/**
 * 获取有效前沿
 */
exports.efficientFrontier = (req, res) => {
  try {
    const data = portfolioService.getEfficientFrontier()
    res.json({ code: 200, data, msg: 'ok' })
  } catch (err) {
    console.error('[Portfolio] efficientFrontier error:', err)
    res.status(500).json({ code: 500, data: null, msg: err.message })
  }
}

/**
 * 基于风险等级推荐
 */
exports.recommend = (req, res) => {
  try {
    const { riskLevel = 'balanced', totalAmount = 0 } = req.body
    const result = portfolioService.recommendByRiskLevel(riskLevel, totalAmount)
    res.json({ code: 200, data: result, msg: 'ok' })
  } catch (err) {
    console.error('[Portfolio] recommend error:', err)
    res.status(500).json({ code: 500, data: null, msg: err.message })
  }
}
