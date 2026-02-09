/**
 * Department Service
 * Handles department routing, assignment logic, and SLA management
 */

const { supabase } = require('../config/database');
const AuditService = require('./AuditService');

class DepartmentService {
  constructor() {
    // Department routing rules based on issue categories
    this.routingRules = {
      'pothole': { departmentCode: 'ROADS', priority: 'medium', sla: 48 },
      'garbage': { departmentCode: 'SANITATION', priority: 'high', sla: 24 },
      'water': { departmentCode: 'WATER', priority: 'high', sla: 12 },
      'streetlight': { departmentCode: 'ELECTRICITY', priority: 'medium', sla: 24 },
      'traffic': { departmentCode: 'TRAFFIC', priority: 'high', sla: 48 },
      'graffiti': { departmentCode: 'PARKS', priority: 'low', sla: 72 },
      'sidewalk': { departmentCode: 'ROADS', priority: 'medium', sla: 48 },
      'other': { departmentCode: 'PLANNING', priority: 'low', sla: 168 }
    };

    // Location-based routing (for future ward-based assignment)
    this.wardAssignments = {
      'North': ['North Ward A', 'North Ward B', 'North Ward C'],
      'South': ['South Ward A', 'South Ward B', 'South Ward C'],
      'East': ['East Ward A', 'East Ward B', 'East Ward C'],
      'West': ['West Ward A', 'West Ward B', 'West Ward C'],
      'Central': ['Central Ward A', 'Central Ward B']
    };
  }

