const { query } = require('../config/database');

const getAllAssets = async (req, res) => {
    try {
        const { status, type, search } = req.query;
        let queryText = `
      SELECT a.*, e.first_name, e.last_name, d.department_name 
      FROM assets a 
      LEFT JOIN employees e ON a.assigned_to = e.employee_id
      LEFT JOIN departments d ON a.department_id = d.department_id
      WHERE 1=1
    `;
        const params = [];
        let paramCount = 1;

        if (status) {
            queryText += ` AND a.status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (type) {
            queryText += ` AND a.type = $${paramCount}`;
            params.push(type);
            paramCount++;
        }

        if (search) {
            queryText += ` AND (a.name ILIKE $${paramCount} OR a.serial_number ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        queryText += ` ORDER BY a.created_at DESC`;

        const result = await query(queryText, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching assets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const createAsset = async (req, res) => {
    try {
        const { name, type, serial_number, status, purchase_date, cost, vendor, notes, department_id } = req.body;

        // Check for duplicate serial number
        if (serial_number) {
            const existing = await query('SELECT * FROM assets WHERE serial_number = $1', [serial_number]);
            if (existing.rows.length > 0) {
                return res.status(400).json({ error: 'Asset with this serial number already exists' });
            }
        }

        const result = await query(
            `INSERT INTO assets (name, type, serial_number, status, purchase_date, cost, vendor, notes, department_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
            [name, type, serial_number, status || 'Available', purchase_date, cost, vendor, notes, department_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating asset:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updateAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, serial_number, status, assigned_to, purchase_date, cost, vendor, notes, department_id } = req.body;

        const result = await query(
            `UPDATE assets 
       SET name = $1, type = $2, serial_number = $3, status = $4, assigned_to = $5, 
           purchase_date = $6, cost = $7, vendor = $8, notes = $9, department_id = $10, updated_at = CURRENT_TIMESTAMP
       WHERE asset_id = $11
       RETURNING *`,
            [name, type, serial_number, status, assigned_to, purchase_date, cost, vendor, notes, department_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating asset:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const deleteAsset = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await query('DELETE FROM assets WHERE asset_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        res.json({ message: 'Asset deleted successfully' });
    } catch (error) {
        console.error('Error deleting asset:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const assignAsset = async (req, res) => {
    try {
        const { asset_id, employee_id } = req.body;

        // Verify asset exists
        const assetCheck = await query('SELECT * FROM assets WHERE asset_id = $1', [asset_id]);
        if (assetCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Asset not found' });
        }

        // Verify employee exists (if assigning)
        if (employee_id) {
            const employeeCheck = await query('SELECT * FROM employees WHERE employee_id = $1', [employee_id]);
            if (employeeCheck.rows.length === 0) {
                return res.status(404).json({ error: 'Employee not found' });
            }
        }

        const result = await query(
            `UPDATE assets 
       SET assigned_to = $1, status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE asset_id = $3
       RETURNING *`,
            [employee_id, employee_id ? 'Assigned' : 'Available', asset_id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error assigning asset:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = {
    getAllAssets,
    createAsset,
    updateAsset,
    deleteAsset,
    assignAsset
};
