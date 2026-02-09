/**
 * Validation Middleware
 * Handles input validation using Joi
 */

const Joi = require('joi');

/**
 * Generic validation middleware
 */
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      // Only log non-sensitive routes in development
      if (process.env.NODE_ENV !== 'production') {
        const isSensitiveRoute = req.url.includes('/login') || req.url.includes('/register') || req.url.includes('/password');
        if (!isSensitiveRoute) {
          console.error('[VALIDATE] Validation failed:', JSON.stringify(errors));
        } else {
          console.error('[VALIDATE] Validation failed on sensitive route:', errors.map(e => e.field).join(', '));
        }
      }

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: errors.map(e => e.message).join('; ') || 'Please check your input data',
        details: errors
      });
    }

    // Replace request data with validated/sanitized data
    req[property] = value;
    next();
  };
};

/**
 * Issue validation schemas
 */
const issueSchemas = {
  create: Joi.object({
    citizenName: Joi.string().min(2).max(255).required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 255 characters',
        'any.required': 'Citizen name is required'
      }),
    
    citizenEmail: Joi.string().email().max(255).required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    citizenPhone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional()
      .messages({
        'string.pattern.base': 'Please provide a valid phone number'
      }),
    
    category: Joi.string().valid(
      'pothole', 'garbage', 'streetlight', 'graffiti', 
      'water', 'traffic', 'sidewalk', 'other'
    ).required()
      .messages({
        'any.only': 'Category must be one of: pothole, garbage, streetlight, graffiti, water, traffic, sidewalk, other',
        'any.required': 'Category is required'
      }),
    
    subcategory: Joi.string().max(100).optional(),
    
    description: Joi.string().min(10).max(2000).required()
      .messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 2000 characters',
        'any.required': 'Description is required'
      }),
    
    location: Joi.object({
      lat: Joi.number().min(-90).max(90).default(0)
        .messages({
          'number.min': 'Latitude must be between -90 and 90',
          'number.max': 'Latitude must be between -90 and 90'
        }),
      
      lng: Joi.number().min(-180).max(180).default(0)
        .messages({
          'number.min': 'Longitude must be between -180 and 180',
          'number.max': 'Longitude must be between -180 and 180'
        }),
      
      address: Joi.string().min(3).max(500).required()
        .messages({
          'string.min': 'Address must be at least 3 characters long',
          'string.max': 'Address cannot exceed 500 characters',
          'any.required': 'Address is required'
        }),
      
      ward: Joi.string().max(100).optional(),
      area: Joi.string().max(100).optional()
    }).required()
      .messages({
        'any.required': 'Location information is required'
      }),
    
    images: Joi.array().items(Joi.string()).max(10).optional()
      .messages({
        'array.max': 'Maximum 10 images allowed'
      })
  }),

  update: Joi.object({
    status: Joi.string().valid(
      'submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'
    ).optional(),
    
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    
    severityLevel: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    
    assignedDepartmentId: Joi.number().integer().positive().optional(),
    
    assignedToUserId: Joi.number().integer().positive().optional(),
    
    resolutionNotes: Joi.string().max(2000).optional()
      .messages({
        'string.max': 'Resolution notes cannot exceed 2000 characters'
      }),
    
    resolutionImages: Joi.array().items(Joi.string().uri()).max(10).optional(),
    
    estimatedResolutionTime: Joi.date().iso().greater('now').optional()
      .messages({
        'date.greater': 'Estimated resolution time must be in the future'
      })
  }).min(1)
    .messages({
      'object.min': 'At least one field must be provided for update'
    }),

  statusUpdate: Joi.object({
    status: Joi.string().valid(
      'submitted', 'assigned', 'in_progress', 'in-progress', 'resolved', 'closed', 'rejected'
    ).required(),
    
    resolutionNotes: Joi.string().allow('', null).max(2000).optional(),
    
    resolutionImages: Joi.array().items(Joi.string().uri()).allow(null).optional(),
    
    estimatedResolutionTime: Joi.date().iso().optional()
  }),

  feedback: Joi.object({
    rating: Joi.number().integer().min(1).max(5).required()
      .messages({
        'number.min': 'Rating must be between 1 and 5',
        'number.max': 'Rating must be between 1 and 5',
        'any.required': 'Rating is required'
      }),
    
    comment: Joi.string().min(5).max(1000).optional()
      .messages({
        'string.min': 'Comment must be at least 5 characters long',
        'string.max': 'Comment cannot exceed 1000 characters'
      })
  }),

  assignment: Joi.object({
    departmentId: Joi.number().integer().positive().required()
      .messages({
        'any.required': 'Department ID is required'
      }),
    
    userId: Joi.number().integer().positive().optional(),
    
    assignmentReason: Joi.string().min(5).max(500).optional()
      .messages({
        'string.min': 'Assignment reason must be at least 5 characters long',
        'string.max': 'Assignment reason cannot exceed 500 characters'
      })
  })
};

/**
 * User validation schemas
 */
