const express = require('express');
const router = express.Router();
const ctrl = require('../addController/addOptionsController');

router.post('/add-os', ctrl.addOS);
router.post('/add-ram', ctrl.addRAM);
router.post('/add-cpu', ctrl.addCPU);
router.post('/add-harddrive', ctrl.addHardDrive);
router.post('/add-ink-type', ctrl.addInkType);
router.post('/add-scanner-type', ctrl.addScannerType);
router.post('/add-department', ctrl.addDepartment);
router.post('/add-popup-option', ctrl.addPopupOption);
router.post('/add-printer-type', ctrl.addPrinterType);
router.post('/add-generation', ctrl.addGeneration);
router.post('/add-ram-size', ctrl.addRamSize);

module.exports = router; 