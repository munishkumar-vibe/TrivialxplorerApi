const BlogPost = require('../models/BlogPost.model');
const Itinerary = require('../models/Itinerary.model');
const Video     = require('../models/Video.model');
const sendResponse  = require('../utils/ApiResponse');
const ApiError      = require('../utils/ApiError');

const MODELS = { blog: BlogPost, itinerary: Itinerary, video: Video };

/* ── Pending list ─────────────────────────────────── */

const getPending = (modelKey) => async (req, res, next) => {
  try {
    const Model = MODELS[modelKey];
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const select = modelKey === 'blog'
      ? 'title description imageUrl author createdAt status'
      : modelKey === 'itinerary'
      ? 'title description coverImageUrl author createdAt status totalDays'
      : 'title description thumbnailUrl author createdAt status';

    const [data, totalItems] = await Promise.all([
      Model.find({ status: 'pending' })
        .select(select)
        .populate('author', 'name email')
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Model.countDocuments({ status: 'pending' }),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { page, limit, totalItems, totalPages: Math.ceil(totalItems / limit) },
    });
  } catch (err) {
    next(err);
  }
};

/* ── Approve ──────────────────────────────────────── */

const approve = (modelKey) => async (req, res, next) => {
  try {
    const Model = MODELS[modelKey];
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'approved', reviewedBy: req.user._id, reviewedAt: new Date(), rejectionReason: null } },
      { new: true }
    );
    if (!doc) return next(new ApiError(404, 'Item not found.'));
    sendResponse(res, 200, 'Approved successfully.', doc);
  } catch (err) {
    next(err);
  }
};

/* ── Reject ───────────────────────────────────────── */

const reject = (modelKey) => async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason?.trim()) return next(new ApiError(400, 'Rejection reason is required.'));

    const Model = MODELS[modelKey];
    const doc = await Model.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'rejected', reviewedBy: req.user._id, reviewedAt: new Date(), rejectionReason: reason.trim() } },
      { new: true }
    );
    if (!doc) return next(new ApiError(404, 'Item not found.'));
    sendResponse(res, 200, 'Rejected.', doc);
  } catch (err) {
    next(err);
  }
};

/* ── Pending counts (sidebar badges) ─────────────── */

const getPendingCounts = async (req, res, next) => {
  try {
    const [blogs, itineraries, videos] = await Promise.all([
      BlogPost.countDocuments({ status: 'pending' }),
      Itinerary.countDocuments({ status: 'pending' }),
      Video.countDocuments({ status: 'pending' }),
    ]);
    sendResponse(res, 200, 'Counts fetched.', { blogs, itineraries, videos, total: blogs + itineraries + videos });
  } catch (err) {
    next(err);
  }
};

module.exports = { getPending, approve, reject, getPendingCounts };
