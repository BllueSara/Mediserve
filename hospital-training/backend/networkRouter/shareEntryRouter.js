const express = require('express');
const router = express.Router();
const shareEntryController = require('../networkController/shareEntryController');
const authenticateToken = require('../userController/authenticateTokenController');

router.post('/share-entry', authenticateToken, shareEntryController);

module.exports = router; 