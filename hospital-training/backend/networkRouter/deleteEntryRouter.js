const express = require('express');
const router = express.Router();
const deleteEntryController = require('../networkController/deleteEntryController');
const authenticateToken = require('../userController/authenticateTokenController');

router.delete('/entries/:id', authenticateToken, deleteEntryController);

module.exports = router; 