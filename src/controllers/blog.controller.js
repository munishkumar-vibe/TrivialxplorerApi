const BlogPost = require('../models/BlogPost.model');
const sendResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

const PUBLIC_STATUSES = ['approved', 'published']; // 'published' covers legacy data

const createBlogPost = async (req, res, next) => {
  try {
    const { title, description, content } = req.body;
    const files = req.files ?? {};
    const coverFile = files['image']?.[0];
    const contentImageFiles = files['contentImages'] ?? [];

    const post = await BlogPost.create({
      title: title.trim(),
      description: description.trim(),
      content,
      wordCount: req.wordCount,
      imageUrl: `/uploads/blog-images/${coverFile.filename}`,
      contentImageUrls: contentImageFiles.map((f) => `/uploads/blog-images/${f.filename}`),
      author: req.user._id,
      status: 'pending',
    });

    sendResponse(res, 201, 'Blog post submitted for review.', post);
  } catch (err) {
    next(err);
  }
};

const updateBlogPost = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, content } = req.body;
    const files = req.files ?? {};
    const coverFile = files['image']?.[0];
    const contentImageFiles = files['contentImages'] ?? [];

    const update = {
      title: title.trim(),
      description: description.trim(),
      content,
      wordCount: req.wordCount,
      updatedAt: new Date(),
      status: 'pending',
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
    };

    if (coverFile) update.imageUrl = `/uploads/blog-images/${coverFile.filename}`;
    if (contentImageFiles.length > 0) {
      update.contentImageUrls = contentImageFiles.map((f) => `/uploads/blog-images/${f.filename}`);
    }

    const post = await BlogPost.findOneAndUpdate(
      { _id: id, author: req.user._id },
      { $set: update },
      { new: true }
    );

    if (!post) return next(new ApiError(404, 'Post not found or you do not have permission to edit it.'));

    sendResponse(res, 200, 'Blog post resubmitted for review.', post);
  } catch (err) {
    next(err);
  }
};

const getBlogPostById = async (req, res, next) => {
  try {
    const post = await BlogPost.findById(req.params.id).populate('author', 'firstName lastName username');
    if (!post) return next(new ApiError(404, 'Post not found.'));

    const isOwner = post.author?._id?.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!PUBLIC_STATUSES.includes(post.status) && !isOwner && !isAdmin) {
      return next(new ApiError(404, 'Post not found.'));
    }

    sendResponse(res, 200, 'Post fetched.', post);
  } catch (err) {
    next(err);
  }
};

const getBlogPosts = async (req, res, next) => {
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
      BlogPost.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }).populate('author', 'firstName lastName username'),
      BlogPost.countDocuments(filter),
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

const deleteBlogPost = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const filter = isAdmin
      ? { _id: req.params.id }
      : { _id: req.params.id, author: req.user._id };

    const post = await BlogPost.findOneAndDelete(filter);
    if (!post) return next(new ApiError(404, 'Post not found or you do not have permission to delete it.'));

    sendResponse(res, 200, 'Post deleted.');
  } catch (err) {
    next(err);
  }
};

module.exports = { createBlogPost, updateBlogPost, getBlogPostById, getBlogPosts, deleteBlogPost };
