const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { getUserProfile, getUserBlogs } = require('../controllers/user.controller');

router.get('/:userId',       protect, getUserProfile);
router.get('/:userId/blogs', protect, getUserBlogs);

module.exports = router;
