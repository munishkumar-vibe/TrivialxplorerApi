const Notification = require('../models/Notification.model');

// Generic notification creator. Any feature (like, follow, comment, …) calls
// this with the same shape — the service knows nothing type-specific.
//
// Two safety rules baked in so callers don't have to repeat them:
//   1. Never notify yourself (actor === recipient is a no-op).
//   2. Never let notification failures bubble up into the caller's main
//      action — creating a notification is best-effort and side-band.
const createNotification = async ({ recipient, actor, type, entityType, entityId }) => {
  try {
    if (!recipient || !actor) return null;
    // A user acting on their own content should not be notified.
    if (recipient.toString() === actor.toString()) return null;

    return await Notification.create({ recipient, actor, type, entityType, entityId });
  } catch (err) {
    // Swallow — the caller's primary action (the like, the follow) must still
    // succeed even if the notification write fails.
    console.error('createNotification failed:', err.message);
    return null;
  }
};

module.exports = { createNotification };
