const { pool } = require('../config/database');

const upgradePayrollSchema = async (schema = 'public') => {
    try {
        console.log(`Upgrading payroll schema: ${schema}...`);

        // Payroll runs (header for batch payroll processing)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ${schema}.payroll_runs (
                run_id SERIAL PRIMARY KEY,
                period_month INTEGER NOT NULL,
                period_year INTEGER NOT NULL,
                status VARCHAR(50) DEFAULT 'draft',
                total_employees INTEGER DEFAULT 0,
                total_gross DECIMAL(15, 2) DEFAULT 0,
                total_deductions DECIMAL(15, 2) DEFAULT 0,
                total_net DECIMAL(15, 2) DEFAULT 0,
                generated_by INTEGER REFERENCES public.users(user_id),
                finalized_at TIMESTAMP,
                paid_at TIMESTAMP,
                notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(period_month, period_year)
            )
        `);

        // Individual payslips (linking payroll_runs to employees)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ${schema}.payslips (
                payslip_id SERIAL PRIMARY KEY,
                run_id INTEGER REFERENCES ${schema}.payroll_runs(run_id) ON DELETE CASCADE,
                employee_id INTEGER REFERENCES ${schema}.employees(employee_id) ON DELETE CASCADE,
                payroll_record_id INTEGER REFERENCES ${schema}.payroll(payroll_id) ON DELETE SET NULL,
                basic_salary DECIMAL(15, 2) NOT NULL,
                gross_pay DECIMAL(15, 2) NOT NULL,
                total_deductions DECIMAL(15, 2) NOT NULL,
                net_pay DECIMAL(15, 2) NOT NULL,
                payment_status VARCHAR(50) DEFAULT 'pending',
                payment_date DATE,
                payment_method VARCHAR(50),
                pdf_path VARCHAR(500),
                qr_code VARCHAR(255),
                verified BOOLEAN DEFAULT FALSE,
                notes TEXT,
                generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(run_id, employee_id)
            )
        `);

        // Itemized earnings for each payslip
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ${schema}.payslip_earnings (
                earning_id SERIAL PRIMARY KEY,
                payslip_id INTEGER REFERENCES ${schema}.payslips(payslip_id) ON DELETE CASCADE,
                component_name VARCHAR(100) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                is_taxable BOOLEAN DEFAULT TRUE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Itemized deductions for each payslip
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ${schema}.payslip_deductions (
                deduction_id SERIAL PRIMARY KEY,
                payslip_id INTEGER REFERENCES ${schema}.payslips(payslip_id) ON DELETE CASCADE,
                component_name VARCHAR(100) NOT NULL,
                amount DECIMAL(15, 2) NOT NULL,
                is_mandatory BOOLEAN DEFAULT TRUE,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Configurable payslip templates (JSON-based layout)
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ${schema}.payslip_templates (
                template_id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                layout_json JSONB NOT NULL DEFAULT '{}',
                is_default BOOLEAN DEFAULT FALSE,
                is_active BOOLEAN DEFAULT TRUE,
                created_by INTEGER REFERENCES public.users(user_id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Email queue for payslip delivery
        await pool.query(`
            CREATE TABLE IF NOT EXISTS ${schema}.email_queue (
                queue_id SERIAL PRIMARY KEY,
                payslip_id INTEGER REFERENCES ${schema}.payslips(payslip_id) ON DELETE CASCADE,
                recipient_email VARCHAR(255) NOT NULL,
                recipient_name VARCHAR(255),
                subject VARCHAR(500),
                status VARCHAR(50) DEFAULT 'pending',
                attempts INTEGER DEFAULT 0,
                max_attempts INTEGER DEFAULT 3,
                last_error TEXT,
                sent_at TIMESTAMP,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Indexes for performance
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_payslips_run ON ${schema}.payslips(run_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_payslips_employee ON ${schema}.payslips(employee_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_payslips_status ON ${schema}.payslips(payment_status)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_payslip_earnings_payslip ON ${schema}.payslip_earnings(payslip_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_payslip_deductions_payslip ON ${schema}.payslip_deductions(payslip_id)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_payslip_templates_default ON ${schema}.payslip_templates(is_default)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_email_queue_status ON ${schema}.email_queue(status)`);
        await pool.query(`CREATE INDEX IF NOT EXISTS idx_payroll_runs_period ON ${schema}.payroll_runs(period_year, period_month)`);

        console.log(`  ${schema} done`);
    } catch (err) {
        console.error(`Error upgrading payroll schema in ${schema}:`, err);
    }
};

(async () => {
    const schemas = ['public'];
    const result = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant\\_%'");
    for (const row of result.rows) {
        schemas.push(row.schema_name);
    }
    for (const s of schemas) await upgradePayrollSchema(s);
    console.log('Payroll schema upgrade complete');
    process.exit(0);
})();
