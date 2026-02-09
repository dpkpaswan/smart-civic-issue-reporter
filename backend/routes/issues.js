const express = require('express');
const IssueService = require('../services/IssueService');
const DepartmentService = require('../services/DepartmentService');
const { validate, issueSchemas, querySchemas } = require('../middleware/validation');
const { 
  authenticateToken, 
  optionalAuth,
  requireRole, 
  requireAnyRole,
  requireDepartmentAccess,
  requireOwnership,
  getClientIP 
} = require('../middleware/auth');
const { issueCreationLimiter, spamDetection } = require('../middleware/security');

const router = express.Router();

// Normalize status values: convert hyphens to underscores for DB compatibility
function normalizeStatus(status) {
  if (!status) return status;
  return status.replace(/-/g, '_');
}

// Shared handler for PUT/PATCH /:id/status
async function statusUpdateHandler(req, res) {
  try {
    // Robust body extraction — handle missing or malformed body
    const body = req.body || {};
    const status = body.status;

    if (!status) {
      return res.status(400).json({
        success: false,
        error: 'Status is required',
        message: 'Please provide a status value'
      });
    }

    const validStatuses = ['submitted', 'assigned', 'in_progress', 'in-progress', 'resolved', 'closed', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status value',
        message: `Status must be one of: ${validStatuses.join(', ')}. Received: "${status}"`
      });
    }

    // Normalize status value (frontend sends 'in-progress', DB expects 'in_progress')
    const normalizedStatus = normalizeStatus(status);
    
    const statusUpdate = {
      status: normalizedStatus,
      resolutionNotes: body.resolutionNotes || body.notes || '',
      resolutionImages: body.resolutionImages || [],
      estimatedResolutionTime: body.estimatedResolutionTime
    };

    const result = await IssueService.updateIssueStatus(
      req.params.id,
      statusUpdate,
      req.user.id,
      req.user
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error updating issue status:', error);
    res.status(400).json({
      success: false,
      error: 'Failed to update issue status',
      message: error.message
    });
  }
}

// GET /api/issues/success-stories - Get resolved issues with before/after images
router.get('/success-stories',
  async (req, res) => {
    try {
      const { supabase } = require('../config/database');
      const limit = Math.min(parseInt(req.query.limit) || 10, 30);

      const { data: issues, error } = await supabase
        .from('issues')
        .select(`
          *,
          departments (id, name, code),
          resolved_by:users!resolved_by_user_id (id, username, full_name)
        `)
        .eq('status', 'resolved')
        .not('resolution_images', 'eq', '{}')
        .not('images', 'eq', '{}')
        .order('resolved_at', { ascending: false })
        .limit(limit);

      if (error) throw new Error(error.message);

      const stories = (issues || [])
        .filter(i => i.resolution_images?.length > 0 && i.images?.length > 0)
        .map(issue => ({
          id: issue.issue_id,
          category: issue.category,
          description: issue.description || '',
          location: issue.location,
          beforeImage: issue.images[0],
          afterImage: issue.resolution_images[0],
          allBeforeImages: issue.images,
          allAfterImages: issue.resolution_images,
          resolutionNotes: issue.resolution_notes || '',
          reportedDate: issue.submitted_at || issue.created_at,
          resolvedDate: issue.resolved_at,
          authority: issue.resolved_by?.full_name || issue.departments?.name || 'Municipal Authority',
          department: issue.departments?.name || null,
          priority: issue.priority || 'medium'
        }));

      res.json({ success: true, data: stories, count: stories.length });
    } catch (error) {
      console.error('Error fetching success stories:', error);
      res.status(500).json({ success: false, error: 'Failed to fetch success stories', message: error.message });
    }
  }
);

