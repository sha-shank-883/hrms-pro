const { pool, query, transaction } = require('../config/database');
const Tenant = require('../models/tenantModel');
const { generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const speakeasy = require('speakeasy');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');
const { logPlatformAudit } = require('../utils/platformAudit');

const createTenant = asyncHandler(async (req, res) => {
  const { tenantId, name, adminEmail, adminPassword } = req.body;

  if (!tenantId || !name || !adminEmail || !adminPassword) {
    throw new ValidationError('All fields are required');
  }

  if (!/^[a-z0-9_]+$/.test(tenantId)) {
    throw new ValidationError('Invalid tenant ID format. Use lowercase letters, numbers, and underscores only.');
  }

  const existingTenant = await Tenant.findById(tenantId);
  if (existingTenant) {
    throw new ValidationError('Tenant ID already exists');
  }

  await transaction(async (client) => {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}"`);

    const schemaPath = path.join(__dirname, '../config/tenant_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    await client.query(`SET search_path TO "${tenantId}"`);
    await client.query(schemaSql);

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    await client.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')`,
      [adminEmail, hashedPassword]
    );

    await client.query(
      `INSERT INTO shared.tenants (tenant_id, name, status) VALUES ($1, $2, 'active')`,
      [tenantId, name]
    );
  });

  res.status(201).json({ message: 'Tenant created successfully', tenantId });
});

const getAllTenants = asyncHandler(async (req, res) => {
  const tenants = await Tenant.findAll();
  res.json(tenants);
});

const updateTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const updates = req.body;
  const { adminEmail, ...tenantUpdates } = updates;

  delete tenantUpdates.tenantId;
  delete tenantUpdates.tenant_id;

  // Support tenant_name as alias for name
  if (tenantUpdates.tenant_name && !tenantUpdates.name) {
    tenantUpdates.name = tenantUpdates.tenant_name;
  }

  let updatedTenant = null;

  await transaction(async (client) => {
    const allowedFields = [
      'name', 'status', 'domain', 'db_name', 'subscription_plan',
      'subscription_expiry', 'custom_modules', 'employee_limit',
      'contact_person', 'contact_email', 'contact_phone',
      'billing_address', 'city', 'country', 'tax_id',
      'billing_currency', 'billing_cycle'
    ];
    const filteredUpdates = {};

    Object.keys(tenantUpdates).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'subscription_expiry' && tenantUpdates[key] === '') {
          filteredUpdates[key] = null;
        } else if (key === 'employee_limit' && tenantUpdates[key] !== undefined) {
          filteredUpdates[key] = parseInt(tenantUpdates[key], 10) || 15;
        } else {
          filteredUpdates[key] = tenantUpdates[key];
        }
      }
    });

    if (Object.keys(filteredUpdates).length > 0) {
      updatedTenant = await Tenant.update(tenantId, filteredUpdates);
      if (!updatedTenant) {
        throw new NotFoundError('Tenant not found');
      }
    } else {
      updatedTenant = await Tenant.findById(tenantId);
    }

    if (adminEmail) {
      await client.query(`SET search_path TO "${tenantId}"`);
      await client.query(
        `UPDATE users SET email = $1 WHERE role = 'admin'`,
        [adminEmail]
      );
    }
  });

  res.json({
    success: true,
    message: 'Tenant updated successfully',
    tenant: updatedTenant
  });
});

const resetTenantAdminPassword = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    throw new ValidationError('Password must be at least 6 characters');
  }

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  const result = await query(
    `UPDATE "${tenantId}".users SET password_hash = $1 WHERE role = 'admin' RETURNING email`,
    [hashedPassword]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('No admin user found for this tenant');
  }

  res.json({ message: 'Tenant admin password reset successfully', updatedAdmins: result.rows.map(r => r.email) });
});

const deleteTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const userId = req.user.userId;

  let twoFactorToken = req.body.twoFactorToken || req.headers['x-2fa-token'];
  let adminPassword = req.body.adminPassword || req.body.password;

  if (!twoFactorToken && !adminPassword) {
    throw new ValidationError('Security verification required: Please enter your 6-digit 2FA token or Super Admin password.');
  }

  const superAdminRes = await pool.query(
    `SELECT password_hash, two_factor_secret, is_2fa_enabled FROM shared.super_admins WHERE id = $1 OR email = $2`,
    [userId, req.user.email]
  );

  if (superAdminRes.rows.length === 0) {
    throw new UnauthorizedError('Super Admin authorization failed');
  }

  const superAdmin = superAdminRes.rows[0];
  let isAuthorized = false;

  // 1. Verify 2FA token if provided
  if (twoFactorToken && superAdmin.two_factor_secret) {
    const verified = speakeasy.totp.verify({
      secret: superAdmin.two_factor_secret,
      encoding: 'base32',
      token: twoFactorToken
    });
    if (verified) isAuthorized = true;
  }

  // 2. Verify Password fallback if password provided
  if (!isAuthorized && adminPassword) {
    const isPasswordValid = await bcrypt.compare(adminPassword, superAdmin.password_hash);
    if (isPasswordValid) isAuthorized = true;
  }

  if (!isAuthorized) {
    if (twoFactorToken && !superAdmin.is_2fa_enabled) {
      throw new ValidationError('2FA is not enabled on your account. Please enter your Super Admin password, or setup 2FA first.');
    }
    throw new UnauthorizedError('Invalid 2FA token or password');
  }

  await transaction(async (client) => {
    await client.query(`DROP SCHEMA IF EXISTS "${tenantId}" CASCADE`);
    await client.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [tenantId]);
    try {
      await client.query(`DELETE FROM shared.demo_requests WHERE tenant_id = $1`, [tenantId]);
    } catch (_) {}
  });

  res.json({ success: true, message: 'Tenant deleted successfully' });
});

