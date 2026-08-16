const { query, transaction } = require('../config/database');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const speakeasy = require('speakeasy');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

const ensureDemoRequestsTable = async () => {
  await query(`
    CREATE SCHEMA IF NOT EXISTS shared;
    CREATE TABLE IF NOT EXISTS shared.demo_requests (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      company_name VARCHAR(255) NOT NULL,
      phone VARCHAR(50),
      status VARCHAR(50) DEFAULT 'pending',
      tenant_id VARCHAR(100),
      password_hash VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
    ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
    ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
    ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
  `);
};

exports.getAllLeads = asyncHandler(async (req, res) => {
  await ensureDemoRequestsTable();
  const result = await query(`
    SELECT dr.*, t.subscription_plan 
    FROM shared.demo_requests dr
    LEFT JOIN shared.tenants t ON dr.tenant_id = t.tenant_id
    ORDER BY dr.created_at DESC
  `);
  res.json({ success: true, data: result.rows });
});

exports.applyForDemo = asyncHandler(async (req, res) => {
  const { name, email, company_name, phone, password } = req.body;

  if (!name || !email || !company_name || !password) {
    throw new ValidationError('Name, email, company, and password are required.');
  }

  await ensureDemoRequestsTable();

  const existingReq = await query(`SELECT id FROM shared.demo_requests WHERE email = $1`, [email]);
  if (existingReq.rows.length > 0) {
    throw new ConflictError('A demo has already been requested with this email.');
  }

  await query(`ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  let baseTenantId = 'tenant_' + company_name.toLowerCase().replace(/[^a-z0-9]/g, '');
  let tenantId = baseTenantId;
  let counter = 1;

  while (true) {
    const checkTenant = await query(`SELECT tenant_id FROM shared.tenants WHERE tenant_id = $1`, [tenantId]);
    if (checkTenant.rows.length === 0) break;
    tenantId = `${baseTenantId}${counter}`;
    counter++;
  }

  await transaction(async (client) => {
    await client.query(
      `INSERT INTO shared.demo_requests (name, email, company_name, phone, status, tenant_id, password_hash) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [name, email, company_name, phone, 'pending', tenantId, passwordHash]
    );
  });

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

  if (req.io) {
    req.io.emit('notification:new', {
      id: `demo_${Date.now()}`,
      module: 'leads',
      title: `New Demo Lead: ${company_name}`,
      message: `${name} (${email}) requested a live demo.`,
      action_url: '/super-admin/demo-requests',
      created_at: new Date()
    });
    req.io.emit('dashboard_update');
  }

  res.status(201).json({
    success: true,
    message: 'Demo request submitted successfully. We will contact you soon.'
  });
});

exports.provisionDemo = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const leadResult = await query(`SELECT * FROM shared.demo_requests WHERE id = $1`, [id]);
  if (leadResult.rows.length === 0) {
    throw new NotFoundError('Demo request not found.');
  }

  const lead = leadResult.rows[0];

  if (lead.status === 'provisioned') {
    throw new ConflictError('Demo request has already been provisioned.');
  }

  const { name, email, company_name, tenant_id: tenantId, password_hash } = lead;

  await transaction(async (client) => {
    await client.query(
      `INSERT INTO shared.tenants (tenant_id, name, status, subscription_plan) VALUES ($1, $2, 'active', 'free')`,
      [tenantId, company_name]
    );

    await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}"`);

    const tenantSchemaPath = path.join(__dirname, '../config/tenant_schema.sql');
    if (!fs.existsSync(tenantSchemaPath)) {
      throw new AppError('tenant_schema.sql not found', 500);
    }

    await client.query(`SET search_path TO "${tenantId}"`);
    const tenantSchemaSql = fs.readFileSync(tenantSchemaPath, 'utf8');
    await client.query(tenantSchemaSql);

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

    await client.query('SET search_path TO public');
    await client.query(
      `UPDATE shared.demo_requests SET status = 'provisioned' WHERE id = $1`,
      [id]
    );
  });

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
});

