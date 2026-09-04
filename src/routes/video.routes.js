const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { videoUpload } = require('../config/upload');
const { validateVideo } = require('../validators/video.validator');
const { createVideo, getVideos } = require('../controllers/video.controller');

const uploadFields = videoUpload.fields([
  { name: 'video', maxCount: 1 },
  { name: 'thumbnail', maxCount: 1 },
]);

router.post('/', protect, uploadFields, validateVideo, createVideo);
router.get('/', protect, getVideos);

module.exports = router;
