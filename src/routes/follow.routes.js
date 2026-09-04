const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { writeRateLimiter } = require('../middleware/rateLimiter');
const {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
} = require('../controllers/follow.controller');

router.post('/:userId',   protect, writeRateLimiter, followUser);
router.delete('/:userId', protect, writeRateLimiter, unfollowUser);
router.get('/:userId/status',    protect, getFollowStatus);
router.get('/:userId/followers', protect, getFollowers);
router.get('/:userId/following', protect, getFollowing);

module.exports = router;
