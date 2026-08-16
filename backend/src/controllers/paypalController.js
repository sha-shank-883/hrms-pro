const asyncHandler = require('../utils/asyncHandler');
const { ValidationError, AppError } = require('../utils/errors');
const { pool, query } = require('../config/database');
const { sendEmailSync } = require('../services/emailService');

// ---------------------------------------------------------------------------
// PayPal Plan Definitions  (per-seat monthly, supports USD & INR)
// ---------------------------------------------------------------------------
const PLANS = {
  hatch: {
    id: 'hatch',
    name: 'Hatch',
    description: 'Essential HR tools for small growing teams.',
    durationDays: 30,
    minSeats: 1,
    defaultSeats: 10,
    pricing: {
      USD: { pricePerSeat: 4.00, currency: 'USD', symbol: '$' },
      INR: { pricePerSeat: 299.00, currency: 'INR', symbol: '₹' },
    },
  },
  scale: {
    id: 'scale',
    name: 'Scale',
    description: 'Full-suite HRMS with Payroll, Performance & ATS for scaling teams.',
    durationDays: 30,
    minSeats: 1,
    defaultSeats: 25,
    pricing: {
      USD: { pricePerSeat: 10.00, currency: 'USD', symbol: '$' },
      INR: { pricePerSeat: 799.00, currency: 'INR', symbol: '₹' },
    },
  },
};

// ---------------------------------------------------------------------------
// Helper: Calculate dynamic plan cost based on seats and currency
// ---------------------------------------------------------------------------
function calculatePlanCost(planId, seatsCount, currency = 'USD') {
  const plan = PLANS[planId];
  if (!plan) return null;

  // Strict integer sanitization: min 1 seat, max 10,000 seats
  const parsedSeats = parseInt(seatsCount || plan.defaultSeats || 10, 10);
  const seats = Math.max(1, Math.min(10000, isNaN(parsedSeats) ? 10 : parsedSeats));
  const curr = (currency || 'USD').toUpperCase();
  const pricing = plan.pricing?.[curr] || plan.pricing.USD;

  const unitPrice = pricing.pricePerSeat;
  const totalPrice = (unitPrice * seats).toFixed(2);
  const totalUSD = (plan.pricing.USD.pricePerSeat * seats).toFixed(2);

  return {
    plan,
    seats,
    currency: curr,
    symbol: pricing.symbol || (curr === 'INR' ? '₹' : '$'),
    unitPrice,
    totalPrice,
    totalUSD,
  };
}

// ---------------------------------------------------------------------------
// PayPal OAuth — get an access token from PayPal
// ---------------------------------------------------------------------------
async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret   = process.env.PAYPAL_SECRET;

  if (!clientId || !secret) {
    throw new AppError('PayPal is not configured on this server. Missing client ID or secret.', 503);
  }

  const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
  const credentials = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const err = await response.text();
    throw new AppError(`PayPal auth failed: ${err}`, 502);
  }

  const data = await response.json();
  return data.access_token;
}

// ---------------------------------------------------------------------------
// GET /api/payments/plans  (public)
// ---------------------------------------------------------------------------
const getPlans = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: Object.values(PLANS),
  });
});

// ---------------------------------------------------------------------------
// POST /api/payments/paypal/create-order  (auth required)
// ---------------------------------------------------------------------------
const createOrder = asyncHandler(async (req, res) => {
  const { planId, currency = 'USD', seats = 10 } = req.body;

  const calculation = calculatePlanCost(planId, seats, currency);
  if (!calculation) {
    throw new ValidationError(`Invalid plan: "${planId}". Valid plans are: ${Object.keys(PLANS).join(', ')}`);
  }

  const { plan, seats: selectedSeats, currency: selectedCurrency, totalPrice, totalUSD, symbol } = calculation;

  // PayPal REST API charges in USD while converting to the selected employee seats
  const payPalCurrency = 'USD';
  const payPalValue = totalUSD;

  const accessToken = await getPayPalAccessToken();
  const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${base}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [
        {
          description: `HRMS Pro - ${plan.name} Plan (${selectedSeats} Employees - monthly)${selectedCurrency === 'INR' ? ` (₹${totalPrice} INR)` : ` ($${totalPrice} USD)`}`,
          amount: {
            currency_code: payPalCurrency,
            value: payPalValue,
          },
          custom_id: `${req.tenant.tenant_id}|${plan.id}|${selectedCurrency}|${selectedSeats}`,
        },
      ],
      application_context: {
        brand_name: 'HRMS Pro',
        landing_page: 'NO_PREFERENCE',
        user_action: 'PAY_NOW',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('[PayPal] Order creation error:', err);
    throw new AppError(`PayPal order creation failed: ${err}`, 502);
  }

  const order = await response.json();

  res.status(201).json({
    success: true,
    data: {
      orderId: order.id,
      seats: selectedSeats,
      totalPrice,
      currency: selectedCurrency,
      symbol,
    },
  });
});

