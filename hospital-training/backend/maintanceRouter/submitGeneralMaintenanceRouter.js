const express = require('express');
const router = express.Router();
const submitGeneralMaintenanceController = require('../maintanceController/submitGeneralMaintenanceController');
const { authenticateToken } = require('../middlewares');

router.post('/submit-general-maintenance', authenticateToken, submitGeneralMaintenanceController);

module.exports = router; 