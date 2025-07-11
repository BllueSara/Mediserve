const express = require('express');
const router = express.Router();
const getUserPermissionsController = require('../userController/getUserPermissionsController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/users/:id/permissions', authenticateToken, getUserPermissionsController);

module.exports = router; 