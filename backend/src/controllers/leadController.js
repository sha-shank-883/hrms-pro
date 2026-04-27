const { pool, query } = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');

// GET all leads (for admin dashboard)
exports.getAllLeads = async (req, res) => {
  try {
    const result = await query(`
      SELECT dr.*, t.subscription_plan 
      FROM shared.demo_requests dr
      LEFT JOIN shared.tenants t ON dr.tenant_id = t.tenant_id
      ORDER BY dr.created_at DESC
    `);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, message: 'Server error fetching leads.' });
  }
};

// POST free demo request (Saves as pending, emails admin)
exports.applyForDemo = async (req, res) => {
  const client = await pool.connect();
  try {
    const { name, email, company_name, phone, password } = req.body;

    if (!name || !email || !company_name || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, company, and password are required.' });
    }

    // 1. Check if email already requested a demo
    const existingReq = await client.query(`SELECT id FROM shared.demo_requests WHERE email = $1`, [email]);
    if (existingReq.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'A demo has already been requested with this email.' });
    }

    // Hash password immediately to store securely in demo_requests if we need it later, 
    // or just store it temporarily (In a real production app, we would store a hash and when provisioning, create the user).
    // Let's add a password_hash column or temporarily store it in a secure way.
    // Wait, demo_requests does not have password_hash column!
    // We need to alter table shared.demo_requests to add password_hash if it doesn't exist, OR we don't allow setting password here and generate it on provision.
    // Let's assume we alter table dynamically here or just generate a password on provision.
    // Actually, we can just hash it and store it if the column exists. Let's add the column first.
    await client.query(`ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate unique tenant_id based on company name
    let baseTenantId = 'tenant_' + company_name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let tenantId = baseTenantId;
    let counter = 1;
    
    while (true) {
      const checkTenant = await client.query(`SELECT tenant_id FROM shared.tenants WHERE tenant_id = $1`, [tenantId]);
      if (checkTenant.rows.length === 0) break;
      tenantId = `${baseTenantId}${counter}`;
      counter++;
    }

    await client.query('BEGIN');

    // Save Demo Request Lead
    await client.query(
      `INSERT INTO shared.demo_requests (name, email, company_name, phone, status, tenant_id, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [name, email, company_name, phone, 'pending', tenantId, passwordHash]
    );

    await client.query('COMMIT');

    // Send email to Super Admin
    try {
      const { sendEmail } = require('../services/emailService');
      await sendEmail({
        to: process.env.SMTP_USER || 'admin@hrmspro.online',
        subject: 'New Demo Request',
        html: `<p>A new demo request has been submitted by <b>${name}</b> from <b>${company_name}</b> (${email}).</p><p>Please log in to the Super Admin dashboard to approve and provision this account.</p>`
      });
    } catch (emailErr) {
      console.error('Error sending admin notification email:', emailErr);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Demo request submitted successfully. We will contact you soon.'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error submitting demo request:', error);
    res.status(500).json({ success: false, message: 'Server error during submission.', error: error.message });
  } finally {
    client.release();
  }
};

