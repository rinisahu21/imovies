# IMovies MERN Booking App

A student/demo movie-booking app with sample catalogue and show schedules, registration/login, search and genre filtering, theatre/show comparison, temporary seat holds, booking history, QR tickets, admin catalogue tools, and optional Razorpay test Checkout integration.

**Important:** The seeded movies, theatres, showtimes, prices, and seat inventory are fictional demo data. TMDB provides movie metadata/posters, not real local theatre schedules or available seats. Razorpay test mode verifies the payment flow but does not charge real money. Do not use this app for real customer payments or real bookings until the production checklist below is completed.

## Requirements
- Node.js 20+ and npm
- MongoDB Atlas (recommended) or local MongoDB
- Optional Razorpay **test-mode** keys for test checkout

## Windows / VS Code quick start
1. Clone this repository and open the `imovies` folder in VS Code.
2. In `server`, copy `.env.example` to `.env`.
3. In `server/.env`, set `MONGODB_URI` to your MongoDB Atlas connection string and set `JWT_SECRET` to a long random secret. Keep this file private; never commit it or share screenshots with secrets visible.
4. Optional: add Razorpay **Test Mode** `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Never put the secret in client-side code.
6. In a terminal at the root `imovies` folder, run:
   ```bash
   npm run install:all
   npm run seed:demo --prefix server
   npm run dev
   ```
7. Open `http://localhost:5173`. Backend health check: `http://localhost:5000/api/health`.

The seed command explicitly loads `server/.env`, so it works even when you run it from the project root. It creates sample movies, sample theatres, and upcoming sample shows for demonstration. It can be rerun safely to update the sample movie/theatre records; existing future shows are not duplicated if future shows already exist.

## Environment variables
Copy `server/.env.example` to `server/.env` for local use. For deployment, set the same values in the hosting provider's environment-variable settings rather than uploading `.env`.

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: long random secret
- `CLIENT_URL`: deployed frontend origin (for example, your frontend hosting URL)
- `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`: optional Razorpay test keys
- `PORT`: supplied automatically by many hosts; defaults to 5000

## Razorpay test checkout
Use test keys from the Razorpay dashboard. The frontend requests an order from the backend, opens Razorpay Checkout, and the backend verifies the payment signature before creating a confirmed booking and QR ticket. Test mode does not charge real money. Documentation: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/

## Admin access
Register a normal user first. For local development, promote that user's `role` to `admin` in the MongoDB `users` collection. Do not expose admin creation in public registration. Before deployment, create a controlled admin provisioning procedure and enable strong account security.

## Deployment outline
1. Create a MongoDB Atlas database and allow network access only as required by your backend host.
2. Deploy `server` to a Node.js host (for example Render or Railway). Set its environment variables in the host dashboard, including `MONGODB_URI`, `JWT_SECRET`, and `CLIENT_URL`.
3. Deploy `client` as a static Vite site. Build command: `npm run build`; publish directory: `dist`. Set `VITE_API_URL` to the deployed backend API base URL ending in `/api` (for example `https://your-api-host.example/api`) **before building**.
4. Configure backend CORS `CLIENT_URL` to the exact deployed frontend origin.
5. Verify the deployed backend `/api/health`, then test registration, login, show listing, seat holds, payment in Razorpay test mode, QR ticket, and booking history.
6. Keep `.env` out of Git and never expose `RAZORPAY_KEY_SECRET` or `JWT_SECRET` to the frontend.

## Production readiness checklist
This is not production-ready for real-world ticket sales. Before real customers or live payments, implement and test atomic seat claims/transactions, payment webhooks and reconciliation, refund API integration, real theatre/showtime inventory from an authorized provider, stronger admin provisioning, HTTPS, logging/monitoring, backup/restore, privacy and data-retention policies, and end-to-end tests with concurrent users. Cancellation currently updates local booking status only; it does not issue a real Razorpay refund.

## Scripts
- Root: `npm run install:all`, `npm run dev`
- Server: `npm run dev --prefix server`, `npm run seed:demo --prefix server`
- Client: `npm run build --prefix client`

## Demo sample ticket (no Razorpay keys needed)

On the seat selection page, choose **Create demo sample ticket** to create a clearly labeled sample booking and QR code without contacting Razorpay or charging money. The API still requires a signed-in user, a future show, and an active seat hold. Demo tickets occupy those seats in the local sample database and are marked demo_no_payment; they are **not valid for cinema entry**. Use **Continue to test payment** only for the separate Razorpay test-mode flow. The demo booking option is for presentations and local development, not production sales.

