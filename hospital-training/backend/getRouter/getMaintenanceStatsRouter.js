const express = require('express');
const router = express.Router();
const { getMaintenanceStats } = require('../getController/getMaintenanceStatsController');

router.get('/maintenance-stats', getMaintenanceStats);

module.exports = router; 