const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares');
const { updateOptionCompleteController } = require('../updateController/updateOptionCompleteController');

router.post('/update-option-complete', authenticateToken, updateOptionCompleteController);

module.exports = router; 