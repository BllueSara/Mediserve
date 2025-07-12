const express = require('express');
const router = express.Router();
const needsUpgradeController = require('../deviceController/needsUpgradeController');
const { authenticateToken } = require('../middlewares');

router.get('/api/devices/needs-upgrade', authenticateToken, needsUpgradeController);

module.exports = router; 