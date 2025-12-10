const { pool, query } = require('../config/database');
const Tenant = require('../models/tenantModel');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const createTenant = async (req, res) => {
    const client = await pool.connect();
    try {
        const { tenantId, name, adminEmail, adminPassword } = req.body;

        if (!tenantId || !name || !adminEmail || !adminPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // 1. Check if tenant already exists
        const existingTenant = await Tenant.findById(tenantId);
        if (existingTenant) {
            return res.status(400).json({ error: 'Tenant ID already exists' });
        }

        // Start transaction
        await client.query('BEGIN');

        // 2. Create Schema
        // Sanitize tenantId to ensure it's safe for SQL identifier (basic check)
        if (!/^[a-z0-9_]+$/.test(tenantId)) {
            throw new Error('Invalid tenant ID format. Use lowercase letters, numbers, and underscores only.');
        }

        await client.query(`CREATE SCHEMA IF NOT EXISTS "${tenantId}"`);

        // 3. Run Tenant Schema Script
        const schemaPath = path.join(__dirname, '../config/tenant_schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Set search path to new tenant schema
        await client.query(`SET search_path TO "${tenantId}"`);

        // Execute schema creation
        await client.query(schemaSql);

        // 4. Create Admin User
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        await client.query(
            `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')`,
            [adminEmail, hashedPassword]
        );

        // 5. Register in Shared Schema
        // We need to switch back to public/shared context or just use fully qualified name
        // Tenant.create uses 'shared.tenants', so it should be fine if we just call it, 
        // but Tenant.create uses the 'query' helper which might use the AsyncLocalStorage tenant.
        // Since we are in a request that might be authenticated as 'default' tenant admin, 
        // the 'query' helper might be pointing to 'default'.
        // However, Tenant.create explicitly writes to 'shared.tenants'.

        // Let's use the client we have for the transaction to be safe and consistent.
        await client.query(
            `INSERT INTO shared.tenants (tenant_id, name, status) VALUES ($1, $2, 'active')`,
            [tenantId, name]
        );

        await client.query('COMMIT');

        res.status(201).json({ message: 'Tenant created successfully', tenantId });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating tenant:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
        client.release();
    }
};

const getAllTenants = async (req, res) => {
    try {
        const tenants = await Tenant.findAll();
        res.json(tenants);
    } catch (error) {
        console.error('Error fetching tenants:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const speakeasy = require('speakeasy');

// ... existing imports

const updateTenant = async (req, res) => {
    const client = await pool.connect();
    try {
        const { tenantId } = req.params;
        const updates = req.body;
        const { adminEmail, ...tenantUpdates } = updates;

        // Prevent updating tenant_id
        delete tenantUpdates.tenantId;
        delete tenantUpdates.tenant_id;

        await client.query('BEGIN');

        // 1. Update shared.tenants details
        if (Object.keys(tenantUpdates).length > 0) {
            const updatedTenant = await Tenant.update(tenantId, tenantUpdates);
            if (!updatedTenant) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Tenant not found' });
            }
        }

        // 2. Update Admin Email if provided
        if (adminEmail) {
            // Switch to tenant schema
            await client.query(`SET search_path TO "${tenantId}"`);

            // Update admin email
            await client.query(
                `UPDATE users SET email = $1 WHERE role = 'admin'`,
                [adminEmail]
            );
        }

        await client.query('COMMIT');
        res.json({ message: 'Tenant updated successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating tenant:', error);
        res.status(500).json({ error: 'Internal server error' });
    } finally {
        client.release();
    }
};

const resetTenantAdminPassword = async (req, res) => {
    const client = await pool.connect();
    try {
        const { tenantId } = req.params;
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // 1. Verify tenant exists
        const tenant = await Tenant.findById(tenantId);
        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        // 2. Switch to tenant schema
        await client.query(`SET search_path TO "${tenantId}"`);

        // 3. Find admin user (assuming role 'admin')
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const result = await client.query(
            `UPDATE users SET password_hash = $1 WHERE role = 'admin' RETURNING email`,
            [hashedPassword]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No admin user found for this tenant' });
        }

        res.json({ message: 'Tenant admin password reset successfully', updatedAdmins: result.rows.map(r => r.email) });

    } catch (error) {
        console.error('Error resetting tenant password:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
        client.release();
    }
};

const deleteTenant = async (req, res) => {
    const client = await pool.connect();
    try {
        const { tenantId } = req.params;
        const userId = req.user.userId; // Super Admin ID

        let twoFactorToken = req.body.twoFactorToken;
        // Also check headers, as DELETE with body is sometimes problematic
        if (!twoFactorToken && req.headers['x-2fa-token']) {
            twoFactorToken = req.headers['x-2fa-token'];
        }

        if (!twoFactorToken) {
            return res.status(400).json({ error: '2FA token is required' });
        }

        // 1. Verify Super Admin 2FA
        // We need to get the secret from the current user (Super Admin)
        // Since we are in the context of 'tenant_default' (enforced by middleware), we can query users table directly?
        // Wait, the connection might be in 'public' or 'tenant_default' depending on previous middleware.
        // The 'authenticateToken' middleware sets req.user but doesn't necessarily set search_path.
        // The 'tenantMiddleware' sets search_path based on header.
        // For Super Admin actions, we expect them to be on 'tenant_default'.

        // Let's explicitly check 'tenant_default' for the user's secret
        await client.query(`SET search_path TO "tenant_default"`);
        const userRes = await client.query('SELECT two_factor_secret FROM users WHERE user_id = $1', [userId]);

        if (userRes.rows.length === 0) {
            return res.status(404).json({ error: 'Super Admin user not found' });
        }

        const { two_factor_secret } = userRes.rows[0];
        if (!two_factor_secret) {
            return res.status(400).json({ error: '2FA is not enabled for Super Admin. Please enable it first.' });
        }

        const verified = speakeasy.totp.verify({
            secret: two_factor_secret,
            encoding: 'base32',
            token: twoFactorToken
        });

        if (!verified) {
            return res.status(401).json({ error: 'Invalid 2FA token' });
        }

        // 2. Proceed with Deletion
        await client.query('BEGIN');

        // Drop Schema
        await client.query(`DROP SCHEMA IF EXISTS "${tenantId}" CASCADE`);

        // Remove from shared.tenants
        // Need to switch back to public/shared context? 
        // shared.tenants is accessible from anywhere if qualified.
        await client.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [tenantId]);

        await client.query('COMMIT');
        res.json({ message: 'Tenant deleted successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting tenant:', error);
        res.status(500).json({ error: error.message || 'Internal server error' });
    } finally {
        client.release();
    }
};

module.exports = { createTenant, getAllTenants, updateTenant, resetTenantAdminPassword, deleteTenant };
