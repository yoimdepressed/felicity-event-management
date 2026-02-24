import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import {
    getMessages,
    postMessage,
    postAnnouncement,
    deleteMessage,
    togglePin,
    toggleReaction,
} from '../controllers/discussionController.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// Get messages for an event
router.get('/event/:eventId', getMessages);

// Post a message (participant or organizer)
router.post('/event/:eventId', postMessage);

// Post an announcement (organizer or admin only)
router.post('/event/:eventId/announcement', authorize('organizer', 'admin'), postAnnouncement);

// Delete a message (author or organizer moderation)
router.delete('/:messageId', deleteMessage);

// Pin/Unpin a message (organizer or admin only)
router.put('/:messageId/pin', authorize('organizer', 'admin'), togglePin);

// Toggle reaction on a message
router.post('/:messageId/react', toggleReaction);

export default router;
