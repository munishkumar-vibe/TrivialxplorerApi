const express = require('express');
const { protect, requireAdmin } = require('../middleware/auth.middleware');
const { getPending, approve, reject, getPendingCounts } = require('../controllers/admin.controller');

const router = express.Router();

router.use(protect, requireAdmin);

router.get('/counts', getPendingCounts);

router.get('/blogs/pending',          getPending('blog'));
router.patch('/blogs/:id/approve',    approve('blog'));
router.patch('/blogs/:id/reject',     reject('blog'));

router.get('/itineraries/pending',         getPending('itinerary'));
router.patch('/itineraries/:id/approve',   approve('itinerary'));
router.patch('/itineraries/:id/reject',    reject('itinerary'));

router.get('/videos/pending',         getPending('video'));
router.patch('/videos/:id/approve',   approve('video'));
router.patch('/videos/:id/reject',    reject('video'));

module.exports = router;
