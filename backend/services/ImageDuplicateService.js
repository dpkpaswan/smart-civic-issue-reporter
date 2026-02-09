/**
 * Image Duplicate Detection Service
 * Uses Google Gemini Vision API to compare civic issue images
 * and detect real-world duplicates even from different angles.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

// Gracefully handle missing API key — don't crash server on startup
let genAI = null;
let model = null;

if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ 
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.1,
      topP: 0.8,
      topK: 40
    }
  });
  console.log('🔍 Image Duplicate Service initialized with model:', 'gemini-2.5-flash');
} else {
  console.warn('⚠️  GEMINI_API_KEY not set — Image Duplicate Service will skip comparisons');
}

// Timeout for each Gemini request (ms)
const REQUEST_TIMEOUT_MS = 15000;

// Max nearby issues to compare images against
const MAX_COMPARISONS = 5;

// Confidence threshold (0-1) above which we flag as duplicate
const CONFIDENCE_THRESHOLD = 0.70;

/**
 * Gemini prompt sent with every pair of images.
 */
const COMPARISON_PROMPT = `You are an AI analyzing civic issue images.

Compare Image A (first image) and Image B (second image).

Determine if they represent the SAME physical real-world issue (such as the same garbage pile, same pothole, or same damaged object), even if taken from different angles or lighting conditions.

Respond ONLY in valid JSON with no extra text:
{
  "is_same_issue": true or false,
  "confidence": 0.0 to 1.0,
  "reason": "short one-line explanation"
}`;

/**
 * Read a local image file and return its base64 data + MIME type.
 * Handles both absolute paths and relative /uploads/... paths.
 */
function loadImageAsBase64(imageUrl) {
  let filePath;

  if (imageUrl.startsWith('/uploads/')) {
    filePath = path.join(__dirname, '..', imageUrl);
  } else if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    // Extract path portion from full URL (e.g. http://localhost:5000/uploads/abc.jpg)
    try {
      const url = new URL(imageUrl);
      filePath = path.join(__dirname, '..', url.pathname);
    } catch {
      return null;
    }
  } else {
    filePath = path.isAbsolute(imageUrl) ? imageUrl : path.join(__dirname, '..', imageUrl);
  }

  if (!fs.existsSync(filePath)) {
    console.warn(`[ImageDuplicate] File not found: ${filePath}`);
    return null;
  }

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(filePath).toLowerCase();
  const mimeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
  const mimeType = mimeMap[ext] || 'image/jpeg';

  return { base64: buffer.toString('base64'), mimeType };
}

// Retry config for 429 / 503 errors
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000; // 2s, 4s, 8s backoff

// Simple per-minute rate limiter (Gemini free = 15 RPM)
const RPM_LIMIT = 10;
const requestTimestamps = [];

function waitForRateLimit() {
  const now = Date.now();
  // Remove timestamps older than 60s
  while (requestTimestamps.length && requestTimestamps[0] < now - 60000) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= RPM_LIMIT) {
    const waitMs = 60000 - (now - requestTimestamps[0]) + 500;
    console.log(`[ImageDuplicate] Rate limit: waiting ${(waitMs / 1000).toFixed(1)}s`);
    return new Promise(resolve => setTimeout(resolve, waitMs));
  }
  requestTimestamps.push(now);
  return Promise.resolve();
}

/**
 * Call Gemini Vision with two images and the comparison prompt.
 * Retries on 429/503 with exponential backoff.
 * Returns parsed JSON or null on failure.
 */