// GET /api/issues/public - Public transparency endpoint
// Returns ALL issues (no auth / department filtering) with sensitive citizen data stripped
router.get('/public',
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        category: req.query.category,
        priority: req.query.priority,
        page: parseInt(req.query.page) || 1,
        limit: Math.min(parseInt(req.query.limit) || 50, 100) // Allow up to 100 for public page
      };

      // Fetch issues WITHOUT userContext so no department filtering is applied
      const result = await IssueService.getIssues(filters, null);

      // Strip sensitive citizen data for public display
      if (result.data) {
        result.data = result.data.map(issue => ({
          ...issue,
          citizenName: issue.citizenName
            ? issue.citizenName.split(' ')[0] + (issue.citizenName.split(' ').length > 1 ? ' ' + issue.citizenName.split(' ').slice(-1)[0][0] + '.' : '')
            : 'Anonymous',
          citizenEmail: undefined,
          citizenPhone: undefined,
          routingLogs: undefined,
          aiClassification: undefined
        }));
      }

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error fetching public issues:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch public issues',
        message: error.message
      });
    }
  }
);

// GET /api/issues - Get all issues with advanced filtering
router.get('/', 
  optionalAuth, // Allow both authenticated and public access
  validate(querySchemas.issueFilters, 'query'),
  async (req, res) => {
    try {
      const filters = {
        status: req.query.status,
        category: req.query.category,
        priority: req.query.priority,
        severity: req.query.severity,
        departmentId: req.query.departmentId ? parseInt(req.query.departmentId) : undefined,
        assignedToUserId: req.query.assignedToUserId ? parseInt(req.query.assignedToUserId) : undefined,
        citizenEmail: req.query.citizenEmail,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await IssueService.getIssues(filters, req.user);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error fetching issues:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch issues',
        message: error.message
      });
    }
  }
);

// GET /api/issues/statistics - Get issue statistics for dashboard
router.get('/statistics',
  authenticateToken,
  requireAnyRole(['authority', 'admin', 'super_admin']),
  async (req, res) => {
    try {
      const timeframe = req.query.timeframe || '30d';
      const result = await IssueService.getIssueStatistics({ timeframe }, req.user);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
        message: error.message
      });
    }
  }
);

// GET /api/issues/:id - Get specific issue by ID
router.get('/:id',
  optionalAuth,
  async (req, res) => {
    try {
      const result = await IssueService.getIssueById(req.params.id, req.user);
      
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('Error fetching issue:', error);
      res.status(404).json({
        success: false,
        error: 'Issue not found',
        message: error.message
      });
    }
  }
);

// POST /api/issues - Create new issue with AI classification and auto-assignment
router.post('/',
  issueCreationLimiter,
  spamDetection,
  validate(issueSchemas.create),
  optionalAuth, // Allow anonymous issue creation
  async (req, res) => {
    try {
      const issueData = {
        citizenName: req.body.citizenName,
        citizenEmail: req.body.citizenEmail,
        citizenPhone: req.body.citizenPhone,
        category: req.body.category,
        subcategory: req.body.subcategory,
        description: req.body.description,
        location: req.body.location,
        images: req.body.images || []
      };

      const result = await IssueService.createIssue(issueData, req.user?.id);
      
      res.status(201).json({
        success: true,
        message: 'Issue created and processed successfully',
        ...result
      });
    } catch (error) {
      console.error('Error creating issue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create issue',
        message: error.message
      });
    }
  }
);

// PUT /api/issues/:id/status - Update issue status
router.put('/:id/status',
  authenticateToken,
  requireAnyRole(['authority', 'admin', 'super_admin']),
  statusUpdateHandler
);

// PATCH alias for frontend compatibility
router.patch('/:id/status',
  authenticateToken,
  requireAnyRole(['authority', 'admin', 'super_admin']),
  statusUpdateHandler
);

