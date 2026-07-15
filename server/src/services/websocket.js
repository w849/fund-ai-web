/**
 * WebSocket 服务
 * 基于 socket.io，与 Express 共享端口
 * 支持房间/主题订阅、心跳检测、在线统计
 */
const { Server } = require('socket.io');
const { logger } = require('../utils/logger');
const marketPushService = require('./marketPushService');

let io = null;
let clientCount = 0;
const rooms = new Set();

/**
 * 初始化 WebSocket 服务
 * @param {http.Server} httpServer - HTTP 服务实例
 */
function init(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
    pingInterval: 10000,   // 10s 心跳间隔
    pingTimeout: 5000,     // 5s 超时断开
    transports: ['websocket', 'polling'], // 优先 WebSocket，降级轮询
  });

  io.on('connection', (socket) => {
    clientCount++;
    logger.info(`[WebSocket] 客户端连接 (${socket.id}), 当前在线: ${clientCount}`);

    // 上报身份信息（预留鉴权）
    socket.on('auth', (data) => {
      if (data && data.userId) {
        socket.userId = data.userId;
      }
    });

    // 订阅主题
    socket.on('subscribe', (topic) => {
      if (!topic || typeof topic !== 'string') return;
      socket.join(topic);
      rooms.add(topic);
      logger.debug(`[WebSocket] ${socket.id} 订阅 ${topic}`);
    });

    // 取消订阅
    socket.on('unsubscribe', (topic) => {
      if (!topic) return;
      socket.leave(topic);
      logger.debug(`[WebSocket] ${socket.id} 取消订阅 ${topic}`);
    });

    // 客户端断开
    socket.on('disconnect', (reason) => {
      clientCount = Math.max(0, clientCount - 1);
      logger.info(`[WebSocket] 客户端断开 (${socket.id}), 原因: ${reason}, 当前在线: ${clientCount}`);
    });

    // 错误处理
    socket.on('error', (err) => {
      logger.warn(`[WebSocket] 客户端错误 (${socket.id}): ${err.message}`);
    });
  });

  // 启动行情推送
  marketPushService.start(io);

  logger.info('[WebSocket] 服务初始化完成');
  return io;
}

/**
 * 向指定主题广播消息
 */
function broadcast(topic, event, data) {
  if (!io) return;
  io.to(topic).emit(event, {
    type: topic,
    data,
    timestamp: Date.now(),
  });
}

/**
 * 广播所有客户端
 */
function broadcastAll(event, data) {
  if (!io) return;
  io.emit(event, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * 获取在线统计
 */
function getStats() {
  return {
    clients: clientCount,
    rooms: Array.from(rooms),
    uptime: process.uptime(),
  };
}

/**
 * 关闭 WebSocket 服务
 */
function close() {
  if (io) {
    marketPushService.stop();
    io.close();
    io = null;
    logger.info('[WebSocket] 服务已关闭');
  }
}

module.exports = { init, broadcast, broadcastAll, getStats, close };
