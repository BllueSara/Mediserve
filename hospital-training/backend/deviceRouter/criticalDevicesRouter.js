const express = require('express');
const router = express.Router();
const criticalDevicesController = require('../deviceController/criticalDevicesController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/api/critical-devices', authenticateToken, criticalDevicesController);

module.exports = router; 