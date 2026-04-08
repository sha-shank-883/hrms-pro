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

// Background Email Queue
const emailQueue = [];
const MAX_QUEUE_SIZE = 1000; // Prevent memory exhaustion
let isProcessingQueue = false;

const processQueue = async () => {
    if (isProcessingQueue || emailQueue.length === 0) return;
    isProcessingQueue = true;
    
    while (emailQueue.length > 0) {
        const emailRequest = emailQueue.shift();
        const { options, retries = 0 } = emailRequest;
        
        try {
            console.log(`[EmailWorker] Sending email to ${options.to} (Retry: ${retries})...`);
            const info = await transporter.sendMail({
                from: `"${process.env.SMTP_FROM_NAME || 'HRMS Pro'}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
                ...options,
            });
            console.log('[EmailWorker] Message sent: %s', info.messageId);
        } catch (error) {
            console.error(`[EmailWorker] Error sending email to ${options.to}:`, error.message);
            
            // Basic Retry Logic
            if (retries < 3) {
                console.log(`[EmailWorker] Re-queueing email to ${options.to} for retry...`);
                emailQueue.push({ options, retries: retries + 1 });
            } else {
                console.error(`[EmailWorker] Max retries reached for ${options.to}. Email dropped.`);
            }
        }
        
        // Wait 200ms between emails to prevent rate limiting or socket exhaustion
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    isProcessingQueue = false;
};

/**
 * Send an email asynchronously (non-blocking)
 * @param {Object} options - Email options
 */
const sendEmail = async (options) => {
    if (emailQueue.length >= MAX_QUEUE_SIZE) {
        console.error('[EmailService] Queue is full! Dropping email request.');
        return { status: 'error', message: 'Email queue overflow' };
    }

    emailQueue.push({ options, retries: 0 });
    
    // Trigger queue processing (fire and forget)
    processQueue().catch(err => console.error('Queue processing error:', err));
    
    return { status: 'queued', message: 'Email queued for delivery' };
};

module.exports = {
    sendEmail,
};
