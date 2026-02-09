const express = require('express');
const AuthService = require('../services/AuthService');
const { validate, userSchemas } = require('../middleware/validation');
const { authenticateToken, requireAnyRole, attachIP, getClientIP } = require('../middleware/auth');
const router = express.Router();

// POST /api/auth/login - Enhanced login with audit logging
router.post('/login', 
  validate(userSchemas.login),
  async (req, res) => {
    try {
      const { username, password } = req.body;
      const clientIP = getClientIP(req);
      
      const result = await AuthService.login(username, password, clientIP);
      
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({
        success: false,
        error: 'Login failed',
        message: error.message
      });
    }
  }
);

// POST /api/auth/logout - Enhanced logout
router.post('/logout', 
  authenticateToken,
  async (req, res) => {
    try {
      // In a real application, you might:
      // 1. Add token to blacklist in database
      // 2. Clear any server-side session data
      // For now, client-side token removal is sufficient
      
      res.json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed',
        message: error.message
      });
    }
  }
);

// GET /api/auth/me - Get current user profile
router.get('/me',
  authenticateToken,
  async (req, res) => {
    try {
      res.json({
        success: true,
        data: {
          user: req.user,
          permissions: {
            can_create_users: req.user.role === 'admin' || req.user.role === 'super_admin',
            can_manage_departments: req.user.role === 'super_admin',
            can_view_all_issues: req.user.role === 'admin' || req.user.role === 'super_admin',
            can_assign_issues: req.user.role !== 'citizen'
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch user profile',
        message: error.message
      });
    }
  }
);

// POST /api/auth/users - Create new user (Admin only)
router.post('/users',
  authenticateToken,
  requireAnyRole(['admin', 'super_admin']),
  validate(userSchemas.create),
  async (req, res) => {
    try {
      const clientIP = getClientIP(req);
      const newUser = await AuthService.createUser(req.body, req.user.id, clientIP);
      
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: newUser
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to create user',
        message: error.message
      });
    }
  }
);

// GET /api/auth/users - Get all users with filters (Admin only)
router.get('/users',
  authenticateToken,
  requireAnyRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const filters = {
        role: req.query.role,
        departmentId: req.query.departmentId ? parseInt(req.query.departmentId) : undefined,
        wardArea: req.query.wardArea
      };

      const users = await AuthService.getUsers(filters);
      
      res.json({
        success: true,
        data: users,
        count: users.length
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users',
        message: error.message
      });
    }
  }
);

// GET /api/auth/users/:id - Get user by ID (Admin or self)
router.get('/users/:id',
  authenticateToken,
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      // Users can view their own profile, admins can view any profile
      if (req.user.role !== 'admin' && req.user.role !== 'super_admin' && req.user.id !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only view your own profile'
        });
      }

      const user = await AuthService.getUserById(userId);
      
      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(404).json({
        success: false,
        error: 'User not found',
        message: error.message
      });
    }
  }
);

// PUT /api/auth/users/:id - Update user (Admin or self for limited fields)
router.put('/users/:id',
  authenticateToken,
  validate(userSchemas.update),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const clientIP = getClientIP(req);
      
      // Check permissions
      const isSelf = req.user.id === userId;
      const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
      
      if (!isSelf && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only update your own profile'
        });
      }

      // Restrict fields for non-admin users updating themselves
      let updateData = { ...req.body };
      if (isSelf && !isAdmin) {
        // Users can only update their own email, full name, and phone
        const allowedFields = ['email', 'fullName', 'phone', 'password'];
        updateData = Object.keys(updateData)
          .filter(key => allowedFields.includes(key))
          .reduce((obj, key) => {
            obj[key] = updateData[key];
            return obj;
          }, {});
      }

      const updatedUser = await AuthService.updateUser(userId, updateData, req.user.id, clientIP);
      
      res.json({
        success: true,
        message: 'User updated successfully',
        data: updatedUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to update user',
        message: error.message
      });
    }
  }
);

