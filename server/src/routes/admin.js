import { Router } from 'express';
import { Booking, Movie, Theatre, Show, User, Review } from '../models/index.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const r = Router();
r.use(protect, adminOnly);
r.get(
  '/summary',
  asyncHandler(async (req, res) => {
    const [movies, theatres, shows, users, bookings, reviews, revenue] = await Promise.all([
      Movie.countDocuments({ isActive: true }),
      Theatre.countDocuments(),
      Show.countDocuments({ isActive: true }),
      User.countDocuments(),
      Booking.countDocuments(),
      Review.countDocuments(),
      Booking.aggregate([
        { $match: { status: 'confirmed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
    ]);
    res.json({
      movies,
      theatres,
      shows,
      users,
      bookings,
      reviews,
      revenue: revenue[0]?.total || 0,
    });
  }),
);
r.get(
  '/bookings',
  asyncHandler(async (req, res) =>
    res.json(
      await Booking.find()
        .populate('user', 'name email')
        .populate({ path: 'show', populate: ['movie', 'theatre'] })
        .sort({ createdAt: -1 })
        .limit(500),
    ),
  ),
);
r.get(
  '/reviews',
  asyncHandler(async (req, res) =>
    res.json(
      await Review.find()
        .populate('user', 'name')
        .populate('movie', 'title')
        .sort({ createdAt: -1 }),
    ),
  ),
);
r.patch(
  '/reviews/:id',
  asyncHandler(async (req, res) => {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isVisible: !!req.body.isVisible },
      { new: true },
    );
    if (!review) return res.status(404).json({ message: 'Review not found' });
    res.json(review);
  }),
);
export default r;
