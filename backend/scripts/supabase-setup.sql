-- ============================================================
-- Smart Civic Issue Reporter - Complete Database Setup
-- Run this ENTIRE script in your Supabase SQL Editor
-- ============================================================

-- Drop existing tables (in correct order due to foreign keys)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;

-- Drop existing triggers/functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  code VARCHAR(20) NOT NULL UNIQUE,
  description TEXT,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  sla_hours INTEGER DEFAULT 48,
  head_of_department VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'authority' CHECK (role IN ('citizen', 'authority', 'admin', 'super_admin')),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255),
  phone VARCHAR(20),
  department_id INTEGER REFERENCES departments(id),
  ward_area VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id VARCHAR(20) UNIQUE NOT NULL,
  citizen_name VARCHAR(255) NOT NULL,
  citizen_email VARCHAR(255) NOT NULL,
  citizen_phone VARCHAR(20),
  category VARCHAR(50) NOT NULL CHECK (category IN ('pothole', 'garbage', 'streetlight', 'graffiti', 'water', 'traffic', 'sidewalk', 'other')),
  subcategory VARCHAR(100),
  description TEXT,
  location JSONB NOT NULL,
  images TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'assigned', 'in_progress', 'resolved', 'closed', 'rejected')),
  status_history JSONB DEFAULT '[]'::JSONB,
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  severity_level VARCHAR(10) DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
  confidence_score DECIMAL(3,2) DEFAULT 0.0,
  assigned_department_id INTEGER REFERENCES departments(id),
  assigned_to_user_id INTEGER REFERENCES users(id),
  routing_logs JSONB DEFAULT '[]'::JSONB,
  sla_deadline TIMESTAMP WITH TIME ZONE,
  estimated_resolution_time TIMESTAMP WITH TIME ZONE,
  actual_resolution_time TIMESTAMP WITH TIME ZONE,
  resolution_images TEXT[] DEFAULT '{}',
  resolution_notes TEXT,
  resolution_cost DECIMAL(10,2),
  resolved_by_user_id INTEGER REFERENCES users(id),
  citizen_feedback_rating INTEGER CHECK (citizen_feedback_rating BETWEEN 1 AND 5),
  citizen_feedback_comment TEXT,
  citizen_feedback_at TIMESTAMP WITH TIME ZONE,
  duplicate_of_issue_id VARCHAR(20),
  is_duplicate BOOLEAN DEFAULT FALSE,
  ai_classification JSONB,
  
  -- Enhanced AI Classification fields
  verified_category VARCHAR(50) CHECK (verified_category IS NULL OR verified_category IN ('pothole', 'garbage', 'streetlight', 'graffiti', 'water', 'traffic', 'sidewalk', 'other')),
  ai_explanation TEXT,
  needs_review BOOLEAN DEFAULT FALSE,
  was_reclassified BOOLEAN DEFAULT FALSE,
  reclassification_event JSONB,
  ai_processing_status VARCHAR(20) DEFAULT 'pending' CHECK (ai_processing_status IN ('pending', 'processing', 'completed', 'failed')),
  ai_error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  
  auto_escalated BOOLEAN DEFAULT FALSE,
  escalation_reason TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  in_progress_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by_user_id INTEGER REFERENCES users(id),
  changed_by_ip VARCHAR(45),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  details TEXT
);

-- 5. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_user_id INTEGER REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  issue_id VARCHAR(20),
  is_sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Create indexes
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_citizen_email ON issues(citizen_email);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_department ON issues(assigned_department_id);
CREATE INDEX IF NOT EXISTS idx_issues_assigned_user ON issues(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_sla_deadline ON issues(sla_deadline);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(changed_at);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_email);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(is_sent);

-- 7. Auto-update trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_issues_updated_at ON issues;
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE
ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE
ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Create find_nearby_issues RPC function for duplicate detection
DROP FUNCTION IF EXISTS find_nearby_issues(TEXT, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TIMESTAMP WITH TIME ZONE);
CREATE OR REPLACE FUNCTION find_nearby_issues(
  issue_category TEXT,
  issue_lat DOUBLE PRECISION,
  issue_lng DOUBLE PRECISION,
  radius_meters DOUBLE PRECISION,
  since_time TIMESTAMP WITH TIME ZONE
)
RETURNS SETOF issues AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM issues i
  WHERE i.category = issue_category
    AND i.created_at >= since_time
    AND i.status NOT IN ('closed', 'rejected')
    AND (
      -- Haversine distance approximation in meters
      6371000 * 2 * ASIN(SQRT(
        POWER(SIN(RADIANS(issue_lat - (i.location->>'lat')::DOUBLE PRECISION) / 2), 2)
        + COS(RADIANS(issue_lat))
        * COS(RADIANS((i.location->>'lat')::DOUBLE PRECISION))
        * POWER(SIN(RADIANS(issue_lng - (i.location->>'lng')::DOUBLE PRECISION) / 2), 2)
      ))
    ) <= radius_meters;
END;
$$ LANGUAGE plpgsql STABLE;

