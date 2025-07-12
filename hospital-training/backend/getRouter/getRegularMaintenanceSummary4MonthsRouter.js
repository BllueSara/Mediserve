const express = require('express');
const router = express.Router();
const ctrl = require('../getController/getRegularMaintenanceSummary4MonthsController');
const { authenticateToken } = require('../middlewares');

router.get('/regular-maintenance-summary-4months', authenticateToken, ctrl.getRegularMaintenanceSummary4Months);

module.exports = router; 