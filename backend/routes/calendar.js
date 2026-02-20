import express from 'express';
import { protect } from '../middleware/auth.js';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

// @desc    Generate .ics file for an event
// @route   GET /api/calendar/event/:eventId/ics
// @access  Private (registered participant)
router.get('/event/:eventId/ics', async (req, res) => {
    try {
        const { eventId } = req.params;

        // Find event
        const event = await Event.findById(eventId).populate('organizer', 'organizerName');
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        // Verify user is registered
        const registration = await Registration.findOne({
            event: eventId,
            participant: req.user.id,
            registrationStatus: { $in: ['Confirmed', 'PendingApproval'] },
        });

        if (!registration) {
            return res.status(403).json({
                success: false,
                message: 'You must be registered for this event to add it to your calendar',
            });
        }

        // Generate ICS content
        const startDate = event.eventStartDate || event.startDate;
        const endDate = event.eventEndDate || event.endDate || startDate;

        const formatICSDate = (date) => {
            return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        };

        const uid = `felicity-${event._id}@felicity.event`;
        const dtStart = formatICSDate(startDate);
        const dtEnd = formatICSDate(endDate);
        const summary = event.eventName || event.name || 'Felicity Event';
        const description = (event.description || '').replace(/\n/g, '\\n').substring(0, 500);
        const location = event.venue || 'IIIT Hyderabad';
        const organizer = event.organizer?.organizerName || 'Felicity';

        const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'PRODID:-//Felicity//Event Management//EN',
            'CALSCALE:GREGORIAN',
            'METHOD:PUBLISH',
            'BEGIN:VEVENT',
            `UID:${uid}`,
            `DTSTART:${dtStart}`,
            `DTEND:${dtEnd}`,
            `SUMMARY:${summary}`,
            `DESCRIPTION:${description}`,
            `LOCATION:${location}`,
            `ORGANIZER;CN=${organizer}:MAILTO:noreply@felicity.com`,
            'STATUS:CONFIRMED',
            `DTSTAMP:${formatICSDate(new Date())}`,
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n');

        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${summary.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`);
        res.send(icsContent);
    } catch (error) {
        console.error('Generate ICS Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate calendar file' });
    }
});

// @desc    Get Google Calendar and Outlook links for an event
// @route   GET /api/calendar/event/:eventId/links
// @access  Private
router.get('/event/:eventId/links', async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId).populate('organizer', 'organizerName');
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        const startDate = event.eventStartDate || event.startDate;
        const endDate = event.eventEndDate || event.endDate || startDate;
        const summary = encodeURIComponent(event.eventName || event.name || 'Felicity Event');
        const description = encodeURIComponent((event.description || '').substring(0, 300));
        const location = encodeURIComponent(event.venue || 'IIIT Hyderabad');

        const formatGoogleDate = (date) => {
            return new Date(date).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        };

        const dtStart = formatGoogleDate(startDate);
        const dtEnd = formatGoogleDate(endDate);

        // Google Calendar link
        const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${summary}&dates=${dtStart}/${dtEnd}&details=${description}&location=${location}`;

        // Outlook Web link
        const outlookStart = new Date(startDate).toISOString();
        const outlookEnd = new Date(endDate).toISOString();
        const outlookUrl = `https://outlook.live.com/calendar/0/action/compose?subject=${summary}&startdt=${outlookStart}&enddt=${outlookEnd}&body=${description}&location=${location}`;

        res.status(200).json({
            success: true,
            data: {
                googleCalendarUrl,
                outlookUrl,
                icsUrl: `/api/calendar/event/${eventId}/ics`,
            },
        });
    } catch (error) {
        console.error('Get Calendar Links Error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate calendar links' });
    }
});

export default router;
