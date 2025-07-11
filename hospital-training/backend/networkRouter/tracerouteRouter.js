const express = require('express');
const router = express.Router();
const tracerouteController = require('../networkController/tracerouteController');

router.post('/traceroute', tracerouteController);

module.exports = router; 