const express = require('express');
const router = express.Router();
const registerController = require('../userController/registerController');

router.post('/register', registerController);

module.exports = router; 