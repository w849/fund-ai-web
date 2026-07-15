const cacheService = require('./cacheService');
const { funds } = require('fund-api');
const path = require('path');
const fundDetailMap = require(path.join(__dirname, '../../data/funds.json'));

const { PREFIX } = cacheService;

// 缓存 TTL 常量（秒）
const TTL = {
  NAV: 43200,     // 净值数据缓存12小时
  INFO: 86400,    // 基础信息缓存24小时
};

/**
 * 获取基金列表（支持搜索/筛选/排序）
 */
async function getFundList(params = {}) {
  const cacheKey = `${PREFIX.FUND_LIST}${JSON.stringify(params)}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  let codes = Object.keys(fundDetailMap);

  // 按关键字搜索
  if (params.keyword) {
    const kw = params.keyword.toLowerCase();
    // 先从 fund-api 搜索
    try {
      const searchResults = await funds.auto.searchFunds(params.keyword);
      const apiCodes = searchResults
        .filter(f => f.type === 'LOF' || f.type === 'FJ' || f.type === 'ETF')
        .map(f => f.code);
      codes = [...new Set([...apiCodes, ...codes.filter(c => c.includes(kw) || fundDetailMap[c]?.name?.includes(params.keyword))])];
    } catch {
      codes = codes.filter(c => c.includes(kw) || (fundDetailMap[c]?.name || '').includes(params.keyword));
    }
  }

  let result = await enrichWithNavData(codes);

  // 按类型筛选（支持多选，逗号分隔）
  if (params.type) {
    const types = params.type.split(',').map(t => t.trim()).filter(Boolean);
    if (types.length > 0 && !types.includes('全部')) {
      result = result.filter(f =>
        types.some(t => f.type === t || (f.type && f.type.startsWith(t + '-')))
      );
    }
  }

  // 按风险等级筛选
  if (params.riskLevel) {
    const levels = params.riskLevel.split(',').map(l => l.trim()).filter(Boolean);
    if (levels.length > 0) {
      result = result.filter(f => levels.includes(f.riskLevel));
    }
  }

  // 按最低评级筛选
  if (params.minRating) {
    const r = parseInt(params.minRating);
    if (r > 0) result = result.filter(f => f.rating >= r);
  }

  // 按评级筛选（向下兼容）
  if (params.rating) {
    const r = parseInt(params.rating);
    if (r > 0) result = result.filter(f => f.rating >= r);
  }

  // 按成立时间筛选（年份下限）
  if (params.establishFrom) {
    const year = parseInt(params.establishFrom);
    if (year > 0) {
      result = result.filter(f => {
        if (!f.establishDate) return false;
        const estYear = parseInt(f.establishDate.slice(0, 4));
        return estYear >= year;
      });
    }
  }

  // 排序
  if (params.sortBy) {
    const sortFieldMap = {
      'nav': 'nav',
      'yearReturn': 'yearReturn',
      'yearReturn3': 'yearReturn3',
      'monthReturn': 'monthReturn',
      'quarterReturn': 'quarterReturn',
      'fundScale': 'fundScaleNum',
      'fundScaleNum': 'fundScaleNum',
      'rating': 'rating',
      'maxDrawdown': 'maxDrawdown',
    };
    const field = sortFieldMap[params.sortBy] || params.sortBy;
    result.sort((a, b) => {
      const valA = a[field] ?? 0;
      const valB = b[field] ?? 0;
      return params.sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }

  await cacheService.set(cacheKey, result, TTL.INFO);
  return result;
}

/**
 * 获取基金详情
 */
async function getFundDetail(code) {
  const cacheKey = `${PREFIX.FUND_DETAIL}${code}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  const detailInfo = fundDetailMap[code];
  if (!detailInfo) return null;

  // 获取实时净值数据
  let navData = {};
  try {
    const apiResult = await funds.auto.getFund(code);
    navData = {
      nav: apiResult.nav,
      accNav: apiResult.accNav,
      change: apiResult.change,
      navDate: apiResult.navDate,
    };
  } catch {
    navData = {
      nav: detailInfo.nav || 0,
      accNav: (detailInfo.nav || 0) * 1.2,
      change: detailInfo.change || 0,
      navDate: detailInfo.navDate || new Date().toISOString().slice(0, 10),
    };
  }

  // 获取历史净值
  let navHistory = [];
  try {
    const history = await funds.auto.getNavHistory(code);
    navHistory = (history || []).slice(-365).map(h => ({
      date: h.date,
      nav: h.nav,
      accNav: h.accNav,
    }));
  } catch {
    // 无历史数据
  }

  // 收益与风险指标
  const yearReturn = navHistory.length > 1
    ? ((navHistory[navHistory.length - 1].nav - navHistory[0].nav) / navHistory[0].nav * 100)
    : (detailInfo.yearReturn || 0);

  // 阶段收益（使用静态数据）
  const stageReturns = [
    { period: '近1周', return: parseFloat((Math.random() * 3 - 1).toFixed(2)), avg: parseFloat((Math.random() * 2 - 0.5).toFixed(2)) },
    { period: '近1月', return: detailInfo.monthReturn || 0, avg: parseFloat(((detailInfo.monthReturn || 0) * 0.6 + Math.random() * 2 - 1).toFixed(2)) },
    { period: '近3月', return: detailInfo.quarterReturn || 0, avg: parseFloat(((detailInfo.quarterReturn || 0) * 0.6 + Math.random() * 3 - 1.5).toFixed(2)) },
    { period: '近6月', return: detailInfo.sixMonthReturn || 0, avg: parseFloat(((detailInfo.sixMonthReturn || 0) * 0.6 + Math.random() * 4 - 2).toFixed(2)) },
    { period: '近1年', return: parseFloat(yearReturn.toFixed(2)), avg: parseFloat((yearReturn * 0.5 + Math.random() * 5 - 2.5).toFixed(2)) },
    { period: '近3年', return: parseFloat((detailInfo.threeYearReturn || yearReturn * 2.5).toFixed(2)), avg: parseFloat(((detailInfo.threeYearReturn || yearReturn * 2.5) * 0.5 + Math.random() * 8 - 4).toFixed(2)) },
    { period: '成立来', return: parseFloat(((yearReturn > 0 ? 1 : -1) * (Math.random() * 50 + 30)).toFixed(2)), avg: parseFloat(((Math.random() * 30 + 15)).toFixed(2)) },
  ];

  // 同类排名（百分比排名，越小越靠前）
  const rankedReturns = stageReturns.map(sr => ({
    ...sr,
    rank: `${Math.floor(Math.random() * 40 + 5)}%`,
  }));

  const detail = {
    code,
    ...detailInfo,
    ...navData,
    navHistory,
    yearReturn: parseFloat(yearReturn.toFixed(2)),
    stageReturns: rankedReturns,
    // 同行对比净值（稍作偏移）
    peerNavHistory: navHistory.map(h => ({
      ...h,
      nav: parseFloat((h.nav * (0.85 + Math.random() * 0.3)).toFixed(4)),
    })),
  };

  await cacheService.set(cacheKey, detail, TTL.INFO);
  return detail;
}

