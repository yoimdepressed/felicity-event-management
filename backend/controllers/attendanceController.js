import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

// @desc    Scan QR code and mark attendance
// @route   POST /api/attendance/scan
// @access  Private (Organizer)
export const scanQR = async (req, res) => {
    try {
        const { ticketId, eventId } = req.body;

        if (!ticketId || !eventId) {
            return res.status(400).json({
                success: false,
                message: 'Ticket ID and Event ID are required',
            });
        }

        // Find the registration by ticketId
        const registration = await Registration.findOne({ ticketId })
            .populate('participant', 'firstName lastName email')
            .populate('event', 'eventName organizer');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Invalid ticket - no registration found',
            });
        }

        // Verify the registration belongs to the correct event
        if (registration.event._id.toString() !== eventId) {
            return res.status(400).json({
                success: false,
                message: 'This ticket does not belong to this event',
            });
        }

        // Check if the organizer owns this event
        if (registration.event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to mark attendance for this event',
            });
        }

        // Check registration status
        if (registration.registrationStatus !== 'Confirmed') {
            return res.status(400).json({
                success: false,
                message: `Cannot mark attendance - registration status is ${registration.registrationStatus}`,
            });
        }

        // Check if already attended
        if (registration.attended) {
            return res.status(400).json({
                success: false,
                message: 'Attendance already marked for this participant',
                data: {
                    participant: registration.participant,
                    attendedAt: registration.attendedAt,
                },
            });
        }

        // Mark attendance
        registration.attended = true;
        registration.attendedAt = new Date();
        registration.attendanceMarked = true;
        registration.scannedBy = req.user.id;
        registration.scanMethod = 'Camera';
        await registration.save();

        res.status(200).json({
            success: true,
            message: 'Attendance marked successfully',
            data: {
                participant: registration.participant,
                ticketId: registration.ticketId,
                attendedAt: registration.attendedAt,
            },
        });
    } catch (error) {
        console.error('Scan QR Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process QR scan',
            error: error.message,
        });
    }
};

// @desc    Manual attendance override
// @route   POST /api/attendance/manual
// @access  Private (Organizer)
export const manualOverride = async (req, res) => {
    try {
        const { registrationId, markAttended, reason } = req.body;

        if (!registrationId) {
            return res.status(400).json({
                success: false,
                message: 'Registration ID is required',
            });
        }

        const registration = await Registration.findById(registrationId)
            .populate('participant', 'firstName lastName email')
            .populate('event', 'eventName organizer');

        if (!registration) {
            return res.status(404).json({
                success: false,
                message: 'Registration not found',
            });
        }

        // Check authorization
        if (registration.event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        registration.attended = markAttended !== false;
        registration.attendanceMarked = true;
        registration.attendedAt = markAttended !== false ? new Date() : null;
        registration.scannedBy = req.user.id;
        registration.scanMethod = 'Manual';
        if (reason) registration.manualOverrideReason = reason;
        await registration.save();

        res.status(200).json({
            success: true,
            message: markAttended !== false ? 'Attendance marked manually' : 'Attendance unmarked',
            data: registration,
        });
    } catch (error) {
        console.error('Manual Override Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update attendance',
            error: error.message,
        });
    }
};

// @desc    Get attendance list for an event
// @route   GET /api/attendance/event/:eventId
// @access  Private (Organizer)
export const getEventAttendance = async (req, res) => {
    try {
        const { eventId } = req.params;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }

        // Check authorization
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        const registrations = await Registration.find({
            event: eventId,
            registrationStatus: 'Confirmed',
        })
            .populate('participant', 'firstName lastName email college contactNumber')
            .populate('scannedBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        const total = registrations.length;
        const attended = registrations.filter(r => r.attended).length;

        res.status(200).json({
            success: true,
            data: {
                registrations,
                stats: {
                    total,
                    attended,
                    notAttended: total - attended,
                    attendanceRate: total > 0 ? Math.round((attended / total) * 100) : 0,
                },
            },
        });
    } catch (error) {
        console.error('Get Event Attendance Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch attendance',
            error: error.message,
        });
    }
};

// @desc    Get attendance audit log for an event
// @route   GET /api/attendance/event/:eventId/audit
// @access  Private (Organizer)
export const getAuditLog = async (req, res) => {
    try {
        const { eventId } = req.params;

        const registrations = await Registration.find({
            event: eventId,
            attendanceMarked: true,
        })
            .populate('participant', 'firstName lastName email')
            .populate('scannedBy', 'firstName lastName')
            .sort({ attendedAt: -1 });

        res.status(200).json({
            success: true,
            data: registrations.map(r => ({
                participant: r.participant,
                ticketId: r.ticketId,
                attended: r.attended,
                attendedAt: r.attendedAt,
                scanMethod: r.scanMethod || 'Unknown',
                scannedBy: r.scannedBy,
                overrideReason: r.manualOverrideReason,
            })),
        });
    } catch (error) {
        console.error('Get Audit Log Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch audit log',
            error: error.message,
        });
    }
};
