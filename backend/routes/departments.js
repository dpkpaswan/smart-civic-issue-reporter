const express = require('express');
const router = express.Router();
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const { validateDepartment, validateAssignment } = require('../middleware/validation');
const DepartmentService = require('../services/DepartmentService');
const AuditService = require('../services/AuditService');

// Apply authentication to all routes
router.use(authenticateToken);

/**
 * GET /api/departments
 * Get all departments with optional filtering
 * Access: Admin, Super Admin
 */
router.get('/', requireAnyRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { status, type, withStats = false } = req.query;
    const options = {
      status,
      type,
      includeStats: withStats === 'true'
    };
    
    const departments = await DepartmentService.getAllDepartments(options);
    
    res.json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch departments',
      message: error.message
    });
  }
});

/**
 * GET /api/departments/:id
 * Get specific department by ID
 * Access: Admin, Super Admin
 */
router.get('/:id', requireAnyRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const department = await DepartmentService.getDepartmentById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    res.json({
      success: true,
      data: department
    });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department',
      message: error.message
    });
  }
});

/**
 * POST /api/departments
 * Create new department
 * Access: Super Admin only
 */
router.post('/', requireAnyRole(['super_admin']), validateDepartment, async (req, res) => {
  try {
    const departmentData = {
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      contact_email: req.body.contactEmail,
      contact_phone: req.body.contactPhone,
      head_name: req.body.headName,
      categories: req.body.categories || [],
      sla_hours: req.body.slaHours || 72,
      escalation_hours: req.body.escalationHours || 168,
      location_coverage: req.body.locationCoverage || [],
      budget_allocated: req.body.budgetAllocated || 0,
      staff_count: req.body.staffCount || 0,
      status: 'active'
    };
    
    const department = await DepartmentService.createDepartment(departmentData);
    
    // Log creation
    await AuditService.logActivity({
      user_id: req.user.id,
      resource_type: 'department',
      resource_id: department.id,
      action_type: 'create',
      details: { department_name: department.name },
      ip_address: req.ip
    });
    
    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create department',
      message: error.message
    });
  }
});

/**
 * PUT /api/departments/:id
 * Update department
 * Access: Super Admin only
 */
router.put('/:id', requireAnyRole(['super_admin']), validateDepartment, async (req, res) => {
  try {
    const departmentData = {
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      contact_email: req.body.contactEmail,
      contact_phone: req.body.contactPhone,
      head_name: req.body.headName,
      categories: req.body.categories,
      sla_hours: req.body.slaHours,
      escalation_hours: req.body.escalationHours,
      location_coverage: req.body.locationCoverage,
      budget_allocated: req.body.budgetAllocated,
      staff_count: req.body.staffCount,
      status: req.body.status
    };
    
    const department = await DepartmentService.updateDepartment(req.params.id, departmentData);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    // Log update
    await AuditService.logActivity({
      user_id: req.user.id,
      resource_type: 'department',
      resource_id: req.params.id,
      action_type: 'update',
      details: departmentData,
      ip_address: req.ip
    });
    
    res.json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update department',
      message: error.message
    });
  }
});

/**
 * DELETE /api/departments/:id
 * Delete/deactivate department
 * Access: Super Admin only
 */
router.delete('/:id', requireAnyRole(['super_admin']), async (req, res) => {
  try {
    const success = await DepartmentService.deleteDepartment(req.params.id);
    
    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    // Log deletion
    await AuditService.logActivity({
      user_id: req.user.id,
      resource_type: 'department',
      resource_id: req.params.id,
      action_type: 'delete',
      ip_address: req.ip
    });
    
    res.json({
      success: true,
      message: 'Department deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete department',
      message: error.message
    });
  }
});

/**
 * PUT /api/departments/:id/status
 * Update department status
 * Access: Admin, Super Admin
 */
router.put('/:id/status', requireAnyRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive', 'maintenance'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: 'Status must be: active, inactive, or maintenance'
      });
    }
    
    const department = await DepartmentService.updateDepartmentStatus(req.params.id, status);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    // Log status change
    await AuditService.logActivity({
      user_id: req.user.id,
      resource_type: 'department',
      resource_id: req.params.id,
      action_type: 'status_update',
      details: { new_status: status },
      ip_address: req.ip
    });
    
    res.json({
      success: true,
      message: `Department status updated to ${status}`,
      data: department
    });
  } catch (error) {
    console.error('Error updating department status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update department status',
      message: error.message
    });
  }
});

