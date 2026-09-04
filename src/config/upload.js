const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const UPLOADS_ROOT = path.resolve(__dirname, '..', '..', 'uploads');

const dirs = {
  blogImages: path.join(UPLOADS_ROOT, 'blog-images'),
  videos: path.join(UPLOADS_ROOT, 'videos'),
  itineraryImages: path.join(UPLOADS_ROOT, 'itinerary-images'),
};

Object.values(dirs).forEach((dir) => fs.mkdirSync(dir, { recursive: true }));

const uniqueFilename = (file) => {
  const ext = path.extname(file.originalname).toLowerCase();
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
};

const makeStorage = (destination) =>
  multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, destination),
    filename: (_req, file, cb) => cb(null, uniqueFilename(file)),
  });

const imageFilter = (_req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowed.includes(file.mimetype)) return cb(null, true);
  cb(new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed.', [], file.fieldname), false);
};

const videoWithThumbnailFilter = (_req, file, cb) => {
  if (file.fieldname === 'video') {
    const allowed = ['video/mp4', 'video/quicktime', 'video/webm'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(new ApiError(400, 'Only MP4, MOV, and WebM videos are allowed.', [], 'video'), false);
  }
  if (file.fieldname === 'thumbnail') {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    return cb(
      new ApiError(400, 'Only JPEG, PNG, and WebP images are allowed for thumbnail.', [], 'thumbnail'),
      false
    );
  }
  cb(null, false);
};

const blogImageUpload = multer({
  storage: makeStorage(dirs.blogImages),
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
  fileFilter: imageFilter,
});

const videoUpload = multer({
  storage: makeStorage(dirs.videos),
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: videoWithThumbnailFilter,
});

const itineraryImageUpload = multer({
  storage: makeStorage(dirs.itineraryImages),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

module.exports = { blogImageUpload, videoUpload, itineraryImageUpload };
