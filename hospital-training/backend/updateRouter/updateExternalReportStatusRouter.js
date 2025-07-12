const express = require('express');
const router = express.Router();
const ctrl = require('../updateController/updateExternalReportStatusController');
const { authenticateToken } = require('../middlewares');

router.put('/update-external-report-status/:id', authenticateToken, ctrl.updateExternalReportStatus);

module.exports = router; 