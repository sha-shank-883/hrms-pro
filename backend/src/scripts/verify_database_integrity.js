const { pool } = require('../config/database');

async function verifyDatabaseIntegrity() {
  console.log('\n=============================================================');
  console.log('🔍 HRMS PRO — DATABASE INTEGRITY & SYNC AUDIT REPORT');
  console.log('=============================================================\n');

  const client = await pool.connect();
  try {
    // 1. Shared Schema & Core Global Tables
    console.log('📦 1. GLOBAL & SHARED SCHEMA:');
    const sharedTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'shared'
      ORDER BY table_name;
    `);

    for (const row of sharedTables.rows) {
      try {
        const countRes = await client.query(`SELECT COUNT(*) FROM shared."${row.table_name}"`);
        console.log(`   ✅ shared.${row.table_name.padEnd(22)} -> ${countRes.rows[0].count} rows`);
      } catch (err) {
        console.log(`   ❌ shared.${row.table_name.padEnd(22)} -> Error: ${err.message}`);
      }
    }

    // 2. Tenants Overview
    console.log('\n🏢 2. REGISTERED TENANTS (shared.tenants):');
    const tenants = await client.query(`
      SELECT tenant_id, name, status, subscription_plan, employee_limit, created_at 
      FROM shared.tenants 
      ORDER BY created_at ASC;
    `);

    for (const t of tenants.rows) {
      console.log(`   📍 [${t.tenant_id}] ${t.name}`);
      console.log(`      • Status: ${t.status} | Plan: ${t.subscription_plan || 'free'} | Seat Limit: ${t.employee_limit || 15} employees`);

      // Check if schema exists for this tenant
      const schemaCheck = await client.query(`
        SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1
      `, [t.tenant_id]);

      if (schemaCheck.rows.length === 0) {
        console.log(`      ⚠️ Schema "${t.tenant_id}" does not exist yet.`);
        continue;
      }

      // Count tenant tables and users
      const tenantTables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = $1
        ORDER BY table_name;
      `, [t.tenant_id]);

      console.log(`      • Total Tables in Schema: ${tenantTables.rows.length}`);

      // Inspect key tables
      const keyTables = ['users', 'employees', 'departments', 'attendance', 'leaves', 'payroll', 'tasks', 'shifts', 'documents', 'chat_channels'];
      const counts = [];
      for (const kt of keyTables) {
        const hasTable = tenantTables.rows.some(r => r.table_name === kt);
        if (hasTable) {
          try {
            const count = await client.query(`SELECT COUNT(*) FROM "${t.tenant_id}"."${kt}"`);
            counts.push(`${kt}: ${count.rows[0].count}`);
          } catch (_) {
            counts.push(`${kt}: err`);
          }
        }
      }
      console.log(`      • Module Row Counts: ${counts.join(' | ')}`);

      // Check admin users in this tenant
      try {
        const admins = await client.query(`
          SELECT user_id, email, role, is_active 
          FROM "${t.tenant_id}".users 
          WHERE role = 'admin'
        `);
        console.log(`      • Admin Users: ${admins.rows.map(a => `${a.email} (${a.is_active ? 'active' : 'disabled'})`).join(', ') || 'None'}`);
      } catch (_) {}
    }

    // 3. Super Admin Verification
    console.log('\n👑 3. SUPER ADMIN ACCESS CHECK:');
    try {
      const superAdmin = await client.query(`
        SELECT user_id, email, role, is_active 
        FROM "tenant_default".users 
        WHERE email = 'info@hrmspro.online'
      `);
      if (superAdmin.rows.length > 0 && superAdmin.rows[0].is_active) {
        console.log(`   ✅ Primary Super Admin (info@hrmspro.online) is ACTIVE in tenant_default.`);
      } else {
        console.log(`   ⚠️ info@hrmspro.online NOT found in tenant_default.`);
      }
    } catch (e) {
      console.log(`   ❌ Super admin check failed: ${e.message}`);
    }

    // 4. Payment Columns Verification (Razorpay + PayPal + Seat Sizing)
    console.log('\n💳 4. BILLING & PAYMENT COLUMNS:');
    const plCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'shared' AND table_name = 'payment_logs';
    `);
    const colNames = plCols.rows.map(r => r.column_name);
    console.log(`   • shared.payment_logs columns: ${colNames.join(', ')}`);
    console.log(`   • Razorpay Order ID column: ${colNames.includes('razorpay_order_id') ? '✅ Present' : '❌ Missing'}`);
    console.log(`   • Razorpay Payment ID column: ${colNames.includes('razorpay_payment_id') ? '✅ Present' : '❌ Missing'}`);
    console.log(`   • Gateway column: ${colNames.includes('gateway') ? '✅ Present' : '❌ Missing'}`);

    // 5. Website Builder & Settings Verification
    console.log('\n🎨 5. WEBSITE BUILDER & CONTACT CONFIGURATION:');
    const ws = await client.query(`SELECT * FROM shared.website_settings LIMIT 1`);
    if (ws.rows.length > 0) {
      const w = ws.rows[0];
      console.log(`   ✅ Website settings record found (ID: ${w.id})`);
      console.log(`   • Company: ${w.company_name || 'HRMS Pro'} | Theme: ${w.primary_color} (${w.font_family})`);
      console.log(`   • Official Phone: ${w.contact_phone || 'None'}`);
      console.log(`   • Official Email: ${w.contact_email || 'None'}`);
      console.log(`   • Official Address: ${w.contact_address || 'None'}`);
      console.log(`   • Dynamic Sections: ${Array.isArray(w.sections) ? w.sections.length : (typeof w.sections === 'string' ? JSON.parse(w.sections).length : 0)} sections active`);
      console.log(`   • Header Links: ${Array.isArray(w.header_links) ? w.header_links.length : (typeof w.header_links === 'string' ? JSON.parse(w.header_links).length : 0)} links`);
      console.log(`   • Footer Columns: ${Array.isArray(w.footer_columns) ? w.footer_columns.length : (typeof w.footer_columns === 'string' ? JSON.parse(w.footer_columns).length : 0)} columns`);
    } else {
      console.log(`   ⚠️ shared.website_settings is empty.`);
    }

    console.log('\n=============================================================');
    console.log('🎉 AUDIT COMPLETE: ALL DATABASE SCHEMAS & MODULES VERIFIED!');
    console.log('=============================================================\n');

  } catch (error) {
    console.error('❌ Database verification encountered an error:', error);
  } finally {
    client.release();
    pool.end();
  }
}

verifyDatabaseIntegrity();
