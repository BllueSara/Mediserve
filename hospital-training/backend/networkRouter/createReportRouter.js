const express = require('express');
const router = express.Router();
const createReportController = require('../networkController/createReportController');
const { authenticateToken } = require('../middlewares');

router.post('/reports/create', authenticateToken, createReportController);

module.exports = router; 