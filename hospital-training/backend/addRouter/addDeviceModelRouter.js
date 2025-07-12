const express = require('express');
const router = express.Router();
const { addDeviceModel } = require('../addController/addDeviceModelController');
const { authenticateToken } = require('../middlewares');

router.post('/add-device-model', authenticateToken, addDeviceModel);

module.exports = router; 