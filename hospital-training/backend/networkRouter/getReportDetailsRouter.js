const express = require('express');
const router = express.Router();
const getReportDetailsController = require('../networkController/getReportDetailsController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/reports/:id', authenticateToken, getReportDetailsController);

module.exports = router; 