const express = require('express');
const router = express.Router();
const { addOptionInternalTicket } = require('../addController/addOptionInternalTicketController');
const { authenticateToken } = require('../middlewares');

router.post('/add-option-internal-ticket', authenticateToken, addOptionInternalTicket);

module.exports = router; 