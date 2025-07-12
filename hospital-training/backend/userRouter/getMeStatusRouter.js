const express = require('express');
const router = express.Router();
const getMeStatusController = require('../userController/getMeStatusController');
const { authenticateToken } = require('../middlewares');

router.get('/me/status', authenticateToken, getMeStatusController);

module.exports = router; 