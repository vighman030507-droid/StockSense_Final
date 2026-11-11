const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { pool, closePool } = require('./config/database');
const authRoutes = require('./routes/authRoutes');
const componentRoutes = require('./routes/componentRoutes');
const pcbRoutes = require('./routes/pcbRoutes');
const productionRoutes = require('./routes/productionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const excelRoutes = require('./routes/excelRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

/* ---------------- PROXY & SECURITY ---------------- */

// Trust reverse proxy (e.g. Render, Vercel) for accurate client IP in rate limiting
app.set('trust proxy', 1);

// Security Headers with Helmet (configured for API compatibility)
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: false,
  })
);

/* ---------------- RATE LIMITING ---------------- */

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});

// Stricter rate limiter for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again after 15 minutes.',
  },
});

// Rate limiter for file uploads
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Upload limit reached, please try again later.',
  },
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/excel/import', uploadLimiter);

/* ---------------- CORS CONFIGURATION ---------------- */

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://stock-sense-final.vercel.app',
];

const vercelPreviewRegex = /^https:\/\/stock-sense-.*\.vercel\.app$/;

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || vercelPreviewRegex.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

/* ---------------- BODY PARSERS & LOGGING ---------------- */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

/* ---------------- HEALTH CHECK ---------------- */

app.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime(),
      version: '1.2.0',
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

/* ---------------- API ROUTES ---------------- */

app.use('/api/auth', authRoutes);
app.use('/api/components', componentRoutes);
app.use('/api/pcbs', pcbRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/excel', excelRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'StockSense — PCB Inventory & Production Automation System API',
    version: '1.2.0',
    status: 'online',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      components: '/api/components',
      pcbs: '/api/pcbs',
      production: '/api/production',
      analytics: '/api/analytics',
      excel: '/api/excel',
    },
    documentation: 'See README.md for complete API documentation',
  });
});

/* ---------------- ERROR HANDLING ---------------- */

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

/* ---------------- SERVER START & SHUTDOWN ---------------- */

const server = app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log('StockSense — PCB Inventory Automation System');
  console.log('='.repeat(50));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📊 Database: ${process.env.DB_NAME || 'pcb_inventory'}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log('='.repeat(50));
});

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('\n⚠️  Shutting down gracefully...');

  server.close(async () => {
    console.log('✓ HTTP server closed');

    try {
      await closePool();
      console.log('✓ All database connections closed');
      process.exit(0);
    } catch (error) {
      console.error('✗ Error during shutdown:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('⚠️  Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = app;
