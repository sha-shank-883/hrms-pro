require('dotenv').config();
const { pool } = require('../config/database');
const { getPaymentHistory, getLastSubscription, processRefund, requestRefund } = require('../controllers/paymentManagementController');

async function runRefundAndHistoryTests() {
  console.log('=== Starting Payment History, Last Subscription, and Refund Tests ===\n');

  const testTenantId = `tenant_rfnd_${Date.now().toString().slice(-4)}`;

  // 1. Setup tenant with initial scale plan
  await pool.query(
    `INSERT INTO shared.tenants (tenant_id, name, status, subscription_plan, employee_limit, billing_cycle, auto_renew, subscription_expiry)
     VALUES ($1, 'Refund Test Org', 'active', 'scale', 25, 'yearly', true, NOW() + INTERVAL '365 days')`,
    [testTenantId]
  );

  // 2. Insert a completed test payment log
  const logInsert = await pool.query(
    `INSERT INTO shared.payment_logs
       (tenant_id, plan_id, amount, currency, razorpay_order_id, razorpay_payment_id, gateway, status, seats_purchased, is_addon, billing_cycle, invoice_number)
     VALUES ($1, 'scale_25_seats_yearly', 76704, 'INR', 'order_tst_123', 'pay_tst_123', 'razorpay', 'completed', 25, false, 'yearly', 'INV-TEST-001')
     RETURNING *`,
    [testTenantId]
  );

  const paymentLog = logInsert.rows[0];
  console.log(`1. Created completed test payment log #${paymentLog.id} (INR 76,704).`);

  // 3. Test getPaymentHistory
  console.log('\n2. Testing getPaymentHistory for tenant...');
  let historyOutput = null;
  const historyReq = {
    user: { role: 'admin' },
    tenant: { tenant_id: testTenantId },
    query: {}
  };
  const historyRes = {
    json: (d) => { historyOutput = d; return historyRes; }
  };
  await getPaymentHistory(historyReq, historyRes, (err) => { if (err) throw err; });
  
  if (!historyOutput.success || historyOutput.data.length === 0) {
    throw new Error('❌ Failed to fetch payment history');
  }
  console.log(`✅ Fetched ${historyOutput.data.length} history records. Invoice #${historyOutput.data[0].invoiceNumber}`);

  // 4. Test getLastSubscription
  console.log('\n3. Testing getLastSubscription...');
  let lastSubOutput = null;
  const lastSubReq = {
    tenant: { tenant_id: testTenantId },
    query: {}
  };
  const lastSubRes = {
    json: (d) => { lastSubOutput = d; return lastSubRes; }
  };
  await getLastSubscription(lastSubReq, lastSubRes, (err) => { if (err) throw err; });

  if (!lastSubOutput.success || lastSubOutput.data.plan !== 'scale' || !lastSubOutput.data.lastPayment) {
    throw new Error('❌ Failed to get last subscription details');
  }
  console.log(`✅ Last Subscription resolved: ${lastSubOutput.data.plan} plan, ${lastSubOutput.data.daysRemaining} days remaining, last payment ${lastSubOutput.data.lastPayment.amount} ${lastSubOutput.data.lastPayment.currency}.`);

  // 5. Test requestRefund (Tenant Admin)
  console.log('\n4. Testing requestRefund from Tenant Admin...');
  let reqRefundOutput = null;
  const reqRefundReq = {
    tenant: { tenant_id: testTenantId },
    body: {
      paymentLogId: paymentLog.id,
      reason: 'Accidentally bought extra seats'
    }
  };
  const reqRefundRes = {
    json: (d) => { reqRefundOutput = d; return reqRefundRes; }
  };
  await requestRefund(reqRefundReq, reqRefundRes, (err) => { if (err) throw err; });
  console.log(`✅ Refund requested. Response: "${reqRefundOutput.message}"`);

  // Verify status in DB
  const checkReq = await pool.query('SELECT refund_status, refund_reason FROM shared.payment_logs WHERE id = $1', [paymentLog.id]);
  if (checkReq.rows[0].refund_status !== 'refund_requested') {
    throw new Error('❌ Refund status not updated to refund_requested');
  }
  console.log('✅ Verified DB status = refund_requested.');

  // 6. Test processRefund (Super Admin)
  console.log('\n5. Testing processRefund (Super Admin full refund & rollback)...');
  let processRefundOutput = null;
  const processRefundReq = {
    user: { role: 'super-admin', email: 'superadmin@hrmspro.online' },
    ip: '127.0.0.1',
    body: {
      paymentLogId: paymentLog.id,
      amount: 76704,
      reason: 'Approved customer cancellation',
      adjustPlan: true
    }
  };
  const processRefundRes = {
    json: (d) => { processRefundOutput = d; return processRefundRes; }
  };
  await processRefund(processRefundReq, processRefundRes, (err) => { if (err) throw err; });
  console.log(`✅ Refund processed. Refund ID: ${processRefundOutput.data.refundId}`);

  // Verify tenant was safely reverted
  const checkTenant = await pool.query('SELECT subscription_plan, employee_limit FROM shared.tenants WHERE tenant_id = $1', [testTenantId]);
  console.log(`Tenant plan after full refund: ${checkTenant.rows[0].subscription_plan} (Expected: free), seats: ${checkTenant.rows[0].employee_limit}`);
  if (checkTenant.rows[0].subscription_plan !== 'free') {
    throw new Error('❌ Tenant plan was not reverted to free');
  }
  console.log('✅ Plan rollback verified.');

  // Cleanup test tenant
  await pool.query(`DELETE FROM shared.payment_logs WHERE tenant_id = $1`, [testTenantId]);
  await pool.query(`DELETE FROM shared.platform_audit_logs WHERE target_tenant_id = $1`, [testTenantId]);
  await pool.query(`DELETE FROM shared.tenants WHERE tenant_id = $1`, [testTenantId]);

  console.log('\n=== ALL PAYMENT HISTORY & REFUND TESTS PASSED 100% ===');
  process.exit(0);
}

runRefundAndHistoryTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
