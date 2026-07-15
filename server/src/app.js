const path = require('path');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production'
  : process.env.NODE_ENV === 'development' ? '.env.development'
  : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const Response = require('./utils/response');
const BusinessError = require('./utils/BusinessError');
const { logger, requestLogger } = require('./utils/logger');
const redis = require('./utils/redis');
const fundSyncJob = require('./jobs/fundSyncJob');
const websocket = require('./services/websocket');

const app = express();
const PORT = process.env.PORT || 3000;

// 关闭 x-powered-by
app.disable('x-powered-by');

// 安全头
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 中间件
const corsOrigin = process.env.CORS_ORIGIN;
app.use(cors({
  origin: corsOrigin ? corsOrigin.split(',').map(s => s.trim()) : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: !!corsOrigin,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use(requestLogger);

// 托管前端静态文件
app.use(express.static(path.join(__dirname, '../../client/dist')));

// 路由
const fundRoutes = require('./routes/fund');
app.use('/api/funds', fundRoutes);
const aiRoutes = require('./routes/ai');
app.use('/api/ai', aiRoutes);
const marketRoutes = require('./routes/market');
app.use('/api/market', marketRoutes);
const portfolioRoutes = require('./routes/portfolio');
app.use('/api/portfolio', portfolioRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json(Response.success({
    status: 'ok',
    uptime: process.uptime(),
    redis: redis.isReady() ? 'connected' : 'disconnected',
  }, '服务运行正常'));
});

// WebSocket 连接数统计
app.get('/api/ws/stats', (req, res) => {
  res.json(Response.success(websocket.getStats(), '获取 WebSocket 状态成功'));
});

// SPA 路由支持：非 API 请求返回前端页面
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  } else {
    res.status(404).json(Response.notFound(`接口 ${req.originalUrl} 不存在`));
  }
});

// 全局错误处理中间件
app.use((err, req, res, _next) => {
  if (err instanceof BusinessError) {
      return res.status(err.status).json({
        code: err.status,
        data: err.data,
        msg: err.message,
      });
    }
  logger.error(`${err.message}`, { stack: err.stack });
  const status = err.status || 500;
  res.status(status).json(
    Response.error(err.message || '服务器内部错误')
  );
});

// 创建 HTTP 服务并启动 WebSocket
const server = http.createServer(app);
websocket.init(server);

// 启动数据同步定时任务
fundSyncJob.startSchedule();

server.listen(PORT, () => {
  logger.info(`Fund AI Server running at http://localhost:${PORT}`);
  logger.info(`WebSocket 已集成，共享端口 ${PORT}`);
  logger.info(`API 文档: http://localhost:${PORT}/api/health`);
  logger.info(`Redis: ${redis.isReady() ? '已连接' : '未连接（将使用本地缓存降级）'}`);
});

module.exports = app;
