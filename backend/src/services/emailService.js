const nodemailer = require('nodemailer');

// Log email configuration (masking password)
// Parse configuration
const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
const secure = process.env.SMTP_SECURE === 'true' || (process.env.SMTP_SECURE === undefined && smtpPort === 465);

// Log email configuration (masking password)
console.log('📧 configuring email service with:', {
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: secure,
    user: process.env.SMTP_USER,
    // pass: '****' 
});

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: secure, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Connection settings - Increased timeouts for better stability
    connectionTimeout: 20000, // 20 seconds
    greetingTimeout: 10000,   // 10 seconds
    socketTimeout: 20000,     // 20 seconds
    // Debug settings
    logger: true,
    debug: true
});

// Verify connection configuration on startup
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Email connection error:', error);
    } else {
        console.log('✅ Email server is ready to take our messages');
    }
});

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @returns {Promise<Object>} - Nodemailer info object
 */
const sendEmail = async ({ to, subject, text, html }) => {
    try {
        console.log(`Attempting to send email to ${to}...`);
        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'HRMS Pro'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
            to,
            subject,
            text,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        throw error;
    }
};

module.exports = {
    sendEmail,
};
