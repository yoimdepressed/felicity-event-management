import Registration from '../models/Registration.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import QRCode from 'qrcode';

// ============================================
// EMAIL CONFIGURATION (Basic Setup)
// ============================================

// Email transporter (mock for now - email sending is optional)
// For production, install nodemailer: npm install nodemailer
const transporter = {
  sendMail: async (options) => {
    console.log('📧 [EMAIL] Would send email to:', options.to);
    console.log('📧 [EMAIL] Subject:', options.subject);
    // Mock successful email send
    return Promise.resolve({ messageId: 'mock-' + Date.now() });
  }
};

// Helper function to send ticket email
const sendTicketEmail = async (registration, participant, event) => {
  try {
    // Generate QR code as base64 image
    const qrCodeData = registration.getQRData();
    const qrCodeImage = await QRCode.toDataURL(qrCodeData);

    const eventType = event.eventType === 'Merchandise' ? 'Purchase' : 'Registration';

    const mailOptions = {
      from: process.env.EMAIL_USER || 'felicity@example.com',
      to: participant.email,
      subject: `Ticket Confirmation - ${event.eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1976d2;">🎉 ${eventType} Confirmed!</h2>
          <p>Dear ${participant.firstName} ${participant.lastName},</p>
          <p>Your ${eventType.toLowerCase()} for <strong>${event.eventName}</strong> has been confirmed.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Event Details</h3>
            <p><strong>Event:</strong> ${event.eventName}</p>
            <p><strong>Type:</strong> ${event.eventType}</p>
            <p><strong>Venue:</strong> ${event.venue}</p>
            <p><strong>Date:</strong> ${new Date(event.eventStartDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })}</p>
            ${event.eventType === 'Merchandise' && registration.merchandiseDetails ? `
              <p><strong>Size:</strong> ${registration.merchandiseDetails.size || 'N/A'}</p>
              <p><strong>Color:</strong> ${registration.merchandiseDetails.color || 'N/A'}</p>
              <p><strong>Quantity:</strong> ${registration.merchandiseDetails.quantity || 1}</p>
            ` : ''}
            <p><strong>Amount Paid:</strong> ₹${registration.amountPaid}</p>
          </div>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Ticket</h3>
            <p><strong>Ticket ID:</strong> ${registration.ticketId}</p>
            <div style="text-align: center; margin: 20px 0;">
              <img src="${qrCodeImage}" alt="QR Code" style="max-width: 200px;" />
            </div>
            <p style="font-size: 12px; color: #666;">
              Present this QR code at the event venue for entry.
            </p>
          </div>
          
          <p>If you have any questions, please contact the organizer at ${event.organizer.contactEmail || 'support@felicity.com'}.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Ticket email sent to ${participant.email}`);
  } catch (error) {
    console.error('❌ Error sending ticket email:', error.message);
    // Don't throw error, registration should succeed even if email fails
  }
};

// ============================================
// REGISTRATION CONTROLLERS
// ============================================

