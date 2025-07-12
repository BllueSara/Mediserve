const express = require('express');
const router = express.Router();
const ctrl = require('../getController/getDeviceSpecController');

router.get('/device-spec/:id', ctrl.getDeviceSpec);

module.exports = router; 