const getBiometricDevices = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT bd.id, bd.tenant_id, bd.serial_number, bd.brand, bd.status, bd.last_ping, bd.created_at, t.name as tenant_name
    FROM shared.biometric_devices bd
    LEFT JOIN shared.tenants t ON bd.tenant_id = t.tenant_id
    ORDER BY bd.created_at DESC
  `);
  res.json(result.rows);
});

const registerBiometricDevice = asyncHandler(async (req, res) => {
  const { tenantId, serialNumber, brand } = req.body;

  if (!tenantId || !serialNumber || !brand) {
    throw new ValidationError('Tenant ID, Serial Number, and Brand are required');
  }

  const result = await pool.query(
    `INSERT INTO shared.biometric_devices (tenant_id, serial_number, brand)
     VALUES ($1, $2, $3) RETURNING *`,
    [tenantId, serialNumber, brand]
  );

  res.status(201).json({ message: 'Device registered successfully', device: result.rows[0] });
});

const deleteBiometricDevice = asyncHandler(async (req, res) => {
  const { serialNumber } = req.params;
  const result = await pool.query(
    `DELETE FROM shared.biometric_devices WHERE serial_number = $1 RETURNING id`,
    [serialNumber]
  );

  if (result.rowCount === 0) {
    throw new NotFoundError('Device not found');
  }

  res.json({ message: 'Device deleted successfully' });
});

const impersonateTenantAdmin = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  if (tenant.status !== 'active') {
    throw new ForbiddenError('Cannot impersonate an inactive or suspended tenant');
  }

  const targetUserResult = await query(
    `SELECT u.*, e.employee_id, e.first_name, e.last_name FROM "${tenantId}".users u LEFT JOIN "${tenantId}".employees e ON u.user_id = e.user_id WHERE u.role = 'admin' AND u.is_active = true LIMIT 1`
  );

  if (targetUserResult.rows.length === 0) {
    throw new NotFoundError('No active admin user found for this tenant');
  }

  const targetAdmin = targetUserResult.rows[0];
  const token = generateToken(targetAdmin);

  await logPlatformAudit({
    action: 'IMPERSONATE_TENANT',
    category: 'impersonation',
    actor_email: req.user?.email || 'super_admin',
    actor_role: req.user?.role || 'super_admin',
    target_tenant_id: tenantId,
    details: { impersonated_email: targetAdmin.email, tenant_name: tenant.name },
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.json({
    success: true,
    message: `Impersonation successful as ${targetAdmin.email}`,
    data: {
      user: {
        userId: targetAdmin.user_id,
        email: targetAdmin.email,
        role: targetAdmin.role,
        permissions: targetAdmin.permissions || [],
        employee_id: targetAdmin.employee_id,
        first_name: targetAdmin.first_name,
        last_name: targetAdmin.last_name,
      },
      token,
      tenantId
    }
  });
});

const backupTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  // Dynamically discover ALL tables in this tenant's schema
  const schemaTablesResult = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = $1 AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
    [tenantId]
  );

  const allTables = schemaTablesResult.rows.map(r => r.table_name);

  // Backup in FK-safe order (parents before children)
  const orderedTables = [
    'users', 'departments', 'settings',
    'employees', 'shifts',
    'attendance', 'attendance_regularization', 'employee_shifts',
    'leave_requests',
    'tasks', 'task_assignments', 'task_updates',
    'payroll_runs', 'payroll',
    'payslip_templates', 'payslips', 'payslip_earnings', 'payslip_deductions',
    'email_queue',
    'job_postings', 'job_applications',
    'documents',
    'chat_messages', 'message_reactions',
    'assets',
  ];

  // Include any tables not in our ordered list at the end
  const extraTables = allTables.filter(t => !orderedTables.includes(t));
  const tablesToBackup = [...orderedTables.filter(t => allTables.includes(t)), ...extraTables];

  const backupData = {
    metadata: {
      tenant_id: tenantId,
      company_name: tenant.name,
      backup_date: new Date().toISOString(),
      version: '2.0',
      tables_backed_up: tablesToBackup
    },
    data: {}
  };

  for (const table of tablesToBackup) {
    try {
      const tableData = await pool.query(`SELECT * FROM "${tenantId}".${table}`);
      backupData.data[table] = tableData.rows;
    } catch (tableErr) {
      console.warn(`Could not backup table ${table} for tenant ${tenantId}:`, tableErr.message);
      backupData.data[table] = [];
    }
  }

  const safeCompanyName = tenant.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const filename = `backup_${safeCompanyName}_${new Date().toISOString().split('T')[0]}.json`;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(JSON.stringify(backupData, null, 2));
});

const restoreTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const backupData = req.body;

  // Validate backup structure
  if (!backupData || !backupData.metadata || !backupData.data) {
    throw new ValidationError('Invalid backup file format. Expected { metadata, data } structure.');
  }

  if (backupData.metadata.tenant_id !== tenantId) {
    throw new ValidationError(
      `Backup tenant ID "${backupData.metadata.tenant_id}" does not match target tenant "${tenantId}". ` +
      `To restore to a different tenant, update the metadata.tenant_id in the backup file.`
    );
  }

  const schemaPath = path.join(__dirname, '../config/tenant_schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const restoredTables = [];
  const failedTables = [];

  await transaction(async (client) => {
    // 1. Drop existing schema and recreate it fresh
    await client.query(`DROP SCHEMA IF EXISTS "${tenantId}" CASCADE`);
    await client.query(`CREATE SCHEMA "${tenantId}"`);
    await client.query(`SET search_path TO "${tenantId}"`);

    // 2. Run the schema template (creates all tables + default settings)
    await client.query(schemaSql);

    // 3. Clear the default settings inserted by the schema so we restore the tenant's actual settings
    await client.query(`DELETE FROM "${tenantId}".settings`);

    // 4. Restore data in FK-safe order
    const orderedTables = [
      'users', 'departments', 'settings',
      'employees', 'shifts',
      'attendance', 'attendance_regularization', 'employee_shifts',
      'leave_requests',
      'tasks', 'task_assignments', 'task_updates',
      'payroll_runs', 'payroll',
      'payslip_templates', 'payslips', 'payslip_earnings', 'payslip_deductions',
      'email_queue',
      'job_postings', 'job_applications',
      'documents',
      'chat_messages', 'message_reactions',
      'assets',
    ];

    const backupTables = Object.keys(backupData.data);
    const extraTables = backupTables.filter(t => !orderedTables.includes(t));
    const tablesToRestore = [...orderedTables.filter(t => backupTables.includes(t)), ...extraTables];

    for (const table of tablesToRestore) {
      const rows = backupData.data[table];
      if (!rows || rows.length === 0) {
        restoredTables.push({ table, rows: 0 });
        continue;
      }

      try {
        // Disable triggers/FK checks temporarily using deferred constraints
        await client.query(`SET CONSTRAINTS ALL DEFERRED`);

        const columns = Object.keys(rows[0]);
        const columnList = columns.map(c => `"${c}"`).join(', ');

        for (const row of rows) {
          const values = columns.map(c => {
            const v = row[c];
            if (v === null || v === undefined) return null;
            if (typeof v === 'object') return JSON.stringify(v);
            return v;
          });
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

          await client.query(
            `INSERT INTO "${tenantId}".${table} (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
            values
          );
        }

        // Re-enable constraints
        await client.query(`SET CONSTRAINTS ALL IMMEDIATE`);

        // Reset the sequence for SERIAL columns after restore
        const pkResult = await client.query(
          `SELECT column_name FROM information_schema.columns
           WHERE table_schema = $1 AND table_name = $2
           AND column_default LIKE 'nextval%'
           LIMIT 1`,
          [tenantId, table]
        );
        if (pkResult.rows.length > 0) {
          const pkCol = pkResult.rows[0].column_name;
          await client.query(
            `SELECT setval(pg_get_serial_sequence('"${tenantId}".${table}', '${pkCol}'),
             COALESCE((SELECT MAX("${pkCol}") FROM "${tenantId}".${table}), 1), true)`
          );
        }

        restoredTables.push({ table, rows: rows.length });
      } catch (tableErr) {
        console.warn(`Could not restore table ${table}:`, tableErr.message);
        failedTables.push({ table, error: tableErr.message });
        // Don't fail the whole restore — just log and continue
        await client.query(`SET CONSTRAINTS ALL IMMEDIATE`);
      }
    }

    // 5. Ensure the tenant record exists in shared.tenants
    const existingTenant = await client.query(
      `SELECT tenant_id FROM shared.tenants WHERE tenant_id = $1`, [tenantId]
    );
    if (existingTenant.rows.length === 0) {
      await client.query(
        `INSERT INTO shared.tenants (tenant_id, name, status) VALUES ($1, $2, 'active')`,
        [tenantId, backupData.metadata.company_name]
      );
    } else {
      // Reactivate if it was deleted/suspended
      await client.query(
        `UPDATE shared.tenants SET status = 'active', name = $2 WHERE tenant_id = $1`,
        [tenantId, backupData.metadata.company_name]
      );
    }
  });

  res.json({
    message: 'Tenant restored successfully from backup',
    tenant_id: tenantId,
    company_name: backupData.metadata.company_name,
    original_backup_date: backupData.metadata.backup_date,
    restored_tables: restoredTables,
    failed_tables: failedTables,
    total_restored: restoredTables.reduce((sum, t) => sum + t.rows, 0)
  });
});

