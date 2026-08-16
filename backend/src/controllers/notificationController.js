const { query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError, ValidationError } = require('../utils/errors');

/**
 * Get dynamic badge counts per module for the active user & role (Super Admin vs Tenant User)
 */
const getModuleBadgeCounts = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const role = req.user?.role || 'employee';
  const isSuperAdmin = Boolean(req.user?.isSuperAdmin || role === 'super_admin');

  // 1. Super Admin Platform-Level Notifications
  if (isSuperAdmin) {
    let leadsCount = 0;
    let contactCount = 0;
    let billingCount = 0;
    let newTenantsCount = 0;

    let lastReadAt = null;
    try {
      const saRes = await query(`
        SELECT last_notifications_read_at 
        FROM shared.super_admins 
        WHERE id = $1 OR email = $2
      `, [userId, req.user?.email]);
      if (saRes.rows.length > 0 && saRes.rows[0].last_notifications_read_at) {
        lastReadAt = new Date(saRes.rows[0].last_notifications_read_at);
      }
    } catch (_) {}

    try {
      // Pending Demo Leads
      const filterClause = lastReadAt ? 'AND created_at > $1' : '';
      const params = lastReadAt ? [lastReadAt] : [];
      const leadsRes = await query(`
        SELECT COUNT(*) as count 
        FROM shared.demo_requests 
        WHERE (status = 'pending' OR status = 'new') ${filterClause}
      `, params);
      leadsCount = parseInt(leadsRes.rows[0]?.count || 0, 10);
    } catch (err) {}

    try {
      // Inbound Contact Inquiries
      const filterClause = lastReadAt ? 'WHERE submitted_at > $1' : "WHERE submitted_at >= NOW() - INTERVAL '7 days'";
      const params = lastReadAt ? [lastReadAt] : [];
      const contactRes = await query(`
        SELECT COUNT(*) as count 
        FROM shared.contact_inquiries 
        ${filterClause}
      `, params);
      contactCount = parseInt(contactRes.rows[0]?.count || 0, 10);
    } catch (err) {}

    try {
      // Recent Payments
      const filterClause = lastReadAt ? 'WHERE created_at > $1' : "WHERE status = 'pending' OR created_at >= NOW() - INTERVAL '48 hours'";
      const params = lastReadAt ? [lastReadAt] : [];
      const payRes = await query(`
        SELECT COUNT(*) as count 
        FROM shared.payment_logs 
        ${filterClause}
      `, params);
      billingCount = parseInt(payRes.rows[0]?.count || 0, 10);
    } catch (err) {}

    try {
      // New Tenant Registrations
      const filterClause = lastReadAt ? 'WHERE created_at > $1' : "WHERE created_at >= NOW() - INTERVAL '7 days'";
      const params = lastReadAt ? [lastReadAt] : [];
      const tenantRes = await query(`
        SELECT COUNT(*) as count 
        FROM shared.tenants 
        ${filterClause}
      `, params);
      newTenantsCount = parseInt(tenantRes.rows[0]?.count || 0, 10);
    } catch (err) {}

    const totalLeads = leadsCount + contactCount;
    const total = totalLeads + billingCount + newTenantsCount;

    return res.json({
      success: true,
      isSuperAdmin: true,
      counts: {
        leads: totalLeads,
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
  const role = req.user?.role || 'employee';
  const isSuperAdmin = Boolean(req.user?.isSuperAdmin || role === 'super_admin');
  const limit = parseInt(req.query.limit, 10) || 25;
  const offset = parseInt(req.query.offset, 10) || 0;
  const unreadOnly = req.query.unread === 'true';

  if (isSuperAdmin) {
    let lastReadAt = null;
    let readIds = [];

    try {
      const saRes = await query(`
        SELECT last_notifications_read_at, read_notification_ids 
        FROM shared.super_admins 
        WHERE id = $1 OR email = $2
      `, [userId, req.user?.email]);
      if (saRes.rows.length > 0) {
        if (saRes.rows[0].last_notifications_read_at) {
          lastReadAt = new Date(saRes.rows[0].last_notifications_read_at);
        }
        if (Array.isArray(saRes.rows[0].read_notification_ids)) {
          readIds = saRes.rows[0].read_notification_ids;
        }
      }
    } catch (_) {}

    // Generate platform notifications dynamically from shared logs & leads
    let feed = [];

    // 1. Inbound Demo Requests
    try {
      const leadsRes = await query(`
        SELECT id, name, email, company_name, phone, created_at, status
        FROM shared.demo_requests
        ORDER BY created_at DESC LIMIT 20
      `);
      leadsRes.rows.forEach(r => {
        const notifId = `demo_${r.id}`;
        const isRead = r.status === 'provisioned' || readIds.includes(notifId) || (lastReadAt && new Date(r.created_at) <= lastReadAt);
        feed.push({
          id: notifId,
          module: 'leads',
          title: `Demo Request: ${r.company_name || r.name}`,
          message: `${r.name} (${r.email}) requested a live demo. Status: ${r.status}`,
          action_url: '/super-admin/demo-requests',
          is_read: Boolean(isRead),
          created_at: r.created_at
        });
      });
    } catch (e) {}

    // 2. Inbound Contact Form Inquiries
    try {
      const contactRes = await query(`
        SELECT id, name, email, company, subject, submitted_at
        FROM shared.contact_inquiries
        ORDER BY submitted_at DESC LIMIT 15
      `);
      contactRes.rows.forEach(c => {
        const notifId = `contact_${c.id}`;
        const isRead = readIds.includes(notifId) || (lastReadAt && new Date(c.submitted_at) <= lastReadAt);
        feed.push({
          id: notifId,
          module: 'leads',
          title: `Contact Inquiry: ${c.subject}`,
          message: `From ${c.name} (${c.email})${c.company ? ` • ${c.company}` : ''}`,
          action_url: '/super-admin/demo-requests',
          is_read: Boolean(isRead),
          created_at: c.submitted_at
        });
      });
    } catch (e) {}

    // 3. Customer Payments & Billing Logs
    try {
      const payRes = await query(`
        SELECT id, tenant_id, amount, currency, status, gateway, invoice_number, created_at
        FROM shared.payment_logs
        ORDER BY created_at DESC LIMIT 15
      `);
      payRes.rows.forEach(p => {
        const notifId = `pay_${p.id}`;
        const isRead = p.status === 'completed' || readIds.includes(notifId) || (lastReadAt && new Date(p.created_at) <= lastReadAt);
        feed.push({
          id: notifId,
          module: 'billing',
          title: `Payment: ${p.currency} ${p.amount} (${p.tenant_id})`,
          message: `Gateway: ${p.gateway || 'manual'} • Invoice #${p.invoice_number || p.id} is ${p.status}.`,
          action_url: '/super-admin/billing',
          is_read: Boolean(isRead),
          created_at: p.created_at
        });
      });
    } catch (e) {}

    // 4. New Tenant Registrations
    try {
      const tenantRes = await query(`
        SELECT tenant_id, name, subscription_plan, status, created_at
        FROM shared.tenants
        ORDER BY created_at DESC LIMIT 10
      `);
      tenantRes.rows.forEach(t => {
        const notifId = `tenant_${t.tenant_id}`;
        const isRead = readIds.includes(notifId) || (lastReadAt && new Date(t.created_at) <= lastReadAt);
        feed.push({
          id: notifId,
          module: 'tenants',
          title: `Company Registered: ${t.name}`,
          message: `ID: ${t.tenant_id} • Plan: ${t.subscription_plan || 'free'} (${t.status})`,
          action_url: '/super-admin',
          is_read: Boolean(isRead),
          created_at: t.created_at
        });
      });
    } catch (e) {}

    // Sort all platform activity chronologically
    feed.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (unreadOnly) {
      feed = feed.filter(f => !f.is_read);
    }

    return res.json({
      success: true,
      isSuperAdmin: true,
      data: feed.slice(offset, offset + limit),
      unreadCount: feed.filter(f => !f.is_read).length
    });
  }

  // Tenant in-app notifications
  try {
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

    return res.json({
      success: true,
      isSuperAdmin: false,
      data: result.rows,
      unreadCount: parseInt(countRes.rows[0]?.count || 0, 10)
    });
  } catch (err) {
    return res.json({
      success: true,
      isSuperAdmin: false,
      data: [],
      unreadCount: 0
    });
  }
});

/**
 * Mark a single notification as read
 */
const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.userId || req.user?.id;
  const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'super_admin');

  if (isSuperAdmin) {
    try {
      await query(`
        UPDATE shared.super_admins 
        SET read_notification_ids = (CASE WHEN read_notification_ids IS NULL THEN '[]'::jsonb ELSE read_notification_ids END) || jsonb_build_array($1::text)
        WHERE id = $2 OR email = $3
      `, [id, userId, req.user?.email]);
    } catch (_) {}

    return res.json({
      success: true,
      message: 'Notification marked as read',
      data: { id, is_read: true }
    });
  }

  try {
    const result = await query(`
      UPDATE user_notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND (user_id = $2 OR user_id IS NULL)
      RETURNING *
    `, [id, userId]);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: result.rows[0] || { id, is_read: true }
    });
  } catch (err) {
    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { id, is_read: true }
    });
  }
});

/**
 * Mark all notifications for user as read
 */
const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const isSuperAdmin = Boolean(req.user?.isSuperAdmin || req.user?.role === 'super_admin');

  if (isSuperAdmin) {
    try {
      await query(`
        UPDATE shared.super_admins 
        SET last_notifications_read_at = CURRENT_TIMESTAMP 
        WHERE id = $1 OR email = $2
      `, [userId, req.user?.email]);
    } catch (_) {}

    return res.json({
      success: true,
      message: 'All platform notifications marked as read'
    });
  }

  try {
    await query(`
      UPDATE user_notifications 
      SET is_read = true, read_at = CURRENT_TIMESTAMP
      WHERE (user_id = $1 OR user_id IS NULL) AND is_read = false
    `, [userId]);
  } catch (_) {}

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
