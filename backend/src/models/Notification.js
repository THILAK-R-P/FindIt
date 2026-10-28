const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: [
        'info',
        'report_created',
        'status_updated',
        'potential_match',
        'claim_submitted',
        'claim_approved',
        'claim_rejected',
        'admin_message',
      ],
      default: 'info',
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: {
      type: String,
      default: '',
    },
    lostItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
    foundItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      default: null,
    },
    matchScore: {
      type: Number,
      default: null,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailRecipient: {
      type: String,
      default: '',
      trim: true,
    },
    emailError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index for stable deduplication of potential_match notifications per user and lost-found pair
notificationSchema.index(
  { user: 1, lostItem: 1, foundItem: 1 },
  {
    unique: true,
    partialFilterExpression: {
      type: 'potential_match',
    },
  }
);

// Index for fast duplicate-email checking across pairs
notificationSchema.index({ lostItem: 1, foundItem: 1, emailSent: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
