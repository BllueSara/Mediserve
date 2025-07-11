const express = require('express');
const router = express.Router();
const deleteUserController = require('../userController/deleteUserController');
const authenticateToken = require('../userController/authenticateTokenController');

router.delete('/users/:id', authenticateToken, deleteUserController);

module.exports = router; 