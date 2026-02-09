/**
 * Issue Service
 * Handles all issue-related operations with enhanced features
 */

const { supabase } = require('../config/database');
const DepartmentService = require('./DepartmentService');
const AIService = require('./AIService');
const AIClassificationService = require('./AIClassificationService');
const NotificationService = require('./NotificationService');
const AuditService = require('./AuditService');

class IssueService {
  constructor() {
    this.statusTransitions = {
      'submitted': ['assigned', 'in_progress', 'resolved', 'rejected'],
      'assigned': ['in_progress', 'resolved', 'rejected'],
      'in_progress': ['resolved', 'assigned', 'closed'],
      'resolved': ['closed', 'in_progress'],
      'closed': [],
      'rejected': ['submitted']
    };
  }

  /**
   * Create new issue with full processing pipeline
   */
  async createIssue(issueData, createdByUserId = null) {
    try {
      const {
        citizenName,
        citizenEmail,
        citizenPhone,
        category,
        subcategory,
        description,
        location,
        images = []
      } = issueData;

      // Generate unique issue ID
      const { count, error: countError } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        console.error('Error counting issues:', countError);
      }

      const issueId = `ISSUE-${String((count || 0) + 1).padStart(3, '0')}`;

      // Step 1: Enhanced AI Classification with Image Analysis
      let aiClassification = await AIService.classifyIssue({
        category,
        description,
        location,
        images
      });

      // Step 1.5: Image-based AI Classification using Gemini Vision API
      let imageClassification = null;
      if (images && images.length > 0) {
        try {
          // Get the first image for classification (can be enhanced to analyze all images)
          const primaryImagePath = images[0];
          imageClassification = await AIClassificationService.classifyIssueFromImage(
            primaryImagePath, 
            category
          );

          // Merge image classification with text-based classification
          aiClassification = this.mergeAIClassifications(aiClassification, imageClassification);
          
        } catch (imageError) {
          console.error('Image AI classification failed:', imageError.message);
          // Continue with text-based classification only
        }
      } else {
        // No images provided, using text-based classification only
      }

      // Step 2: Department routing and assignment
      const departmentAssignment = await DepartmentService.autoAssignIssue({
        issue_id: issueId,
        category: aiClassification.verified_category || category,
        location,
        priority: aiClassification.priority_level
      }, createdByUserId);

      // Step 3: Create issue record
      const newIssueData = {
        issue_id: issueId,
        citizen_name: citizenName,
        citizen_email: citizenEmail,
        citizen_phone: citizenPhone || null,
        category: aiClassification.verified_category || category,
        subcategory: subcategory || null,
        description: description || '',
        location: location,
        images: images,
        
        // AI and classification data
        severity_level: aiClassification.severity_level,
        priority: aiClassification.priority_level,
        confidence_score: aiClassification.confidence_score,
        ai_classification: aiClassification,
        
        // Enhanced AI Classification fields
        verified_category: aiClassification.verified_category || category,
        ai_explanation: aiClassification.ai_explanation || null,
        needs_review: aiClassification.needs_review || false,
        was_reclassified: aiClassification.was_reclassified || false,
        reclassification_event: aiClassification.reclassification_event || null,
        ai_processing_status: aiClassification.ai_processing_status || 'completed',
        ai_error: aiClassification.ai_error || null,
        processed_at: aiClassification.processed_at || new Date().toISOString(),
        
        // Department assignment
        assigned_department_id: departmentAssignment.assignment.assigned_department_id,
        assigned_to_user_id: departmentAssignment.assignment.assigned_to_user_id,
        sla_deadline: departmentAssignment.assignment.sla_deadline,
        routing_logs: departmentAssignment.assignment.routing_logs,
        
        // Status and timestamps
        status: 'assigned',
        status_history: [{
          timestamp: new Date().toISOString(),
          status: 'submitted',
          action: 'created',
          changed_by: 'system'
        }, {
          timestamp: new Date().toISOString(),
          status: 'assigned',
          action: 'auto_assigned',
          changed_by: 'system',
          department_id: departmentAssignment.assignment.assigned_department_id,
          user_id: departmentAssignment.assignment.assigned_to_user_id
        }],
        
        submitted_at: new Date().toISOString(),
        assigned_at: new Date().toISOString(),
        
        // Estimated resolution time (calculated by NotificationService)
        estimated_resolution_time: null,
        
        // Duplicate detection (text-based + image-based via Gemini)
        is_duplicate: aiClassification.duplicate_check?.is_potential_duplicate || false,
        duplicate_of_issue_id: (
          // Prefer image-detected duplicate if it matched
          aiClassification.duplicate_check?.image_duplicate?.matched_issue_id ||
          aiClassification.duplicate_check?.potential_duplicates?.[0]?.issue_id ||
          null
        )
      };

      let insertedIssue;
      let insertError;

      // Try full insert first
      ({ data: insertedIssue, error: insertError } = await supabase
        .from('issues')
        .insert([newIssueData])
        .select(`
          *,
          departments (id, name, code, contact_email),
          users!assigned_to_user_id (id, username, full_name, email)
        `)
        .single());

      // If insert fails due to missing enhanced AI columns, retry without them
      if (insertError && insertError.message?.includes('schema cache')) {
        console.warn('⚠️ Enhanced AI columns missing in DB, retrying without them...');
        const fallbackData = { ...newIssueData };
        delete fallbackData.verified_category;
        delete fallbackData.ai_explanation;
        delete fallbackData.needs_review;
        delete fallbackData.was_reclassified;
        delete fallbackData.reclassification_event;
        delete fallbackData.ai_processing_status;
        delete fallbackData.ai_error;
        delete fallbackData.processed_at;

        ({ data: insertedIssue, error: insertError } = await supabase
          .from('issues')
          .insert([fallbackData])
          .select(`
            *,
            departments (id, name, code, contact_email),
            users!assigned_to_user_id (id, username, full_name, email)
          `)
          .single());
      }

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Step 4: Calculate ETA and send notifications
      try {
        // Calculate smart ETA based on SLA + department workload + historical data
        const estimatedResolutionTime = await NotificationService.calculateETA({
          category: insertedIssue.category,
          assigned_department_id: departmentAssignment.assignment.assigned_department_id
        });

        // Store ETA in the issue record
        if (estimatedResolutionTime) {
          await supabase
            .from('issues')
            .update({ estimated_resolution_time: estimatedResolutionTime })
            .eq('issue_id', issueId);
          insertedIssue.estimated_resolution_time = estimatedResolutionTime;
        }

        await NotificationService.notifyIssueCreated({
          ...insertedIssue,
          assigned_department_id: departmentAssignment.assignment.assigned_department_id,
          estimated_resolution_time: estimatedResolutionTime
        });
      } catch (notificationError) {
        console.error('Notification failed:', notificationError.message);
        // Don't fail the whole operation due to notification failure
      }

      // Step 5: Audit logging
      await AuditService.log(
        'issue',
        issueId,
        'create',
        null,
        insertedIssue,
        createdByUserId,
        null,
        'Issue created with AI classification and auto-assignment'
      );

      // Transform response data
      const responseIssue = this.transformIssueData(insertedIssue);

      return {
        success: true,
        message: 'Issue created successfully',
        data: responseIssue,
        metadata: {
          ai_classification: aiClassification,
          department_assignment: {
            department: departmentAssignment.department.name,
            assigned_user: departmentAssignment.assignedUser?.full_name || 'Unassigned',
            sla_deadline: departmentAssignment.assignment.sla_deadline
          }
        }
      };
    } catch (error) {
      console.error('Error creating issue:', error);
      throw new Error(error.message || 'Failed to create issue');
    }
  }

  /**
   * Get issues with advanced filtering
   */
  async getIssues(filters = {}, userContext = null) {
    try {
      // Try query with joins first, fall back to simple select if relationships not found
      let useJoins = true;
      let query;

      const buildQuery = (withJoins) => {
        const selectStr = withJoins
          ? `*, departments (id, name, code), users!assigned_to_user_id (id, username, full_name)`
          : `*`;
        return supabase
          .from('issues')
          .select(selectStr, { count: 'exact' })
          .order('created_at', { ascending: false });
      };

      query = buildQuery(true);

      // Apply user-based filtering
      if (userContext) {
        query = this.applyUserContextFiltering(query, userContext);
      }

      // Apply standard filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }

      if (filters.severity && filters.severity !== 'all') {
        query = query.eq('severity_level', filters.severity);
      }

      if (filters.departmentId) {
        query = query.eq('assigned_department_id', filters.departmentId);
      }

      if (filters.assignedToUserId) {
        query = query.eq('assigned_to_user_id', filters.assignedToUserId);
      }

      if (filters.citizenEmail) {
        query = query.eq('citizen_email', filters.citizenEmail);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 20;
      const offset = (page - 1) * limit;

      query = query.range(offset, offset + limit - 1);

      let { data: issues, error, count } = await query;

      // Fallback: if join fails (relationship not in schema cache), retry without joins
      if (error && error.message && error.message.includes('relationship')) {
        console.warn('⚠️ Supabase join failed, falling back to simple query:', error.message);
        query = buildQuery(false);

        // Re-apply filters on the new query
        if (userContext) {
          query = this.applyUserContextFiltering(query, userContext);
        }
        if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
        if (filters.category && filters.category !== 'all') query = query.eq('category', filters.category);
        if (filters.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority);
        if (filters.severity && filters.severity !== 'all') query = query.eq('severity_level', filters.severity);
        if (filters.departmentId) query = query.eq('assigned_department_id', filters.departmentId);
        if (filters.assignedToUserId) query = query.eq('assigned_to_user_id', filters.assignedToUserId);
        if (filters.citizenEmail) query = query.eq('citizen_email', filters.citizenEmail);
        if (filters.startDate) query = query.gte('created_at', filters.startDate);
        if (filters.endDate) query = query.lte('created_at', filters.endDate);
        query = query.range(offset, offset + limit - 1);

        const fallbackResult = await query;
        issues = fallbackResult.data;
        error = fallbackResult.error;
        count = fallbackResult.count;
      }

      if (error) {
        throw new Error(error.message);
      }

      // Transform data
      const transformedIssues = issues.map(issue => this.transformIssueData(issue));

      return {
        success: true,
        data: transformedIssues,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch issues');
    }
  }

  /**
   * Get single issue by ID
   */
  async getIssueById(issueId, userContext = null) {
    try {
      const selectWithJoins = `*, departments (id, name, code, contact_email), users!assigned_to_user_id (id, username, full_name, email), resolved_by:users!resolved_by_user_id (id, username, full_name)`;

      let query = supabase
        .from('issues')
        .select(selectWithJoins)
        .eq('issue_id', issueId);

      // Apply user context filtering
      if (userContext) {
        query = this.applyUserContextFiltering(query, userContext);
      }

      let { data: issue, error } = await query.single();

      // Fallback without joins
      if (error && error.message && error.message.includes('relationship')) {
        console.warn('⚠️ Supabase join failed for getIssueById, falling back:', error.message);
        let fallbackQuery = supabase
          .from('issues')
          .select('*')
          .eq('issue_id', issueId);
        if (userContext) {
          fallbackQuery = this.applyUserContextFiltering(fallbackQuery, userContext);
        }
        const fb = await fallbackQuery.single();
        issue = fb.data;
        error = fb.error;
      }

      if (error) {
        throw new Error('Issue not found');
      }

      // Get audit logs for this issue
      const auditLogs = await AuditService.getIssueAuditLogs(issueId);

      const transformedIssue = this.transformIssueData(issue);
      transformedIssue.audit_logs = auditLogs;

      return {
        success: true,
        data: transformedIssue
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch issue');
    }
  }

  /**
   * Update issue status with validation and notifications
   */
  async updateIssueStatus(issueId, statusUpdate, updatedByUserId, userContext = null) {
    try {
      const { status, resolutionNotes, resolutionImages = [], estimatedResolutionTime } = statusUpdate;

      // Get current issue
      const currentIssueResult = await this.getIssueById(issueId, userContext);
      const currentIssue = currentIssueResult.data;

      // Validate status transition
      if (!this.isValidStatusTransition(currentIssue.status, status)) {
        throw new Error(`Invalid status transition from ${currentIssue.status} to ${status}`);
      }

      // Prepare update data
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      // Add status to history
      const statusChange = {
        timestamp: new Date().toISOString(),
        old_status: currentIssue.status,
        new_status: status,
        changed_by_user_id: updatedByUserId,
        notes: resolutionNotes
      };

      updateData.status_history = [...(currentIssue.status_history || []), statusChange];

      // Handle specific status updates
      switch (status) {
        case 'in_progress':
          updateData.in_progress_at = new Date().toISOString();
          if (estimatedResolutionTime) {
            updateData.estimated_resolution_time = estimatedResolutionTime;
          }
          break;

        case 'resolved':
          // Require at least one resolution image for resolved status
          if (!resolutionImages || resolutionImages.length === 0) {
            throw new Error('Resolution proof image is required to mark an issue as resolved. Please upload at least one photo showing the completed work.');
          }
          updateData.resolved_at = new Date().toISOString();
          updateData.actual_resolution_time = new Date().toISOString();
          updateData.resolved_by_user_id = updatedByUserId;
          if (resolutionNotes) {
            updateData.resolution_notes = resolutionNotes;
          }
          updateData.resolution_images = resolutionImages;
          break;

        case 'closed':
          updateData.closed_at = new Date().toISOString();
          break;
      }

      // Update in database
      const { data: updatedIssue, error } = await supabase
        .from('issues')
        .update(updateData)
        .eq('issue_id', issueId)
        .select(`
          *,
          departments (id, name, code),
          users!assigned_to_user_id (id, username, full_name),
          resolved_by:users!resolved_by_user_id (id, username, full_name)
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Send notifications
      try {
        await NotificationService.notifyStatusUpdate(
          updatedIssue,
          currentIssue.status,
          status,
          updatedByUserId
        );
      } catch (notificationError) {
        console.error('Status update notification failed:', notificationError.message);
      }

      // Audit log
      await AuditService.logIssueStatusChange(
        issueId,
        currentIssue.status,
        status,
        updatedByUserId,
        null,
        { resolution_notes: resolutionNotes }
      );

      return {
        success: true,
        message: `Issue status updated to ${status}`,
        data: this.transformIssueData(updatedIssue)
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to update issue status');
    }
  }

  /**
   * Submit citizen feedback
   */
  async submitCitizenFeedback(issueId, feedbackData, citizenEmail) {
    try {
      const { rating, comment } = feedbackData;

      // Verify issue exists and belongs to citizen
      const { data: issue, error } = await supabase
        .from('issues')
        .select('*')
        .eq('issue_id', issueId)
        .eq('citizen_email', citizenEmail)
        .single();

      if (error || !issue) {
        throw new Error('Issue not found or you are not authorized to provide feedback');
      }

      if (issue.status !== 'resolved' && issue.status !== 'closed') {
        throw new Error('Feedback can only be provided for resolved or closed issues');
      }

      // Update issue with feedback
      const { data: updatedIssue, error: updateError } = await supabase
        .from('issues')
        .update({
          citizen_feedback_rating: rating,
          citizen_feedback_comment: comment || null,
          citizen_feedback_at: new Date().toISOString()
        })
        .eq('issue_id', issueId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Audit log
      await AuditService.log(
        'issue',
        issueId,
        'feedback_submitted',
        null,
        { rating, comment },
        null,
        null,
        'Citizen feedback submitted'
      );

      // Update AI model with feedback (for future improvements)
      try {
        await AIService.updateModelBasedOnFeedback(
          issueId,
          issue.category,
          issue.severity_level,
          { rating, comment }
        );
      } catch (aiError) {
        console.error('AI feedback update failed:', aiError.message);
      }

      return {
        success: true,
        message: 'Feedback submitted successfully',
        data: {
          rating,
          comment,
          submitted_at: updatedIssue.citizen_feedback_at
        }
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to submit feedback');
    }
  }

  /**
   * Get issue statistics for dashboard
   */
  async getIssueStatistics(filters = {}, userContext = null) {
    try {
      // Base query with user context
      let baseQuery = supabase.from('issues').select('*');
      
      if (userContext) {
        baseQuery = this.applyUserContextFiltering(baseQuery, userContext);
      }

      // Apply time filter
      if (filters.timeframe) {
        const startDate = this.getTimeframeStartDate(filters.timeframe);
        baseQuery = baseQuery.gte('created_at', startDate.toISOString());
      }

      const { data: issues, error } = await baseQuery;

      if (error) {
        throw new Error(error.message);
      }

      // Calculate statistics
      const stats = {
        total_issues: issues.length,
        by_status: this.groupBy(issues, 'status'),
        by_category: this.groupBy(issues, 'category'),
        by_priority: this.groupBy(issues, 'priority'),
        by_severity: this.groupBy(issues, 'severity_level'),
        resolution_times: this.calculateResolutionTimes(issues),
        citizen_satisfaction: this.calculateCitizenSatisfaction(issues),
        sla_performance: this.calculateSLAPerformance(issues),
        trend_data: this.calculateTrendData(issues, filters.timeframe)
      };

      return {
        success: true,
        data: stats,
        timeframe: filters.timeframe || 'all_time'
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch statistics');
    }
  }

  /**
   * Helper methods
   */

  transformIssueData(issue) {
    return {
      id: issue.issue_id,
      citizenName: issue.citizen_name,
      citizenEmail: issue.citizen_email,
      citizenPhone: issue.citizen_phone,
      category: issue.category,
      subcategory: issue.subcategory,
      description: issue.description || '',
      location: issue.location,
      images: issue.images || [],
      status: issue.status,
      priority: issue.priority,
      severityLevel: issue.severity_level,
      confidenceScore: issue.confidence_score,
      assignedDepartment: issue.departments,
      assignedUser: issue.users,
      resolvedBy: issue.resolved_by,
      slaDeadline: issue.sla_deadline,
      estimatedResolutionTime: issue.estimated_resolution_time,
      actualResolutionTime: issue.actual_resolution_time,
      resolutionImages: issue.resolution_images || [],
      resolutionNotes: issue.resolution_notes || '',
      citizenFeedback: {
        rating: issue.citizen_feedback_rating,
        comment: issue.citizen_feedback_comment,
        submittedAt: issue.citizen_feedback_at
      },
      isDuplicate: issue.is_duplicate,
      duplicateOfIssueId: issue.duplicate_of_issue_id,
      aiClassification: issue.ai_classification,
      statusHistory: issue.status_history || [],
      routingLogs: issue.routing_logs || [],
      autoEscalated: issue.auto_escalated,
      escalationReason: issue.escalation_reason,
      submittedAt: issue.submitted_at,
      assignedAt: issue.assigned_at,
      inProgressAt: issue.in_progress_at,
      resolvedAt: issue.resolved_at,
      closedAt: issue.closed_at,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at
    };
  }

  applyUserContextFiltering(query, userContext) {
    if (!userContext) return query;

    switch (userContext.role) {
      case 'citizen':
        // Citizens can only see their own issues
        return query.eq('citizen_email', userContext.email);
      
      case 'authority':
        // Authorities can only see issues in their department
        if (userContext.department_id) {
          return query.eq('assigned_department_id', userContext.department_id);
        }
        break;
      
      case 'admin':
      case 'super_admin':
        // Admins can see all issues
        return query;
      
      default:
        // Unknown role, restrict to no access
        return query.eq('id', -1); // This will return no results
    }

    return query;
  }

  isValidStatusTransition(currentStatus, newStatus) {
    const allowedTransitions = this.statusTransitions[currentStatus] || [];
    return allowedTransitions.includes(newStatus);
  }

  getTimeframeStartDate(timeframe) {
    const now = new Date();
    switch (timeframe) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      case '90d':
        return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      default:
        return new Date(0); // Beginning of time
    }
  }

  groupBy(array, key) {
    return array.reduce((result, item) => {
      const group = item[key] || 'unknown';
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {});
  }

  calculateResolutionTimes(issues) {
    const resolvedIssues = issues.filter(issue => 
      issue.resolved_at && issue.submitted_at
    );

    if (resolvedIssues.length === 0) {
      return { average_hours: 0, median_hours: 0, count: 0 };
    }

    const resolutionTimes = resolvedIssues.map(issue => {
      const submitted = new Date(issue.submitted_at);
      const resolved = new Date(issue.resolved_at);
      return (resolved - submitted) / (1000 * 60 * 60); // Hours
    });

    const average = resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length;
    const sorted = resolutionTimes.sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    return {
      average_hours: Math.round(average * 100) / 100,
      median_hours: Math.round(median * 100) / 100,
      count: resolvedIssues.length
    };
  }

  calculateCitizenSatisfaction(issues) {
    const ratedIssues = issues.filter(issue => issue.citizen_feedback_rating);

    if (ratedIssues.length === 0) {
      return { average_rating: 0, total_ratings: 0, distribution: {} };
    }

    const ratings = ratedIssues.map(issue => issue.citizen_feedback_rating);
    const average = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    const distribution = this.groupBy(ratedIssues, 'citizen_feedback_rating');

    return {
      average_rating: Math.round(average * 100) / 100,
      total_ratings: ratedIssues.length,
      distribution
    };
  }

  calculateSLAPerformance(issues) {
    const issuesWithSLA = issues.filter(issue => issue.sla_deadline);
    
    if (issuesWithSLA.length === 0) {
      return { on_time: 0, overdue: 0, performance_rate: 0 };
    }

    let onTime = 0;
    let overdue = 0;

    issuesWithSLA.forEach(issue => {
      const deadline = new Date(issue.sla_deadline);
      const resolvedTime = issue.resolved_at ? new Date(issue.resolved_at) : new Date();
      
      if (resolvedTime <= deadline) {
        onTime++;
      } else {
        overdue++;
      }
    });

    return {
      on_time: onTime,
      overdue: overdue,
      performance_rate: Math.round((onTime / issuesWithSLA.length) * 100)
    };
  }

  calculateTrendData(issues, timeframe) {
    // Group issues by day/week/month based on timeframe
    const groupedData = {};
    
    issues.forEach(issue => {
      const date = new Date(issue.created_at);
      let key;
      
      switch (timeframe) {
        case '24h':
          key = date.getHours();
          break;
        case '7d':
          key = date.toISOString().split('T')[0]; // YYYY-MM-DD
          break;
        case '30d':
        case '90d':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = [];
      }
      groupedData[key].push(issue);
    });

    return Object.keys(groupedData).map(key => ({
      period: key,
      count: groupedData[key].length,
      resolved: groupedData[key].filter(i => i.status === 'resolved').length,
      in_progress: groupedData[key].filter(i => i.status === 'in_progress').length
    }));
  }

  /**
   * Merge image-based AI classification with text-based classification
   * @param {Object} textClassification - Result from keyword-based AI classification
   * @param {Object} imageClassification - Result from Gemini Vision API
   * @returns {Object} Merged classification result
   */
  mergeAIClassifications(textClassification, imageClassification) {
    try {
      // If no image classification, return text classification with enhanced fields
      if (!imageClassification) {
        return {
          ...textClassification,
          verified_category: textClassification.verified_category || textClassification.original_category,
          ai_explanation: 'Classification based on description and keywords only',
          needs_review: textClassification.confidence_score < 0.6,
          was_reclassified: false,
          reclassification_event: null,
          ai_processing_status: 'completed',
          processed_at: new Date().toISOString()
        };
      }

      // Prefer image classification for category and confidence
      const finalCategory = imageClassification.verified_category || 
                           textClassification.verified_category || 
                           textClassification.original_category;

      const finalConfidence = Math.max(
        imageClassification.confidence_score || 0,
        textClassification.confidence_score || 0
      );

      // Combine explanations
      const explanations = [];
      if (imageClassification.ai_explanation) {
        explanations.push(`Image Analysis: ${imageClassification.ai_explanation}`);
      }
      if (textClassification.classification_details?.description_analysis) {
        explanations.push('Text analysis completed');
      }

      return {
        ...textClassification,
        
        // Use image classification results as primary
        verified_category: finalCategory,
        confidence_score: finalConfidence,
        ai_explanation: explanations.join('; ') || imageClassification.ai_explanation,
        needs_review: imageClassification.needs_review || finalConfidence < 0.6,
        was_reclassified: imageClassification.was_reclassified || false,
        reclassification_event: imageClassification.reclassification_event || null,
        ai_processing_status: imageClassification.ai_processing_status || 'completed',
        ai_error: imageClassification.ai_error || null,
        processed_at: imageClassification.processed_at || new Date().toISOString(),

        // Enhanced classification details
        classification_details: {
          ...textClassification.classification_details,
          image_analysis: {
            used_gemini_vision: true,
            image_confidence: imageClassification.confidence_score,
            image_category: imageClassification.verified_category,
            explanation: imageClassification.ai_explanation
          },
          final_decision: {
            method: 'image_priority',
            image_weight: 0.8,
            text_weight: 0.2,
            final_confidence: finalConfidence
          }
        }
      };
    } catch (error) {
      console.error('Error merging AI classifications:', error);
      
      // Return text classification with error info
      return {
        ...textClassification,
        ai_processing_status: 'partial_failure',
        ai_error: `Classification merge failed: ${error.message}`,
        processed_at: new Date().toISOString()
      };
    }
  }

  /**
   * Get system-wide statistics (for admin dashboard)
   */
  async getSystemStatistics(timeframe = '30d') {
    try {
      const days = parseInt(timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: issues, error } = await supabase
        .from('issues')
        .select('status, priority, category, created_at, resolved_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw new Error(error.message);

      const total = issues.length;
      const active = issues.filter(i => !['resolved', 'closed', 'rejected'].includes(i.status)).length;
      const resolved = issues.filter(i => i.status === 'resolved' || i.status === 'closed').length;
      const critical = issues.filter(i => i.priority === 'critical').length;

      // Trends: group by date
      const trends = {};
      issues.forEach(i => {
        const date = new Date(i.created_at).toISOString().split('T')[0];
        trends[date] = (trends[date] || 0) + 1;
      });

      return { total, active, resolved, critical, trends };
    } catch (error) {
      throw new Error(error.message || 'Failed to get system statistics');
    }
  }

  /**
   * Get system performance metrics (for admin dashboard)
   */
  async getSystemPerformanceMetrics(timeframe = '30d') {
    try {
      const days = parseInt(timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data: issues, error } = await supabase
        .from('issues')
        .select('status, created_at, resolved_at, sla_deadline, citizen_feedback_rating')
        .gte('created_at', startDate.toISOString());

      if (error) throw new Error(error.message);

      // Average resolution time
      const resolvedIssues = issues.filter(i => i.resolved_at && i.created_at);
      let avgResolutionTime = 0;
      if (resolvedIssues.length > 0) {
        const totalHours = resolvedIssues.reduce((sum, i) => {
          return sum + (new Date(i.resolved_at) - new Date(i.created_at)) / (1000 * 60 * 60);
        }, 0);
        avgResolutionTime = Math.round((totalHours / resolvedIssues.length) * 10) / 10;
      }

      // SLA compliance
      const slaIssues = issues.filter(i => i.sla_deadline);
      const slaBreaches = slaIssues.filter(i => 
        new Date(i.sla_deadline) < new Date() && !['resolved', 'closed'].includes(i.status)
      );
      const slaCompliance = slaIssues.length > 0 
        ? Math.round(((slaIssues.length - slaBreaches.length) / slaIssues.length) * 100) 
        : 100;

      // User satisfaction
      const rated = issues.filter(i => i.citizen_feedback_rating);
      const userSatisfaction = rated.length > 0 
        ? Math.round((rated.reduce((s, i) => s + i.citizen_feedback_rating, 0) / rated.length) * 10) / 10
        : 0;

      return {
        avg_resolution_time: `${avgResolutionTime}h`,
        sla_compliance: slaCompliance,
        user_satisfaction: userSatisfaction,
        total_resolved: resolvedIssues.length,
        sla_breaches: slaBreaches.length
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to get performance metrics');
    }
  }

  /**
   * Get detailed analytics (for admin analytics page)
   */
  async getDetailedAnalytics({ timeframe = '30d', category = 'all', department = 'all', granularity = 'daily' }) {
    try {
      const days = parseInt(timeframe) || 30;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = supabase
        .from('issues')
        .select('status, priority, category, assigned_department_id, created_at, resolved_at')
        .gte('created_at', startDate.toISOString());

      if (category !== 'all') query = query.eq('category', category);
      if (department !== 'all') query = query.eq('assigned_department_id', department);

      const { data: issues, error } = await query;
      if (error) throw new Error(error.message);

      // Group by category
      const byCategory = {};
      const byStatus = {};
      const byPriority = {};
      const timeline = {};

      issues.forEach(issue => {
        byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
        byStatus[issue.status] = (byStatus[issue.status] || 0) + 1;
        byPriority[issue.priority] = (byPriority[issue.priority] || 0) + 1;

        const dateKey = granularity === 'daily'
          ? new Date(issue.created_at).toISOString().split('T')[0]
          : `Week ${Math.ceil(new Date(issue.created_at).getDate() / 7)}`;
        timeline[dateKey] = (timeline[dateKey] || 0) + 1;
      });

      return {
        total: issues.length,
        by_category: byCategory,
        by_status: byStatus,
        by_priority: byPriority,
        timeline
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to get detailed analytics');
    }
  }
}

module.exports = new IssueService();