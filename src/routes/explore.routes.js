const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const { getExploreData } = require('../controllers/explore.controller');

const router = express.Router();

router.get('/', protect, getExploreData);

module.exports = router;