// PATCH /api/issues/:id/priority - Update issue priority
router.patch('/:id/priority',
  authenticateToken,
  requireAnyRole(['authority', 'admin', 'super_admin']),
  async (req, res) => {
    try {
      const { priority } = req.body;
      const validPriorities = ['low', 'medium', 'high', 'critical'];

      if (!priority || !validPriorities.includes(priority)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid priority',
          message: `Priority must be one of: ${validPriorities.join(', ')}`
        });
      }

      const { supabase } = require('../config/database');
      const AuditService = require('../services/AuditService');

      const { data: updatedIssue, error } = await supabase
        .from('issues')
        .update({ priority, updated_at: new Date().toISOString() })
        .eq('issue_id', req.params.id)
        .select()
        .single();

      if (error || !updatedIssue) {
        return res.status(404).json({
          success: false,
          error: 'Issue not found',
          message: `Issue with ID ${req.params.id} does not exist`
        });
      }

      await AuditService.log(
        'issue', req.params.id, 'priority_update',
        null, { priority },
        req.user.id, getClientIP(req),
        `Priority updated to ${priority}`
      );

      res.json({
        success: true,
        message: `Issue priority updated to ${priority}`,
        data: updatedIssue
      });
    } catch (error) {
      console.error('Error updating issue priority:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update issue priority',
        message: error.message
      });
    }
  }
);

// PUT /api/issues/:id/assign - Manually assign issue to department/user
router.put('/:id/assign',
  authenticateToken,
  requireAnyRole(['admin', 'super_admin']),
  validate(issueSchemas.assignment),
  async (req, res) => {
    try {
      const { departmentId, userId, assignmentReason } = req.body;
      
      const result = await DepartmentService.manualAssignIssue(
        req.params.id,
        departmentId,
        userId,
        req.user.id,
        assignmentReason
      );
      
      res.json({
        success: true,
        message: 'Issue assigned successfully',
        data: result
      });
    } catch (error) {
      console.error('Error assigning issue:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to assign issue',
        message: error.message
      });
    }
  }
);

// PUT /api/issues/:id/reassign - Reassign issue to different department/user
router.put('/:id/reassign',
  authenticateToken,
  requireAnyRole(['admin', 'super_admin']),
  async (req, res) => {
    try {
      const { newDepartmentId, newUserId, reassignmentReason } = req.body;
      
      if (!newDepartmentId || !reassignmentReason) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'New department ID and reassignment reason are required'
        });
      }
      
      const result = await DepartmentService.reassignIssue(
        req.params.id,
        newDepartmentId,
        newUserId,
        req.user.id,
        reassignmentReason
      );
      
      res.json({
        success: true,
        message: 'Issue reassigned successfully',
        data: result
      });
    } catch (error) {
      console.error('Error reassigning issue:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to reassign issue',
        message: error.message
      });
    }
  }
);

// POST /api/issues/:id/feedback - Submit citizen feedback
router.post('/:id/feedback',
  validate(issueSchemas.feedback),
  async (req, res) => {
    try {
      const { rating, comment } = req.body;
      const { citizenEmail } = req.query; // Email verification for anonymous feedback
      
      if (!citizenEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing citizen email',
          message: 'Citizen email is required for feedback verification'
        });
      }

      const feedbackData = { rating, comment };
      
      const result = await IssueService.submitCitizenFeedback(
        req.params.id,
        feedbackData,
        citizenEmail
      );
      
      res.json({
        success: true,
        message: 'Feedback submitted successfully',
        ...result
      });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      res.status(400).json({
        success: false,
        error: 'Failed to submit feedback',
        message: error.message
      });
    }
  }
);

// GET /api/issues/:id/audit-logs - Get audit logs for specific issue
router.get('/:id/audit-logs',
  authenticateToken,
  requireAnyRole(['authority', 'admin', 'super_admin']),
  async (req, res) => {
    try {
      const AuditService = require('../services/AuditService');
      const auditLogs = await AuditService.getIssueAuditLogs(req.params.id);
      
      res.json({
        success: true,
        data: auditLogs,
        count: auditLogs.length
      });
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit logs',
        message: error.message
      });
    }
  }
);

