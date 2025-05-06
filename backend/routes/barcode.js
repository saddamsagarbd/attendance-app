// routes/barcodeRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');


// Route to generate barcode for a user
router.post('/create-user', userController.createUser);

// Route to generate barcode for a user
router.post('/generate-barcode', userController.generateBarcode);

// Route to generate barcode for all user
router.post('/generate-barcodes', userController.generateBarcodes);

// Route to get list of all barcodes
router.get('/barcode-list', userController.getBarcodeList);

// Route to get list of all barcodes
router.get('/get-attended-users', userController.getAttendedList);

// Route to get list of all barcodes
router.get('/attendance-summary', userController.getAttendenceSummery);

// Route to mark attendance using barcode
router.post('/mark-attendance', userController.markAttendance);

// Route to download barcodes
router.get('/download-barcodes', userController.downloadBarcodes);

router.get('/preview-pdf', userController.previewPdfList);

module.exports = router;
