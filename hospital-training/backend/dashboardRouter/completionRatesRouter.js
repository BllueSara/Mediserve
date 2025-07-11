const express = require('express');
const router = express.Router();
const completionRatesController = require('../dashboardController/completionRatesController');

router.get('/api/maintenance/completion-rates', completionRatesController);

module.exports = router; 