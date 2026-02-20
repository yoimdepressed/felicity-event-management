import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    submitFeedback,
    getEventFeedback,
    getMyFeedback,
} from '../controllers/feedbackController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @route   POST /api/feedback/event/:eventId
// @desc    Submit anonymous feedback
router.post('/event/:eventId', submitFeedback);

// @route   GET /api/feedback/event/:eventId
// @desc    Get aggregated feedback for event
router.get('/event/:eventId', getEventFeedback);

// @route   GET /api/feedback/event/:eventId/my-feedback
// @desc    Get my feedback for event
router.get('/event/:eventId/my-feedback', getMyFeedback);

export default router;
