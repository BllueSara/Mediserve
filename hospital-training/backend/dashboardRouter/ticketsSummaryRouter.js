const express = require('express');
const router = express.Router();
const ticketsSummaryController = require('../dashboardController/ticketsSummaryController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/api/tickets/summary', authenticateToken, ticketsSummaryController);

module.exports = router; 