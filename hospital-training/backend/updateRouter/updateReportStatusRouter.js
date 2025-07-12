const express = require('express');
const router = express.Router();
const { updateReportStatus } = require('../updateController/updateReportStatusController');
const { authenticateToken } = require('../middlewares');

router.put("/update-report-status/:id", authenticateToken, updateReportStatus);

module.exports = router; 