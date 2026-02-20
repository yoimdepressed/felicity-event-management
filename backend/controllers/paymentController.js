import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import QRCode from 'qrcode';

// Mock email transporter (same as registrationController)
const transporter = {
    sendMail: async (options) => {
        console.log('📧 [EMAIL] Would send email to:', options.to);
        console.log('📧 [EMAIL] Subject:', options.subject);
        return Promise.resolve({ messageId: 'mock-' + Date.now() });
    }
};

// @desc    Upload payment proof for merchandise order
// @route   POST /api/payments/:registrationId/upload-proof
// @access  Private (Participant - own registration)
export const uploadPaymentProof = async (req, res) => {
    try {
        const { registrationId } = req.params;

        const registration = await Registration.findById(registrationId);

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        // Check ownership
        if (registration.participant.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Check if registration is in PendingApproval state
        if (registration.registrationStatus !== 'PendingApproval') {
            return res.status(400).json({
                success: false,
                message: 'Payment proof can only be uploaded for pending approval orders',
            });
        }

        // Get the file path from multer
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a payment proof image' });
        }

        // Store the file path
        registration.paymentProofUrl = `/uploads/payment-proofs/${req.file.filename}`;
        registration.paymentApproval = {
            ...registration.paymentApproval,
            status: 'Pending',
        };
        await registration.save();

        res.status(200).json({
            success: true,
            message: 'Payment proof uploaded successfully',
            data: {
                paymentProofUrl: registration.paymentProofUrl,
                registrationStatus: registration.registrationStatus,
            },
        });
    } catch (error) {
        console.error('[ERROR] Upload payment proof:', error.message);
        res.status(500).json({ success: false, message: 'Failed to upload payment proof' });
    }
};

// @desc    Get pending payment approvals for an event
// @route   GET /api/payments/event/:eventId/pending
// @access  Private (Organizer - own events)
export const getPendingPayments = async (req, res) => {
    try {
        const { eventId } = req.params;
        const { status } = req.query; // 'Pending', 'Approved', 'Rejected', or 'all'

        // Verify event ownership
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, message: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Build query
        const query = { event: eventId };

        if (status && status !== 'all') {
            query['paymentApproval.status'] = status;
        } else {
            // Default: show all merchandise orders that need approval
            query['paymentApproval.status'] = { $in: ['Pending', 'Approved', 'Rejected'] };
        }

        const registrations = await Registration.find(query)
            .populate('participant', 'firstName lastName email contactNumber college')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: registrations.length,
            data: registrations,
        });
    } catch (error) {
        console.error('[ERROR] Get pending payments:', error.message);
        res.status(500).json({ success: false, message: 'Failed to fetch payment approvals' });
    }
};

// @desc    Approve a merchandise payment
// @route   PUT /api/payments/:registrationId/approve
// @access  Private (Organizer)
export const approvePayment = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { adminNotes } = req.body;

        const registration = await Registration.findById(registrationId)
            .populate('participant', 'firstName lastName email')
            .populate({
                path: 'event',
                populate: { path: 'organizer', select: 'organizerName contactEmail' },
            });

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        // Verify organizer owns this event
        const event = await Event.findById(registration.event._id);
        if (event.organizer.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        // Check current state
        if (registration.registrationStatus !== 'PendingApproval') {
            return res.status(400).json({ success: false, message: 'This order is not pending approval' });
        }

        // Approve: update status
        registration.registrationStatus = 'Confirmed';
        registration.paymentStatus = 'Completed';
        registration.paymentApproval = {
            status: 'Approved',
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
            adminNotes: adminNotes || '',
        };

        // Decrement stock
        const quantity = registration.merchandiseDetails?.quantity || 1;
        event.currentRegistrations += quantity;
        if (event.availableStock !== null) {
            event.availableStock -= quantity;
        }
        await event.save();

        // Generate QR code
        try {
            const qrCodeData = registration.getQRData();
            const qrCodeImage = await QRCode.toDataURL(qrCodeData);
            registration.qrCode = qrCodeImage;
        } catch (qrError) {
            console.error('QR Code generation failed:', qrError);
        }

        await registration.save();

        // Send confirmation email
        try {
            const participant = registration.participant;
            const eventData = registration.event;
            await transporter.sendMail({
                from: process.env.EMAIL_USER || 'felicity@example.com',
                to: participant.email,
                subject: `Payment Approved - ${eventData.eventName}`,
                html: `<p>Your payment for ${eventData.eventName} has been approved! Your ticket ID is: ${registration.ticketId}</p>`,
            });
        } catch (emailError) {
            console.error('Email send failed:', emailError);
        }

        // Re-populate for response
        const populatedReg = await Registration.findById(registration._id)
            .populate('participant', 'firstName lastName email')
            .populate('event', 'eventName eventType');

        res.status(200).json({
            success: true,
            message: 'Payment approved successfully. QR code generated and email sent.',
            data: populatedReg,
        });
    } catch (error) {
        console.error('[ERROR] Approve payment:', error.message);
        res.status(500).json({ success: false, message: 'Failed to approve payment' });
    }
};

// @desc    Reject a merchandise payment
// @route   PUT /api/payments/:registrationId/reject
// @access  Private (Organizer)
export const rejectPayment = async (req, res) => {
    try {
        const { registrationId } = req.params;
        const { adminNotes } = req.body;

        const registration = await Registration.findById(registrationId)
            .populate('participant', 'firstName lastName email');

        if (!registration) {
            return res.status(404).json({ success: false, message: 'Registration not found' });
        }

        // Verify organizer owns this event
        const event = await Event.findById(registration.event);
        if (event.organizer.toString() !== req.user.id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        if (registration.registrationStatus !== 'PendingApproval') {
            return res.status(400).json({ success: false, message: 'This order is not pending approval' });
        }

        // Reject: update status, NO stock decrement, NO QR
        registration.registrationStatus = 'Rejected';
        registration.paymentStatus = 'Failed';
        registration.paymentApproval = {
            status: 'Rejected',
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
            adminNotes: adminNotes || '',
        };
        // Ensure no QR code
        registration.qrCode = null;

        await registration.save();

        res.status(200).json({
            success: true,
            message: 'Payment rejected.',
            data: registration,
        });
    } catch (error) {
        console.error('[ERROR] Reject payment:', error.message);
        res.status(500).json({ success: false, message: 'Failed to reject payment' });
    }
};
