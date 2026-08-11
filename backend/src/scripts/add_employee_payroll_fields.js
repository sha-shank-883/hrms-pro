const { pool } = require('../config/database');

const addPayrollFields = async (schema) => {
  try {
    console.log(`Adding payroll fields to ${schema}.employees...`);
    const quoted = schema === 'default' ? '"default"' : schema;
    await pool.query(`ALTER TABLE ${quoted}.employees ADD COLUMN IF NOT EXISTS employee_code VARCHAR(50)`);
    await pool.query(`ALTER TABLE ${quoted}.employees ADD COLUMN IF NOT EXISTS pan VARCHAR(20)`);
    await pool.query(`ALTER TABLE ${quoted}.employees ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50)`);
    await pool.query(`ALTER TABLE ${quoted}.employees ADD COLUMN IF NOT EXISTS uan VARCHAR(50)`);
    await pool.query(`ALTER TABLE ${quoted}.employees ADD COLUMN IF NOT EXISTS esic VARCHAR(50)`);
    console.log(`  ${schema} done`);
  } catch (err) {
    console.error(`Error in ${schema}:`, err.message);
  }
};

(async () => {
  const schemas = ['public'];
  const result = await pool.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'tenant\\_%' OR schema_name = 'default'");
  for (const row of result.rows) {
    schemas.push(row.schema_name);
  }
  for (const s of schemas) await addPayrollFields(s);
  console.log('Employee payroll fields migration complete');
  process.exit(0);
})();
