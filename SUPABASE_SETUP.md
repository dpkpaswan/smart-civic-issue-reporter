# Supabase Database Setup Guide

This guide walks you through setting up Supabase as the database for the Smart Civic Issue Reporter.

## 1. Create Supabase Project

1. **Visit [Supabase](https://supabase.com)** and sign up/sign in
2. **Click "New Project"**
3. **Choose your organization**
4. **Fill in project details:**
   - Name: `Smart Civic Issue Reporter`
   - Database Password: (Generate a strong password and save it)
   - Region: Choose closest to your location
5. **Click "Create new project"**
6. **Wait for setup to complete** (2-3 minutes)

## 2. Get Project Credentials

1. **Go to Settings** → **API** in your Supabase dashboard
2. **Copy the following values:**
   - **Project URL**: `https://your-project.supabase.co`
   - **Anon public key**: `your-anon-key`

## 3. Configure Environment Variables

1. **Create `.env` file** in the `backend` folder:
   ```bash
   cd backend
   copy .env.example .env
   ```

2. **Edit `.env` file** and add your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   PORT=5000
   ```

## 4. Set Up Database Tables

1. **Go to your Supabase dashboard**
2. **Click "SQL Editor"** in the left sidebar
3. **Copy and paste the following SQL** and click "Run":

```sql
-- Create issues table
CREATE TABLE IF NOT EXISTS issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  issue_id VARCHAR(20) UNIQUE NOT NULL,
  citizen_name VARCHAR(255) NOT NULL,
  citizen_email VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('pothole', 'garbage', 'streetlight', 'other')),
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
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL, -- bcrypt hashed passwords
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'authority',
  department VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE
ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for issues table
CREATE TRIGGER update_issues_updated_at BEFORE UPDATE
ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Note: Real users with secure hashed passwords will be created using the setup script
-- After completing this SQL setup, run: node scripts/setup-real-users.js

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
```

## 5. Enable Row Level Security (Optional but Recommended)

For production deployment, enable RLS:

```sql
-- Enable RLS on issues table
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for issues" ON issues;
DROP POLICY IF EXISTS "Public insert access for issues" ON issues;
DROP POLICY IF EXISTS "Public update access for issues" ON issues;

-- Create policy for read access (anyone can read)
CREATE POLICY "Public read access for issues" ON issues
FOR SELECT USING (true);

-- Create policy for insert (anyone can create issues)
CREATE POLICY "Public insert access for issues" ON issues
FOR INSERT WITH CHECK (true);

-- Create policy for update (only for status updates via API)
CREATE POLICY "Public update access for issues" ON issues
FOR UPDATE USING (true);

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Read access for users" ON users;

-- Create policy for users (read only for authentication)
CREATE POLICY "Read access for users" ON users
FOR SELECT USING (true);
```

## 5. Set Up Real User Accounts

After creating the database tables, you need to create secure user accounts:

1. **Open terminal** in the `backend` folder:
   ```bash
   cd backend
   ```

2. **Ensure your environment variables** are set in `.env`:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Run the user setup script**:
   ```bash
   node scripts/setup-real-users.js
   ```

This creates secure authority accounts with:
- ✅ **Bcrypt-hashed passwords** (12 rounds)
- ✅ **Department-specific accounts**
- ✅ **Real email addresses** 
- ✅ **Strong password requirements**

### Created User Accounts:
- **roads.admin** / SecureRoad2026! (Roads & Infrastructure)
- **waste.admin** / CleanCity2026! (Waste Management)
- **utilities.admin** / PowerLight2026! (Public Utilities)  
- **general.admin** / CityAdmin2026! (General Administration)

## 6. Test Your Setup

1. **Install dependencies** in the backend:
   ```bash
   cd backend
   npm install
   ```

2. **Start the backend server**:
   ```bash
   npm start
   ```

3. **Look for success messages**:
   ```
   🚀 Smart Civic Issue Reporter API running on port 5000
   🔗 Testing Supabase database connection...
   ✅ Supabase database connected successfully
   ✅ Database ready for operations
   ```

4. **Test API endpoints**:
   - GET `http://localhost:5000/api/issues` - Should return sample issues
   - GET `http://localhost:5000/api/auth/demo-credentials` - Should return user credentials

## 7. Troubleshooting

### ❌ Connection Issues
- **Check your `.env` file** - Make sure SUPABASE_URL and SUPABASE_ANON_KEY are correct
- **Verify project status** in Supabase dashboard - Ensure project is fully set up
- **Check network connection** - Try accessing Supabase dashboard

### ❌ Permission Errors
- **Verify RLS policies** - Make sure they allow the operations you need
- **Check API key permissions** - Anon key should have read/write access

### ❌ Table Not Found
- **Re-run the SQL schema** in Supabase SQL Editor
- **Check table names** - Tables should be `issues` and `users`

### 🔍 Debug Mode
Add this to your `.env` to see detailed database queries:
```env
DEBUG=supabase:*
```

## 8. Next Steps

With Supabase configured, your app will now:

✅ **Store issues persistently** in PostgreSQL database  
✅ **Handle concurrent users** with proper database transactions  
✅ **Scale automatically** with Supabase infrastructure  
✅ **Provide real-time updates** (can be extended with Supabase realtime)  
✅ **Support production deployment** with proper credentials  

## Production Considerations

For production deployment:

1. **Use environment variables** for all sensitive data
2. **Enable proper RLS policies** for data security
3. **Hash passwords** using bcrypt
4. **Use real JWT tokens** for authentication
5. **Set up proper backup strategy** in Supabase
6. **Monitor database performance** using Supabase dashboard

---

🎯 **Your Smart Civic Issue Reporter is now powered by Supabase!**