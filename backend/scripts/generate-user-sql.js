const bcrypt = require('bcryptjs');

async function generateUserSQL() {
  console.log('Generating SQL statements for user creation...\n');
  
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

  console.log('-- SQL statements to create secure user accounts');
  console.log('-- Copy and paste these into Supabase SQL Editor\n');
  console.log('-- First, delete any existing users:');
  console.log('DELETE FROM users WHERE username IN (\'roads.admin\', \'waste.admin\', \'utilities.admin\', \'general.admin\');\n');
  
  for (const user of users) {
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(user.password, saltRounds);
    
    console.log(`-- Create user: ${user.username} (${user.department})`);
    console.log(`INSERT INTO users (username, password, email, role, department) VALUES`);
    console.log(`('${user.username}', '${passwordHash}', '${user.email}', '${user.role}', '${user.department}');`);
    console.log('');
  }
  
  console.log('-- Verify users were created:');
  console.log('SELECT username, email, department FROM users;');
  console.log('\n🔐 Login Credentials After Running SQL:');
  console.log('==========================================');
  
  users.forEach(user => {
    console.log(`Username: ${user.username}`);
    console.log(`Password: ${user.password}`);
    console.log(`Department: ${user.department}`);
    console.log('---');
  });
}

generateUserSQL().catch(console.error);