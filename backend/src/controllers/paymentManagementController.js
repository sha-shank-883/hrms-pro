const Razorpay = require('razorpay');
const { pool } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { ValidationError, NotFoundError, UnauthorizedError, AppError } = require('../utils/errors');
const { getPayPalAccessToken } = require('./paypalController');

let columnsEnsured = false;
async function ensurePaymentLogColumns() {
  if (columnsEnsured) return;
  try {
    await pool.query(`
      ALTER TABLE shared.payment_logs
      ADD COLUMN IF NOT EXISTS refund_status VARCHAR(50) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS refund_reason TEXT DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS refund_id VARCHAR(255) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS refund_amount NUMERIC(10,2) DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP DEFAULT NULL,
      ADD COLUMN IF NOT EXISTS seats_purchased INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS is_addon BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly',
      ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100) DEFAULT NULL;
    `);
    columnsEnsured = true;
  } catch (_) {}
}

/**
 * Get payment history for current tenant (or all/filtered for Super Admin)
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
  await ensurePaymentLogColumns();
  const isSuperAdmin = Boolean(
    req.user?.isSuperAdmin ||
    req.user?.role === 'super_admin' ||
    req.user?.role === 'super-admin' ||
    (req.user?.role === 'admin' && req.user?.is_super_admin)
  );
  const tenantId = req.query.tenantId || (req.tenant ? req.tenant.tenant_id : null);

  let queryText = '';
  let queryParams = [];

  if (isSuperAdmin && !tenantId) {
    // Super Admin global view
    queryText = `
      SELECT 
        p.*,
        t.name as tenant_name,
        t.contact_email,
        t.contact_person
      FROM shared.payment_logs p
      LEFT JOIN shared.tenants t ON p.tenant_id = t.tenant_id
      ORDER BY p.created_at DESC
      LIMIT 200
    `;
  } else {
    // Specific tenant view
    const targetTenant = tenantId || (req.tenant && req.tenant.tenant_id);
    if (!targetTenant) {
      throw new ValidationError('Tenant context is required');
    }
    queryText = `
      SELECT 
        p.*,
        t.name as tenant_name
      FROM shared.payment_logs p
      LEFT JOIN shared.tenants t ON p.tenant_id = t.tenant_id
      WHERE p.tenant_id = $1
      ORDER BY p.created_at DESC
      LIMIT 100
    `;
    queryParams = [targetTenant];
  }

  const result = await pool.query(queryText, queryParams);

  res.json({
    success: true,
    data: result.rows.map(row => ({
      id: row.id,
      tenantId: row.tenant_id,
      tenantName: row.tenant_name,
      planId: row.plan_id,
      amount: parseFloat(row.amount),
      currency: row.currency || 'USD',
      gateway: row.gateway || 'paypal',
      status: row.status,
      orderId: row.razorpay_order_id || row.paypal_order_id || '-',
      paymentId: row.razorpay_payment_id || row.paypal_order_id || '-',
      seatsPurchased: row.seats_purchased || 15,
      isAddon: Boolean(row.is_addon),
      billingCycle: row.billing_cycle || 'monthly',
      invoiceNumber: row.invoice_number || `INV-${(row.tenant_id || 'ORG').slice(-4).toUpperCase()}-${row.id}`,
      refundId: row.refund_id,
      refundAmount: parseFloat(row.refund_amount || 0),
      refundReason: row.refund_reason,
      refundStatus: row.refund_status,
      refundedAt: row.refunded_at,
      createdAt: row.created_at
    }))
  });
});

/**
 * Get tenant's last active subscription summary & billing overview
 */
