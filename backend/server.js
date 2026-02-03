const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

// Import database configuration
const { testConnection } = require('./config/database');

// Import routes
const issuesRouter = require('./routes/issues');
const authRouter = require('./routes/auth');
const uploadRouter = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://smart-civic-issue-reporter.vercel.app', 'https://smart-civic-reporter.vercel.app', 'https://smart-civic-issue-reporter.vercel.app']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:4028', 'http://127.0.0.1:4028', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/issues', issuesRouter);
app.use('/api/auth', authRouter);
app.use('/api/upload', uploadRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart Civic Issue Reporter API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Smart Civic Issue Reporter API running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📋 API Base URL: http://localhost:${PORT}/api`);
  
  // Test database connection
  console.log('🔗 Testing Supabase database connection...');
  const isConnected = await testConnection();
  if (isConnected) {
    console.log('✅ Database ready for operations');
  } else {
    console.log('⚠️  Database setup required - check README for setup instructions');
  }
});