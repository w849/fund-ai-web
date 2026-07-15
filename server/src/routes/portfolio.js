const router = require('express').Router()
const ctrl = require('../controllers/portfolioController')

// 获取可选资产池
router.get('/asset-pool', ctrl.getAssetPool)

// 计算最优配置
router.post('/optimize', ctrl.optimize)

// 获取有效前沿数据
router.get('/efficient-frontier', ctrl.efficientFrontier)

// 基于风险等级推荐
router.post('/recommend', ctrl.recommend)

module.exports = router
