// Import Mongoose
import mongoose from 'mongoose';

// ============================================
// EVENT SCHEMA DEFINITION
// ============================================

const eventSchema = new mongoose.Schema(
  {
    // ============================================
    // BASIC EVENT INFORMATION
    // ============================================
    
    eventName: {
      type: String,
      required: [true, 'Event name is required'],
      trim: true,
      maxlength: [100, 'Event name cannot exceed 100 characters'],
    },

    eventType: {
      type: String,
      required: [true, 'Event type is required'],
      enum: {
        values: ['Normal', 'Merchandise'],
        message: 'Event type must be either Normal or Merchandise',
      },
    },

    description: {
      type: String,
      required: [true, 'Event description is required'],
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // ============================================
    // ORGANIZER REFERENCE
    // ============================================
    
    organizer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event must have an organizer'],
    },

    // ============================================
    // EVENT DETAILS
    // ============================================
    
    venue: {
      type: String,
      required: [true, 'Event venue is required'],
      trim: true,
    },

    eventStartDate: {
      type: Date,
      required: [true, 'Event start date is required'],
    },

    eventEndDate: {
      type: Date,
      required: [true, 'Event end date is required'],
      validate: {
        validator: function (value) {
          return value >= this.eventStartDate;
        },
        message: 'Event end date must be after or equal to start date',
      },
    },

    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
      validate: {
        validator: function (value) {
          return value < this.eventStartDate;
        },
        message: 'Registration deadline must be before event start date',
      },
    },

    maxParticipants: {
      type: Number,
      default: null, // null means unlimited
      min: [1, 'Maximum participants must be at least 1'],
    },

    // ============================================
    // MERCHANDISE-SPECIFIC FIELDS
    // ============================================
    
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },

    availableStock: {
      type: Number,
      default: null, // For Normal events, stock is not tracked
      min: [0, 'Stock cannot be negative'],
    },

    sizes: {
      type: [String],
      default: [],
      enum: {
        values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        message: 'Invalid size. Must be XS, S, M, L, XL, or XXL',
      },
    },

    colors: {
      type: [String],
      default: [],
      // Examples: ['Red', 'Blue', 'Black', 'White', 'Green']
    },

    purchaseLimitPerParticipant: {
      type: Number,
      default: null, // null means unlimited
      min: [1, 'Purchase limit must be at least 1'],
    },

    // ============================================
    // NEW REQUIRED FIELDS (Section 8)
    // ============================================

    eligibility: {
      type: String,
      enum: ['Open to All', 'IIIT Students Only', 'Team Event', 'First Year Only', 'Final Year Only'],
      default: 'Open to All',
      required: [true, 'Eligibility is required'],
    },

    tags: {
      type: [String],
      default: [],
      // Examples: ['Workshop', 'Competition', 'Cultural', 'Technical', 'Sports', 'Gaming', 'Music', 'Dance']
    },

    customRegistrationForm: {
      type: [
        {
          fieldName: {
            type: String,
            required: true,
            trim: true,
          },
          fieldType: {
            type: String,
            enum: ['text', 'number', 'email', 'phone', 'textarea', 'dropdown', 'checkbox', 'radio', 'date', 'file'],
            required: true,
          },
          fieldLabel: {
            type: String,
            required: true,
            trim: true,
          },
          options: {
            type: [String],
            default: [],
            // For dropdown, checkbox, radio field types
          },
          required: {
            type: Boolean,
            default: false,
          },
          placeholder: {
            type: String,
            default: '',
            trim: true,
          },
          helpText: {
            type: String,
            default: '',
            trim: true,
            // Additional help text shown below the field
          },
          order: {
            type: Number,
            default: 0,
            // For reordering fields
          },
          validation: {
            minLength: {
              type: Number,
              default: null,
            },
            maxLength: {
              type: Number,
              default: null,
            },
            min: {
              type: Number,
              default: null,
            },
            max: {
              type: Number,
              default: null,
            },
            pattern: {
              type: String,
              default: '',
              // Regex pattern for validation
            },
            fileTypes: {
              type: [String],
              default: [],
              // Allowed file types for file upload: ['pdf', 'jpg', 'png', 'doc']
            },
            maxFileSize: {
              type: Number,
              default: 5, // MB
            },
          },
        }
      ],
      default: [],
    },

    formLocked: {
      type: Boolean,
      default: false,
      // Lock form editing after first registration
    },

    // ============================================
    // MEDIA
    // ============================================
    
    posterUrl: {
      type: String,
      default: null,
    },

    // ============================================
    // STATUS & VISIBILITY
    // ============================================
    
    status: {
      type: String,
      enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Closed'],
      default: 'Draft',
      required: [true, 'Event status is required'],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    registrationOpen: {
      type: Boolean,
      default: true,
    },

    isApproved: {
      type: Boolean,
      default: true, // Auto-approved for now, can add admin approval later
    },

    // ============================================
    // ANALYTICS (Computed on-the-fly from Registration model)
    // ============================================
    
    currentRegistrations: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// ============================================
// INDEXES FOR FASTER QUERIES
// ============================================

// Index for searching events by name
eventSchema.index({ eventName: 'text', description: 'text' });

// Index for filtering by organizer
eventSchema.index({ organizer: 1 });

// Index for filtering by event type
eventSchema.index({ eventType: 1 });

// Index for filtering by date
eventSchema.index({ eventDate: 1 });

// Index for active and approved events (most common query)
eventSchema.index({ isActive: 1, isApproved: 1 });

// ============================================
// INSTANCE METHODS
// ============================================

// Check if event has reached capacity
eventSchema.methods.isFull = function () {
  if (!this.maxParticipants) return false; // Unlimited capacity
  return this.currentRegistrations >= this.maxParticipants;
};

// Check if registration is currently open
eventSchema.methods.canRegister = function () {
  const now = new Date();
  return (
    this.isActive &&
    this.isApproved &&
    this.registrationOpen &&
    now <= this.registrationDeadline &&
    !this.isFull()
  );
};

// Check if merchandise is in stock
eventSchema.methods.hasStock = function () {
  if (this.eventType !== 'Merchandise') return true; // Normal events always "in stock"
  if (this.availableStock === null) return true; // Unlimited stock
  return this.availableStock > 0;
};

// Decrement stock (for merchandise events)
eventSchema.methods.decrementStock = async function (quantity = 1) {
  if (this.eventType !== 'Merchandise') {
    throw new Error('Cannot decrement stock for non-merchandise events');
  }
  if (this.availableStock !== null) {
    this.availableStock -= quantity;
    if (this.availableStock < 0) this.availableStock = 0;
    await this.save();
  }
};

// Increment registration count
eventSchema.methods.incrementRegistrations = async function () {
  this.currentRegistrations += 1;
  await this.save();
};

// Decrement registration count (when someone cancels)
eventSchema.methods.decrementRegistrations = async function () {
  this.currentRegistrations -= 1;
  if (this.currentRegistrations < 0) this.currentRegistrations = 0;
  await this.save();
};

// ============================================
// FORM BUILDER METHODS
// ============================================

// Lock form after first registration
eventSchema.methods.lockForm = async function () {
  if (!this.formLocked) {
    this.formLocked = true;
    await this.save();
  }
  return this;
};

// Check if form can be edited
eventSchema.methods.canEditForm = function () {
  // Form can be edited only if:
  // 1. Event type is Normal (Merchandise doesn't use custom forms)
  // 2. Form is not locked (no registrations yet)
  // 3. Event is in Draft or Published status (not Ongoing/Completed/Closed)
  return (
    this.eventType === 'Normal' &&
    !this.formLocked &&
    ['Draft', 'Published'].includes(this.status)
  );
};

// Validate form field
eventSchema.methods.validateFormField = function (field) {
  const errors = [];

  if (!field.fieldName || !field.fieldName.trim()) {
    errors.push('Field name is required');
  }

  if (!field.fieldLabel || !field.fieldLabel.trim()) {
    errors.push('Field label is required');
  }

  if (!field.fieldType) {
    errors.push('Field type is required');
  }

  // Validate field-specific requirements
  if (['dropdown', 'checkbox', 'radio'].includes(field.fieldType)) {
    if (!field.options || field.options.length === 0) {
      errors.push(`${field.fieldType} field must have at least one option`);
    }
  }

  if (field.fieldType === 'file') {
    if (!field.validation?.fileTypes || field.validation.fileTypes.length === 0) {
      errors.push('File field must specify allowed file types');
    }
  }

  return errors;
};

// Sort form fields by order
eventSchema.methods.getSortedFormFields = function () {
  return [...this.customRegistrationForm].sort((a, b) => (a.order || 0) - (b.order || 0));
};

// Add form field
eventSchema.methods.addFormField = async function (fieldData) {
  if (!this.canEditForm()) {
    throw new Error('Form cannot be edited. It may be locked or event status does not allow editing.');
  }

  // Validate field
  const errors = this.validateFormField(fieldData);
  if (errors.length > 0) {
    throw new Error(`Field validation failed: ${errors.join(', ')}`);
  }

  // Set order to end if not specified
  if (fieldData.order === undefined) {
    const maxOrder = Math.max(...this.customRegistrationForm.map(f => f.order || 0), 0);
    fieldData.order = maxOrder + 1;
  }

  this.customRegistrationForm.push(fieldData);
  await this.save();
  return this;
};

// Update form field
eventSchema.methods.updateFormField = async function (fieldIndex, fieldData) {
  if (!this.canEditForm()) {
    throw new Error('Form cannot be edited. It may be locked or event status does not allow editing.');
  }

  if (fieldIndex < 0 || fieldIndex >= this.customRegistrationForm.length) {
    throw new Error('Invalid field index');
  }

  // Validate field
  const errors = this.validateFormField(fieldData);
  if (errors.length > 0) {
    throw new Error(`Field validation failed: ${errors.join(', ')}`);
  }

  // Update field
  this.customRegistrationForm[fieldIndex] = {
    ...this.customRegistrationForm[fieldIndex],
    ...fieldData,
  };

  this.markModified('customRegistrationForm');
  await this.save();
  return this;
};

// Remove form field
eventSchema.methods.removeFormField = async function (fieldIndex) {
  if (!this.canEditForm()) {
    throw new Error('Form cannot be edited. It may be locked or event status does not allow editing.');
  }

  if (fieldIndex < 0 || fieldIndex >= this.customRegistrationForm.length) {
    throw new Error('Invalid field index');
  }

  this.customRegistrationForm.splice(fieldIndex, 1);
  this.markModified('customRegistrationForm');
  await this.save();
  return this;
};

// Reorder form fields
eventSchema.methods.reorderFormFields = async function (newOrder) {
  if (!this.canEditForm()) {
    throw new Error('Form cannot be edited. It may be locked or event status does not allow editing.');
  }

  // newOrder is an array of field indices in the desired order
  if (!Array.isArray(newOrder) || newOrder.length !== this.customRegistrationForm.length) {
    throw new Error('Invalid reorder array');
  }

  const reorderedFields = newOrder.map((index, position) => ({
    ...this.customRegistrationForm[index].toObject(),
    order: position,
  }));

  this.customRegistrationForm = reorderedFields;
  this.markModified('customRegistrationForm');
  await this.save();
  return this;
};

// ============================================
// STATUS MANAGEMENT METHODS
// ============================================

// Check what fields can be edited based on current status
eventSchema.methods.getEditableFields = function () {
  const now = new Date();
  
  switch (this.status) {
    case 'Draft':
      return {
        canEdit: true,
        editableFields: 'all', // All fields can be edited
        canPublish: true,
        canDelete: true,
      };
      
    case 'Published':
      // Published events before start date
      if (now < this.eventStartDate) {
        return {
          canEdit: true,
          editableFields: ['description', 'registrationDeadline', 'maxParticipants', 'availableStock', 'tags'],
          canPublish: false,
          canDelete: false,
          canCloseRegistration: true,
          restrictions: 'Can only update description, extend deadline, increase limits, or close registrations'
        };
      }
      // Auto-transition to Ongoing if event has started
      return {
        canEdit: false,
        editableFields: [],
        canPublish: false,
        canDelete: false,
        shouldTransitionTo: 'Ongoing',
        restrictions: 'Event has started, automatically transitioning to Ongoing'
      };
      
    case 'Ongoing':
      return {
        canEdit: false,
        editableFields: [],
        canPublish: false,
        canDelete: false,
        canMarkComplete: true,
        canClose: true,
        restrictions: 'Only status changes allowed (mark as Completed or Closed)'
      };
      
    case 'Completed':
    case 'Closed':
      return {
        canEdit: false,
        editableFields: [],
        canPublish: false,
        canDelete: false,
        restrictions: 'Event is completed/closed. No edits allowed.'
      };
      
    default:
      return {
        canEdit: false,
        editableFields: [],
        canPublish: false,
        canDelete: false,
        restrictions: 'Unknown status'
      };
  }
};

// Validate field updates based on status
eventSchema.methods.validateUpdate = function (updates) {
  const permissions = this.getEditableFields();
  
  if (!permissions.canEdit) {
    return {
      valid: false,
      message: permissions.restrictions
    };
  }
  
  // Draft status - all fields allowed
  if (permissions.editableFields === 'all') {
    return { valid: true };
  }
  
  // Published status - check restricted fields
  const updateFields = Object.keys(updates);
  const restrictedFields = updateFields.filter(field => 
    !permissions.editableFields.includes(field) && 
    field !== 'status' // Status changes handled separately
  );
  
  if (restrictedFields.length > 0) {
    return {
      valid: false,
      message: `Cannot update fields: ${restrictedFields.join(', ')}. ${permissions.restrictions}`
    };
  }
  
  // Validate specific field constraints for Published events
  if (this.status === 'Published') {
    // Can only extend deadline, not shorten
    if (updates.registrationDeadline && new Date(updates.registrationDeadline) < this.registrationDeadline) {
      return {
        valid: false,
        message: 'Can only extend registration deadline, not shorten it'
      };
    }
    
    // Can only increase limits, not decrease
    if (updates.maxParticipants && updates.maxParticipants < this.maxParticipants) {
      return {
        valid: false,
        message: 'Can only increase participant limit, not decrease it'
      };
    }
    
    if (updates.availableStock && updates.availableStock < this.availableStock) {
      return {
        valid: false,
        message: 'Can only increase available stock, not decrease it'
      };
    }
  }
  
  return { valid: true };
};

// Transition to Published status
eventSchema.methods.publish = async function () {
  if (this.status !== 'Draft') {
    throw new Error('Only Draft events can be published');
  }
  this.status = 'Published';
  this.isActive = true;
  await this.save();
  return this;
};

// Transition to Ongoing status (automatic when event starts)
eventSchema.methods.markAsOngoing = async function () {
  if (this.status !== 'Published') {
    throw new Error('Only Published events can be marked as Ongoing');
  }
  this.status = 'Ongoing';
  await this.save();
  return this;
};

// Mark event as completed
eventSchema.methods.markAsCompleted = async function () {
  if (this.status !== 'Ongoing' && this.status !== 'Published') {
    throw new Error('Only Ongoing or Published events can be marked as Completed');
  }
  this.status = 'Completed';
  this.registrationOpen = false;
  await this.save();
  return this;
};

// Close event (cancel)
eventSchema.methods.closeEvent = async function () {
  if (this.status === 'Completed' || this.status === 'Closed') {
    throw new Error('Event is already completed or closed');
  }
  this.status = 'Closed';
  this.registrationOpen = false;
  this.isActive = false;
  await this.save();
  return this;
};

// Auto-update status based on dates
eventSchema.methods.updateStatusBasedOnDates = async function () {
  const now = new Date();
  
  // If Published and event has started, mark as Ongoing
  if (this.status === 'Published' && now >= this.eventStartDate && now <= this.eventEndDate) {
    await this.markAsOngoing();
  }
  
  // If Ongoing and event has ended, could auto-mark as Completed (optional)
  // Uncomment if you want automatic completion
  // if (this.status === 'Ongoing' && now > this.eventEndDate) {
  //   await this.markAsCompleted();
  // }
  
  return this;
};

// ============================================
// STATIC METHODS
// ============================================

// Get all active events with filters
eventSchema.statics.getActiveEvents = function (filters = {}) {
  const query = { isActive: true, isApproved: true };
  
  if (filters.eventType) query.eventType = filters.eventType;
  if (filters.organizer) query.organizer = filters.organizer;
  
  return this.find(query)
    .populate('organizer', 'organizerName category contactEmail')
    .sort({ eventDate: 1 });
};

// Search events by text
eventSchema.statics.searchEvents = function (searchText) {
  return this.find({
    $text: { $search: searchText },
    isActive: true,
    isApproved: true,
  })
    .populate('organizer', 'organizerName category contactEmail')
    .sort({ score: { $meta: 'textScore' } });
};

// Get upcoming events
eventSchema.statics.getUpcomingEvents = function () {
  const now = new Date();
  return this.find({
    isActive: true,
    isApproved: true,
    eventDate: { $gte: now },
  })
    .populate('organizer', 'organizerName category contactEmail')
    .sort({ eventDate: 1 });
};

// ============================================
// PRE-SAVE VALIDATION
// ============================================

eventSchema.pre('save', function () {
  // Merchandise events must have price and stock
  if (this.eventType === 'Merchandise') {
    if (this.price === undefined || this.price === null) {
      this.price = 0; // Default to free
    }
    if (this.availableStock === undefined || this.availableStock === null) {
      throw new Error('Merchandise events must have availableStock defined');
    }
  }

  // Normal events don't need sizes
  if (this.eventType === 'Normal' && this.sizes.length > 0) {
    this.sizes = [];
  }
});

// ============================================
// EXPORT MODEL
// ============================================

const Event = mongoose.model('Event', eventSchema);

export default Event;

// ============================================
// MODEL EXPLANATION
// ============================================

/*
EVENT MODEL STRUCTURE:

1. TWO EVENT TYPES:
   ----------------
   - Normal: Workshops, talks, competitions (individual registration)
   - Merchandise: T-shirts, hoodies, kits (individual purchase)

2. KEY FIELDS:
   -----------
   - eventName: Name of the event
   - eventType: 'Normal' or 'Merchandise'
   - description: Detailed description
   - organizer: Reference to User (who created this event)
   - venue: Location of event
   - eventDate: When the event happens
   - registrationDeadline: Last date to register
   - maxParticipants: Capacity limit (null = unlimited)
   - price: Cost (₹0 for free events)
   - availableStock: For merchandise tracking
   - sizes: Array of available sizes (for clothing merchandise)
   - posterUrl: Event banner/poster
   - isActive: Published or draft
   - registrationOpen: Can users register now?
   - currentRegistrations: Count of registered participants

3. INSTANCE METHODS:
   ----------------
   - isFull(): Check if event reached capacity
   - canRegister(): Check if registration is allowed right now
   - hasStock(): Check if merchandise is available
   - decrementStock(quantity): Reduce stock count
   - incrementRegistrations(): Increase registration count
   - decrementRegistrations(): Decrease when someone cancels

4. STATIC METHODS:
   --------------
   - getActiveEvents(filters): Get all published events with filters
   - searchEvents(text): Full-text search
   - getUpcomingEvents(): Get events happening in the future

5. VALIDATION:
   -----------
   - Registration deadline must be before event date
   - Merchandise events must have stock defined
   - Sizes only for merchandise events
   - Price cannot be negative
   - Stock cannot be negative

EXAMPLE USAGE:

// Create Normal Event
const workshop = await Event.create({
  eventName: 'Web Development Workshop',
  eventType: 'Normal',
  description: 'Learn React and Node.js',
  organizer: organizerId,
  venue: 'Auditorium',
  eventDate: new Date('2026-03-15'),
  registrationDeadline: new Date('2026-03-10'),
  maxParticipants: 100,
  price: 0 // Free
});

// Create Merchandise Event
const tshirt = await Event.create({
  eventName: 'Felicity T-Shirt',
  eventType: 'Merchandise',
  description: 'Official Felicity 2026 T-Shirt',
  organizer: organizerId,
  venue: 'Online Store',
  eventDate: new Date('2026-03-20'),
  registrationDeadline: new Date('2026-03-18'),
  price: 299,
  availableStock: 500,
  sizes: ['S', 'M', 'L', 'XL']
});

// Check if can register
if (workshop.canRegister()) {
  console.log('Registration is open!');
}

// Search events
const results = await Event.searchEvents('workshop coding');

// Get upcoming events
const upcoming = await Event.getUpcomingEvents();
*/