// @desc    Register for an event
// @route   POST /api/registrations
// @access  Private (Participant only)
export const registerForEvent = async (req, res) => {
  try {
    const {
      eventId,
      teamName,
      teamMembers,
      customFormData,
      merchandiseDetails, // { size, color, quantity }
    } = req.body;

    // Step 1: Validate event exists
    const event = await Event.findById(eventId).populate('organizer', 'organizerName contactEmail');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Step 2: Check if event is active and registration is open
    if (!event.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This event is no longer active',
      });
    }

    if (!event.registrationOpen) {
      return res.status(400).json({
        success: false,
        message: 'Registration is closed for this event',
      });
    }

    // Step 3: Check registration deadline
    if (new Date() > new Date(event.registrationDeadline)) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed',
      });
    }

    // Step 4: Check if user already registered
    const existingRegistration = await Registration.isRegistered(req.user.id, eventId);

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this event',
      });
    }

    // Step 5: Check capacity for Normal events
    if (event.eventType === 'Normal' && event.maxParticipants) {
      if (event.currentRegistrations >= event.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Event has reached maximum capacity',
        });
      }
    }

    // Step 6: Check stock for Merchandise
    if (event.eventType === 'Merchandise') {
      const quantity = merchandiseDetails?.quantity || 1;

      if (event.availableStock !== null && event.availableStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Only ${event.availableStock} items left in stock`,
        });
      }

      // Check purchase limit
      if (event.purchaseLimitPerParticipant) {
        const userPurchases = await Registration.countDocuments({
          participant: req.user.id,
          event: eventId,
          registrationStatus: { $in: ['Confirmed', 'Pending'] },
        });

        const totalQuantity = userPurchases + quantity;

        if (totalQuantity > event.purchaseLimitPerParticipant) {
          return res.status(400).json({
            success: false,
            message: `Purchase limit is ${event.purchaseLimitPerParticipant} per participant`,
          });
        }
      }
    }

    // Step 7: Create registration
    const isMerchWithPrice = event.eventType === 'Merchandise' && event.price > 0;
    const registrationData = {
      participant: req.user.id,
      event: eventId,
      registrationStatus: isMerchWithPrice ? 'PendingApproval' : 'Confirmed',
      paymentStatus: isMerchWithPrice ? 'Pending' : (event.price > 0 ? 'Pending' : 'Completed'),
      amountPaid: (merchandiseDetails?.quantity || 1) * (event.price || 0),
      paymentMethod: event.price > 0 ? 'Pending' : 'Free',
    };

    // Add event-type specific data
    if (event.eventType === 'Normal') {
      if (teamName) registrationData.teamName = teamName;
      if (teamMembers) registrationData.teamMembers = teamMembers;
      if (customFormData) registrationData.customFormData = customFormData;
    } else {
      registrationData.merchandiseDetails = {
        size: merchandiseDetails?.size || null,
        color: merchandiseDetails?.color || null,
        quantity: merchandiseDetails?.quantity || 1,
      };
    }

    const registration = await Registration.create(registrationData);

    // Step 8: Generate QR code ONLY for confirmed registrations (NOT PendingApproval)
    if (registration.registrationStatus === 'Confirmed') {
      try {
        const qrCodeData = registration.getQRData();
        const qrCodeImage = await QRCode.toDataURL(qrCodeData);
        registration.qrCode = qrCodeImage;
        await registration.save();
      } catch (qrError) {
        console.error('QR Code generation failed:', qrError);
      }
    }

    // Step 9: Update event stats ONLY for confirmed (not PendingApproval)
    if (registration.registrationStatus === 'Confirmed') {
      event.currentRegistrations += merchandiseDetails?.quantity || 1;

      // Decrement stock for merchandise
      if (event.eventType === 'Merchandise' && event.availableStock !== null) {
        event.availableStock -= merchandiseDetails?.quantity || 1;
      }
    }

    // Lock form after first registration (for Normal events with custom forms)
    if (event.eventType === 'Normal' && !event.formLocked && event.customRegistrationForm.length > 0) {
      await event.lockForm();
    }

    await event.save();

    // Step 10: Get participant details
    const participant = await User.findById(req.user.id);

    // Step 11: Send ticket email
    if (registrationData.paymentStatus === 'Completed') {
      await sendTicketEmail(registration, participant, event);
    }

    // Step 12: Populate and return registration
    const populatedRegistration = await Registration.findById(registration._id)
      .populate({
        path: 'event',
        select: 'eventName eventType venue eventStartDate eventEndDate organizer',
        populate: {
          path: 'organizer',
          select: 'organizerName',
        },
      });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Ticket sent to your email.',
      data: populatedRegistration,
    });

  } catch (error) {
    console.error('[ERROR] Register for event:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message,
    });
  }
};

// @desc    Get my registrations (participant's registrations)
// @route   GET /api/registrations/my
// @access  Private (Participant only)
export const getMyRegistrations = async (req, res) => {
  try {
    const { status, eventType, tab } = req.query;

    // Build query
    const query = { participant: req.user.id };

    // Filter by status if provided
    if (status) {
      query.registrationStatus = status;
    }

    // Filter by tab
    if (tab === 'upcoming') {
      // Only confirmed, non-cancelled events that haven't happened yet
      query.registrationStatus = { $in: ['Confirmed', 'Pending'] };
    } else if (tab === 'completed') {
      query.registrationStatus = 'Confirmed';
    } else if (tab === 'cancelled') {
      query.registrationStatus = { $in: ['Cancelled', 'Rejected'] };
    }

    // Fetch registrations with populated event details
    let registrations = await Registration.find(query)
      .populate({
        path: 'event',
        select: 'eventName eventType description venue eventStartDate eventEndDate organizer price tags eligibility',
        populate: {
          path: 'organizer',
          select: 'organizerName category contactEmail',
        },
      })
      .sort({ createdAt: -1 });

    // Filter by event type if provided
    if (eventType) {
      registrations = registrations.filter(reg => reg.event && reg.event.eventType === eventType);
    }

    // Separate upcoming and past events
    const now = new Date();

    if (tab === 'upcoming') {
      registrations = registrations.filter(reg =>
        reg.event && new Date(reg.event.eventStartDate) > now
      );
    } else if (tab === 'completed') {
      registrations = registrations.filter(reg =>
        reg.event && new Date(reg.event.eventEndDate) < now
      );
    }

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });

  } catch (error) {
    console.error('[ERROR] Get my registrations:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching registrations',
      error: error.message,
    });
  }
};

// @desc    Get single registration details
// @route   GET /api/registrations/:id
// @access  Private (Participant only - own registration)
export const getRegistrationById = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate({
        path: 'event',
        populate: {
          path: 'organizer',
          select: 'organizerName category contactEmail',
        },
      })
      .populate('participant', 'firstName lastName email college contactNumber');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Check if user owns this registration
    if (registration.participant._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this registration',
      });
    }

    res.status(200).json({
      success: true,
      data: registration,
    });

  } catch (error) {
    console.error('[ERROR] Get registration:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching registration',
      error: error.message,
    });
  }
};

// @desc    Cancel registration
// @route   DELETE /api/registrations/:id
// @access  Private (Participant only - own registration)
export const cancelRegistration = async (req, res) => {
  try {
    const { reason } = req.body;

    const registration = await Registration.findById(req.params.id).populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found',
      });
    }

    // Check if user owns this registration
    if (registration.participant.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this registration',
      });
    }

    // Check if can cancel
    if (!registration.canCancel) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel this registration. Event may have already occurred or registration is already cancelled.',
      });
    }

    // Cancel registration
    await registration.cancel(reason || 'Cancelled by participant');

    // Update event stats
    if (registration.event) {
      registration.event.currentRegistrations -= registration.merchandiseDetails?.quantity || 1;

      // Restore stock for merchandise
      if (registration.event.eventType === 'Merchandise' && registration.event.availableStock !== null) {
        registration.event.availableStock += registration.merchandiseDetails?.quantity || 1;
      }

      await registration.event.save();
    }

    res.status(200).json({
      success: true,
      message: 'Registration cancelled successfully',
      data: registration,
    });

  } catch (error) {
    console.error('[ERROR] Cancel registration:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling registration',
      error: error.message,
    });
  }
};

// ============================================
// ORGANIZER CONTROLLERS (For event management)
// ============================================

// @desc    Get registrations for an event (organizer only)
// @route   GET /api/registrations/event/:eventId
// @access  Private (Organizer - own events only)
export const getEventRegistrations = async (req, res) => {
  try {
    const eventId = req.params.id || req.params.eventId; // Support both route params
    const { status } = req.query;

    // Check if event exists and belongs to organizer
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.organizer.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view registrations for this event',
      });
    }

    // Get registrations
    const registrations = await Registration.getByEvent(eventId, { status });

    res.status(200).json({
      success: true,
      count: registrations.length,
      data: registrations,
    });

  } catch (error) {
    console.error('[ERROR] Get event registrations:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching event registrations',
      error: error.message,
    });
  }
};

export default {
  registerForEvent,
  getMyRegistrations,
  getRegistrationById,
  cancelRegistration,
  getEventRegistrations,
};
