const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
require('dotenv').config();

// Import database configuration
const { testConnection } = require('./config/database');

// Import routes
const issuesRouter = require('./routes/issues');
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');
const departmentRouter = require('./routes/departments');
const adminRouter = require('./routes/admin');

// Import middleware
const { attachIP } = require('./middleware/auth');
const { 
  securityHeaders, 
  generalLimiter, 
  authLimiter,
  sanitizeInput,
  requestLogger,
  errorHandler,
  notFoundHandler,
  corsSecurityCheck,
  apiVersioning
} = require('./middleware/security');

// Import services for background tasks
const DepartmentService = require('./services/DepartmentService');
const NotificationService = require('./services/NotificationService');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(securityHeaders);

// Normalize URLs - collapse double slashes (e.g. //api/issues -> /api/issues)
app.use((req, res, next) => {
  if (req.url.includes('//')) {
    req.url = req.url.replace(/\/\/+/g, '/');
  }
  next();
});

// CORS configuration with security checks
const corsOptions = {
  origin: function (origin, callback) {
    // In production, allow specific domains and all Vercel preview deployments
    if (process.env.NODE_ENV === 'production') {
      const allowedDomains = [
        'https://smart-civic-issue-reporter.vercel.app',
        'https://smart-civic-reporter.vercel.app',
        'https://smart-civic-issue-r-git-5ca3dd-dkdeepk723-protonmailcs-projects.vercel.app'
      ];
      
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Check exact matches first
      if (allowedDomains.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow all Vercel preview deployments
      if (origin.includes('.vercel.app') && 
          (origin.includes('smart-civic-issue-r') || 
           origin.includes('smart-civic-reporter') || 
           origin.includes('smart-civic-issue-reporter'))) {
        return callback(null, true);
      }
      
      if (process.env.NODE_ENV !== 'production') {
        console.log('CORS blocked origin:', origin);
      }
      return callback(new Error('Not allowed by CORS'));
    } else {
      // Development - allow all localhost origins
      const devOrigins = [
        'http://localhost:3000', 'http://127.0.0.1:3000', 
        'http://localhost:4028', 'http://127.0.0.1:4028', 
        'http://localhost:5173', 'http://127.0.0.1:5173'
      ];
      
      if (!origin || devOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'API-Version']
};

// Apply middleware in correct order
app.use(corsSecurityCheck);
app.use(cors(corsOptions));
app.use(apiVersioning);
app.use(attachIP);
app.use(requestLogger);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);

// Apply general rate limiting
app.use('/api/', generalLimiter);

// Serve uploaded files statically (before security middleware blocks cross-origin)
app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(path.join(__dirname, 'uploads')));

// Apply AuthLimiter to auth routes
app.use('/api/auth', authLimiter);

// API Routes
app.use('/api/issues', issuesRouter);
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/departments', departmentRouter);
app.use('/api/admin', adminRouter);

// Health check endpoint with detailed information
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart Civic Issue Reporter API is running',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: [
      'Role-based authentication',
      'Department routing',
      'AI classification',
      'Real-time notifications',
      'Audit logging',
      'SLA management'
    ],
    timestamp: new Date().toISOString()
  });
});

// System status endpoint for monitoring
app.get('/api/status', async (req, res) => {
  try {
    const dbStatus = await testConnection();
    res.json({
      database: dbStatus ? 'connected' : 'disconnected',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Status check failed',
      message: error.message
    });
  }
});

// Background tasks setup
const setupBackgroundTasks = () => {
  // Check for SLA violations every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🔍 Running SLA violation check...');
      const result = await DepartmentService.checkSLAViolations();
      console.log(`📊 SLA Check Complete: ${result.total_overdue} overdue, ${result.escalated} escalated`);
    } catch (error) {
      console.error('❌ SLA check failed:', error);
    }
  });

  // Retry failed notifications every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    try {
      console.log('📧 Retrying failed notifications...');
      const result = await NotificationService.retryFailedNotifications();
      console.log(`📊 Notification Retry Complete: ${result.retried} notifications retried`);
    } catch (error) {
      console.error('❌ Notification retry failed:', error);
    }
  });

  // Cleanup old audit logs weekly (keep last 90 days)
  cron.schedule('0 2 * * SUN', async () => {
    try {
      console.log('🧹 Cleaning old audit logs...');
      const AuditService = require('./services/AuditService');
      const result = await AuditService.cleanOldLogs(90);
      console.log(`📊 Audit Cleanup Complete: ${result.deletedCount} old records removed`);
    } catch (error) {
      console.error('❌ Audit cleanup failed:', error);
    }
  });

  console.log('⏰ Background tasks scheduled successfully');
};

// Error handling middleware (must be after routes)
app.use(errorHandler);

// 404 handler (must be last)
app.use('*', notFoundHandler);

app.listen(PORT, async () => {
  try {
    console.log(`🚀 Smart Civic Issue Reporter API v2.0 running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📋 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🛡️  Security: Helmet, rate limiting, input validation enabled`);
    console.log(`📊 Features: Role-based auth, department routing, AI classification`);
    
    // Test database connection
    console.log('🔗 Testing Supabase database connection...');
    const isConnected = await testConnection();
    if (isConnected) {
      console.log('✅ Database ready for operations');
      
      // Setup background tasks only if database is connected
      setupBackgroundTasks();
      
      // Initialize notification system
      try {
        console.log('📧 Notification system initialized');
      } catch (error) {
        console.log('⚠️  Notification system setup warning:', error.message);
      }
      
    } else {
      console.log('⚠️  Database setup required - check README for setup instructions');
      console.log('🔧 Some features may not work without database connection');
    }
    
    console.log('🎯 API is ready to handle requests!');
    console.log('=' .repeat(60));
  } catch (err) {
    console.error('❌ Startup error:', err);
  }
});