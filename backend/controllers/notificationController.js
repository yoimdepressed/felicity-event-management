import Notification from '../models/Notification.js';

// @desc    Get user's notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;

        const notifications = await Notification.find({ user: req.user.id })
            .populate('event', 'eventName eventType')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        const total = await Notification.countDocuments({ user: req.user.id });
        const unreadCount = await Notification.countDocuments({ user: req.user.id, isRead: false });

        res.status(200).json({
            success: true,
            data: notifications,
            unreadCount,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('[ERROR] Get notifications:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

// @desc    Get unread notification count
// @route   GET /api/notifications/unread-count
// @access  Private
export const getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({ user: req.user.id, isRead: false });
        res.status(200).json({ success: true, count });
    } catch (error) {
        console.error('[ERROR] Get unread count:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        console.error('[ERROR] Mark as read:', error.message);
        res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
    }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, isRead: false },
            { isRead: true }
        );
        res.status(200).json({ success: true, message: 'All notifications marked as read' });
    } catch (error) {
        console.error('[ERROR] Mark all as read:', error.message);
        res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
};
