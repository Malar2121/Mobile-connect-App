require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const { initSocket } = require('./socket/socketServer');
const { startReminderScheduler } = require('./services/reminderScheduler');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// ─── Route imports ─────────────────────────────────────────────────────────
const authRoutes = require('./routes/authRoutes');
const familyRoutes = require('./routes/familyRoutes');
const eventRoutes = require('./routes/eventRoutes');
const pollRoutes = require('./routes/pollRoutes');
const memoryRoutes = require('./routes/memoryRoutes');
const albumRoutes = require('./routes/albumRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const familyTreeRoutes = require('./routes/familyTreeRoutes');
const locationRoutes = require('./routes/locationRoutes');
const legacyRoutes = require('./routes/legacyRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const safeZoneRoutes = require('./routes/safeZoneRoutes');
const celebrationRoutes = require('./routes/celebrationRoutes');
const consentRoutes = require('./routes/consentRoutes');
const storyRoutes = require('./routes/storyRoutes');

// ─── App setup ────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const isDevelopment = process.env.NODE_ENV === 'development';
const productionOrigin = 'https://mobile-connect-app-production.up.railway.app';
const configuredClientOrigin = process.env.CLIENT_URL;
const allowedOrigins = isDevelopment
  ? [configuredClientOrigin, productionOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'].filter(Boolean)
  : [configuredClientOrigin, productionOrigin].filter(Boolean);

// Development only: phones and emulators reach the API over the local network, and
// React Native's WebSocket sends that address (e.g. http://192.168.1.5:5000) as Origin.
const isLocalNetworkOrigin = (origin) => {
  try {
    const { protocol, hostname } = new URL(origin);
    if (protocol !== 'http:') return false;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  } catch {
    return false;
  }
};

const corsOrigin = (origin, callback) => {
  // Allow non-browser clients (no Origin header) and same-origin requests.
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  if (isDevelopment && isLocalNetworkOrigin(origin)) return callback(null, true);
  return callback(new Error('Not allowed by CORS'));
};

// ─── Socket.io ───────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

initSocket(io);
app.set('io', io); // Allow routes to access the io instance via req.app.get('io')

// ─── External Services ────────────────────────────────────────────────────
// Under test the suite owns the database connection and drives the reminder
// sweep itself, so these are skipped rather than starting a second connection
// and a background cron alongside the tests.
const isTest = process.env.NODE_ENV === 'test';
if (!isTest) {
  connectDB();
  initFirebase();
  startReminderScheduler();
}

// ─── Security Middleware ──────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────
// Requests are counted per signed-in member where possible, so family members
// sharing one Wi-Fi network do not use up each other's allowance. Requests
// without a valid token fall back to the client IP address.
function rateLimitKey(req) {
  const header = req.headers.authorization || '';
  if (header.startsWith('Bearer ')) {
    try {
      const { id } = jwt.verify(header.slice(7), process.env.JWT_SECRET);
      if (id) return `user:${id}`;
    } catch {
      // invalid or expired token — count against the IP address instead
    }
  }
  return req.ip;
}

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const rateLimitWindowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const rateLimitResponse = {
  success: false,
  code: 'RATE_LIMITED',
  message: 'Too many requests, please try again later.',
};

// Every screen makes several reads when it opens, so reads get a generous
// allowance of their own and never use up the budget for changes.
const readLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: parseInt(process.env.READ_RATE_LIMIT_MAX) || 2000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKey,
  skip: (req) => !SAFE_METHODS.has(req.method),
  message: rateLimitResponse,
});

const writeLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: rateLimitKey,
  skip: (req) => SAFE_METHODS.has(req.method),
  message: rateLimitResponse,
});

// Deliberately stricter than the general limiter. Configurable the same way,
// so an automated test run can raise it without the default being weakened —
// omit the env vars and it stays at 20 attempts per 15 minutes.
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 20,
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many login attempts, please try again in 15 minutes.' },
});

app.use('/api/', readLimiter, writeLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── HTTP Logging ─────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
}

// ─── Health Check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Family Connect API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/family', familyRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/polls', pollRoutes);
app.use('/api/memories', memoryRoutes);
app.use('/api/albums', albumRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/family-tree', familyTreeRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/legacy', legacyRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/safezones', safeZoneRoutes);
app.use('/api/celebrations', celebrationRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/stories', storyRoutes);

// ─── 404 & Error Handlers ─────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
// Supertest binds its own ephemeral port, so listening here would only occupy
// port 5000 and leave a handle open that keeps Jest from exiting.
if (!isTest) {
  server.listen(PORT, () => {
    logger.info(`🚀 Family Connect API running on port ${PORT} [${process.env.NODE_ENV}]`);
    logger.info(`🔌 Socket.io server ready`);
    logger.info(`📡 Health: http://localhost:${PORT}/health`);
  });
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason}`);
});

module.exports = { app, server };
