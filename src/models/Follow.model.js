const mongoose = require('mongoose');

const followSchema = new mongoose.Schema(
  {
    // The user who initiated the follow
    follower: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // The user being followed
    following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// One follow relationship per (follower, following) pair
followSchema.index({ follower: 1, following: 1 }, { unique: true });
// Fast lookups for "who follows this user" and "who does this user follow"
followSchema.index({ following: 1, createdAt: -1 });
followSchema.index({ follower: 1, createdAt: -1 });

module.exports = mongoose.model('Follow', followSchema);