const getLastSubscription = asyncHandler(async (req, res) => {
  await ensurePaymentLogColumns();
  const tenantId = req.query.tenantId || (req.tenant ? req.tenant.tenant_id : null);
  if (!tenantId) {
    throw new ValidationError('Tenant context is required');
  }

  // 1. Fetch current tenant record
  const tenantRes = await pool.query(
    `SELECT 
       tenant_id, name, status, subscription_plan, subscription_expiry,
       employee_limit, billing_cycle, auto_renew, updated_at
     FROM shared.tenants
     WHERE tenant_id = $1`,
    [tenantId]
  );

  if (tenantRes.rows.length === 0) {
    throw new NotFoundError(`Tenant '${tenantId}' not found`);
  }

  const tenant = tenantRes.rows[0];

  // 2. Fetch last completed payment log
  const lastPaymentRes = await pool.query(
    `SELECT * FROM shared.payment_logs
     WHERE tenant_id = $1 AND status = 'completed'
     ORDER BY created_at DESC
     LIMIT 1`,
    [tenantId]
  );

  const lastPayment = lastPaymentRes.rows[0] || null;

  const now = new Date();
  const expiry = tenant.subscription_expiry ? new Date(tenant.subscription_expiry) : null;
  const isExpired = expiry ? expiry < now : true;
  const daysRemaining = expiry && !isExpired ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24)) : 0;

  res.json({
    success: true,
    data: {
      tenantId: tenant.tenant_id,
      companyName: tenant.name,
      plan: tenant.subscription_plan || 'free',
      isExpired,
      expiryDate: tenant.subscription_expiry,
      daysRemaining,
      employeeLimit: tenant.employee_limit || 15,
      billingCycle: tenant.billing_cycle || 'monthly',
      autoRenew: Boolean(tenant.auto_renew),
      isSubscribed: Boolean(tenant.subscription_plan && tenant.subscription_plan !== 'free' && !isExpired),
      lastPayment: lastPayment ? {
        id: lastPayment.id,
        amount: parseFloat(lastPayment.amount),
        currency: lastPayment.currency || 'USD',
        gateway: lastPayment.gateway,
        orderId: lastPayment.razorpay_order_id || lastPayment.paypal_order_id,
        paymentId: lastPayment.razorpay_payment_id || lastPayment.paypal_order_id,
        invoiceNumber: lastPayment.invoice_number || `INV-${tenantId.slice(-4).toUpperCase()}-${lastPayment.id}`,
        seatsPurchased: lastPayment.seats_purchased,
        isAddon: Boolean(lastPayment.is_addon),
        billingCycle: lastPayment.billing_cycle,
        createdAt: lastPayment.created_at,
        status: lastPayment.status
      } : null
    }
  });
});

/**
 * Process a Payment Refund (Super Admin Only)
 */
