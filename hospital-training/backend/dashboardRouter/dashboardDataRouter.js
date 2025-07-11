const express = require('express');
const router = express.Router();
const dashboardDataController = require('../dashboardController/dashboardDataController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/api/dashboard-data', authenticateToken, dashboardDataController);

module.exports = router; 