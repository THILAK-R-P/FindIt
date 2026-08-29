const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: [true, 'Please provide item name'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: [true, 'Item type (lost or found) is required'],
    },
    category: {
      type: String,
      enum: [
        'Electronics',
        'Documents',
        'Accessories',
        'Books',
        'Clothing',
        'Bags',
        'Keys',
        'ID Cards',
        'Other',
      ],
      required: [true, 'Please specify a category'],
    },
    description: {
      type: String,
      required: [true, 'Please provide item description'],
    },
    date: {
      type: Date,
      required: [true, 'Please specify the date'],
    },
    time: {
      type: String,
      default: '',
    },
    location: {
      type: String,
      required: [true, 'Please specify campus location'],
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    color: {
      type: String,
      trim: true,
      default: '',
    },
    distinctiveMarks: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['lost', 'found', 'matched', 'claimed', 'recovered'],
      default: function () {
        return this.type === 'lost' ? 'lost' : 'found';
      },
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add text indexing for search
itemSchema.index({
  itemName: 'text',
  description: 'text',
  location: 'text',
  brand: 'text',
  color: 'text',
  distinctiveMarks: 'text',
});

module.exports = mongoose.model('Item', itemSchema);