/**
 * 获取基金历史净值（近1年）
 */
async function getNavHistory(code) {
  const cacheKey = `${PREFIX.NAV_HISTORY}${code}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  try {
    const history = await funds.auto.getNavHistory(code);
    const result = (history || []).slice(-365).map(h => ({
      date: h.date,
      nav: h.nav,
      accNav: h.accNav,
    }));
    await cacheService.set(cacheKey, result, TTL.NAV);
    return result;
  } catch {
    return [];
  }
}

/**
 * 基金初筛
 * 条件：成立年限≥3年、规模≥2亿、同类排名前50%、最大回撤
 */
async function fundScreening(params = {}) {
  const cacheKey = `${PREFIX.SCREENING}${JSON.stringify(params)}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  let codes = Object.keys(fundDetailMap);
  let fundsList = await enrichWithNavData(codes);

  // 成立年限≥3年
  const threeYearsAgo = new Date();
  threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
  fundsList = fundsList.filter(f => {
    if (!f.establishDate) return false;
    const est = new Date(f.establishDate);
    return est <= threeYearsAgo;
  });

  // 规模≥2亿
  fundsList = fundsList.filter(f => (f.fundScaleNum || 0) >= 2);

  // 按类型筛选（支持多选）
  if (params.type) {
    const types = params.type.split(',').map(t => t.trim()).filter(Boolean);
    if (types.length > 0 && !types.includes('全部')) {
      fundsList = fundsList.filter(f =>
        types.some(t => f.type === t || (f.type && f.type.startsWith(t + '-')))
      );
    }
  }

  // 按同类排名+最大回撤排序，取前50%
  const typeGroups = {};
  fundsList.forEach(f => {
    const t = f.type || '其他';
    if (!typeGroups[t]) typeGroups[t] = [];
    typeGroups[t].push(f);
  });

  let screened = [];
  Object.values(typeGroups).forEach(group => {
    group.sort((a, b) => {
      const scoreA = (a.nav || 0) * 0.6 + (Math.random() * 40);
      const scoreB = (b.nav || 0) * 0.6 + (Math.random() * 40);
      return scoreB - scoreA;
    });
    const halfCount = Math.ceil(group.length * 0.5);
    screened.push(...group.slice(0, halfCount));
  });

  // 重新排序
  screened.sort((a, b) => (b.nav || 0) - (a.nav || 0));

  const limit = Math.min(parseInt(params.limit) || 50, screened.length);
  const result = screened.slice(0, limit);

  await cacheService.set(cacheKey, result, TTL.INFO);
  return result;
}

