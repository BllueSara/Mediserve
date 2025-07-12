const express = require('express');
const router = express.Router();
const ctrl = require('../getController/getReportDetailsController');

router.get('/report/:id', ctrl.getReportDetails);

module.exports = router; 