  /**
   * Auto-assign issue to appropriate department based on category and location
   */
  async autoAssignIssue(issueData, assignedByUserId = null) {
    try {
      const { category, location } = issueData;
      
      // Get routing rule for category
      const routingRule = this.routingRules[category] || this.routingRules['other'];
      
      // Find department by code
      const { data: department, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('code', routingRule.departmentCode)
        .eq('is_active', true)
        .single();

      if (deptError || !department) {
        throw new Error(`Department not found for category: ${category}`);
      }

      // Find available authority in the department and ward area
      const wardArea = this.determineWardArea(location);
      const assignedUser = await this.findAvailableAuthority(department.id, wardArea);

      // Calculate SLA deadline
      const slaDeadline = new Date();
      slaDeadline.setHours(slaDeadline.getHours() + (routingRule.sla || department.sla_hours));

      // Create routing log entry
      const routingLog = {
        timestamp: new Date().toISOString(),
        rule_applied: routingRule,
        department_assigned: department.code,
        user_assigned: assignedUser?.id || null,
        ward_area: wardArea,
        sla_deadline: slaDeadline.toISOString(),
        assignment_method: 'auto'
      };

      const assignmentData = {
        assigned_department_id: department.id,
        assigned_to_user_id: assignedUser?.id || null,
        sla_deadline: slaDeadline.toISOString(),
        routing_logs: [routingLog],
        assigned_at: new Date().toISOString(),
        status: 'assigned'
      };

      // Log the assignment
      await AuditService.logIssueAssignment(
        issueData.issue_id,
        department.id,
        assignedUser?.id,
        assignedByUserId,
        null,
        `Auto-assigned based on category: ${category}`
      );

      return {
        assignment: assignmentData,
        department,
        assignedUser,
        routingLog
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to auto-assign issue');
    }
  }

  /**
   * Manually assign issue to specific department and user
   */
  async manualAssignIssue(issueId, departmentId, userId = null, assignedByUserId, assignmentReason = null) {
    try {
      // Validate department
      const { data: department, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('id', departmentId)
        .eq('is_active', true)
        .single();

      if (deptError || !department) {
        throw new Error('Department not found or inactive');
      }

      // Validate user if provided
      let assignedUser = null;
      if (userId) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .eq('department_id', departmentId)
          .eq('is_active', true)
          .single();

        if (userError || !user) {
          throw new Error('User not found or not in specified department');
        }
        assignedUser = user;
      }

      // Calculate SLA deadline
      const slaDeadline = new Date();
      slaDeadline.setHours(slaDeadline.getHours() + department.sla_hours);

      // Create routing log entry
      const routingLog = {
        timestamp: new Date().toISOString(),
        department_assigned: department.code,
        user_assigned: userId,
        assignment_method: 'manual',
        assigned_by_user_id: assignedByUserId,
        assignment_reason: assignmentReason
      };

      // Update issue - use read-then-write for routing_logs since supabase.sql isn't available
      const { data: currentIssueData } = await supabase
        .from('issues')
        .select('routing_logs')
        .eq('issue_id', issueId)
        .single();
      
      const existingLogs = currentIssueData?.routing_logs || [];
      existingLogs.push(routingLog);

      const { data: updatedIssue, error: updateError } = await supabase
        .from('issues')
        .update({
          assigned_department_id: departmentId,
          assigned_to_user_id: userId,
          sla_deadline: slaDeadline.toISOString(),
          routing_logs: existingLogs,
          assigned_at: new Date().toISOString(),
          status: 'assigned'
        })
        .eq('issue_id', issueId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Log the assignment
      await AuditService.logIssueAssignment(
        issueId,
        departmentId,
        userId,
        assignedByUserId,
        null,
        assignmentReason || 'Manual assignment'
      );

      return {
        issue: updatedIssue,
        department,
        assignedUser
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to manually assign issue');
    }
  }

  /**
   * Reassign issue to different department or user
   */
  async reassignIssue(issueId, newDepartmentId, newUserId = null, reassignedByUserId, reassignmentReason) {
    try {
      // Get current issue data
      const { data: currentIssue, error: issueError } = await supabase
        .from('issues')
        .select('*')
        .eq('issue_id', issueId)
        .single();

      if (issueError || !currentIssue) {
        throw new Error('Issue not found');
      }

      // Perform manual assignment
      const result = await this.manualAssignIssue(
        issueId,
        newDepartmentId,
        newUserId,
        reassignedByUserId,
        `Reassignment: ${reassignmentReason}`
      );

      // Update status history
      const statusChange = {
        timestamp: new Date().toISOString(),
        action: 'reassigned',
        old_department_id: currentIssue.assigned_department_id,
        new_department_id: newDepartmentId,
        old_user_id: currentIssue.assigned_to_user_id,
        new_user_id: newUserId,
        reason: reassignmentReason,
        reassigned_by: reassignedByUserId
      };

      // Update status history - use read-then-write
      const { data: issueForHistory } = await supabase
        .from('issues')
        .select('status_history')
        .eq('issue_id', issueId)
        .single();
      
      const existingHistory = issueForHistory?.status_history || [];
      existingHistory.push(statusChange);

      await supabase
        .from('issues')
        .update({
          status_history: existingHistory
        })
        .eq('issue_id', issueId);

      return result;
    } catch (error) {
      throw new Error(error.message || 'Failed to reassign issue');
    }
  }

  /**
   * Find available authority in department and ward area
   */
  async findAvailableAuthority(departmentId, wardArea = null) {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .eq('role', 'authority');

      if (wardArea) {
        query = query.eq('ward_area', wardArea);
      }

      const { data: users, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      if (!users || users.length === 0) {
        // If no users in specific ward, try department-wide
        if (wardArea) {
          return this.findAvailableAuthority(departmentId, null);
        }
        return null;
      }

      // For now, return the first available user
      // In the future, implement load balancing based on current workload
      return users[0];
    } catch (error) {
      console.error('Error finding available authority:', error);
      return null;
    }
  }

  /**
   * Determine ward area from location data
   */
  determineWardArea(locationData) {
    try {
      // Check if location already has ward information
      if (locationData.ward) {
        return locationData.ward;
      }

      // Simple ward determination based on coordinates
      // In production, this would use proper GIS data
      const { lat, lng } = locationData;

      if (lat > 40.7700) return 'North';
      if (lat < 40.7400) return 'South';
      if (lng > -74.0000) return 'East';
      if (lng < -74.0200) return 'West';
      
      return 'Central';
    } catch (error) {
      console.error('Error determining ward area:', error);
      return 'Central'; // Default fallback
    }
  }

  /**
   * Get all departments
   */
  async getAllDepartments() {
    try {
      const { data: departments, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(error.message);
      }

      return departments;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch departments');
    }
  }

  /**
   * Get department with issue statistics
   */
  async getDepartmentStats(departmentId, timeframe = '30 days') {
    try {
      const department = await this.getDepartmentById(departmentId);
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));

      // Get issue statistics for the department
      const { data: issueStats, error } = await supabase
        .from('issues')
        .select('status, priority, severity_level')
        .eq('assigned_department_id', departmentId)
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw new Error(error.message);
      }

      // Calculate statistics
      const stats = {
        total_issues: issueStats.length,
        by_status: {},
        by_priority: {},
        by_severity: {}
      };

      issueStats.forEach(issue => {
        stats.by_status[issue.status] = (stats.by_status[issue.status] || 0) + 1;
        stats.by_priority[issue.priority] = (stats.by_priority[issue.priority] || 0) + 1;
        stats.by_severity[issue.severity_level] = (stats.by_severity[issue.severity_level] || 0) + 1;
      });

      return {
        department,
        timeframe,
        statistics: stats
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch department statistics');
    }
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(departmentId) {
    try {
      const { data: department, error } = await supabase
        .from('departments')
        .select('*')
        .eq('id', departmentId)
        .eq('is_active', true)
        .single();

      if (error || !department) {
        throw new Error('Department not found');
      }

      return department;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch department');
    }
  }

  /**
   * Check for SLA violations and auto-escalate
   */
  async checkSLAViolations() {
    try {
      const now = new Date();
      
      // Find issues that have passed their SLA deadline
      const { data: overdueIssues, error } = await supabase
        .from('issues')
        .select(`
          *,
          departments (name, head_of_department, contact_email),
          users (username, email, full_name)
        `)
        .lt('sla_deadline', now.toISOString())
        .in('status', ['submitted', 'assigned', 'in_progress'])
        .eq('auto_escalated', false);

      if (error) {
        throw new Error(error.message);
      }

      const escalatedIssues = [];

      for (const issue of overdueIssues) {
        try {
          // Mark as auto-escalated
          await supabase
            .from('issues')
            .update({
              auto_escalated: true,
              escalation_reason: 'SLA deadline exceeded',
              priority: this.escalatePriority(issue.priority)
            })
            .eq('id', issue.id);

          // Log escalation
          await AuditService.log(
            'issue',
            issue.issue_id,
            'escalated',
            { priority: issue.priority, auto_escalated: false },
            { priority: this.escalatePriority(issue.priority), auto_escalated: true },
            null,
            null,
            'Auto-escalated due to SLA violation'
          );

          escalatedIssues.push(issue);
        } catch (escalationError) {
          console.error(`Failed to escalate issue ${issue.issue_id}:`, escalationError);
        }
      }

      return {
        total_overdue: overdueIssues.length,
        escalated: escalatedIssues.length,
        escalated_issues: escalatedIssues
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to check SLA violations');
    }
  }

  /**
   * Escalate priority level
   */
  escalatePriority(currentPriority) {
    const priorityLevels = {
      'low': 'medium',
      'medium': 'high',
      'high': 'critical',
      'critical': 'critical'
    };
    return priorityLevels[currentPriority] || 'high';
  }

  /**
   * Create a new department
   */
  async createDepartment(departmentData) {
    try {
      const code = departmentData.code || departmentData.name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);
      const { data, error } = await supabase
        .from('departments')
        .insert([{ ...departmentData, code, is_active: true }])
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to create department');
    }
  }

  /**
   * Update a department
   */
  async updateDepartment(departmentId, updateData) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', departmentId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update department');
    }
  }

