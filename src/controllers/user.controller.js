const mongoose = require('mongoose');
const User = require('../models/User.model');
const BlogPost = require('../models/BlogPost.model');
const Follow = require('../models/Follow.model');
const sendResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

const PUBLIC_STATUSES = ['approved', 'published'];

// GET /api/users/:userId — public profile (no PII)
const getUserProfile = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return next(new ApiError(400, 'Invalid user id.'));

    // Explicit whitelist — never leak email / phone / dob / tokens
    const user = await User.findById(userId).select('username firstName lastName role createdAt');
    if (!user) return next(new ApiError(404, 'User not found.'));

    const [followerCount, followingCount, postCount, isFollowing] = await Promise.all([
      Follow.countDocuments({ following: userId }),
      Follow.countDocuments({ follower: userId }),
      BlogPost.countDocuments({ author: userId, status: { $in: PUBLIC_STATUSES } }),
      Follow.exists({ follower: req.user._id, following: userId }),
    ]);

    sendResponse(res, 200, 'Profile fetched.', {
      id: user._id.toString(),
      name: `${user.firstName} ${user.lastName}`,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      followerCount,
      followingCount,
      postCount,
      isFollowing: Boolean(isFollowing),
      isSelf: req.user._id.equals(userId),
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:userId/blogs — a user's published blogs only
const getUserBlogs = async (req, res, next) => {
  try {
    const { userId } = req.params;
    if (!isValidId(userId)) return next(new ApiError(400, 'Invalid user id.'));

    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip  = (page - 1) * limit;

    const filter = { author: userId, status: { $in: PUBLIC_STATUSES } };

    const [data, totalItems] = await Promise.all([
      BlogPost.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('author', 'firstName lastName username'),
      BlogPost.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { page, totalPages: Math.ceil(totalItems / limit), totalItems },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUserProfile, getUserBlogs };
