const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { itineraryImageUpload } = require('../config/upload');
const { validateItinerary } = require('../validators/itinerary.validator');
const { createItinerary, getItineraryById, getItineraries, deleteItinerary } = require('../controllers/itinerary.controller');

router.post('/',       protect, itineraryImageUpload.any(), validateItinerary, createItinerary);
router.delete('/:id',  protect, deleteItinerary);
router.get('/',        protect, getItineraries);
router.get('/:id',     protect, getItineraryById);

module.exports = router;
