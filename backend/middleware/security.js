/**
 * Security Middleware
 * Handles security headers, rate limiting, and security best practices
 */

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

/**
 * Security headers middleware
 */
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:5000", "http://127.0.0.1:5000"],
      connectSrc: ["'self'", "https:", "http://localhost:5000", "http://127.0.0.1:5000"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * General API rate limiter
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Rate limit exceeded',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * Strict rate limiter for auth endpoints
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs for auth
  message: {
    success: false,
    error: 'Authentication rate limit exceeded',
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: '15 minutes'
  },
  skipSuccessfulRequests: true,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Authentication rate limit exceeded',
      message: 'Too many authentication attempts from this IP, please try again later.',
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
    });
  }
});

/**
 * Issue creation rate limiter
 */
const issueCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 issue creations per hour
  message: {
    success: false,
    error: 'Issue creation rate limit exceeded',
    message: 'Too many issues created from this IP, please try again later.',
    retryAfter: '1 hour'
  },
  keyGenerator: (req) => {
    // Use IP + email for better tracking
    return `${req.ip}-${req.body?.citizenEmail || 'anonymous'}`;
  }
});

/**
 * Spam detection middleware
 */
const spamDetection = (req, res, next) => {
  try {
    const { description = '', citizenName = '', citizenEmail = '' } = req.body;
    
    // Basic spam indicators
    const spamIndicators = [
      // Suspicious patterns
      /(.)\1{10,}/, // Repeated characters
      /https?:\/\//gi, // URLs in description
      /\b(click|buy|sale|offer|deal|money|cash|prize|winner|congratulations)\b/gi,
      /\b(viagra|cialis|pharmacy|casino|poker|lottery)\b/gi,
      
      // Common spam phrases
      /\b(act now|limited time|urgent|immediate|guaranteed|risk-free)\b/gi,
      /\b(make money|work from home|earn \$|get paid)\b/gi
    ];
    
    // Check description for spam patterns
    let spamScore = spamIndicators.reduce((score, pattern) => {
      return score + (pattern.test(description) ? 1 : 0);
    }, 0);
    
    // Additional checks
    if (description.toUpperCase() === description && description.length > 50) {
      spamScore += 1; // All caps
    }
    
    if (citizenName && citizenName.includes('@')) {
      spamScore += 1; // Email in name field
    }
    
    if (description.length > 0 && [...new Set(description.toLowerCase())].length < 10) {
      spamScore += 1; // Low character diversity
    }
    
    // If spam score is too high, reject
    if (spamScore >= 3) {
      return res.status(400).json({
        success: false,
        error: 'Content validation failed',
        message: 'The submitted content appears to be spam or inappropriate. Please provide a genuine issue description.'
      });
    }
    
    // Add spam score to request for logging
    req.spamScore = spamScore;
    next();
  } catch (error) {
    console.error('Spam detection error:', error);
    next(); // Continue on error, don't block legitimate requests
  }
};

/**
 * Input sanitization middleware
 */
const sanitizeInput = (req, res, next) => {
  try {
    // Recursively sanitize object
    const sanitizeObject = (obj) => {
      if (typeof obj !== 'object' || obj === null || obj === undefined) {
        if (typeof obj === 'string') {
          // Basic XSS prevention
          return obj
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
            .replace(/javascript:/gi, '') // Remove javascript: protocol
            .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
            .trim();
        }
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitizeObject);
      }
      
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    };
    
    // Sanitize request body
    if (req.body) {
      req.body = sanitizeObject(req.body);
    }
    
    // Sanitize query parameters
    if (req.query) {
      req.query = sanitizeObject(req.query);
    }
    
    next();
  } catch (error) {
    console.error('Sanitization error:', error);
    next(); // Continue on error
  }
};

/**
 * Request logging middleware
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;
    
    // Log request details (excluding sensitive data)
    const logData = {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    };
    
    if (process.env.NODE_ENV !== 'production') {
      // Don't log passwords or sensitive auth data
      if (req.body && !req.url.includes('/login') && !req.url.includes('/register') && !req.url.includes('/password')) {
        logData.body = req.body;
      }
      console.log('API Request:', JSON.stringify(logData));
    }
    
    // Call original json method
    return originalJson.call(this, body);
  };
  
  next();
};

/**
 * Error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Default error
  let error = {
    success: false,
    error: 'Internal server error',
    message: 'Something went wrong on our end'
  };
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = {
      success: false,
      error: 'Validation error',
      message: err.message,
      details: err.details
    };
    return res.status(400).json(error);
  }
  
  if (err.name === 'UnauthorizedError') {
    error = {
      success: false,
      error: 'Authentication failed',
      message: 'Invalid token or credentials'
    };
    return res.status(401).json(error);
  }
  
  if (err.name === 'MulterError') {
    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      error = {
        success: false,
        error: 'File too large',
        message: 'File size exceeds maximum allowed size'
      };
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error = {
        success: false,
        error: 'Too many files',
        message: 'Maximum number of files exceeded'
      };
    } else {
      error = {
        success: false,
        error: 'File upload error',
        message: err.message
      };
    }
    return res.status(400).json(error);
  }
  
  // Database errors
  if (err.code && err.code.startsWith('23')) {
    error = {
      success: false,
      error: 'Database constraint violation',
      message: 'The data violates database constraints'
    };
    return res.status(400).json(error);
  }
  
  // Rate limit errors
  if (err.status === 429) {
    error = {
      success: false,
      error: 'Rate limit exceeded',
      message: 'Too many requests, please slow down'
    };
    return res.status(429).json(error);
  }
  
  // In development, include stack trace
  if (process.env.NODE_ENV === 'development') {
    error.stack = err.stack;
  }
  
  res.status(500).json(error);
};

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/login',
      'GET /api/issues',
      'POST /api/issues',
      'GET /api/issues/:id',
      'PUT /api/issues/:id',
      'DELETE /api/issues/:id',
      'POST /api/upload'
    ]
  });
};

/**
 * CORS security middleware for production
 */
const corsSecurityCheck = (req, res, next) => {
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  
  // In production, be stricter about origins
  if (process.env.NODE_ENV === 'production') {
    const allowedDomains = [
      'smart-civic-issue-reporter.vercel.app',
      'smart-civic-reporter.vercel.app'
    ];
    
    if (origin && !allowedDomains.some(domain => origin.includes(domain))) {
      console.warn(`Suspicious origin detected: ${origin}`);
      // Log but don't block - CORS middleware will handle this
    }
  }
  
  next();
};

/**
 * API versioning middleware
 */
const apiVersioning = (req, res, next) => {
  // Set API version in response headers
  res.set('API-Version', '1.0.0');
  
  // Check if client requests specific version
  const requestedVersion = req.get('API-Version');
  if (requestedVersion && requestedVersion !== '1.0.0') {
    return res.status(400).json({
      success: false,
      error: 'Unsupported API version',
      message: `API version ${requestedVersion} is not supported. Current version is 1.0.0`,
      supportedVersions: ['1.0.0']
    });
  }
  
  next();
};

module.exports = {
  securityHeaders,
  generalLimiter,
  authLimiter,
  issueCreationLimiter,
  spamDetection,
  sanitizeInput,
  requestLogger,
  errorHandler,
  notFoundHandler,
  corsSecurityCheck,
  apiVersioning
};