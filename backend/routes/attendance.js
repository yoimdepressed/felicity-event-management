import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    scanQR,
    manualOverride,
    getEventAttendance,
    getAuditLog,
} from '../controllers/attendanceController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/attendance/scan
// @desc    Scan QR code to mark attendance
// @access  Private (Organizer)
router.post('/scan', scanQR);

// @route   POST /api/attendance/manual
// @desc    Manual attendance override
// @access  Private (Organizer)
router.post('/manual', manualOverride);

// @route   GET /api/attendance/event/:eventId
// @desc    Get attendance list for an event
// @access  Private (Organizer)
router.get('/event/:eventId', getEventAttendance);

// @route   GET /api/attendance/event/:eventId/audit
// @desc    Get attendance audit log
// @access  Private (Organizer)
router.get('/event/:eventId/audit', getAuditLog);

export default router;
