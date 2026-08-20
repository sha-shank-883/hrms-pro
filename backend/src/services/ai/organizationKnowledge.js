/**
 * Enterprise Organization Knowledge Context for HR AI Operations
 * Injected into AI system prompts to ground models in deep HR policies,
 * domain terminology, statutory calculations, and expert HR tacit judgment rules.
 */

const { query } = require('../../config/database');

const DEFAULT_HR_POLICIES = {
  probation_period_days: 90,
  policy_restrictions: 'leave encashment, salary advances, personal loans, or long-term sabbatical leaves without explicit HR Head sign-off',
  leave_types_and_accrual_rules: `• Privilege/Earned Leave (PL/EL): 15 days/year (accrued at 1.25 days/month). Max 30 days carry-forward; excess encashable during F&F or year-end.
• Sick Leave (SL): 10 days/year. Medical certificate required for 3+ consecutive days.
• Casual Leave (CL): 8 days/year. Maximum 2 consecutive days per request; cannot be clubbed with PL.
• Maternity Leave: 26 weeks paid leave for up to 2 surviving children as per Maternity Benefit Act.
• Paternity Leave: 5 working days within 6 months of child birth.
• Compensatory Off (Comp-Off): Granted for working on designated holidays/weekends with prior manager approval; valid for 60 days.
• Sandwich Rule: If leave spans across weekend/holiday without prior approval, intermediate holidays count as leave.`,
  who_approves_what: `• Leave Requests: Direct Manager (1-3 days); Department Head + HR (3+ days).
• Attendance Regularization: Direct Reporting Manager.
• Expense Claims: Reporting Manager (< ₹10,000); Finance Head (> ₹10,000).
• Onboarding & Profile Changes: HR Operations Team.
• Salary Revisions & Promotions: Direct Manager -> Department Head -> HR Head -> Finance Director.
• Resignations & Exits: Direct Manager + HR Business Partner.`,
  cycle_details: 'Annual appraisal & compensation revision cycle runs from Feb to March, effective April 1st. Mid-year performance check-in conducted in October.',
  work_hours_and_shifts: `• Standard General Shift: 09:30 AM to 06:30 PM (Mon-Fri, 1-hour lunch break).
• Minimum Work Hours: Full Day = 8+ hours active; Half Day = 4 to 7.99 hours; Absent = Under 4 hours.
• Grace Period: 15 minutes grace on clock-in (up to 09:45 AM). 3 late marks in a month deduct 0.5 day Casual Leave.
• Overtime Policy: Non-exempt employees working > 45 hours/week compensated at 1.5x hourly rate upon manager sign-off.`,
  payroll_and_deductions: `• Loss of Pay (LOP) Formula: Per Day Wage = Monthly Gross / Total Calendar Days in Month. LOP Deduction = Per Day Wage * Unpaid Days.
• Provident Fund (PF): 12% employee contribution + 12% employer contribution on Basic Pay (statutory ceiling ₹15,000/month basic).
• ESIC: 0.75% employee + 3.25% employer applicable on gross salary <= ₹21,000/month.
• Professional Tax (PT): State-specific tiered slab deducted monthly (e.g. ₹200/month standard).
• TDS (Income Tax): Deducted monthly based on declaration under Old vs New Tax Regime.`
};

const DOMAIN_TERMINOLOGY_MAPPINGS = [
  { term: 'CTC', meaning: 'Cost to Company (total annual gross compensation including base pay, allowances, employer PF, gratuity, and statutory benefits)' },
  { term: 'In-Hand / Take-Home', meaning: 'Net monthly salary credited to bank after TDS, PF, ESIC, PT, and LOP deductions' },
  { term: 'Basic Pay', meaning: 'Fixed core compensation component (typically 40-50% of CTC) used as base for PF, Gratuity, and LOP calculations' },
  { term: 'HRA', meaning: 'House Rent Allowance (component of salary eligible for tax exemption under Section 10(13A))' },
  { term: 'Special Allowance', meaning: 'Balancing component of monthly salary subject to standard tax' },
  { term: 'LOP / LWP', meaning: 'Loss of Pay / Leave Without Pay (unpaid days deducted from monthly salary)' },
  { term: 'WFH / WFO', meaning: 'Work From Home / Work From Office (maps to attendance status & remote work logging)' },
  { term: 'PF / EPF / UAN', meaning: 'Employees Provident Fund / Universal Account Number (12-digit permanent retirement account ID)' },
  { term: 'ESIC', meaning: 'Employee State Insurance Corporation medical health insurance for employees earning <= ₹21,000/month' },
  { term: 'TDS / Form 16', meaning: 'Tax Deducted at Source by employer / Annual certificate of tax deducted issued in Form 16 Part A & B' },
  { term: 'PAN', meaning: 'Permanent Account Number (10-digit alphanumeric tax identifier mandatory for salary credit)' },
  { term: 'OD / On Duty', meaning: 'Official off-site client or field visit counted as full working attendance' },
  { term: 'FN / AN', meaning: 'Forenoon session / Afternoon session (half-day leaves & shift splits)' },
  { term: 'Comp-Off', meaning: 'Compensatory off-day earned by working on a designated rest day or public holiday' },
  { term: 'PIP', meaning: 'Performance Improvement Plan (structured 30-90 day monitoring plan for underperformance)' },
  { term: 'Notice Period', meaning: 'Standard contractual period (30 to 90 days) required between resignation submission and last working day' },
  { term: 'F&F', meaning: 'Full & Final Settlement (exit reconciliation of unpaid salary, leave encashment, gratuity, and asset handover clearance)' },
  { term: 'Regularization', meaning: 'Attendance discrepancy adjustment requested by employee for forgotten swipe or biometric failure' },
  { term: 'POSH', meaning: 'Prevention of Sexual Harassment compliance & Internal Complaints Committee (ICC) framework' },
  { term: 'Probation Confirmation', meaning: 'Formal evaluation process at end of 90 days transitioning employee from probation to permanent staff' }
];

