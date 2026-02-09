/**
 * Audit Service
 * Handles audit logging for all system activities
 */

const { supabase } = require('../config/database');

class AuditService {
  /**
   * Log audit entry
   */
  async log(entityType, entityId, action, oldValues = null, newValues = null, userId = null, ipAddress = null, details = null) {
    try {
      const auditEntry = {
        entity_type: entityType,
        entity_id: entityId.toString(),
        action: action,
        old_values: oldValues ? JSON.stringify(oldValues) : null,
        new_values: newValues ? JSON.stringify(newValues) : null,
        changed_by_user_id: userId,
        changed_by_ip: ipAddress,
        details: details,
        changed_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert([auditEntry]);

      if (error) {
        console.error('Failed to log audit entry:', error);
        // Don't throw error - audit logging should not break main functionality
      }
    } catch (error) {
      console.error('Audit logging error:', error);
      // Silent fail - don't interrupt main operations
    }
  }

  /**
   * Get audit logs with filters
   */
  async getLogs(filters = {}) {
    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          users (
            username,
            full_name
          )
        `)
        .order('changed_at', { ascending: false });

      // Apply filters
      if (filters.entityType) {
        query = query.eq('entity_type', filters.entityType);
      }
      if (filters.entityId) {
        query = query.eq('entity_id', filters.entityId);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.userId) {
        query = query.eq('changed_by_user_id', filters.userId);
      }
      if (filters.startDate) {
        query = query.gte('changed_at', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('changed_at', filters.endDate);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      const { data: logs, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      return logs;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch audit logs');
    }
  }

  /**
   * Get audit logs for a specific issue
   */
  async getIssueAuditLogs(issueId) {
    try {
      const { data: logs, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          users (
            username,
            full_name
          )
        `)
        .eq('entity_type', 'issue')
        .eq('entity_id', issueId)
        .order('changed_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return logs;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch issue audit logs');
    }
  }

  /**
   * Get system activity summary
   */
  async getActivitySummary(timeframe = '24 hours') {
    try {
      const timeframeMap = {
        '1 hour': '1 hour',
        '24 hours': '1 day',
        '7 days': '7 days',
        '30 days': '30 days'
      };

      const interval = timeframeMap[timeframe] || '1 day';

      const { data: summary, error } = await supabase.rpc('get_activity_summary', {
        time_interval: interval
      });

      if (error) {
        // If RPC function doesn't exist, create basic summary
        const sinceTime = new Date();
        switch (timeframe) {
          case '1 hour':
            sinceTime.setHours(sinceTime.getHours() - 1);
            break;
          case '7 days':
            sinceTime.setDate(sinceTime.getDate() - 7);
            break;
          case '30 days':
            sinceTime.setDate(sinceTime.getDate() - 30);
            break;
          default:
            sinceTime.setDate(sinceTime.getDate() - 1);
        }

        const { data: logs, error: basicError } = await supabase
          .from('audit_logs')
          .select('action, entity_type')
          .gte('changed_at', sinceTime.toISOString());

        if (basicError) {
          throw new Error(basicError.message);
        }

        // Create basic summary
        const summary = logs.reduce((acc, log) => {
          const key = `${log.entity_type}_${log.action}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

        return {
          timeframe,
          total_actions: logs.length,
          breakdown: summary
        };
      }

      return summary;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch activity summary');
    }
  }

  /**
   * Clean old audit logs (for maintenance)
   */
  async cleanOldLogs(daysToKeep = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { data, error } = await supabase
        .from('audit_logs')
        .delete()
        .lt('changed_at', cutoffDate.toISOString());

      if (error) {
        throw new Error(error.message);
      }

      return { message: `Cleaned audit logs older than ${daysToKeep} days`, deletedCount: data?.length || 0 };
    } catch (error) {
      throw new Error(error.message || 'Failed to clean old audit logs');
    }
  }

  /**
   * Log issue status change specifically
   */
  async logIssueStatusChange(issueId, oldStatus, newStatus, userId, ipAddress, additionalData = {}) {
    const statusChangeDetails = {
      old_status: oldStatus,
      new_status: newStatus,
      timestamp: new Date().toISOString(),
      ...additionalData
    };

    await this.log(
      'issue',
      issueId,
      'status_change',
      { status: oldStatus },
      { status: newStatus, ...additionalData },
      userId,
      ipAddress,
      `Status changed from ${oldStatus} to ${newStatus}`
    );
  }

  /**
   * Log issue assignment
   */
  async logIssueAssignment(issueId, assignedToDepartmentId, assignedToUserId, assignedByUserId, ipAddress, assignmentReason = null) {
    await this.log(
      'issue',
      issueId,
      'assignment',
      null,
      {
        assigned_department_id: assignedToDepartmentId,
        assigned_to_user_id: assignedToUserId,
        assignment_reason: assignmentReason
      },
      assignedByUserId,
      ipAddress,
      `Issue assigned to department ${assignedToDepartmentId} and user ${assignedToUserId}`
    );
  }

  /**
   * Log activity (alias used by department and admin routes)
   */
  async logActivity({ user_id, resource_type, resource_id, action_type, details, ip_address }) {
    await this.log(
      resource_type,
      resource_id || 'system',
      action_type,
      null,
      details,
      user_id,
      ip_address,
      typeof details === 'string' ? details : JSON.stringify(details)
    );
  }

  /**
   * Get recent activities (for admin dashboard)
   */
  async getRecentActivities(limit = 50) {
    return this.getLogs({ limit });
  }

  /**
   * Get activities with advanced filters (for admin audit logs page)
   */
  async getActivities(filters = {}) {
    return this.getLogs({
      entityType: filters.resource_type || filters.action_type ? undefined : undefined,
      action: filters.action_type,
      userId: filters.user_id,
      startDate: filters.start_date,
      endDate: filters.end_date,
      limit: filters.limit || 100
    });
  }
}

module.exports = new AuditService();