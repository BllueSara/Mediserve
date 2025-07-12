const express = require('express');
const router = express.Router();
const { addOptionExternalTicket } = require('../addController/addOptionExternalTicketController');
const { authenticateToken } = require('../middlewares');

router.post('/add-option-external-ticket', authenticateToken, addOptionExternalTicket);

module.exports = router; 