const SYSTEM_MODULES = [
  { key: 'core_hr', name: 'Core HR & Employees', description: 'Employee directory, departments, org chart, and profile', category: 'Core', isCore: true },
  { key: 'attendance', name: 'Attendance & Shifts', description: 'Clock in/out, geofence, shifts, and regularization', category: 'Core' },
  { key: 'leaves', name: 'Leave Management', description: 'Leave requests, balances, comp-off, and multi-level approvals', category: 'Core' },
  { key: 'tasks', name: 'Task Management', description: 'Task Kanban board, priorities, assignments, and tracking', category: 'Operations' },
  { key: 'documents', name: 'Document Management', description: 'Employee docs, auto-generated letters, and e-signatures', category: 'Operations' },
  { key: 'performance', name: 'Performance & Appraisals', description: 'Performance reviews, KPIs, OKRs, and goals', category: 'HR' },
  { key: 'payroll', name: 'Automated Payroll', description: 'Salary calculations, payslip designer, and batch runs', category: 'Finance' },
  { key: 'assets', name: 'Asset Inventory', description: 'Company equipment tracking, custody, and return history', category: 'Operations' },
  { key: 'chat', name: 'Team Chat', description: 'Real-time team messaging, departmental channels, and direct messages', category: 'Collaboration' },
  { key: 'recruitment', name: 'Recruitment & ATS', description: 'Job openings, candidate pipeline, and interview management', category: 'HR' },
  { key: 'biometrics', name: 'Biometric Integration', description: 'Hardware device attendance sync and punch logs', category: 'Hardware' },
  { key: 'live_activity', name: 'Live Activity Stream', description: 'Real-time employee pulse, status radar, and presence', category: 'Analytics' },
  { key: 'reports_analytics', name: 'Advanced Reports', description: 'Custom report builder, churn risk, and export tools', category: 'Analytics' },
  { key: 'audit_logs', name: 'Security Audit Logs', description: 'System-wide compliance audit trail and activity log', category: 'Security' },
  { key: 'ai_assistant', name: 'AI HR Intelligence Suite', description: 'AI Resume screening, job description writer, smart email drafter, and performance insights', category: 'AI & Automation' },
];

/**
 * Super Admin: Get all plan configurations & system module list
 */
