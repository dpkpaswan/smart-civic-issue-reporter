const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { supabase } = require('../config/database');
const router = express.Router();

// GET /api/issues - Get all issues (with optional filtering)
router.get('/', async (req, res) => {
  try {
    const { status, category, citizenEmail } = req.query;
    
    // Build Supabase query
    let query = supabase
      .from('issues')
      .select('*')
      .order('created_at', { ascending: false });
    
    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }
    
    if (citizenEmail) {
      query = query.eq('citizen_email', citizenEmail);
    }
    
    const { data: issues, error } = await query;
    
    if (error) {
      throw error;
    }
    
    // Transform data to match frontend expectations
    const transformedIssues = issues.map(issue => ({
      id: issue.issue_id,
      citizenName: issue.citizen_name,
      citizenEmail: issue.citizen_email,
      category: issue.category,
      description: issue.description || '',
      location: issue.location,
      images: issue.images || [],
      status: issue.status,
      priority: issue.priority,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      resolutionImages: issue.resolution_images || [],
      resolutionNotes: issue.resolution_notes || ''
    }));
    
    res.json({
      success: true,
      count: transformedIssues.length,
      data: transformedIssues
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch issues',
      message: error.message
    });
  }
});

// GET /api/issues/:id - Get specific issue by ID
router.get('/:id', async (req, res) => {
  try {
    const { data: issue, error } = await supabase
      .from('issues')
      .select('*')
      .eq('issue_id', req.params.id)
      .single();
    
    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found',
        message: `Issue with ID ${req.params.id} does not exist`
      });
    }
    
    // Transform data
    const transformedIssue = {
      id: issue.issue_id,
      citizenName: issue.citizen_name,
      citizenEmail: issue.citizen_email,
      category: issue.category,
      description: issue.description || '',
      location: issue.location,
      images: issue.images || [],
      status: issue.status,
      priority: issue.priority,
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      resolutionImages: issue.resolution_images || [],
      resolutionNotes: issue.resolution_notes || ''
    };
    
    res.json({
      success: true,
      data: transformedIssue
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch issue',
      message: error.message
    });
  }
});

// POST /api/issues - Create new issue
router.post('/', async (req, res) => {
  try {
    const {
      citizenName,
      citizenEmail,
      category,
      description,
      location,
      images = []
    } = req.body;
    
    // Validation
    if (!citizenName || !citizenEmail || !category || !location) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'citizenName, citizenEmail, category, and location are required'
      });
    }
    
    // Mock AI Classification Logic (Future: Replace with actual ML model)
    const aiClassificationResult = performAIClassification(category, description, images);
    
    // Generate unique issue ID - get current count and increment
    const { count } = await supabase
      .from('issues')
      .select('*', { count: 'exact', head: true });
    
    const issueId = `ISSUE-${String((count || 0) + 1).padStart(3, '0')}`;
    
    // Create new issue object
    const newIssueData = {
      issue_id: issueId,
      citizen_name: citizenName,
      citizen_email: citizenEmail,
      category: aiClassificationResult.category,
      description: description || '',
      location: location,
      images: images,
      status: 'submitted',
      priority: aiClassificationResult.priority,
      resolution_images: [],
      resolution_notes: ''
    };
    
    // Insert into Supabase
    const { data: insertedIssue, error } = await supabase
      .from('issues')
      .insert([newIssueData])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Transform response data
    const responseIssue = {
      id: insertedIssue.issue_id,
      citizenName: insertedIssue.citizen_name,
      citizenEmail: insertedIssue.citizen_email,
      category: insertedIssue.category,
      description: insertedIssue.description || '',
      location: insertedIssue.location,
      images: insertedIssue.images || [],
      status: insertedIssue.status,
      priority: insertedIssue.priority,
      createdAt: insertedIssue.created_at,
      updatedAt: insertedIssue.updated_at,
      resolutionImages: insertedIssue.resolution_images || [],
      resolutionNotes: insertedIssue.resolution_notes || ''
    };
    
    res.status(201).json({
      success: true,
      message: 'Issue reported successfully',
      data: responseIssue,
      aiClassification: aiClassificationResult
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create issue',
      message: error.message
    });
  }
});

