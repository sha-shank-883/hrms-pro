const { query } = require('../config/database');
const emailService = require('./emailService');

const POLL_INTERVAL = 30000;
let pollTimer = null;
let isProcessing = false;

const startWorker = () => {
  if (pollTimer) return;
  pollTimer = setInterval(processQueue, POLL_INTERVAL);
  processQueue();
};

const stopWorker = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

const processQueue = async () => {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const result = await query(
      `SELECT eq.*, ps.pdf_path, e.first_name || ' ' || e.last_name as employee_name
       FROM email_queue eq
       JOIN payslips ps ON eq.payslip_id = ps.payslip_id
       JOIN employees e ON ps.employee_id = e.employee_id
       WHERE eq.status = 'pending' AND eq.attempts < eq.max_attempts
       ORDER BY eq.created_at ASC
       LIMIT 10`
    );

    for (const item of result.rows) {
      try {
        const html = buildPayslipEmailHtml(item);
        const attachments = [];

        if (item.pdf_path) {
          attachments.push({
            filename: `payslip_${item.payslip_id}.pdf`,
            path: item.pdf_path,
          });
        }

        await emailService.sendEmail({
          to: item.recipient_email,
          subject: item.subject || 'Your Payslip',
          html,
          attachments,
        });

        await query(
          `UPDATE email_queue SET status = 'sent', sent_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP WHERE queue_id = $1`,
          [item.queue_id]
        );
      } catch (err) {
        const newAttempts = item.attempts + 1;
        if (newAttempts >= item.max_attempts) {
          await query(
            `UPDATE email_queue SET status = 'failed', attempts = $1,
             last_error = $2, updated_at = CURRENT_TIMESTAMP WHERE queue_id = $3`,
            [newAttempts, err.message, item.queue_id]
          );
        } else {
          await query(
            `UPDATE email_queue SET attempts = $1, last_error = $2,
             updated_at = CURRENT_TIMESTAMP WHERE queue_id = $3`,
            [newAttempts, err.message, item.queue_id]
          );
        }
      }
    }
  } catch (err) {
    console.error('[EmailQueueWorker] Error processing queue:', err.message);
  } finally {
    isProcessing = false;
  }
};

const buildPayslipEmailHtml = (item) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #4f46e5; padding: 30px; border-radius: 12px 12px 0 0;">
        <h1 style="color: white; margin: 0; font-size: 24px;">Your Payslip</h1>
      </div>
      <div style="padding: 30px; background: #f9fafb; border: 1px solid #e5e7eb;">
        <p style="font-size: 16px; color: #374151;">Dear ${item.recipient_name || 'Employee'},</p>
        <p style="font-size: 14px; color: #6b7280;">Your payslip is ready. Please find it attached to this email.</p>
        <p style="font-size: 14px; color: #6b7280;">You can also download it from your employee portal at any time.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9ca3af;">This is an automated message from the HRMS system. Do not reply to this email.</p>
      </div>
      <div style="background: #f3f4f6; padding: 15px; text-align: center; border-radius: 0 0 12px 12px;">
        <p style="font-size: 11px; color: #9ca3af; margin: 0;">HRMS Pro — Automated Payslip Delivery</p>
      </div>
    </div>
  `;
};

module.exports = { startWorker, stopWorker, processQueue };
