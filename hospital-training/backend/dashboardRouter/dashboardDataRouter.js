const express = require('express');
const router = express.Router();
const dashboardDataController = require('../dashboardController/dashboardDataController');
const searchDevicesController = require('../dashboardController/searchDevicesController');
const { authenticateToken } = require('../middlewares');

router.get('/api/dashboard-data', authenticateToken, dashboardDataController);
router.get('/api/search-devices', authenticateToken, searchDevicesController);

module.exports = router; 