const { tenantStorage } = require('../config/database');
const Tenant = require('../models/tenantModel');

const tenantMiddleware = async (req, res, next) => {
    const tenantId = req.headers['x-tenant-id'];

    if (!tenantId) {
        return res.status(400).json({ error: 'X-Tenant-ID header is required' });
    }

    try {
        // Validate tenant exists
        // Note: We might want to cache this to avoid DB hit on every request
        const tenant = await Tenant.findById(tenantId);

        if (!tenant) {
            return res.status(404).json({ error: 'Tenant not found' });
        }

        if (tenant.status !== 'active') {
            return res.status(403).json({
                error: 'Tenant is inactive. Please contact support.',
                code: 'TENANT_INACTIVE'
            });
        }

        // Wrap the next() call in the AsyncLocalStorage run context
        // This ensures that any DB queries triggered by next() will have access to this tenantId
        tenantStorage.run(tenantId, () => {
            req.tenant = tenant; // Attach tenant info to request for convenience
            next();
        });
    } catch (error) {
        console.error('Tenant middleware error:', error);
        res.status(500).json({ error: 'Internal server error during tenant resolution' });
    }
};

module.exports = tenantMiddleware;
