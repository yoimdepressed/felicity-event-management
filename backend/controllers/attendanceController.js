import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';

// Helper to check organizer authorization
const isAuthorized = (event, user) => {
    if (user.role === 'admin') return true;
    const organizerId = event.organizer?._id || event.organizer;
    return organizerId.toString() === user._id.toString();
};

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
                message: 'Invalid ticket - no registration found for this ticket ID',
            });
        }

        // Verify the registration belongs to the correct event
        const regEventId = registration.event?._id || registration.event;
        if (regEventId.toString() !== eventId) {
            return res.status(400).json({
                success: false,
                message: 'This ticket does not belong to this event',
            });
        }

        // Check if the organizer owns this event
        if (!isAuthorized(registration.event, req.user)) {
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

        // Check if already attended (reject duplicate scans)
        if (registration.attended) {
            return res.status(400).json({
                success: false,
                message: `Duplicate scan rejected - attendance already marked at ${new Date(registration.attendedAt).toLocaleString('en-IN')}`,
                data: {
                    participant: registration.participant,
                    attendedAt: registration.attendedAt,
                    duplicate: true,
                },
            });
        }

        // Mark attendance with timestamp
        registration.attended = true;
        registration.attendedAt = new Date();
        registration.scannedBy = req.user._id;
        registration.scanMethod = req.body.scanMethod || 'Camera';
        await registration.save();

        res.status(200).json({
            success: true,
            message: `✅ Attendance marked for ${registration.participant.firstName} ${registration.participant.lastName}`,
            data: {
                participant: registration.participant,
                ticketId: registration.ticketId,
                attendedAt: registration.attendedAt,
                scanMethod: registration.scanMethod,
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

// @desc    Manual attendance override (with audit logging)
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
        if (!isAuthorized(registration.event, req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized',
            });
        }

        const shouldMark = markAttended !== false;
        registration.attended = shouldMark;
        registration.attendedAt = shouldMark ? new Date() : null;
        registration.scannedBy = req.user._id;
        registration.scanMethod = 'Manual';
        registration.manualOverride = {
            isOverridden: true,
            reason: reason || 'Manual override by organizer',
            overriddenBy: req.user._id,
            overriddenAt: new Date(),
        };
        await registration.save();

        res.status(200).json({
            success: true,
            message: shouldMark
                ? `Attendance manually marked for ${registration.participant.firstName}`
                : `Attendance unmarked for ${registration.participant.firstName}`,
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

// @desc    Get attendance list for an event (live dashboard)
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

        // Check authorization - use robust comparison
        if (!isAuthorized(event, req.user)) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view attendance for this event',
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
        const scanned = registrations.filter(r => r.attended);
        const notScanned = registrations.filter(r => !r.attended);

        res.status(200).json({
            success: true,
            data: {
                registrations,
                scanned,
                notScanned,
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

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (!isAuthorized(event, req.user)) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        const registrations = await Registration.find({
            event: eventId,
            $or: [{ attended: true }, { 'manualOverride.isOverridden': true }],
        })
            .populate('participant', 'firstName lastName email')
            .populate('scannedBy', 'firstName lastName')
            .populate('manualOverride.overriddenBy', 'firstName lastName')
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
                manualOverride: r.manualOverride,
                overrideReason: r.manualOverride?.reason || null,
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
