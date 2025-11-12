// server.js - Main backend server for ATLAS
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

// Import routes
const patientsRouter = require('./routes/patients');
const consultationsRouter = require('./routes/consultations');
const referenceRouter = require('./routes/reference');
const performanceRouter = require('./routes/performance');
const { router: authRouter } = require('./routes/auth');

// Import database initialization
const { initializeDatabase } = require('./database/init');

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://your-atlas-app.com'
    : ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Sync-Priority', 'X-Device-Id', 'X-Timestamp', 'X-Last-Sync']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000, // limit each IP
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Body parsing and compression
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    api: 'ATLAS Backend API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      patients: '/patients',
      consultations: '/consultation',
      reference: '/reference',
      performance: '/performance_metrics',
      auth: '/auth'
    }
  });
});

// API routes
app.use('/auth', authRouter);
app.use('/patients', patientsRouter);
app.use('/consultation', consultationsRouter);
app.use('/reference', referenceRouter);
app.use('/performance_metrics', performanceRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details || err.message
    });
  }

  if (err.code === 'SQLITE_CONSTRAINT') {
    return res.status(409).json({
      error: 'Database Constraint Error',
      message: 'A record with this information already exists'
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing authentication'
    });
  }

  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: "Route ${req.originalUrl} not found",
    availableRoutes: [
      'GET /health',
      'GET /api/status',
      'POST /auth/login',
      'GET /patients',
      'POST /patients',
      'GET /consultation',
      'POST /consultation',
      'GET /reference/:type'
    ]
  });
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔧 Initializing database...');
    await initializeDatabase();
    console.log(' Database initialized successfully');

    app.listen(PORT, () => {
      console.log(`);
      console.log('🚀 ATLAS Backend API Server running!');
      console.log(' Port: ' + PORT);
      console.log(' Environment: ' + (process.env.NODE_ENV || 'development'));
      console.log(' Health Check: http://localhost:' + PORT + '/health');
      console.log('📋 API Status: http://localhost:' + PORT + '/api/status');
      console.log(' Started at: ' + new Date().toISOString());
      console.log(`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log(' SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log(' SIGINT received, shutting down gracefully');
  process.exit(0);
});

if (require.main === module) {
  startServer();
}

module.exports = app;
