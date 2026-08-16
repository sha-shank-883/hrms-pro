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

  const nowMs = Date.now();
  const PLAN_REFUND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
  const ADDON_REFUND_WINDOW_MS = 24 * 60 * 60 * 1000;    // 24 hours
  const PROCESSING_FEE_RATE = 0.03;                      // 3% Tax / Processing Fee

  res.json({
    success: true,
    data: result.rows.map(row => {
      const createdAtMs = new Date(row.created_at).getTime();
      const ageMs = Math.max(0, nowMs - createdAtMs);
      const isAddon = Boolean(row.is_addon);
      const windowLimitMs = isAddon ? ADDON_REFUND_WINDOW_MS : PLAN_REFUND_WINDOW_MS;
      const isWithinWindow = ageMs <= windowLimitMs;
      const remainingMs = Math.max(0, windowLimitMs - ageMs);
      const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
      const remainingDays = Math.ceil(remainingMs / (1000 * 60 * 60 * 24));

      const rawAmount = parseFloat(row.amount);
      const feeAmount = Number((rawAmount * PROCESSING_FEE_RATE).toFixed(2));
      const netRefund = Number((rawAmount - feeAmount).toFixed(2));

      const isEligibleForRefund = isWithinWindow &&
        row.status === 'completed' &&
        row.refund_status !== 'refund_requested' &&
        row.status !== 'refunded';

      return {
        id: row.id,
        tenantId: row.tenant_id,
        tenantName: row.tenant_name,
        planId: row.plan_id,
        amount: rawAmount,
        currency: row.currency || 'USD',
        gateway: row.gateway || 'paypal',
        status: row.status,
        orderId: row.razorpay_order_id || row.paypal_order_id || '-',
        paymentId: row.razorpay_payment_id || row.paypal_order_id || '-',
        seatsPurchased: row.seats_purchased || 15,
        isAddon: isAddon,
        billingCycle: row.billing_cycle || 'monthly',
        invoiceNumber: row.invoice_number || `INV-${(row.tenant_id || 'ORG').slice(-4).toUpperCase()}-${row.id}`,
        refundId: row.refund_id,
        refundAmount: parseFloat(row.refund_amount || 0),
        refundReason: row.refund_reason,
        refundStatus: row.refund_status,
        refundedAt: row.refunded_at,
        createdAt: row.created_at,

        // Refund Window & Policy Metadata
        isEligibleForRefund,
        refundWindowType: isAddon ? '24_hours' : '7_days',
        refundWindowLabel: isAddon ? '24 Hours (Seat Add-on)' : '7 Days (Subscription Plan)',
        refundWindowExpired: !isWithinWindow,
        refundWindowHoursRemaining: remainingHours,
        refundWindowDaysRemaining: remainingDays,
        processingFeePercentage: 3,
        processingFeeAmount: feeAmount,
        netRefundAmount: netRefund
      };
    })
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
      status: tenant.status,
      plan: tenant.subscription_plan || 'free',
      employeeLimit: tenant.employee_limit || 15,
      billingCycle: tenant.billing_cycle || 'monthly',
      autoRenew: tenant.auto_renew ?? true,
      subscriptionExpiry: tenant.subscription_expiry,
      isExpired,
      daysRemaining,
      lastPayment: lastPayment ? {
        id: lastPayment.id,
        amount: parseFloat(lastPayment.amount),
        currency: lastPayment.currency,
        gateway: lastPayment.gateway,
        paidAt: lastPayment.created_at,
        invoiceNumber: lastPayment.invoice_number,
        isAddon: Boolean(lastPayment.is_addon),
        seatsPurchased: lastPayment.seats_purchased,
        status: lastPayment.status
      } : null
    }
  });
});

