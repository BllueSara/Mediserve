const express = require('express');
const router = express.Router();
const externalTicketWithFileController = require('../ticketController/externalTicketWithFileController');
const { authenticateToken, upload } = require('../middlewares');

router.post('/external-ticket-with-file', upload.single('attachment'), authenticateToken, externalTicketWithFileController);

module.exports = router; 