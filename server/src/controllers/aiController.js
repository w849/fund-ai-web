const crypto = require('crypto');
const deepseekService = require('../services/deepseekService');
const fundService = require('../services/fundService');
const cacheService = require('../services/cacheService');
const Response = require('../utils/response');
const { logger } = require('../utils/logger');

/**
 * 本地评分算法（DeepSeek 不可用时的降级方案）
 * 在 funds.json 的扩展字段基础上进行 4 维度评分
 */
function localScoring(userProfile, fundList) {
  const riskMap = { conservative: 1, steady: 2, balanced: 3, aggressive: 4, radical: 5 };
  const userRisk = riskMap[userProfile.riskLevel] || 3;

  // 根据风险等级确定权重
  let wEarnings, wRisk, wManager, wLiquidity;
  if (userRisk <= 1) {
    wEarnings = 0.15; wRisk = 0.45; wManager = 0.25; wLiquidity = 0.15;
  } else if (userRisk === 2) {
    wEarnings = 0.25; wRisk = 0.35; wManager = 0.25; wLiquidity = 0.15;
  } else if (userRisk === 3) {
    wEarnings = 0.30; wRisk = 0.25; wManager = 0.25; wLiquidity = 0.20;
  } else if (userRisk === 4) {
    wEarnings = 0.35; wRisk = 0.20; wManager = 0.25; wLiquidity = 0.20;
  } else {
    wEarnings = 0.40; wRisk = 0.15; wManager = 0.25; wLiquidity = 0.20;
  }

  // 过滤匹配行业偏好的基金
  const industries = userProfile.industries || [];
  const types = userProfile.types || [];
  let candidates = fundList;

  if (industries.length > 0 && !industries.includes('不限')) {
    candidates = candidates.filter(f => {
      const fundIndustries = f.industryDistribution ? Object.keys(f.industryDistribution) : [];
      return fundIndustries.some(i => industries.includes(i));
    });
  }
  if (types.length > 0 && !types.includes('不限')) {
    candidates = candidates.filter(f => types.some(t => f.type && f.type.startsWith(t)));
  }
  if (candidates.length === 0) candidates = fundList;

  // 评分
  const scored = candidates.map(f => {
    const earningsScore = Math.min(10, (
      ((f.yearReturn || 0) / 30) * 4 +
      ((f.threeYearReturn || f.yearReturn || 0) / 60) * 3 +
      ((f.sixMonthReturn || f.yearReturn || 0) / 15) * 3
    ));

    const maxDrawdown = f.maxDrawdown || 25;
    const drawdownScore = Math.max(0, Math.min(10, (1 - maxDrawdown / 50) * 10));
    const volatility = f.volatility || 20;
    const volScore = Math.max(0, Math.min(10, (1 - volatility / 40) * 10));
    const riskScore = parseFloat(((drawdownScore * 0.5 + volScore * 0.5)).toFixed(2));

    const tenure = f.managerTenure || 3;
    const managerReturn = f.managerReturn || 5;
    const rating = f.rating || 3;
    const managerScore = Math.min(10, (
      (Math.min(tenure, 15) / 15) * 3 +
      (Math.min(managerReturn, 30) / 30) * 4 +
      (rating / 5) * 3
    ));

    const scaleNum = f.fundScaleNum || 50;
    let liquidityScore;
    if (scaleNum < 2) liquidityScore = 3;
    else if (scaleNum < 10) liquidityScore = 5;
    else if (scaleNum < 50) liquidityScore = 7;
    else if (scaleNum < 200) liquidityScore = 9;
    else liquidityScore = 6;

    const total = parseFloat((
      earningsScore * wEarnings +
      riskScore * wRisk +
      managerScore * wManager +
      liquidityScore * wLiquidity
    ).toFixed(2));

    return {
      fund_code: f.code,
      fund_name: f.name,
      scores: {
        earnings: parseFloat(earningsScore.toFixed(1)),
        risk_control: parseFloat(riskScore.toFixed(1)),
        manager: parseFloat(managerScore.toFixed(1)),
        liquidity: parseFloat(liquidityScore.toFixed(1)),
      },
      total_score: total,
      reason: `该基金${f.yearReturn > 0 ? '近1年收益' + f.yearReturn.toFixed(1) + '%' : '表现稳健'}，${f.maxDrawdown ? '最大回撤' + f.maxDrawdown.toFixed(1) + '%' : '风险控制良好'}，${f.managerTenure ? '基金经理从业' + f.managerTenure + '年' : '管理经验丰富'}。`,
      risk_warning: f.maxDrawdown > 30 ? '该基金历史最大回撤较高，请注意风险。' : '基金投资有风险，过往业绩不代表未来表现。',
    };
  });

  scored.sort((a, b) => b.total_score - a.total_score);

  return {
    recommendations: scored.slice(0, 5),
    top5: scored.slice(0, 5).map(r => r.fund_code),
    overall_advice: '基于您填写的投资偏好和风险承受能力，综合考虑收益能力、风险控制、基金经理和规模流动性四个维度，以上是推荐方案。建议根据自身情况合理配置。',
    market_outlook: '当前市场环境下，建议保持均衡配置，注意分散风险。',
    risk_declaration: '以上分析由系统自动生成，仅供参考学习，不构成任何投资建议。',
  };
}