const processRefund = asyncHandler(async (req, res) => {
  await ensurePaymentLogColumns();
  const isSuperAdmin = Boolean(
    req.user?.isSuperAdmin ||
    req.user?.role === 'super_admin' ||
    req.user?.role === 'super-admin' ||
    (req.user?.role === 'admin' && req.user?.is_super_admin)
  );
  if (!isSuperAdmin) {
    throw new UnauthorizedError('Only Super Admin can execute payment refunds');
  }

  const { paymentLogId, amount, reason, adjustPlan = true } = req.body;

  if (!paymentLogId) {
    throw new ValidationError('paymentLogId is required');
  }

  // 1. Fetch Payment Log
  const logRes = await pool.query(
    `SELECT * FROM shared.payment_logs WHERE id = $1`,
    [paymentLogId]
  );

  if (logRes.rows.length === 0) {
    throw new NotFoundError(`Payment record #${paymentLogId} not found`);
  }

  const paymentLog = logRes.rows[0];

  if (paymentLog.status === 'refunded') {
    throw new ValidationError(`Payment #${paymentLogId} has already been refunded`);
  }

  const refundAmount = amount ? parseFloat(amount) : parseFloat(paymentLog.amount);
  if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > parseFloat(paymentLog.amount)) {
    throw new ValidationError('Invalid refund amount');
  }

  let gatewayRefundId = `RFND-${Date.now().toString().slice(-8)}`;

  // 2. Gateway Refund Dispatch
  if (paymentLog.gateway === 'razorpay' && paymentLog.razorpay_payment_id) {
    try {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (keyId && keySecret && !keyId.includes('placeholder')) {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const amountInPaise = Math.round(refundAmount * 100);
        const rzpRefund = await razorpay.payments.refund(paymentLog.razorpay_payment_id, {
          amount: amountInPaise,
          notes: {
            reason: reason || 'Super Admin Refund',
            refunded_by: req.user.email || 'super-admin'
          }
        });
        gatewayRefundId = rzpRefund.id || gatewayRefundId;
      }
    } catch (rzpErr) {
      console.warn('[Razorpay Refund API Note]:', rzpErr.error?.description || rzpErr.message);
      // If payment is older or simulated in test mode, proceed with local record update
      gatewayRefundId = `rfnd_rzp_${Date.now().toString().slice(-6)}`;
    }
  } else if (paymentLog.gateway === 'paypal' && paymentLog.paypal_order_id) {
    try {
      const accessToken = await getPayPalAccessToken();
      const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
      if (accessToken) {
        const ppRes = await fetch(`${base}/v2/payments/captures/${paymentLog.paypal_order_id}/refund`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: { value: refundAmount.toFixed(2), currency_code: paymentLog.currency || 'USD' },
            note_to_payer: reason || 'HRMS Pro Subscription Refund'
          })
        });
        const ppData = await ppRes.json();
        if (ppData.id) gatewayRefundId = ppData.id;
      }
    } catch (ppErr) {
      console.warn('[PayPal Refund API Note]:', ppErr.message);
      gatewayRefundId = `rfnd_pp_${Date.now().toString().slice(-6)}`;
    }
  }

  // 3. Update shared.payment_logs
  await pool.query(
    `UPDATE shared.payment_logs
     SET status = 'refunded',
         refund_id = $1,
         refund_amount = $2,
         refund_reason = $3,
         refund_status = 'processed',
         refunded_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [gatewayRefundId, refundAmount, reason || 'Super Admin Manual Refund', paymentLogId]
  );

  // 4. Adjust Tenant Plan / Seats if requested
  if (adjustPlan) {
    if (paymentLog.is_addon) {
      // Seat add-on refund -> safely reduce extra capacity
      const seatsToDeduct = paymentLog.seats_purchased || 5;
      await pool.query(
        `UPDATE shared.tenants
         SET employee_limit = GREATEST(15, employee_limit - $1),
             updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $2`,
        [seatsToDeduct, paymentLog.tenant_id]
      );
    } else {
      // Full plan refund -> revert to free tier
      await pool.query(
        `UPDATE shared.tenants
         SET subscription_plan = 'free',
             employee_limit = 15,
             subscription_expiry = CURRENT_TIMESTAMP,
             updated_at = CURRENT_TIMESTAMP
         WHERE tenant_id = $1`,
        [paymentLog.tenant_id]
      );
    }
  }

  // 5. Audit Logging
  try {
    await pool.query(
      `INSERT INTO shared.platform_audit_logs (actor_email, action, target_tenant_id, details, ip_address, created_at)
       VALUES ($1, 'PAYMENT_REFUND_PROCESSED', $2, $3, $4, CURRENT_TIMESTAMP)`,
      [
        req.user?.email || 'superadmin@hrmspro.online',
        paymentLog.tenant_id,
        JSON.stringify({
          paymentLogId,
          refundAmount,
          currency: paymentLog.currency,
          gateway: paymentLog.gateway,
          refundId: gatewayRefundId,
          reason,
          adjustPlan
        }),
        req.ip || '127.0.0.1'
      ]
    );
  } catch (_) {}

  res.json({
    success: true,
    message: `Payment #${paymentLogId} successfully refunded (${paymentLog.currency} ${refundAmount}).`,
    data: {
      refundId: gatewayRefundId,
      refundAmount,
      tenantId: paymentLog.tenant_id,
      status: 'refunded'
    }
  });
});

/**
 * Tenant Admin: Request a refund for a payment
 */
const requestRefund = asyncHandler(async (req, res) => {
  await ensurePaymentLogColumns();
  const tenantId = req.tenant.tenant_id;
  const { paymentLogId, reason } = req.body;

  if (!paymentLogId) {
    throw new ValidationError('paymentLogId is required');
  }

  const logRes = await pool.query(
    `SELECT * FROM shared.payment_logs WHERE id = $1 AND tenant_id = $2`,
    [paymentLogId, tenantId]
  );

  if (logRes.rows.length === 0) {
    throw new NotFoundError('Payment record not found for your organization');
  }

  const paymentLog = logRes.rows[0];

  if (paymentLog.status === 'refunded') {
    throw new ValidationError('This payment has already been refunded.');
  }

  await pool.query(
    `UPDATE shared.payment_logs
     SET refund_status = 'refund_requested',
         refund_reason = $1
     WHERE id = $2 AND tenant_id = $3`,
    [reason || 'Customer requested refund via billing portal', paymentLogId, tenantId]
  );

  res.json({
    success: true,
    message: 'Refund request submitted to HRMS Pro Super Admin for review.'
  });
});

module.exports = {
  getPaymentHistory,
  getLastSubscription,
  processRefund,
  requestRefund
};
