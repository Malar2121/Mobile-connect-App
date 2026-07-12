require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const { initSocket } = require('./socket/socketServer');
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

// ─── App setup ────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const isDevelopment = process.env.NODE_ENV === 'development';
const productionOrigin = 'https://mobile-connect-app-production.up.railway.app';
const configuredClientOrigin = process.env.CLIENT_URL;
const allowedOrigins = isDevelopment
  ? [configuredClientOrigin, productionOrigin, 'http://localhost:3000', 'http://127.0.0.1:3000'].filter(Boolean)
  : [configuredClientOrigin, productionOrigin].filter(Boolean);

const corsOrigin = (origin, callback) => {
  // Allow non-browser clients (no Origin header) and same-origin requests.
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
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
connectDB();
initFirebase();

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
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many login attempts, please try again in 15 minutes.' },
});

app.use('/api/', limiter);
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

// ─── 404 & Error Handlers ─────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Family Connect API running on port ${PORT} [${process.env.NODE_ENV}]`);
  logger.info(`🔌 Socket.io server ready`);
  logger.info(`📡 Health: http://localhost:${PORT}/health`);
});

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
