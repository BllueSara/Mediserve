const express = require('express');
const router = express.Router();
const submitExternalMaintenanceController = require('../maintanceController/submitExternalMaintenanceController');
const { authenticateToken } = require('../middlewares');

router.post('/submit-external-maintenance', authenticateToken, submitExternalMaintenanceController);

module.exports = router; 