/**
 * GET /api/departments/:id/issues
 * Get issues assigned to department
 * Access: Authority (own department), Admin, Super Admin
 */
router.get('/:id/issues', async (req, res) => {
  try {
    // Check if user has access to this department
    const userRole = req.user.role;
    const userDeptId = req.user.department_id;
    
    if (userRole === 'authority' && userDeptId !== req.params.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Can only view issues from your own department'
      });
    }
    
    const { status, priority, limit = 50, offset = 0 } = req.query;
    
    const issues = await DepartmentService.getDepartmentIssues(req.params.id, {
      status,
      priority,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      count: issues.length,
      data: issues
    });
  } catch (error) {
    console.error('Error fetching department issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department issues',
      message: error.message
    });
  }
});

/**
 * POST /api/departments/:id/assign-issue
 * Assign issue to department
 * Access: Admin, Super Admin
 */
router.post('/:id/assign-issue', requireAnyRole(['admin', 'super_admin']), validateAssignment, async (req, res) => {
  try {
    const { issue_id, priority, notes } = req.body;
    
    const assignment = await DepartmentService.assignIssueToDepartment(
      issue_id,
      req.params.id,
      {
        priority,
        notes,
        assigned_by: req.user.id
      }
    );
    
    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: 'Issue or department not found'
      });
    }
    
    // Log assignment
    await AuditService.logActivity({
      user_id: req.user.id,
      resource_type: 'issue',
      resource_id: issue_id,
      action_type: 'assign',
      details: { 
        department_id: req.params.id,
        priority,
        notes 
      },
      ip_address: req.ip
    });
    
    res.json({
      success: true,
      message: 'Issue assigned to department successfully',
      data: assignment
    });
  } catch (error) {
    console.error('Error assigning issue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign issue',
      message: error.message
    });
  }
});

/**
 * GET /api/departments/:id/performance
 * Get department performance metrics
 * Access: Authority (own department), Admin, Super Admin
 */
router.get('/:id/performance', async (req, res) => {
  try {
    // Check access permissions
    const userRole = req.user.role;
    const userDeptId = req.user.department_id;
    
    if (userRole === 'authority' && String(userDeptId) !== String(req.params.id)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Can only view performance of your own department'
      });
    }
    
    const { timeframe = '30d' } = req.query;
    
    const performance = await DepartmentService.getDepartmentPerformance(req.params.id, timeframe);
    
    res.json({
      success: true,
      data: performance
    });
  } catch (error) {
    console.error('Error fetching department performance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch department performance',
      message: error.message
    });
  }
});

/**
 * PUT /api/departments/:id/sla
 * Update department SLA settings
 * Access: Super Admin only
 */
router.put('/:id/sla', requireAnyRole(['super_admin']), async (req, res) => {
  try {
    const { sla_hours, escalation_hours } = req.body;
    
    if (sla_hours && (sla_hours < 1 || sla_hours > 720)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid SLA hours',
        message: 'SLA hours must be between 1 and 720 (30 days)'
      });
    }
    
    if (escalation_hours && (escalation_hours < sla_hours || escalation_hours > 2160)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid escalation hours',
        message: 'Escalation hours must be greater than SLA hours and less than 2160 (90 days)'
      });
    }
    
    const department = await DepartmentService.updateDepartment(req.params.id, {
      sla_hours,
      escalation_hours
    });
    
    if (!department) {
      return res.status(404).json({
        success: false,
        error: 'Department not found'
      });
    }
    
    // Log SLA update
    await AuditService.logActivity({
      user_id: req.user.id,
      resource_type: 'department',
      resource_id: req.params.id,
      action_type: 'sla_update',
      details: { sla_hours, escalation_hours },
      ip_address: req.ip
    });
    
    res.json({
      success: true,
      message: 'Department SLA updated successfully',
      data: department
    });
  } catch (error) {
    console.error('Error updating department SLA:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update department SLA',
      message: error.message
    });
  }
});

module.exports = router;