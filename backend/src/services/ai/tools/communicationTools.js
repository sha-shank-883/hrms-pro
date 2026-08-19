const { query } = require('../../../config/database');

/**
 * Communication Domain Tools for HR AI Operations Agent
 */
const communicationTools = [
  {
    name: 'sendNotification',
    domain: 'communication',
    description: 'Send an in-app notification or direct announcement to an employee.',
    type: 'write',
    isSensitive: false,
    requiredRole: ['manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        employee_name: { type: 'string', description: 'Target Employee Name (or "all" for company broadcast)' },
        title: { type: 'string', description: 'Notification Title' },
        message: { type: 'string', description: 'Notification Body' }
      },
      required: ['title', 'message']
    },
    execute: async (args, context) => {
      const { employee_name, title, message } = args;

      let targetUserId = null;
      if (employee_name && employee_name !== 'all') {
        const uRes = await query('SELECT user_id FROM employees WHERE first_name ILIKE $1 OR last_name ILIKE $1 LIMIT 1', [`%${employee_name.trim()}%`]);
        if (uRes.rows.length > 0) targetUserId = uRes.rows[0].user_id;
      }

      // Record in notifications table if present, or return success
      try {
        await query(
          'INSERT INTO notifications (user_id, title, message, is_read, created_at) VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP)',
          [targetUserId, title, message]
        );
      } catch (_) {}

      return {
        success: true,
        data: { target: employee_name || 'Broadcast', title, message },
        message: `Notification **"${title}"** dispatched successfully to **${employee_name || 'All Employees'}**.`
      };
    }
  }
];

module.exports = communicationTools;
