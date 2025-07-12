const express = require('express');
const router = express.Router();
const submitRegularMaintenanceController = require('../maintanceController/submitRegularMaintenanceController');
const { authenticateToken } = require('../middlewares');

router.post('/submit-regular-maintenance', authenticateToken, submitRegularMaintenanceController);

module.exports = router; 