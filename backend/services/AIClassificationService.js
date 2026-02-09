/**
 * AI Classification Service
 * Production-ready image classification using Google Gemini Vision API
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
const path = require('path');

class AIClassificationService {
  constructor() {
    // Gracefully handle missing API key — don't crash server on startup
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️  GEMINI_API_KEY not set — AI classification will use fallback mode');
      this.model = null;
      this.genAI = null;
    } else {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash',
        generationConfig: {
          temperature: 0.1,
          topP: 0.8,
          topK: 40,
        }
      });
    }

    // Valid civic issue categories
    this.validCategories = [
      'pothole', 
      'garbage', 
      'water', 
      'streetlight', 
      'traffic', 
      'sidewalk', 
      'graffiti'
    ];

    // Configuration
    this.confidenceThreshold = 0.6;
    this.timeoutMs = 10000; // 10 seconds timeout
    this.maxRetries = 1; // Retry once on failure
    
    console.log('🤖 AI Classification Service initialized with model: gemini-2.5-flash');
  }

  /**
   * Classify issue from uploaded image using Google Gemini Vision API
   * @param {string} imagePath - Path to the uploaded image
   * @param {string} originalCategory - User-selected category
   * @returns {Object} Classification result
   */
  async classifyIssueFromImage(imagePath, originalCategory = null) {
    const startTime = Date.now();
    
    try {
      // Validate API key again at runtime
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY environment variable is not configured');
      }

      // Read and convert image to base64
      const imageData = await this.prepareImageForAI(imagePath);
      
      // Create the prompt for civic issue classification
      const prompt = this.createClassificationPrompt();

      // Call Gemini Vision API with retry logic
      const result = await this.callGeminiVisionAPIWithRetry(prompt, imageData);
      
      // Parse and validate the AI response
      const aiResult = this.parseAIResponse(result);
      
      // Compare with original category if provided
      const classification = this.processClassificationResult(aiResult, originalCategory);

      const duration = Date.now() - startTime;
      
      return classification;

    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ AI Classification failed after ${duration}ms:`, {
        error: error.message,
        imagePath: path.basename(imagePath),
        originalCategory
      });
      
      // Return fallback result on error - DO NOT crash the flow
      return this.createFallbackResult(originalCategory, error.message);
    }
  }

  /**
   * Prepare image data for AI processing with validation
   */
  async prepareImageForAI(imagePath) {
    try {
      // Check if file exists and is readable
      const stats = await fs.stat(imagePath);
      const maxSize = 20 * 1024 * 1024; // 20MB limit for Gemini
      
      if (stats.size > maxSize) {
        throw new Error(`Image file too large: ${Math.round(stats.size / 1024 / 1024)}MB (max: 20MB)`);
      }
      
      // Read file buffer
      const fileBuffer = await fs.readFile(imagePath);
      
      // Get file extension to determine MIME type
      const ext = path.extname(imagePath).toLowerCase();
      let mimeType;
      
      switch (ext) {
        case '.jpg':
        case '.jpeg':
          mimeType = 'image/jpeg';
          break;
        case '.png':
          mimeType = 'image/png';
          break;
        case '.webp':
          mimeType = 'image/webp';
          break;
        case '.gif':
          mimeType = 'image/gif';
          break;
        default:
          throw new Error(`Unsupported image format: ${ext}. Supported: jpg, png, webp, gif`);
      }

      return {
        inlineData: {
          data: fileBuffer.toString('base64'),
          mimeType: mimeType
        }
      };
    } catch (error) {
      throw new Error(`Failed to prepare image for AI analysis: ${error.message}`);
    }
  }

  /**
   * Create optimized classification prompt for Gemini
   */
  createClassificationPrompt() {
    return `You are an expert AI system that analyzes civic infrastructure problems from images.

TASK: Classify this civic issue image into one of these exact categories:

ALLOWED CATEGORIES ONLY:
- pothole: Road damage, holes in asphalt/concrete
- garbage: Waste, litter, overflowing bins, illegal dumping
- water: Leaks, flooding, broken pipes, drainage issues
- streetlight: Broken lights, missing bulbs, electrical issues
- traffic: Traffic signals, road signs, traffic-related problems
- sidewalk: Sidewalk damage, cracks, accessibility issues
- graffiti: Vandalism, spray paint, unauthorized markings

RESPONSE FORMAT (JSON only):
{
  "category": "exact_category_name",
  "confidence": 0.XX,
  "explanation": "What you see in 10-15 words"
}

INSTRUCTIONS:
- Use EXACT category names from the list above
- Confidence: 0.9+ (very clear), 0.7-0.8 (clear), 0.5-0.6 (somewhat clear), <0.5 (unclear)
- Be specific but concise in explanation
- If unclear, choose closest match with lower confidence
- Focus on the PRIMARY issue visible`;
  }

  /**
   * Call Gemini Vision API with retry logic and timeout protection
   */
  async callGeminiVisionAPIWithRetry(prompt, imageData) {
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          this.callGeminiVisionAPI(prompt, imageData),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Gemini API timeout after 10 seconds')), this.timeoutMs)
          )
        ]);
        
        return result;
      } catch (error) {
        console.error(`❌ Gemini API attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt === this.maxRetries) {
          // Last attempt failed, throw the error
          throw new Error(`Gemini API failed after ${this.maxRetries + 1} attempts: ${error.message}`);
        }
        
        // Wait before retry
        const retryDelay = 1000 * (attempt + 1); // 1s, 2s delay
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * Core Gemini Vision API call
   */
  async callGeminiVisionAPI(prompt, imageData) {
    try {
      const requestStart = Date.now();
      
      const result = await this.model.generateContent([prompt, imageData]);
      const response = await result.response;
      
      if (!response) {
        throw new Error('Empty response from Gemini API');
      }
      
      const text = response.text();
      
      return text;
    } catch (error) {
      // Enhanced error handling for different Gemini API errors
      if (error.message.includes('PERMISSION_DENIED')) {
        throw new Error('Invalid Gemini API key or insufficient permissions');
      } else if (error.message.includes('QUOTA_EXCEEDED')) {
        throw new Error('Gemini API quota exceeded - please check your billing');
      } else if (error.message.includes('SAFETY')) {
        throw new Error('Image rejected by Gemini safety filters');
      } else if (error.message.includes('INVALID_ARGUMENT')) {
        throw new Error('Invalid image format or size for Gemini API');
      } else {
        throw new Error(`Gemini API error: ${error.message}`);
      }
    }
  }

  /**
   * Enhanced parsing with better error handling and validation
   */
  parseAIResponse(responseText) {
    try {
      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response from Gemini API');
      }

      // Clean up the response text (remove code blocks if present)
      let cleanText = responseText.trim();
      
      // Handle various response formats
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\s*/, '').replace(/```\s*$/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\s*/, '').replace(/```\s*$/, '');
      }
      
      // Extract JSON if there's additional text
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
      }

      const parsed = JSON.parse(cleanText);

      // Validate required fields with detailed error messages
      if (!parsed.category) {
        throw new Error('Missing "category" field in AI response');
      }
      if (parsed.confidence === undefined || parsed.confidence === null) {
        throw new Error('Missing "confidence" field in AI response');
      }
      if (!parsed.explanation) {
        throw new Error('Missing "explanation" field in AI response');
      }

      // Normalize category to lowercase for validation
      const normalizedCategory = parsed.category.toLowerCase().trim();
      
      // Validate category against allowed list
      if (!this.validCategories.includes(normalizedCategory)) {
        console.warn(`⚠️ AI returned invalid category: "${parsed.category}". Using fallback.`);
        // Use the closest match or default to 'other'
        const fallbackCategory = this.findClosestCategory(normalizedCategory) || 'other';
        parsed.category = fallbackCategory;
        parsed.confidence = Math.max(0.3, parsed.confidence - 0.2); // Reduce confidence for fallback
      } else {
        parsed.category = normalizedCategory;
      }

      // Validate and normalize confidence
      const confidence = parseFloat(parsed.confidence);
      if (isNaN(confidence) || confidence < 0 || confidence > 1) {
        console.warn(`⚠️ Invalid confidence value: ${parsed.confidence}. Clamping to valid range.`);
        parsed.confidence = Math.max(0, Math.min(1, confidence || 0.5));
      } else {
        parsed.confidence = confidence;
      }

      // Clean and limit explanation
      const explanation = String(parsed.explanation).trim().substring(0, 200);

      return {
        category: parsed.category,
        confidence: parsed.confidence,
        explanation: explanation
      };
    } catch (error) {
      console.error('❌ Failed to parse AI response:', {
        error: error.message,
        responseLength: responseText?.length || 0,
        responseSample: responseText?.substring(0, 100) || 'empty'
      });
      
      // Don't throw here - return a default result to prevent cascade failure
      return {
        category: 'other',
        confidence: 0.1,
        explanation: `Parsing failed: ${error.message}`
      };
    }
  }

  /**
   * Find closest matching category using simple string similarity
   */
  findClosestCategory(inputCategory) {
    const input = inputCategory.toLowerCase();
    
    // Direct fuzzy matching
    for (const validCategory of this.validCategories) {
      if (input.includes(validCategory) || validCategory.includes(input)) {
        return validCategory;
      }
    }
    
    // Common variations mapping
    const categoryMappings = {
      'trash': 'garbage',
      'waste': 'garbage',
      'litter': 'garbage',
      'rubbish': 'garbage',
      'road': 'pothole',
      'hole': 'pothole',
      'crack': 'pothole',
      'light': 'streetlight',
      'lamp': 'streetlight',
      'signal': 'traffic',
      'sign': 'traffic',
      'leak': 'water',
      'flood': 'water',
      'pipe': 'water',
      'walkway': 'sidewalk',
      'path': 'sidewalk',
      'pavement': 'sidewalk',
      'vandalism': 'graffiti',
      'paint': 'graffiti'
    };
    
    for (const [keyword, category] of Object.entries(categoryMappings)) {
      if (input.includes(keyword)) {
        return category;
      }
    }
    
    return null; // No close match found
  }

  /**
   * Enhanced result processing with better logging
   */
  processClassificationResult(aiResult, originalCategory) {
    const { category, confidence, explanation } = aiResult;
    
    // Determine if manual review is needed
    const needsReview = confidence < this.confidenceThreshold;
    
    // Check if AI category differs from user-selected category
    const wasReclassified = originalCategory && 
                           originalCategory !== category && 
                           originalCategory !== 'other' && 
                           originalCategory !== 'unknown';

    const result = {
      original_category: originalCategory || 'unknown',
      verified_category: category,
      confidence_score: confidence,
      ai_explanation: explanation,
      needs_review: needsReview,
      was_reclassified: wasReclassified,
      reclassification_event: wasReclassified ? {
        from: originalCategory,
        to: category,
        confidence: confidence,
        timestamp: new Date().toISOString(),
        reason: 'AI_VISION_ANALYSIS'
      } : null,
      ai_processing_status: 'completed',
      processed_at: new Date().toISOString()
    };

    // Log classification decision
    if (wasReclassified) {
      console.log(`🔄 Category reclassified: ${originalCategory} → ${category} (${Math.round(confidence * 100)}% confidence)`);
    }
    if (needsReview) {
      console.log(`⚠️ Manual review required (low confidence: ${Math.round(confidence * 100)}%)`);
    }

    return result;
  }

  /**
   * Enhanced fallback result with better error classification
   */
  createFallbackResult(originalCategory, errorMessage) {
    console.log(`🛡️ Creating fallback classification result due to: ${errorMessage}`);
    
    // Determine fallback confidence based on error type
    let fallbackConfidence = 0.1;
    let fallbackExplanation = 'AI classification failed';
    
    if (errorMessage.includes('API key')) {
      fallbackExplanation = 'AI service not configured';
      fallbackConfidence = 0.05;
    } else if (errorMessage.includes('quota')) {
      fallbackExplanation = 'AI service quota exceeded';
      fallbackConfidence = 0.05;
    } else if (errorMessage.includes('timeout')) {
      fallbackExplanation = 'AI service timeout';
      fallbackConfidence = 0.2;
    } else if (errorMessage.includes('parse') || errorMessage.includes('format')) {
      fallbackExplanation = 'AI response format error';
      fallbackConfidence = 0.15;
    }

    return {
      original_category: originalCategory || 'unknown',
      verified_category: originalCategory || 'other',
      confidence_score: fallbackConfidence,
      ai_explanation: fallbackExplanation + ' - using manual selection',
      needs_review: true,
      was_reclassified: false,
      reclassification_event: null,
      ai_processing_status: 'failed',
      ai_error: errorMessage,
      processed_at: new Date().toISOString()
    };
  }

  /**
   * Batch classify multiple images with enhanced error handling
   */
  async classifyMultipleImages(imagePaths, originalCategory = null) {
    try {
      const results = [];
      
      for (let i = 0; i < imagePaths.length; i++) {
        try {
          const classification = await this.classifyIssueFromImage(imagePaths[i], originalCategory);
          results.push({
            image_path: imagePaths[i],
            classification: classification,
            success: true
          });
        } catch (error) {
          console.error(`❌ Failed to classify image ${i + 1}:`, error.message);
          results.push({
            image_path: imagePaths[i],
            classification: this.createFallbackResult(originalCategory, error.message),
            success: false
          });
        }
      }

      // Determine overall classification from multiple images
      return this.consolidateMultipleClassifications(results, originalCategory);
    } catch (error) {
      console.error('❌ Batch classification failed:', error);
      return this.createFallbackResult(originalCategory, error.message);
    }
  }

  /**
   * Consolidate classifications from multiple images with smart weighting
   */
  consolidateMultipleClassifications(results, originalCategory) {
    if (results.length === 0) {
      return this.createFallbackResult(originalCategory, 'No images to process');
    }

    if (results.length === 1) {
      return results[0].classification;
    }

    // Filter out failed classifications for better results
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      return this.createFallbackResult(originalCategory, 'All image classifications failed');
    }

    // Find the classification with highest confidence
    const bestClassification = successfulResults.reduce((best, current) => {
      return current.classification.confidence_score > best.classification.confidence_score 
        ? current 
        : best;
    });

    // Calculate weighted average confidence (higher confidence results get more weight)
    const totalWeight = successfulResults.reduce((sum, result) => sum + result.classification.confidence_score, 0);
    const weightedConfidence = successfulResults.reduce((sum, result) => {
      const weight = result.classification.confidence_score / totalWeight;
      return sum + (result.classification.confidence_score * weight);
    }, 0);

    // Combine explanations from successful classifications
    const successfulExplanations = successfulResults
      .filter(r => r.classification.ai_explanation)
      .map(r => r.classification.ai_explanation)
      .slice(0, 3) // Limit to first 3 explanations
      .join('; ');

    console.log(`✅ Consolidated ${successfulResults.length}/${results.length} successful classifications`);

    return {
      ...bestClassification.classification,
      confidence_score: Math.round(weightedConfidence * 100) / 100, // Round to 2 decimals
      ai_explanation: `Multi-image analysis (${successfulResults.length} images): ${successfulExplanations}`,
      multi_image_analysis: {
        total_images: results.length,
        successful_images: successfulResults.length,
        failed_images: results.length - successfulResults.length,
        classifications: successfulResults.map(r => ({
          category: r.classification.verified_category,
          confidence: r.classification.confidence_score
        })),
        best_confidence: bestClassification.classification.confidence_score,
        weighted_confidence: weightedConfidence
      }
    };
  }

  /**
   * Enhanced image validation with detailed error messages
   */
  async validateImage(imagePath) {
    try {
      const stats = await fs.stat(imagePath);
      const maxSize = 20 * 1024 * 1024; // 20MB limit for Gemini
      const minSize = 1024; // 1KB minimum

      if (stats.size > maxSize) {
        throw new Error(`Image file too large: ${Math.round(stats.size / 1024 / 1024)}MB (max: 20MB)`);
      }

      if (stats.size < minSize) {
        throw new Error(`Image file too small: ${stats.size} bytes (min: 1KB)`);
      }

      const ext = path.extname(imagePath).toLowerCase();
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

      if (!allowedExtensions.includes(ext)) {
        throw new Error(`Unsupported file type: ${ext}. Supported: ${allowedExtensions.join(', ')}`);
      }

      return true;
    } catch (error) {
      throw new Error(`Image validation failed: ${error.message}`);
    }
  }

  /**
   * Health check method to test AI service availability
   */
  async healthCheck() {
    try {
      console.log('🔍 Performing AI service health check...');
      
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      // Test with a minimal request (this won't work without an actual image, but will validate API key and connection)
      const testPrompt = 'Test prompt for health check';
      
      // We can't test without an image, so just validate the configuration
      const isConfigured = this.genAI && this.model;
      
      if (!isConfigured) {
        throw new Error('Gemini AI not properly initialized');
      }

      console.log('✅ AI service health check passed');
      return {
        status: 'healthy',
        model: 'gemini-2.5-flash',
        api_key_configured: true,
        service_initialized: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ AI service health check failed:', error.message);
      return {
        status: 'unhealthy',
        error: error.message,
        api_key_configured: !!process.env.GEMINI_API_KEY,
        service_initialized: !!(this.genAI && this.model),
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new AIClassificationService();