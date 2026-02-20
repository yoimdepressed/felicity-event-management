// Import required packages
import mongoose from 'mongoose';      // Tool to work with MongoDB
import bcrypt from 'bcryptjs';        // Tool to encrypt passwords
import jwt from 'jsonwebtoken';       // Tool to create authentication tokens

const userSchema = new mongoose.Schema(
  {
    
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },

    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },  

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,           // No two users can have same email
      lowercase: true,        // Convert to lowercase 
      trim: true,
      match: [              // Validate email format using regex
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },

    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,          // Don't include password when fetching user (security)
    },

    role: {
      type: String,
      enum: ['participant', 'organizer', 'admin'],  // Only these 3 values allowed
      required: [true, 'Role is required'],
      default: 'participant', // If not specified, assume participant
    },
    
    participantType: {
      type: String,
      enum: ['IIIT', 'Non-IIIT'],  // Only for participants
    },

    college: {
      type: String,
      trim: true,
      // Required for participants (validation in controller)
    },

    contactNumber: {
      type: String,
      trim: true,
      // Required for participants
    },

    interests: {
      type: [String],         // Array of strings: ["coding", "music", "dance"]
      default: [],            // Empty array if not provided
    },

    followedClubs: [
      {
        type: mongoose.Schema.Types.ObjectId,  // Reference to another document
        ref: 'User',          // References User collection (organizers)
      },
    ],
    
    organizerName: {
      type: String,
      trim: true,
      // Required only if role is organizer
    },

    category: {
      type: String,
      enum: ['Cultural', 'Technical', 'Sports', 'Literary', 'Other'],
      // Required only if role is organizer
    },

    description: {
      type: String,
      trim: true,
      // For organizer bio/description
    },

    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
      // Public contact email for organizer (different from login email)
    },

    discordWebhook: {
      type: String,
      trim: true,
      // Optional: URL for Discord webhook to auto-post events
    },
    
    isActive: {
      type: Boolean,
      default: true,          // User is active by default
      // Admin can deactivate accounts
    },

    isApproved: {
      type: Boolean,
      default: true,          // Auto-approve by default
      // Could be used for organizer approval workflow
    },
  },
  {
    timestamps: true,         // Automatically add createdAt and updatedAt fields
  }
);

// This runs BEFORE saving user to database
userSchema.pre('save', async function () {
  // 'this' refers to the user document being saved
  
  // Only hash password if it was modified (or is new)
  if (!this.isModified('password')) {
    return;  // Skip hashing
  }

  // Generate salt (random string added to password for extra security)
  // 10 = salt rounds (higher = more secure but slower)
  const salt = await bcrypt.genSalt(10);

  // Hash the password with the salt
  this.password = await bcrypt.hash(this.password, salt);
});


// Method 1: Compare entered password with hashed password (for login)
userSchema.methods.comparePassword = async function (enteredPassword) {
  // bcrypt can compare plain text with hash
  // Returns true if match, false if not
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method 2: Generate JWT token (for authentication)
userSchema.methods.generateToken = function () {
  // Create a token containing user ID and role
  return jwt.sign(
    {
      id: this._id,         // User's database ID
      role: this.role,      // User's role (participant/organizer/admin)
    },
    process.env.JWT_SECRET,  // Secret key from .env file (keep it secret!)
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',  // Token valid for 7 days
    }
  );
};

// Method 3: Get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function () {
  // Return user object without password and sensitive fields
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

// Static method to validate participant-specific fields
userSchema.statics.validateParticipant = function (data) {
  const errors = [];

  // If role is participant, these fields are required
  if (data.role === 'participant') {
    if (!data.participantType) {
      errors.push('Participant type is required');
    }

    if (!data.college) {
      errors.push('College/Organization name is required');
    }

    if (!data.contactNumber) {
      errors.push('Contact number is required');
    }

    // If IIIT participant, email must be from IIIT domain
    if (data.participantType === 'IIIT') {
      const isIIITEmail = data.email.endsWith('@iiit.ac.in') || 
                          data.email.endsWith('@students.iiit.ac.in') || 
                          data.email.endsWith('@research.iiit.ac.in');
      
      if (!isIIITEmail) {
        errors.push('IIIT students must use college email (@iiit.ac.in, @students.iiit.ac.in, or @research.iiit.ac.in)');
      }
    }
  }

  return errors;
};

// Static method to validate organizer-specific fields
userSchema.statics.validateOrganizer = function (data) {
  const errors = [];

  // If role is organizer, these fields are required
  if (data.role === 'organizer') {
    if (!data.organizerName) {
      errors.push('Organizer name is required');
    }

    if (!data.category) {
      errors.push('Category is required');
    }

    if (!data.description) {
      errors.push('Description is required');
    }

    if (!data.contactEmail) {
      errors.push('Contact email is required');
    }
  }

  return errors;
};

// Create and export the model
// 'User' is the model name, MongoDB will create a 'users' collection
export default mongoose.model('User', userSchema);
