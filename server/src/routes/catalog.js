import { Router } from 'express';
import { Movie, Theatre, Show, Booking, SeatLock, Review } from '../models/index.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const r = Router();
const notifySeatsChanged = (req, showId) =>
  req.app
    .get('io')
    ?.to(`show:${showId}`)
    .emit('seats-updated', { showId: String(showId) });
r.get(
  '/movies',
  asyncHandler(async (req, res) => {
    const q = { isActive: true };
    if (req.query.search) q.title = { $regex: req.query.search, $options: 'i' };
    if (req.query.genre) q.genre = req.query.genre;
    if (req.query.language) q.language = req.query.language;
    const movies = await Movie.find(q).sort({ releaseDate: -1 }).limit(100);
    res.json(movies);
  }),
);
r.get(
  '/movies/:id',
  asyncHandler(async (req, res) => {
    const m = await Movie.findById(req.params.id);
    if (!m || !m.isActive) return res.status(404).json({ message: 'Movie not found' });
    const reviews = await Review.find({ movie: m._id, isVisible: true })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(30);
    res.json({ movie: m, reviews });
  }),
);
r.post(
  '/movies',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const fields = [
      'title',
      'description',
      'posterUrl',
      'genre',
      'language',
      'durationMinutes',
      'releaseDate',
      'rating',
      'director',
      'country',
      'cast',
      'certification',
      'trailerUrl',
    ];
    const values = Object.fromEntries(
      fields.filter((k) => req.body[k] !== undefined).map((k) => [k, req.body[k]]),
    );
    res.status(201).json(await Movie.create(values));
  }),
);
r.patch(
  '/movies/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const fields = [
      'title',
      'description',
      'posterUrl',
      'genre',
      'language',
      'durationMinutes',
      'releaseDate',
      'rating',
      'director',
      'country',
      'cast',
      'certification',
      'trailerUrl',
    ];
    const values = Object.fromEntries(
      fields.filter((k) => req.body[k] !== undefined).map((k) => [k, req.body[k]]),
    );
    if (values.releaseDate === '') values.releaseDate = null;
    const m = await Movie.findByIdAndUpdate(
      req.params.id,
      { $set: values },
      { new: true, runValidators: true },
    );
    if (!m) return res.status(404).json({ message: 'Movie not found' });
    res.json(m);
  }),
);
r.delete(
  '/movies/:id',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    await Movie.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Movie archived' });
  }),
);
r.get(
  '/theatres',
  asyncHandler(async (req, res) => {
    const q = {};
    if (req.query.city) q.city = { $regex: req.query.city, $options: 'i' };
    res.json(await Theatre.find(q).sort({ city: 1, name: 1 }));
  }),
);
r.post(
  '/theatres',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => res.status(201).json(await Theatre.create(req.body))),
);
r.get(
  '/shows',
  asyncHandler(async (req, res) => {
    const q = { isActive: true, startTime: { $gte: new Date() } };
    if (req.query.movieId) q.movie = req.query.movieId;
    if (req.query.city) {
      const ts = await Theatre.find({ city: { $regex: req.query.city, $options: 'i' } }).select(
        '_id',
      );
      q.theatre = { $in: ts.map((t) => t._id) };
    }
    if (req.query.date) {
      const d = new Date(req.query.date);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      q.startTime = { $gte: d, $lt: next };
    }
    const shows = await Show.find(q)
      .populate('movie')
      .populate('theatre')
      .sort({ startTime: 1 })
      .limit(300);
    res.json(shows);
  }),
);
r.post(
  '/shows',
  protect,
  adminOnly,
  asyncHandler(async (req, res) => {
    const { sampleSeatActivity, ...values } = req.body || {};
    delete values.sampleBookedSeats;
    delete values.sampleHeldSeats;
    delete values.sampleHeldUntil;
    if (sampleSeatActivity === true) {
      const rows = Math.max(1, Math.min(20, Number(values.rows) || 6));
      const seatsPerRow = Math.max(1, Math.min(30, Number(values.seatsPerRow) || 10));
      const labels = values.seatLabels?.length
        ? values.seatLabels
        : Array.from({ length: rows }, (_, i) =>
            Array.from({ length: seatsPerRow }, (_, j) => String.fromCharCode(65 + i) + (j + 1)),
          ).flat();
      values.sampleBookedSeats = labels.slice(0, 2);
      const heldStart = rows > 1 ? seatsPerRow : 2;
      values.sampleHeldSeats = labels
        .slice(heldStart, heldStart + 2)
        .filter((label) => !values.sampleBookedSeats.includes(label));
      const duration = Math.max(60, Math.min(600, Number(process.env.SEAT_LOCK_SECONDS) || 300));
      values.sampleHeldUntil = new Date(Date.now() + duration * 1000);
    }
    res.status(201).json(await Show.create(values));
  }),
);
r.get(
  '/shows/:id/seats',
  asyncHandler(async (req, res) => {
    const show = await Show.findById(req.params.id).select(
      '+sampleBookedSeats +sampleHeldSeats +sampleHeldUntil',
    );
    if (!show) return res.status(404).json({ message: 'Show not found' });
    const now = new Date();
    const [bookings, locks] = await Promise.all([
      Booking.find({ show: show._id, status: 'confirmed' }),
      SeatLock.find({ show: show._id, expiresAt: { $gt: now } }),
    ]);
    const booked = new Set(bookings.flatMap((b) => b.seats));
    const locked = new Set(
      locks.filter((l) => String(l.user) !== String(req.user?._id)).map((l) => l.seatLabel),
    );
    const sampleBooked = new Set(show.sampleBookedSeats || []);
    const sampleHeld = new Set(show.sampleHeldUntil > now ? show.sampleHeldSeats || [] : []);
    const labels = show.seatLabels?.length
      ? show.seatLabels
      : Array.from({ length: show.rows }, (_, i) =>
          Array.from({ length: show.seatsPerRow }, (_, j) => String.fromCharCode(65 + i) + (j + 1)),
        ).flat();
    res.json({
      showId: show._id,
      price: show.price,
      seats: labels.map((label) => ({
        label,
        status:
          booked.has(label) || sampleBooked.has(label)
            ? 'booked'
            : locked.has(label) || sampleHeld.has(label)
              ? 'locked'
              : 'available',
      })),
    });
  }),
);
r.post(
  '/shows/:id/locks',
  protect,
  asyncHandler(async (req, res) => {
    const show = await Show.findById(req.params.id).select(
      '+sampleBookedSeats +sampleHeldSeats +sampleHeldUntil',
    );
    if (!show) return res.status(404).json({ message: 'Show not found' });
    const seats = [...new Set(req.body.seats || [])];
    if (!seats.length || seats.length > 10)
      return res.status(400).json({ message: 'Select between 1 and 10 seats' });
    const now = new Date();
    const sampleBooked = new Set(show.sampleBookedSeats || []);
    const sampleHeld = new Set(show.sampleHeldUntil > now ? show.sampleHeldSeats || [] : []);
    if (seats.some((seat) => sampleBooked.has(seat) || sampleHeld.has(seat)))
      return res.status(409).json({
        message: 'A sample seat is already booked or temporarily held. Please choose another seat.',
      });
    const bookings = await Booking.find({
      show: show._id,
      status: 'confirmed',
      seats: { $in: seats },
    });
    if (bookings.length)
      return res.status(409).json({ message: 'One or more seats have already been booked' });
    await SeatLock.deleteMany({ show: show._id, expiresAt: { $lte: now } });
    const duration = Math.max(60, Math.min(600, Number(process.env.SEAT_LOCK_SECONDS) || 300));
    const expiresAt = new Date(Date.now() + duration * 1000);
    const created = [];
    try {
      for (const seatLabel of seats) {
        const lock = await SeatLock.findOneAndUpdate(
          { show: show._id, seatLabel, expiresAt: { $gt: now }, user: req.user._id },
          { $set: { user: req.user._id, expiresAt }, $setOnInsert: { show: show._id, seatLabel } },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
        created.push(lock);
      }
    } catch (e) {
      await SeatLock.deleteMany({ _id: { $in: created.map((x) => x._id) }, user: req.user._id });
      return res
        .status(409)
        .json({ message: 'A selected seat is locked by another user. Please refresh seats.' });
    }
    req.app
      .get('io')
      ?.to('show:' + show._id)
      .emit('seats-updated', { showId: String(show._id) });
    res.status(201).json({ locks: created, expiresAt, seconds: duration });
  }),
);
r.delete(
  '/shows/:id/locks',
  protect,
  asyncHandler(async (req, res) => {
    const seats = [...new Set(req.body.seats || [])];
    await SeatLock.deleteMany({
      show: req.params.id,
      user: req.user._id,
      seatLabel: { $in: seats },
    });
    req.app
      .get('io')
      ?.to('show:' + req.params.id)
      .emit('seats-updated', { showId: String(req.params.id) });
    notifySeatsChanged(req, req.params.id);
    res.json({ message: 'Seat holds released' });
  }),
);
r.post(
  '/reviews',
  protect,
  asyncHandler(async (req, res) => {
    const { movieId, rating, comment } = req.body;
    const review = await Review.findOneAndUpdate(
      { user: req.user._id, movie: movieId },
      { $set: { rating, comment, isVisible: true } },
      { upsert: true, new: true, runValidators: true },
    );
    res.status(201).json(review);
  }),
);
r.get(
  '/watchlist',
  protect,
  asyncHandler(async (req, res) => {
    const u = await (
      await import('../models/index.js')
    ).User.findById(req.user._id).populate('watchlist');
    res.json(u.watchlist);
  }),
);
r.post(
  '/watchlist/:movieId',
  protect,
  asyncHandler(async (req, res) => {
    const { User } = await import('../models/index.js');
    const u = await User.findById(req.user._id);
    const id = req.params.movieId;
    const exists = u.watchlist.some((x) => String(x) === id);
    u.watchlist = exists ? u.watchlist.filter((x) => String(x) !== id) : [...u.watchlist, id];
    await u.save();
    res.json({ watchlist: u.watchlist, added: !exists });
  }),
);
export default r;
