const express = require('express');
const router = express.Router();
const updateStatusController = require('../userController/updateStatusController');
const authenticateToken = require('../userController/authenticateTokenController');

router.put('/users/:id/status', authenticateToken, updateStatusController);

module.exports = router; 