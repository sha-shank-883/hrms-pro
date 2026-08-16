-- Shared Schema for Multi-Tenancy
-- This schema holds global data like the list of tenants

CREATE SCHEMA IF NOT EXISTS shared;

CREATE TABLE IF NOT EXISTS shared.tenants (
    tenant_id VARCHAR(50) PRIMARY KEY, -- e.g., 'company_a'
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255), -- for subdomain routing if needed
    status VARCHAR(50) DEFAULT 'active',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_expiry TIMESTAMP,
    custom_modules JSONB DEFAULT NULL,
    employee_limit INTEGER DEFAULT 15,
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    billing_address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    tax_id VARCHAR(100),
    billing_currency VARCHAR(10) DEFAULT 'INR',
    billing_cycle VARCHAR(20) DEFAULT 'monthly',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared.payment_logs (
    id SERIAL PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES shared.tenants(tenant_id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL,
    amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    gateway VARCHAR(50) NOT NULL DEFAULT 'manual', -- 'razorpay', 'paypal', 'manual_wire', 'manual_cash'
    transaction_id VARCHAR(255),
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    paypal_order_id VARCHAR(255),
    invoice_number VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'completed', -- 'completed', 'pending', 'failed', 'refunded'
    notes TEXT,
    billing_period_start TIMESTAMP,
    billing_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared.plan_configs (
    plan_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price_inr NUMERIC(10,2) DEFAULT 0,
    price_usd NUMERIC(10,2) DEFAULT 0,
    employee_limit INTEGER DEFAULT 15,
    modules JSONB NOT NULL DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shared.super_admins (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) DEFAULT 'Super Admin',
    two_factor_secret VARCHAR(255),
    is_2fa_enabled BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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

-- Insert default tenant for migration/testing
INSERT INTO shared.tenants (tenant_id, name, status) 
VALUES ('tenant_default', 'Default Company', 'active')
ON CONFLICT (tenant_id) DO NOTHING;


