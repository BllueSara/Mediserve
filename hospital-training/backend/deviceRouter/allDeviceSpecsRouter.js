const express = require('express');
const router = express.Router();
const allDeviceSpecsController = require('../deviceController/allDeviceSpecsController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/api/all-device-specs', authenticateToken, allDeviceSpecsController);

module.exports = router; 