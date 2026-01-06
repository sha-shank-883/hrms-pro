const nodemailer = require('nodemailer');

// Log email configuration (masking password)
console.log('📧 configuring email service with:', {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE,
    user: process.env.SMTP_USER,
    // pass: '****' 
});

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    // Connection settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 5000,    // 5 seconds
    socketTimeout: 10000,     // 10 seconds
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
