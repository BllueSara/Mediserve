const express = require('express');
const router = express.Router();
const autoPingResultsController = require('../networkController/autoPingResultsController');
const { authenticateToken } = require('../middlewares');

router.get('/auto-ping/results', authenticateToken, autoPingResultsController);

module.exports = router; 