const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { query } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { validatePassword } = require('../utils/passwordValidator');
const { sendEmailSync } = require('../services/emailService');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const asyncHandler = require('../utils/asyncHandler');
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

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await query(
    'SELECT u.*, e.employee_id, e.first_name, e.last_name FROM users u LEFT JOIN employees e ON u.user_id = e.user_id WHERE u.email = $1 AND u.is_active = true',
    [email]
  );

  if (result.rows.length === 0) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const user = result.rows[0];

  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (user.is_two_factor_enabled) {
    const tempToken = generateToken({ ...user, is2FAPending: true }, '5m');

    return res.json({
      success: true,
      message: '2FA required',
      requires2FA: true,
      tempToken: tempToken,
      userId: user.user_id
    });
  }

  await query(
    'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
    [user.user_id]
  );

  const token = generateToken(user);

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
      },
      token,
    },
  });
});

const verify2FALogin = asyncHandler(async (req, res) => {
  const { userId, token } = req.body;

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
      },
      token: authToken,
    },
  });
});

const setup2FA = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const secret = speakeasy.generateSecret({ name: `HRMS Pro (${req.user.email})` });

  await query(
    'UPDATE users SET two_factor_secret = $1 WHERE user_id = $2',
    [secret.base32, userId]
  );

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

  const result = await query('SELECT two_factor_secret FROM users WHERE user_id = $1', [userId]);
  const user = result.rows[0];

  const verified = speakeasy.totp.verify({
    secret: user.two_factor_secret,
    encoding: 'base32',
    token: token
  });

  if (!verified) {
    throw new ValidationError('Invalid code');
  }

  await query('UPDATE users SET is_two_factor_enabled = true WHERE user_id = $1', [userId]);
  res.json({ success: true, message: '2FA enabled successfully' });
});

const disable2FA = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  await query(
    'UPDATE users SET is_two_factor_enabled = false, two_factor_secret = NULL WHERE user_id = $1',
    [userId]
  );

  res.json({ success: true, message: '2FA disabled successfully' });
});

const getProfile = asyncHandler(async (req, res) => {
  const result = await query(
    'SELECT u.user_id, u.email, u.role, u.permissions, u.created_at, u.is_two_factor_enabled, e.* FROM users u LEFT JOIN employees e ON u.user_id = e.user_id WHERE u.user_id = $1',
    [req.user.userId]
  );

  if (result.rows.length === 0) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: result.rows[0],
  });
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const passwordValidation = await validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    throw new ValidationError(passwordValidation.errors.join(' '));
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
  login,
  getProfile,
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
