const express = require('express');
const router = express.Router();
const getUnseenNotificationsCountController = require('../userController/getUnseenNotificationsCountController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/notifications/unseen-count', authenticateToken, getUnseenNotificationsCountController);

module.exports = router; 