// ---------------------------------------------------------------------------
// POST /api/payments/paypal/capture-order  (auth required)
// ---------------------------------------------------------------------------
const captureOrder = asyncHandler(async (req, res) => {
  const { orderId, planId, currency = 'USD', seats = 10 } = req.body;

  if (!orderId || !planId) {
    throw new ValidationError('orderId and planId are required.');
  }

  const tenantId = req.tenant.tenant_id;

  // 1. Replay Attack & Duplicate Protection
  const existingLog = await pool.query(
    `SELECT id, status, plan_id, created_at FROM shared.payment_logs WHERE paypal_order_id = $1 AND status = 'completed' LIMIT 1`,
    [orderId]
  ).catch(() => ({ rows: [] }));

  if (existingLog.rows.length > 0) {
    return res.json({
      success: true,
      message: 'Payment has already been confirmed and processed.',
      data: {
        orderId,
        alreadyProcessed: true
      }
    });
  }

  // 2. Server-side Plan Cost Verification
  const calculation = calculatePlanCost(planId, seats, currency);
  if (!calculation) {
    throw new ValidationError(`Invalid plan: "${planId}".`);
  }

  const { plan, seats: selectedSeats, currency: selectedCurrency, totalPrice, symbol } = calculation;

  const accessToken = await getPayPalAccessToken();
  const base = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';

  const response = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const err = await response.text();
    throw new AppError(`PayPal capture failed: ${err}`, 502);
  }

  const capture = await response.json();

  const status = capture.status;
  if (status !== 'COMPLETED') {
    throw new AppError(`Payment not completed. Status: ${status}`, 402);
  }

  // 3. Calculate new expiry (today + plan.durationDays)
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + plan.durationDays);

  // 4. Update tenant subscription plan, employee limit and expiry in shared.tenants
  await pool.query(
    `UPDATE shared.tenants
     SET subscription_plan    = $1,
         employee_limit       = $2,
         subscription_expiry  = $3,
         updated_at           = CURRENT_TIMESTAMP
     WHERE tenant_id = $4`,
    [plan.id, selectedSeats, expiry.toISOString(), tenantId]
  );

  // 5. Record payment in shared.payment_logs
  try {
    await pool.query(
      `INSERT INTO shared.payment_logs
         (tenant_id, plan_id, amount, currency, paypal_order_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, 'completed', CURRENT_TIMESTAMP)`,
      [tenantId, `${plan.id}_${selectedSeats}_seats`, totalPrice, selectedCurrency, orderId]
    );
  } catch (_) {}

  // Send confirmation email (best-effort)
  try {
    const userResult = await query(
      `SELECT email FROM "${tenantId}".users WHERE role = 'admin' AND is_active = true LIMIT 1`
    );
    if (userResult.rows.length > 0) {
      await sendEmailSync({
        to: userResult.rows[0].email,
        subject: `Payment Confirmed - HRMS Pro ${plan.name} Plan (${selectedSeats} Seats)`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px">
            <h2 style="color:#16a34a">Payment Successful!</h2>
            <p>Your <strong>${plan.name}</strong> plan with <strong>${selectedSeats} Employee Seats</strong> has been activated.</p>
            <table style="width:100%;border-collapse:collapse;margin:16px 0">
              <tr><td style="padding:8px 0;color:#6b7280">Plan Tier</td><td style="font-weight:600">${plan.name}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Employee Seats</td><td style="font-weight:600">${selectedSeats} Employees</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Amount Paid</td><td style="font-weight:600">${symbol}${totalPrice} (${selectedCurrency})</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Active Until</td><td style="font-weight:600">${expiry.toLocaleDateString()}</td></tr>
              <tr><td style="padding:8px 0;color:#6b7280">Order ID</td><td style="font-family:monospace;font-size:12px">${orderId}</td></tr>
            </table>
            <p style="color:#6b7280">Thank you for choosing HRMS Pro!</p>
          </div>
        `,
      });
    }
  } catch (emailErr) {
    console.error('[PayPal] Confirmation email failed:', emailErr.message);
  }

  // Real-time Super Admin Notification via Socket.IO
  if (req.io) {
    req.io.emit('notification:new', {
      id: `pay_${Date.now()}`,
      module: 'billing',
      title: `Payment Received: ${symbol}${totalPrice} (${selectedCurrency})`,
      message: `Tenant "${tenantId}" subscribed to ${plan.name} (${selectedSeats} seats) via PayPal.`,
      action_url: '/super-admin/billing',
      created_at: new Date()
    });
    req.io.emit('dashboard_update');
  }

  res.json({
    success: true,
    message: `${plan.name} plan with ${selectedSeats} seats activated successfully.`,
    data: {
      plan: plan.id,
      planName: plan.name,
      seats: selectedSeats,
      amount: totalPrice,
      currency: selectedCurrency,
      expiresAt: expiry.toISOString(),
      orderId,
    },
  });
});

// ---------------------------------------------------------------------------
// GET /api/payments/subscription  (auth required)
// ---------------------------------------------------------------------------
const getSubscription = asyncHandler(async (req, res) => {
  const tenantId = req.tenant.tenant_id;

  const result = await query(
    `SELECT subscription_plan, subscription_expiry, employee_limit FROM shared.tenants WHERE tenant_id = $1`,
    [tenantId]
  );

  if (result.rows.length === 0) {
    throw new AppError('Tenant not found', 404);
  }

  const { subscription_plan, subscription_expiry, employee_limit } = result.rows[0];
  const now = new Date();
  const expiry = subscription_expiry ? new Date(subscription_expiry) : null;
  const isExpired = expiry ? expiry < now : false;

  let activeEmployees = 0;
  try {
    const countResult = await query(
      `SELECT COUNT(*) FROM "${tenantId}".employees WHERE status = 'active'`
    );
    activeEmployees = parseInt(countResult.rows[0].count, 10);
  } catch (_) {
    // best effort
  }

  res.json({
    success: true,
    data: {
      plan: subscription_plan || 'free',
      employeeLimit: employee_limit || 15,
      activeEmployees,
      expiresAt: subscription_expiry,
      isExpired,
      daysRemaining: expiry && !isExpired
        ? Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
        : 0,
    },
  });
});

module.exports = { getPlans, createOrder, captureOrder, getSubscription };
