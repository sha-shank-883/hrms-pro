const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

/**
 * Get dynamic badge counts per module for the active user & role (Super Admin vs Tenant User)
 */
const getModuleBadgeCounts = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const role = req.user?.role || 'employee';
  const hasTenantHeader = Boolean(req.headers['x-tenant-id']);
  const isSuperAdmin = (req.user?.isSuperAdmin || role === 'super_admin') && !hasTenantHeader;

  // 1. Super Admin Platform-Level Notifications
  if (isSuperAdmin) {
    let leadsCount = 0;
    let billingCount = 0;
    let newTenantsCount = 0;

    try {
      // Pending Demo Leads
      const leadsRes = await query(`
        SELECT COUNT(*) as count 
        FROM shared.demo_requests 
        WHERE status = 'pending' OR status = 'new'
      `);
      leadsCount = parseInt(leadsRes.rows[0]?.count || 0, 10);
    } catch (err) {}

    try {
      // Pending / Recent Payments (last 24 hours)
      const payRes = await query(`
        SELECT COUNT(*) as count 
        FROM shared.payment_logs 
        WHERE status = 'pending' OR created_at >= NOW() - INTERVAL '24 hours'
      `);
      billingCount = parseInt(payRes.rows[0]?.count || 0, 10);
    } catch (err) {}

    try {
      // New Tenant Registrations (last 7 days)
      const tenantRes = await query(`
        SELECT COUNT(*) as count 
        FROM shared.tenants 
        WHERE created_at >= NOW() - INTERVAL '7 days'
      `);
      newTenantsCount = parseInt(tenantRes.rows[0]?.count || 0, 10);
    } catch (err) {}

    const total = leadsCount + billingCount;

    return res.json({
      success: true,
      isSuperAdmin: true,
      counts: {
        leads: leadsCount,
        billing: billingCount,
        tenants: newTenantsCount,
        notifications: total,
        total
      }
    });
  }

  // 2. Tenant Organization-Level Notifications (Admin, Manager, Employee)
  let leaveCount = 0;
  let attendanceCount = 0;
  let taskCount = 0;
  let unreadNotifCount = 0;
  let chatCount = 0;

  try {
    // Pending Leaves Count
    if (['admin', 'manager'].includes(role)) {
      const leavesRes = await query(`
        SELECT COUNT(*) as count 
        FROM leave_requests 
        WHERE status = 'pending'
      `);
      leaveCount = parseInt(leavesRes.rows[0]?.count || 0, 10);
    } else {
      const leavesRes = await query(`
        SELECT COUNT(*) as count 
        FROM leave_requests lr
        JOIN employees e ON lr.employee_id = e.employee_id
        WHERE e.user_id = $1 AND lr.status = 'pending'
      `, [userId]);
      leaveCount = parseInt(leavesRes.rows[0]?.count || 0, 10);
    }
  } catch (err) {}

  try {
    // Pending Attendance Regularization
    if (['admin', 'manager'].includes(role)) {
      const attRes = await query(`
        SELECT COUNT(*) as count 
        FROM attendance_regularization 
        WHERE status = 'pending'
      `);
      attendanceCount = parseInt(attRes.rows[0]?.count || 0, 10);
    }
  } catch (err) {}

  try {
    // Active Tasks Count
    if (['admin', 'manager'].includes(role)) {
      const taskRes = await query(`
        SELECT COUNT(*) as count 
        FROM tasks 
        WHERE status IN ('todo', 'in_progress')
      `);
      taskCount = parseInt(taskRes.rows[0]?.count || 0, 10);
    } else {
      const taskRes = await query(`
        SELECT COUNT(*) as count 
        FROM tasks 
        WHERE assigned_to = $1 AND status IN ('todo', 'in_progress')
      `, [userId]);
      taskCount = parseInt(taskRes.rows[0]?.count || 0, 10);
    }
  } catch (err) {}

  try {
    // Unread Notifications Count
    const notifRes = await query(`
      SELECT COUNT(*) as count 
      FROM user_notifications 
      WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false
    `, [userId]);
    unreadNotifCount = parseInt(notifRes.rows[0]?.count || 0, 10);
  } catch (err) {}

  const total = leaveCount + attendanceCount + taskCount + unreadNotifCount + chatCount;

  res.json({
    success: true,
    isSuperAdmin: false,
    counts: {
      leaves: leaveCount,
      attendance: attendanceCount,
      tasks: taskCount,
      chat: chatCount,
      notifications: unreadNotifCount,
      total
    }
  });
});

/**
 * Get user in-app notifications feed (Super Admin vs Tenant User)
 */
