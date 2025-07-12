const express = require('express');
const router = express.Router();
const { addDevice } = require('../addController/addDeviceController');
const { authenticateToken } = require('../middlewares');

router.post('/AddDevice/:type', authenticateToken, addDevice);

module.exports = router; 