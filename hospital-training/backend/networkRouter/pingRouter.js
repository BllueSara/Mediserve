const express = require('express');
const router = express.Router();
const pingController = require('../networkController/pingController');

router.post('/ping', pingController);

module.exports = router; 