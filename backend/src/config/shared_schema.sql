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

