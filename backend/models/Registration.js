import mongoose from 'mongoose';
import crypto from 'crypto';

const registrationSchema = new mongoose.Schema(
  {
    // ============================================
    // CORE FIELDS
    // ============================================
    
    participant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Participant is required'],
      index: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event is required'],
      index: true,
    },

    // ============================================
    // TICKET INFORMATION
    // ============================================
    
    ticketId: {
      type: String,
      unique: true,
      required: false, // Generated in pre-save hook
      index: true,
    },

    qrCode: {
      type: String, // Base64 encoded QR code image or URL
      default: null,
    },

    // ============================================
    // REGISTRATION STATUS
    // ============================================
    
    registrationStatus: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Cancelled', 'Rejected'],
      default: 'Confirmed', // Auto-confirm for now
      index: true,
    },

    // ============================================
    // TEAM INFORMATION (Optional for team events)
    // ============================================
    
    teamName: {
      type: String,
      default: null,
      trim: true,
    },

    teamMembers: {
      type: [String], // Array of team member names/emails
      default: [],
    },

    // ============================================
    // CUSTOM FORM DATA (For Normal Events)
    // ============================================
    
    customFormData: {
      type: [
        {
          fieldName: String,
          fieldLabel: String,
          answer: mongoose.Schema.Types.Mixed, // Can be String, Number, Boolean, Array
        }
      ],
      default: [],
    },

    // ============================================
    // PAYMENT INFORMATION
    // ============================================
    
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Completed', // Auto-complete for free events, handle paid later
      index: true,
    },

    amountPaid: {
      type: Number,
      default: 0,
      min: [0, 'Amount cannot be negative'],
    },

    paymentMethod: {
      type: String,
      enum: ['Free', 'Pending', 'Cash', 'Card', 'UPI', 'NetBanking'],
      default: 'Free',
    },

    transactionId: {
      type: String,
      default: null,
    },

    // ============================================
    // MERCHANDISE-SPECIFIC FIELDS
    // ============================================
    
    merchandiseDetails: {
      size: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL', 'XXL', null],
        default: null,
      },
      color: {
        type: String,
        default: null,
      },
      quantity: {
        type: Number,
        default: 1,
        min: [1, 'Quantity must be at least 1'],
      },
    },

    // ============================================
    // ATTENDANCE TRACKING
    // ============================================
    
    attended: {
      type: Boolean,
      default: false,
      index: true,
    },

    attendedAt: {
      type: Date,
      default: null,
    },

    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Organizer who scanned the QR
      default: null,
    },

    scanMethod: {
      type: String,
      enum: ['Camera', 'FileUpload', 'Manual', null],
      default: null,
    },

    manualOverride: {
      isOverridden: {
        type: Boolean,
        default: false,
      },
      reason: {
        type: String,
        default: null,
      },
      overriddenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      },
      overriddenAt: {
        type: Date,
        default: null,
      },
    },

    // ============================================
    // CANCELLATION
    // ============================================
    
    cancellationReason: {
      type: String,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    // ============================================
    // METADATA
    // ============================================
    
    registeredFrom: {
      type: String,
      enum: ['Web', 'Mobile', 'Admin'],
      default: 'Web',
    },

    notes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// ============================================
// INDEXES FOR FASTER QUERIES
// ============================================

// Compound index for participant's registrations
registrationSchema.index({ participant: 1, createdAt: -1 });

// Compound index for event's registrations
registrationSchema.index({ event: 1, registrationStatus: 1 });

// Index for ticket lookup
registrationSchema.index({ ticketId: 1 });

// ============================================
// STATIC METHODS
// ============================================

// Generate unique ticket ID
registrationSchema.statics.generateTicketId = function () {
  const timestamp = Date.now().toString(36).toUpperCase();
  const randomStr = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `TKT-${timestamp}-${randomStr}`;
};

// Get registrations by participant
registrationSchema.statics.getByParticipant = function (participantId, filters = {}) {
  const query = { participant: participantId };
  
  // Add status filter if provided
  if (filters.status) {
    query.registrationStatus = filters.status;
  }
  
  // Add event type filter if provided
  if (filters.eventType) {
    // This will need population, handle in controller
  }
  
  return this.find(query)
    .populate({
      path: 'event',
      select: 'eventName eventType description venue eventStartDate eventEndDate organizer price tags eligibility',
      populate: {
        path: 'organizer',
        select: 'organizerName category contactEmail',
      },
    })
    .sort({ createdAt: -1 });
};

// Get registrations by event
registrationSchema.statics.getByEvent = function (eventId, filters = {}) {
  const query = { event: eventId };
  
  if (filters.status) {
    query.registrationStatus = filters.status;
  }
  
  return this.find(query)
    .populate('participant', 'firstName lastName email college contactNumber participantType')
    .sort({ createdAt: -1 });
};

// Check if user already registered for event
registrationSchema.statics.isRegistered = async function (participantId, eventId) {
  const registration = await this.findOne({
    participant: participantId,
    event: eventId,
    registrationStatus: { $in: ['Pending', 'Confirmed'] },
  });
  return !!registration;
};

// ============================================
// INSTANCE METHODS
// ============================================

// Cancel registration
registrationSchema.methods.cancel = async function (reason) {
  this.registrationStatus = 'Cancelled';
  this.cancellationReason = reason;
  this.cancelledAt = new Date();
  return this.save();
};

// Mark as attended
registrationSchema.methods.markAttended = async function () {
  this.attended = true;
  this.attendedAt = new Date();
  return this.save();
};

// Generate QR code data (to be used with QR library)
registrationSchema.methods.getQRData = function () {
  return JSON.stringify({
    ticketId: this.ticketId,
    participantId: this.participant._id || this.participant,
    eventId: this.event._id || this.event,
    registrationDate: this.createdAt,
  });
};

// ============================================
// PRE-SAVE MIDDLEWARE
// ============================================

registrationSchema.pre('save', function () {
  // Generate ticket ID if not exists
  if (!this.ticketId) {
    this.ticketId = mongoose.model('Registration').generateTicketId();
  }
  
  // Set payment status based on amount
  if (this.isNew && this.amountPaid === 0) {
    this.paymentStatus = 'Completed';
    this.paymentMethod = 'Free';
  }
});

// ============================================
// VIRTUAL FIELDS
// ============================================

// Check if registration is active
registrationSchema.virtual('isActive').get(function () {
  return ['Pending', 'Confirmed'].includes(this.registrationStatus);
});

// Check if can be cancelled
registrationSchema.virtual('canCancel').get(function () {
  if (this.registrationStatus === 'Cancelled' || this.registrationStatus === 'Rejected') {
    return false;
  }
  
  // Can't cancel if event has already happened (populate event first)
  if (this.event && this.event.eventStartDate) {
    return new Date() < new Date(this.event.eventStartDate);
  }
  
  return true;
});

// Enable virtuals in JSON output
registrationSchema.set('toJSON', { virtuals: true });
registrationSchema.set('toObject', { virtuals: true });

const Registration = mongoose.model('Registration', registrationSchema);

export default Registration;
