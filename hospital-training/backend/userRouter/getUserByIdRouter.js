const express = require('express');
const router = express.Router();
const getUserByIdController = require('../userController/getUserByIdController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/users/:id', authenticateToken, getUserByIdController);

module.exports = router; 