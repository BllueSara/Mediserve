const express = require('express');
const router = express.Router();
const adminResetPasswordController = require('../userController/adminResetPasswordController');
const authenticateToken = require('../userController/authenticateTokenController');

router.put('/users/:id/reset-password', authenticateToken, adminResetPasswordController);

module.exports = router; 