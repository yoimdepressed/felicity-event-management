import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
  scanQRCode,
  manualAttendanceOverride,
  getAttendanceDashboard,
  exportAttendanceCSV,
  getAttendanceAuditLog
} from '../controllers/attendanceController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// QR Code scanning - Organizer or Admin only
router.post('/scan', authorize('organizer', 'admin'), scanQRCode);

// Manual attendance override - Organizer or Admin only
router.post('/manual-override', authorize('organizer', 'admin'), manualAttendanceOverride);

// Get attendance dashboard for an event
router.get('/event/:eventId/dashboard', authorize('organizer', 'admin'), getAttendanceDashboard);

// Export attendance as CSV
router.get('/event/:eventId/export', authorize('organizer', 'admin'), exportAttendanceCSV);

// Get audit log for manual overrides
router.get('/event/:eventId/audit-log', authorize('organizer', 'admin'), getAttendanceAuditLog);

export default router;
