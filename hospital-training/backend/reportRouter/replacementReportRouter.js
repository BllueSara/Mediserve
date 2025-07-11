const express = require('express');
const router = express.Router();
const replacementReportController = require('../reportController/replacementReportController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/api/replacement-report', authenticateToken, replacementReportController);

module.exports = router; 