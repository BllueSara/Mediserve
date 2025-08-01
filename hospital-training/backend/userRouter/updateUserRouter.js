const express = require('express');
const router = express.Router();
const updateUserController = require('../userController/updateUserController');
const authenticateToken = require('../userController/authenticateTokenController');

router.put('/users/:id', authenticateToken, updateUserController);

module.exports = router; 