exports.recommend = async (req, res, next) => {
  try {
    const { riskLevel, term, targetReturn, industries, types, investStyle, budget } = req.body;

    // 1. 初筛获取候选基金
    const candidates = await fundService.fundScreening({ limit: 50 });

    if (!candidates || candidates.length === 0) {
      return res.json(Response.success({
        recommendations: [], top5: [],
        overall_advice: '当前条件下没有符合条件的候选基金，请调整筛选参数。',
        market_outlook: '',
      }, '未找到符合条件的基金'));
    }

    // 2. 构建用户画像
    const userProfile = {
      riskLevel: riskLevel || 'balanced',
      term: term || '3-5y',
      targetReturn: targetReturn || '10-15',
      industries: industries || [],
      types: types || [],
      investStyle: investStyle || 'balanced',
      budget: parseFloat(budget) || 0,
    };

    // 3. 检查 AI 推荐结果缓存（相同用户画像 + 相同候选基金列表）
    const cachePayload = JSON.stringify({ userProfile, fundCodes: candidates.map(c => c.code).sort() });
    const cacheHash = crypto.createHash('md5').update(cachePayload).digest('hex');
    const aiCacheKey = cacheService.PREFIX.AI_RECOMMEND + cacheHash;

    const cachedResult = await cacheService.get(aiCacheKey);
    if (cachedResult) {
      logger.info('[AI 缓存] 命中缓存，直接返回推荐结果');
      // 缓存中的结果可能缺少实时基金详情，重新合并
      mergeFundDetails(cachedResult, candidates);
      return res.json(Response.success(cachedResult, 'AI 智能推荐成功（缓存）'));
    }

    let result;

    // 4. 检查 DeepSeek 是否已配置
    if (!deepseekService.isConfigured()) {
      logger.info('DeepSeek 未配置，使用本地评分');
      result = localScoring(userProfile, candidates);
      mergeFundDetails(result, candidates);
    } else {
      // 5. 调用 DeepSeek AI 分析
      result = await deepseekService.analyzeFunds(userProfile, candidates);

      // 6. 合并基金详情
      if (result.recommendations) {
        mergeFundDetails(result, candidates);
      }
    }

    // 7. 缓存 AI 推荐结果 1 小时
    await cacheService.set(aiCacheKey, result, 3600);
    logger.info('[AI 缓存] 已缓存推荐结果，TTL=3600s');

    res.json(Response.success(result, 'AI 智能推荐成功'));
  } catch (err) {
    logger.error(`AI recommend error: ${err.message}`, { stack: err.stack });
    // DeepSeek 失败时降级到本地评分
    try {
      const candidates = await fundService.fundScreening({ limit: 50 });
      const userProfile = {
        riskLevel: req.body.riskLevel || 'balanced',
        term: req.body.term || '3-5y',
        targetReturn: req.body.targetReturn || '10-15',
        industries: req.body.industries || [],
        types: req.body.types || [],
        investStyle: req.body.investStyle || 'balanced',
        budget: parseFloat(req.body.budget) || 0,
      };
      const localResult = localScoring(userProfile, candidates);
      mergeFundDetails(localResult, candidates);
      res.json(Response.success(localResult, 'AI 服务暂时不可用，已切换为本地评分推荐'));
    } catch (fallbackErr) {
      logger.error(`Fallback scoring error: ${fallbackErr.message}`);
      res.json(Response.success({
        recommendations: [], top5: [],
        overall_advice: '推荐服务暂时不可用，请稍后重试。',
        market_outlook: '',
      }, '服务暂时不可用'));
    }
  }
};

exports.status = (_req, res) => {
  const configured = deepseekService.isConfigured();
  res.json(Response.success({
    configured,
    message: configured ? 'DeepSeek API 已配置' : 'DeepSeek API 未配置',
  }));
};

/**
 * 合并基金详情到推荐结果
 */
function mergeFundDetails(result, candidates) {
  if (!result.recommendations) return;
  for (const rec of result.recommendations) {
    const fundDetail = candidates.find(f => f.code === rec.fund_code);
    if (fundDetail) {
      Object.assign(rec, {
        fund_name: fundDetail.name,
        type: fundDetail.type,
        nav: fundDetail.nav,
        change: fundDetail.change,
        yearReturn: fundDetail.yearReturn,
        fundScale: fundDetail.fundScale,
        fundScaleNum: fundDetail.fundScaleNum,
        manager: fundDetail.manager,
        riskLevel: fundDetail.riskLevel,
        rating: fundDetail.rating,
        monthReturn: fundDetail.monthReturn,
        quarterReturn: fundDetail.quarterReturn,
        sixMonthReturn: fundDetail.sixMonthReturn,
        threeYearReturn: fundDetail.threeYearReturn,
        maxDrawdown: fundDetail.maxDrawdown,
        volatility: fundDetail.volatility,
        sharpeRatio: fundDetail.sharpeRatio,
        managerTenure: fundDetail.managerTenure,
        holdings: fundDetail.holdings,
      });
    }
  }
}
