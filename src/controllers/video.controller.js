const Video = require('../models/Video.model');
const sendResponse = require('../utils/ApiResponse');

const createVideo = async (req, res, next) => {
  try {
    const { title, caption, description } = req.body;
    const files = req.files;
    const videoFile = files.video[0];
    const thumbnailFile = files.thumbnail && files.thumbnail[0];

    const video = await Video.create({
      title: title.trim(),
      caption: caption.trim(),
      description: description.trim(),
      videoUrl: `/uploads/videos/${videoFile.filename}`,
      thumbnailUrl: thumbnailFile ? `/uploads/videos/${thumbnailFile.filename}` : undefined,
      fileSizeMB: req.fileSizeMB,
      author: req.user._id,
      status: 'pending',
    });

    sendResponse(res, 201, 'Video submitted for review.', video);
  } catch (err) {
    next(err);
  }
};

const getVideos = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
    const skip  = (page - 1) * limit;

    let filter = {};
    if (req.query.author === 'me') {
      filter.author = req.user._id;
    } else {
      filter.status = 'approved';
    }

    const [data, totalItems] = await Promise.all([
      Video.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
      Video.countDocuments(filter),
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

module.exports = { createVideo, getVideos };