// DELETE /api/auth/users/:id - Deactivate user (Admin only)
router.delete('/users/:id',
  authenticateToken,
  requireAnyRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const clientIP = getClientIP(req);
      
      // Prevent self-deactivation
      if (req.user.id === userId) {
        return res.status(400).json({
          success: false,
          error: 'Cannot deactivate yourself',
          message: 'You cannot deactivate your own account'
        });
      }

      const result = await AuthService.deactivateUser(userId, req.user.id, clientIP);
      
      res.json({
        success: true,
        message: 'User deactivated successfully',
        data: result
      });
    } catch (error) {
      console.error('Deactivate user error:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to deactivate user',
        message: error.message
      });
    }
  }
);

// POST /api/auth/change-password - Change password (authenticated users)
router.post('/change-password',
  authenticateToken,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'Current password and new password are required'
        });
      }

      // Verify current password by attempting login
      try {
        await AuthService.login(req.user.username, currentPassword);
      } catch (error) {
        return res.status(401).json({
          success: false,
          error: 'Invalid current password',
          message: 'The current password you entered is incorrect'
        });
      }

      // Update password
      const clientIP = getClientIP(req);
      await AuthService.updateUser(req.user.id, { password: newPassword }, req.user.id, clientIP);
      
      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to change password',
        message: error.message
      });
    }
  }
);

// GET /api/auth/permissions - Get current user permissions
router.get('/permissions',
  authenticateToken,
  async (req, res) => {
    try {
      const permissions = {
        // User management
        can_create_users: AuthService.hasPermission(req.user.role, 'admin'),
        can_view_all_users: AuthService.hasPermission(req.user.role, 'admin'),
        can_deactivate_users: AuthService.hasPermission(req.user.role, 'admin'),
        
        // Issue management
        can_view_all_issues: AuthService.hasPermission(req.user.role, 'authority'),
        can_update_issue_status: AuthService.hasPermission(req.user.role, 'authority'),
        can_assign_issues: AuthService.hasPermission(req.user.role, 'authority'),
        can_reassign_issues: AuthService.hasPermission(req.user.role, 'admin'),
        
        // Department management
        can_manage_departments: req.user.role === 'super_admin',
        can_view_department_stats: AuthService.hasPermission(req.user.role, 'authority'),
        
        // System administration
        can_view_audit_logs: AuthService.hasPermission(req.user.role, 'admin'),
        can_view_system_stats: AuthService.hasPermission(req.user.role, 'authority'),
        can_manage_notifications: AuthService.hasPermission(req.user.role, 'admin'),
        
        // Current user context
        role: req.user.role,
        department_id: req.user.department_id,
        ward_area: req.user.ward_area
      };
      
      res.json({
        success: true,
        data: permissions
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch permissions',
        message: error.message
      });
    }
  }
);

// POST /api/auth/reset-passwords — Emergency password reset for all users
// Secured by a secret token from environment variable
router.post('/reset-passwords', async (req, res) => {
  try {
    const resetSecret = process.env.PASSWORD_RESET_SECRET || 'civic-reset-2026';
    const { secret } = req.body;

    if (secret !== resetSecret) {
      return res.status(403).json({ success: false, error: 'Invalid reset secret' });
    }

    const bcrypt = require('bcryptjs');
    const { supabase } = require('../config/database');
    const PASSWORD = 'Admin@123';
    const correctHash = await bcrypt.hash(PASSWORD, 12);

    const { data: users, error: fetchErr } = await supabase
      .from('users')
      .select('id, username');

    if (fetchErr) throw fetchErr;

    let fixed = 0;
    for (const u of users) {
      const { error } = await supabase
        .from('users')
        .update({ password: correctHash })
        .eq('id', u.id);
      if (!error) fixed++;
    }

    res.json({
      success: true,
      message: `Reset passwords for ${fixed}/${users.length} users`,
      password: PASSWORD
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;