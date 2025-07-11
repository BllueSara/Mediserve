const express = require('express');
const router = express.Router();
const getActivityLogsController = require('../userController/getActivityLogsController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/activity-logs', authenticateToken, getActivityLogsController);

module.exports = router; 