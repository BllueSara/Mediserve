const express = require('express');
const router = express.Router();
const updateRoleController = require('../userController/updateRoleController');
const authenticateToken = require('../userController/authenticateTokenController');

router.put('/users/:id/role', authenticateToken, updateRoleController);

module.exports = router; 