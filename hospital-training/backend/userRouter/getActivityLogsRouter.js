const express = require('express');
const router = express.Router();
const getActivityLogsController = require('../userController/getActivityLogsController');
const { authenticateToken } = require('../middlewares');

router.get('/activity-logs', authenticateToken, getActivityLogsController);

module.exports = router; 