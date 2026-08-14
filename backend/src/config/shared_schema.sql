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

-- Insert default tenant for migration/testing
INSERT INTO shared.tenants (tenant_id, name, status) 
VALUES ('tenant_default', 'Default Company', 'active')
ON CONFLICT (tenant_id) DO NOTHING;


