const express = require('express');
const router = express.Router();
const { validate, fundListSchema, screeningSchema, smartSelectSchema, codeParamSchema, backtestSchema, strategyCompareSchema } = require('../utils/validator');
const ctrl = require('../controllers/fundController');

router.get('/',        validate(fundListSchema, 'query'),    ctrl.getFundList);
router.get('/screening',    validate(screeningSchema, 'query'),    ctrl.fundScreening);
router.get('/smart-select', validate(smartSelectSchema, 'query'),  ctrl.smartSelect);
router.get('/hot-list',                                             ctrl.getHotList);
router.get('/nav-history/:code', validate(codeParamSchema, 'params'), ctrl.getNavHistory);
router.get('/backtest/:code', validate(codeParamSchema, 'params'), validate(backtestSchema, 'query'), ctrl.fundBacktest);
router.post('/strategy-compare', validate(strategyCompareSchema, 'body'), ctrl.strategyCompare);
router.get('/:code/estimate', validate(codeParamSchema, 'params'), ctrl.getFundEstimate);
router.get('/:code',       validate(codeParamSchema, 'params'),    ctrl.getFundDetail);

module.exports = router;
