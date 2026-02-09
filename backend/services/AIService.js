/**
 * AI Service
 * Handles AI classification, duplicate detection, severity scoring, and smart automation
 */

const { supabase } = require('../config/database');
const { checkImageDuplicate } = require('./ImageDuplicateService');

class AIService {
  constructor() {
    // Category keywords for improved classification
    this.categoryKeywords = {
      'pothole': ['pothole', 'road', 'street', 'asphalt', 'pavement', 'hole', 'crack', 'broken road'],
      'garbage': ['garbage', 'trash', 'waste', 'litter', 'dumping', 'refuse', 'rubbish', 'overflowing bin'],
      'water': ['water', 'leak', 'pipe', 'burst', 'flooding', 'sewage', 'drain', 'plumbing', 'overflow'],
      'streetlight': ['streetlight', 'lamp', 'lighting', 'bulb', 'dark', 'light post', 'illumination'],
      'traffic': ['traffic', 'signal', 'sign', 'intersection', 'road sign', 'traffic light', 'crossing'],
      'graffiti': ['graffiti', 'vandalism', 'spray paint', 'defacement', 'tagging'],
      'sidewalk': ['sidewalk', 'footpath', 'walkway', 'pavement', 'curb', 'pedestrian']
    };

    // Severity indicators
    this.severityIndicators = {
      'critical': ['emergency', 'danger', 'urgent', 'immediate', 'safety', 'hazard', 'risk', 'accident'],
      'high': ['major', 'serious', 'significant', 'large', 'multiple', 'blocking', 'impassable'],
      'medium': ['moderate', 'noticeable', 'concerning', 'regular', 'typical'],
      'low': ['minor', 'small', 'cosmetic', 'slight', 'minimal']
    };

    // Location importance factors
    this.locationImportance = {
      'main road': 'high',
      'highway': 'critical',
      'school zone': 'high',
      'hospital area': 'critical',
      'commercial district': 'high',
      'residential area': 'medium',
      'park': 'low'
    };

    // Duplicate detection thresholds
    this.duplicateThresholds = {
      radius_meters: 100,
      time_window_hours: 24,
      similarity_score_min: 0.4
    };
  }

  /**
   * Enhanced AI classification with confidence scoring
   */
  async classifyIssue(issueData) {
    try {
      const { category, description = '', location, images = [] } = issueData;
      
      // Basic classification verification
      const classificationResult = {
        original_category: category,
        verified_category: category,
        confidence_score: 0.5,
        severity_level: 'medium',
        priority_level: 'medium',
        classification_details: {
          description_analysis: {},
          location_analysis: {},
          image_analysis: {},
          final_scores: {}
        }
      };

      // Analyze description for better classification
      const descriptionAnalysis = this.analyzeDescription(description, category);
      classificationResult.classification_details.description_analysis = descriptionAnalysis;

      // Analyze location importance
      const locationAnalysis = this.analyzeLocation(location);
      classificationResult.classification_details.location_analysis = locationAnalysis;

      // Placeholder for image analysis (future ML integration)
      const imageAnalysis = this.analyzeImages(images);
      classificationResult.classification_details.image_analysis = imageAnalysis;

      // Calculate final confidence and classification
      const finalClassification = this.calculateFinalClassification(
        category,
        descriptionAnalysis,
        locationAnalysis,
        imageAnalysis
      );

      Object.assign(classificationResult, finalClassification);

      // Check for duplicate issues
      const duplicateCheck = await this.checkForDuplicates(issueData);
      classificationResult.duplicate_check = duplicateCheck;

      return classificationResult;
    } catch (error) {
      console.error('AI Classification error:', error);
      return {
        original_category: issueData.category,
        verified_category: issueData.category,
        confidence_score: 0.0,
        severity_level: 'medium',
        priority_level: 'medium',
        error: error.message
      };
    }
  }

  /**
   * Analyze description text for keywords and severity indicators
   */
  analyzeDescription(description, category) {
    const analysis = {
      keyword_matches: {},
      severity_indicators: [],
      suggested_category: category,
      confidence: 0.5
    };

    if (!description || description.trim().length === 0) {
      return analysis;
    }

    const lowerDesc = description.toLowerCase();
    let maxMatches = 0;
    let bestCategory = category;

    // Check each category for keyword matches
    Object.keys(this.categoryKeywords).forEach(cat => {
      const matches = this.categoryKeywords[cat].filter(keyword => 
        lowerDesc.includes(keyword)
      ).length;
      
      analysis.keyword_matches[cat] = matches;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestCategory = cat;
      }
    });

