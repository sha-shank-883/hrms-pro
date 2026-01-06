require('dotenv').config();
const nodemailer = require('nodemailer');
const { sendEmail } = require('../services/emailService');

const testEmail = async () => {
    console.log('📧 Testing Email Service...');
    console.log('--------------------------------');
    console.log('SMTP Host:', process.env.SMTP_HOST);
    console.log('SMTP Port:', process.env.SMTP_PORT);
    console.log('SMTP User:', process.env.SMTP_USER);
    console.log('--------------------------------');

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Missing SMTP configuration in .env file.');
        console.log('Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS.');
        process.exit(1);
    }

    try {
        const info = await sendEmail({
            to: process.env.TEST_EMAIL_RECIPIENT || process.env.SMTP_USER, // Default to self if not set
            subject: 'HRMS Pro - Test Email',
            text: 'This is a test email from your HRMS system.',
            html: '<h1>HRMS Pro Email Test</h1><p>This is a <b>test email</b> from your HRMS system to verify the configuration.</p>',
        });

        console.log('✅ Email sent successfully!');
        console.log('Message ID:', info.messageId);
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info)); // Only for Ethereal accounts
    } catch (error) {
        console.error('❌ Failed to send email:', error.message);
    }
};

testEmail();
