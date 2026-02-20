import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import { Parser } from 'json2csv';

// @desc    Scan QR code and mark attendance
// @route   POST /api/attendance/scan
// @access  Private (Organizer)
export const scanQRCode = async (req, res) => {
  try {
    const { ticketId, scanMethod = 'Camera' } = req.body;

    if (!ticketId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required'
      });
    }

    // Find registration by ticket ID
    const registration = await Registration.findOne({ ticketId })
      .populate('participant', 'firstName lastName email')
      .populate('event', 'eventName eventDate organizer');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Invalid ticket. Registration not found.'
      });
    }

    // Check if organizer has permission for this event
    if (registration.event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to scan tickets for this event'
      });
    }

    // Check if already attended
    if (registration.attended) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate scan detected! Participant has already checked in.',
        data: {
          participant: `${registration.participant.firstName} ${registration.participant.lastName}`,
          attendedAt: registration.attendedAt,
          scannedBy: registration.scannedBy
        }
      });
    }

    // Check if registration is cancelled
    if (registration.registrationStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This registration has been cancelled'
      });
    }

    // Mark attendance
    registration.attended = true;
    registration.attendedAt = new Date();
    registration.scannedBy = req.user._id;
    registration.scanMethod = scanMethod;

    await registration.save();

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully! ✅',
      data: {
        ticketId: registration.ticketId,
        participant: {
          name: `${registration.participant.firstName} ${registration.participant.lastName}`,
          email: registration.participant.email
        },
        event: registration.event.eventName,
        attendedAt: registration.attendedAt
      }
    });

  } catch (error) {
    console.error('Scan QR Code Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan QR code',
      error: error.message
    });
  }
};

// @desc    Manual attendance override
// @route   POST /api/attendance/manual-override
// @access  Private (Organizer)
export const manualAttendanceOverride = async (req, res) => {
  try {
    const { registrationId, markAttended, reason } = req.body;

    if (!registrationId || markAttended === undefined || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Registration ID, attendance status, and reason are required'
      });
    }

    const registration = await Registration.findById(registrationId)
      .populate('event', 'eventName organizer');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check permission
    if (registration.event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to override attendance for this event'
      });
    }

    // Update attendance with manual override
    registration.attended = markAttended;
    registration.attendedAt = markAttended ? new Date() : null;
    registration.scanMethod = 'Manual';
    registration.manualOverride = {
      isOverridden: true,
      reason: reason,
      overriddenBy: req.user._id,
      overriddenAt: new Date()
    };

    await registration.save();

    res.status(200).json({
      success: true,
      message: `Attendance ${markAttended ? 'marked' : 'unmarked'} manually`,
      data: {
        registration: registration._id,
        attended: registration.attended,
        reason: reason
      }
    });

  } catch (error) {
    console.error('Manual Override Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to override attendance',
      error: error.message
    });
  }
};

// @desc    Get attendance dashboard for an event
// @route   GET /api/attendance/event/:eventId/dashboard
// @access  Private (Organizer)
export const getAttendanceDashboard = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event exists and organizer has permission
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view attendance for this event'
      });
    }

    // Get all registrations with attendance data
    const registrations = await Registration.find({
      event: eventId,
      registrationStatus: { $ne: 'Cancelled' }
    })
      .populate('participant', 'firstName lastName email contactNumber')
      .populate('scannedBy', 'firstName lastName')
      .sort({ attendedAt: -1 })
      .lean(); // Use lean() for better performance

    // Calculate statistics
    const totalRegistrations = registrations.length;
    const totalAttended = registrations.filter(r => r.attended).length;
    const totalNotAttended = totalRegistrations - totalAttended;
    const attendancePercentage = totalRegistrations > 0 
      ? ((totalAttended / totalRegistrations) * 100).toFixed(2) 
      : 0;

    // Group by scan method
    const scanMethodStats = registrations.reduce((acc, reg) => {
      if (reg.attended && reg.scanMethod) {
        acc[reg.scanMethod] = (acc[reg.scanMethod] || 0) + 1;
      }
      return acc;
    }, {});

    // Recent scans (last 10) with null safety
    const recentScans = registrations
      .filter(r => r.attended && r.participant)
      .slice(0, 10)
      .map(r => ({
        ticketId: r.ticketId,
        participant: {
          name: r.participant ? `${r.participant.firstName || ''} ${r.participant.lastName || ''}`.trim() : 'N/A',
          email: r.participant?.email || 'N/A'
        },
        attendedAt: r.attendedAt,
        scanMethod: r.scanMethod || 'N/A',
        scannedBy: r.scannedBy ? `${r.scannedBy.firstName || ''} ${r.scannedBy.lastName || ''}`.trim() : 'N/A',
        manualOverride: r.manualOverride?.isOverridden || false
      }));

    res.status(200).json({
      success: true,
      data: {
        eventName: event.eventName,
        statistics: {
          totalRegistrations,
          totalAttended,
          totalNotAttended,
          attendancePercentage: parseFloat(attendancePercentage),
          scanMethodBreakdown: scanMethodStats
        },
        recentScans,
        registrations: registrations.map(r => ({
          _id: r._id,
          ticketId: r.ticketId,
          participant: {
            name: r.participant ? `${r.participant.firstName || ''} ${r.participant.lastName || ''}`.trim() : 'N/A',
            email: r.participant?.email || 'N/A',
            contactNumber: r.participant?.contactNumber || 'N/A'
          },
          attended: r.attended || false,
          attendedAt: r.attendedAt || null,
          scanMethod: r.scanMethod || null,
          registrationStatus: r.registrationStatus,
          manualOverride: r.manualOverride?.isOverridden || false,
          overrideReason: r.manualOverride?.reason || null
        }))
      }
    });

  } catch (error) {
    console.error('Get Attendance Dashboard Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance dashboard',
      error: error.message
    });
  }
};

