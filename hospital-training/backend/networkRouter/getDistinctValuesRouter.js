const express = require('express');
const router = express.Router();
const getDistinctValuesController = require('../networkController/getDistinctValuesController');
const authenticateToken = require('../userController/authenticateTokenController');

router.get('/distinct-values/:key', authenticateToken, getDistinctValuesController);

module.exports = router; 