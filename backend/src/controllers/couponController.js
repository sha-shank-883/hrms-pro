const { pool } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../utils/errors');

let schemaEnsured = false;
async function ensureCouponSchema() {
  if (schemaEnsured) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared.coupons (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
        discount_value NUMERIC(10,2) NOT NULL,
        applicable_plans JSONB DEFAULT '["all"]'::jsonb,
        applicable_cycles JSONB DEFAULT '["all"]'::jsonb,
        min_seats INTEGER DEFAULT 1,
        max_uses INTEGER DEFAULT NULL,
        used_count INTEGER DEFAULT 0,
        valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        valid_until TIMESTAMP DEFAULT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        description TEXT,
        created_by VARCHAR(255) DEFAULT 'superadmin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS shared.coupon_usages (
        id SERIAL PRIMARY KEY,
        coupon_id INTEGER REFERENCES shared.coupons(id) ON DELETE CASCADE,
        tenant_id VARCHAR(50) NOT NULL REFERENCES shared.tenants(tenant_id) ON DELETE CASCADE,
        payment_log_id INTEGER,
        discount_amount NUMERIC(10,2) DEFAULT 0,
        used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    schemaEnsured = true;
  } catch (_) {}
}

const checkIsSuperAdmin = (req) => {
  return Boolean(
    req.user?.isSuperAdmin ||
    req.user?.role === 'super_admin' ||
    req.user?.role === 'super-admin' ||
    (req.user?.role === 'admin' && req.user?.is_super_admin)
  );
};

/**
 * Super Admin: Create a new custom coupon / promo code
 */
const createCoupon = asyncHandler(async (req, res) => {
  await ensureCouponSchema();
  if (!checkIsSuperAdmin(req)) {
    throw new UnauthorizedError('Only Super Admin can create coupons');
  }

  const {
    code,
    discountType = 'percentage',
    discountValue,
    applicablePlans = ['all'],
    applicableCycles = ['all'],
    minSeats = 1,
    maxUses = null,
    validFrom = null,
    validUntil = null,
    description = ''
  } = req.body;

  if (!code || !code.trim()) {
    throw new ValidationError('Coupon code is required');
  }

  const cleanCode = code.trim().toUpperCase();

  if (discountValue === undefined || isNaN(parseFloat(discountValue)) || parseFloat(discountValue) <= 0) {
    throw new ValidationError('Valid discountValue is required');
  }

  if (discountType === 'percentage' && parseFloat(discountValue) > 100) {
    throw new ValidationError('Percentage discount cannot exceed 100%');
  }

  const existingRes = await pool.query(
    'SELECT id FROM shared.coupons WHERE UPPER(code) = $1',
    [cleanCode]
  );
  if (existingRes.rows.length > 0) {
    throw new ValidationError(`Coupon code "${cleanCode}" already exists`);
  }

  const insertRes = await pool.query(
    `INSERT INTO shared.coupons 
       (code, discount_type, discount_value, applicable_plans, applicable_cycles, min_seats, max_uses, valid_from, valid_until, description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      cleanCode,
      discountType,
      parseFloat(discountValue),
      JSON.stringify(applicablePlans),
      JSON.stringify(applicableCycles),
      parseInt(minSeats, 10) || 1,
      maxUses ? parseInt(maxUses, 10) : null,
      validFrom ? new Date(validFrom) : new Date(),
      validUntil ? new Date(validUntil) : null,
      description || '',
      req.user?.email || 'superadmin'
    ]
  );

  res.status(201).json({
    success: true,
    message: `Coupon "${cleanCode}" created successfully`,
    data: insertRes.rows[0]
  });
});

/**
 * Super Admin: Get all coupons
 */
const getCoupons = asyncHandler(async (req, res) => {
  await ensureCouponSchema();
  if (!checkIsSuperAdmin(req)) {
    throw new UnauthorizedError('Only Super Admin can view all coupons');
  }

  const resCoupons = await pool.query(
    `SELECT * FROM shared.coupons ORDER BY created_at DESC`
  );

  res.json({
    success: true,
    data: resCoupons.rows.map(row => ({
      id: row.id,
      code: row.code,
      discountType: row.discount_type,
      discountValue: parseFloat(row.discount_value),
      applicablePlans: row.applicable_plans || ['all'],
      applicableCycles: row.applicable_cycles || ['all'],
      minSeats: row.min_seats || 1,
      maxUses: row.max_uses,
      usedCount: row.used_count || 0,
      validFrom: row.valid_from,
      validUntil: row.valid_until,
      isActive: Boolean(row.is_active),
      description: row.description,
      createdBy: row.created_by,
      createdAt: row.created_at
    }))
  });
});

/**
 * Super Admin: Update coupon status or details
 */
const updateCoupon = asyncHandler(async (req, res) => {
  await ensureCouponSchema();
  if (!checkIsSuperAdmin(req)) {
    throw new UnauthorizedError('Only Super Admin can modify coupons');
  }

  const { id } = req.params;
  const { isActive, description, maxUses, validUntil } = req.body;

  const check = await pool.query('SELECT * FROM shared.coupons WHERE id = $1', [id]);
  if (check.rows.length === 0) {
    throw new NotFoundError(`Coupon #${id} not found`);
  }

  const updateRes = await pool.query(
    `UPDATE shared.coupons
     SET is_active = COALESCE($1, is_active),
         description = COALESCE($2, description),
         max_uses = $3,
         valid_until = $4,
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $5
     RETURNING *`,
    [
      isActive !== undefined ? Boolean(isActive) : null,
      description !== undefined ? description : null,
      maxUses !== undefined ? (maxUses ? parseInt(maxUses, 10) : null) : check.rows[0].max_uses,
      validUntil !== undefined ? (validUntil ? new Date(validUntil) : null) : check.rows[0].valid_until,
      id
    ]
  );

  res.json({
    success: true,
    message: `Coupon #${id} updated successfully`,
    data: updateRes.rows[0]
  });
});

