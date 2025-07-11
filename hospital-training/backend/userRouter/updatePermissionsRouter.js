const express = require('express');
const router = express.Router();
const updatePermissionsController = require('../userController/updatePermissionsController');
const authenticateToken = require('../userController/authenticateTokenController');

router.put('/users/:id/permissions', authenticateToken, updatePermissionsController);

module.exports = router; 