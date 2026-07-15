const Joi = require('joi');
const Response = require('./response');

/**
 * 通用校验中间件工厂
 * @param {Joi.ObjectSchema} schema - Joi 校验 schema
 * @param {'body'|'query'|'params'} source - 校验数据来源
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[source], { abortEarly: false, stripUnknown: true });
    if (error) {
      const messages = error.details.map(d => d.message).join('; ');
      return res.status(400).json(Response.badRequest(`参数校验失败: ${messages}`));
    }
    req[source] = value;
    next();
  };
}

// ====== Schema 定义 ======

const fundListSchema = Joi.object({
  keyword: Joi.string().trim().max(50).allow('').optional(),
  type: Joi.string().trim().max(100).allow('').optional(),
  rating: Joi.string().trim().max(10).allow('').optional(),
  riskLevel: Joi.string().trim().max(50).allow('').optional(),
  minRating: Joi.number().integer().min(0).max(5).optional(),
  establishFrom: Joi.number().integer().min(2000).max(2026).optional(),
  sortBy: Joi.string().valid('nav', 'yearReturn', 'yearReturn3', 'monthReturn', 'quarterReturn', 'fundScale', 'fundScaleNum', 'rating', 'maxDrawdown').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

const screeningSchema = Joi.object({
  type: Joi.string().trim().max(20).allow('').optional(),
  limit: Joi.number().integer().min(1).max(100).default(50).optional(),
});

const smartSelectSchema = Joi.object({
  riskLevel: Joi.string().valid('conservative', 'steady', 'balanced', 'aggressive', 'radical').optional(),
  type: Joi.string().trim().max(20).allow('').optional(),
  budget: Joi.number().min(0).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

const codeParamSchema = Joi.object({
  code: Joi.string().trim().min(4).max(10).required(),
});

const aiRecommendSchema = Joi.object({
  riskLevel: Joi.string().valid('conservative', 'steady', 'balanced', 'aggressive', 'radical').optional(),
  term: Joi.string().valid('1y', '1-3y', '3-5y', '5-10y', '10y+').optional(),
  targetReturn: Joi.string().valid('5', '5-10', '10-15', '15-20', '20+').optional(),
  industries: Joi.array().items(Joi.string().max(20)).max(5).optional(),
  types: Joi.array().items(Joi.string().max(20)).max(5).optional(),
  investStyle: Joi.string().valid('value', 'growth', 'balanced', 'theme').optional(),
  budget: Joi.number().min(0).optional(),
});

const backtestSchema = Joi.object({
  amount: Joi.number().min(1).required(),
  period: Joi.string().valid('monthly', 'weekly', 'biweekly').default('monthly').optional(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  dividendType: Joi.string().valid('reinvest', 'cash').default('reinvest').optional(),
});

const strategyCompareSchema = Joi.object({
  code: Joi.string().trim().min(4).max(10).required(),
  amount: Joi.number().min(1).required(),
  period: Joi.string().valid('monthly', 'weekly', 'biweekly').default('monthly').optional(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  strategies: Joi.array().items(
    Joi.string().valid('fixed', 'value', 'ma', 'smart')
  ).min(1).max(4).default(['fixed', 'value', 'ma', 'smart']).optional(),
});

module.exports = {
  validate,
  fundListSchema,
  screeningSchema,
  smartSelectSchema,
  codeParamSchema,
  aiRecommendSchema,
  backtestSchema,
  strategyCompareSchema,
};
