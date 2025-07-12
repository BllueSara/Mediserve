const express = require('express');
const router = express.Router();
const { addDeviceSpecification } = require('../addController/addDeviceSpecificationController');

router.post('/add-device-specification', addDeviceSpecification);

module.exports = router; 