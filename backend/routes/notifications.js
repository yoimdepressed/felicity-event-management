import express from 'express';
import { protect } from '../middleware/auth.js';
import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
} from '../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(protect);

// GET /api/notifications - Get user's notifications
router.get('/', getNotifications);

// GET /api/notifications/unread-count - Get unread count
router.get('/unread-count', getUnreadCount);

// PUT /api/notifications/read-all - Mark all as read
router.put('/read-all', markAllAsRead);

// PUT /api/notifications/:id/read - Mark single notification as read
router.put('/:id/read', markAsRead);

export default router;
