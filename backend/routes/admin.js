const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const IssueService = require('../services/IssueService');
const DepartmentService = require('../services/DepartmentService');
const AuditService = require('../services/AuditService');
const NotificationService = require('../services/NotificationService');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/admin/dashboard
 * Get comprehensive dashboard statistics
 * Access: Admin, Super Admin
 */
router.get('/dashboard', requireAnyRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Get system-wide statistics
    const [
      issueStats,
      departmentStats,
      performanceMetrics,
      recentActivities
    ] = await Promise.all([
      IssueService.getSystemStatistics(timeframe),
      DepartmentService.getSystemDepartmentStats(),
      IssueService.getSystemPerformanceMetrics(timeframe),
      AuditService.getRecentActivities(50)
    ]);
    
    const dashboardData = {
      overview: {
        total_issues: issueStats.total,
        active_issues: issueStats.active,
        resolved_issues: issueStats.resolved,
        critical_issues: issueStats.critical,
        average_resolution_time: performanceMetrics.avg_resolution_time,
        sla_compliance_rate: performanceMetrics.sla_compliance,
        user_satisfaction: performanceMetrics.user_satisfaction
      },
      departments: departmentStats,
      performance: performanceMetrics,
      trends: issueStats.trends,
      recent_activities: recentActivities
    };
    
    res.json({
      success: true,
      data: dashboardData,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/analytics
 * Get detailed analytics and insights
 * Access: Admin, Super Admin
 */
router.get('/analytics', requireAnyRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { 
      timeframe = '30d',
      category = 'all',
      department = 'all',
      granularity = 'daily'
    } = req.query;
    
    const analytics = await IssueService.getDetailedAnalytics({
      timeframe,
      category,
      department,
      granularity
    });
    
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/system-health
 * Get system health and monitoring data
 * Access: Super Admin only
 */
router.get('/system-health', requireAnyRole(['super_admin']), async (req, res) => {
  try {
    const healthData = {
      database: await checkDatabaseHealth(),
      notifications: await NotificationService.getSystemStatus(),
      background_jobs: await checkBackgroundJobHealth(),
      api_performance: await getAPIPerformanceMetrics(),
      storage: await checkStorageHealth(),
      error_rates: await getErrorRateMetrics()
    };
    
    // Calculate overall health score
    const healthScores = Object.values(healthData).map(component => component.score || 100);
    const overallHealth = Math.round(healthScores.reduce((a, b) => a + b, 0) / healthScores.length);
    
    res.json({
      success: true,
      data: {
        overall_health: overallHealth,
        status: overallHealth >= 90 ? 'excellent' : overallHealth >= 70 ? 'good' : overallHealth >= 50 ? 'warning' : 'critical',
        components: healthData,
        last_check: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check system health',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/users
 * Get user management data
 * Access: Admin, Super Admin
 */
router.get('/users', requireAnyRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { role, status, department, page = 1, limit = 50 } = req.query;
    
    const users = await getUserManagementData({
      role,
      status,
      department,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user data',
      message: error.message
    });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Update user status
 * Access: Admin, Super Admin
 */
router.put('/users/:id/status', requireAnyRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { status, reason } = req.body;
    
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'Status must be: active, inactive, or suspended'
      });
    }
    
    const user = await updateUserStatus(req.params.id, status, reason);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Log user status change
    await AuditService.logActivity({
      user_id: req.user.id,
      resource_type: 'user',
      resource_id: req.params.id,
      action_type: 'status_update',
      details: { new_status: status, reason },
      ip_address: req.ip
    });
    
    res.json({
      success: true,
      message: `User status updated to ${status}`,
      data: user
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user status',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/audit-logs
 * Get system audit logs
 * Access: Admin, Super Admin
 */
router.get('/audit-logs', requireAnyRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const {
      action_type,
      resource_type,
      user_id,
      start_date,
      end_date,
      page = 1,
      limit = 100
    } = req.query;
    
    const filters = {
      action_type,
      resource_type,
      user_id,
      start_date,
      end_date,
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    const auditLogs = await AuditService.getActivities(filters);
    
    res.json({
      success: true,
      data: auditLogs
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit logs',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/reports
 * Generate system reports
 * Access: Admin, Super Admin
 */
router.get('/reports', requireAnyRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { 
      type = 'summary',
      timeframe = '30d',
      format = 'json',
      include_charts = 'false'
    } = req.query;
    
    const reportData = await generateSystemReport({
      type,
      timeframe,
      format,
      includeCharts: include_charts === 'true'
    });
    
    res.json({
      success: true,
      data: reportData,
      generated_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate report',
      message: error.message
    });
  }
});

/**
 * GET /api/admin/notifications/stats
 * Get notification system statistics
 * Access: Admin, Super Admin
 */
router.get('/notifications/stats', requireAnyRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const stats = await NotificationService.getNotificationStats();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification stats',
      message: error.message
    });
  }
});

/**
 * POST /api/admin/maintenance/cleanup
 * Perform system cleanup operations
 * Access: Super Admin only
 */
router.post('/maintenance/cleanup', requireAnyRole(['super_admin']), async (req, res) => {
  try {
    const { 
      cleanup_logs = true,
      cleanup_notifications = true,
      cleanup_temp_files = true,
      days_to_keep = 90
    } = req.body;
    
    const cleanupResults = await performSystemCleanup({
      cleanup_logs,
      cleanup_notifications,
      cleanup_temp_files,
      days_to_keep
    });
    
    // Log cleanup operation
    await AuditService.logActivity({
      user_id: req.user.id,
      resource_type: 'system',
      resource_id: 'maintenance',
      action_type: 'cleanup',
      details: { cleanup_results: cleanupResults },
      ip_address: req.ip
    });
    
    res.json({
      success: true,
      message: 'System cleanup completed',
      data: cleanupResults
    });
  } catch (error) {
    console.error('Error performing system cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform system cleanup',
      message: error.message
    });
  }
});

/**
 * Helper Functions
 */

async function checkDatabaseHealth() {
  try {
    // Simple health check - could be expanded
    const { supabase } = require('../config/database');
    const { count } = await supabase.from('issues').select('*', { count: 'exact', head: true });
    
    return {
      status: 'healthy',
      response_time: 50, // Mock value
      connections: 10, // Mock value
      score: 100
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      score: 0
    };
  }
}

async function checkBackgroundJobHealth() {
  // Mock implementation - would check actual background job status
  return {
    status: 'running',
    active_jobs: 3,
    failed_jobs: 0,
    last_execution: new Date().toISOString(),
    score: 100
  };
}

async function getAPIPerformanceMetrics() {
  // Mock implementation - would track actual API metrics
  return {
    average_response_time: 150,
    requests_per_minute: 45,
    error_rate: 0.5,
    score: 95
  };
}

async function checkStorageHealth() {
  // Mock implementation - would check actual storage usage
  return {
    total_storage: '1TB',
    used_storage: '250GB',
    usage_percentage: 25,
    available_space: '750GB',
    score: 90
  };
}

async function getErrorRateMetrics() {
  // Mock implementation - would track actual error rates
  return {
    last_24h_errors: 5,
    error_rate: 0.1,
    critical_errors: 0,
    score: 98
  };
}

async function getUserManagementData(filters) {
  // Mock implementation - would query actual user data
  const { supabase } = require('../config/database');
  
  let query = supabase
    .from('users')
    .select('id, username, email, full_name, role, department_id, ward_area, phone, is_active, last_login_at, created_at, updated_at')
    .order('created_at', { ascending: false });
  
  if (filters.role && filters.role !== 'all') {
    query = query.eq('role', filters.role);
  }
  
  if (filters.status && filters.status !== 'all') {
    query = query.eq('status', filters.status);
  }
  
  if (filters.department && filters.department !== 'all') {
    query = query.eq('department_id', filters.department);
  }
  
  const { data: users, error } = await query
    .range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1);
  
  if (error) throw error;
  
  return {
    users,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: users.length
    }
  };
}

async function updateUserStatus(userId, status, reason) {
  const { supabase } = require('../config/database');
  
  const { data: user, error } = await supabase
    .from('users')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return user;
}

async function generateSystemReport(options) {
  // Mock implementation - would generate actual comprehensive reports
  return {
    type: options.type,
    timeframe: options.timeframe,
    summary: {
      total_issues: 1250,
      resolved_issues: 980,
      pending_issues: 270,
      average_resolution_time: '4.2 days',
      departments_active: 8,
      user_satisfaction: 4.2
    },
    breakdown: {
      by_category: {
        'pothole': 450,
        'garbage': 380,
        'streetlight': 250,
        'other': 170
      },
      by_status: {
        'submitted': 120,
        'in_progress': 150,
        'resolved': 980
      }
    }
  };
}

async function performSystemCleanup(options) {
  const results = {
    logs_cleaned: 0,
    notifications_cleaned: 0,
    temp_files_cleaned: 0,
    space_freed: '0MB'
  };
  
  try {
    if (options.cleanup_logs) {
      results.logs_cleaned = await AuditService.cleanOldLogs(options.days_to_keep);
    }
    
    if (options.cleanup_notifications) {
      results.notifications_cleaned = await NotificationService.cleanupOldNotifications(options.days_to_keep);
    }
    
    if (options.cleanup_temp_files) {
      // Mock cleanup - would clean actual temporary files
      results.temp_files_cleaned = 50;
      results.space_freed = '2.5GB';
    }
    
    return results;
  } catch (error) {
    throw error;
  }
}

module.exports = router;