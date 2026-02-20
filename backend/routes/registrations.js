import express from 'express';
import {
  registerForEvent,
  getMyRegistrations,
  getRegistrationById,
  cancelRegistration,
  getEventRegistrations,
} from '../controllers/registrationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// PARTICIPANT ROUTES
// ============================================

// @route   POST /api/registrations
// @desc    Register for an event
// @access  Private (Participant only)
router.post('/', protect, authorize('participant'), registerForEvent);

// @route   GET /api/registrations/my
// @desc    Get my registrations
// @access  Private (Participant only)
router.get('/my', protect, authorize('participant'), getMyRegistrations);

// @route   GET /api/registrations/:id
// @desc    Get single registration details
// @access  Private (Participant only - own registration)
router.get('/:id', protect, authorize('participant'), getRegistrationById);

// @route   DELETE /api/registrations/:id
// @desc    Cancel registration
// @access  Private (Participant only - own registration)
router.delete('/:id', protect, authorize('participant'), cancelRegistration);

// ============================================
// ORGANIZER ROUTES
// ============================================

// @route   GET /api/registrations/event/:eventId
// @desc    Get all registrations for an event (organizer only)
// @access  Private (Organizer - own events only)
router.get('/event/:eventId', protect, authorize('organizer'), getEventRegistrations);

export default router;