exports.backupDemoAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const leadResult = await query(`SELECT tenant_id, company_name FROM shared.demo_requests WHERE id = $1 AND status = 'provisioned'`, [id]);
  if (leadResult.rows.length === 0) {
    throw new NotFoundError('Provisioned demo account not found.');
  }

  const { tenant_id, company_name } = leadResult.rows[0];

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
      console.warn(`Could not backup table ${table} for tenant ${tenant_id}:`, tableErr.message);
      backupData.data[table] = [];
    }
  }

  const safeCompanyName = company_name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `backup_${safeCompanyName}_${new Date().toISOString().split('T')[0]}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(JSON.stringify(backupData, null, 2));
});

exports.deleteDemoAccount = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.userId;

  let twoFactorToken = req.headers['x-2fa-token'];
  if (!twoFactorToken) {
    throw new ValidationError('2FA token is required to delete a demo account.');
  }

  const userRes = await query(`SELECT two_factor_secret FROM users WHERE user_id = $1`, [userId]);
  if (userRes.rows.length === 0) {
    throw new NotFoundError('Super Admin user not found.');
  }

  const { two_factor_secret } = userRes.rows[0];
  if (!two_factor_secret) {
    throw new ValidationError('2FA is not enabled for your account. Please enable it first.');
  }

  const verified = speakeasy.totp.verify({
    secret: two_factor_secret,
    encoding: 'base32',
    token: twoFactorToken
  });

  if (!verified) {
    throw new UnauthorizedError('Invalid 2FA token.');
  }

  const leadResult = await query(`SELECT tenant_id FROM shared.demo_requests WHERE id = $1`, [id]);
  if (leadResult.rows.length === 0) {
    throw new NotFoundError('Demo account not found.');
  }

  const { tenant_id } = leadResult.rows[0];

  await transaction(async (client) => {
    if (tenant_id) {
      await client.query(`DROP SCHEMA IF EXISTS "${tenant_id}" CASCADE`);
      await client.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [tenant_id]);
    }

    await client.query(`DELETE FROM shared.demo_requests WHERE id = $1`, [id]);
  });

  res.status(200).json({ success: true, message: 'Demo account and database completely deleted.' });
});

exports.restoreDemoAccount = asyncHandler(async (req, res) => {
  const backupStr = req.body.backup;
  if (!backupStr) {
    throw new ValidationError('No backup data provided.');
  }

  let backupData;
  try {
    backupData = typeof backupStr === 'string' ? JSON.parse(backupStr) : backupStr;
  } catch (e) {
    throw new ValidationError('Invalid JSON format.');
  }

  if (!backupData.metadata || !backupData.data) {
    throw new ValidationError('Invalid backup file structure.');
  }

  const { tenant_id, company_name } = backupData.metadata;

  await transaction(async (client) => {
    const adminEmail = backupData.data.users && backupData.data.users.length > 0 ? backupData.data.users.find(u => u.role === 'admin')?.email : 'admin@restored.com';

    await client.query(
      `INSERT INTO shared.demo_requests (name, email, company_name, status, tenant_id) 
       VALUES ('Restored Admin', $1, $2, 'provisioned', $3)
       ON CONFLICT DO NOTHING`,
      [adminEmail, company_name, tenant_id]
    );

    await client.query(
      `INSERT INTO shared.tenants (tenant_id, name, status, subscription_plan) 
       VALUES ($1, $2, 'active', 'free')
       ON CONFLICT (tenant_id) DO UPDATE SET status = 'active'`,
      [tenant_id, company_name]
    );

    await client.query(`DROP SCHEMA IF EXISTS "${tenant_id}" CASCADE`);
    await client.query(`CREATE SCHEMA "${tenant_id}"`);

    const tenantSchemaPath = path.join(__dirname, '../config/tenant_schema.sql');
    await client.query(`SET search_path TO "${tenant_id}"`);
    const tenantSchemaSql = fs.readFileSync(tenantSchemaPath, 'utf8');
    await client.query(tenantSchemaSql);

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
  });

  res.status(200).json({ success: true, message: 'Tenant successfully restored from backup.' });
});

exports.downloadLeadMagnet = asyncHandler(async (req, res) => {
  const { email, name, company, resource } = req.body;

  if (!email || !name) {
    throw new ValidationError('Name and email are required.');
  }

  await query(`
    CREATE TABLE IF NOT EXISTS shared.lead_magnet_downloads (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      resource VARCHAR(255) NOT NULL DEFAULT 'HR Compliance Checklist 2026',
      downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(
    `INSERT INTO shared.lead_magnet_downloads (email, name, company, resource) VALUES ($1, $2, $3, $4)`,
    [email.trim().toLowerCase(), name.trim(), company?.trim() || '', resource || 'HR Compliance Checklist 2026']
  );

  try {
    const { sendEmail } = require('../services/emailService');
    await sendEmail({
      to: email,
      subject: 'Your HR Compliance Checklist 2026 — Download Ready',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color: #4f46e5; margin-bottom: 8px;">Thanks, ${name}!</h2>
          <p style="color: #475569; line-height: 1.6;">Your <strong>HR Compliance Checklist 2026</strong> is ready to download.</p>
          <a href="${process.env.FRONTEND_URL || 'https://hrmspro.online'}/resources"
             style="display: inline-block; margin: 16px 0; padding: 12px 32px; background: #4f46e5; color: white; text-decoration: none; border-radius: 12px; font-weight: 600;">
            Download Your Checklist
          </a>
          <p style="color: #64748b; font-size: 14px;">The link above will take you to our resources page where you can access the checklist and other helpful guides.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">HRMS Pro — Modern HR management platform for growing businesses.</p>
        </div>
      `
    });
  } catch (emailErr) {
    console.error('Error sending lead magnet email:', emailErr);
  }

  res.status(200).json({ success: true, message: 'Checklist sent! Check your inbox.' });
});

exports.submitContactInquiry = asyncHandler(async (req, res) => {
  const { name, email, company, phone, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    throw new ValidationError('Name, email, subject, and message are required.');
  }

  await query(`
    CREATE TABLE IF NOT EXISTS shared.contact_inquiries (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      company VARCHAR(255),
      phone VARCHAR(50),
      subject VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(
    `INSERT INTO shared.contact_inquiries (name, email, company, phone, subject, message) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [name.trim(), email.trim().toLowerCase(), company?.trim() || '', phone?.trim() || '', subject.trim(), message.trim()]
  );

  const { sendEmail } = require('../services/emailService');

  // 1. Notify admin
  try {
    await sendEmail({
      to: process.env.SMTP_USER || 'admin@hrmspro.online',
      subject: `New Contact Inquiry: ${subject}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; background: #fff;">
          <h2 style="color: #4f46e5; margin-bottom: 16px;">New Contact Inquiry Received</h2>
          <p style="color: #334155; font-size: 14px; margin: 6px 0;"><strong>Name:</strong> ${name}</p>
          <p style="color: #334155; font-size: 14px; margin: 6px 0;"><strong>Email:</strong> ${email}</p>
          <p style="color: #334155; font-size: 14px; margin: 6px 0;"><strong>Company:</strong> ${company || 'N/A'}</p>
          <p style="color: #334155; font-size: 14px; margin: 6px 0;"><strong>Phone:</strong> ${phone || 'N/A'}</p>
          <p style="color: #334155; font-size: 14px; margin: 6px 0;"><strong>Subject:</strong> ${subject}</p>
          <div style="margin-top: 16px; padding: 16px; background: #f8fafc; border-radius: 8px; border-left: 4px solid #4f46e5;">
            <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>
        </div>
      `
    });
  } catch (emailErr) {
    console.error('Error sending admin contact notification email:', emailErr);
  }

  // 2. Send acknowledgment to customer
  try {
    await sendEmail({
      to: email,
      subject: `We've received your message — HRMS Pro`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 580px; margin: 0 auto; background: #ffffff;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); border-radius: 16px 16px 0 0; padding: 32px 32px 28px;">
            <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">HRMS Pro</h1>
            <p style="margin: 4px 0 0; color: rgba(255,255,255,0.8); font-size: 13px;">Modern HR Management Platform</p>
          </div>

          <!-- Body -->
          <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px; padding: 32px;">
            <h2 style="margin: 0 0 8px; color: #111827; font-size: 20px; font-weight: 700;">
              Thanks for reaching out, ${name}!
            </h2>
            <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
              We've received your message and our team will get back to you within <strong style="color: #111827;">24 business hours</strong>.
            </p>

            <!-- Inquiry Summary -->
            <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px; color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Your Inquiry Summary</p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #6b7280; font-size: 13px; padding: 4px 0; width: 90px; vertical-align: top;">Subject</td>
                  <td style="color: #111827; font-size: 13px; font-weight: 600; padding: 4px 0;">${subject}</td>
                </tr>
                ${company ? `<tr>
                  <td style="color: #6b7280; font-size: 13px; padding: 4px 0; vertical-align: top;">Company</td>
                  <td style="color: #111827; font-size: 13px; padding: 4px 0;">${company}</td>
                </tr>` : ''}
                <tr>
                  <td style="color: #6b7280; font-size: 13px; padding: 4px 0; vertical-align: top;">Message</td>
                  <td style="color: #374151; font-size: 13px; padding: 4px 0; line-height: 1.5;">${message.length > 200 ? message.substring(0, 200) + '...' : message}</td>
                </tr>
              </table>
            </div>

            <!-- What happens next -->
            <div style="margin-bottom: 28px;">
              <p style="margin: 0 0 12px; color: #374151; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">What happens next?</p>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                <p style="margin: 0; color: #4b5563; font-size: 14px; padding-left: 20px; position: relative;">
                  <span style="position: absolute; left: 0; color: #4f46e5; font-weight: 700;">1.</span>
                  Our team reviews your inquiry and routes it to the right specialist.
                </p>
                <p style="margin: 0; color: #4b5563; font-size: 14px; padding-left: 20px; position: relative;">
                  <span style="position: absolute; left: 0; color: #4f46e5; font-weight: 700;">2.</span>
                  You'll receive a personalized response within 24 business hours.
                </p>
                <p style="margin: 0; color: #4b5563; font-size: 14px; padding-left: 20px; position: relative;">
                  <span style="position: absolute; left: 0; color: #4f46e5; font-weight: 700;">3.</span>
                  If you'd prefer a live walkthrough, you can book a demo anytime.
                </p>
              </div>
            </div>

            <!-- CTA -->
            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${process.env.FRONTEND_URL || 'https://hrmspro.online'}/demo"
                 style="display: inline-block; padding: 14px 32px; background: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 600;">
                Book a Free Demo
              </a>
            </div>

            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

            <p style="color: #9ca3af; font-size: 12px; margin: 0; text-align: center;">
              HRMS Pro &mdash; Modern HR Management &bull; 
              <a href="mailto:info@hrmspro.online" style="color: #6b7280; text-decoration: none;">info@hrmspro.online</a>
            </p>
          </div>
        </div>
      `
    });
  } catch (emailErr) {
    console.error('Error sending customer acknowledgment email:', emailErr);
  }

  if (req.io) {
    req.io.emit('notification:new', {
      id: `contact_${Date.now()}`,
      module: 'leads',
      title: `Contact Inquiry: ${subject}`,
      message: `From ${name} (${email})${company ? ` • ${company}` : ''}`,
      action_url: '/super-admin/demo-requests',
      created_at: new Date()
    });
    req.io.emit('dashboard_update');
  }

  res.status(200).json({ success: true, message: 'Your message has been sent successfully. We will get back to you soon.' });
});


