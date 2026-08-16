const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const { pool, query, tenantStorage } = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { sanitizeBody } = require('./middleware/validate');
const fs = require('fs');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const emailQueueService = require('./services/emailQueueService');
const departmentRoutes = require('./routes/departmentRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const leaveRoutes = require('./routes/leaveRoutes');
const taskRoutes = require('./routes/taskRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const emailTemplateRoutes = require('./routes/emailTemplateRoutes');
const performanceRoutes = require('./routes/performanceRoutes');
const tenantRoutes = require('./routes/tenantRoutes');
const searchRoutes = require('./routes/searchRoutes');
const mobileConfigRoutes = require('./routes/mobileConfigRoutes');
const supportRoutes = require('./routes/supportRoutes');
const { setupSocketHandlers } = require('./socket');

// Initialize express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.FRONTEND_URL || 'https://app.hrmspro.online'
      : true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/settings' && !req.headers.authorization;
  }
});

const connectedUsers = new Map(); // userId -> Set of socketIds

// Middleware to attach io to req
app.use((req, res, next) => {
  req.io = io;
  req.connectedUsers = connectedUsers;
  next();
});

app.set('io', io);
app.set('connectedUsers', connectedUsers);

const {
  owaspSanitizerMiddleware,
  ipJailMiddleware,
  globalLimiter
} = require('./middleware/securityGuards');

// Middleware
app.use(ipJailMiddleware);
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL || 'https://app.hrmspro.online'
    : true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use(owaspSanitizerMiddleware);
app.use('/api/', globalLimiter);

