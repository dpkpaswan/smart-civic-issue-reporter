const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Database Schema for Smart Civic Issue Reporter
 * 
 * This file contains the Supabase database schema and initialization.
 * Run these SQL commands in your Supabase SQL Editor to set up the database.
 */

const databaseSchema = `
-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id VARCHAR(20) UNIQUE NOT NULL,
  citizen_name VARCHAR(255) NOT NULL,
  citizen_email VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('pothole', 'garbage', 'streetlight', 'graffiti', 'water', 'traffic', 'sidewalk', 'other')),
  description TEXT,
  location JSONB NOT NULL,
  images TEXT[] DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('submitted', 'in-progress', 'resolved')),
  priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  resolution_images TEXT[] DEFAULT '{}',
  resolution_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_citizen_email ON issues(citizen_email);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);

-- Create users table for authorities
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL, -- In production, this should be hashed
  role VARCHAR(20) DEFAULT 'authority' CHECK (role IN ('authority', 'admin')),
  email VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for issues table
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE
ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample authority users
INSERT INTO users (username, password, role, email, department) VALUES
('admin', 'admin123', 'authority', 'admin@city.gov', 'Public Works'),
('supervisor', 'super123', 'authority', 'supervisor@city.gov', 'Municipal Services')
ON CONFLICT (username) DO NOTHING;

-- Insert sample issues for demonstration
INSERT INTO issues (
  issue_id, citizen_name, citizen_email, category, description, 
  location, images, status, priority, created_at, updated_at
) VALUES
(
  'ISSUE-001',
  'John Doe',
  'john@example.com',
  'pothole',
  'Large pothole on Main Street causing traffic issues',
  '{"lat": 40.7128, "lng": -74.0060, "address": "Main Street, New York, NY"}',
  ARRAY['/uploads/sample-pothole.jpg'],
  'submitted',
  'medium',
  '2026-01-20T10:00:00Z',
  '2026-01-20T10:00:00Z'
),
(
  'ISSUE-002',
  'Jane Smith',
  'jane@example.com',
  'garbage',
  'Overflowing garbage bins on Oak Avenue',
  '{"lat": 40.7589, "lng": -73.9851, "address": "Oak Avenue, New York, NY"}',
  ARRAY['/uploads/sample-garbage.jpg'],
  'in-progress',
  'high',
  '2026-01-18T14:30:00Z',
  '2026-01-19T09:15:00Z'
),
(
  'ISSUE-003',
  'Mike Wilson',
  'mike@example.com',
  'streetlight',
  'Street light not working on Pine Street',
  '{"lat": 40.7505, "lng": -73.9934, "address": "Pine Street, New York, NY"}',
  ARRAY['/uploads/sample-streetlight.jpg'],
  'resolved',
  'low',
  '2026-01-15T18:45:00Z',
  '2026-01-17T11:20:00Z'
)
ON CONFLICT (issue_id) DO NOTHING;
`;

// Helper function to initialize database (for development)
const initializeDatabase = async () => {
  try {
    console.log('📊 Supabase database schema ready for initialization');
    console.log('📋 Copy the SQL schema to your Supabase SQL Editor to set up tables');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
};

// Test database connection
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('issues')
      .select('count(*)', { count: 'exact', head: true });
    
    if (error) {
      console.log('⚠️  Database not yet set up. Please run the SQL schema in Supabase.');
      return false;
    }
    
    console.log('✅ Supabase database connected successfully');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

module.exports = {
  supabase,
  databaseSchema,
  initializeDatabase,
  testConnection
};