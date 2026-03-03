const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { connectDB } = require('./config/db');
// ensure models and associations are registered
require('./model');

// migration to fix old payment table schemas
const { migratePaymentTables } = require('./scripts/migratePaymentTables');

// payment tables and scheduler (legacy raw queries)
const { paymentModel } = require('./model/paymentModel');

// application startup order:
// 1. load environment
// 2. connect to database
// 3. run migration/drops
// 4. initialize payment table(s)
// 5. start scheduler

const { startPaymentScheduler } = require('./service/paymentScheduler');
const { initializeParticipantIds } = require('./service/participantIdService');

dotenv.config();

// begin database connection and continue setup once ready
connectDB().then(() => {
  initializeParticipantIds().catch((err) => {
    console.error("Participant ID initialization failed:", err.message);
  });
  migratePaymentTables(() => {
    // create new simplified payments table
    paymentModel.initializeTable();
    // scheduler may query this table, so start only after init
    startPaymentScheduler();
  });
});

// --- IMPORT ROUTES ---
const regRoutes = require("./routes/regRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");   // Login/Signup
const adminRoutes = require("./routes/adminRoutes"); // Admin Dashboard
const trackRoutes = require("./routes/trackRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
app.use(cors());
app.use(express.json({ limit: '200mb' })); 
app.use(express.urlencoded({ limit: '200mb', extended: true }));
app.use(helmet());

const limiter = rateLimit({
    windowMs: 2 * 60 * 1000, 
    max: 100, 
    message: "Too many requests from the same IP, please try again after 3 minutes.",
});
app.use(limiter); 

// stricter limiter for write endpoints (protect against bursts)
const strictPostLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // max 20 requests per minute per IP
  message: 'Too many requests - slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

app.get("/conference/hello", async(req, res) => {
    res.json("WELCOME TO NEC CONFERENCE");
});

// --- MOUNT ROUTES (This fixes the 404s) ---
// apply stricter limiter to registration and payment routes to protect write paths
app.use("/conference/registration", strictPostLimiter, regRoutes);
app.use("/conference/user", userRoutes);
app.use("/conference/auth", authRoutes);       // Fixes Login 404
app.use("/conference/api/admin", adminRoutes); // Fixes Admin Dashboard 404
app.use("/conference/track", trackRoutes); // Tracks user actions and notifications
app.use("/conference/payment", strictPostLimiter, paymentRoutes); // Razorpay payment endpoints

const PORT = 5200;
// generic error handler (last middleware)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(err?.status || 500).json({ error: err?.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
