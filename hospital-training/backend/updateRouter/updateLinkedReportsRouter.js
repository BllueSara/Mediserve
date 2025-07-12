const express = require('express');
const router = express.Router();
const updateLinkedReportsController = require('../updateController/updateLinkedReportsController');

router.put('/update-linked-reports', updateLinkedReportsController);

module.exports = router; 