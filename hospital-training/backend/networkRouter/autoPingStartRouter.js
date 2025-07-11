const express = require('express');
const router = express.Router();
const autoPingStartController = require('../networkController/autoPingStartController');
const authenticateToken = require('../userController/authenticateTokenController');

router.post('/auto-ping/start', authenticateToken, autoPingStartController);

module.exports = router; 