-- 9. Seed departments
INSERT INTO departments (name, code, description, contact_email, sla_hours) VALUES
('Roads and Infrastructure', 'ROADS', 'Handles potholes, road repairs, and infrastructure issues', 'roads@city.gov', 48),
('Sanitation Department', 'SANITATION', 'Manages garbage collection, waste management, and cleanliness', 'sanitation@city.gov', 24),
('Water and Sewerage', 'WATER', 'Water supply, leakages, and sewerage issues', 'water@city.gov', 12),
('Electricity and Street Lighting', 'ELECTRICITY', 'Street lights, electrical issues, and power-related problems', 'electricity@city.gov', 24),
('Traffic Management', 'TRAFFIC', 'Traffic signals, road signs, and traffic-related issues', 'traffic@city.gov', 48),
('Parks and Recreation', 'PARKS', 'Park maintenance, recreational facilities', 'parks@city.gov', 72),
('Building and Planning', 'PLANNING', 'Construction issues, illegal buildings, planning violations', 'planning@city.gov', 168)
ON CONFLICT (code) DO NOTHING;

-- 10. Seed users (default password for ALL users: Admin@123)
-- Hash generated via: bcrypt.hash('Admin@123', 12)
INSERT INTO users (username, password, role, email, full_name, department_id, ward_area) VALUES
('admin', '$2b$12$DnWwWwVPbLPZJC6JNQFsrul.55.s.4Ovp/tkUD.nO91o09QcuWdBS', 'admin', 'admin@city.gov', 'System Administrator', 1, 'Central'),
('roads_supervisor', '$2b$12$DnWwWwVPbLPZJC6JNQFsrul.55.s.4Ovp/tkUD.nO91o09QcuWdBS', 'authority', 'roads@city.gov', 'Roads Department Supervisor', 1, 'North'),
('sanitation_head', '$2b$12$DnWwWwVPbLPZJC6JNQFsrul.55.s.4Ovp/tkUD.nO91o09QcuWdBS', 'authority', 'sanitation@city.gov', 'Sanitation Department Head', 2, 'South'),
('water_engineer', '$2b$12$DnWwWwVPbLPZJC6JNQFsrul.55.s.4Ovp/tkUD.nO91o09QcuWdBS', 'authority', 'water@city.gov', 'Water Department Engineer', 3, 'East'),
('electricity_tech', '$2b$12$DnWwWwVPbLPZJC6JNQFsrul.55.s.4Ovp/tkUD.nO91o09QcuWdBS', 'authority', 'electricity@city.gov', 'Electrical Technician', 4, 'West'),
('traffic_officer', '$2b$12$DnWwWwVPbLPZJC6JNQFsrul.55.s.4Ovp/tkUD.nO91o09QcuWdBS', 'authority', 'traffic@city.gov', 'Traffic Management Officer', 5, 'Central'),
('parks_manager', '$2b$12$DnWwWwVPbLPZJC6JNQFsrul.55.s.4Ovp/tkUD.nO91o09QcuWdBS', 'authority', 'parks@city.gov', 'Parks and Recreation Manager', 6, 'North'),
('planning_officer', '$2b$12$DnWwWwVPbLPZJC6JNQFsrul.55.s.4Ovp/tkUD.nO91o09QcuWdBS', 'authority', 'planning@city.gov', 'Building and Planning Officer', 7, 'South')
ON CONFLICT (username) DO NOTHING;

-- 11. Seed sample issues
INSERT INTO issues (
  issue_id, citizen_name, citizen_email, category, description, 
  location, images, status, priority, created_at, updated_at
) VALUES
(
  'ISSUE-001', 'John Doe', 'john@example.com', 'pothole',
  'Large pothole on Main Street causing traffic issues',
  '{"lat": 40.7128, "lng": -74.0060, "address": "Main Street, New York, NY"}',
  ARRAY['/uploads/sample-pothole.jpg'], 'submitted', 'medium',
  '2026-01-20T10:00:00Z', '2026-01-20T10:00:00Z'
),
(
  'ISSUE-002', 'Jane Smith', 'jane@example.com', 'garbage',
  'Overflowing garbage bins on Oak Avenue',
  '{"lat": 40.7589, "lng": -73.9851, "address": "Oak Avenue, New York, NY"}',
  ARRAY['/uploads/sample-garbage.jpg'], 'in_progress', 'high',
  '2026-01-18T14:30:00Z', '2026-01-19T09:15:00Z'
),
(
  'ISSUE-003', 'Mike Wilson', 'mike@example.com', 'streetlight',
  'Street light not working on Pine Street',
  '{"lat": 40.7505, "lng": -73.9934, "address": "Pine Street, New York, NY"}',
  ARRAY['/uploads/sample-streetlight.jpg'], 'resolved', 'low',
  '2026-01-15T18:45:00Z', '2026-01-17T11:20:00Z'
)
ON CONFLICT (issue_id) DO NOTHING;

-- 12. Disable RLS for development (enable and configure policies for production)
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow full access via service role / anon key for development
DROP POLICY IF EXISTS "Allow all for departments" ON departments;
CREATE POLICY "Allow all for departments" ON departments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for users" ON users;
CREATE POLICY "Allow all for users" ON users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for issues" ON issues;
CREATE POLICY "Allow all for issues" ON issues FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for audit_logs" ON audit_logs;
CREATE POLICY "Allow all for audit_logs" ON audit_logs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for notifications" ON notifications;
CREATE POLICY "Allow all for notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- Setup complete! 
-- Login credentials: username=admin, password=Admin@123
-- ============================================================
