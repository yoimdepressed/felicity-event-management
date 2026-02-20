import Discussion from '../models/Discussion.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

// Helper: check if user is registered for event or is the organizer
const canAccessForum = async (userId, userRole, eventId) => {
    if (userRole === 'admin') return true;

    // Check if organizer of this event
    const event = await Event.findById(eventId);
    if (!event) return false;
    if (event.organizer.toString() === userId.toString()) return true;

    // Check if registered participant
    const registration = await Registration.findOne({
        participant: userId,
        event: eventId,
        registrationStatus: { $in: ['Confirmed', 'PendingApproval'] },
    });
    return !!registration;
};

// @desc    Get messages for an event discussion
// @route   GET /api/discussions/event/:eventId
// @access  Private (registered participants + organizer)
export const getMessages = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { page = 1, limit = 50 } = req.query;

        // Check access
        const hasAccess = await canAccessForum(req.user.id, req.user.role, eventId);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'You must be registered for this event to access the discussion' });
        }

        // Get top-level messages (not replies) that are not deleted
        const messages = await Discussion.find({
            event: eventId,
            parentMessage: null,
            isDeleted: false,
        })
            .populate('user', 'firstName lastName role organizerName')
            .sort({ isPinned: -1, createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Get replies for each message
        const messageIds = messages.map(m => m._id);
        const replies = await Discussion.find({
            parentMessage: { $in: messageIds },
            isDeleted: false,
        })
            .populate('user', 'firstName lastName role organizerName')
            .sort({ createdAt: 1 })
            .lean();

        // Group replies by parent
        const repliesMap = {};
        replies.forEach(reply => {
            const parentId = reply.parentMessage.toString();
            if (!repliesMap[parentId]) repliesMap[parentId] = [];
            repliesMap[parentId].push(reply);
        });

        // Attach replies to messages
        const messagesWithReplies = messages.map(msg => ({
            ...msg,
            replies: repliesMap[msg._id.toString()] || [],
        }));

        const total = await Discussion.countDocuments({
            event: eventId,
            parentMessage: null,
            isDeleted: false,
        });

        res.status(200).json({
            success: true,
            data: messagesWithReplies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('[ERROR] Get messages:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};

// @desc    Post a message
// @route   POST /api/discussions/event/:eventId
// @access  Private (registered participants + organizer)
export const postMessage = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { content, parentMessage } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ success: false, message: 'Message content is required' });
        }

        const hasAccess = await canAccessForum(req.user.id, req.user.role, eventId);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'You must be registered for this event' });
        }

        // If replying, verify parent exists
        if (parentMessage) {
            const parent = await Discussion.findById(parentMessage);
            if (!parent || parent.event.toString() !== eventId) {
                return res.status(400).json({ success: false, message: 'Parent message not found' });
            }
        }

        const message = await Discussion.create({
            event: eventId,
            user: req.user.id,
            content: content.trim(),
            parentMessage: parentMessage || null,
        });

        const populated = await Discussion.findById(message._id)
            .populate('user', 'firstName lastName role organizerName');

        res.status(201).json({
            success: true,
            data: populated,
        });
    } catch (error) {
        console.error('[ERROR] Post message:', error.message);
        res.status(500).json({ success: false, message: 'Failed to post message' });
    }
};

// @desc    Post an announcement (organizer only)
// @route   POST /api/discussions/event/:eventId/announcement
// @access  Private (Organizer of event)
export const postAnnouncement = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { content } = req.body;

        // Verify organizer
        const event = await Event.findById(eventId);
        if (!event || event.organizer.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the event organizer can post announcements' });
        }

        const message = await Discussion.create({
            event: eventId,
            user: req.user.id,
            content: content.trim(),
            isAnnouncement: true,
            isPinned: true,
        });

        const populated = await Discussion.findById(message._id)
            .populate('user', 'firstName lastName role organizerName');

        res.status(201).json({
            success: true,
            data: populated,
        });
    } catch (error) {
        console.error('[ERROR] Post announcement:', error.message);
        res.status(500).json({ success: false, message: 'Failed to post announcement' });
    }
};

// @desc    Delete a message (organizer moderation)
// @route   DELETE /api/discussions/:messageId
// @access  Private (message author or event organizer)
export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Discussion.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Check permission: author or event organizer
        const event = await Event.findById(message.event);
        const isAuthor = message.user.toString() === req.user.id.toString();
        const isOrganizer = event && event.organizer.toString() === req.user.id.toString();

        if (!isAuthor && !isOrganizer && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
        }

        // Soft delete
        message.isDeleted = true;
        message.deletedBy = req.user.id;
        await message.save();

        res.status(200).json({ success: true, message: 'Message deleted' });
    } catch (error) {
        console.error('[ERROR] Delete message:', error.message);
        res.status(500).json({ success: false, message: 'Failed to delete message' });
    }
};

// @desc    Pin/Unpin a message (organizer only)
// @route   PUT /api/discussions/:messageId/pin
// @access  Private (Organizer)
export const togglePin = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Discussion.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        const event = await Event.findById(message.event);
        if (!event || event.organizer.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Only the event organizer can pin messages' });
        }

        message.isPinned = !message.isPinned;
        await message.save();

        res.status(200).json({
            success: true,
            message: message.isPinned ? 'Message pinned' : 'Message unpinned',
            data: { isPinned: message.isPinned },
        });
    } catch (error) {
        console.error('[ERROR] Toggle pin:', error.message);
        res.status(500).json({ success: false, message: 'Failed to toggle pin' });
    }
};

// @desc    Toggle reaction on a message
// @route   POST /api/discussions/:messageId/react
// @access  Private (registered participants + organizer)
export const toggleReaction = async (req, res) => {
    try {
        const { messageId } = req.params;
        const { emoji } = req.body;

        if (!emoji) {
            return res.status(400).json({ success: false, message: 'Emoji is required' });
        }

        const message = await Discussion.findById(messageId);
        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        // Check forum access
        const hasAccess = await canAccessForum(req.user.id, req.user.role, message.event);
        if (!hasAccess) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Toggle reaction
        const userId = req.user.id.toString();
        const currentReactions = message.reactions.get(emoji) || [];
        const userIndex = currentReactions.findIndex(id => id.toString() === userId);

        if (userIndex > -1) {
            currentReactions.splice(userIndex, 1);
        } else {
            currentReactions.push(req.user.id);
        }

        if (currentReactions.length === 0) {
            message.reactions.delete(emoji);
        } else {
            message.reactions.set(emoji, currentReactions);
        }

        message.markModified('reactions');
        await message.save();

        res.status(200).json({
            success: true,
            data: { reactions: Object.fromEntries(message.reactions) },
        });
    } catch (error) {
        console.error('[ERROR] Toggle reaction:', error.message);
        res.status(500).json({ success: false, message: 'Failed to toggle reaction' });
    }
};
