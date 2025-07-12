const express = require('express');
const router = express.Router();
const submitNewDeviceController = require('../maintanceController/submitNewDeviceController');
const { authenticateToken } = require('../middlewares');

router.post('/submit-new-device', authenticateToken, submitNewDeviceController);

module.exports = router; 