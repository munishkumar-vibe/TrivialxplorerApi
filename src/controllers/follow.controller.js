const mongoose = require('mongoose');
const Follow = require('../models/Follow.model');
const User = require('../models/User.model');
const sendResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// POST /api/follow/:userId — idempotent
const followUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return next(new ApiError(400, 'Invalid user id.'));

    if (req.user._id.equals(userId)) {
      return next(new ApiError(400, 'You cannot follow yourself.'));
    }

    const target = await User.findById(userId).select('_id');
    if (!target) return next(new ApiError(404, 'User not found.'));

    // Idempotent: upsert avoids an E11000 on repeat follows
    await Follow.updateOne(
      { follower: req.user._id, following: userId },
      { $setOnInsert: { follower: req.user._id, following: userId } },
      { upsert: true }
    );

    sendResponse(res, 200, 'Followed.', { isFollowing: true });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/follow/:userId — idempotent
const unfollowUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return next(new ApiError(400, 'Invalid user id.'));

    await Follow.deleteOne({ follower: req.user._id, following: userId });

    sendResponse(res, 200, 'Unfollowed.', { isFollowing: false });
  } catch (err) {
    next(err);
  }
};

// GET /api/follow/:userId/status
const getFollowStatus = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return next(new ApiError(400, 'Invalid user id.'));

    const exists = await Follow.exists({ follower: req.user._id, following: userId });
    sendResponse(res, 200, 'Follow status.', { isFollowing: Boolean(exists) });
  } catch (err) {
    next(err);
  }
};

// Shared helper: build a paginated people list and annotate each row with the
// viewer's follow-state so inline follow buttons render correctly.
const buildPeopleList = async (viewerId, filter, populatePath, page, limit) => {
  const skip = (page - 1) * limit;

  const [rows, totalItems] = await Promise.all([
    Follow.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .populate(populatePath, 'firstName lastName username')
      .lean(),
    Follow.countDocuments(filter),
  ]);

  const people = rows.map((r) => r[populatePath]).filter(Boolean);
  const ids = people.map((p) => p._id);

  const followedSet = new Set(
    (await Follow.find({ follower: viewerId, following: { $in: ids } }).select('following').lean())
      .map((f) => f.following.toString())
  );

  const data = people.map((p) => ({
    id: p._id.toString(),
    name: `${p.firstName} ${p.lastName}`,
    username: p.username,
    isFollowing: followedSet.has(p._id.toString()),
    isSelf: viewerId.equals(p._id),
  }));

  return { data, totalItems };
};

// GET /api/follow/:userId/followers — people who follow :userId
const getFollowers = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return next(new ApiError(400, 'Invalid user id.'));

    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const { data, totalItems } = await buildPeopleList(
      req.user._id, { following: userId }, 'follower', page, limit
    );

    res.status(200).json({
      success: true,
      data,
      pagination: { page, totalPages: Math.ceil(totalItems / limit), totalItems },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/follow/:userId/following — people :userId follows
const getFollowing = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return next(new ApiError(400, 'Invalid user id.'));

    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

    const { data, totalItems } = await buildPeopleList(
      req.user._id, { follower: userId }, 'following', page, limit
    );

    res.status(200).json({
      success: true,
      data,
      pagination: { page, totalPages: Math.ceil(totalItems / limit), totalItems },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { followUser, unfollowUser, getFollowStatus, getFollowers, getFollowing };
