const { sendEmail } = require('./emailService');

const notifyNewTicket = async ({ userEmail, ticketNumber, subject, priority }) => {
  return sendEmail({
    to: userEmail,
    subject: `[${ticketNumber}] Support Ticket Created: ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a73e8;">Support Ticket Created</h2>
        <p>Your support ticket has been created successfully.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Ticket Number</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${ticketNumber}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${subject}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Priority</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${priority}</td></tr>
        </table>
        <p>Our support team will get back to you as soon as possible.</p>
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply directly.</p>
      </div>
    `
  });
};

const notifyTicketUpdate = async ({ userEmail, ticketNumber, status, comment }) => {
  return sendEmail({
    to: userEmail,
    subject: `[${ticketNumber}] Ticket Update: ${status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a73e8;">Ticket Status Update</h2>
        <p>Your ticket <strong>${ticketNumber}</strong> has been updated.</p>
        <p><strong>Status:</strong> ${status}</p>
        ${comment ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;"><p>${comment}</p></div>` : ''}
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply directly.</p>
      </div>
    `
  });
};

const notifyAdminNewTicket = async ({ adminEmail, ticketNumber, subject, priority, userName }) => {
  return sendEmail({
    to: adminEmail,
    subject: `[URGENT] New Support Ticket: ${ticketNumber} - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d93025;">New Support Ticket</h2>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Ticket</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${ticketNumber}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">From</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${userName}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Subject</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${subject}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd; font-weight: bold;">Priority</td>
              <td style="padding: 8px; border: 1px solid #ddd; color: ${priority === 'urgent' ? '#d93025' : priority === 'high' ? '#e37400' : '#1a73e8'}; font-weight: bold;">${priority}</td></tr>
        </table>
        <p style="color: #666; font-size: 12px;">This is an automated admin notification.</p>
      </div>
    `
  });
};

const notifyNewChatForAgent = async ({ agentEmail, userName, chatId }) => {
  return sendEmail({
    to: agentEmail,
    subject: `New Support Chat Assigned - ${userName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a73e8;">New Chat Assignment</h2>
        <p>A new support chat from <strong>${userName}</strong> has been assigned to you.</p>
        <p><a href="${process.env.APP_URL || 'https://app.hrmspro.com'}/support/chats/${chatId}" style="display: inline-block; padding: 10px 20px; background: #1a73e8; color: white; text-decoration: none; border-radius: 5px;">View Chat</a></p>
      </div>
    `
  });
};

const notifyEscalation = async ({ adminEmail, ticketNumber, subject, reason }) => {
  return sendEmail({
    to: adminEmail,
    subject: `[ESCALATION] ${ticketNumber} - ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #d93025;">⚠️ Ticket Escalation</h2>
        <p>Ticket <strong>${ticketNumber}</strong> has been escalated.</p>
        <p><strong>Subject:</strong> ${subject}</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
        <p style="color: #666; font-size: 12px;">This is an automated escalation notification.</p>
      </div>
    `
  });
};

module.exports = {
  notifyNewTicket,
  notifyTicketUpdate,
  notifyAdminNewTicket,
  notifyNewChatForAgent,
  notifyEscalation
};
