const { query } = require('../config/database');

const recordLog = async (userId, action, entityType, entityId, details, req) => {
    try {
        const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];

        await query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress, userAgent]
        );
    } catch (error) {
        console.error('Error recording audit log:', error);
        // Don't throw error to prevent blocking the main request
    }
};

const logAction = (action, entityType) => {
    return async (req, res, next) => {
        // Capture the original send function to intercept the response
        const originalSend = res.json;

        res.json = function (data) {
            // Restore original send
            res.json = originalSend;

            // Call original send
            const result = originalSend.call(this, data);

            // Log after response is sent
            if (res.statusCode >= 200 && res.statusCode < 300) {
                const userId = req.user ? req.user.userId : null;

                // Try to determine entity ID from response or request
                let entityId = null;
                if (data && (data.id || data.employee_id || data.asset_id || data.user_id)) {
                    entityId = data.id || data.employee_id || data.asset_id || data.user_id;
                } else if (req.params.id) {
                    entityId = req.params.id;
                }

                // For login, user ID might be in the response data
                const finalUserId = userId || (data && data.data && data.data.user ? data.data.user.user_id : null);

                if (finalUserId) {
                    recordLog(finalUserId, action, entityType, entityId, {
                        method: req.method,
                        url: req.originalUrl,
                        body: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : undefined
                    }, req);
                }
            }

            return result;
        };

        next();
    };
};

module.exports = {
    recordLog,
    logAction
};
