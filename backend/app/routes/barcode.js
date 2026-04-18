// routes/barcodeRoutes.js
import { Router } from 'express';
const router = Router();
import userController from "../controllers/userController.js"


// Route to generate barcode for a user
router.post('/create-user', userController.createUserC);

// Route to generate barcode for a user
router.post('/generate-barcode', userController.generateBarcodeC);

// Route to generate barcode for all user
router.post('/generate-barcodes', userController.generateBarcodesC);

// Route to get list of all barcodes
router.get('/barcode-list', userController.getBarcodeListC);

// Route to get list of all barcodes
router.get('/get-attended-users', userController.getAttendedListC);

// Route to get list of all barcodes
router.get('/attendance-summary', userController.getAttendenceSummeryC);

// Route to mark attendance using barcode
router.post('/mark-attendance', userController.markAttendanceC);

// Route to download barcodes
router.get('/download-barcodes', userController.downloadBarcodesC);

router.get('/preview-pdf', userController.previewPdfListC);

export default router;
