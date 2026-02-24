import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
        },
        type: {
            type: String,
            enum: ['announcement', 'organizer_message', 'event_update'],
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        discussionMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Discussion',
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
notificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ user: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