const COMMON_JUDGMENT_RULES = [
  'Negative Leave Balance Handling: If an employee requests leave that would cause their available balance to drop below zero, do NOT block outright with a cold error. Proactively flag the shortfall and politely ask if they want the excess days logged as unpaid leave (Loss of Pay / LOP) or if they wish to apply for a manager special approval override.',
  'Salary Revision Approval Hierarchy: If a user asks to modify, raise, or update an employee salary, always verify if there is an approved appraisal, promotion record, or pending approval workflow before executing direct adjustments. Remind admins of compensation change audit trails.',
  'Probationary & Notice Period Restrictions: Employees on probation (<90 days) or currently serving notice periods have restricted access to leave encashment, personal salary advances, and long sabbaticals. Proactively highlight policy constraints when actions involve them.',
  'Attendance Regularization vs Penalty: When an employee reports a missed clock-in or biometric discrepancy, encourage submitting an attendance regularization request with a stated business reason rather than marking an immediate penalty.',
  'Statutory & Tax Integrity: Never fabricate or guess PAN, UAN, Bank Account, IFSC, or Tax slab numbers. If statutory parameters are missing during onboarding, prompt for them clearly.',
  'Punctuality & Half-Day Grace: Calculate total active work hours accurately. If hours are between 4 and 7.99 hours, classify as half-day. If < 4 hours, prompt for regularization or mark absent/LOP.',
  'Exit & Full & Final (F&F): Remind HR/Admins that employee deactivation initiates asset recovery (laptop, ID badge, access cards), access revocation, and triggers the 30-day F&F payout workflow.',
  'Empathetic yet Compliant Tone: Provide clear, concise, actionable HR guidance that balances employee well-being with organizational policy and legal compliance.'
];

/**
 * Builds the structured Organization Knowledge Context string for prompt injection
 * @param {Object} customConfig - Optional policy overrides
 * @returns {string} Formatted context ready for system prompt injection
 */
function getOrganizationKnowledgeContext(customConfig = {}) {
  const policies = { ...DEFAULT_HR_POLICIES, ...customConfig };

  const policySection = `COMPANY HR POLICIES & OPERATIONAL RULES:
- Probation Period: ${policies.probation_period_days} days. Employees on probation are not eligible for ${policies.policy_restrictions}.
- Leave Policy & Accruals:
${policies.leave_types_and_accrual_rules}
- Approval Hierarchy:
${policies.who_approves_what}
- Work Hours & Shift Guidelines:
${policies.work_hours_and_shifts}
- Payroll, Deductions & Taxes:
${policies.payroll_and_deductions}
- Salary Revision & Appraisal Cycle:
${policies.cycle_details}`;

  const terminologySection = `DOMAIN TERMINOLOGY MAPPING (HR Acronyms & Jargon):
${DOMAIN_TERMINOLOGY_MAPPINGS.map(t => `- "${t.term}" = ${t.meaning}`).join('\n')}`;

  const judgmentSection = `COMMON JUDGMENT RULES (Tacit HR Operational Intelligence):
${COMMON_JUDGMENT_RULES.map(r => `- ${r}`).join('\n')}`;

  return `ORGANIZATION KNOWLEDGE CONTEXT:
${policySection}

${terminologySection}

${judgmentSection}`;
}

/**
 * Asynchronously fetches tenant-specific policies from the database if available,
 * merged on top of default enterprise policies.
 */
async function getDynamicOrgKnowledgeContext(tenantId) {
  let dbPolicies = {};
  if (tenantId && tenantId !== 'shared') {
    try {
      const pRes = await query('SELECT title, content, category FROM company_policies LIMIT 50');
      if (pRes?.rows?.length > 0) {
        pRes.rows.forEach(r => {
          const key = (r.category || r.title || '').toLowerCase().replace(/\s+/g, '_');
          dbPolicies[key] = r.content;
        });
      }
    } catch (_) {
      // Graceful fallback to default enterprise policies
    }
  }
  return getOrganizationKnowledgeContext(dbPolicies);
}

module.exports = {
  DEFAULT_HR_POLICIES,
  DOMAIN_TERMINOLOGY_MAPPINGS,
  COMMON_JUDGMENT_RULES,
  getOrganizationKnowledgeContext,
  getDynamicOrgKnowledgeContext
};
