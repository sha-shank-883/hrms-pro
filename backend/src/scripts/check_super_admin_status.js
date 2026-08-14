const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

async function check() {
  console.log('=== Super Admin Accounts Status ===');
  const superAdmins = await pool.query('SELECT id, email, full_name, is_2fa_enabled, is_active, last_login, password_hash FROM shared.super_admins');
  for (const sa of superAdmins.rows) {
    const isHrmspro123 = await bcrypt.compare('Hrmspro@123', sa.password_hash);
    const isAdmin123 = await bcrypt.compare('Admin@123', sa.password_hash);
    console.log({
      id: sa.id,
      email: sa.email,
      full_name: sa.full_name,
      is_2fa_enabled: sa.is_2fa_enabled,
      is_active: sa.is_active,
      password_is_Hrmspro123: isHrmspro123,
      password_is_Admin123: isAdmin123
    });
  }

  console.log('\n=== Testing Login Simulation with info@hrmspro.online ===');
  const targetEmail = 'info@hrmspro.online';
  const targetPass = 'Hrmspro@123';
  const userRes = await pool.query('SELECT * FROM shared.super_admins WHERE email = $1 AND is_active = true', [targetEmail]);
  if (userRes.rows.length === 0) {
    console.log('User not found!');
  } else {
    const valid = await bcrypt.compare(targetPass, userRes.rows[0].password_hash);
    console.log(`Email: ${targetEmail}, Password Valid: ${valid}, 2FA: ${userRes.rows[0].is_2fa_enabled}`);
  }

  await pool.end();
}

check();
