const { query } = require('../config/database');

const createTaxDeclarationTable = async () => {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS tax_declarations (
                declaration_id SERIAL PRIMARY KEY,
                employee_id INTEGER REFERENCES employees(employee_id),
                financial_year VARCHAR(20) NOT NULL,
                regime VARCHAR(10) CHECK (regime IN ('old', 'new')),
                section_80c DECIMAL(10, 2) DEFAULT 0,
                section_80d DECIMAL(10, 2) DEFAULT 0,
                hra DECIMAL(10, 2) DEFAULT 0,
                lta DECIMAL(10, 2) DEFAULT 0,
                other_deductions DECIMAL(10, 2) DEFAULT 0,
                status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
                admin_comments TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(employee_id, financial_year)
            );
        `);
        console.log("Created table 'tax_declarations'");
    } catch (err) {
        console.error("Error creating tax_declarations table:", err);
    }
};

createTaxDeclarationTable();