// @desc    Export attendance report as CSV
// @route   GET /api/attendance/event/:eventId/export
// @access  Private (Organizer)
export const exportAttendanceCSV = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Verify event exists and organizer has permission
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to export attendance for this event'
      });
    }

    // Get all registrations
    const registrations = await Registration.find({
      event: eventId,
      registrationStatus: { $ne: 'Cancelled' }
    })
      .populate('participant', 'firstName lastName email contactNumber college')
      .populate('scannedBy', 'firstName lastName')
      .sort({ attendedAt: -1 });

    // Prepare data for CSV
    const csvData = registrations.map(r => ({
      'Ticket ID': r.ticketId,
      'First Name': r.participant.firstName,
      'Last Name': r.participant.lastName,
      'Email': r.participant.email,
      'Contact Number': r.participant.contactNumber || 'N/A',
      'College': r.participant.college || 'N/A',
      'Attended': r.attended ? 'Yes' : 'No',
      'Attendance Time': r.attendedAt ? new Date(r.attendedAt).toLocaleString('en-IN') : 'N/A',
      'Scan Method': r.scanMethod || 'N/A',
      'Scanned By': r.scannedBy ? `${r.scannedBy.firstName} ${r.scannedBy.lastName}` : 'N/A',
      'Manual Override': r.manualOverride?.isOverridden ? 'Yes' : 'No',
      'Override Reason': r.manualOverride?.reason || 'N/A',
      'Registration Status': r.registrationStatus
    }));

    // Convert to CSV
    const json2csvParser = new Parser();
    const csv = json2csvParser.parse(csvData);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="attendance-${event.eventName.replace(/\s+/g, '-')}-${Date.now()}.csv"`);

    res.status(200).send(csv);

  } catch (error) {
    console.error('Export Attendance CSV Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export attendance report',
      error: error.message
    });
  }
};

// @desc    Get attendance audit log
// @route   GET /api/attendance/event/:eventId/audit-log
// @access  Private (Organizer/Admin)
export const getAttendanceAuditLog = async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    if (event.organizer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view audit log'
      });
    }

    // Get all attendance records with manual overrides
    const auditRecords = await Registration.find({
      event: eventId,
      'manualOverride.isOverridden': true
    })
      .populate('participant', 'firstName lastName email')
      .populate('manualOverride.overriddenBy', 'firstName lastName role')
      .sort({ 'manualOverride.overriddenAt': -1 });

    const auditLog = auditRecords.map(r => ({
      ticketId: r.ticketId,
      participant: `${r.participant.firstName} ${r.participant.lastName}`,
      action: r.attended ? 'Marked Attended' : 'Unmarked Attended',
      reason: r.manualOverride.reason,
      overriddenBy: {
        name: `${r.manualOverride.overriddenBy.firstName} ${r.manualOverride.overriddenBy.lastName}`,
        role: r.manualOverride.overriddenBy.role
      },
      timestamp: r.manualOverride.overriddenAt
    }));

    res.status(200).json({
      success: true,
      data: {
        eventName: event.eventName,
        totalOverrides: auditLog.length,
        auditLog
      }
    });

  } catch (error) {
    console.error('Get Audit Log Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
};