/**
 * Super Admin: Delete coupon
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  await ensureCouponSchema();
  if (!checkIsSuperAdmin(req)) {
    throw new UnauthorizedError('Only Super Admin can delete coupons');
  }

  const { id } = req.params;
  const delRes = await pool.query('DELETE FROM shared.coupons WHERE id = $1 RETURNING code', [id]);
  if (delRes.rows.length === 0) {
    throw new NotFoundError(`Coupon #${id} not found`);
  }

  res.json({
    success: true,
    message: `Coupon "${delRes.rows[0].code}" deleted successfully`
  });
});

/**
 * Tenant Checkout: Validate Promo / Gift Coupon Code
 */
const validateCoupon = asyncHandler(async (req, res) => {
  await ensureCouponSchema();
  const { code, planId, seats = 15, billingCycle = 'monthly', rawPrice } = req.body;
  const tenantId = req.tenant ? req.tenant.tenant_id : req.body.tenantId;

  if (!code || !code.trim()) {
    throw new ValidationError('Coupon code is required');
  }

  const cleanCode = code.trim().toUpperCase();

  const couponRes = await pool.query(
    `SELECT * FROM shared.coupons WHERE UPPER(code) = $1 AND is_active = true`,
    [cleanCode]
  );

  if (couponRes.rows.length === 0) {
    throw new ValidationError(`Coupon code "${cleanCode}" is invalid or inactive`);
  }

  const coupon = couponRes.rows[0];
  const now = new Date();

  // Check validity dates
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    throw new ValidationError(`Coupon "${cleanCode}" is not yet active`);
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    throw new ValidationError(`Coupon "${cleanCode}" has expired`);
  }

  // Check max usages
  if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
    throw new ValidationError(`Coupon "${cleanCode}" has reached its maximum usage limit`);
  }

  // Check plan eligibility
  const applicablePlans = Array.isArray(coupon.applicable_plans)
    ? coupon.applicable_plans
    : (typeof coupon.applicable_plans === 'string' ? JSON.parse(coupon.applicable_plans) : ['all']);

  if (!applicablePlans.includes('all') && planId && !applicablePlans.includes(planId)) {
    throw new ValidationError(`Coupon "${cleanCode}" is only applicable to plans: ${applicablePlans.join(', ')}`);
  }

  // Check billing cycle eligibility
  const applicableCycles = Array.isArray(coupon.applicable_cycles)
    ? coupon.applicable_cycles
    : (typeof coupon.applicable_cycles === 'string' ? JSON.parse(coupon.applicable_cycles) : ['all']);

  if (!applicableCycles.includes('all') && billingCycle && !applicableCycles.includes(billingCycle)) {
    throw new ValidationError(`Coupon "${cleanCode}" is only applicable to ${applicableCycles.join(', ')} billing cycles`);
  }

  // Check minimum seats
  const selectedSeats = parseInt(seats, 10) || 1;
  if (coupon.min_seats && selectedSeats < coupon.min_seats) {
    throw new ValidationError(`Coupon "${cleanCode}" requires a minimum of ${coupon.min_seats} employee seats`);
  }

  // Compute discount
  const baseAmount = parseFloat(rawPrice) || 0;
  let discountAmount = 0;

  if (coupon.discount_type === 'percentage') {
    const pct = parseFloat(coupon.discount_value);
    discountAmount = Number(((baseAmount * pct) / 100).toFixed(2));
  } else {
    discountAmount = Math.min(baseAmount, parseFloat(coupon.discount_value));
  }

  const netPayable = Math.max(0, Number((baseAmount - discountAmount).toFixed(2)));
  const isFreeGift = netPayable === 0 || (coupon.discount_type === 'percentage' && parseFloat(coupon.discount_value) >= 100);

  res.json({
    success: true,
    message: isFreeGift
      ? `🎉 100% Free Gift Voucher "${cleanCode}" applied! No payment required.`
      : `✅ Coupon "${cleanCode}" applied: ${coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `Discount applied`}`,
    data: {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: parseFloat(coupon.discount_value),
      discountAmount,
      originalPrice: baseAmount,
      finalPayable: netPayable,
      isFreeGift,
      description: coupon.description
    }
  });
});

module.exports = {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  ensureCouponSchema
};