const getPlanConfigs = asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT plan_id, name, description, price_inr, price_usd, employee_limit, modules, is_active, updated_at 
     FROM shared.plan_configs 
     ORDER BY price_usd ASC, price_inr ASC`
  );

  res.json({
    success: true,
    plans: result.rows,
    systemModules: SYSTEM_MODULES
  });
});

/**
 * Super Admin: Update a plan configuration (modules, limits, pricing)
 */
const updatePlanConfig = asyncHandler(async (req, res) => {
  const { planId } = req.params;
  const { name, description, price_inr, price_usd, employee_limit, modules, is_active } = req.body;

  if (!planId) {
    throw new ValidationError('Plan ID is required');
  }

  // Ensure core_hr is always included
  let finalModules = Array.isArray(modules) ? modules : [];
  if (!finalModules.includes('core_hr')) {
    finalModules.unshift('core_hr');
  }

  const result = await pool.query(
    `UPDATE shared.plan_configs
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         price_inr = COALESCE($3, price_inr),
         price_usd = COALESCE($4, price_usd),
         employee_limit = COALESCE($5, employee_limit),
         modules = $6,
         is_active = COALESCE($7, is_active),
         updated_at = CURRENT_TIMESTAMP
     WHERE plan_id = $8
     RETURNING *`,
    [name, description, price_inr, price_usd, employee_limit, JSON.stringify(finalModules), is_active, planId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError(`Plan '${planId}' not found`);
  }

  res.json({
    success: true,
    message: `Plan '${planId}' configuration updated successfully`,
    plan: result.rows[0]
  });
});

/**
 * Super Admin: Get active modules and override state for a specific tenant
 */
const getTenantModules = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;

  const tenantRes = await pool.query(
    `SELECT tenant_id, name, subscription_plan, subscription_expiry, custom_modules, employee_limit, status
     FROM shared.tenants 
     WHERE tenant_id = $1`,
    [tenantId]
  );

  if (tenantRes.rows.length === 0) {
    throw new NotFoundError(`Tenant '${tenantId}' not found`);
  }

  const tenant = tenantRes.rows[0];
  const { getTenantActiveModules } = require('../utils/moduleEntitlements');
  const entitlement = await getTenantActiveModules(tenantId);

  res.json({
    success: true,
    tenant_id: tenant.tenant_id,
    name: tenant.name,
    subscription_plan: tenant.subscription_plan,
    custom_modules: tenant.custom_modules,
    is_custom: entitlement.isCustom,
    active_modules: entitlement.modules,
    systemModules: SYSTEM_MODULES
  });
});

/**
 * Super Admin: Manually assign custom modules or reset to plan default for a specific tenant
 */
const updateTenantModules = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { customModules, resetToDefault } = req.body;

  const tenantRes = await pool.query(
    `SELECT tenant_id, subscription_plan FROM shared.tenants WHERE tenant_id = $1`,
    [tenantId]
  );

  if (tenantRes.rows.length === 0) {
    throw new NotFoundError(`Tenant '${tenantId}' not found`);
  }

  if (resetToDefault === true || customModules === null) {
    // Reset to inherit plan modules dynamically
    await pool.query(
      `UPDATE shared.tenants SET custom_modules = NULL, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = $1`,
      [tenantId]
    );

    const { getTenantActiveModules } = require('../utils/moduleEntitlements');
    const entitlement = await getTenantActiveModules(tenantId);

    return res.json({
      success: true,
      message: `Tenant '${tenantId}' reset to default plan modules (${tenantRes.rows[0].subscription_plan})`,
      is_custom: false,
      active_modules: entitlement.modules
    });
  }

  if (!Array.isArray(customModules)) {
    throw new ValidationError('customModules must be an array of module keys or null');
  }

  // Ensure core_hr is always enabled
  const moduleSet = new Set(customModules);
  moduleSet.add('core_hr');
  const finalModules = Array.from(moduleSet);

  await pool.query(
    `UPDATE shared.tenants SET custom_modules = $1, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = $2`,
    [JSON.stringify(finalModules), tenantId]
  );

  res.json({
    success: true,
    message: `Custom modules assigned to tenant '${tenantId}' successfully`,
    is_custom: true,
    active_modules: finalModules
  });
});

/**
 * Super Admin: Get platform-wide billing overview and transaction history
 */
const getBillingOverview = asyncHandler(async (req, res) => {
  const revRes = await pool.query(`
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN status = 'completed' AND currency = 'INR' THEN amount ELSE 0 END), 0) as total_inr,
      COALESCE(SUM(CASE WHEN status = 'completed' AND currency = 'USD' THEN amount ELSE 0 END), 0) as total_usd,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as total_successful_payments,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as total_pending_payments
    FROM shared.payment_logs
  `);

  const subRes = await pool.query(`
    SELECT 
      COUNT(*) as total_tenants,
      COUNT(CASE WHEN status = 'active' THEN 1 END) as active_tenants,
      COUNT(CASE WHEN subscription_plan != 'free' THEN 1 END) as paid_subscriptions,
      COUNT(CASE WHEN subscription_expiry < NOW() THEN 1 END) as expired_subscriptions,
      COUNT(CASE WHEN subscription_expiry >= NOW() AND subscription_expiry <= NOW() + INTERVAL '7 days' THEN 1 END) as expiring_soon
    FROM shared.tenants
  `);

  const txnRes = await pool.query(`
    SELECT 
      p.*,
      t.name as tenant_name,
      t.contact_email,
      t.contact_person
    FROM shared.payment_logs p
    LEFT JOIN shared.tenants t ON p.tenant_id = t.tenant_id
    ORDER BY p.created_at DESC
    LIMIT 100
  `);

  res.json({
    success: true,
    summary: {
      ...revRes.rows[0],
      ...subRes.rows[0]
    },
    transactions: txnRes.rows
  });
});

/**
 * Super Admin: Get specific tenant customer contact & billing profile
 */
const getTenantBillingProfile = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const tenantRes = await pool.query(`
    SELECT 
      tenant_id, name, domain, status, subscription_plan, subscription_expiry,
      employee_limit, contact_person, contact_email, contact_phone,
      billing_address, city, country, tax_id, billing_currency, billing_cycle,
      created_at, updated_at
    FROM shared.tenants
    WHERE tenant_id = $1
  `, [tenantId]);

  if (tenantRes.rows.length === 0) {
    throw new NotFoundError(`Tenant '${tenantId}' not found`);
  }

  const invoicesRes = await pool.query(`
    SELECT * 
    FROM shared.payment_logs 
    WHERE tenant_id = $1 
    ORDER BY created_at DESC
  `, [tenantId]);

  res.json({
    success: true,
    tenant: tenantRes.rows[0],
    invoices: invoicesRes.rows
  });
});

/**
 * Super Admin: Update tenant contact and billing details
 */
const updateTenantBillingProfile = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const {
    contact_person, contact_email, contact_phone,
    billing_address, city, country, tax_id,
    billing_currency, billing_cycle
  } = req.body;

  const result = await pool.query(`
    UPDATE shared.tenants
    SET 
      contact_person = COALESCE($1, contact_person),
      contact_email = COALESCE($2, contact_email),
      contact_phone = COALESCE($3, contact_phone),
      billing_address = COALESCE($4, billing_address),
      city = COALESCE($5, city),
      country = COALESCE($6, country),
      tax_id = COALESCE($7, tax_id),
      billing_currency = COALESCE($8, billing_currency),
      billing_cycle = COALESCE($9, billing_cycle),
      updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = $10
    RETURNING *
  `, [
    contact_person, contact_email, contact_phone,
    billing_address, city, country, tax_id,
    billing_currency, billing_cycle, tenantId
  ]);

  if (result.rows.length === 0) {
    throw new NotFoundError(`Tenant '${tenantId}' not found`);
  }

  res.json({
    success: true,
    message: 'Tenant contact & billing profile updated successfully',
    tenant: result.rows[0]
  });
});

/**
 * Super Admin: Manually record an offline payment (Wire / Cash / Cheque) and extend subscription
 */
const recordManualPayment = asyncHandler(async (req, res) => {
  const {
    tenant_id,
    plan_id,
    amount,
    currency = 'INR',
    gateway = 'manual_wire',
    duration_days = 30,
    invoice_number,
    transaction_id,
    notes
  } = req.body;

  if (!tenant_id || !plan_id || !amount) {
    throw new ValidationError('Tenant ID, plan ID, and amount are required.');
  }

  const tenantRes = await pool.query(`SELECT * FROM shared.tenants WHERE tenant_id = $1`, [tenant_id]);
  if (tenantRes.rows.length === 0) {
    throw new NotFoundError(`Tenant '${tenant_id}' not found`);
  }

  const generatedInvoiceNumber = invoice_number || `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const genTxnId = transaction_id || `MANUAL-${Date.now()}`;

  const currentExpiry = tenantRes.rows[0].subscription_expiry ? new Date(tenantRes.rows[0].subscription_expiry) : new Date();
  const baseDate = currentExpiry > new Date() ? currentExpiry : new Date();
  const newExpiry = new Date(baseDate.getTime() + parseInt(duration_days) * 24 * 60 * 60 * 1000);

  const paymentRes = await pool.query(`
    INSERT INTO shared.payment_logs 
      (tenant_id, plan_id, amount, currency, gateway, transaction_id, invoice_number, status, notes, billing_period_start, billing_period_end)
    VALUES 
      ($1, $2, $3, $4, $5, $6, $7, 'completed', $8, $9, $10)
    RETURNING *
  `, [
    tenant_id, plan_id, amount, currency, gateway, genTxnId,
    generatedInvoiceNumber, notes || 'Manual payment recorded by Super Admin',
    baseDate, newExpiry
  ]);

  await pool.query(`
    UPDATE shared.tenants 
    SET 
      subscription_plan = $1,
      subscription_expiry = $2,
      status = 'active',
      updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = $3
  `, [plan_id, newExpiry, tenant_id]);

  // Real-time Super Admin Notification via Socket.IO
  if (req.io) {
    req.io.emit('notification:new', {
      id: `pay_${paymentRes.rows[0]?.id || Date.now()}`,
      module: 'billing',
      title: `Payment Logged: ${currency} ${amount}`,
      message: `Tenant "${tenant_id}" payment of ${currency} ${amount} recorded (${gateway}).`,
      action_url: '/super-admin/billing',
      created_at: new Date()
    });
    req.io.emit('dashboard_update');
  }

  res.json({
    success: true,
    message: `Manual payment recorded and subscription extended until ${newExpiry.toLocaleDateString()}`,
    payment: paymentRes.rows[0],
    new_expiry: newExpiry
  });
});