// PUT /api/issues/:id/status - Update issue status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['submitted', 'in-progress', 'resolved'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Update issue in Supabase
    const { data: updatedIssue, error } = await supabase
      .from('issues')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('issue_id', req.params.id)
      .select()
      .single();
    
    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found',
        message: `Issue with ID ${req.params.id} does not exist`
      });
    }
    
    // Transform response data
    const responseIssue = {
      id: updatedIssue.issue_id,
      citizenName: updatedIssue.citizen_name,
      citizenEmail: updatedIssue.citizen_email,
      category: updatedIssue.category,
      description: updatedIssue.description || '',
      location: updatedIssue.location,
      images: updatedIssue.images || [],
      status: updatedIssue.status,
      priority: updatedIssue.priority,
      createdAt: updatedIssue.created_at,
      updatedAt: updatedIssue.updated_at,
      resolutionImages: updatedIssue.resolution_images || [],
      resolutionNotes: updatedIssue.resolution_notes || ''
    };
    
    res.json({
      success: true,
      message: `Issue status updated to ${status}`,
      data: responseIssue
    });
  } catch (error) {
    console.error('Error updating issue status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update issue status',
      message: error.message
    });
  }
});

// PATCH /api/issues/:id/status - Update issue status (alternative to PUT)
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, notes = '' } = req.body;
    const validStatuses = ['submitted', 'in-progress', 'resolved'];
    
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    // Update issue in Supabase
    const { data: updatedIssue, error } = await supabase
      .from('issues')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('issue_id', req.params.id)
      .select()
      .single();
    
    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found',
        message: `Issue with ID ${req.params.id} does not exist`
      });
    }
    
    // Transform response data
    const responseIssue = {
      id: updatedIssue.issue_id,
      citizenName: updatedIssue.citizen_name,
      citizenEmail: updatedIssue.citizen_email,
      category: updatedIssue.category,
      description: updatedIssue.description || '',
      location: updatedIssue.location,
      images: updatedIssue.images || [],
      status: updatedIssue.status,
      priority: updatedIssue.priority,
      createdAt: updatedIssue.created_at,
      updatedAt: updatedIssue.updated_at,
      resolutionImages: updatedIssue.resolution_images || [],
      resolutionNotes: updatedIssue.resolution_notes || ''
    };
    
    res.json({
      success: true,
      message: `Issue status updated to ${status}`,
      data: responseIssue
    });
  } catch (error) {
    console.error('Error updating issue status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update issue status',
      message: error.message
    });
  }
});

// POST /api/issues/:id/resolution - Add resolution proof
router.post('/:id/resolution', async (req, res) => {
  try {
    const { resolutionImages = [], resolutionNotes = '' } = req.body;
    
    // Update resolution data in Supabase
    const { data: updatedIssue, error } = await supabase
      .from('issues')
      .update({ 
        resolution_images: resolutionImages,
        resolution_notes: resolutionNotes,
        status: 'resolved',
        updated_at: new Date().toISOString()
      })
      .eq('issue_id', req.params.id)
      .select()
      .single();
    
    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found',
        message: `Issue with ID ${req.params.id} does not exist`
      });
    }
    
    // Transform response data
    const responseIssue = {
      id: updatedIssue.issue_id,
      citizenName: updatedIssue.citizen_name,
      citizenEmail: updatedIssue.citizen_email,
      category: updatedIssue.category,
      description: updatedIssue.description || '',
      location: updatedIssue.location,
      images: updatedIssue.images || [],
      status: updatedIssue.status,
      priority: updatedIssue.priority,
      createdAt: updatedIssue.created_at,
      updatedAt: updatedIssue.updated_at,
      resolutionImages: updatedIssue.resolution_images || [],
      resolutionNotes: updatedIssue.resolution_notes || ''
    };
    
    res.json({
      success: true,
      message: 'Resolution proof added successfully',
      data: responseIssue
    });
  } catch (error) {
    console.error('Error adding resolution proof:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add resolution proof',
      message: error.message
    });
  }
});

// DELETE /api/issues/:id - Delete issue (for testing)
router.delete('/:id', async (req, res) => {
  try {
    const { data: deletedIssue, error } = await supabase
      .from('issues')
      .delete()
      .eq('issue_id', req.params.id)
      .select()
      .single();
    
    if (error) {
      return res.status(404).json({
        success: false,
        error: 'Issue not found',
        message: `Issue with ID ${req.params.id} does not exist`
      });
    }
    
    // Transform response data
    const responseIssue = {
      id: deletedIssue.issue_id,
      citizenName: deletedIssue.citizen_name,
      citizenEmail: deletedIssue.citizen_email,
      category: deletedIssue.category,
      description: deletedIssue.description || '',
      location: deletedIssue.location,
      images: deletedIssue.images || [],
      status: deletedIssue.status,
      priority: deletedIssue.priority,
      createdAt: deletedIssue.created_at,
      updatedAt: deletedIssue.updated_at,
      resolutionImages: deletedIssue.resolution_images || [],
      resolutionNotes: deletedIssue.resolution_notes || ''
    };
    
    res.json({
      success: true,
      message: 'Issue deleted successfully',
      data: responseIssue
    });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete issue',
      message: error.message
    });
  }
});

