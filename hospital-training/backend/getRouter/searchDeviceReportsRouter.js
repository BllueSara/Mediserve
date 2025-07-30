const express = require('express');
const router = express.Router();
const { searchDeviceReports } = require('../getController/searchDeviceReportsController');
const { authenticateToken } = require('../middlewares');

// Route to search for device reports
router.get('/api/search-device-reports', authenticateToken, searchDeviceReports);

module.exports = router; 