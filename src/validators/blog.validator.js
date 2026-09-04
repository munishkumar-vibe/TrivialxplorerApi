const fs = require('fs');
const ApiError = require('../utils/ApiError');

const cleanupFiles = (files) => {
  if (!files) return;
  Object.values(files).flat().forEach((f) => {
    if (f && f.path) fs.unlink(f.path, () => {});
  });
};

const validateBlogPost = (req, _res, next) => {
  const { title, description, content } = req.body;
  const files = req.files ?? {};
  const coverImage = files['image']?.[0];
  const contentImages = files['contentImages'] ?? [];

  if (!coverImage) {
    cleanupFiles(files);
    return next(new ApiError(400, 'Cover image is required.', [], 'image'));
  }

  if (contentImages.length > 5) {
    cleanupFiles(files);
    return next(new ApiError(400, 'You can upload a maximum of 5 content images.', [], 'contentImages'));
  }

  if (!title || !title.trim()) {
    cleanupFiles(files); return next(new ApiError(400, 'Title is required.', [], 'title'));
  }
  if (title.trim().length > 120) {
    cleanupFiles(files); return next(new ApiError(400, 'Title must be at most 120 characters.', [], 'title'));
  }
  if (!description || !description.trim()) {
    cleanupFiles(files); return next(new ApiError(400, 'Description is required.', [], 'description'));
  }
  if (description.trim().length > 200) {
    cleanupFiles(files); return next(new ApiError(400, 'Description must be at most 200 characters.', [], 'description'));
  }
  if (!content || !content.trim()) {
    cleanupFiles(files); return next(new ApiError(400, 'Content is required.', [], 'content'));
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 500 || wordCount > 1500) {
    cleanupFiles(files);
    return next(new ApiError(400, 'Content must be between 500 and 1500 words.', [], 'content', { currentWordCount: wordCount, min: 500, max: 1500 }));
  }

  req.wordCount = wordCount;
  next();
};

const validateBlogUpdate = (req, _res, next) => {
  const { title, description, content } = req.body;
  const files = req.files ?? {};
  const contentImages = files['contentImages'] ?? [];

  if (contentImages.length > 5) {
    cleanupFiles(files);
    return next(new ApiError(400, 'You can upload a maximum of 5 content images.', [], 'contentImages'));
  }

  if (!title || !title.trim()) {
    cleanupFiles(files); return next(new ApiError(400, 'Title is required.', [], 'title'));
  }
  if (title.trim().length > 120) {
    cleanupFiles(files); return next(new ApiError(400, 'Title must be at most 120 characters.', [], 'title'));
  }
  if (!description || !description.trim()) {
    cleanupFiles(files); return next(new ApiError(400, 'Description is required.', [], 'description'));
  }
  if (description.trim().length > 200) {
    cleanupFiles(files); return next(new ApiError(400, 'Description must be at most 200 characters.', [], 'description'));
  }
  if (!content || !content.trim()) {
    cleanupFiles(files); return next(new ApiError(400, 'Content is required.', [], 'content'));
  }

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  if (wordCount < 500 || wordCount > 1500) {
    cleanupFiles(files);
    return next(new ApiError(400, 'Content must be between 500 and 1500 words.', [], 'content', { currentWordCount: wordCount, min: 500, max: 1500 }));
  }

  req.wordCount = wordCount;
  next();
};

module.exports = { validateBlogPost, validateBlogUpdate };
