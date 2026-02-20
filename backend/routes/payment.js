import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, authorize } from '../middleware/auth.js';
import {
    uploadPaymentProof,
    getPendingPayments,
    approvePayment,
    rejectPayment,
} from '../controllers/paymentController.js';

const router = express.Router();

// Configure multer for payment proof uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/payment-proofs/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'proof-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});

// All routes require authentication
router.use(protect);

// Participant routes
router.post(
    '/:registrationId/upload-proof',
    authorize('participant'),
    upload.single('paymentProof'),
    uploadPaymentProof
);

// Organizer routes
router.get('/event/:eventId/pending', authorize('organizer'), getPendingPayments);
router.put('/:registrationId/approve', authorize('organizer'), approvePayment);
router.put('/:registrationId/reject', authorize('organizer'), rejectPayment);

export default router;
