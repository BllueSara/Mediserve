const express = require('express');
const router = express.Router();
const resetPasswordController = require('../userController/resetPasswordController');

router.post('/reset-password/:token', resetPasswordController);

module.exports = router; 