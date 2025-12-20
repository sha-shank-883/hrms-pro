-- Live Deployment Preparation Script
-- This script safely adds missing columns and tables for recent features.
-- Run this on your live database.

-- 1. Onboarding & Offboarding Support
-- Add 'category' to tasks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='category') THEN
        ALTER TABLE tasks ADD COLUMN category VARCHAR(50) DEFAULT 'general';
    END IF;
END $$;

-- 2. Two-Factor Authentication & Security
-- Add 2FA columns to users table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='two_factor_secret') THEN
        ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_two_factor_enabled') THEN
        ALTER TABLE users ADD COLUMN is_two_factor_enabled BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token') THEN
        ALTER TABLE users ADD COLUMN reset_token VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token_expiry') THEN
        ALTER TABLE users ADD COLUMN reset_token_expiry TIMESTAMP;
    END IF;
END $$;

-- 3. Performance Management Module
-- Create tables if they don't exist

CREATE TABLE IF NOT EXISTS performance_cycles (
    cycle_id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goals (
    goal_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_reviews (
    review_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    reviewer_id INTEGER REFERENCES employees(employee_id),
    cycle_id INTEGER REFERENCES performance_cycles(cycle_id),
    status VARCHAR(20) DEFAULT 'scheduled',
    self_rating DECIMAL(3,1),
    manager_rating DECIMAL(3,1),
    final_rating DECIMAL(3,1),
    self_comments TEXT,
    manager_comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Churn Risk / Reports
-- No persistent table needed, calculated on-fly.

-- 5. Shared Tenants for SaaS
-- Ensure shared schema exists (for multi-tenancy)
CREATE SCHEMA IF NOT EXISTS shared;
CREATE TABLE IF NOT EXISTS shared.tenants (
    tenant_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Ensure default tenant exists
INSERT INTO shared.tenants (tenant_id, name, status) 
VALUES ('default', 'Default Company', 'active')
ON CONFLICT (tenant_id) DO NOTHING;

-- End of Script
