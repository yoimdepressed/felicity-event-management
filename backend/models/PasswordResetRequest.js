import mongoose from 'mongoose';

const passwordResetRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    newPassword: {
      type: String,
      // Set when approved by admin
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // Admin who reviewed the request
    },
    reviewedAt: {
      type: Date,
    },
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const PasswordResetRequest = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);

export default PasswordResetRequest;
