/**
 * Authentication Middleware
 * Handles JWT verification and user authentication
 */

const jwt = require('jsonwebtoken');
const AuthService = require('../services/AuthService');

/**
 * Verify JWT token and attach user to request
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access denied',
        message: 'No token provided'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = AuthService.verifyToken(token);
    } catch (tokenError) {
      return res.status(403).json({
        success: false,
        error: 'Invalid token',
        message: tokenError.message
      });
    }
    
    // Get full user data
    let user;
    try {
      user = await AuthService.getUserById(decoded.id);
    } catch (userError) {
      return res.status(403).json({
        success: false,
        error: 'User lookup failed',
        message: userError.message
      });
    }
    
    // Attach user to request
    req.user = user;
    req.token = token;
    
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      error: 'Invalid token',
      message: error.message
    });
  }
};

/**
 * Optional authentication - continues even without token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = AuthService.verifyToken(token);
        const user = await AuthService.getUserById(decoded.id);
        req.user = user;
        req.token = token;
      } catch (error) {
        // Invalid token, but continue without user
      }
    }

    next();
  } catch (error) {
    // Even if there's an error, continue without authentication
    next();
  }
};

/**
 * Role-based authorization middleware
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Please login to access this resource'
      });
    }

    const hasPermission = AuthService.hasPermission(req.user.role, requiredRole);
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: `This action requires ${requiredRole} role or higher`
      });
    }

    next();
  };
};

/**
 * Require specific role exactly (not hierarchical)
 */
const requireExactRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: `This action requires ${role} role`
      });
    }

    next();
  };
};

/**
 * Allow multiple specific roles
 */
const requireAnyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: `This action requires one of these roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Department-based authorization
 */
const requireDepartmentAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }

  // Super admin and admin can access any department
  if (['super_admin', 'admin'].includes(req.user.role)) {
    return next();
  }

  // Authority users can only access their own department
  const issueDepId = req.params.departmentId || req.body.departmentId;
  
  if (issueDepId && req.user.department_id && 
      parseInt(issueDepId) !== parseInt(req.user.department_id)) {
    return res.status(403).json({
      success: false,
      error: 'Department access denied',
      message: 'You can only access issues from your own department'
    });
  }

  next();
};

/**
 * Resource ownership check
 */
const requireOwnership = (resourceGetter) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      // Super admin can access anything
      if (req.user.role === 'super_admin') {
        return next();
      }

      const resource = await resourceGetter(req);
      
      if (!resource) {
        return res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
      }

      // Check ownership based on user role
      let hasAccess = false;

      switch (req.user.role) {
        case 'admin':
          hasAccess = true; // Admin can access all resources
          break;
        case 'authority':
          // Authority can access resources in their department
          hasAccess = resource.assigned_department_id === req.user.department_id;
          break;
        case 'citizen':
          // Citizens can only access their own issues
          hasAccess = resource.citizen_email === req.user.email;
          break;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to access this resource'
        });
      }

      req.resource = resource;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: 'Authorization check failed',
        message: error.message
      });
    }
  };
};

/**
 * Get client IP address
 */
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.ip ||
    req.socket?.remoteAddress ||
    'unknown';
};

/**
 * Attach IP address to request for audit logging
 */
const attachIP = (req, res, next) => {
  req.clientIP = getClientIP(req);
  next();
};

/**
 * Rate limiting by user
 */
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requestCounts = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id || req.clientIP || 'anonymous';
    const now = Date.now();
    
    // Clean old entries
    for (const [key, data] of requestCounts.entries()) {
      if (now - data.resetTime > windowMs) {
        requestCounts.delete(key);
      }
    }
    
    const userRequests = requestCounts.get(userId) || {
      count: 0,
      resetTime: now
    };
    
    if (now - userRequests.resetTime > windowMs) {
      userRequests.count = 0;
      userRequests.resetTime = now;
    }
    
    userRequests.count++;
    requestCounts.set(userId, userRequests);
    
    if (userRequests.count > maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit is ${maxRequests} per ${windowMs / 1000} seconds`,
        retryAfter: Math.ceil((windowMs - (now - userRequests.resetTime)) / 1000)
      });
    }
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': Math.max(0, maxRequests - userRequests.count),
      'X-RateLimit-Reset': new Date(userRequests.resetTime + windowMs)
    });
    
    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireExactRole,
  requireAnyRole,
  requireDepartmentAccess,
  requireOwnership,
  attachIP,
  userRateLimit,
  getClientIP
};