const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/marketController');

router.get('/indices', ctrl.getIndices);
router.get('/sectors', ctrl.getSectors);
router.get('/overview', ctrl.getOverview);
router.get('/sources/status', ctrl.getDataSourceStatus);

module.exports = router;