const userSchemas = {
  create: Joi.object({
    username: Joi.string().alphanum().min(3).max(50).required()
      .messages({
        'string.alphanum': 'Username must contain only letters and numbers',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 50 characters',
        'any.required': 'Username is required'
      }),
    
    password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 8 characters long',
        'string.max': 'Password cannot exceed 128 characters',
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
        'any.required': 'Password is required'
      }),
    
    email: Joi.string().email().max(255).required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    
    fullName: Joi.string().min(2).max(255).required()
      .messages({
        'string.min': 'Full name must be at least 2 characters long',
        'string.max': 'Full name cannot exceed 255 characters',
        'any.required': 'Full name is required'
      }),
    
    role: Joi.string().valid('citizen', 'authority', 'admin', 'super_admin')
      .default('authority'),
    
    departmentId: Joi.number().integer().positive().when('role', {
      is: Joi.valid('authority', 'admin'),
      then: Joi.required(),
      otherwise: Joi.optional()
    }),
    
    wardArea: Joi.string().max(100).optional(),
    
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional()
  }),

  update: Joi.object({
    password: Joi.string().min(8).max(128).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .optional(),
    
    email: Joi.string().email().max(255).optional(),
    
    fullName: Joi.string().min(2).max(255).optional(),
    
    departmentId: Joi.number().integer().positive().optional(),
    
    wardArea: Joi.string().max(100).optional(),
    
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
    
    isActive: Joi.boolean().optional()
  }).min(1),

  login: Joi.object({
    username: Joi.string().required()
      .messages({
        'any.required': 'Username is required'
      }),
    
    password: Joi.string().required()
      .messages({
        'any.required': 'Password is required'
      })
  })
};

/**
 * Query parameter validation schemas
 */
const querySchemas = {
  issueFilters: Joi.object({
    status: Joi.string().valid(
      'all', 'submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected'
    ).default('all'),
    
    category: Joi.string().valid(
      'all', 'pothole', 'garbage', 'streetlight', 'graffiti', 
      'water', 'traffic', 'sidewalk', 'other'
    ).default('all'),
    
    priority: Joi.string().valid(
      'all', 'low', 'medium', 'high', 'critical'
    ).default('all'),
    
    severity: Joi.string().valid(
      'all', 'low', 'medium', 'high', 'critical'
    ).optional(),
    
    departmentId: Joi.number().integer().positive().optional(),
    
    assignedToUserId: Joi.number().integer().positive().optional(),
    
    citizenEmail: Joi.string().email().optional(),
    
    startDate: Joi.date().iso().optional(),
    
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).optional()
      .messages({
        'date.greater': 'End date must be after start date'
      }),
    
    page: Joi.number().integer().min(1).default(1),
    
    limit: Joi.number().integer().min(1).max(100).default(20)
  }),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

/**
 * File upload validation
 */
const fileValidation = {
  image: Joi.object({
    mimetype: Joi.string().valid(
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ).required()
      .messages({
        'any.only': 'Only JPEG, PNG, and WebP images are allowed'
      }),
    
    size: Joi.number().max(5 * 1024 * 1024).required() // 5MB
      .messages({
        'number.max': 'Image size cannot exceed 5MB'
      }),
    
    filename: Joi.string().required()
  })
};

/**
 * Sanitization helpers
 */
const sanitize = {
  /**
   * Remove potential XSS content
   */
  xss: (text) => {
    if (typeof text !== 'string') return text;
    
    return text
      .replace(/[<>\"']/g, '') // Remove potential HTML/script chars
      .trim();
  },

  /**
   * Sanitize location data
   */
  location: (location) => {
    if (!location) return location;
    
    return {
      lat: parseFloat(location.lat),
      lng: parseFloat(location.lng),
      address: sanitize.xss(location.address),
      ward: location.ward ? sanitize.xss(location.ward) : undefined,
      area: location.area ? sanitize.xss(location.area) : undefined
    };
  },

  /**
   * Sanitize array of strings
   */
  stringArray: (arr) => {
    if (!Array.isArray(arr)) return arr;
    return arr.map(item => typeof item === 'string' ? sanitize.xss(item) : item);
  }
};

/**
 * Custom validation middleware for file uploads
 */
const validateFile = (fileField = 'file', fileType = 'image') => {
  return (req, res, next) => {
    const file = req.file || req.files?.[fileField];
    
    if (!file) {
      return next(); // Optional file
    }

    const schema = fileValidation[fileType];
    const { error } = schema.validate({
      mimetype: file.mimetype,
      size: file.size,
      filename: file.filename || file.originalname
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'File validation failed',
        message: error.details[0].message
      });
    }

    next();
  };
};

/**
 * Department validation schemas
 */
const departmentSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required()
      .messages({
        'any.required': 'Department name is required',
        'string.min': 'Department name must be at least 2 characters'
      }),
    type: Joi.string().valid('municipal', 'infrastructure', 'environmental', 'public_safety', 'utilities', 'other').required()
      .messages({ 'any.required': 'Department type is required' }),
    description: Joi.string().max(500).optional(),
    contactEmail: Joi.string().email().optional(),
    contactPhone: Joi.string().pattern(/^[+]?[\d\s()-]{7,20}$/).optional(),
    headName: Joi.string().max(100).optional(),
    categories: Joi.array().items(Joi.string()).optional(),
    slaHours: Joi.number().integer().min(1).max(720).optional(),
    escalationHours: Joi.number().integer().min(1).max(2160).optional(),
    locationCoverage: Joi.array().items(Joi.string()).optional(),
    budgetAllocated: Joi.number().min(0).optional(),
    staffCount: Joi.number().integer().min(0).optional(),
    status: Joi.string().valid('active', 'inactive', 'maintenance').optional()
  }),

  assignment: Joi.object({
    issue_id: Joi.string().required()
      .messages({ 'any.required': 'Issue ID is required' }),
    priority: Joi.string().valid('low', 'medium', 'high', 'critical').optional(),
    notes: Joi.string().max(500).optional()
  })
};

/**
 * Pre-built validation middleware for departments
 */
const validateDepartment = validate(departmentSchemas.create);
const validateAssignment = validate(departmentSchemas.assignment);

module.exports = {
  validate,
  issueSchemas,
  userSchemas,
  querySchemas,
  departmentSchemas,
  fileValidation,
  validateFile,
  validateDepartment,
  validateAssignment,
  sanitize
};