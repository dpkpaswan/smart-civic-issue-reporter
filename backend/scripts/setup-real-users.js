const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration - MUST use service role key for user creation
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  console.error('   Get your service role key from Supabase Dashboard > Settings > API');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRealUsers() {
  console.log('Setting up real user accounts...');
  
  try {
    // Real user accounts for different departments
    const users = [
      {
        username: 'roads.admin',
        password: 'SecureRoad2026!',
        email: 'roads@municipality.gov',
        role: 'authority',
        department: 'Roads & Infrastructure'
      },
      {
        username: 'waste.admin', 
        password: 'CleanCity2026!',
        email: 'waste@municipality.gov',
        role: 'authority',
        department: 'Waste Management'
      },
      {
        username: 'utilities.admin',
        password: 'PowerLight2026!', 
        email: 'utilities@municipality.gov',
        role: 'authority',
        department: 'Public Utilities'
      },
      {
        username: 'general.admin',
        password: 'CityAdmin2026!',
        email: 'admin@municipality.gov', 
        role: 'authority',
        department: 'General Administration'
      }
    ];

    // Hash passwords and insert users
    for (const user of users) {
      console.log(`Creating user: ${user.username}`);
      
      // Hash the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(user.password, saltRounds);
      
      // Insert user into database
      const { data, error } = await supabase
        .from('users')
        .insert([{
          username: user.username,
          password: passwordHash, // Using 'password' field for existing schema
          email: user.email,
          role: user.role,
          department: user.department
        }]);
      
      if (error) {
        console.error(`Error creating user ${user.username}:`, error);
      } else {
        console.log(`✅ Created user: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Password: ${user.password}`);
        console.log(`   Department: ${user.department}`);
        console.log('');
      }
    }
    
    console.log('🎉 Real user setup completed!');
    console.log('');
    console.log('📋 User Login Credentials:');
    console.log('================================');
    users.forEach(user => {
      console.log(`Username: ${user.username}`);
      console.log(`Password: ${user.password}`);
      console.log(`Department: ${user.department}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Failed to setup users:', error);
  }
}

// Run the setup if this file is executed directly
if (require.main === module) {
  setupRealUsers();
}

module.exports = { setupRealUsers };