const express = require('express');
const router = express.Router();
const { addOptionGeneral } = require('../addController/addOptionGeneralController');
const { authenticateToken } = require('../middlewares');

router.post('/add-option-general', authenticateToken, addOptionGeneral);

module.exports = router; 