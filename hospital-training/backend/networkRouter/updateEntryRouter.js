const express = require('express');
const router = express.Router();
const updateEntryController = require('../networkController/updateEntryController');
const authenticateToken = require('../userController/authenticateTokenController');

router.put('/entries/:id', authenticateToken, updateEntryController);

module.exports = router; 