const express = require('express');
const router = express.Router();
const ctrl = require('../getController/getInternalReportsController');
const { authenticateToken } = require('../middlewares');

router.get('/get-internal-reports', authenticateToken, ctrl.getInternalReports);

module.exports = router; 