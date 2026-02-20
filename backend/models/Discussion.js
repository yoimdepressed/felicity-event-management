import mongoose from 'mongoose';

const discussionSchema = new mongoose.Schema(
    {
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
            maxlength: [2000, 'Message cannot exceed 2000 characters'],
        },
        // Threading support: reference to parent message
        parentMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Discussion',
            default: null,
        },
        // Moderation
        isPinned: {
            type: Boolean,
            default: false,
        },
        isAnnouncement: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        // Reactions: Map of emoji -> array of user IDs
        reactions: {
            type: Map,
            of: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
            default: new Map(),
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
discussionSchema.index({ event: 1, createdAt: -1 });
discussionSchema.index({ event: 1, isPinned: -1, createdAt: -1 });
discussionSchema.index({ parentMessage: 1 });

const Discussion = mongoose.model('Discussion', discussionSchema);

export default Discussion;
