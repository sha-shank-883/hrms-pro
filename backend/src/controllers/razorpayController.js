const crypto = require('crypto');
const Razorpay = require('razorpay');
const asyncHandler = require('../utils/asyncHandler');
const { ValidationError, AppError } = require('../utils/errors');
const { pool, query } = require('../config/database');
const { sendEmailSync } = require('../services/emailService');

// ---------------------------------------------------------------------------
// Plan Definitions (INR Per-Seat Rates for Indian Customers)
// ---------------------------------------------------------------------------
const PLANS = {
  hatch: {
    id: 'hatch',
    name: 'Hatch',
    description: 'Essential HR tools for small growing teams.',
    durationDays: 30,
    minSeats: 1,
    defaultSeats: 10,
    pricePerSeatINR: 299.00,
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    description: 'Full-suite HRMS with Payroll, Performance & ATS for scaling teams.',
    durationDays: 30,
    minSeats: 1,
    defaultSeats: 25,
    pricePerSeatINR: 799.00,
  },
};

// ---------------------------------------------------------------------------
// Helper: Calculate Plan Cost (Enforces Server-Side Pricing, Yearly 20% Discount & Sanitized Seats)
// ---------------------------------------------------------------------------
function calculateINRPlanCost(planId, seatsCount, billingCycle = 'monthly') {
  const plan = PLANS[planId];
  if (!plan) return null;

  // Strict integer sanitization: min 1 seat, max 10,000 seats
  const parsedSeats = parseInt(seatsCount || plan.defaultSeats || 10, 10);
  const seats = Math.max(1, Math.min(10000, isNaN(parsedSeats) ? 10 : parsedSeats));
  const isYearly = String(billingCycle).toLowerCase() === 'yearly';
  const durationDays = isYearly ? 365 : 30;

  const unitPrice = plan.pricePerSeatINR;
  // Yearly gets 20% discount (0.80 multiplier on 12 months)
  const totalPrice = isYearly
    ? Math.round(unitPrice * seats * 12 * 0.80)
    : Math.round(unitPrice * seats);
  const amountInPaise = totalPrice * 100; // Razorpay requires amount in paise

  return {
    plan,
    seats,
    billingCycle: isYearly ? 'yearly' : 'monthly',
    durationDays,
    currency: 'INR',
    symbol: '₹',
    unitPrice,
    totalPrice,
    amountInPaise,
    isDiscounted: isYearly,
    discountPercent: isYearly ? 20 : 0
  };
}

// ---------------------------------------------------------------------------
// Helper: Initialize Razorpay Instance
// ---------------------------------------------------------------------------
function getRazorpayInstance() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new AppError('Razorpay is not configured on this server. Please provide RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.', 503);
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