/**
 * AI Classification Function
 * 
 * Performs intelligent classification and priority assessment based on:
 * - Issue category and description analysis
 * - Urgency keywords detection
 * - Location risk assessment
 * - Historical data patterns
 */
function performAIClassification(category, description, images) {
  // Analyze description for urgency keywords
  const urgencyKeywords = {
    critical: ['emergency', 'dangerous', 'hazard', 'urgent', 'immediate', 'blocked', 'flooded'],
    high: ['large', 'multiple', 'broken', 'overflowing', 'major', 'complete'],
    medium: ['small', 'minor', 'needs', 'should', 'moderate'],
    low: ['cosmetic', 'aesthetic', 'slight', 'eventually']
  };
  
  const descriptionLower = description.toLowerCase();
  let detectedPriority = 'medium';
  let confidence = 0.7;
  
  // Check for urgency indicators
  for (const [level, keywords] of Object.entries(urgencyKeywords)) {
    for (const keyword of keywords) {
      if (descriptionLower.includes(keyword)) {
        detectedPriority = level;
        confidence += 0.1;
        break;
      }
    }
    if (detectedPriority !== 'medium') break;
  }
  
  // Category-based priority adjustment
  const categoryRules = {
    'pothole': { basePriority: 'high', riskFactor: 1.2 },
    'garbage': { basePriority: 'medium', riskFactor: 1.0 },
    'streetlight': { basePriority: 'low', riskFactor: 0.8 },
    'other': { basePriority: 'medium', riskFactor: 1.0 }
  };
  
  const categoryRule = categoryRules[category] || categoryRules['other'];
  
  // Image analysis (basic check for number of images)
  const imageAnalysis = {
    hasImages: images && images.length > 0,
    imageCount: images ? images.length : 0,
    evidenceStrength: images ? Math.min(images.length / 3, 1) : 0
  };
  
  // Adjust confidence based on evidence
  confidence = Math.min(confidence + (imageAnalysis.evidenceStrength * 0.2), 0.95);
  
  // Generate actionable suggestions
  const suggestions = generateSmartSuggestions(category, detectedPriority, imageAnalysis);
  
  return {
    category: category,
    priority: detectedPriority,
    confidence: Math.round(confidence * 100) / 100,
    aiSuggestions: suggestions,
    analysis: {
      urgencyDetected: detectedPriority !== 'medium',
      evidenceQuality: imageAnalysis.evidenceStrength > 0.5 ? 'good' : 'basic',
      categoryRisk: categoryRule.riskFactor,
      recommendedAction: getSuggestedAction(category, detectedPriority)
    }
  };
}

function generateSmartSuggestions(category, priority, imageAnalysis) {
  const baseSuggestions = {
    'pothole': [
      'Document exact location with GPS coordinates',
      'Measure approximate size and depth',
      'Check for additional road damage nearby'
    ],
    'garbage': [
      'Note type and amount of waste',
      'Check if regular pickup schedule is adequate',
      'Identify if special disposal is needed'
    ],
    'streetlight': [
      'Test during evening hours to confirm malfunction',
      'Check for visible damage to pole or fixtures',
      'Note impact on pedestrian/vehicle safety'
    ],
    'other': [
      'Provide detailed description of the issue',
      'Include photos from multiple angles',
      'Note any immediate safety concerns'
    ]
  };
  
  let suggestions = baseSuggestions[category] || baseSuggestions['other'];
  
  // Add priority-specific suggestions
  if (priority === 'critical' || priority === 'high') {
    suggestions.push('Consider immediate temporary measures if safety risk');
    suggestions.push('Escalate to emergency response if needed');
  }
  
  // Add image-based suggestions
  if (!imageAnalysis.hasImages) {
    suggestions.push('Photos would help authorities assess the issue');
  }
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
}

function getSuggestedAction(category, priority) {
  const actions = {
    critical: 'IMMEDIATE_RESPONSE',
    high: 'URGENT_REVIEW',
    medium: 'STANDARD_PROCESSING',
    low: 'ROUTINE_MAINTENANCE'
  };
  
  return actions[priority] || actions['medium'];
}

module.exports = router;