const express = require('express');
const router = express.Router();
const { addOptionsRegular } = require('../addController/addOptionsRegularController');
const { authenticateToken } = require('../middlewares');

router.post('/add-options-regular', authenticateToken, addOptionsRegular);

module.exports = router; 