const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares');
const { updateOptionGeneralController } = require('../updateController/updateOptionGeneralController');

router.post('/update-option-general', authenticateToken, updateOptionGeneralController);

module.exports = router; 