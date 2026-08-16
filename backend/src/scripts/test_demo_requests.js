const { pool, query } = require('../config/database');
const autoMigrate = require('../config/autoMigrate');

async function testDemoRequests() {
  console.log('Testing autoMigrate and demo requests...');
  try {
    await autoMigrate();
    
    // Check table structure
    const cols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'shared' AND table_name = 'demo_requests'
      ORDER BY ordinal_position;
    `);
    console.log('Columns in shared.demo_requests:');
    console.table(cols.rows);

    // Verify insert & query
    const testEmail = `test_${Date.now()}@example.com`;
    const insertRes = await query(`
      INSERT INTO shared.demo_requests (name, email, company_name, phone, status, tenant_id, password_hash)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, company_name, status, tenant_id;
    `, ['Test User', testEmail, 'Test Corp', '9999999999', 'pending', 'tenant_testcorp', 'hashedpass']);
    
    console.log('✅ Inserted demo request:', insertRes.rows[0]);

    // Clean up test record
    await query(`DELETE FROM shared.demo_requests WHERE id = $1`, [insertRes.rows[0].id]);
    console.log('✅ Cleaned up test record.');
    
    console.log('🎉 All demo request database checks passed successfully!');
  } catch (err) {
    console.error('❌ Error during demo request test:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testDemoRequests();
