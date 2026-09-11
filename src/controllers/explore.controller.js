const BlogPost = require('../models/BlogPost.model');
const Itinerary = require('../models/Itinerary.model');

const getExploreData = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const type = req.query.type; // "blog" | "itinerary" | undefined (all)

    const baseFilter = { status: { $in: ['approved', 'published'] } };

    const fetchBlogs = type !== 'itinerary';
    const fetchItins = type !== 'blog';

    const [blogs, itins, totalBlogs, totalItins] = await Promise.all([
      fetchBlogs
        ? BlogPost.find(baseFilter)
            .select('title description imageUrl author createdAt viewCount wordCount status')
            .populate('author', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .lean()
        : [],
      fetchItins
        ? Itinerary.find(baseFilter)
            .select('title description coverImageUrl author createdAt viewCount totalDays difficulty region status')
            .populate('author', 'firstName lastName username')
            .sort({ createdAt: -1 })
            .lean()
        : [],
      fetchBlogs ? BlogPost.countDocuments(baseFilter) : 0,
      fetchItins ? Itinerary.countDocuments(baseFilter) : 0,
    ]);

    const combined = [
      ...blogs.map((b) => ({ ...b, _type: 'blog' })),
      ...itins.map((i) => ({ ...i, _type: 'itinerary' })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(skip, skip + limit);

    const totalItems = totalBlogs + totalItins;

    res.status(200).json({
      success: true,
      data: combined,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getExploreData };
