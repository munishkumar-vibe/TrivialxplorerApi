const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 120, trim: true },
  caption: { type: String, required: true, maxlength: 150, trim: true },
  description: { type: String, required: true, maxlength: 500, trim: true },
  videoUrl: { type: String, required: true },
  thumbnailUrl: { type: String },
  fileSizeMB: { type: Number, required: true },
  durationSeconds: { type: Number },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:      { type: Date, default: null },
  rejectionReason: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Video', videoSchema);
