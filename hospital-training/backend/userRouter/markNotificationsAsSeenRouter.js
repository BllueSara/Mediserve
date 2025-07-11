const express = require('express');
const router = express.Router();
const markNotificationsAsSeenController = require('../userController/markNotificationsAsSeenController');
const authenticateToken = require('../userController/authenticateTokenController');

router.post('/notifications/mark-as-seen', authenticateToken, markNotificationsAsSeenController);

module.exports = router; 