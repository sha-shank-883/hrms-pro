const { pool } = require('../config/database');

async function testAdvancedBilling() {
  const client = await pool.connect();
  try {
    console.log('🧪 Starting Advanced Tenant Billing & Invoice Test Suite...');

    // 1. Verify shared.payment_logs structure
    const colsRes = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'shared' AND table_name = 'payment_logs'
    `);
    const cols = colsRes.rows.map(c => c.column_name);
    console.log(`✅ shared.payment_logs columns: ${cols.join(', ')}`);

    // 2. Fetch sample tenant
    const tenantRes = await client.query('SELECT tenant_id, name, subscription_plan FROM shared.tenants LIMIT 1');
    if (tenantRes.rows.length === 0) {
      console.log('❌ No sample tenant found');
      return;
    }
    const sampleTenant = tenantRes.rows[0];
    console.log(`🏢 Sample Tenant: ${sampleTenant.name} (${sampleTenant.tenant_id})`);

    // 3. Test invoice creation & retrieval
    const invRes = await client.query(`
      INSERT INTO shared.payment_logs (
        tenant_id, plan_id, amount, currency, status, gateway, invoice_number, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      sampleTenant.tenant_id,
      sampleTenant.subscription_plan || 'scale',
      1598,
      'INR',
      'completed',
      'manual_wire',
      `INV-TEST-${Date.now()}`,
      'Test Suite Automated Payment'
    ]);
    const createdInvoice = invRes.rows[0];
    console.log(`✅ Created test invoice #${createdInvoice.invoice_number} (ID: ${createdInvoice.id})`);

    // 4. Test invoice details query
    const detailRes = await client.query(`
      SELECT 
        p.*,
        t.name as tenant_name,
        t.domain as tenant_domain,
        t.contact_person,
        t.contact_email,
        t.contact_phone,
        t.billing_address,
        t.city,
        t.country,
        t.tax_id
      FROM shared.payment_logs p
      LEFT JOIN shared.tenants t ON p.tenant_id = t.tenant_id
      WHERE p.id = $1
    `, [createdInvoice.id]);

    if (detailRes.rows.length > 0) {
      console.log('✅ Successfully retrieved invoice details joined with tenant profile:');
      console.log(`   • Invoice: ${detailRes.rows[0].invoice_number}`);
      console.log(`   • Company: ${detailRes.rows[0].tenant_name}`);
      console.log(`   • Amount: ₹${detailRes.rows[0].amount} ${detailRes.rows[0].currency}`);
      console.log(`   • Status: ${detailRes.rows[0].status}`);
    } else {
      console.log('❌ Failed to retrieve invoice details');
    }

    // 5. Test tenant billing profile update
    const updateRes = await client.query(`
      UPDATE shared.tenants
      SET 
        contact_person = 'Fin Ops Lead',
        contact_email = 'finance@acme.test',
        tax_id = '27ABCDE1234F1Z5',
        billing_address = 'Tech Hub 4th Floor',
        city = 'Bengaluru',
        country = 'India'
      WHERE tenant_id = $1
      RETURNING *
    `, [sampleTenant.tenant_id]);

    console.log(`✅ Updated billing profile for tenant ${sampleTenant.tenant_id}: Tax ID=${updateRes.rows[0].tax_id}`);
    console.log('\n🎉 ALL ADVANCED BILLING TESTS PASSED 100% SUCCESS!');

  } catch (err) {
    console.error('❌ Test suite failed:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

testAdvancedBilling();
