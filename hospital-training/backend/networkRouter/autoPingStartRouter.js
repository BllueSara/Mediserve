const express = require('express');
const router = express.Router();
const autoPingStartController = require('../networkController/autoPingStartController');
const { authenticateToken } = require('../middlewares');

router.post('/auto-ping/start', authenticateToken, autoPingStartController);

module.exports = router; 