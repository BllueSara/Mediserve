const express = require('express');
const router = express.Router();
const ctrl = require('../getController/getRegularMaintenanceSummaryController');
const { authenticateToken } = require('../middlewares');

router.get('/regular-maintenance-summary', authenticateToken, ctrl.getRegularMaintenanceSummary);

module.exports = router; 