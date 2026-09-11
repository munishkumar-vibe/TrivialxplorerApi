const mongoose = require('mongoose');
const Notification = require('../models/Notification.model');
const sendResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const isValidId = (id) => mongoose.Types.ObjectId.isValid(id);

// Flatten a populated notification into a generic, render-ready DTO. This shape
// is type-agnostic: the frontend config decides how to render each `type`.
const toDTO = (n) => ({
  id: n._id.toString(),
  type: n.type,
  isRead: n.isRead,
  createdAt: n.createdAt,
  actor: n.actor
    ? {
        id: n.actor._id.toString(),
        username: n.actor.username,
        name: `${n.actor.firstName} ${n.actor.lastName}`,
      }
    : null,
  entityType: n.entityType,
  entityId: n.entityId ? (n.entityId._id ? n.entityId._id.toString() : n.entityId.toString()) : null,
  // Pass the populated target through generically. The frontend config reads
  // whatever fields it needs per type (e.g. entity.imageUrl for 'like').
  entity: n.entityId && n.entityId._id ? n.entityId : null,
});

// GET /api/notifications — paginated, newest-first
const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { recipient: req.user._id };

    const [rows, totalItems] = await Promise.all([
      Notification.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('actor', 'username firstName lastName')
        // Dynamic population via refPath — works for any entityType with no
        // per-type branching here.
        .populate('entityId')
        .lean(),
      Notification.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: rows.map(toDTO),
      pagination: { page, totalPages: Math.ceil(totalItems / limit), totalItems },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/notifications/unread-count — badge
const getUnreadCount = async (req, res, next) => {
  try {
    const unread = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    sendResponse(res, 200, 'Unread count.', { unread });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/:id/read — mark one read (idempotent)
const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidId(id)) return next(new ApiError(400, 'Invalid notification id.'));

    await Notification.updateOne(
      { _id: id, recipient: req.user._id },
      { $set: { isRead: true } }
    );

    sendResponse(res, 200, 'Marked read.', { isRead: true });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/notifications/read-all — mark every notification read (idempotent)
const markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );
    sendResponse(res, 200, 'All marked read.', { isRead: true });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, getUnreadCount, markRead, markAllRead };