/**
 * Tenant Admin: Get self-serve company billing, current plan, and invoice history
 */
const getMyTenantBilling = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

  if (!tenantId) {
    throw new BadRequestError('Tenant context is required');
  }

  const tenantRes = await pool.query(`
    SELECT 
      tenant_id, name, domain, status, subscription_plan, subscription_expiry,
      employee_limit, contact_person, contact_email, contact_phone,
      billing_address, city, country, tax_id, billing_currency, billing_cycle,
      created_at
    FROM shared.tenants
    WHERE tenant_id = $1
  `, [tenantId]);

  if (tenantRes.rows.length === 0) {
    throw new NotFoundError(`Tenant '${tenantId}' not found`);
  }

  const invoicesRes = await pool.query(`
    SELECT * 
    FROM shared.payment_logs 
    WHERE tenant_id = $1 
    ORDER BY created_at DESC
  `, [tenantId]);

  // Try to count employees in tenant schema safely
  let employeeCount = 0;
  try {
    const empRes = await pool.query(`SELECT COUNT(*) FROM "${tenantId}".employees`);
    employeeCount = parseInt(empRes.rows[0]?.count || 0);
  } catch (err) {
    // schema might have different structure or 0
    employeeCount = 0;
  }

  res.json({
    success: true,
    tenant: tenantRes.rows[0],
    employeeCount,
    invoices: invoicesRes.rows
  });
});

/**
 * Tenant Admin: Update company's own billing contact & tax profile
 */
const updateMyTenantBilling = asyncHandler(async (req, res) => {
  const tenantId = req.user?.tenantId || req.headers['x-tenant-id'];

  if (!tenantId) {
    throw new BadRequestError('Tenant context is required');
  }

  const {
    contact_person, contact_email, contact_phone,
    billing_address, city, country, tax_id,
    billing_currency, billing_cycle
  } = req.body;

  const result = await pool.query(`
    UPDATE shared.tenants
    SET 
      contact_person = COALESCE($1, contact_person),
      contact_email = COALESCE($2, contact_email),
      contact_phone = COALESCE($3, contact_phone),
      billing_address = COALESCE($4, billing_address),
      city = COALESCE($5, city),
      country = COALESCE($6, country),
      tax_id = COALESCE($7, tax_id),
      billing_currency = COALESCE($8, billing_currency),
      billing_cycle = COALESCE($9, billing_cycle),
      updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = $10
    RETURNING *
  `, [
    contact_person, contact_email, contact_phone,
    billing_address, city, country, tax_id,
    billing_currency, billing_cycle, tenantId
  ]);

  if (result.rows.length === 0) {
    throw new NotFoundError(`Tenant '${tenantId}' not found`);
  }

  res.json({
    success: true,
    message: 'Billing profile updated successfully',
    tenant: result.rows[0]
  });
});

/**
 * Universal: Get detailed invoice JSON (Super Admin or Tenant Admin for their own invoice)
 */
const getInvoiceDetails = asyncHandler(async (req, res) => {
  const { invoiceId } = req.params;
  const isSuperAdmin = req.user?.isSuperAdmin || req.user?.role === 'super_admin' || req.user?.role === 'super-admin';
  const tenantId = req.user?.tenant_id || req.user?.tenantId || req.tenant?.tenant_id || req.headers['x-tenant-id'];

  const invoiceRes = await pool.query(`
    SELECT 
      p.*,
      t.name as tenant_name,
      t.domain as tenant_domain,
      t.contact_person,
      t.contact_email,
      t.contact_phone,
      t.billing_address,
      t.city,
      t.country,
      t.tax_id
    FROM shared.payment_logs p
    LEFT JOIN shared.tenants t ON p.tenant_id = t.tenant_id
    WHERE p.id::text = $1 OR p.invoice_number = $1
    LIMIT 1
  `, [String(invoiceId)]);

  if (invoiceRes.rows.length === 0) {
    throw new NotFoundError(`Invoice '${invoiceId}' not found`);
  }

  const invoice = invoiceRes.rows[0];

  // If not super admin, must match tenant_id
  if (!isSuperAdmin && invoice.tenant_id !== tenantId) {
    throw new ForbiddenError('You do not have access to view this invoice');
  }

  res.json({
    success: true,
    invoice: {
      ...invoice,
      vendor: {
        company_name: 'HRMS Pro Technologies Inc.',
        address: 'Level 5, Enterprise Tower, Cyber City',
        city: 'Hyderabad, Telangana, 500081',
        country: 'India',
        tax_id: '36AAAAA0000A1Z5',
        support_email: 'billing@hrmspro.online',
        website: 'https://hrmspro.online'
      }
    }
  });
});

/**
 * Super Admin: Get Full Sales, Marketing & Growth Analytics Report
 */
