const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema(
  {
    // The user who liked the post
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // The post being liked
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost', required: true },
  },
  { timestamps: true }
);

// One like per (user, post) pair — enforces a single like and gives an
// instant "did I like this" check.
likeSchema.index({ user: 1, post: 1 }, { unique: true });
// Fast counting / listing of likes on a given post.
likeSchema.index({ post: 1, createdAt: -1 });

module.exports = mongoose.model('Like', likeSchema);
