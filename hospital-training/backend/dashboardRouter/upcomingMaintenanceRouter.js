const express = require('express');
const router = express.Router();
const upcomingMaintenanceController = require('../dashboardController/upcomingMaintenanceController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/api/maintenance/upcoming', authenticateToken, upcomingMaintenanceController);

module.exports = router; 