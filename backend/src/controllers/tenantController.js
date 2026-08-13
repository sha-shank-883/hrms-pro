const { pool, query, transaction } = require('../config/database');
const Tenant = require('../models/tenantModel');
const { generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const speakeasy = require('speakeasy');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError, AppError } = require('../utils/errors');

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

  await transaction(async (client) => {
    const allowedFields = ['name', 'status', 'domain', 'db_name', 'subscription_plan', 'subscription_expiry'];
    const filteredUpdates = {};

    Object.keys(tenantUpdates).forEach(key => {
      if (allowedFields.includes(key)) {
        if (key === 'subscription_expiry' && tenantUpdates[key] === '') {
          filteredUpdates[key] = null;
        } else {
          filteredUpdates[key] = tenantUpdates[key];
        }
      }
    });

    if (Object.keys(filteredUpdates).length > 0) {
      const updatedTenant = await Tenant.update(tenantId, filteredUpdates);
      if (!updatedTenant) {
        throw new NotFoundError('Tenant not found');
      }
    }

    if (adminEmail) {
      await client.query(`SET search_path TO "${tenantId}"`);
      await client.query(
        `UPDATE users SET email = $1 WHERE role = 'admin'`,
        [adminEmail]
      );
    }
  });

  res.json({ message: 'Tenant updated successfully' });
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

  let twoFactorToken = req.body.twoFactorToken;
  if (!twoFactorToken && req.headers['x-2fa-token']) {
    twoFactorToken = req.headers['x-2fa-token'];
  }

  if (!twoFactorToken) {
    throw new ValidationError('2FA token is required');
  }

  const userRes = await query(`SELECT two_factor_secret FROM users WHERE user_id = $1`, [userId]);
  if (userRes.rows.length === 0) {
    throw new NotFoundError('Super Admin user not found');
  }

  const { two_factor_secret } = userRes.rows[0];
  if (!two_factor_secret) {
    throw new ValidationError('2FA is not enabled for Super Admin. Please enable it first.');
  }

  const verified = speakeasy.totp.verify({
    secret: two_factor_secret,
    encoding: 'base32',
    token: twoFactorToken
  });

  if (!verified) {
    throw new UnauthorizedError('Invalid 2FA token');
  }

  await transaction(async (client) => {
    await client.query(`DROP SCHEMA IF EXISTS "${tenantId}" CASCADE`);
    await client.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [tenantId]);
  });

  res.json({ message: 'Tenant deleted successfully' });
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

module.exports = {
  createTenant, getAllTenants, updateTenant, resetTenantAdminPassword, deleteTenant,
  getBiometricDevices, registerBiometricDevice, deleteBiometricDevice, impersonateTenantAdmin,
  backupTenant, restoreTenant
};
