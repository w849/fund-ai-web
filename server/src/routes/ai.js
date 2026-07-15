const express = require('express');
const router = express.Router();
const { validate, aiRecommendSchema } = require('../utils/validator');
const ctrl = require('../controllers/aiController');
const { createRedisRateLimiter } = require('../utils/rateLimiter');

// 使用 Redis 滑动窗口限流（Redis 不可用时自动降级）
const rateLimiter = createRedisRateLimiter({
  windowMs: 60 * 1000,   // 1 分钟窗口
  max: 3,                 // 最多 3 次请求
  keyPrefix: 'rate:ai:',  // Redis key 前缀
  message: '请求过于频繁，请稍后重试',
});

router.post('/recommend', rateLimiter, validate(aiRecommendSchema, 'body'), ctrl.recommend);
router.get('/status', ctrl.status);

module.exports = router;
