const express = require('express');
const router = express.Router();
const ctrl = require('../getController/getExternalReportsController');
const { authenticateToken } = require('../middlewares');

router.get('/get-external-reports', authenticateToken, ctrl.getExternalReports);

module.exports = router; 