// ---------------------------------------------------------------------------
// GET /api/razorpay/key — Public Key for Frontend SDK
// ---------------------------------------------------------------------------
const getRazorpayKey = asyncHandler(async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  res.json({
    success: true,
    data: {
      keyId,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/razorpay/create-order
// ---------------------------------------------------------------------------
const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { planId, seats, billingCycle = 'monthly', autoPay = false } = req.body;

  if (!planId) {
    throw new ValidationError('Field "planId" is required (e.g. "hatch", "scale").');
  }

  const calculation = calculateINRPlanCost(planId, seats, billingCycle);
  if (!calculation) {
    throw new ValidationError(`Invalid plan: "${planId}". Valid plans: hatch, scale.`);
  }

  const { plan, seats: selectedSeats, totalPrice, amountInPaise, durationDays } = calculation;
  const tenantId = req.tenant.tenant_id;
  const razorpay = getRazorpayInstance();

  const receipt = `rcpt_${tenantId.slice(-8)}_${Date.now().toString().slice(-6)}`;

  const options = {
    amount: amountInPaise,
    currency: 'INR',
    receipt,
    notes: {
      tenant_id: tenantId,
      plan_id: plan.id,
      seats: String(selectedSeats),
      billing_cycle: calculation.billingCycle,
      auto_pay: String(Boolean(autoPay)),
      amount_in_paise: String(amountInPaise),
      organization: req.tenant.company_name || 'HRMS Pro Tenant',
    },
  };

  let order;
  try {
    order = await razorpay.orders.create(options);
  } catch (rzpErr) {
    console.error('Razorpay SDK Order Creation Failed:', rzpErr?.error || rzpErr?.message || rzpErr);
    const rzpDesc = rzpErr?.error?.description || rzpErr?.message || 'Payment gateway authentication or connection failed';
    throw new AppError(`Razorpay Gateway Error: ${rzpDesc}`, 502);
  }

  // Database logging to shared.payment_logs
  try {
    await pool.query(
      `INSERT INTO shared.payment_logs
         (tenant_id, plan_id, amount, currency, razorpay_order_id, gateway, status, created_at)
       VALUES ($1, $2, $3, 'INR', $4, 'razorpay', 'created', CURRENT_TIMESTAMP)`,
      [tenantId, `${plan.id}_${selectedSeats}_seats_${calculation.billingCycle}`, totalPrice, order.id]
    );
  } catch (_) {}

  res.status(201).json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      seats: selectedSeats,
      billingCycle: calculation.billingCycle,
      durationDays,
      unitPrice: plan.pricePerSeatINR,
      totalPrice,
      planId: plan.id,
      planName: plan.name,
      keyId: process.env.RAZORPAY_KEY_ID,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/razorpay/verify-payment
// ---------------------------------------------------------------------------
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planId,
    seats,
    billingCycle = 'monthly',
    autoPay = false
  } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new ValidationError('Missing required Razorpay payment verification fields.');
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    throw new AppError('Razorpay secret is not configured on this server.', 503);
  }

  // 1. Constant-Time Cryptographic HMAC SHA256 Signature Verification
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
  const actualBuffer = Buffer.from(razorpay_signature, 'utf8');

  if (expectedBuffer.length !== actualBuffer.length || !crypto.timingSafeEqual(expectedBuffer, actualBuffer)) {
    throw new ValidationError('Razorpay payment signature verification failed. Untrusted transaction.');
  }

  // 2. Replay & Duplicate Attack Protection
  const existingLog = await pool.query(
    `SELECT id, status, plan_id, created_at FROM shared.payment_logs WHERE razorpay_payment_id = $1 AND status = 'completed' LIMIT 1`,
    [razorpay_payment_id]
  ).catch(() => ({ rows: [] }));

  const tenantId = req.tenant.tenant_id;

  if (existingLog.rows.length > 0) {
    return res.json({
      success: true,
      message: 'Payment has already been confirmed and processed.',
      data: {
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        alreadyProcessed: true
      }
    });
  }

  // 3. Server-side Plan Cost Calculation
  const calculation = calculateINRPlanCost(planId, seats, billingCycle);
  if (!calculation) {
    throw new ValidationError(`Invalid plan: "${planId}".`);
  }

  const { plan, seats: selectedSeats, totalPrice, durationDays } = calculation;

  // 4. Calculate new subscription expiry (today + durationDays: 30 or 365)
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + durationDays);

  // Ensure columns exist on shared.tenants
  await pool.query(`
    ALTER TABLE shared.tenants 
    ADD COLUMN IF NOT EXISTS billing_cycle VARCHAR(20) DEFAULT 'monthly',
    ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT false;
  `).catch(() => {});

  // 5. Update tenant subscription, employee limit, cycle and auto_renew in shared.tenants
  await pool.query(
    `UPDATE shared.tenants
     SET subscription_plan    = $1,
         employee_limit       = $2,
         subscription_expiry  = $3,
         billing_cycle        = $4,
         auto_renew           = $5,
         updated_at           = CURRENT_TIMESTAMP
     WHERE tenant_id = $6`,
    [plan.id, selectedSeats, expiry.toISOString(), calculation.billingCycle, Boolean(autoPay), tenantId]
  );

  // 6. Record payment success in shared.payment_logs
  try {
    await pool.query(
      `INSERT INTO shared.payment_logs
         (tenant_id, plan_id, amount, currency, razorpay_order_id, razorpay_payment_id, gateway, status, created_at)
       VALUES ($1, $2, $3, 'INR', $4, $5, 'razorpay', 'completed', CURRENT_TIMESTAMP)`,
      [tenantId, `${plan.id}_${selectedSeats}_seats_${calculation.billingCycle}`, totalPrice, razorpay_order_id, razorpay_payment_id]
    );
  } catch (_) {}

  // Send confirmation email
  try {
    const userResult = await query(
      `SELECT email, first_name FROM "${tenantId}".users WHERE role = 'admin' AND is_active = true LIMIT 1`
    );
    if (userResult.rows.length > 0) {
      const adminEmail = userResult.rows[0].email;
      await sendEmailSync({
        to: adminEmail,
        subject: `Payment Confirmed - HRMS Pro ${plan.name} Plan (${selectedSeats} Seats)`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; rounded: 16px;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #16a34a; margin: 0; font-size: 24px;">Payment Successful!</h1>
              <p style="color: #6b7280; margin-top: 4px;">Thank you for subscribing to HRMS Pro via Razorpay.</p>
            </div>

            <div style="background-color: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Plan Tier</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 14px;">${plan.name}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Employee Capacity</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 14px;">${selectedSeats} Seats</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount Paid</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 16px; color: #16a34a;">₹${totalPrice.toLocaleString('en-IN')} INR</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Payment Method</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 14px;">Razorpay (UPI / Card / NetBanking)</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Valid Until</td>
                  <td style="padding: 8px 0; font-weight: bold; text-align: right; font-size: 14px;">${expiry.toLocaleDateString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280; font-size: 12px;">Payment ID</td>
                  <td style="padding: 8px 0; font-family: monospace; font-size: 12px; text-align: right; color: #4b5563;">${razorpay_payment_id}</td>
                </tr>
              </table>
            </div>

            <p style="font-size: 13px; color: #6b7280; line-height: 1.5;">
              Your account has been instantly upgraded. If you have questions or require GST invoices, reach us at <a href="mailto:support@hrmspro.online">support@hrmspro.online</a>.
            </p>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    console.error('Failed to send payment confirmation email:', emailErr);
  }

  // Real-time Super Admin Notification via Socket.IO
  if (req.io) {
    req.io.emit('notification:new', {
      id: `pay_${Date.now()}`,
      module: 'billing',
      title: `Payment Received: ₹${totalPrice.toLocaleString('en-IN')}`,
      message: `Tenant "${tenantId}" subscribed to ${plan.name} (${selectedSeats} seats) via Razorpay.`,
      action_url: '/super-admin/billing',
      created_at: new Date()
    });
    req.io.emit('dashboard_update');
  }

  res.json({
    success: true,
    message: `Payment successful. ${plan.name} plan with ${selectedSeats} seats is now active.`,
    data: {
      planId: plan.id,
      planName: plan.name,
      seats: selectedSeats,
      expiryDate: expiry.toISOString(),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    },
  });
});

module.exports = {
  getRazorpayKey,
  createRazorpayOrder,
  verifyRazorpayPayment,
};