async function callGemini(imageA, imageB) {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await waitForRateLimit();

    try {
      console.log(`[ImageDuplicate] Calling Gemini for duplicate detection (attempt ${attempt + 1}/${MAX_RETRIES + 1})`);
      
      // Create proper image parts for the SDK
      const imageParts = [
        {
          inlineData: {
            mimeType: imageA.mimeType,
            data: imageA.base64
          }
        },
        {
          inlineData: {
            mimeType: imageB.mimeType,
            data: imageB.base64
          }
        }
      ];

      // Use the SDK's generateContent method
      const result = await Promise.race([
        model.generateContent({
          contents: [{
            parts: [
              { text: COMPARISON_PROMPT },
              ...imageParts
            ]
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 256
          }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT_MS)
        )
      ]);

      if (!result || !result.response) {
        console.warn('[ImageDuplicate] Empty response from Gemini API');
        throw new Error('Empty response from Gemini API');
      }

      const text = result.response.text();
      
      if (!text) {
        console.warn('[ImageDuplicate] No text content in Gemini response');
        throw new Error('No text content in response');
      }

      // Extract JSON from possible markdown code fences
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        console.warn('[ImageDuplicate] Could not parse Gemini response:', text.slice(0, 200));
        return null;
      }

      const parsed = JSON.parse(jsonMatch[0]);
      console.log(`[ImageDuplicate] Successful duplicate check: ${parsed.is_same_issue ? 'DUPLICATE' : 'UNIQUE'} (confidence: ${parsed.confidence})`);
      return parsed;

    } catch (err) {
      console.warn(`[ImageDuplicate] Attempt ${attempt + 1} failed:`, err.message);

      // Check for specific error types
      if (err.message.includes('PERMISSION_DENIED') || err.message.includes('API_KEY')) {
        console.error('[ImageDuplicate] API key error - not retryable');
        return null;
      }

      if (err.message.includes('QUOTA_EXCEEDED')) {
        console.warn('[ImageDuplicate] Quota exhausted - skipping (not retryable)');
        return null;
      }

      // Retry on timeout, rate limit, or server errors
      if (attempt < MAX_RETRIES && (
        err.message.includes('timeout') ||
        err.message.includes('RESOURCE_EXHAUSTED') ||
        err.message.includes('UNAVAILABLE') ||
        err.message.includes('INTERNAL')
      )) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[ImageDuplicate] Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      // Non-retryable error or max retries reached
      console.error('[ImageDuplicate] Request failed permanently:', err.message);
      return null;
    }
  }
  return null;
}

/**
 * Main entry point — compare a new image against nearby issue images.
 *
 * @param {string} newImageUrl      URL/path of the newly uploaded image
 * @param {Array}  nearbyIssues     Array of issue objects that have `.images` and `.issue_id`
 * @returns {Object} { isDuplicate, matchedIssueId, confidence, reason }
 */
async function checkImageDuplicate(newImageUrl, nearbyIssues = []) {
  const result = {
    isDuplicate: false,
    matchedIssueId: null,
    confidence: 0,
    reason: null,
    skipped: false
  };

  // Guard: no API key configured
  if (!process.env.GEMINI_API_KEY || !model) {
    console.warn('[ImageDuplicate] GEMINI_API_KEY not set — skipping image comparison');
    result.skipped = true;
    return result;
  }

  // Guard: no image to compare
  if (!newImageUrl) {
    result.skipped = true;
    return result;
  }

  // Load the new image
  const newImage = loadImageAsBase64(newImageUrl);
  if (!newImage) {
    console.warn('[ImageDuplicate] Could not load new image:', newImageUrl);
    result.skipped = true;
    return result;
  }

  // Collect candidate images from nearby issues (max MAX_COMPARISONS)
  const candidates = [];
  for (const issue of nearbyIssues) {
    const imgs = issue.images || [];
    if (imgs.length > 0 && candidates.length < MAX_COMPARISONS) {
      // Use the first image of each issue
      const imgUrl = typeof imgs[0] === 'string' ? imgs[0] : imgs[0]?.url;
      if (imgUrl) {
        candidates.push({ issueId: issue.issue_id, imageUrl: imgUrl });
      }
    }
  }

  if (candidates.length === 0) {
    result.skipped = true;
    return result;
  }

  console.log(`[ImageDuplicate] Comparing new image against ${candidates.length} nearby issue(s)...`);

  // Compare sequentially (to be kind to rate limits)
  let bestMatch = { confidence: 0, issueId: null, reason: null };

  for (const candidate of candidates) {
    const existingImage = loadImageAsBase64(candidate.imageUrl);
    if (!existingImage) continue;

    const geminiResult = await callGemini(newImage, existingImage);
    if (!geminiResult) continue;

    const conf = typeof geminiResult.confidence === 'number' ? geminiResult.confidence : 0;

    if (geminiResult.is_same_issue && conf > bestMatch.confidence) {
      bestMatch = { confidence: conf, issueId: candidate.issueId, reason: geminiResult.reason };
    }
  }

  if (bestMatch.confidence >= CONFIDENCE_THRESHOLD) {
    result.isDuplicate = true;
    result.matchedIssueId = bestMatch.issueId;
    result.confidence = Math.round(bestMatch.confidence * 100) / 100;
    result.reason = bestMatch.reason;
    console.log(`[ImageDuplicate] ✅ DUPLICATE detected → ${bestMatch.issueId} (${(bestMatch.confidence * 100).toFixed(0)}%)`);
  } else if (bestMatch.confidence > 0) {
    result.confidence = Math.round(bestMatch.confidence * 100) / 100;
    result.reason = bestMatch.reason;
    console.log(`[ImageDuplicate] Below threshold (${(bestMatch.confidence * 100).toFixed(0)}% < ${CONFIDENCE_THRESHOLD * 100}%)`);
  }

  return result;
}

module.exports = { checkImageDuplicate, CONFIDENCE_THRESHOLD, MAX_COMPARISONS };
