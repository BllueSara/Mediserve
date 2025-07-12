const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares');
const { deleteDeviceSpecificationController } = require('../deleteController/deleteDeviceSpecificationController');

router.post('/delete-device-specification', authenticateToken, deleteDeviceSpecificationController);

module.exports = router; 