const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares');
const { updateDeviceSpecificationController } = require('../updateController/updateDeviceSpecificationController');

router.post('/update-device-specification', authenticateToken, updateDeviceSpecificationController);

module.exports = router; 