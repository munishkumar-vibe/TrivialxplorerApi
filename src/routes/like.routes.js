const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { writeRateLimiter } = require('../middleware/rateLimiter');
const {
  likePost,
  unlikePost,
  getLikeStatus,
  getLikeStatuses,
} = require('../controllers/like.controller');

router.get('/status', protect, getLikeStatuses); // batched — must precede /:postId/*
router.post('/:postId', protect, writeRateLimiter, likePost);
router.delete('/:postId', protect, writeRateLimiter, unlikePost);
router.get('/:postId/status', protect, getLikeStatus);

module.exports = router;
