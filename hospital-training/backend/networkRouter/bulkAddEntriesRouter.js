const express = require('express');
const router = express.Router();
const bulkAddEntriesController = require('../networkController/bulkAddEntriesController');
const authenticateToken = require('../userController/authenticateTokenController');

router.post('/entries/bulk', authenticateToken, bulkAddEntriesController);

module.exports = router; 