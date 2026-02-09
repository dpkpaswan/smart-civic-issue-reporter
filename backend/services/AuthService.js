/**
 * Authentication Service
 * Handles user authentication, JWT tokens, and user management
 */

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/database');
const AuditService = require('./AuditService');

class AuthService {
  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️  WARNING: JWT_SECRET not set in environment — using insecure default. Set JWT_SECRET for production!');
    }
    this.JWT_EXPIRES_IN = '24h';
    this.SALT_ROUNDS = 12;
  }

  /**
   * Authenticate user credentials
   */
  async login(username, password, ipAddress = null) {
    try {
      // Find user with department information
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          *,
          departments (
            id,
            name,
            code,
            sla_hours
          )
        `)
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        await AuditService.log('user', username, 'login_failed', null, { username }, null, ipAddress, 'Invalid username');
        throw new Error('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        await AuditService.log('user', user.id, 'login_failed', null, { username }, user.id, ipAddress, 'Invalid password');
        throw new Error('Invalid credentials');
      }

      // Update last login
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', user.id);

      // Generate JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          role: user.role,
          email: user.email,
          departmentId: user.department_id
        },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRES_IN }
      );

      // Remove password from response
      delete user.password;

      await AuditService.log('user', user.id, 'login_success', null, { username }, user.id, ipAddress, 'Successful login');

      return {
        user,
        token,
        expiresIn: this.JWT_EXPIRES_IN
      };
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, this.JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Create new user account
   */
  async createUser(userData, createdByUserId, ipAddress = null) {
    try {
      const {
        username,
        password,
        email,
        fullName,
        role = 'authority',
        departmentId,
        wardArea,
        phone
      } = userData;

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`username.eq.${username},email.eq.${email}`)
        .single();

      if (existingUser) {
        throw new Error('User with this username or email already exists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

      // Create user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          username,
          password: hashedPassword,
          email,
          full_name: fullName,
          role,
          department_id: departmentId,
          ward_area: wardArea,
          phone,
          is_active: true
        }])
        .select(`
          *,
          departments (
            id,
            name,
            code
          )
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Remove password from response
      delete newUser.password;

      await AuditService.log('user', newUser.id, 'create', null, newUser, createdByUserId, ipAddress, 'User created');

      return newUser;
    } catch (error) {
      throw new Error(error.message || 'Failed to create user');
    }
  }

  /**
   * Update user information
   */
  async updateUser(userId, updateData, updatedByUserId, ipAddress = null) {
    try {
      // Get current user data
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError || !currentUser) {
        throw new Error('User not found');
      }

      // Prepare update data
      const updateFields = { ...updateData };
      
      // Hash password if provided
      if (updateFields.password) {
        updateFields.password = await bcrypt.hash(updateFields.password, this.SALT_ROUNDS);
      }

      // Update user
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update(updateFields)
        .eq('id', userId)
        .select(`
          *,
          departments (
            id,
            name,
            code
          )
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Remove password from response
      delete updatedUser.password;

      await AuditService.log('user', userId, 'update', currentUser, updatedUser, updatedByUserId, ipAddress, 'User updated');

      return updatedUser;
    } catch (error) {
      throw new Error(error.message || 'Failed to update user');
    }
  }

  /**
   * Get user by ID with department information
   */
  async getUserById(userId) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select(`
          *,
          departments (
            id,
            name,
            code,
            sla_hours
          )
        `)
        .eq('id', userId)
        .eq('is_active', true)
        .single();

      if (error || !user) {
        throw new Error('User not found');
      }

      // Remove password from response
      delete user.password;

      return user;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch user');
    }
  }

  /**
   * Get all users with filters
   */
  async getUsers(filters = {}) {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          departments (
            id,
            name,
            code
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.role) {
        query = query.eq('role', filters.role);
      }
      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }
      if (filters.wardArea) {
        query = query.eq('ward_area', filters.wardArea);
      }

      const { data: users, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Remove passwords from all users
      users.forEach(user => delete user.password);

      return users;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch users');
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId, deactivatedByUserId, ipAddress = null) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      await AuditService.log('user', userId, 'deactivate', null, { is_active: false }, deactivatedByUserId, ipAddress, 'User deactivated');

      return { success: true, message: 'User deactivated successfully' };
    } catch (error) {
      throw new Error(error.message || 'Failed to deactivate user');
    }
  }

  /**
   * Check if user has permission for specific action
   */
  hasPermission(userRole, requiredRole) {
    const roleHierarchy = {
      'citizen': 1,
      'authority': 2,
      'admin': 3,
      'super_admin': 4
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 5;

    return userLevel >= requiredLevel;
  }

  /**
   * Generate password reset token (placeholder for future implementation)
   */
  async generatePasswordResetToken(email) {
    // Implementation for password reset functionality
    // This would typically generate a secure token and send email
    throw new Error('Password reset functionality not implemented yet');
  }
}

module.exports = new AuthService();