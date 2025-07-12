const express = require('express');
const router = express.Router();
const getMyReportsController = require('../networkController/getMyReportsController');
const { authenticateToken } = require('../middlewares');

router.get('/reports/mine', authenticateToken, getMyReportsController);

module.exports = router; 