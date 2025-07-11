const express = require('express');
const router = express.Router();
const getMyEntriesController = require('../networkController/getMyEntriesController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/entries/mine', authenticateToken, getMyEntriesController);

module.exports = router; 