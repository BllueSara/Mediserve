const express = require('express');
const router = express.Router();
const deleteNotificationController = require('../userController/deleteNotificationController');
const authenticateToken = require('../userController/authenticateTokenController');

router.delete('/notifications/:id', authenticateToken, deleteNotificationController);

module.exports = router; 