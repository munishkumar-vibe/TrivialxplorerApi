const Itinerary = require('../models/Itinerary.model');
const sendResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const PUBLIC_STATUSES = ['approved', 'published'];

const createItinerary = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const { coverFile, globalImages, allFiles } = req.parsedFiles;

    const days = req.parsedDays.map((day, i) => {
      const dayImages = allFiles
        .filter((f) => f.fieldname === `dayImages_${i}`)
        .map((f) => `/uploads/itinerary-images/${f.filename}`);
      return { ...day, images: dayImages };
    });

    const itinerary = await Itinerary.create({
      title: title.trim(),
      description: description.trim(),
      coverImageUrl: `/uploads/itinerary-images/${coverFile.filename}`,
      images: globalImages.map((f) => `/uploads/itinerary-images/${f.filename}`),
      totalDays: days.length,
      days,
      author: req.user._id,
      status: 'pending',
    });

    sendResponse(res, 201, 'Itinerary submitted for review.', itinerary);
  } catch (err) {
    next(err);
  }
};

const getItineraryById = async (req, res, next) => {
  try {
    const itin = await Itinerary.findById(req.params.id).populate('author', 'name');
    if (!itin) return next(new ApiError(404, 'Itinerary not found.'));

    const isOwner = itin.author?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!PUBLIC_STATUSES.includes(itin.status) && !isOwner && !isAdmin) {
      return next(new ApiError(404, 'Itinerary not found.'));
    }

    sendResponse(res, 200, 'Itinerary fetched.', itin);
  } catch (err) {
    next(err);
  }
};

const getItineraries = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip  = (page - 1) * limit;

    let filter = {};
    if (req.query.author === 'me') {
      filter.author = req.user._id;
    } else {
      filter.status = { $in: PUBLIC_STATUSES };
    }

    const [data, totalItems] = await Promise.all([
      Itinerary.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).populate('author', 'name'),
      Itinerary.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data,
      pagination: { page, totalPages: Math.ceil(totalItems / limit), totalItems },
    });
  } catch (err) {
    next(err);
  }
};

const deleteItinerary = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, author: req.user._id };

    const itin = await Itinerary.findOneAndDelete(filter);
    if (!itin) return next(new ApiError(404, 'Itinerary not found or you do not have permission to delete it.'));

    sendResponse(res, 200, 'Itinerary deleted.');
  } catch (err) {
    next(err);
  }
};

module.exports = { createItinerary, getItineraryById, getItineraries, deleteItinerary };
