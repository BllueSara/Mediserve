const express = require('express');
const router = express.Router();
const getUsersController = require('../networkController/getUsersController');
const { authenticateToken } = require('../middlewares');

router.get('/users', authenticateToken, getUsersController);

module.exports = router; 