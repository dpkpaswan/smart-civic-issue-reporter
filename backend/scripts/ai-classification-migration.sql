-- AI Classification Enhancement Migration
-- Adds fields for enhanced AI image classification with Google Gemini Vision

-- Add new columns for AI classification results
ALTER TABLE issues 
ADD COLUMN IF NOT EXISTS verified_category VARCHAR(50),
ADD COLUMN IF NOT EXISTS ai_explanation TEXT,
ADD COLUMN IF NOT EXISTS needs_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS was_reclassified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS reclassification_event JSONB,
ADD COLUMN IF NOT EXISTS ai_processing_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS ai_error TEXT,
ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

-- Add check constraint for verified_category
ALTER TABLE issues 
ADD CONSTRAINT check_verified_category 
CHECK (verified_category IS NULL OR verified_category IN ('pothole', 'garbage', 'streetlight', 'graffiti', 'water', 'traffic', 'sidewalk', 'other'));

-- Add check constraint for ai_processing_status
ALTER TABLE issues 
ADD CONSTRAINT check_ai_processing_status 
CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed'));

-- Create an index for fast AI classification queries
CREATE INDEX IF NOT EXISTS idx_issues_ai_classification ON issues(verified_category, confidence_score, needs_review);

-- Create index for reclassified issues
CREATE INDEX IF NOT EXISTS idx_issues_reclassified ON issues(was_reclassified, verified_category) WHERE was_reclassified = true;

-- Create index for issues needing manual review
CREATE INDEX IF NOT EXISTS idx_issues_needs_review ON issues(needs_review, ai_processing_status) WHERE needs_review = true;

-- Add comment explaining the enhanced AI classification
COMMENT ON COLUMN issues.verified_category IS 'AI-verified issue category using Google Gemini Vision API';
COMMENT ON COLUMN issues.ai_explanation IS 'AI explanation of the classification decision';
COMMENT ON COLUMN issues.needs_review IS 'Flag indicating if issue needs manual review due to low AI confidence';
COMMENT ON COLUMN issues.was_reclassified IS 'Flag indicating if AI changed the user-selected category';
COMMENT ON COLUMN issues.reclassification_event IS 'Details of reclassification event (from/to categories, confidence, timestamp)';
COMMENT ON COLUMN issues.ai_processing_status IS 'Status of AI processing (pending, processing, completed, failed)';
COMMENT ON COLUMN issues.ai_error IS 'Error message if AI processing failed';
COMMENT ON COLUMN issues.processed_at IS 'Timestamp when AI processing was completed';