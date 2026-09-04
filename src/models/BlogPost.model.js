const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 120, trim: true },
  description: { type: String, required: true, maxlength: 200, trim: true },
  content: { type: String, required: true },
  wordCount: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  contentImageUrls: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'published'], default: 'pending' },
  reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:      { type: Date, default: null },
  rejectionReason: { type: String, default: null },
  tags: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BlogPost', blogPostSchema);