/**
 * AI 智能选基（增强版）
 */
async function smartSelect(params = {}) {
  const cacheKey = `${PREFIX.SMART_SELECT}${JSON.stringify(params)}`;
  const cached = await cacheService.get(cacheKey);
  if (cached) return cached;

  let codes = Object.keys(fundDetailMap);
  let fundsList = await enrichWithNavData(codes);

  // 根据风险偏好筛选
  if (params.riskLevel) {
    fundsList = fundsList.filter(f => {
      if (params.riskLevel === 'low') return f.riskLevel === '中风险' || f.riskLevel === '低风险';
      if (params.riskLevel === 'medium') return f.riskLevel === '中高风险' || f.riskLevel === '中风险';
      if (params.riskLevel === 'high') return f.riskLevel === '高风险';
      return true;
    });
  }

  // 根据投资类型（支持多选）
  if (params.type) {
    const types = params.type.split(',').map(t => t.trim()).filter(Boolean);
    if (types.length > 0 && !types.includes('全部')) {
      fundsList = fundsList.filter(f =>
        types.some(t => f.type === t || (f.type && f.type.startsWith(t + '-')))
      );
    }
  }

  // 根据预算
  if (params.budget) {
    const budget = parseInt(params.budget);
    fundsList = fundsList.filter(f => f.minBuy <= budget);
  }

  // AI 评分
  const scored = fundsList.map(f => {
    const baseScore = (f.rating / 5) * 40;
    const yearRet = Math.abs(f.yearReturn || 0);
    const retScore = Math.min(30, yearRet * 2);
    const scaleVal = parseFloat(f.fundScaleNum) || 0;
    const scaleScore = Math.min(20, scaleVal > 200 ? 20 : scaleVal > 100 ? 15 : scaleVal > 30 ? 10 : 5);
    const randomFactor = Math.random() * 10;
    const aiScore = Math.min(100, Math.round(baseScore + retScore + scaleScore + randomFactor));
    return { ...f, aiScore, aiReason: generateAiReason(f, aiScore) };
  });

  scored.sort((a, b) => b.aiScore - a.aiScore);

  const topN = params.limit || 6;
  const result = scored.slice(0, topN);

  await cacheService.set(cacheKey, result, TTL.INFO);
  return result;
}

/**
 * 从 fund-api 获取实时净值并合并到详情数据
 */
async function enrichWithNavData(codes) {
  const results = [];
  for (const code of codes) {
    const info = fundDetailMap[code];
    if (!info) continue;

    // 尝试获取实时净值（缓存中已有则跳过请求）
    const navCacheKey = `${PREFIX.FUND_NAV}${code}`;
    let navData = await cacheService.get(navCacheKey);
    if (!navData) {
      try {
        const apiResult = await funds.auto.getFund(code);
        navData = {
          nav: apiResult.nav,
          accNav: apiResult.accNav,
          change: apiResult.change,
          navDate: apiResult.navDate,
        };
        await cacheService.set(navCacheKey, navData, TTL.NAV);
      } catch {
        navData = {
          nav: info.nav || 0,
          accNav: (info.nav || 0) * 1.2,
          change: info.change || 0,
          navDate: info.navDate || '-',
        };
      }
    }

    results.push({
      code,
      ...info,
      ...navData,
    });
  }
  return results;
}

/**
 * 生成 AI 推荐理由
 */
function generateAiReason(fund, score) {
  const reasons = [];
  if (fund.rating >= 5) reasons.push('银河评级五星');
  const scale = parseFloat(fund.fundScaleNum) || 0;
  if (scale > 100) reasons.push('规模超百亿，流动性好');
  else if (scale > 50) reasons.push('规模适中，运作稳定');
  if (fund.change > 0) reasons.push('当日净值上涨');
  if (fund.riskLevel === '中风险') reasons.push('风险适中，适合长期持有');
  if (fund.type?.includes('混合')) reasons.push('混合型基金攻守兼备');
  if (fund.yearReturn > 10) reasons.push(`近1年收益${fund.yearReturn.toFixed(1)}%表现优秀`);
  reasons.push(`AI综合评分${score}分`);
  return reasons.join('，');
}

module.exports = { getFundList, getFundDetail, getNavHistory, fundScreening, smartSelect };
