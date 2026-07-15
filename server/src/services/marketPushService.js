/**
 * 行情推送服务
 * 定时推送大盘指数行情、基金净值等实时数据
 */
const dataSourceManager = require('./dataSource');
const { logger } = require('../utils/logger');

// 交易时段（北京时间）
const TRADING_START = 9.5;   // 9:30
const TRADING_END = 15;      // 15:00

let io = null;
let pushTimer = null;
let pushInterval = 30000;     // 交易时段 30s
let idleInterval = 300000;    // 非交易时段 5min
let isTradingTime = false;

/**
 * 判断当前是否为交易时段
 */
function checkTradingTime() {
  const now = new Date();
  const hkOffset = 8; // UTC+8
  const hour = now.getUTCHours() + hkOffset;
  const day = now.getUTCDay();

  // 非交易日（周六日）
  if (day === 0 || day === 6) return false;

  // 交易时段 9:30 - 15:00
  const h = hour + now.getUTCMinutes() / 60;
  return h >= TRADING_START && h < TRADING_END;
}

/**
 * 推送指数行情
 */
async function pushIndices() {
  if (!io) return;

  try {
    const indices = await dataSourceManager.getMarketIndices();
    if (indices && indices.length > 0) {
      io.to('market:indices').emit('market:indices', {
        type: 'market:indices',
        data: indices,
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    logger.warn(`[行情推送] 指数推送失败: ${err.message}`);
  }
}

/**
 * 推送板块排行
 */
async function pushSectors() {
  if (!io) return;

  try {
    const sectors = await dataSourceManager.getSectorRanking();
    if (sectors && sectors.length > 0) {
      io.to('market:sectors').emit('market:sectors', {
        type: 'market:sectors',
        data: sectors,
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    logger.warn(`[行情推送] 板块推送失败: ${err.message}`);
  }
}

/**
 * 推送基金净值更新（给所有订阅了该基金的客户端）
 */
async function pushFundNav(code) {
  if (!io) return;

  const room = `fund:nav:${code}`;
  const clients = io.sockets.adapter.rooms.get(room);
  if (!clients || clients.size === 0) return; // 无人订阅，跳过

  try {
    const navData = await dataSourceManager.getFundNav(code);
    if (navData && navData.nav) {
      io.to(room).emit(`fund:nav:${code}`, {
        type: `fund:nav:${code}`,
        data: {
          code,
          nav: navData.nav,
          change: navData.change,
          navDate: navData.navDate,
        },
        timestamp: Date.now(),
      });
    }
  } catch (err) {
    logger.warn(`[行情推送] ${code} 净值推送失败: ${err.message}`);
  }
}

/**
 * 推送循环
 */
async function pushCycle() {
  isTradingTime = checkTradingTime();
  const currentInterval = isTradingTime ? pushInterval : idleInterval;

  // 动态调整推送频率
  if (pushTimer) {
    clearInterval(pushTimer);
    pushTimer = setInterval(pushCycle, currentInterval);
    logger.debug(`[行情推送] 调整频率为 ${currentInterval / 1000}s (交易时段: ${isTradingTime})`);
  }

  await Promise.all([
    pushIndices(),
    pushSectors(),
  ]);
}

/**
 * 启动行情推送
 */
function start(socketIO) {
  io = socketIO;
  isTradingTime = checkTradingTime();
  const initialInterval = isTradingTime ? pushInterval : idleInterval;

  // 立即推送一次
  pushIndices();
  pushSectors();

  // 定时推送
  pushTimer = setInterval(async () => {
    isTradingTime = checkTradingTime();
    const currentInterval = isTradingTime ? pushInterval : idleInterval;

    // 动态调整频率
    clearInterval(pushTimer);
    pushTimer = setInterval(pushCycle, currentInterval);

    await Promise.all([
      pushIndices(),
      pushSectors(),
    ]);
  }, initialInterval);

  logger.info(`[行情推送] 已启动，初始频率 ${initialInterval / 1000}s`);
}

/**
 * 停止行情推送
 */
function stop() {
  if (pushTimer) {
    clearInterval(pushTimer);
    pushTimer = null;
  }
  logger.info('[行情推送] 已停止');
}

module.exports = { start, stop, pushFundNav };
