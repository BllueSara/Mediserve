const express = require('express');
const router = express.Router();
const getNotificationsController = require('../userController/getNotificationsController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/notifications', authenticateToken, getNotificationsController);

module.exports = router; 