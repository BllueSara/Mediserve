const express = require('express');
const router = express.Router();
const clearNotificationsController = require('../userController/clearNotificationsController');
const authenticateToken = require('../userController/authenticateTokenController');

router.delete('/notifications/clear', authenticateToken, clearNotificationsController);

module.exports = router; 