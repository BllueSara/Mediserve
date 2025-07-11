const express = require('express');
const router = express.Router();
const createReportController = require('../networkController/createReportController');
const authenticateToken = require('../userController/authenticateTokenController');

router.post('/reports/create', authenticateToken, createReportController);

module.exports = router; 