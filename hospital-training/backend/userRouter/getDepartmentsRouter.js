const express = require('express');
const router = express.Router();
const getDepartmentsController = require('../userController/getDepartmentsController');

router.get('/Departments', getDepartmentsController);

module.exports = router; 