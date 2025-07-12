const express = require('express');
const router = express.Router();
const { authenticateToken, upload } = require('../middlewares');
const submitNewReportController = require('../reportController/submitNewReportController');

router.post(
  '/submit-new-report',
  authenticateToken,
  upload.fields([
    { name: 'attachment', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  submitNewReportController
);

module.exports = router; 