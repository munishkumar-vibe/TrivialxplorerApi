const router = require('express').Router();
const { protect } = require('../middleware/auth.middleware');
const { blogImageUpload } = require('../config/upload');
const { validateBlogPost, validateBlogUpdate } = require('../validators/blog.validator');
const { createBlogPost, getBlogPosts, getBlogPostById, getNextBlogPost, updateBlogPost, deleteBlogPost } = require('../controllers/blog.controller');

const blogFields = blogImageUpload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'contentImages', maxCount: 5 },
]);

router.post('/',       protect, blogFields, validateBlogPost,   createBlogPost);
router.patch('/:id',  protect, blogFields, validateBlogUpdate, updateBlogPost);
router.delete('/:id', protect, deleteBlogPost);
router.get('/',       protect, getBlogPosts);
router.get('/:id/next', protect, getNextBlogPost);
router.get('/:id',    protect, getBlogPostById);

module.exports = router;