  /**
   * Soft-delete (deactivate) a department
   */
  async deleteDepartment(departmentId) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', departmentId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return !!data;
    } catch (error) {
      throw new Error(error.message || 'Failed to delete department');
    }
  }

  /**
   * Update department status
   */
  async updateDepartmentStatus(departmentId, status) {
    try {
      const isActive = status === 'active';
      const { data, error } = await supabase
        .from('departments')
        .update({ is_active: isActive, status, updated_at: new Date().toISOString() })
        .eq('id', departmentId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to update department status');
    }
  }

  /**
   * Get issues assigned to a department
   */
  async getDepartmentIssues(departmentId, options = {}) {
    try {
      let query = supabase
        .from('issues')
        .select('*, departments(name, code), users!assigned_to_user_id(username, full_name)')
        .eq('assigned_department_id', departmentId)
        .order('created_at', { ascending: false });

      if (options.status) query = query.eq('status', options.status);
      if (options.priority) query = query.eq('priority', options.priority);
      if (options.limit) query = query.limit(options.limit);
      if (options.offset) query = query.range(options.offset, options.offset + (options.limit || 50) - 1);

      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return data || [];
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch department issues');
    }
  }

  /**
   * Assign issue to department (simplified)
   */
  async assignIssueToDepartment(issueId, departmentId, options = {}) {
    try {
      const { data, error } = await supabase
        .from('issues')
        .update({
          assigned_department_id: departmentId,
          priority: options.priority || undefined,
          status: 'assigned',
          assigned_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('issue_id', issueId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } catch (error) {
      throw new Error(error.message || 'Failed to assign issue to department');
    }
  }

  /**
   * Get department performance metrics
   */
  async getDepartmentPerformance(departmentId, timeframe = '30d') {
    try {
      const days = parseInt(timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: issues, error } = await supabase
        .from('issues')
        .select('status, priority, created_at, resolved_at, sla_deadline')
        .eq('assigned_department_id', departmentId)
        .gte('created_at', startDate.toISOString());

      if (error) throw new Error(error.message);

      const total = issues.length;
      const resolved = issues.filter(i => i.status === 'resolved' || i.status === 'closed');
      const slaBreaches = issues.filter(i => i.sla_deadline && new Date(i.sla_deadline) < new Date() && !['resolved', 'closed'].includes(i.status));
      
      let avgResolution = 0;
      if (resolved.length > 0) {
        const totalHours = resolved.reduce((sum, i) => {
          if (i.resolved_at && i.created_at) {
            return sum + (new Date(i.resolved_at) - new Date(i.created_at)) / (1000 * 60 * 60);
          }
          return sum;
        }, 0);
        avgResolution = Math.round(totalHours / resolved.length);
      }

      return {
        total_issues: total,
        resolved_count: resolved.length,
        resolution_rate: total > 0 ? Math.round((resolved.length / total) * 100) : 0,
        avg_resolution_hours: avgResolution,
        sla_breaches: slaBreaches.length,
        sla_compliance: total > 0 ? Math.round(((total - slaBreaches.length) / total) * 100) : 100
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch department performance');
    }
  }

  /**
   * Get system-wide department statistics (for admin dashboard)
   */
  async getSystemDepartmentStats() {
    try {
      const departments = await this.getAllDepartments();
      const stats = [];
      for (const dept of departments) {
        try {
          const perf = await this.getDepartmentPerformance(dept.id, '30d');
          stats.push({ ...dept, performance: perf });
        } catch (e) {
          stats.push({ ...dept, performance: null });
        }
      }
      return stats;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch system department stats');
    }
  }
}

module.exports = new DepartmentService();