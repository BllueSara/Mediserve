const express = require('express');
const router = express.Router();
const generateReportController = require('../networkController/generateReportController');
const { authenticateToken } = require('../middlewares');

router.post('/report', authenticateToken, generateReportController);

module.exports = router; 