const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { generateToken } = require('../middleware/auth');
const { validatePassword } = require('../utils/passwordValidator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

// Register new user
const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate password
    const passwordValidation = await validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.errors.join(' '),
      });
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert new user
    const result = await query(
      'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id, email, role, created_at',
      [email, passwordHash, role || 'employee']
    );

    const user = result.rows[0];

    // Generate token
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          userId: user.user_id,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message,
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const user = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check 2FA
    if (user.is_two_factor_enabled) {
      // Return a temporary token or flag indicating 2FA is required
      // For simplicity, we'll return a specific response code and a temporary token valid for 2FA verification only
      // Ideally, use a short-lived JWT with a specific scope '2fa_pending'
      const tempToken = generateToken({ ...user, is2FAPending: true }, '5m'); // 5 min expiry

      return res.json({
        success: true,
        message: '2FA required',
        requires2FA: true,
        tempToken: tempToken,
        userId: user.user_id
      });
    }

    // Update last login
    await query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE user_id = $1',
      [user.user_id]
    );

    // Generate token
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          userId: user.user_id,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message,
    });
  }
};

// Verify 2FA Login
const verify2FALogin = async (req, res) => {
  try {
    const { userId, token } = req.body; // token is the OTP code

    const result = await query('SELECT * FROM users WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = result.rows[0];

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      // Update last login
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
          },
          token: authToken,
        },
      });
    } else {
      res.status(400).json({ success: false, message: 'Invalid 2FA code' });
    }
  } catch (error) {
    console.error('2FA Verify Login Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Setup 2FA
const setup2FA = async (req, res) => {
  try {
    const userId = req.user.userId;
    const secret = speakeasy.generateSecret({ name: `HRMS Pro (${req.user.email})` });

    // Save secret temporarily or permanently? 
    // Better to save temporarily until verified, but for simplicity we'll save it now but keep is_two_factor_enabled false
    await query(
      'UPDATE users SET two_factor_secret = $1 WHERE user_id = $2',
      [secret.base32, userId]
    );

    QRCode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) {
        return res.status(500).json({ success: false, message: 'Error generating QR code' });
      }
      res.json({
        success: true,
        secret: secret.base32,
        qrCode: data_url
      });
    });
  } catch (error) {
    console.error('Setup 2FA Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Verify 2FA Setup
const verify2FASetup = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.user.userId;

    const result = await query('SELECT two_factor_secret FROM users WHERE user_id = $1', [userId]);
    const user = result.rows[0];

    const verified = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: token
    });

    if (verified) {
      await query('UPDATE users SET is_two_factor_enabled = true WHERE user_id = $1', [userId]);
      res.json({ success: true, message: '2FA enabled successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid code' });
    }
  } catch (error) {
    console.error('Verify 2FA Setup Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Disable 2FA
const disable2FA = async (req, res) => {
  try {
    const userId = req.user.userId;
    // Ideally require password or OTP again for security
    await query(
      'UPDATE users SET is_two_factor_enabled = false, two_factor_secret = NULL WHERE user_id = $1',
      [userId]
    );
    res.json({ success: true, message: '2FA disabled successfully' });
  } catch (error) {
    console.error('Disable 2FA Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const result = await query(
      'SELECT u.user_id, u.email, u.role, u.created_at, u.is_two_factor_enabled, e.* FROM users u LEFT JOIN employees e ON u.user_id = e.user_id WHERE u.user_id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate new password
    const passwordValidation = await validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.errors.join(' '),
      });
    }

    // Get current user
    const result = await query(
      'SELECT * FROM users WHERE user_id = $1',
      [req.user.userId]
    );

    const user = result.rows[0];

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2',
      [passwordHash, req.user.userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

// Admin change user password
const adminChangeUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;
    const userRole = req.user.role;

    // Only admins can change other users' passwords
    if (userRole !== 'admin') {
      return res.status(403).json({
        success: false,
        message: "Only administrators can change other users' passwords",
      });
    }

    // Validate new password
    const passwordValidation = await validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.errors.join(' '),
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password
    const result = await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_id',
      [passwordHash, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      message: 'User password changed successfully',
    });
  } catch (error) {
    console.error('Admin change user password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change user password',
      error: error.message,
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const crypto = require('crypto');
    const { sendEmail } = require('../services/emailService');

    // 1. Find user
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      // Security: Don't reveal if user exists
      return res.json({ success: true, message: 'If your email is registered, you will receive a reset link.' });
    }
    const user = result.rows[0];

    // 2. Generate Token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresIn = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // 3. Save to DB
    await query(
      'UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE user_id = $3',
      [resetTokenHash, expiresIn, user.user_id]
    );

    // 4. Send Email
    // Note: In a real app, use the frontend URL from env
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>This link will expire in 30 minutes.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: message,
      });

      res.json({ success: true, message: 'If your email is registered, you will receive a reset link.' });
    } catch (emailError) {
      // Rollback token if email fails
      await query(
        'UPDATE users SET reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $1',
        [user.user_id]
      );
      throw new Error('Email sending failed');
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    const crypto = require('crypto');

    // Validate new password
    const passwordValidation = await validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.errors.join(' '),
      });
    }

    // 1. Hash token to compare with DB
    const resetTokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Find user with valid token
    const result = await query(
      'SELECT * FROM users WHERE reset_token = $1 AND reset_token_expiry > CURRENT_TIMESTAMP',
      [resetTokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = result.rows[0];

    // 3. Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 4. Update password and clear token
    await query(
      'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = $2',
      [passwordHash, user.user_id]
    );

    res.json({ success: true, message: 'Password reset successful' });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  changePassword,
  adminChangeUserPassword,
  forgotPassword,
  resetPassword,
  verify2FALogin,
  setup2FA,
  verify2FASetup,
  disable2FA
};
