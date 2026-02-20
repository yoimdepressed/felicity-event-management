import Feedback from '../models/Feedback.js';
import Registration from '../models/Registration.js';
import Event from '../models/Event.js';

// @desc    Submit anonymous feedback for an attended event
// @route   POST /api/feedback/event/:eventId
// @access  Private (Participant who attended)
export const submitFeedback = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { rating, comment } = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5',
            });
        }

        // Verify event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Verify participant attended the event
        const registration = await Registration.findOne({
            event: eventId,
            participant: req.user.id,
            registrationStatus: 'Confirmed',
            attended: true,
        });

        if (!registration) {
            return res.status(403).json({
                success: false,
                message: 'You can only provide feedback for events you have attended',
            });
        }

        // Check if feedback already exists
        const existingFeedback = await Feedback.findOne({
            event: eventId,
            participant: req.user.id,
        });

        if (existingFeedback) {
            // Update existing feedback
            existingFeedback.rating = rating;
            existingFeedback.comment = comment || '';
            await existingFeedback.save();

            return res.status(200).json({
                success: true,
                message: 'Feedback updated successfully',
                data: existingFeedback,
            });
        }

        // Create new feedback
        const feedback = await Feedback.create({
            event: eventId,
            participant: req.user.id,
            rating,
            comment: comment || '',
        });

        res.status(201).json({
            success: true,
            message: 'Feedback submitted successfully',
            data: feedback,
        });
    } catch (error) {
        console.error('Submit Feedback Error:', error);
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'You have already submitted feedback for this event',
            });
        }
        res.status(500).json({ success: false, message: 'Failed to submit feedback' });
    }
};

// @desc    Get aggregated feedback for an event (organizer view)
// @route   GET /api/feedback/event/:eventId
// @access  Private (Organizer of event)
export const getEventFeedback = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { rating: filterRating } = req.query;

        // Verify event exists
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Build query
        const query = { event: eventId };
        if (filterRating) {
            query.rating = parseInt(filterRating);
        }

        // Get feedback (anonymous - no participant info)
        const feedbacks = await Feedback.find(query)
            .select('rating comment createdAt')
            .sort({ createdAt: -1 });

        // Calculate aggregated stats
        const allFeedbacks = await Feedback.find({ event: eventId });
        const totalCount = allFeedbacks.length;
        const averageRating = totalCount > 0
            ? (allFeedbacks.reduce((sum, f) => sum + f.rating, 0) / totalCount).toFixed(1)
            : 0;

        // Rating distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        allFeedbacks.forEach(f => { distribution[f.rating]++; });

        res.status(200).json({
            success: true,
            data: {
                feedbacks,
                stats: {
                    totalCount,
                    averageRating: parseFloat(averageRating),
                    distribution,
                },
            },
        });
    } catch (error) {
        console.error('Get Event Feedback Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
    }
};

// @desc    Get my feedback for a specific event (participant)
// @route   GET /api/feedback/event/:eventId/my-feedback
// @access  Private (Participant)
export const getMyFeedback = async (req, res) => {
    try {
        const { eventId } = req.params;

        const feedback = await Feedback.findOne({
            event: eventId,
            participant: req.user.id,
        });

        res.status(200).json({
            success: true,
            data: feedback,
        });
    } catch (error) {
        console.error('Get My Feedback Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch feedback' });
    }
};