const getGrowthAnalytics = asyncHandler(async (req, res) => {
  // 1. Overall Revenue & Subscriptions
  const revSummary = await pool.query(`
    SELECT 
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN status = 'completed' AND currency = 'INR' THEN amount ELSE 0 END), 0) as total_inr,
      COALESCE(SUM(CASE WHEN status = 'completed' AND currency = 'USD' THEN amount ELSE 0 END), 0) as total_usd,
      COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as revenue_last_30_days,
      COALESCE(SUM(CASE WHEN status = 'completed' AND created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as revenue_prev_30_days,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_transactions,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_transactions
    FROM shared.payment_logs
  `);

  // 2. Compute MRR & ARR from active paid tenants and plan configs
  const mrrRes = await pool.query(`
    SELECT 
      COALESCE(SUM(pc.price_inr), 0) as mrr_inr,
      COALESCE(SUM(pc.price_usd), 0) as mrr_usd,
      COUNT(t.tenant_id) as paid_tenant_count
    FROM shared.tenants t
    JOIN shared.plan_configs pc ON t.subscription_plan = pc.plan_id
    WHERE t.status = 'active' AND t.subscription_plan != 'free'
  `);

  // 3. Marketing & Sales Funnel: Leads to Conversions
  const leadsSummary = await pool.query(`
    SELECT 
      COUNT(*) as total_leads,
      COUNT(CASE WHEN status = 'new' OR status = 'pending' THEN 1 END) as pending_leads,
      COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contacted_leads,
      COUNT(CASE WHEN status = 'provisioned' OR status = 'converted' THEN 1 END) as converted_leads,
      COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as leads_last_30_days
    FROM shared.demo_requests
  `);

  // 4. Monthly Revenue Trend (Last 6 Months)
  const monthlyRevenue = await pool.query(`
    SELECT 
      TO_CHAR(created_at, 'Mon YYYY') as month_label,
      DATE_TRUNC('month', created_at) as month_date,
      COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as revenue,
      COALESCE(SUM(CASE WHEN status = 'completed' AND currency = 'INR' THEN amount ELSE 0 END), 0) as revenue_inr,
      COALESCE(SUM(CASE WHEN status = 'completed' AND currency = 'USD' THEN amount ELSE 0 END), 0) as revenue_usd,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as transaction_count
    FROM shared.payment_logs
    WHERE created_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', created_at), TO_CHAR(created_at, 'Mon YYYY')
    ORDER BY month_date ASC
  `);

  // 5. Monthly Tenant Signups & Leads Trend (Last 6 Months)
  const monthlyGrowth = await pool.query(`
    SELECT 
      TO_CHAR(t.created_at, 'Mon YYYY') as month_label,
      DATE_TRUNC('month', t.created_at) as month_date,
      COUNT(*) as new_tenants
    FROM shared.tenants t
    WHERE t.created_at >= NOW() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', t.created_at), TO_CHAR(t.created_at, 'Mon YYYY')
    ORDER BY month_date ASC
  `);

  // 6. Plan Distribution Matrix
  const planDist = await pool.query(`
    SELECT 
      COALESCE(pc.name, t.subscription_plan) as plan_name,
      t.subscription_plan as plan_id,
      COALESCE(pc.price_inr, 0) as price_inr,
      COALESCE(pc.price_usd, 0) as price_usd,
      COUNT(t.tenant_id) as tenant_count,
      COUNT(CASE WHEN t.status = 'active' THEN 1 END) as active_count
    FROM shared.tenants t
    LEFT JOIN shared.plan_configs pc ON t.subscription_plan = pc.plan_id
    GROUP BY pc.name, t.subscription_plan, pc.price_inr, pc.price_usd
    ORDER BY tenant_count DESC
  `);

  // 7. Top 10 Revenue Customer Accounts
  const topTenants = await pool.query(`
    SELECT 
      t.tenant_id,
      t.name as tenant_name,
      t.subscription_plan,
      t.employee_limit,
      t.contact_person,
      t.contact_email,
      t.status,
      COALESCE(SUM(p.amount), 0) as total_paid,
      COUNT(p.id) as payment_count,
      MAX(p.created_at) as last_payment_date
    FROM shared.tenants t
    LEFT JOIN shared.payment_logs p ON t.tenant_id = p.tenant_id AND p.status = 'completed'
    GROUP BY t.tenant_id, t.name, t.subscription_plan, t.employee_limit, t.contact_person, t.contact_email, t.status
    ORDER BY total_paid DESC, t.created_at DESC
    LIMIT 10
  `);

  // 8. Recent Conversions and Demo Leads
  const recentLeads = await pool.query(`
    SELECT id, name, email, company_name, phone, status, tenant_id, created_at
    FROM shared.demo_requests
    ORDER BY created_at DESC
    LIMIT 8
  `);

  // Compute Growth Rates & Conversion Percentages
  const totalLeads = parseInt(leadsSummary.rows[0]?.total_leads || 0, 10);
  const convertedLeads = parseInt(leadsSummary.rows[0]?.converted_leads || 0, 10);
  const conversionRate = totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(1) : '0.0';

  const revLast30 = parseFloat(revSummary.rows[0]?.revenue_last_30_days || 0);
  const revPrev30 = parseFloat(revSummary.rows[0]?.revenue_prev_30_days || 0);
  const momGrowth = revPrev30 > 0 
    ? (((revLast30 - revPrev30) / revPrev30) * 100).toFixed(1) 
    : revLast30 > 0 ? '+100.0' : '0.0';

  const mrrInr = parseFloat(mrrRes.rows[0]?.mrr_inr || 0);
  const mrrUsd = parseFloat(mrrRes.rows[0]?.mrr_usd || 0);
  const arrInr = mrrInr * 12;
  const arrUsd = mrrUsd * 12;

  res.json({
    success: true,
    data: {
      metrics: {
        total_revenue: parseFloat(revSummary.rows[0]?.total_revenue || 0),
        total_inr: parseFloat(revSummary.rows[0]?.total_inr || 0),
        total_usd: parseFloat(revSummary.rows[0]?.total_usd || 0),
        mrr_inr: mrrInr,
        mrr_usd: mrrUsd,
        arr_inr: arrInr,
        arr_usd: arrUsd,
        mom_growth_percent: momGrowth,
        paid_tenants: parseInt(mrrRes.rows[0]?.paid_tenant_count || 0, 10),
        total_leads: totalLeads,
        pending_leads: parseInt(leadsSummary.rows[0]?.pending_leads || 0, 10),
        converted_leads: convertedLeads,
        conversion_rate_percent: conversionRate,
        completed_transactions: parseInt(revSummary.rows[0]?.completed_transactions || 0, 10)
      },
      monthly_revenue: monthlyRevenue.rows,
      monthly_growth: monthlyGrowth.rows,
      plan_distribution: planDist.rows,
      top_tenants: topTenants.rows,
      recent_leads: recentLeads.rows
    }
  });
});

/**
 * Helper to ensure shared.platform_broadcasts table exists
 */
const ensureBroadcastsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared.platform_broadcasts (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info',
        target_tier VARCHAR(50) DEFAULT 'all',
        is_active BOOLEAN DEFAULT true,
        dismissible BOOLEAN DEFAULT true,
        starts_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_broadcasts_active_tier ON shared.platform_broadcasts (is_active, target_tier);
    `);
  } catch (err) {
    console.error('ensureBroadcastsTable warning:', err.message);
  }
};

/**
 * Public/Tenant: Get active broadcasts for current tenant's tier
 */
const getActiveBroadcasts = asyncHandler(async (req, res) => {
  try {
    await ensureBroadcastsTable();

    const tenantId = req.tenantId || req.user?.tenant_id;
    let targetTier = 'all';
    if (tenantId) {
      const tRes = await pool.query('SELECT subscription_plan FROM shared.tenants WHERE tenant_id = $1', [tenantId]);
      if (tRes.rows.length > 0) {
        targetTier = tRes.rows[0].subscription_plan || 'free';
      }
    }

    const broadcasts = await pool.query(`
      SELECT id, title, message, type, target_tier, dismissible, starts_at, expires_at
      FROM shared.platform_broadcasts
      WHERE is_active = true
        AND (target_tier = 'all' OR target_tier = $1)
        AND starts_at <= CURRENT_TIMESTAMP
        AND (expires_at IS NULL OR expires_at >= CURRENT_TIMESTAMP)
      ORDER BY starts_at DESC
      LIMIT 5
    `, [targetTier]);

    return res.json({
      success: true,
      broadcasts: broadcasts.rows || []
    });
  } catch (err) {
    console.error('getActiveBroadcasts warning:', err.message);
    return res.json({
      success: true,
      broadcasts: []
    });
  }
});

/**
 * Super Admin: Get all broadcasts
 */
const getAllBroadcasts = asyncHandler(async (req, res) => {
  try {
    await ensureBroadcastsTable();
    const result = await pool.query(`
      SELECT * FROM shared.platform_broadcasts
      ORDER BY created_at DESC
    `);
    res.json({ success: true, broadcasts: result.rows || [] });
  } catch (err) {
    console.error('getAllBroadcasts warning:', err.message);
    res.json({ success: true, broadcasts: [] });
  }
});

/**
 * Super Admin: Create a new platform broadcast
 */
const createBroadcast = asyncHandler(async (req, res) => {
  await ensureBroadcastsTable();
  const { title, message, type = 'info', target_tier = 'all', is_active = true, expires_at = null, dismissible = true } = req.body;
  if (!title || !message) {
    throw new ValidationError('Title and message are required');
  }
  const result = await pool.query(`
    INSERT INTO shared.platform_broadcasts 
      (title, message, type, target_tier, is_active, expires_at, dismissible, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [title, message, type, target_tier, is_active, expires_at, dismissible, req.user?.email || 'super_admin']);

  await logPlatformAudit({
    action: 'CREATE_BROADCAST',
    category: 'broadcast',
    actor_email: req.user?.email || 'super_admin',
    actor_role: req.user?.role || 'super_admin',
    details: { broadcast_id: result.rows[0].id, title, type, target_tier },
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.status(201).json({ success: true, broadcast: result.rows[0] });
});

/**
 * Super Admin: Update a platform broadcast
 */
const updateBroadcast = asyncHandler(async (req, res) => {
  await ensureBroadcastsTable();
  const { id } = req.params;
  const { title, message, type, target_tier, is_active, expires_at, dismissible } = req.body;
  const result = await pool.query(`
    UPDATE shared.platform_broadcasts
    SET 
      title = COALESCE($1, title),
      message = COALESCE($2, message),
      type = COALESCE($3, type),
      target_tier = COALESCE($4, target_tier),
      is_active = COALESCE($5, is_active),
      expires_at = $6,
      dismissible = COALESCE($7, dismissible),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $8
    RETURNING *
  `, [title, message, type, target_tier, is_active, expires_at, dismissible, id]);

  if (result.rows.length === 0) {
    throw new NotFoundError('Broadcast not found');
  }

  res.json({ success: true, broadcast: result.rows[0] });
});

/**
 * Super Admin: Delete a platform broadcast
 */
const deleteBroadcast = asyncHandler(async (req, res) => {
  await ensureBroadcastsTable();
  const { id } = req.params;
  const result = await pool.query(`DELETE FROM shared.platform_broadcasts WHERE id = $1 RETURNING id, title`, [id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Broadcast not found');
  }

  await logPlatformAudit({
    action: 'DELETE_BROADCAST',
    category: 'broadcast',
    actor_email: req.user?.email || 'super_admin',
    actor_role: req.user?.role || 'super_admin',
    details: { broadcast_id: id, title: result.rows[0].title },
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.json({ success: true, message: 'Broadcast deleted successfully' });
});

/**
 * Super Admin: Get cross-tenant platform security & audit logs
 */
const getPlatformAuditLogs = asyncHandler(async (req, res) => {
  const { category, search, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  
  let conditions = [];
  let params = [];
  let paramIdx = 1;

  if (category && category !== 'all') {
    conditions.push(`category = $${paramIdx++}`);
    params.push(category);
  }

  if (search) {
    conditions.push(`(action ILIKE $${paramIdx} OR actor_email ILIKE $${paramIdx} OR target_tenant_id ILIKE $${paramIdx})`);
    params.push(`%${search}%`);
    paramIdx++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const logsRes = await pool.query(`
    SELECT * FROM shared.platform_audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${paramIdx++} OFFSET $${paramIdx++}
  `, [...params, parseInt(limit, 10), offset]);

  const countRes = await pool.query(`
    SELECT COUNT(*) as total FROM shared.platform_audit_logs
    ${whereClause}
  `, params);

  res.json({
    success: true,
    logs: logsRes.rows,
    pagination: {
      total: parseInt(countRes.rows[0].total, 10),
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      totalPages: Math.ceil(parseInt(countRes.rows[0].total, 10) / parseInt(limit, 10))
    }
  });
});

/**
 * Super Admin: Get live system health & infrastructure diagnostics
 */
const getSystemHealthDiagnostics = asyncHandler(async (req, res) => {
  const startHr = process.hrtime();
  await pool.query('SELECT 1');
  const elapsedHr = process.hrtime(startHr);
  const latencyMs = (elapsedHr[0] * 1000 + elapsedHr[1] / 1e6).toFixed(2);

  const poolStats = {
    totalConnections: pool.totalCount || 0,
    idleConnections: pool.idleCount || 0,
    waitingClients: pool.waitingCount || 0,
    queryLatencyMs: parseFloat(latencyMs)
  };

  const storageRes = await pool.query(`
    SELECT 
      table_schema as schema_name,
      pg_size_pretty(SUM(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name)))) as total_size,
      SUM(pg_total_relation_size(quote_ident(table_schema) || '.' || quote_ident(table_name))) as total_bytes,
      COUNT(table_name) as table_count
    FROM information_schema.tables
    WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    GROUP BY table_schema
    ORDER BY total_bytes DESC
  `);

  const memUsage = process.memoryUsage();
  const memoryStats = {
    rss: (memUsage.rss / 1024 / 1024).toFixed(1) + ' MB',
    heapTotal: (memUsage.heapTotal / 1024 / 1024).toFixed(1) + ' MB',
    heapUsed: (memUsage.heapUsed / 1024 / 1024).toFixed(1) + ' MB',
    external: (memUsage.external / 1024 / 1024).toFixed(1) + ' MB'
  };

  res.json({
    success: true,
    data: {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      platform: process.platform,
      pool: poolStats,
      memory: memoryStats,
      schemas: storageRes.rows
    }
  });
});

/**
 * Super Admin: Get all platform backup archives
 */
const getBackupArchives = asyncHandler(async (req, res) => {
  const result = await pool.query(`
    SELECT id, tenant_id, tenant_name, filename, file_size_bytes, table_count, record_count, backup_type, created_by, created_at
    FROM shared.tenant_backup_archives
    ORDER BY created_at DESC
    LIMIT 100
  `);
  res.json({ success: true, archives: result.rows });
});

/**
 * Super Admin: Trigger 1-click snapshot across all active tenants
 */
const triggerAllTenantBackups = asyncHandler(async (req, res) => {
  const tenantsRes = await pool.query(`SELECT tenant_id, name FROM shared.tenants WHERE status = 'active'`);
  const createdArchives = [];

  for (const tenant of tenantsRes.rows) {
    const { tenant_id, name } = tenant;
    try {
      const tablesRes = await pool.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = $1 AND table_type = 'BASE TABLE'
      `, [tenant_id]);

      const backupData = {};
      let totalRecords = 0;

      for (const tableRow of tablesRes.rows) {
        const tableName = tableRow.table_name;
        const dataRes = await pool.query(`SELECT * FROM "${tenant_id}"."${tableName}"`);
        backupData[tableName] = dataRes.rows;
        totalRecords += dataRes.rows.length;
      }

      const jsonStr = JSON.stringify(backupData);
      const sizeBytes = Buffer.byteLength(jsonStr, 'utf8');
      const filename = `${tenant_id}_snapshot_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;

      const insRes = await pool.query(`
        INSERT INTO shared.tenant_backup_archives
          (tenant_id, tenant_name, filename, file_size_bytes, table_count, record_count, backup_type, snapshot_data, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, tenant_id, filename, file_size_bytes, table_count, record_count, created_at
      `, [tenant_id, name, filename, sizeBytes, tablesRes.rows.length, totalRecords, 'manual', jsonStr, req.user?.email || 'super_admin']);

      createdArchives.push(insRes.rows[0]);
    } catch (e) {
      console.error(`Backup failed for ${tenant_id}:`, e.message);
    }
  }

  await logPlatformAudit({
    action: 'TRIGGER_BULK_BACKUP',
    category: 'backup_restore',
    actor_email: req.user?.email || 'super_admin',
    actor_role: req.user?.role || 'super_admin',
    details: { total_tenants: tenantsRes.rows.length, successful_backups: createdArchives.length },
    ip_address: req.ip,
    user_agent: req.headers['user-agent']
  });

  res.json({
    success: true,
    message: `Generated snapshots for ${createdArchives.length} active tenants`,
    archives: createdArchives
  });
});

/**
 * Super Admin: Download a backup archive by ID
 */
const downloadBackupArchive = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(`SELECT filename, snapshot_data FROM shared.tenant_backup_archives WHERE id = $1`, [id]);
  if (result.rows.length === 0) {
    throw new NotFoundError('Backup archive not found');
  }

  const archive = result.rows[0];
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${archive.filename}"`);
  res.send(typeof archive.snapshot_data === 'string' ? archive.snapshot_data : JSON.stringify(archive.snapshot_data, null, 2));
});

/**
 * Super Admin Tenant Approval Actions & Platform Settings
 */
const approveTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  await query('UPDATE shared.tenants SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = $2', ['active', tenantId]);

  try {
    const { sendEmail } = require('../services/emailService');
    if (tenant.contact_email) {
      await sendEmail({
        to: tenant.contact_email,
        subject: '🎉 Your HRMS Pro Company Workspace Has Been Approved!',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; color: #1e293b; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; rounded: 16px;">
            <h2 style="color: #16a34a; margin-top: 0;">Welcome to HRMS Pro!</h2>
            <p>Dear <b>${tenant.contact_person || 'Company Administrator'}</b>,</p>
            <p>Great news! Your company workspace for <strong>${tenant.name}</strong> (Tenant ID: <code>${tenant.tenant_id}</code>) has been approved by the platform administrator.</p>
            <p>Your 14-day free trial is now active. You can log in and start onboarding your team immediately.</p>
            <div style="margin: 28px 0; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://app.hrmspro.online'}/login" style="background-color: #16a34a; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; display: inline-block;">
                Log In to Your Workspace
              </a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If you have questions or need assistance during setup, reply directly to this email or access our 24/7 in-app support chat.</p>
          </div>
        `
      });
    }
  } catch (emailErr) {
    console.warn('Tenant approval email warning:', emailErr.message);
  }

  if (req.io) {
    req.io.emit('tenant_status_updated', { tenantId, status: 'active' });
    req.io.emit('dashboard_update');
  }

  res.json({ success: true, message: `Tenant "${tenant.name}" has been approved and activated!`, tenantId });
});

const rejectTenant = asyncHandler(async (req, res) => {
  const { tenantId } = req.params;
  const { reason } = req.body;
  const tenant = await Tenant.findById(tenantId);
  if (!tenant) {
    throw new NotFoundError('Tenant not found');
  }

  await query('UPDATE shared.tenants SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = $2', ['rejected', tenantId]);

  if (req.io) {
    req.io.emit('tenant_status_updated', { tenantId, status: 'rejected' });
    req.io.emit('dashboard_update');
  }

  res.json({ success: true, message: `Tenant "${tenant.name}" registration has been declined.`, tenantId });
});

const getPlatformSettings = asyncHandler(async (req, res) => {
  await query(`
    CREATE TABLE IF NOT EXISTS shared.platform_settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT,
      description VARCHAR(255),
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    INSERT INTO shared.platform_settings (key, value, description)
    VALUES ('require_signup_approval', 'true', 'Require Super Admin approval before newly registered company tenants can log in')
    ON CONFLICT (key) DO NOTHING;
  `);

  const result = await query('SELECT * FROM shared.platform_settings');
  const settings = {};
  result.rows.forEach(r => {
    settings[r.key] = r.value === 'true' ? true : r.value === 'false' ? false : r.value;
  });

  res.json({ success: true, settings });
});

const updatePlatformSettings = asyncHandler(async (req, res) => {
  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    throw new ValidationError('Settings object is required');
  }

  for (const [key, val] of Object.entries(settings)) {
    await query(
      `INSERT INTO shared.platform_settings (key, value, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
      [key, String(val)]
    );
  }

  res.json({ success: true, message: 'Platform settings updated successfully', settings });
});

module.exports = {
  createTenant, getAllTenants, updateTenant, resetTenantAdminPassword, deleteTenant,
  getBiometricDevices, registerBiometricDevice, deleteBiometricDevice, impersonateTenantAdmin,
  backupTenant, restoreTenant,
  getPlanConfigs, updatePlanConfig, getTenantModules, updateTenantModules,
  getBillingOverview, getTenantBillingProfile, updateTenantBillingProfile, recordManualPayment,
  getMyTenantBilling, updateMyTenantBilling, getInvoiceDetails,
  getGrowthAnalytics,
  getActiveBroadcasts, getAllBroadcasts, createBroadcast, updateBroadcast, deleteBroadcast,
  getPlatformAuditLogs,
  getSystemHealthDiagnostics,
  getBackupArchives, triggerAllTenantBackups, downloadBackupArchive,
  approveTenant, rejectTenant, getPlatformSettings, updatePlatformSettings,
  SYSTEM_MODULES
};