// POST provision demo (Super Admin only)
exports.provisionDemo = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    // 1. Fetch demo request
    const leadResult = await client.query(`SELECT * FROM shared.demo_requests WHERE id = $1`, [id]);
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Demo request not found.' });
    }

    const lead = leadResult.rows[0];

    if (lead.status === 'provisioned') {
      return res.status(400).json({ success: false, message: 'Demo request has already been provisioned.' });
    }

    const { name, email, company_name, tenant_id: tenantId, password_hash } = lead;

    await client.query('BEGIN');

    // 2. Register Tenant in shared.tenants
    await client.query(
      `INSERT INTO shared.tenants (tenant_id, name, status, subscription_plan) VALUES ($1, $2, 'active', 'free')`,
      [tenantId, company_name]
    );

    // 3. Create Schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}"`);

    // 4. Run Migrations for the new tenant
    const tenantSchemaPath = path.join(__dirname, '../config/tenant_schema.sql');
    if (!fs.existsSync(tenantSchemaPath)) {
      throw new Error('tenant_schema.sql not found');
    }
    
    await client.query(`SET search_path TO "${tenantId}"`);
    const tenantSchemaSql = fs.readFileSync(tenantSchemaPath, 'utf8');
    await client.query(tenantSchemaSql);

    // 5. Create Admin User
    const userResult = await client.query(
      `INSERT INTO users (email, password_hash, role, is_active) 
       VALUES ($1, $2, 'admin', true) RETURNING user_id`,
      [email, password_hash]
    );
    
    const userId = userResult.rows[0].user_id;

    await client.query(
      `INSERT INTO employees (user_id, first_name, last_name, email, hire_date, status)
       VALUES ($1, $2, $3, $4, CURRENT_DATE, 'active')`,
      [userId, name.split(' ')[0], name.split(' ').slice(1).join(' ') || '', email]
    );

    // 6. Update Demo Request status
    await client.query('SET search_path TO public');
    await client.query(
      `UPDATE shared.demo_requests SET status = 'provisioned' WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');

    // 7. Send Welcome Email to User
    try {
      const { sendEmail } = require('../services/emailService');
      const frontendUrl = process.env.VITE_API_URL ? process.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5173';
      
      await sendEmail({
        to: email,
        subject: 'Welcome to HRMS Pro - Your Demo is Ready!',
        html: `
          <h2>Welcome to HRMS Pro!</h2>
          <p>Hi ${name},</p>
          <p>Your demo environment for <b>${company_name}</b> has been successfully provisioned and is ready for you to explore.</p>
          <p>You can log in to your dashboard here: <a href="${frontendUrl}/login">${frontendUrl}/login</a></p>
          <p>Use the email and password you provided during sign-up to access your admin account.</p>
          <br/>
          <p>Best regards,<br/>The HRMS Pro Team</p>
        `
      });
    } catch (emailErr) {
      console.error('Error sending welcome email:', emailErr);
    }

    res.status(200).json({ 
      success: true, 
      message: 'Demo account provisioned successfully.'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    await client.query('SET search_path TO public');
    console.error('Error auto-provisioning demo:', error);
    res.status(500).json({ success: false, message: 'Server error during provisioning.', error: error.message });
  } finally {
    client.release();
  }
};

// GET full JSON backup of a demo account
exports.backupDemoAccount = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Get tenant_id
    const leadResult = await query(`SELECT tenant_id, company_name FROM shared.demo_requests WHERE id = $1 AND status = 'provisioned'`, [id]);
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Provisioned demo account not found.' });
    }

    const { tenant_id, company_name } = leadResult.rows[0];

    // 2. Fetch all data from the tenant's schema
    const tables = [
      'users', 'departments', 'employees', 'attendance', 'attendance_regularization',
      'leave_requests', 'tasks', 'task_assignments', 'task_updates', 'shifts',
      'employee_shifts', 'payroll', 'job_postings', 'job_applications',
      'documents', 'chat_messages', 'assets', 'settings'
    ];

    const backupData = {
      metadata: {
        tenant_id,
        company_name,
        backup_date: new Date().toISOString(),
        version: '1.0'
      },
      data: {}
    };

    for (const table of tables) {
      try {
        const tableData = await query(`SELECT * FROM "${tenant_id}".${table}`);
        backupData.data[table] = tableData.rows;
      } catch (tableErr) {
        // Table might not exist or be empty, skip gracefully
        console.warn(`Could not backup table ${table} for tenant ${tenant_id}:`, tableErr.message);
        backupData.data[table] = [];
      }
    }

    // 3. Send as downloadable JSON file
    const safeCompanyName = company_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `backup_${safeCompanyName}_${new Date().toISOString().split('T')[0]}.json`;

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(JSON.stringify(backupData, null, 2));

  } catch (error) {
    console.error('Error backing up demo account:', error);
    res.status(500).json({ success: false, message: 'Server error during backup.', error: error.message });
  }
};

// DELETE a demo account (Drops schema and removes records)
exports.deleteDemoAccount = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    let twoFactorToken = req.headers['x-2fa-token'];
    if (!twoFactorToken) {
      return res.status(400).json({ success: false, message: '2FA token is required to delete a demo account.' });
    }

    // Verify 2FA
    await client.query(`SET search_path TO "tenant_default"`);
    const userRes = await client.query('SELECT two_factor_secret FROM users WHERE user_id = $1', [userId]);

    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Super Admin user not found.' });
    }

    const { two_factor_secret } = userRes.rows[0];
    if (!two_factor_secret) {
      return res.status(400).json({ success: false, message: '2FA is not enabled for your account. Please enable it first.' });
    }

    const verified = speakeasy.totp.verify({
      secret: two_factor_secret,
      encoding: 'base32',
      token: twoFactorToken
    });

    if (!verified) {
      return res.status(401).json({ success: false, message: 'Invalid 2FA token.' });
    }

    // 1. Get tenant_id
    await client.query('SET search_path TO public');
    const leadResult = await client.query(`SELECT tenant_id FROM shared.demo_requests WHERE id = $1`, [id]);
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Demo account not found.' });
    }

    const { tenant_id } = leadResult.rows[0];

    await client.query('BEGIN');

    // 2. Drop the isolated schema
    if (tenant_id) {
      await client.query(`DROP SCHEMA IF EXISTS "${tenant_id}" CASCADE`);

      // 3. Delete from shared.tenants
      await client.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [tenant_id]);
    }

    // 4. Delete from shared.demo_requests
    await client.query(`DELETE FROM shared.demo_requests WHERE id = $1`, [id]);

    await client.query('COMMIT');

    res.status(200).json({ success: true, message: 'Demo account and database completely deleted.' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting demo account:', error);
    res.status(500).json({ success: false, message: 'Server error during deletion.', error: error.message });
  } finally {
    client.release();
  }
};

// POST Restore Demo Account from Backup
exports.restoreDemoAccount = async (req, res) => {
  const client = await pool.connect();
  try {
    const backupStr = req.body.backup;
    if (!backupStr) {
      return res.status(400).json({ success: false, message: 'No backup data provided.' });
    }

    let backupData;
    try {
      backupData = typeof backupStr === 'string' ? JSON.parse(backupStr) : backupStr;
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid JSON format.' });
    }

    if (!backupData.metadata || !backupData.data) {
      return res.status(400).json({ success: false, message: 'Invalid backup file structure.' });
    }

    const { tenant_id, company_name } = backupData.metadata;
    
    await client.query('BEGIN');

    // 1. Create or update the demo_requests record
    // Check if email exists
    const adminEmail = backupData.data.users && backupData.data.users.length > 0 ? backupData.data.users.find(u => u.role === 'admin')?.email : 'admin@restored.com';
    
    // We don't have all original demo_request details, we will insert a generic one to act as anchor
    await client.query(
      `INSERT INTO shared.demo_requests (name, email, company_name, status, tenant_id) 
       VALUES ('Restored Admin', $1, $2, 'provisioned', $3)
       ON CONFLICT DO NOTHING`,
      [adminEmail, company_name, tenant_id]
    );

    // 2. Create or update shared.tenants
    await client.query(
      `INSERT INTO shared.tenants (tenant_id, name, status, subscription_plan) 
       VALUES ($1, $2, 'active', 'free')
       ON CONFLICT (tenant_id) DO UPDATE SET status = 'active'`,
      [tenant_id, company_name]
    );

    // 3. Re-create Schema
    await client.query(`DROP SCHEMA IF EXISTS "${tenant_id}" CASCADE`);
    await client.query(`CREATE SCHEMA "${tenant_id}"`);

    // 4. Run Table Migrations
    const tenantSchemaPath = path.join(__dirname, '../config/tenant_schema.sql');
    await client.query(`SET search_path TO "${tenant_id}"`);
    const tenantSchemaSql = fs.readFileSync(tenantSchemaPath, 'utf8');
    await client.query(tenantSchemaSql);

    // 5. Insert Data in strict foreign-key order
    const tables = [
      'users', 'departments', 'employees', 'attendance', 'attendance_regularization',
      'leave_requests', 'tasks', 'task_assignments', 'task_updates', 'shifts',
      'employee_shifts', 'payroll', 'job_postings', 'job_applications',
      'documents', 'chat_messages', 'assets', 'settings'
    ];

    for (const table of tables) {
      const rows = backupData.data[table];
      if (!rows || rows.length === 0) continue;

      if (table === 'settings') {
        // Clear defaults from schema creation
        await client.query(`DELETE FROM "${tenant_id}"."settings"`);
      }

      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        
        const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
        const colNames = columns.map(c => `"${c}"`).join(', ');

        const queryStr = `INSERT INTO "${tenant_id}"."${table}" (${colNames}) VALUES (${placeholders})`;
        await client.query(queryStr, values);
      }
    }

    await client.query('COMMIT');
    await client.query('SET search_path TO public');

    res.status(200).json({ success: true, message: 'Tenant successfully restored from backup.' });
  } catch (error) {
    await client.query('ROLLBACK');
    await client.query('SET search_path TO public');
    console.error('Error restoring demo account:', error);
    res.status(500).json({ success: false, message: 'Server error during restore.', error: error.message });
  } finally {
    client.release();
  }
};