// GET /api/issues/my/dashboard - Get citizen's personal issue dashboard
router.get('/my/dashboard',
  async (req, res) => {
    try {
      const { citizenEmail } = req.query;
      
      if (!citizenEmail) {
        return res.status(400).json({
          success: false,
          error: 'Missing citizen email',
          message: 'Citizen email is required'
        });
      }

      const filters = {
        citizenEmail,
        page: 1,
        limit: 100 // Get more for dashboard
      };

      const issues = await IssueService.getIssues(filters);
      
      // Calculate dashboard statistics
      const resolvedIssues = issues.data.filter(i => i.resolvedAt && i.submittedAt);
      let avgResolutionDays = 0;
      if (resolvedIssues.length > 0) {
        const totalDays = resolvedIssues.reduce((sum, i) => {
          return sum + (new Date(i.resolvedAt) - new Date(i.submittedAt)) / (1000 * 60 * 60 * 24);
        }, 0);
        avgResolutionDays = Math.round((totalDays / resolvedIssues.length) * 10) / 10;
      }

      const stats = {
        total: issues.data.length,
        submitted: issues.data.filter(i => i.status === 'submitted').length,
        assigned: issues.data.filter(i => i.status === 'assigned').length,
        in_progress: issues.data.filter(i => i.status === 'in_progress').length,
        resolved: issues.data.filter(i => i.status === 'resolved').length,
        closed: issues.data.filter(i => i.status === 'closed').length,
        recent_issues: issues.data.slice(0, 5), // Last 5 issues
        avg_resolution_days: avgResolutionDays
      };
      
      res.json({
        success: true,
        data: {
          statistics: stats,
          recent_issues: issues.data.slice(0, 10),
          total_issues: issues.data.length
        }
      });
    } catch (error) {
      console.error('Error fetching citizen dashboard:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch dashboard data',
        message: error.message
      });
    }
  }
);

// PUT /api/issues/:id - Update issue (Admin only for most fields)
router.put('/:id',
  authenticateToken,
  requireAnyRole(['admin', 'super_admin']),
  validate(issueSchemas.update),
  async (req, res) => {
    try {
      // Get current issue first (for audit trail)
      const currentIssue = await IssueService.getIssueById(req.params.id, req.user);
      
      if (!currentIssue.success) {
        return res.status(404).json(currentIssue);
      }

      // Handle status updates specially
      if (req.body.status && req.body.status !== currentIssue.data.status) {
        const result = await IssueService.updateIssueStatus(
          req.params.id,
          { status: req.body.status, resolutionNotes: req.body.resolutionNotes },
          req.user.id,
          req.user
        );
        return res.json({
          success: true,
          message: 'Issue status updated',
          data: result
        });
      }

      // For other updates, use direct database update
      const { supabase } = require('../config/database');
      const AuditService = require('../services/AuditService');
      
      const { data: updatedIssue, error } = await supabase
        .from('issues')
        .update(req.body)
        .eq('issue_id', req.params.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Audit log
      await AuditService.log(
        'issue',
        req.params.id,
        'update',
        currentIssue.data,
        updatedIssue,
        req.user.id,
        getClientIP(req),
        'Issue updated by admin'
      );

      res.json({
        success: true,
        message: 'Issue updated successfully',
        data: IssueService.transformIssueData ? IssueService.transformIssueData(updatedIssue) : updatedIssue
      });
    } catch (error) {
      console.error('Error updating issue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update issue',
        message: error.message
      });
    }
  }
);

// DELETE /api/issues/:id - Delete issue (Super admin only, soft delete)
router.delete('/:id',
  authenticateToken,
  requireRole('super_admin'),
  async (req, res) => {
    try {
      const { supabase } = require('../config/database');
      const AuditService = require('../services/AuditService');
      
      // Soft delete by setting status to rejected
      const { data: deletedIssue, error } = await supabase
        .from('issues')
        .update({ 
          status: 'rejected',
          resolution_notes: 'Deleted by administrator',
          updated_at: new Date().toISOString()
        })
        .eq('issue_id', req.params.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Audit log
      await AuditService.log(
        'issue',
        req.params.id,
        'delete',
        null,
        { status: 'rejected' },
        req.user.id,
        getClientIP(req),
        'Issue deleted by super admin'
      );

      res.json({
        success: true,
        message: 'Issue deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting issue:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete issue',
        message: error.message
      });
    }
  }
);

module.exports = router;