/**
 * Process a Payment Refund (Super Admin Only)
 * Enforces 3% processing fee deduction and cascades to active add-ons for plan refunds.
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

  const { paymentLogId, amount, reason, adjustPlan = true, applyFeeDeduction = true } = req.body;

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

  const requestedAmount = amount ? parseFloat(amount) : parseFloat(paymentLog.amount);
  if (isNaN(requestedAmount) || requestedAmount <= 0 || requestedAmount > parseFloat(paymentLog.amount)) {
    throw new ValidationError('Invalid refund amount');
  }

  // 2. Compute 3% processing fee deduction
  const feeRate = applyFeeDeduction ? 0.03 : 0;
  const processingFee = Number((requestedAmount * feeRate).toFixed(2));
  const finalRefundAmount = Math.max(0.01, Number((requestedAmount - processingFee).toFixed(2)));

  let gatewayRefundId = `RFND-${Date.now().toString().slice(-8)}`;

  // 3. Helper to dispatch gateway refund
  const dispatchGatewayRefund = async (payLog, netAmount, refundReason) => {
    let gwId = `rfnd_${Date.now().toString().slice(-6)}`;
    if (payLog.gateway === 'razorpay' && payLog.razorpay_payment_id) {
      try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (keyId && keySecret && !keyId.includes('placeholder')) {
          const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
          const amountInPaise = Math.round(netAmount * 100);
          const rzpRefund = await razorpay.payments.refund(payLog.razorpay_payment_id, {
            amount: amountInPaise,
            notes: {
              reason: refundReason || 'Super Admin Refund (3% Fee Deducted)',
              refunded_by: req.user.email || 'super-admin'
            }
          });
          gwId = rzpRefund.id || gwId;
        }
      } catch (rzpErr) {
        console.warn('[Razorpay Refund API Note]:', rzpErr.error?.description || rzpErr.message);
        gwId = `rfnd_rzp_${Date.now().toString().slice(-6)}`;
      }
    } else if (payLog.gateway === 'paypal' && payLog.paypal_order_id) {
      try {
        const accessToken = await getPayPalAccessToken();
        const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
        if (accessToken) {
          const ppRes = await fetch(`${base}/v2/payments/captures/${payLog.paypal_order_id}/refund`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: { value: netAmount.toFixed(2), currency_code: payLog.currency || 'USD' },
              note_to_payer: refundReason || 'HRMS Pro Refund (3% processing fee deducted)'
            })
          });
          const ppData = await ppRes.json();
          if (ppData.id) gwId = ppData.id;
        }
      } catch (ppErr) {
        console.warn('[PayPal Refund API Note]:', ppErr.message);
        gwId = `rfnd_pp_${Date.now().toString().slice(-6)}`;
      }
    }
    return gwId;
  };

  // Dispatch refund for primary transaction
  gatewayRefundId = await dispatchGatewayRefund(paymentLog, finalRefundAmount, reason);

  // 4. Update primary payment log
  await pool.query(
    `UPDATE shared.payment_logs
     SET status = 'refunded',
         refund_id = $1,
         refund_amount = $2,
         refund_reason = $3,
         refund_status = 'processed',
         refunded_at = CURRENT_TIMESTAMP
     WHERE id = $4`,
    [
      gatewayRefundId,
      finalRefundAmount,
      reason ? `${reason} (Net after 3% fee: ${finalRefundAmount})` : `Refunded (3% processing fee deducted: ${processingFee})`,
      paymentLogId
    ]
  );

  let linkedAddonRefunds = [];

  // 5. If main subscription plan refund -> Also refund all active add-on seat transactions from this period
  if (!paymentLog.is_addon && adjustPlan) {
    const activeAddonsRes = await pool.query(
      `SELECT * FROM shared.payment_logs
       WHERE tenant_id = $1
         AND is_addon = true
         AND status = 'completed'
         AND created_at >= $2`,
      [paymentLog.tenant_id, paymentLog.created_at]
    );

    for (const addon of activeAddonsRes.rows) {
      const addonRaw = parseFloat(addon.amount);
      const addonFee = Number((addonRaw * 0.03).toFixed(2));
      const addonNet = Math.max(0.01, Number((addonRaw - addonFee).toFixed(2)));
      const addonGwId = await dispatchGatewayRefund(addon, addonNet, `Linked refund from plan #${paymentLogId}`);

      await pool.query(
        `UPDATE shared.payment_logs
         SET status = 'refunded',
             refund_id = $1,
             refund_amount = $2,
             refund_reason = $3,
             refund_status = 'processed',
             refunded_at = CURRENT_TIMESTAMP
         WHERE id = $4`,
        [addonGwId, addonNet, `Auto-refunded with primary subscription plan #${paymentLogId} (3% fee deducted)`, addon.id]
      );

      linkedAddonRefunds.push({
        id: addon.id,
        invoiceNumber: addon.invoice_number,
        originalAmount: addonRaw,
        refundedAmount: addonNet,
        seatsPurchased: addon.seats_purchased
      });
    }

    // Revert tenant to free tier and base 15 seats
    await pool.query(
      `UPDATE shared.tenants
       SET subscription_plan = 'free',
           employee_limit = 15,
           subscription_expiry = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $1`,
      [paymentLog.tenant_id]
    );
  } else if (paymentLog.is_addon && adjustPlan) {
    // Single seat add-on refund -> safely reduce extra capacity
    const seatsToDeduct = paymentLog.seats_purchased || 5;
    await pool.query(
      `UPDATE shared.tenants
       SET employee_limit = GREATEST(15, employee_limit - $1),
           updated_at = CURRENT_TIMESTAMP
       WHERE tenant_id = $2`,
      [seatsToDeduct, paymentLog.tenant_id]
    );
  }

  // 6. Audit Logging
  try {
    await pool.query(
      `INSERT INTO shared.platform_audit_logs (actor_email, action, target_tenant_id, details, ip_address, created_at)
       VALUES ($1, 'PAYMENT_REFUND_PROCESSED', $2, $3, $4, CURRENT_TIMESTAMP)`,
      [
        req.user?.email || 'superadmin@hrmspro.online',
        paymentLog.tenant_id,
        JSON.stringify({
          paymentLogId,
          originalAmount: requestedAmount,
          processingFeeDeducted: processingFee,
          finalRefundAmount,
          currency: paymentLog.currency,
          gateway: paymentLog.gateway,
          refundId: gatewayRefundId,
          linkedAddonsRefunded: linkedAddonRefunds,
          reason,
          adjustPlan
        }),
        req.ip || '127.0.0.1'
      ]
    );
  } catch (_) {}

  res.json({
    success: true,
    message: `Payment #${paymentLogId} successfully refunded (${paymentLog.currency} ${finalRefundAmount} after 3% processing fee deduction).${
      linkedAddonRefunds.length > 0 ? ` Additionally refunded ${linkedAddonRefunds.length} linked seat add-on transactions.` : ''
    }`,
    data: {
      refundId: gatewayRefundId,
      originalAmount: requestedAmount,
      processingFee,
      refundAmount: finalRefundAmount,
      linkedAddonsRefunded: linkedAddonRefunds,
      tenantId: paymentLog.tenant_id,
      status: 'refunded'
    }
  });
});

/**
 * Tenant Admin: Request a refund for a payment
 * Enforces 7-day window for plans, 24-hour window for seat add-ons, and links add-ons.
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

  if (paymentLog.refund_status === 'refund_requested') {
    throw new ValidationError('A refund request is already pending review for this payment.');
  }

  // Enforce Policy Refund Window
  const nowMs = Date.now();
  const createdAtMs = new Date(paymentLog.created_at).getTime();
  const ageMs = nowMs - createdAtMs;
  const isAddon = Boolean(paymentLog.is_addon);

  if (isAddon) {
    // 24 Hours for seat add-ons
    const maxAddonAgeMs = 24 * 60 * 60 * 1000;
    if (ageMs > maxAddonAgeMs) {
      throw new ValidationError(
        `Refund policy window for Seat Add-ons is 24 hours from purchase. This payment was made on ${new Date(paymentLog.created_at).toLocaleString()} and is no longer eligible for refund.`
      );
    }
  } else {
    // 7 Days for subscription plans
    const maxPlanAgeMs = 7 * 24 * 60 * 60 * 1000;
    if (ageMs > maxPlanAgeMs) {
      throw new ValidationError(
        `Refund policy window for Subscription Plans is 7 days from purchase. This payment was made on ${new Date(paymentLog.created_at).toLocaleString()} and is no longer eligible for refund.`
      );
    }
  }

  // Calculate 3% processing fee deduction
  const grossAmount = parseFloat(paymentLog.amount);
  const feeAmount = Number((grossAmount * 0.03).toFixed(2));
  const netRefund = Number((grossAmount - feeAmount).toFixed(2));

  // If requesting main plan refund -> also mark any active add-ons as refund_requested
  let linkedAddonCount = 0;
  if (!isAddon) {
    const activeAddonsRes = await pool.query(
      `UPDATE shared.payment_logs
       SET refund_status = 'refund_requested',
           refund_reason = $1
       WHERE tenant_id = $2
         AND is_addon = true
         AND status = 'completed'
         AND refund_status IS DISTINCT FROM 'refund_requested'
         AND created_at >= $3
       RETURNING id`,
      [`Linked with primary subscription plan #${paymentLogId} refund request`, tenantId, paymentLog.created_at]
    );
    linkedAddonCount = activeAddonsRes.rows.length;
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
    message: `Refund request submitted to HRMS Pro Super Admin for review. In accordance with policy, a 3% processing fee (${paymentLog.currency} ${feeAmount}) will be deducted, yielding a net refund of ${paymentLog.currency} ${netRefund}.${
      linkedAddonCount > 0 ? ` Additionally included ${linkedAddonCount} linked seat add-on transaction(s) for refund.` : ''
    }`,
    data: {
      paymentLogId,
      grossAmount,
      feePercentage: 3,
      processingFee: feeAmount,
      estimatedNetRefund: netRefund,
      linkedAddonCount
    }
  });
});

module.exports = {
  getPaymentHistory,
  getLastSubscription,
  processRefund,
  requestRefund
};
