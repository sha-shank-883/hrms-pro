const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool, query, transaction } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { validatePassword } = require('../utils/passwordValidator');
const { sendEmailSync } = require('../services/emailService');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const asyncHandler = require('../utils/asyncHandler');
const { getTenantActiveModules } = require('../utils/moduleEntitlements');
const { NotFoundError, UnauthorizedError, ForbiddenError, ValidationError, ConflictError } = require('../utils/errors');

const register = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;

  const passwordValidation = await validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.errors.join(' '));
  }

  const existingUser = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new ConflictError('User already exists with this email');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id, email, role, created_at',
    [email, passwordHash, 'employee']
  );

  const user = result.rows[0];
  const token = generateToken(user);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
      },
      token,
    },
  });
});

const signupCompany = asyncHandler(async (req, res) => {
  const { companyName, fullName, email, password, phone } = req.body;

  if (!companyName || !fullName || !email || !password) {
    throw new ValidationError('Company name, full name, work email, and password are required');
  }

  const emailClean = email.trim().toLowerCase();
  const passwordValidation = await validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.errors.join(' '));
  }

  // 1. Check if email belongs to Super Admin
  try {
    const saCheck = await pool.query('SELECT id FROM shared.super_admins WHERE email = $1', [emailClean]);
    if (saCheck.rows.length > 0) {
      throw new ConflictError('An account with this email address already exists. Please log in.');
    }
  } catch (err) {
    if (err instanceof ConflictError) throw err;
  }

  // 2. Check if email already registered across active tenant schemas
  try {
    const tenantsList = await pool.query('SELECT tenant_id FROM shared.tenants WHERE status = $1', ['active']);
    for (const t of tenantsList.rows) {
      try {
        const uCheck = await pool.query(`SELECT user_id FROM "${t.tenant_id}".users WHERE email = $1`, [emailClean]);
        if (uCheck.rows.length > 0) {
          throw new ConflictError('An account with this email already exists. Please log in.');
        }
      } catch (_) {}
    }
  } catch (err) {
    if (err instanceof ConflictError) throw err;
  }

  // 3. Generate unique tenant_id
  let baseId = 'tenant_' + companyName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
  if (!baseId || baseId === 'tenant_') baseId = 'tenant_company';
  let tenantId = baseId;
  let suffix = 1;

  while (true) {
    const tExist = await pool.query('SELECT tenant_id FROM shared.tenants WHERE tenant_id = $1', [tenantId]);
    if (tExist.rows.length === 0) break;
    tenantId = `${baseId}${suffix++}`;
  }

  // 4. Calculate 14-day Free Trial expiry
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 14);

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const nameParts = fullName.trim().split(' ');
  const firstName = nameParts[0] || fullName.trim();
  const lastName = nameParts.slice(1).join(' ') || 'Admin';

  let createdUser = null;

  // 5. Transaction to create tenant schema, tables, admin user, employee, and initial settings
  const fs = require('fs');
  const path = require('path');

  await transaction(async (client) => {
    // 1. Create Schema
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}"`);

    // 2. Set search path and execute tenant schema
    await client.query(`SET search_path TO "${tenantId}"`);
    const schemaPath = path.join(__dirname, '../config/tenant_schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');
      await client.query(schemaSql);
    }

    // 3. Insert Admin User into tenant schema (with full user identity)
    const userRes = await client.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active) VALUES ($1, $2, 'admin', $3, $4, $5, true) RETURNING *`,
      [emailClean, hashedPassword, firstName, lastName, phone || null]
    );
    createdUser = userRes.rows[0];

    // 4. Seed default company departments
    try {
      await client.query(`
        INSERT INTO departments (department_name, description) VALUES 
        ('Management', 'Executive and Company Management'),
        ('Human Resources', 'HR, People Ops and Recruitment'),
        ('Engineering', 'Product & Software Engineering'),
        ('Sales & Marketing', 'Go-To-Market and Growth')
      `);
    } catch (deptErr) {
      console.warn('Default departments seed warning:', deptErr.message);
    }

    // 6. Insert into shared.tenants
    await client.query(`
      INSERT INTO shared.tenants 
        (tenant_id, name, status, subscription_plan, subscription_expiry, employee_limit, contact_person, contact_email, contact_phone)
      VALUES ($1, $2, 'active', 'free', $3, 15, $4, $5, $6)
    `, [tenantId, companyName.trim(), expiryDate, fullName.trim(), emailClean, phone || null]);
  });

  // 6. Generate Token
  const token = generateToken({
    user_id: createdUser.user_id,
    userId: createdUser.user_id,
    email: createdUser.email,
    role: 'admin',
    tenant_id: tenantId
  });

  const entitlement = await getTenantActiveModules(tenantId);

  // 7. Real-time notification to Super Admin
  if (req.io) {
    req.io.emit('notification:new', {
      id: `tenant_${tenantId}`,
      module: 'tenants',
      title: `New Company Signed Up: ${companyName}`,
      message: `${fullName} (${emailClean}) started a 14-day free trial.`,
      action_url: '/super-admin',
      created_at: new Date()
    });
    req.io.emit('dashboard_update');
  }

  res.status(201).json({
    success: true,
    message: 'Account created successfully! Starting your 14-day free trial.',
    data: {
      user: {
        userId: createdUser.user_id,
        email: createdUser.email,
        role: 'admin',
        first_name: firstName,
        last_name: lastName,
        tenant_id: tenantId,
        subscription_plan: entitlement.plan,
        subscription_expired: entitlement.isExpired,
        tenant_modules: entitlement.modules,
      },
      tenant: {
        tenantId,
        name: companyName,
        plan: 'free',
        trialExpires: expiryDate
      },
      token
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const emailClean = email.trim().toLowerCase();

  // 1. Check Global Super Admin Table First
  try {
    const superAdminRes = await pool.query(
      'SELECT * FROM shared.super_admins WHERE email = $1 AND is_active = true',
      [emailClean]
    );

    if (superAdminRes.rows.length > 0) {
      const superAdmin = superAdminRes.rows[0];
      const isPasswordValid = await bcrypt.compare(password, superAdmin.password_hash);

      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid credentials');
      }

      if (superAdmin.is_2fa_enabled) {
        const tempToken = generateToken({ ...superAdmin, role: 'super_admin', isSuperAdmin: true, is2FAPending: true }, '5m');

        return res.json({
          success: true,
          message: '2FA required',
          requires2FA: true,
          isSuperAdmin: true,
          tempToken: tempToken,
          userId: superAdmin.id
        });
      }

      await pool.query(
        'UPDATE shared.super_admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [superAdmin.id]
      );

      const token = generateToken({ ...superAdmin, role: 'super_admin', isSuperAdmin: true });

      return res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            userId: superAdmin.id,
            email: superAdmin.email,
            role: 'super_admin',
            isSuperAdmin: true,
            permissions: ['all'],
            tenant_modules: ['all'],
            first_name: superAdmin.full_name || 'Super',
            last_name: 'Admin',
          },
          token,
        },
      });
    }
  } catch (err) {
    if (err instanceof UnauthorizedError) throw err;
    console.error('Super Admin lookup check error:', err.message);
  }

  // 2. Smart Tenant User Lookup across Active Tenant Schemas
  let user = null;
  let resolvedTenantId = req.headers['x-tenant-id'] || null;

  if (resolvedTenantId) {
    try {
      const result = await pool.query(
        `SELECT u.*, e.employee_id, e.first_name, e.last_name 
         FROM "${resolvedTenantId}".users u 
         LEFT JOIN "${resolvedTenantId}".employees e ON u.user_id = e.user_id 
         WHERE LOWER(u.email) = LOWER($1) AND (u.is_active IS TRUE OR u.is_active IS NULL)`,
        [emailClean]
      );
      if (result.rows.length > 0) {
        user = result.rows[0];
      }
    } catch (_) {}
  }

  // Fallback: If not found or no tenant header, search all active tenants
  if (!user) {
    const tenantsList = await pool.query(
      'SELECT tenant_id FROM shared.tenants WHERE status = $1 ORDER BY created_at DESC',
      ['active']
    );
    for (const t of tenantsList.rows) {
      try {
        const result = await pool.query(
          `SELECT u.*, e.employee_id, e.first_name, e.last_name 
           FROM "${t.tenant_id}".users u 
           LEFT JOIN "${t.tenant_id}".employees e ON u.user_id = e.user_id 
           WHERE LOWER(u.email) = LOWER($1) AND (u.is_active IS TRUE OR u.is_active IS NULL)`,
          [emailClean]
        );
        if (result.rows.length > 0) {
          user = result.rows[0];
          resolvedTenantId = t.tenant_id;
          break;
        }
      } catch (_) {}
    }
  }

  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.is_two_factor_enabled) {
    const tempToken = generateToken({ ...user, tenant_id: resolvedTenantId, is2FAPending: true }, '5m');

    return res.json({
      success: true,
      message: '2FA required',
      requires2FA: true,
      tempToken: tempToken,
      userId: user.user_id,
      tenantId: resolvedTenantId
    });
  }

  try {
    await pool.query(
      `UPDATE "${resolvedTenantId}".users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1`,
      [user.user_id]
    );
  } catch (_) {}

  const token = generateToken({
    ...user,
    userId: user.user_id,
    tenant_id: resolvedTenantId
  });

  const entitlement = await getTenantActiveModules(resolvedTenantId);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        employee_id: user.employee_id,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: resolvedTenantId,
        subscription_plan: entitlement.plan,
        subscription_expired: entitlement.isExpired,
        tenant_modules: entitlement.modules,
        is_custom_modules: entitlement.isCustom,
      },
      token,
    },
  });
});

const verify2FALogin = asyncHandler(async (req, res) => {
  const { userId, token } = req.body;

  // Check if this is a global Super Admin
  const superAdminRes = await pool.query(
    'SELECT * FROM shared.super_admins WHERE id = $1',
    [userId]
  );

  if (superAdminRes.rows.length > 0) {
    const superAdmin = superAdminRes.rows[0];

    const verified = speakeasy.totp.verify({
      secret: superAdmin.two_factor_secret,
      encoding: 'base32',
      token: token
    });

    if (!verified) {
      throw new ValidationError('Invalid 2FA code');
    }

    await pool.query(
      'UPDATE shared.super_admins SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [superAdmin.id]
    );

    const authToken = generateToken({ ...superAdmin, role: 'super_admin', isSuperAdmin: true });

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: superAdmin.id,
          email: superAdmin.email,
          role: 'super_admin',
          isSuperAdmin: true,
          permissions: ['all'],
          tenant_modules: ['all'],
          first_name: superAdmin.full_name || 'Super',
          last_name: 'Admin',
        },
        token: authToken,
      },
    });
  }

  const result = await query(
    'SELECT u.*, e.employee_id, e.first_name, e.last_name FROM users u LEFT JOIN employees e ON u.user_id = e.user_id WHERE u.user_id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const user = result.rows[0];

  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: token
  });

  if (!verified) {
    throw new ValidationError('Invalid 2FA code');
  }

  await query(
    'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
    [user.user_id]
  );

  const authToken = generateToken(user);
  const tenantId = req.headers['x-tenant-id'] || 'tenant_default';
  const entitlement = await getTenantActiveModules(tenantId);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        userId: user.user_id,
        email: user.email,
        role: user.role,
        permissions: user.permissions || [],
        employee_id: user.employee_id,
        first_name: user.first_name,
        last_name: user.last_name,
        tenant_id: tenantId,
        subscription_plan: entitlement.plan,
        subscription_expired: entitlement.isExpired,
        tenant_modules: entitlement.modules,
        is_custom_modules: entitlement.isCustom,
      },
      token: authToken,
    },
  });
});

const setup2FA = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const secret = speakeasy.generateSecret({ name: `HRMS Pro (${req.user.email})` });

  if (req.user.isSuperAdmin || req.user.role === 'super_admin') {
    await pool.query(
      'UPDATE shared.super_admins SET two_factor_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );
  } else {
    await query(
      'UPDATE users SET two_factor_secret = $1 WHERE user_id = $2',
      [secret.base32, userId]
    );
  }

  const data_url = await QRCode.toDataURL(secret.otpauth_url);

  res.json({
    success: true,
    secret: secret.base32,
    qrCode: data_url
  });
});

const verify2FASetup = asyncHandler(async (req, res) => {
  const { token } = req.body;
  const userId = req.user.userId;

  let userSecret = null;
  if (req.user.isSuperAdmin || req.user.role === 'super_admin') {
    const superRes = await pool.query('SELECT two_factor_secret FROM shared.super_admins WHERE id = $1', [userId]);
    if (superRes.rows.length > 0) userSecret = superRes.rows[0].two_factor_secret;
  } else {
    const result = await query('SELECT two_factor_secret FROM users WHERE user_id = $1', [userId]);
    if (result.rows.length > 0) userSecret = result.rows[0].two_factor_secret;
  }

  if (!userSecret) {
    throw new ValidationError('2FA secret not found. Please initiate setup again.');
  }

  const verified = speakeasy.totp.verify({
    secret: userSecret,
    encoding: 'base32',
    token: token
  });

  if (!verified) {
    throw new ValidationError('Invalid code');
  }

  if (req.user.isSuperAdmin || req.user.role === 'super_admin') {
    await pool.query('UPDATE shared.super_admins SET is_2fa_enabled = true WHERE id = $1', [userId]);
  } else {
    await query('UPDATE users SET is_two_factor_enabled = true WHERE user_id = $1', [userId]);
  }

  res.json({ success: true, message: '2FA enabled successfully' });
});

const disable2FA = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  if (req.user.isSuperAdmin || req.user.role === 'super_admin') {
    await pool.query(
      'UPDATE shared.super_admins SET is_2fa_enabled = false, two_factor_secret = NULL WHERE id = $1',
      [userId]
    );
  } else {
    await query(
      'UPDATE users SET is_two_factor_enabled = false, two_factor_secret = NULL WHERE user_id = $1',
      [userId]
    );
  }

  res.json({ success: true, message: '2FA disabled successfully' });
});

const getProfile = asyncHandler(async (req, res) => {
  // Check if Super Admin
  if (req.user.isSuperAdmin || req.user.role === 'super_admin') {
    const superRes = await pool.query(
      'SELECT id as user_id, email, full_name, is_2fa_enabled, created_at FROM shared.super_admins WHERE id = $1 OR email = $2',
      [req.user.userId, req.user.email]
    );

    if (superRes.rows.length > 0) {
      const admin = superRes.rows[0];
      return res.json({
        success: true,
        data: {
          user_id: admin.user_id,
          userId: admin.user_id,
          email: admin.email,
          role: 'super_admin',
          isSuperAdmin: true,
          first_name: admin.full_name || 'Super',
          last_name: 'Admin',
          permissions: ['all'],
          tenant_modules: ['all'],
          is_two_factor_enabled: admin.is_2fa_enabled,
          created_at: admin.created_at
        }
      });
    }
  }

  const result = await query(
    `SELECT 
       u.user_id, 
       u.email, 
       u.role, 
       u.permissions, 
       u.created_at, 
       u.is_two_factor_enabled,
       COALESCE(e.first_name, u.first_name, '') as first_name,
       COALESCE(e.last_name, u.last_name, '') as last_name,
       COALESCE(e.phone, u.phone, '') as phone,
       COALESCE(e.profile_image, u.avatar, '') as profile_image,
       e.employee_id,
       e.department_id,
       e.position,
       e.hire_date,
       e.salary,
       e.status,
       e.gender,
       e.date_of_birth,
       e.address,
       e.about_me,
       e.social_links
     FROM users u 
     LEFT JOIN employees e ON u.user_id = e.user_id 
     WHERE u.user_id = $1`,
    [req.user.userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  const profileData = result.rows[0];

  // Attach subscription info and active modules from shared.tenants if tenant header present
  try {
    const tenantId = req.headers['x-tenant-id'] || req.user.tenant_id;
    if (tenantId) {
      const entitlement = await getTenantActiveModules(tenantId);
      profileData.subscription_plan = entitlement.plan;
      profileData.subscription_expired = entitlement.isExpired;
      profileData.tenant_modules = entitlement.modules;
      profileData.is_custom_modules = entitlement.isCustom;

      const tenantResult = await query(
        'SELECT subscription_expiry, contact_person, contact_phone FROM shared.tenants WHERE tenant_id = $1',
        [tenantId]
      );
      if (tenantResult.rows.length > 0) {
        profileData.subscription_expiry = tenantResult.rows[0].subscription_expiry;
        if (!profileData.first_name && tenantResult.rows[0].contact_person) {
          const names = tenantResult.rows[0].contact_person.split(' ');
          profileData.first_name = names[0];
          profileData.last_name = names.slice(1).join(' ');
        }
        if (!profileData.phone && tenantResult.rows[0].contact_phone) {
          profileData.phone = tenantResult.rows[0].contact_phone;
        }
      }
    } else {
      profileData.tenant_modules = ['core_hr', 'attendance', 'leaves', 'tasks', 'documents'];
    }
  } catch (subErr) {
    console.error('Failed to fetch subscription info:', subErr.message);
    profileData.tenant_modules = ['core_hr', 'attendance', 'leaves', 'tasks', 'documents'];
  }

  res.json({
    success: true,
    data: profileData,
  });
});

const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const {
    first_name,
    last_name,
    phone,
    date_of_birth,
    gender,
    address,
    about_me,
    profile_image,
    social_links
  } = req.body;

  // 1. Super Admin profile update
  if (req.user.isSuperAdmin || req.user.role === 'super_admin') {
    const fullName = `${first_name || ''} ${last_name || ''}`.trim() || req.body.full_name || 'Super Admin';
    await pool.query(
      'UPDATE shared.super_admins SET full_name = $1 WHERE id = $2 OR email = $3',
      [fullName, userId, req.user.email]
    );

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        userId,
        first_name: first_name || fullName.split(' ')[0],
        last_name: last_name || fullName.split(' ').slice(1).join(' '),
        email: req.user.email,
        role: 'super_admin'
      }
    });
  }

  // 2. Tenant User / Admin profile update - Save to users table
  const tenantId = req.headers['x-tenant-id'] || req.user.tenant_id;
  
  await query(
    `UPDATE users SET
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      phone = COALESCE($3, phone),
      avatar = COALESCE($4, avatar),
      updated_at = CURRENT_TIMESTAMP
    WHERE user_id = $5`,
    [first_name || null, last_name || null, phone || null, profile_image || null, userId]
  );

  // If this user is an admin, also sync shared.tenants contact person
  if (tenantId && (req.user.role === 'admin' || req.user.role === 'super_admin')) {
    const contactName = `${first_name || ''} ${last_name || ''}`.trim();
    if (contactName) {
      try {
        await pool.query(
          `UPDATE shared.tenants SET contact_person = $1, contact_phone = COALESCE($2, contact_phone) WHERE tenant_id = $3`,
          [contactName, phone || null, tenantId]
        );
      } catch (_) {}
    }
  }

  // Check if an employee record exists for this user, and sync if present
  const empCheck = await query(
    'SELECT employee_id FROM employees WHERE user_id = $1',
    [userId]
  );

  let updatedEmployee = null;

  if (empCheck.rows.length > 0) {
    const empId = empCheck.rows[0].employee_id;
    const updateRes = await query(
      `UPDATE employees SET
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name),
        phone = COALESCE($3, phone),
        date_of_birth = COALESCE($4, date_of_birth),
        gender = COALESCE($5, gender),
        address = COALESCE($6, address),
        about_me = COALESCE($7, about_me),
        profile_image = COALESCE($8, profile_image),
        social_links = COALESCE($9, social_links),
        updated_at = CURRENT_TIMESTAMP
      WHERE employee_id = $10
      RETURNING *`,
      [
        first_name || null,
        last_name || null,
        phone || null,
        date_of_birth || null,
        gender || null,
        address || null,
        about_me || null,
        profile_image || null,
        social_links ? JSON.stringify(social_links) : null,
        empId
      ]
    );
    updatedEmployee = updateRes.rows[0];
  }

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      userId,
      employee_id: updatedEmployee?.employee_id || null,
      first_name: first_name || updatedEmployee?.first_name || 'Admin',
      last_name: last_name || updatedEmployee?.last_name || 'User',
      phone: phone || updatedEmployee?.phone || null,
      email: req.user.email,
      role: req.user.role,
      position: updatedEmployee?.position || 'Workspace Administrator',
      profile_image: profile_image || updatedEmployee?.profile_image || null
    }
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const passwordValidation = await validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.errors.join(' '));
  }

  if (req.user.isSuperAdmin || req.user.role === 'super_admin') {
    const superRes = await pool.query(
      'SELECT * FROM shared.super_admins WHERE id = $1 OR email = $2',
      [req.user.userId, req.user.email]
    );
    if (superRes.rows.length === 0) {
      throw new NotFoundError('Super Admin not found');
    }
    const admin = superRes.rows[0];
    const isPasswordValid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await pool.query(
      'UPDATE shared.super_admins SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, admin.id]
    );
    return res.json({
      success: true,
      message: 'Password changed successfully',
    });
  }

  const result = await query(
    'SELECT * FROM users WHERE user_id = $1',
    [req.user.userId]
  );

  const user = result.rows[0];

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Current password is incorrect');
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
    [passwordHash, req.user.userId]
  );

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

const adminChangeUserPassword = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { newPassword } = req.body;
  const userRole = req.user.role;

  if (userRole !== 'admin') {
    throw new ForbiddenError("Only administrators can change other users' passwords");
  }

  const passwordValidation = await validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.errors.join(' '));
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  const result = await query(
    'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id',
    [passwordHash, userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    message: 'User password changed successfully',
  });
});

const adminUpdatePermissions = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { permissions } = req.body;
  const userRole = req.user.role;

  if (userRole !== 'admin') {
    throw new ForbiddenError('Only administrators can update user permissions');
  }

  if (!Array.isArray(permissions)) {
    throw new ValidationError('Permissions must be an array');
  }

  const result = await query(
    'UPDATE users SET permissions = $1::jsonb, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id, permissions',
    [JSON.stringify(permissions), userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    message: 'User permissions updated successfully',
    data: result.rows[0],
  });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    return res.json({ success: true, message: 'If your email is registered, you will receive a reset link.' });
  }

  const user = result.rows[0];

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresIn = new Date(Date.now() + 30 * 60 * 1000);

  await query(
    'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE user_id = $3',
    [resetTokenHash, expiresIn, user.user_id]
  );

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

  const message = `
    <h1>Password Reset Request</h1>
    <p>You requested a password reset. Please click the link below to reset your password:</p>
    <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
    <p>This link will expire in 30 minutes.</p>
  `;

  try {
    await sendEmailSync({
      to: user.email,
      subject: 'Password Reset Request',
      html: message,
    });
  } catch (emailError) {
    await query(
      'UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $1',
      [user.user_id]
    );
    throw new Error('Email sending failed');
  }

  res.json({ success: true, message: 'If your email is registered, you will receive a reset link.' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const passwordValidation = await validatePassword(password);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.errors.join(' '));
  }

  const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

  const result = await query(
    'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > CURRENT_TIMESTAMP',
    [resetTokenHash]
  );

  if (result.rows.length === 0) {
    throw new ValidationError('Invalid or expired token');
  }

  const user = result.rows[0];

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  await query(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2',
    [passwordHash, user.user_id]
  );

  res.json({ success: true, message: 'Password reset successful' });
});

module.exports = {
  register,
  signupCompany,
  login,
  getProfile,
  updateProfile,
  changePassword,
  adminChangeUserPassword,
  adminUpdatePermissions,
  forgotPassword,
  resetPassword,
  verify2FALogin,
  setup2FA,
  verify2FASetup,
  disable2FA
};
