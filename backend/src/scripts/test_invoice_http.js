const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testInvoiceHttp() {
  try {
    const superAdminToken = jwt.sign(
      { id: 1, email: 'info@hrmspro.online', role: 'super_admin', isSuperAdmin: true },
      process.env.JWT_SECRET || 'your-secret-key-hrms-pro',
      { expiresIn: '1h' }
    );

    const res = await axios.get('http://localhost:5001/api/tenants/invoice/2', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    console.log('✅ GET /api/tenants/invoice/2 status:', res.status);
    console.log('✅ Invoice Details returned:');
    console.log('   • ID:', res.data.invoice.id);
    console.log('   • Invoice #:', res.data.invoice.invoice_number);
    console.log('   • Company:', res.data.invoice.tenant_name);
    console.log('   • Vendor Tax ID:', res.data.invoice.vendor.tax_id);
  } catch (err) {
    console.error('❌ Error testing invoice endpoint:', err.response?.status, err.response?.data || err.message);
  }
}

testInvoiceHttp();
