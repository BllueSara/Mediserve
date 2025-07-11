const express = require('express');
const router = express.Router();
const monthlyClosedController = require('../dashboardController/monthlyClosedController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/api/maintenance/monthly-closed', authenticateToken, monthlyClosedController);

module.exports = router; 