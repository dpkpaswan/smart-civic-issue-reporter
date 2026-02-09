/**
 * Fix Password Hashes Script
 * 
 * Fixes the incorrect bcrypt hashes in the database and adds missing department users.
 * Run: node scripts/fix-passwords.js
 * 
 * Default password for ALL users: Admin@123
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY) first.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPasswords() {
  const PASSWORD = 'Admin@123';
  const SALT_ROUNDS = 12;

  console.log('🔧 Fixing password hashes for all users...\n');

  // Generate correct hash
  const correctHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);
  console.log(`✅ Generated correct bcrypt hash for "${PASSWORD}"\n`);

  // 1. Fix ALL existing user passwords
  const { data: existingUsers, error: fetchError } = await supabase
    .from('users')
    .select('id, username, email, department_id, role');

  if (fetchError) {
    console.error('❌ Failed to fetch users:', fetchError.message);
    process.exit(1);
  }

  console.log(`Found ${existingUsers.length} existing users. Updating passwords...\n`);

  for (const user of existingUsers) {
    const { error } = await supabase
      .from('users')
      .update({ password: correctHash })
      .eq('id', user.id);

    if (error) {
      console.error(`  ❌ Failed to update ${user.username}: ${error.message}`);
    } else {
      console.log(`  ✅ ${user.username} (dept_id: ${user.department_id}, role: ${user.role}) — password fixed`);
    }
  }

  // 2. Add missing department users (Traffic=5, Parks=6, Planning=7)
  const missingUsers = [
    { username: 'traffic_officer', email: 'traffic@city.gov', full_name: 'Traffic Management Officer', department_id: 5, ward_area: 'Central', role: 'authority' },
    { username: 'parks_manager', email: 'parks@city.gov', full_name: 'Parks and Recreation Manager', department_id: 6, ward_area: 'North', role: 'authority' },
    { username: 'planning_officer', email: 'planning@city.gov', full_name: 'Building and Planning Officer', department_id: 7, ward_area: 'South', role: 'authority' },
  ];

  console.log('\n🆕 Adding missing department users...\n');

  for (const u of missingUsers) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', u.username)
      .single();

    if (existing) {
      console.log(`  ⏭️  ${u.username} already exists, skipping.`);
      continue;
    }

    const { error } = await supabase
      .from('users')
      .insert([{ ...u, password: correctHash, is_active: true }]);

    if (error) {
      console.error(`  ❌ Failed to create ${u.username}: ${error.message}`);
    } else {
      console.log(`  ✅ Created ${u.username} (dept_id: ${u.department_id})`);
    }
  }

  // 3. Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📋 ALL LOGIN CREDENTIALS (password: Admin@123)');
  console.log('='.repeat(60));

  const { data: allUsers } = await supabase
    .from('users')
    .select('username, email, role, department_id, departments(name, code)')
    .eq('is_active', true)
    .order('department_id');

  if (allUsers) {
    allUsers.forEach(u => {
      console.log(`  Username: ${u.username.padEnd(20)} | Dept: ${(u.departments?.name || 'N/A').padEnd(35)} | Role: ${u.role}`);
    });
  }

  console.log('\n✅ Done! All users can now login with password: Admin@123\n');
}

fixPasswords().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
