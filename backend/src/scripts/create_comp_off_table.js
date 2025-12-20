const { query } = require('../config/database');

const createCompOffRequestTable = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS leave_comp_off_requests (
                request_id SERIAL PRIMARY KEY,
                employee_id INTEGER REFERENCES employees(employee_id),
                worked_date DATE NOT NULL,
                reason TEXT,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                expiry_date DATE,
                approved_by INTEGER REFERENCES employees(employee_id),
                approved_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log("Created table 'leave_comp_off_requests'");
    } catch (err) {
        console.error("Error creating table:", err);
    }
};

createCompOffRequestTable();
