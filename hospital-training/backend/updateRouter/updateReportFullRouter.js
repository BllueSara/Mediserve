const express = require('express');
const router = express.Router();
const { updateReportFull } = require('../updateController/updateReportFullController');
const { authenticateToken, upload } = require('../middlewares');

router.post(
  '/update-report-full',
  authenticateToken,
  upload.fields([
    { name: 'attachment', maxCount: 1 },
    { name: 'signature', maxCount: 1 }
  ]),
  updateReportFull
);

module.exports = router; 