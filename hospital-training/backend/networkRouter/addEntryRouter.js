const express = require('express');
const router = express.Router();
const addEntryController = require('../networkController/addEntryController');
const authenticateToken = require('../userController/authenticateTokenController');

router.post('/add-entry', authenticateToken, addEntryController);

module.exports = router; 