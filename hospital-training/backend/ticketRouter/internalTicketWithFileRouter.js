const express = require('express');
const router = express.Router();
const internalTicketWithFileController = require('../ticketController/internalTicketWithFileController');
const { authenticateToken, upload } = require('../middlewares');

router.post('/internal-ticket-with-file', upload.single('attachment'), authenticateToken, internalTicketWithFileController);

module.exports = router; 