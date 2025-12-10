const { query } = require('../config/database');

const Tenant = {
    // Find tenant by ID
    findById: async (tenantId) => {
        // Explicitly query the shared schema
        const text = 'SELECT * FROM shared.tenants WHERE tenant_id = $1';
        const result = await query(text, [tenantId]);
        return result.rows[0];
    },

    // Create a new tenant
    create: async (tenantId, name) => {
        const text = `
      INSERT INTO shared.tenants (tenant_id, name)
      VALUES ($1, $2)
      RETURNING *
    `;
        const result = await query(text, [tenantId, name]);
        return result.rows[0];
    },

    // List all tenants
    findAll: async () => {
        const text = 'SELECT * FROM shared.tenants ORDER BY created_at DESC';
        const result = await query(text);
        return result.rows;
    },

    // Update tenant
    update: async (tenantId, updates) => {
        const fields = Object.keys(updates);
        const values = Object.values(updates);

        if (fields.length === 0) return null;

        const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
        const text = `UPDATE shared.tenants SET ${setClause} WHERE tenant_id = $1 RETURNING *`;

        const result = await query(text, [tenantId, ...values]);
        return result.rows[0];
    }
};

module.exports = Tenant;
