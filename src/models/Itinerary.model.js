const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema(
  { name: String, lat: Number, lng: Number, notes: String },
  { _id: false }
);

const daySchema = new mongoose.Schema(
  {
    dayNumber: { type: Number, required: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String, required: true, maxlength: 1000 },
    locations: [locationSchema],
    images: { type: [String], default: [], validate: [(v) => v.length <= 5, 'Maximum 5 images allowed per day.'] },
  },
  { _id: false }
);

const itinerarySchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 120, trim: true },
  description: { type: String, required: true, maxlength: 300, trim: true },
  coverImageUrl: { type: String, required: true },
  images: { type: [String], default: [], validate: [(v) => v.length <= 5, 'Maximum 5 images allowed.'] },
  totalDays: { type: Number, required: true },
  days: [daySchema],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'published'], default: 'pending' },
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:      { type: Date, default: null },
  rejectionReason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Itinerary', itinerarySchema);
