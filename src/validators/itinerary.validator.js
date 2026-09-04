const fs = require('fs');
const ApiError = require('../utils/ApiError');

const cleanupFile = (file) => {
  if (file && file.path) fs.unlink(file.path, () => {});
};

const cleanupAll = (files) => {
  if (Array.isArray(files)) files.forEach(cleanupFile);
};

const validateItinerary = (req, _res, next) => {
  const allFiles = req.files || [];
  const { title, description, days: daysRaw } = req.body;

  const coverFile = allFiles.find((f) => f.fieldname === 'coverImage');
  const globalImages = allFiles.filter((f) => f.fieldname === 'images');

  const abort = (err) => {
    cleanupAll(allFiles);
    return next(err);
  };

  if (!coverFile) {
    return abort(new ApiError(400, 'Cover image is required.', [], 'coverImage'));
  }

  if (globalImages.length > 5) {
    return abort(new ApiError(400, 'You can upload a maximum of 5 additional images.', [], 'images'));
  }

  if (!title || !title.trim()) {
    return abort(new ApiError(400, 'Title is required.', [], 'title'));
  }
  if (title.trim().length > 120) {
    return abort(new ApiError(400, 'Title must be at most 120 characters.', [], 'title'));
  }

  if (!description || !description.trim()) {
    return abort(new ApiError(400, 'Description is required.', [], 'description'));
  }
  if (description.trim().length > 300) {
    return abort(new ApiError(400, 'Description must be at most 300 characters.', [], 'description'));
  }

  if (!daysRaw) {
    return abort(new ApiError(400, 'Days itinerary is required.', [], 'days'));
  }

  let days;
  try {
    days = typeof daysRaw === 'string' ? JSON.parse(daysRaw) : daysRaw;
  } catch {
    return abort(new ApiError(400, 'Days must be a valid JSON array.', [], 'days'));
  }

  if (!Array.isArray(days) || days.length === 0) {
    return abort(new ApiError(400, 'Days must be a non-empty array.', [], 'days'));
  }

  for (let i = 0; i < days.length; i++) {
    const day = days[i];

    if (day.dayNumber === undefined || day.dayNumber === null) {
      return abort(new ApiError(400, `Day ${i + 1} is missing dayNumber.`, [], 'days'));
    }
    if (!day.title || !String(day.title).trim()) {
      return abort(new ApiError(400, `Day ${i + 1} is missing a title.`, [], 'days'));
    }
    if (!day.description || !String(day.description).trim()) {
      return abort(new ApiError(400, `Day ${i + 1} is missing a description.`, [], 'days'));
    }

    // Validate per-day images (field name: dayImages_0, dayImages_1, ...)
    const dayImages = allFiles.filter((f) => f.fieldname === `dayImages_${i}`);
    if (dayImages.length > 5) {
      return abort(
        new ApiError(400, `Day ${i + 1} can have a maximum of 5 images.`, [], `dayImages_${i}`)
      );
    }
  }

  req.parsedDays = days;
  req.parsedFiles = {
    coverFile,
    globalImages,
    allFiles,
  };

  next();
};

module.exports = { validateItinerary };
