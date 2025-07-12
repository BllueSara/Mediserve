const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares');
const { deleteOptionCompleteController } = require('../deleteController/deleteOptionCompleteController');

router.post('/delete-option-complete', authenticateToken, deleteOptionCompleteController);

module.exports = router; 