    // Calculate confidence based on keyword matches
    if (maxMatches > 0) {
      analysis.confidence = Math.min(0.9, 0.5 + (maxMatches * 0.2));
      analysis.suggested_category = bestCategory;
    }

    // Check for severity indicators
    Object.keys(this.severityIndicators).forEach(level => {
      const found = this.severityIndicators[level].filter(indicator =>
        lowerDesc.includes(indicator)
      );
      if (found.length > 0) {
        analysis.severity_indicators.push({ level, indicators: found });
      }
    });

    return analysis;
  }

  /**
   * Analyze location for importance and context
   */
  analyzeLocation(location) {
    const analysis = {
      importance: 'medium',
      area_type: 'unknown',
      priority_boost: false
    };

    try {
      const address = location.address?.toLowerCase() || '';
      
      // Determine location importance
      Object.keys(this.locationImportance).forEach(areaType => {
        if (address.includes(areaType)) {
          analysis.area_type = areaType;
          analysis.importance = this.locationImportance[areaType];
          if (this.locationImportance[areaType] === 'critical' || this.locationImportance[areaType] === 'high') {
            analysis.priority_boost = true;
          }
        }
      });

      // Additional context from coordinates if needed
      if (location.lat && location.lng) {
        analysis.coordinates = { lat: location.lat, lng: location.lng };
        // Future: Add GIS-based location analysis
      }

    } catch (error) {
      console.error('Location analysis error:', error);
    }

    return analysis;
  }

  /**
   * Placeholder for image analysis (future ML integration)
   */
  analyzeImages(images) {
    const analysis = {
      image_count: images.length,
      analysis_available: false,
      confidence_boost: 0
    };

    // Future implementation:
    // - Image analysis for category verification
    // - Severity assessment from image content
    // - Object detection (potholes, garbage, etc.)
    
    if (images.length > 0) {
      analysis.confidence_boost = 0.1; // Small boost for having images
    }

    return analysis;
  }

  /**
   * Calculate final classification based on all analyses
   */
  calculateFinalClassification(originalCategory, descriptionAnalysis, locationAnalysis, imageAnalysis) {
    let finalCategory = originalCategory;
    let confidence = 0.5;
    let severity = 'medium';
    let priority = 'medium';

    // Use description analysis if confidence is high
    if (descriptionAnalysis.confidence > 0.7 && 
        descriptionAnalysis.suggested_category !== originalCategory) {
      finalCategory = descriptionAnalysis.suggested_category;
      confidence = descriptionAnalysis.confidence;
    }

    // Apply confidence boost from images
    confidence += imageAnalysis.confidence_boost;

    // Determine severity level
    if (descriptionAnalysis.severity_indicators.length > 0) {
      const highestSeverity = descriptionAnalysis.severity_indicators
        .sort((a, b) => this.getSeverityOrder(b.level) - this.getSeverityOrder(a.level))[0];
      severity = highestSeverity.level;
    }

    // Determine priority based on severity and location
    priority = this.calculatePriority(severity, locationAnalysis.importance, locationAnalysis.priority_boost);

    // Cap confidence at 0.95 (never 100% certain without human verification)
    confidence = Math.min(0.95, confidence);

    return {
      verified_category: finalCategory,
      confidence_score: Math.round(confidence * 100) / 100,
      severity_level: severity,
      priority_level: priority,
      final_scores: {
        category_match: descriptionAnalysis.confidence,
        location_importance: locationAnalysis.importance,
        has_images: imageAnalysis.image_count > 0
      }
    };
  }

  /**
   * Calculate priority based on severity and location
   */
  calculatePriority(severity, locationImportance, hasPriorityBoost) {
    const severityWeight = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };

    const locationWeight = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'critical': 4
    };

    let score = severityWeight[severity] + locationWeight[locationImportance];
    
    if (hasPriorityBoost) {
      score += 1;
    }

    // Convert score to priority level
    if (score <= 2) return 'low';
    if (score <= 4) return 'medium';
    if (score <= 6) return 'high';
    return 'critical';
  }

  /**
   * Get severity order for sorting
   */
  getSeverityOrder(severity) {
    const order = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return order[severity] || 2;
  }

  /**
   * Check for duplicate issues based on location and time
   */
  async checkForDuplicates(issueData) {
    try {
      const { category, location, description = '' } = issueData;
      
      // Calculate time window
      const timeWindow = new Date();
      timeWindow.setHours(timeWindow.getHours() - this.duplicateThresholds.time_window_hours);

      // Find issues in the radius and time window
      const { data: nearbyIssues, error } = await supabase.rpc('find_nearby_issues', {
        issue_lat: location.lat,
        issue_lng: location.lng,
        radius_meters: this.duplicateThresholds.radius_meters,
        since_time: timeWindow.toISOString(),
        issue_category: category
      });

      if (error && !error.message.includes('find_nearby_issues')) {
        throw new Error(error.message);
      }

      // Fallback to simple query if RPC function doesn't exist
      let candidateDuplicates = [];
      let usedFallback = false;
      if (error) {
        usedFallback = true;
        const { data: allRecentIssues, error: queryError } = await supabase
          .from('issues')
          .select('*')
          .eq('category', category)
          .gte('created_at', timeWindow.toISOString())
          .neq('status', 'closed');

        if (queryError) {
          throw new Error(queryError.message);
        }

        // Filter by basic distance calculation
        candidateDuplicates = allRecentIssues.filter(issue => {
          const distance = this.calculateDistance(
            location.lat, location.lng,
            issue.location.lat, issue.location.lng
          );
          return distance <= this.duplicateThresholds.radius_meters;
        });
      } else {
        candidateDuplicates = nearbyIssues || [];
      }

      // Check similarity with description (text-based)
      const duplicates = candidateDuplicates
        .map(issue => ({
          ...issue,
          similarity_score: this.calculateSimilarityScore(description, issue.description || '')
        }))
        .filter(issue => issue.similarity_score >= this.duplicateThresholds.similarity_score_min);

      // Image-based duplicate detection via Gemini Vision
      let imageDuplicateResult = { isDuplicate: false, skipped: true };
      const images = issueData.images || [];
      if (images.length > 0 && candidateDuplicates.length > 0) {
        try {
          const newImageUrl = typeof images[0] === 'string' ? images[0] : images[0]?.url;
          console.log('🖼️ Running Gemini image duplicate detection...');
          imageDuplicateResult = await checkImageDuplicate(newImageUrl, candidateDuplicates);
        } catch (imgErr) {
          console.error('Image duplicate detection error:', imgErr.message);
        }
      }

      // Merge: text-based OR image-based duplicate
      const textDuplicate = duplicates.length > 0;
      const imageDuplicate = imageDuplicateResult.isDuplicate;
      const isPotentialDuplicate = textDuplicate || imageDuplicate;

      // If image match is stronger, prefer it
      let bestDuplicateIssueId = duplicates[0]?.issue_id || null;
      let bestConfidence = duplicates.length > 0 ? Math.max(...duplicates.map(d => d.similarity_score)) : 0;

      if (imageDuplicate && imageDuplicateResult.confidence > bestConfidence) {
        bestDuplicateIssueId = imageDuplicateResult.matchedIssueId;
        bestConfidence = imageDuplicateResult.confidence;
      }

      return {
        is_potential_duplicate: isPotentialDuplicate,
        duplicate_count: duplicates.length + (imageDuplicate ? 1 : 0),
        potential_duplicates: duplicates.slice(0, 3),
        confidence: bestConfidence,
        image_duplicate: {
          detected: imageDuplicateResult.isDuplicate,
          matched_issue_id: imageDuplicateResult.matchedIssueId || null,
          confidence: imageDuplicateResult.confidence || 0,
          reason: imageDuplicateResult.reason || null,
          skipped: imageDuplicateResult.skipped || false
        }
      };

    } catch (error) {
      console.error('Duplicate detection error:', error);
      return {
        is_potential_duplicate: false,
        duplicate_count: 0,
        error: error.message
      };
    }
  }

  /**
   * Calculate similarity score between two descriptions
   */
  calculateSimilarityScore(desc1, desc2) {
    if (!desc1 || !desc2) return 0;

    const text1 = desc1.toLowerCase().trim();
    const text2 = desc2.toLowerCase().trim();

    if (text1 === text2) return 1.0;

    // Strip punctuation, then split into words
    const clean = (t) => t.replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(w => w.length > 2);
    const words1 = clean(text1);
    const words2 = clean(text2);

    if (words1.length === 0 || words2.length === 0) return 0;

    // Jaccard-style: intersection / union
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = [...set1].filter(w => set2.has(w)).length;
    const union = new Set([...set1, ...set2]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }

  /**
   * Get AI classification statistics
   */
  async getClassificationStats(timeframe = '30 days') {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeframe));

      const { data: issues, error } = await supabase
        .from('issues')
        .select('ai_classification, category, severity_level, confidence_score')
        .gte('created_at', startDate.toISOString());

      if (error) {
        throw new Error(error.message);
      }

      const stats = {
        total_classified: issues.length,
        average_confidence: 0,
        category_accuracy: {},
        severity_distribution: {},
        confidence_ranges: {
          'high': 0,    // > 0.8
          'medium': 0,  // 0.5 - 0.8
          'low': 0      // < 0.5
        }
      };

      let totalConfidence = 0;
      issues.forEach(issue => {
        // Confidence statistics
        if (issue.confidence_score) {
          totalConfidence += issue.confidence_score;
          if (issue.confidence_score > 0.8) stats.confidence_ranges.high++;
          else if (issue.confidence_score > 0.5) stats.confidence_ranges.medium++;
          else stats.confidence_ranges.low++;
        }

        // Severity distribution
        stats.severity_distribution[issue.severity_level] = 
          (stats.severity_distribution[issue.severity_level] || 0) + 1;

        // Category tracking
        stats.category_accuracy[issue.category] = 
          (stats.category_accuracy[issue.category] || 0) + 1;
      });

      stats.average_confidence = issues.length > 0 ? 
        Math.round((totalConfidence / issues.length) * 100) / 100 : 0;

      return stats;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch AI statistics');
    }
  }

  /**
   * Prepare issue data for future ML model training
   */
  async prepareTrainingData(limit = 1000) {
    try {
      const { data: issues, error } = await supabase
        .from('issues')
        .select(`
          category,
          description,
          location,
          severity_level,
          priority,
          status,
          ai_classification,
          citizen_feedback_rating
        `)
        .not('description', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      // Prepare training dataset
      const trainingData = issues.map(issue => ({
        features: {
          description: issue.description,
          category: issue.category,
          location_type: this.analyzeLocation(issue.location).area_type,
          has_keywords: Object.keys(this.categoryKeywords)
            .reduce((acc, cat) => {
              acc[cat] = this.categoryKeywords[cat]
                .some(keyword => issue.description.toLowerCase().includes(keyword));
              return acc;
            }, {})
        },
        labels: {
          severity: issue.severity_level,
          priority: issue.priority,
          citizen_satisfaction: issue.citizen_feedback_rating
        },
        metadata: {
          issue_id: issue.issue_id,
          final_status: issue.status,
          ai_confidence: issue.ai_classification?.confidence_score
        }
      }));

      return {
        dataset_size: trainingData.length,
        features: Object.keys(trainingData[0]?.features || {}),
        labels: Object.keys(trainingData[0]?.labels || {}),
        data: trainingData
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to prepare training data');
    }
  }

  /**
   * Update AI model confidence based on feedback
   */
  async updateModelBasedOnFeedback(issueId, actualCategory, actualSeverity, citizenFeedback) {
    try {
      // Get current AI classification
      const { data: issue, error } = await supabase
        .from('issues')
        .select('ai_classification, category, severity_level')
        .eq('issue_id', issueId)
        .single();

      if (error || !issue) {
        throw new Error('Issue not found');
      }

      const currentClassification = issue.ai_classification || {};
      
      // Calculate accuracy metrics
      const categoryAccuracy = issue.category === actualCategory ? 1 : 0;
      const severityAccuracy = issue.severity_level === actualSeverity ? 1 : 0;

      // Create feedback entry for future model improvement
      const feedbackData = {
        original_prediction: {
          category: issue.category,
          severity: issue.severity_level,
          confidence: currentClassification.confidence_score
        },
        actual_values: {
          category: actualCategory,
          severity: actualSeverity
        },
        accuracy: {
          category: categoryAccuracy,
          severity: severityAccuracy
        },
        citizen_feedback: citizenFeedback,
        feedback_timestamp: new Date().toISOString()
      };

      // Store feedback for future model training
      // This would typically go to a dedicated ML feedback table

      return {
        success: true,
        feedback_recorded: feedbackData
      };
    } catch (error) {
      throw new Error(error.message || 'Failed to process AI feedback');
    }
  }
}

module.exports = new AIService();