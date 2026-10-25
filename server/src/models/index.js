import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    watchlist: [{ type: Schema.Types.ObjectId, ref: 'Movie' }],
  },
  { timestamps: true },
);
const movieSchema = new Schema(
  {
    title: { type: String, required: true, index: true },
    description: String,
    posterUrl: String,
    genre: [String],
    language: [String],
    durationMinutes: Number,
    releaseDate: Date,
    director: { type: String, trim: true, default: '' },
    country: { type: String, trim: true, default: '' },
    cast: [{ type: String, trim: true }],
    certification: { type: String, trim: true, default: '' },
    trailerUrl: { type: String, trim: true, default: '' },
    rating: { type: Number, min: 0, max: 10, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const theatreSchema = new Schema(
  {
    name: { type: String, required: true },
    city: { type: String, required: true, index: true },
    address: String,
    amenities: [String],
  },
  { timestamps: true },
);
const showSchema = new Schema(
  {
    movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true, index: true },
    theatre: { type: Schema.Types.ObjectId, ref: 'Theatre', required: true, index: true },
    screen: String,
    startTime: { type: Date, required: true, index: true },
    endTime: Date,
    price: { type: Number, required: true, min: 0 },
    rows: { type: Number, default: 6 },
    seatsPerRow: { type: Number, default: 10 },
    seatLabels: [String],
    sampleBookedSeats: { type: [String], default: [], select: false },
    sampleHeldSeats: { type: [String], default: [], select: false },
    sampleHeldUntil: { type: Date, select: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);
const lockSchema = new Schema(
  {
    show: { type: Schema.Types.ObjectId, ref: 'Show', required: true, index: true },
    seatLabel: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
lockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
// This index prevents two live lock documents for the same show/seat. Expired documents are also checked in application logic.
lockSchema.index({ show: 1, seatLabel: 1 }, { unique: true });
const bookingSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    show: { type: Schema.Types.ObjectId, ref: 'Show', required: true },
    seats: [String],
    amount: { type: Number, required: true },
    status: { type: String, enum: ['confirmed', 'cancelled', 'pending'], default: 'confirmed' },
    paymentStatus: {
      type: String,
      enum: ['mock_paid', 'paid_test', 'demo_no_payment', 'pending', 'refunded', 'failed'],
      default: 'paid_test',
    },
    ticketCode: { type: String, required: true, unique: true },
    cancelledAt: Date,
  },
  { timestamps: true },
);
const reviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    movie: { type: Schema.Types.ObjectId, ref: 'Movie', required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String, maxlength: 1000 },
    isVisible: { type: Boolean, default: true },
  },
  { timestamps: true },
);
export const User = model('User', userSchema);
export const Movie = model('Movie', movieSchema);
export const Theatre = model('Theatre', theatreSchema);
export const Show = model('Show', showSchema);
export const SeatLock = model('SeatLock', lockSchema);
export const Booking = model('Booking', bookingSchema);
export const Review = model('Review', reviewSchema);