// ONE-OFF DATABASE SETUP ROUTE (For Render deployment)
app.get('/api/setup-db', async (req, res) => {
  const setupPassword = req.headers['x-setup-password'] || req.query.password;
  const envPassword = process.env.SETUP_PASSWORD;

  if (process.env.NODE_ENV === 'production' && !envPassword) {
    return res.status(500).json({ success: false, message: 'SETUP_PASSWORD environment variable must be set in production' });
  }

  if (process.env.NODE_ENV === 'production' && setupPassword !== envPassword) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Setup password required in production' });
  }

  const client = await pool.connect();
  try {
    console.log('🔄 Starting Database Setup via HTTP...');

    // 1. Create Shared Schema and Global Tables
    const sharedSchemaPath = path.join(__dirname, 'config/shared_schema.sql');
    if (fs.existsSync(sharedSchemaPath)) {
      const sharedSchemaSql = fs.readFileSync(sharedSchemaPath, 'utf8');
      await client.query(sharedSchemaSql);
      console.log('✅ Shared schema and core tables verified.');
    } else {
      await client.query(`CREATE SCHEMA IF NOT EXISTS shared`);
    }

    // Ensure Global Marketing/CMS Tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS shared.website_settings (
        id SERIAL PRIMARY KEY,
        primary_color VARCHAR(50),
        font_family VARCHAR(100),
        logo_url TEXT,
        header_links JSONB DEFAULT '[]',
        footer_columns JSONB DEFAULT '[]',
        sections JSONB DEFAULT '[]',
        custom_css TEXT,
        custom_js TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS shared.cms_pages (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(255) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        content_html TEXT,
        sections JSONB DEFAULT '[]',
        meta_title VARCHAR(255),
        meta_description TEXT,
        published_status VARCHAR(50) DEFAULT 'published',
        layout_template VARCHAR(50) DEFAULT 'default',
        custom_css TEXT,
        custom_js TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shared.biometric_devices (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(100) REFERENCES shared.tenants(tenant_id) ON DELETE CASCADE,
        serial_number VARCHAR(255) UNIQUE NOT NULL,
        brand VARCHAR(100),
        status VARCHAR(50) DEFAULT 'active',
        last_ping TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS shared.app_configs (
        id SERIAL PRIMARY KEY,
        config_key TEXT UNIQUE NOT NULL,
        config_value JSONB NOT NULL,
        category TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS shared.payment_logs (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(100) REFERENCES shared.tenants(tenant_id) ON DELETE CASCADE,
        plan_id VARCHAR(50) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'USD',
        paypal_order_id VARCHAR(255),
        razorpay_order_id VARCHAR(255),
        razorpay_payment_id VARCHAR(255),
        gateway VARCHAR(50) DEFAULT 'paypal',
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;
      ALTER TABLE shared.tenants ADD COLUMN IF NOT EXISTS employee_limit INTEGER DEFAULT 15;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS gateway VARCHAR(50) DEFAULT 'paypal';
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255);
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT 0;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS refund_reason TEXT;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50);
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS seats_purchased INTEGER DEFAULT 15;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT false;
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly';
      ALTER TABLE shared.payment_logs ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);

      CREATE TABLE IF NOT EXISTS shared.demo_requests (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        status VARCHAR(50) DEFAULT 'pending',
        tenant_id VARCHAR(100),
        password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
      ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS tenant_id VARCHAR(100);
      ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
      ALTER TABLE shared.demo_requests ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

      CREATE TABLE IF NOT EXISTS shared.lead_magnet_downloads (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        resource VARCHAR(255) NOT NULL DEFAULT 'HR Compliance Checklist 2026',
        downloaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shared.contact_inquiries (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        company VARCHAR(255),
        phone VARCHAR(50),
        subject VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure at least one row exists in website_settings
    const settingsCheck = await client.query('SELECT id FROM shared.website_settings LIMIT 1');
    if (settingsCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO shared.website_settings (primary_color, font_family, sections)
        VALUES ('#16a34a', 'Inter', '[]')
      `);
      console.log('✅ Initial website settings record created.');
    }

    // Seed default CMS pages if empty
    const cmsCount = await client.query('SELECT COUNT(*) FROM shared.cms_pages');
    if (parseInt(cmsCount.rows[0].count) === 0) {
      const defaultPages = [
        { slug: 'features', title: 'Features', content_html: '<section class="py-24 px-6 max-w-7xl mx-auto text-center"><h1 class="text-5xl font-bold mb-6">All-in-One HR Platform</h1><p class="text-xl text-neutral-600 max-w-3xl mx-auto mb-12">From hiring to retirement, manage every aspect of the employee lifecycle with a single, integrated platform.</p><div class="grid md:grid-cols-3 gap-8 text-left"><div class="p-8 rounded-2xl border border-neutral-100 shadow-sm"><h3 class="text-xl font-bold mb-3">Core HR</h3><p class="text-neutral-600">Centralized employee database, document management, and organizational charting.</p></div><div class="p-8 rounded-2xl border border-neutral-100 shadow-sm"><h3 class="text-xl font-bold mb-3">Payroll</h3><p class="text-neutral-600">Automated payroll processing with tax calculations, deductions, and compliance.</p></div><div class="p-8 rounded-2xl border border-neutral-100 shadow-sm"><h3 class="text-xl font-bold mb-3">Time & Attendance</h3><p class="text-neutral-600">GPS geo-fencing, biometric verification, and shift management.</p></div></div></section>', meta_title: 'HRMS Features' },
        { slug: 'pricing', title: 'Pricing', content_html: '<section class="py-24 px-6 max-w-7xl mx-auto text-center"><h1 class="text-5xl font-bold mb-6">Simple, Transparent Pricing</h1><p class="text-xl text-neutral-600 max-w-2xl mx-auto mb-16">Choose the plan that fits your team. All plans include a 14-day free trial.</p><div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"><div class="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm text-left"><h3 class="text-xl font-bold mb-2">Starter</h3><p class="text-4xl font-extrabold mb-6">$29<span class="text-base text-neutral-500 font-medium">/month</span></p><ul class="space-y-3 mb-8"><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Up to 50 employees</li><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Core HR & Payroll</li><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Time Tracking</li><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Email Support</li></ul><a href="/demo" class="block w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold text-center rounded-xl transition-colors">Get Started</a></div><div class="bg-white p-8 rounded-2xl border-2 border-primary-500 shadow-xl scale-105 text-left relative"><div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-bold">Most Popular</div><h3 class="text-xl font-bold mb-2">Business</h3><p class="text-4xl font-extrabold mb-6">$79<span class="text-base text-neutral-500 font-medium">/month</span></p><ul class="space-y-3 mb-8"><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Up to 200 employees</li><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Everything in Starter</li><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Performance Management</li><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Advanced Analytics</li><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Priority Support</li></ul><a href="/demo" class="block w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold text-center rounded-xl transition-colors">Get Started</a></div><div class="bg-white p-8 rounded-2xl border border-neutral-200 shadow-sm text-left"><h3 class="text-xl font-bold mb-2">Enterprise</h3><p class="text-4xl font-extrabold mb-6">Custom</p><ul class="space-y-3 mb-8"><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Unlimited employees</li><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Everything in Business</li><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Dedicated Account Manager</li><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> Custom Integrations</li><li class="flex items-center gap-2"><svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg> SLA Guarantee</li></ul><a href="/demo" class="block w-full py-3 border border-neutral-200 text-neutral-800 font-semibold text-center rounded-xl hover:bg-neutral-50 transition-colors">Contact Sales</a></div></div></section>', meta_title: 'Pricing - HRMS Pro' },
        { slug: 'about', title: 'About Us', content_html: '<section class="py-24 px-6 max-w-4xl mx-auto"><h1 class="text-5xl font-bold mb-6 text-center">About HRMS Pro</h1><p class="text-xl text-neutral-600 text-center max-w-2xl mx-auto mb-16">We are on a mission to make HR management seamless, accessible, and delightful for every organization.</p><div class="prose prose-lg max-w-none"><p>Founded in 2024, HRMS Pro was built by HR professionals and engineers who experienced firsthand the pain of managing people with outdated, disconnected tools. We believed there had to be a better way.</p><p>Today, HRMS Pro serves hundreds of organizations worldwide, helping them automate payroll, streamline attendance tracking, manage performance, and build stronger workplace cultures.</p><p>Our team is distributed across the globe, united by a shared passion for creating technology that makes work better for everyone.</p></div></section>', meta_title: 'About HRMS Pro' },
        { slug: 'contact', title: 'Contact Us', content_html: '<section class="py-24 px-6 max-w-4xl mx-auto"><h1 class="text-5xl font-bold mb-6 text-center">Get in Touch</h1><p class="text-xl text-neutral-600 text-center max-w-2xl mx-auto mb-16">Have questions? Our team is ready to help.</p><div class="grid md:grid-cols-2 gap-12"><div><h3 class="text-lg font-bold mb-4">Contact Information</h3><p class="text-neutral-600 mb-2">Email: hello@hrmspro.online</p><p class="text-neutral-600 mb-2">Phone: +1 (555) 123-4567</p><p class="text-neutral-600">Address: 100 Tech Lane, Suite 200, San Francisco, CA 94105</p></div><div><h3 class="text-lg font-bold mb-4">Sales Inquiries</h3><p class="text-neutral-600 mb-6">Interested in HRMS Pro for your organization? Request a personalized demo.</p><a href="/demo" class="inline-flex py-3 px-6 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors">Request a Demo</a></div></div></section>', meta_title: 'Contact HRMS Pro' },
        { slug: 'faq', title: 'FAQ', content_html: '<section class="py-24 px-6 max-w-3xl mx-auto"><h1 class="text-5xl font-bold mb-6 text-center">Frequently Asked Questions</h1><p class="text-xl text-neutral-600 text-center max-w-2xl mx-auto mb-16">Everything you need to know about HRMS Pro.</p><div class="space-y-8"><div><h3 class="text-lg font-bold mb-2">How does the free trial work?</h3><p class="text-neutral-600">You get full access to all features for 14 days. No credit card required.</p></div><div><h3 class="text-lg font-bold mb-2">Can I import data from my current system?</h3><p class="text-neutral-600">Yes, we support CSV/Excel imports and provide guided migration support.</p></div><div><h3 class="text-lg font-bold mb-2">Is my data secure?</h3><p class="text-neutral-600">Absolutely. We use encryption at rest and in transit, and we are SOC 2 Type II certified.</p></div><div><h3 class="text-lg font-bold mb-2">What support options are available?</h3><p class="text-neutral-600">All plans include email support. Business plans include priority support, and Enterprise plans include a dedicated account manager.</p></div></div></section>', meta_title: 'FAQ - HRMS Pro' },
        { slug: 'privacy', title: 'Privacy Policy', content_html: '<section class="py-24 px-6 max-w-4xl mx-auto prose prose-lg max-w-none"><h1>Privacy Policy</h1><p>Last updated: January 1, 2026</p><p>HRMS Pro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information.</p><h2>Information We Collect</h2><p>We collect information that you provide directly to us, including name, email address, company name, and payment information when you create an account or request a demo.</p><h2>How We Use Your Information</h2><p>We use the information we collect to provide, maintain, and improve our services, to process transactions, to send technical notices and support messages, and to respond to your comments and questions.</p><h2>Data Security</h2><p>We implement appropriate technical and organizational security measures to protect your personal information.</p><h2>Contact Us</h2><p>If you have questions about this Privacy Policy, please contact us at hello@hrmspro.online.</p></section>', meta_title: 'Privacy Policy' },
        { slug: 'terms', title: 'Terms of Service', content_html: '<section class="py-24 px-6 max-w-4xl mx-auto prose prose-lg max-w-none"><h1>Terms of Service</h1><p>Last updated: January 1, 2026</p><h2>Acceptance of Terms</h2><p>By accessing or using HRMS Pro, you agree to be bound by these Terms of Service.</p><h2>Description of Service</h2><p>HRMS Pro provides a human resources management platform including payroll, attendance tracking, performance management, and related services.</p><h2>User Obligations</h2><p>You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.</p><h2>Limitation of Liability</h2><p>HRMS Pro shall not be liable for any indirect, incidental, special, consequential, or punitive damages.</p></section>', meta_title: 'Terms of Service' },
        { slug: 'careers', title: 'Careers', content_html: '<section class="py-24 px-6 max-w-4xl mx-auto text-center"><h1 class="text-5xl font-bold mb-6">Join Our Team</h1><p class="text-xl text-neutral-600 max-w-2xl mx-auto mb-16">Help us build the future of HR technology. We are always looking for talented people who share our values.</p><div class="space-y-6 text-left max-w-2xl mx-auto"><div class="p-6 rounded-2xl border border-neutral-100 shadow-sm"><h3 class="text-lg font-bold mb-1">Senior Software Engineer</h3><p class="text-sm text-neutral-500 mb-3">Remote / Full-time</p><p class="text-neutral-600 text-sm">Build and scale our core platform using Node.js, React, and PostgreSQL.</p></div><div class="p-6 rounded-2xl border border-neutral-100 shadow-sm"><h3 class="text-lg font-bold mb-1">Product Designer</h3><p class="text-sm text-neutral-500 mb-3">Remote / Full-time</p><p class="text-neutral-600 text-sm">Design intuitive experiences that make HR management delightful.</p></div><div class="p-6 rounded-2xl border border-neutral-100 shadow-sm"><h3 class="text-lg font-bold mb-1">Customer Success Manager</h3><p class="text-sm text-neutral-500 mb-3">Remote / Full-time</p><p class="text-neutral-600 text-sm">Help our customers get the most out of the HRMS Pro platform.</p></div></div></section>', meta_title: 'Careers - HRMS Pro' },
        { slug: 'integrations', title: 'Integrations', content_html: '<section class="py-24 px-6 max-w-4xl mx-auto text-center"><h1 class="text-5xl font-bold mb-6">Integrations</h1><p class="text-xl text-neutral-600 max-w-2xl mx-auto mb-16">Connect HRMS Pro with the tools you already use.</p><div class="grid md:grid-cols-3 gap-6 text-left max-w-4xl mx-auto"><div class="p-6 rounded-2xl border border-neutral-100 shadow-sm"><h3 class="font-bold mb-2">Slack</h3><p class="text-sm text-neutral-600">Get notifications and approve requests directly from Slack.</p></div><div class="p-6 rounded-2xl border border-neutral-100 shadow-sm"><h3 class="font-bold mb-2">Google Workspace</h3><p class="text-sm text-neutral-600">Sync employee data and calendars with Google.</p></div><div class="p-6 rounded-2xl border border-neutral-100 shadow-sm"><h3 class="font-bold mb-2">QuickBooks</h3><p class="text-sm text-neutral-600">Sync payroll data with QuickBooks accounting.</p></div></div></section>', meta_title: 'Integrations - HRMS Pro' },
        { slug: 'case-studies', title: 'Case Studies', content_html: '<section class="py-24 px-6 max-w-4xl mx-auto text-center"><h1 class="text-5xl font-bold mb-6">Case Studies</h1><p class="text-xl text-neutral-600 max-w-2xl mx-auto mb-16">See how organizations are transforming their HR operations with HRMS Pro.</p><div class="space-y-8 text-left max-w-3xl mx-auto"><div class="p-8 rounded-2xl border border-neutral-100 shadow-sm"><h3 class="text-xl font-bold mb-2">Acme Corp</h3><p class="text-sm text-neutral-500 mb-3">500 employees | Technology</p><p class="text-neutral-600">"HRMS Pro reduced our payroll processing time from 3 days to 2 hours. The automation has been a game-changer for our finance team."</p></div><div class="p-8 rounded-2xl border border-neutral-100 shadow-sm"><h3 class="text-xl font-bold mb-2">Globex Inc.</h3><p class="text-sm text-neutral-500 mb-3">200 employees | Manufacturing</p><p class="text-neutral-600">"The geo-fencing attendance system eliminated buddy punching and saved us thousands in lost productivity."</p></div></div></section>', meta_title: 'Case Studies - HRMS Pro' },
        { slug: 'docs', title: 'API Documentation', content_html: '<section class="py-24 px-6 max-w-4xl mx-auto prose prose-lg max-w-none"><h1>API Documentation</h1><p>Welcome to the HRMS Pro API. Our RESTful API allows you to integrate HRMS Pro with your existing tools and workflows.</p><h2>Authentication</h2><p>All API requests require a valid JWT token in the Authorization header.</p><h2>Base URL</h2><pre class="bg-neutral-100 p-4 rounded-lg">https://api.hrmspro.online/api</pre><h2>Rate Limiting</h2><p>API requests are limited to 1000 requests per 15 minutes per IP.</p><p>For detailed API documentation, please contact our support team.</p></section>', meta_title: 'API Docs - HRMS Pro' },
        { slug: 'partners', title: 'Partner Program', content_html: '<section class="py-24 px-6 max-w-4xl mx-auto text-center"><h1 class="text-5xl font-bold mb-6">Partner Program</h1><p class="text-xl text-neutral-600 max-w-2xl mx-auto mb-8">Join the HRMS Pro Partner Program and grow your business while helping clients transform their HR operations.</p><a href="/demo" class="inline-flex py-3 px-8 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-xl transition-colors">Become a Partner</a></section>', meta_title: 'Partners - HRMS Pro' },
      ];
      for (const page of defaultPages) {
        await client.query(
          `INSERT INTO shared.cms_pages (slug, title, content_html, meta_title, published_status) VALUES ($1, $2, $3, $4, 'published') ON CONFLICT (slug) DO NOTHING`,
          [page.slug, page.title, page.content_html, page.meta_title]
        );
      }
      console.log(`✅ ${defaultPages.length} default CMS pages seeded.`);
    }
    console.log('✅ Global CMS tables and records verified.');

    // 1.5 Ensure Global Super Admin Accounts exist
    await client.query(`
      INSERT INTO shared.super_admins (email, password_hash, full_name, is_active)
      VALUES 
        ('info@hrmspro.online', '$2b$10$KSjIGnBOJwk/rkxlsg8WnewdeMQWjHerRJYTOWzIac7UY0DDzQ5Le', 'Master Super Admin', true),
        ('admin@hrmspro.com', '$2b$10$KSjIGnBOJwk/rkxlsg8WnewdeMQWjHerRJYTOWzIac7UY0DDzQ5Le', 'System Super Admin', true)
      ON CONFLICT (email) DO NOTHING;
    `);
    console.log('✅ Global Super Admin accounts verified.');

    // 2. Create Default Tenant
    const defaultTenantId = 'tenant_default';
    await client.query(`
      INSERT INTO shared.tenants (tenant_id, name, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (tenant_id) DO NOTHING
    `, [defaultTenantId, 'Default Company']);

    // 4. Run Migration for ALL Tenants
    const tenantsResult = await client.query('SELECT tenant_id FROM shared.tenants');
    const tenants = tenantsResult.rows;
    
    const tenantSchemaPath = path.join(__dirname, 'config/tenant_schema.sql');
    const hasTenantSchema = fs.existsSync(tenantSchemaPath);
    const tenantSchemaSql = hasTenantSchema ? fs.readFileSync(tenantSchemaPath, 'utf8') : '';

    console.log(`🔄 Syncing schema for ${tenants.length} tenants...`);

    for (const tenant of tenants) {
      const tId = tenant.tenant_id;
      try {
        console.log(`   - Syncing tenant: ${tId}`);
        await client.query(`CREATE SCHEMA IF NOT EXISTS "${tId}"`);
        await client.query(`SET search_path TO "${tId}"`);
        
        if (hasTenantSchema) {
          await client.query(tenantSchemaSql);
        }

        // CRITICAL: Ensure permissions and security columns exist in the users table for THIS tenant
        await client.query(`
          ALTER TABLE users 
          ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb,
          ADD COLUMN IF NOT EXISTS is_two_factor_enabled BOOLEAN DEFAULT false,
          ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
          ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
          ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP,
          ADD COLUMN IF NOT EXISTS biometric_id VARCHAR(100)
        `);

        // Check if attendance exists and add columns if it does
        try {
          await client.query(`
            ALTER TABLE attendance
            ADD COLUMN IF NOT EXISTS device_serial VARCHAR(255),
            ADD COLUMN IF NOT EXISTS punch_source VARCHAR(50) DEFAULT 'System'
          `);
        } catch (e) {
            // table might not exist in old migrations, skip gracefully
        }

        // Ensure Admin Users Exist for this tenant
        await client.query(`
          INSERT INTO users (email, password_hash, role, is_active) 
          VALUES 
            ('info@hrmspro.online', '$2b$10$KSjIGnBOJwk/rkxlsg8WnewdeMQWjHerRJYTOWzIac7UY0DDzQ5Le', 'admin', true),
            ('admin@hrmspro.com', '$2b$10$KSjIGnBOJwk/rkxlsg8WnewdeMQWjHerRJYTOWzIac7UY0DDzQ5Le', 'admin', true)
          ON CONFLICT (email) DO UPDATE
            SET password_hash = EXCLUDED.password_hash,
                role = 'admin',
                is_active = true;
        `);
      } catch (tenantError) {
        console.error(`   ❌ Failed to sync tenant ${tId}:`, tenantError.message);
      }
    }

    res.json({ 
      success: true, 
      message: `Database setup and schema synchronization completed for ${tenants.length} tenants!` 
    });
  } catch (error) {
    console.error('Setup failed:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    client.release();
  }
});

// Multi-tenancy Middleware
const tenantMiddleware = require('./middleware/tenantMiddleware');
app.use('/api', tenantMiddleware);

// Temporary Debug Route for Multi-Tenancy
app.get('/api/tenant-info', (req, res) => {
  if (!req.tenant) {
    return res.status(400).json({ error: 'No tenant context found' });
  }
  res.json({
    message: 'Tenant Context Verified',
    tenant_id: req.tenant.tenant_id,
    tenant_name: req.tenant.name
  });
});

// Serve static files (uploads)
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/payroll-runs', require('./routes/payrollRunRoutes'));
app.use('/api/payslip-templates', require('./routes/payslipTemplateRoutes'));
app.use('/api/payslips', require('./routes/payslipRoutes'));
app.use('/api/recruitment', recruitmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/assets', require('./routes/assetRoutes'));
app.use('/api/audit-logs', require('./routes/auditRoutes'));
app.use('/api/tenants', tenantRoutes);
app.use('/api/holidays', require('./routes/holidayRoutes'));
app.use('/api/shifts', require('./routes/shiftRoutes'));
app.use('/api/email-templates', emailTemplateRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/mobile-config', mobileConfigRoutes);
app.use('/api/cms', require('./routes/cmsRoutes'));
app.use('/api/blog', require('./routes/blogRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/website', require('./routes/websiteRoutes'));
app.use('/api/website-settings', require('./routes/websiteSettingsRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/webhooks/biometrics', express.text({ type: '*/*' }), require('./routes/biometricRoutes'));
app.use('/api/support', supportRoutes);
app.use('/api/email-queue', require('./routes/emailQueueRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/razorpay', require('./routes/paymentRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));



setupSocketHandlers(io, connectedUsers);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;
const autoMigrate = require('./config/autoMigrate');

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, async () => {
    console.log('');
    console.log('🚀 ============================================');
    console.log(`   HRMS Pro Server Running`);
    console.log('   ============================================');
    console.log(`   📍 Server: http://localhost:${PORT}`);
    console.log(`   🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   📊 Database: PostgreSQL`);
    console.log(`   💬 WebSocket: Enabled`);
    console.log('   ============================================');
    console.log('');

    await autoMigrate();
    emailQueueService.startWorker();
  });

  // Handle server startup errors (like EADDRINUSE)
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ FATAL ERROR: Port ${PORT} is already in use.`);
      console.error('   Please kill the process holding the port or use a different PORT.');
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
    }
  });
}

// Graceful shutdown function
const shutdown = (signal) => {
  console.log(`\n[${signal}] signal received: closing HTTP server`);
  server.close(() => {
    console.log('HTTP server closed');
    pool.end(() => {
      console.log('Database pool closed');
      process.exit(0);
    });
  });
};

// Handle termination signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = { app, io };
