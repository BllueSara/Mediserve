const express = require('express');
const router = express.Router();
const maintenanceOverviewController = require('../dashboardController/maintenanceOverviewController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/api/maintenance/overview', authenticateToken, maintenanceOverviewController);

module.exports = router; 