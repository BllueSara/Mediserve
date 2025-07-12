const express = require('express');
const router = express.Router();
const getFullNameController = require('../getController/getFullNameController');
const { authenticateToken } = require('../middlewares');

router.post('/get-full-name', authenticateToken, getFullNameController);

module.exports = router; 