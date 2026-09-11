const mongoose = require('mongoose');

// A single, generic notification collection. There is deliberately NO
// per-type model (no LikeNotification / FollowNotification). New types are
// added by using a new `type` string + a matching entry in the frontend
// render config — the schema never needs to change.
const notificationSchema = new mongoose.Schema(
  {
    // Who receives the notification
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Who performed the action
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Extensible action type, e.g. 'like', 'follow', 'comment'
    type: { type: String, required: true },
    // The model name of the target entity, e.g. 'BlogPost'. Stored as the
    // Mongoose model name so `entityId` can be populated dynamically via
    // refPath — keeps population generic with zero per-type branching.
    entityType: { type: String, required: true },
    // The specific document the action was performed on. `refPath` resolves
    // the ref target from `entityType` at populate time.
    entityId: { type: mongoose.Schema.Types.ObjectId, refPath: 'entityType' },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// List a user's notifications newest-first.
notificationSchema.index({ recipient: 1, createdAt: -1 });
// Unread-count badge query.
notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
