const express = require('express');
const router = express.Router();
const getSharedEntriesController = require('../networkController/getSharedEntriesController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/entries/shared-with-me', authenticateToken, getSharedEntriesController);

module.exports = router; 