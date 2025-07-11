const express = require('express');
const router = express.Router();
const getUserWithPermissionsController = require('../userController/getUserWithPermissionsController');

router.get('/users/:id/with-permissions', getUserWithPermissionsController);

module.exports = router; 