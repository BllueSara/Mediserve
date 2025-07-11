const express = require('express');
const router = express.Router();
const downloadReportController = require('../networkController/downloadReportController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/reports/:id/download', authenticateToken, downloadReportController);

module.exports = router; 