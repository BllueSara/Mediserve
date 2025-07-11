const express = require('express');
const router = express.Router();
const forgotPasswordController = require('../userController/forgotPasswordController');

router.post('/forgot-password', forgotPasswordController);

module.exports = router; 