-- Shared Schema for Multi-Tenancy
-- This schema holds global data like the list of tenants

CREATE SCHEMA IF NOT EXISTS shared;

CREATE TABLE IF NOT EXISTS shared.tenants (
    tenant_id VARCHAR(50) PRIMARY KEY, -- e.g., 'company_a'
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255), -- for subdomain routing if needed
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default tenant for migration/testing
INSERT INTO shared.tenants (tenant_id, name, status) 
VALUES ('default', 'Default Company', 'active')
ON CONFLICT (tenant_id) DO NOTHING;