const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const hasTenantHeader = Boolean(req.headers['x-tenant-id']);
  const isSuperAdmin = (req.user?.isSuperAdmin || req.user?.role === 'super_admin') && !hasTenantHeader;
  const limit = parseInt(req.query.limit, 10) || 20;
  const offset = parseInt(req.query.offset, 10) || 0;
  const unreadOnly = req.query.unread === 'true';

  if (isSuperAdmin) {
    // Generate platform notifications dynamically from shared logs & leads
    const feed = [];

    try {
      const leadsRes = await query(`
        SELECT id, name, email, company_name, created_at, status
        FROM shared.demo_requests
        ORDER BY created_at DESC LIMIT 5
      `);
      leadsRes.rows.forEach(r => {
        feed.push({
          id: `lead_${r.id}`,
          module: 'leads',
          title: `New Demo Lead: ${r.company_name || r.name}`,
          message: `${r.name} (${r.email}) requested a product demo. Status: ${r.status}`,
          action_url: '/super-admin/demo-requests',
          is_read: r.status !== 'pending',
          created_at: r.created_at
        });
      });
    } catch (e) {}

    try {
      const payRes = await query(`
        SELECT id, tenant_id, amount, currency, status, invoice_number, created_at
        FROM shared.payment_logs
        ORDER BY created_at DESC LIMIT 5
      `);
      payRes.rows.forEach(p => {
        feed.push({
          id: `pay_${p.id}`,
          module: 'billing',
          title: `Payment: ${p.currency} ${p.amount} (${p.tenant_id})`,
          message: `Invoice #${p.invoice_number || p.id} status is ${p.status}.`,
          action_url: '/super-admin/billing',
          is_read: p.status === 'completed',
          created_at: p.created_at
        });
      });
    } catch (e) {}

    // Sort by created_at DESC
    feed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({
      success: true,
      isSuperAdmin: true,
      data: feed.slice(offset, offset + limit),
      unreadCount: feed.filter(f => !f.is_read).length
    });
  }

  // Tenant in-app notifications
  let sql = `
    SELECT * 
    FROM user_notifications 
    WHERE (user_id = $1 OR user_id IS NULL)
  `;
  const params = [userId];

  if (unreadOnly) {
    sql += ` AND is_read = false`;
  }

  sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await query(sql, params);

  const countRes = await query(`
    SELECT COUNT(*) as count 
    FROM user_notifications 
    WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false
  `, [userId]);

  res.json({
    success: true,
    isSuperAdmin: false,
    data: result.rows,
    unreadCount: parseInt(countRes.rows[0]?.count || 0, 10)
  });
});

/**
 * Mark a single notification as read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id;

  const result = await query(`
    UPDATE user_notifications 
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
    RETURNING *
  `, [id, userId]);

  if (result.rows.length === 0) {
    throw new NotFoundError('Notification not found');
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
    data: result.rows[0]
  });
});

/**
 * Mark all notifications for user as read
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.id;

  await query(`
    UPDATE user_notifications 
    SET is_read = true, read_at = CURRENT_TIMESTAMP
    WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false
  `, [userId]);

  res.json({
    success: true,
    message: 'All notifications marked as read'
  });
});

/**
 * Get tenant notification settings
 */
const getNotificationSettings = asyncHandler(async (req, res) => {
  const result = await query(`
    SELECT * 
    FROM tenant_notification_settings 
    WHERE id = 1
    LIMIT 1
  `);

  const settings = result.rows[0] || {
    enable_web_push: true,
    enable_in_app_sound: true,
    enable_email_alerts: true,
    event_rules: {}
  };

  res.json({
    success: true,
    data: settings
  });
});

/**
 * Update tenant notification settings (Admin only)
 */
const updateNotificationSettings = asyncHandler(async (req, res) => {
  const { enable_web_push, enable_in_app_sound, enable_email_alerts, event_rules, vapid_public_key, vapid_private_key } = req.body;

  const result = await query(`
    INSERT INTO tenant_notification_settings (
      id, enable_web_push, enable_in_app_sound, enable_email_alerts, event_rules, vapid_public_key, vapid_private_key, updated_at
    ) VALUES (
      1, $1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP
    )
    ON CONFLICT (id) DO UPDATE SET
      enable_web_push = EXCLUDED.enable_web_push,
      enable_in_app_sound = EXCLUDED.enable_in_app_sound,
      enable_email_alerts = EXCLUDED.enable_email_alerts,
      event_rules = COALESCE(EXCLUDED.event_rules, tenant_notification_settings.event_rules),
      vapid_public_key = COALESCE(EXCLUDED.vapid_public_key, tenant_notification_settings.vapid_public_key),
      vapid_private_key = COALESCE(EXCLUDED.vapid_private_key, tenant_notification_settings.vapid_private_key),
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `, [
    enable_web_push ?? true,
    enable_in_app_sound ?? true,
    enable_email_alerts ?? true,
    JSON.stringify(event_rules || {}),
    vapid_public_key || null,
    vapid_private_key || null
  ]);

  res.json({
    success: true,
    message: 'Notification settings updated successfully',
    data: result.rows[0]
  });
});

/**
 * System helper to insert an in-app notification and emit socket event
 */
const createNotification = async ({ userId = null, module = 'system', title, message, actionUrl = '', req = null }) => {
  try {
    const result = await query(`
      INSERT INTO user_notifications (user_id, module, title, message, action_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [userId, module, title, message, actionUrl]);

    const notif = result.rows[0];

    // Emit real-time socket event if req.io is available
    if (req && req.io) {
      if (userId) {
        req.io.to(`user_${userId}`).emit('notification:new', notif);
      } else {
        req.io.emit('notification:new', notif);
      }
    }
    return notif;
  } catch (err) {
    console.error('Failed to create in-app notification:', err);
  }
};

module.exports = {
  getModuleBadgeCounts,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  getNotificationSettings,
  updateNotificationSettings,
  createNotification
};
