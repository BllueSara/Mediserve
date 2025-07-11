const express = require('express');
const router = express.Router();
const pingAllController = require('../networkController/pingAllController');

router.post('/ping-all', pingAllController);

module.exports = router; 