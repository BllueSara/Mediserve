const express = require('express');
const router = express.Router();
const saveDevicesController = require('../networkController/saveDevicesController');
const authenticateToken = require('../userController/authenticateTokenController');

router.post('/save', authenticateToken, saveDevicesController);

module.exports = router; 