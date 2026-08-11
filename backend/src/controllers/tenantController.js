const { pool, query, transaction } = require('../config/database');
const Tenant = require('../models/tenantModel');
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

module.exports = {
  createTenant, getAllTenants, updateTenant, resetTenantAdminPassword, deleteTenant,
  getBiometricDevices, registerBiometricDevice, deleteBiometricDevice
};
