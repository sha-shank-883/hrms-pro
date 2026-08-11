const { tenantStorage } = require('../config/database');
const Tenant = require('../models/tenantModel');

// Simple in-memory tenant cache (TTL: 5 minutes)
const tenantCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

const getTenantFromCache = (tenantId) => {
  const entry = tenantCache.get(tenantId);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.tenant;
  }
  return null;
};

const setTenantCache = (tenantId, tenant) => {
  tenantCache.set(tenantId, { tenant, timestamp: Date.now() });
};

const tenantMiddleware = async (req, res, next) => {
    const tenantId = req.headers['x-tenant-id'];

  // Public paths that do not require a tenant ID explicitly
  const publicPaths = [
    '/api/leads/demo',
    '/api/leads/lead-magnet',
    '/api/leads/contact',
    '/api/website-settings',
    '/api/website',
    '/api/cms',
    '/api/blog',
    '/api/setup-db',
    '/api/webhooks/biometrics',
    '/api/resources'
  ];
  const isPublic = publicPaths.some(p => req.originalUrl.startsWith(p));

    if (!tenantId) {
        if (isPublic) {
            return tenantStorage.run('tenant_default', () => {
                next();
            });
        }
        return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    try {
        // Check cache first to avoid DB hit on every request
        let tenant = getTenantFromCache(tenantId);

        if (!tenant) {
            tenant = await Tenant.findById(tenantId);

            if (!tenant) {
                return res.status(404).json({ error: 'Tenant not found' });
            }

            setTenantCache(tenantId, tenant);
        }

        if (tenant.status !== 'active') {
            return res.status(403).json({
                error: 'Tenant is inactive. Please contact support.',
                code: 'TENANT_INACTIVE'
            });
        }

        tenantStorage.run(tenantId, () => {
            req.tenant = tenant;
            next();
        });
    } catch (error) {
        console.error('Tenant middleware error:', error);

        try {
            const fs = require('fs');
            const path = require('path');
            const logPath = path.join(__dirname, '../../middleware_error.log');
            const logMessage = `[${new Date().toISOString()}] ${error.message}\n${error.stack}\n\n`;
            fs.appendFileSync(logPath, logMessage);
        } catch (e) {
            console.error('Failed to write log:', e);
        }

        res.status(500).json({ error: 'Internal server error during tenant resolution' });
    }
};

module.exports = tenantMiddleware;
