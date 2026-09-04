const fs = require('fs');
const ApiError = require('../utils/ApiError');

const cleanupFiles = (files) => {
  if (!files) return;
  Object.values(files)
    .flat()
    .forEach((f) => {
      if (f && f.path) fs.unlink(f.path, () => {});
    });
};

const validateVideo = (req, _res, next) => {
  const { title, caption, description } = req.body;
  const files = req.files || {};
  const videoFile = files.video && files.video[0];

  if (!videoFile) {
    cleanupFiles(files);
    return next(new ApiError(400, 'Video file is required.', [], 'video'));
  }

  if (!title || !title.trim()) {
    cleanupFiles(files);
    return next(new ApiError(400, 'Title is required.', [], 'title'));
  }
  if (title.trim().length > 120) {
    cleanupFiles(files);
    return next(new ApiError(400, 'Title must be at most 120 characters.', [], 'title'));
  }

  if (!caption || !caption.trim()) {
    cleanupFiles(files);
    return next(new ApiError(400, 'Caption is required.', [], 'caption'));
  }
  if (caption.trim().length > 150) {
    cleanupFiles(files);
    return next(new ApiError(400, 'Caption must be at most 150 characters.', [], 'caption'));
  }

  if (!description || !description.trim()) {
    cleanupFiles(files);
    return next(new ApiError(400, 'Description is required.', [], 'description'));
  }
  if (description.trim().length > 500) {
    cleanupFiles(files);
    return next(new ApiError(400, 'Description must be at most 500 characters.', [], 'description'));
  }

  // Compute server-side; Multer's fileSize limit is the primary guard but we double-check
  const fileSizeMB = parseFloat((videoFile.size / (1024 * 1024)).toFixed(1));
  if (fileSizeMB > 200) {
    cleanupFiles(files);
    return next(
      new ApiError(413, 'Video exceeds the 200MB upload limit.', [], 'video', { maxSizeMB: 200 })
    );
  }

  req.fileSizeMB = fileSizeMB;
  next();
};

module.exports = { validateVideo };
