/**
 * 基金数据同步任务
 * 定时从数据源同步基金数据到 Redis 缓存和本地备份
 */
const schedule = require('node-schedule');
const path = require('path');
const fs = require('fs');
const dataSourceManager = require('../services/dataSource');
const cacheService = require('../services/cacheService');
const { logger } = require('../utils/logger');

// 基金代码列表（从 funds.json 获取）
const fundDetailMap = require(path.join(__dirname, '../../data/funds.json'));

// 同步状态
let syncStatus = {
  lastSync: null,
  nextSync: null,
  isRunning: false,
  lastResult: null,
};

/**
 * 更新基金净值数据
 */
async function syncNavData() {
  const codes = Object.keys(fundDetailMap);
  let successCount = 0;
  let failCount = 0;

  logger.info(`[数据同步] 开始同步 ${codes.length} 只基金的净值数据`);

  // 分批同步，避免并发过多
  const batchSize = 5;
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize);
    const promises = batch.map(async (code) => {
      try {
        const navData = await dataSourceManager.getFundNav(code);
        if (navData && navData.nav) {
          const cacheKey = `${cacheService.PREFIX.FUND_NAV}${code}`;
          await cacheService.set(cacheKey, navData, 43200); // 12h TTL
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        failCount++;
        logger.warn(`[数据同步] ${code} 净值同步失败: ${err.message}`);
      }
    });
    await Promise.all(promises);
    // 每批间隔 500ms，避免触发限流
    if (i + batchSize < codes.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  logger.info(`[数据同步] 净值同步完成: 成功 ${successCount}, 失败 ${failCount}`);
  return { successCount, failCount, total: codes.length };
}

/**
 * 备份数据到本地 JSON 文件
 */
async function backupToLocal() {
  try {
    const backupDir = path.join(__dirname, '../../data/backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `funds_backup_${timestamp}.json`);

    // 从缓存读取最新数据并备份
    const backupData = {};
    const codes = Object.keys(fundDetailMap);

    for (const code of codes) {
      const cacheKey = `${cacheService.PREFIX.FUND_NAV}${code}`;
      const navData = await cacheService.get(cacheKey);
      if (navData) {
        backupData[code] = {
          ...fundDetailMap[code],
          ...navData,
          backupTime: new Date().toISOString(),
        };
      }
    }

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
    logger.info(`[数据同步] 本地备份完成: ${backupFile}`);

    // 清理旧备份（保留最近 30 个）
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('funds_backup_'))
      .sort()
      .reverse();

    if (files.length > 30) {
      files.slice(30).forEach(f => {
        fs.unlinkSync(path.join(backupDir, f));
      });
      logger.info(`[数据同步] 已清理 ${files.length - 30} 个旧备份`);
    }
  } catch (err) {
    logger.error(`[数据同步] 本地备份失败: ${err.message}`);
  }
}

/**
 * 执行一次完整同步
 */
async function runSync() {
  if (syncStatus.isRunning) {
    logger.warn('[数据同步] 上次同步尚未完成，跳过本次');
    return;
  }

  syncStatus.isRunning = true;
  const startTime = Date.now();

  try {
    // 写入数据更新时间
    const now = new Date().toISOString();
    await cacheService.set('fund:sync:lastUpdate', now, 86400);

    // 同步净值
    const result = await syncNavData();
    syncStatus.lastResult = result;

    // 备份到本地
    await backupToLocal();

    const duration = Date.now() - startTime;
    syncStatus.lastSync = now;
    logger.info(`[数据同步] 全量同步完成，耗时 ${duration}ms`);
  } catch (err) {
    logger.error(`[数据同步] 同步失败: ${err.message}`);
    syncStatus.lastResult = { error: err.message };
  } finally {
    syncStatus.isRunning = false;
  }
}

/**
 * 启动定时任务
 */
function startSchedule() {
  // 每天凌晨 2:00 同步基础信息
  schedule.scheduleJob('0 2 * * *', async () => {
    logger.info('[定时任务] 开始每日基础信息同步');
    await runSync();
  });

  // 交易日 15:30 同步净值（收盘后）
  schedule.scheduleJob('30 15 * * 1-5', async () => {
    logger.info('[定时任务] 开始收盘净值同步');
    await runSync();
  });

  // 额外：每 2 小时同步一次（用于开发调试）
  schedule.scheduleJob('0 */2 * * *', async () => {
    if (process.env.NODE_ENV === 'production') return; // 生产环境不做频繁同步
    logger.info('[定时任务] 开始定时同步');
    await runSync();
  });

  syncStatus.nextSync = '02:00 / 15:30 (交易日)';
  logger.info('[定时任务] 数据同步任务已启动');
  logger.info('[定时任务] 下次自动同步: 每天 02:00（基础信息）和 15:30（净值）');
}

/**
 * 获取同步状态
 */
function getSyncStatus() {
  return { ...syncStatus };
}

module.exports = { startSchedule, runSync, getSyncStatus };
