const mongoose = require('mongoose');
const Like = require('../models/Like.model');
const BlogPost = require('../models/BlogPost.model');
const sendResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');
const { createNotification } = require('../services/notification.service');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/like/:postId — idempotent
const likePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    if (!isValidId(postId)) return next(new ApiError(400, 'Invalid post id.'));

    const post = await BlogPost.findById(postId).select('_id author');
    if (!post) return next(new ApiError(404, 'Post not found.'));

    // Idempotent: upsert avoids an E11000 on repeat likes.
    await Like.updateOne(
      { user: req.user._id, post: postId },
      { $setOnInsert: { user: req.user._id, post: postId } },
      { upsert: true }
    );

    // Best-effort, non-blocking: the like has already succeeded. The service
    // no-ops when the liker is the post owner.
    createNotification({
      recipient: post.author,
      actor: req.user._id,
      type: 'like',
      entityType: 'BlogPost',
      entityId: post._id,
    });

    sendResponse(res, 200, 'Liked.', { likedByMe: true });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/like/:postId — idempotent
const unlikePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    if (!isValidId(postId)) return next(new ApiError(400, 'Invalid post id.'));

    await Like.deleteOne({ user: req.user._id, post: postId });

    sendResponse(res, 200, 'Unliked.', { likedByMe: false });
  } catch (err) {
    next(err);
  }
};

// GET /api/like/:postId/status — count + whether the viewer liked it
const getLikeStatus = async (req, res, next) => {
  try {
    const { postId } = req.params;
    if (!isValidId(postId)) return next(new ApiError(400, 'Invalid post id.'));

    const [likeCount, liked] = await Promise.all([
      Like.countDocuments({ post: postId }),
      Like.exists({ user: req.user._id, post: postId }),
    ]);

    sendResponse(res, 200, 'Like status.', { likeCount, likedByMe: Boolean(liked) });
  } catch (err) {
    next(err);
  }
};

// GET /api/like/status?postIds=a,b,c — batched like-state for a list of posts.
// One aggregation for counts + one query for the viewer's likes, both via $in.
// Never one query per post.
const getLikeStatuses = async (req, res, next) => {
  try {
    const raw = (req.query.postIds || '').toString();
    const ids = raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => isValidId(s))
      .map((s) => new mongoose.Types.ObjectId(s));

    if (ids.length === 0) return sendResponse(res, 200, 'Like statuses.', {});

    const [counts, mine] = await Promise.all([
      Like.aggregate([
        { $match: { post: { $in: ids } } },
        { $group: { _id: '$post', count: { $sum: 1 } } },
      ]),
      Like.find({ user: req.user._id, post: { $in: ids } }).select('post').lean(),
    ]);

    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));
    const likedSet = new Set(mine.map((l) => l.post.toString()));

    // Keyed by postId so callers can annotate their list rows directly.
    const data = {};
    for (const id of ids) {
      const key = id.toString();
      data[key] = { likeCount: countMap.get(key) || 0, likedByMe: likedSet.has(key) };
    }

    sendResponse(res, 200, 'Like statuses.', data);
  } catch (err) {
    next(err);
  }
};

module.exports = { likePost, unlikePost, getLikeStatus, getLikeStatuses };
