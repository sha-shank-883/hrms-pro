/**
 * Enterprise Organization Knowledge Context for HR AI Operations
 * Injected into AI system prompts to ground models in HR policies,
 * domain terminology, and expert HR tacit judgment rules.
 */

const DEFAULT_HR_POLICIES = {
  probation_period_days: 90,
  policy_restrictions: 'leave encashment, salary advances, or long-term sabbatical leaves without explicit HR Head sign-off',
  leave_types_and_accrual_rules: '15 Annual/Privilege Leaves (accrued at 1.25 days/month), 10 Sick Leaves, 8 Casual Leaves per calendar year. Unused privilege leaves up to 30 days carry forward.',
  who_approves_what: 'Direct Manager approves leave and attendance regularization; HR approves onboarding, profile updates, and policy exceptions; Finance/Admin sign off on final payroll and salary revisions.',
  cycle_details: 'Annual appraisal and salary revision effective every April, with mid-year performance reviews conducted in October.'
};

const DOMAIN_TERMINOLOGY_MAPPINGS = [
  { term: 'CTC', meaning: 'Cost to Company (gross annual package including basic salary, HRA, allowances, employer PF & statutory benefits)' },
  { term: 'LOP / LWP', meaning: 'Loss of Pay / Leave Without Pay (unpaid days deducted from monthly gross based on per-day wage)' },
  { term: 'WFH / WFO', meaning: 'Work From Home / Work From Office (maps to attendance status & remote work logging)' },
  { term: 'PF / EPF / UAN', meaning: 'Employees Provident Fund (12% employee + 12% employer contribution) / Universal Account Number (12-digit statutory ID)' },
  { term: 'ESIC', meaning: 'Employee State Insurance Corporation medical coverage (0.75% employee + 3.25% employer for eligible wage brackets)' },
  { term: 'TDS / Form 16', meaning: 'Tax Deducted at Source based on chosen tax regime (Old vs New) / Annual tax certificate' },
  { term: 'PAN', meaning: 'Permanent Account Number (10-character alphanumeric tax identifier)' },
  { term: 'OD / On Duty', meaning: 'Outdoor official client/field visit counted as full-day attendance' },
  { term: 'FN / AN', meaning: 'Forenoon session / Afternoon session (half-day leaves & shift splits)' },
  { term: 'PIP', meaning: 'Performance Improvement Plan (structured 30-90 day performance review track)' },
  { term: 'Notice Period', meaning: 'Standard 30 to 90 days tenure requirement post-resignation before final settlement' },
  { term: 'F&F', meaning: 'Full & Final Settlement (exit clearance, leave encashment, gratuity, pending dues, and asset recovery)' },
  { term: 'Regularization', meaning: 'Attendance discrepancy correction (e.g. forgotten punch, biometric machine glitch)' }
];

const COMMON_JUDGMENT_RULES = [
  'Negative Leave Balance Handling: If an employee requests leave that would cause their balance to drop below zero, do NOT block outright. Proactively flag the shortfall and offer to record the excess days as unpaid leave (Loss of Pay / LOP) or suggest submitting a manager override request.',
  'Salary Revision Approvals: If a user asks to modify, raise, or update an employee salary, always verify if there is an approved appraisal, promotion record, or pending approval workflow before executing direct adjustments. Remind admins of compensation change audit trails.',
  'Probationary & Exit Restrictions: Employees on probation or currently serving notice periods have restricted access to leave encashment, personal loans, and long sabbaticals. Highlight policy constraints when actions involve them.',
  'Attendance Regularization: When an employee reports a missed clock-in or biometric discrepancy, encourage submitting an attendance regularization request with a stated business reason rather than marking an immediate penalty.',
  'Zero Assumption on Statutory & Financial Details: Never invent or assume PAN, UAN, Bank Account, IFSC, or Tax slab numbers. If statutory parameters are missing during onboarding, prompt for them clearly.',
  'Empathetic yet Compliant Communication: Provide clear, concise, actionable HR guidance that balances employee care with strict organizational compliance.'
];

/**
 * Builds the structured Organization Knowledge Context string for prompt injection
 * @param {Object} customConfig - Optional policy overrides
 * @returns {string} Formatted context ready for system prompt injection
 */
function getOrganizationKnowledgeContext(customConfig = {}) {
  const policies = { ...DEFAULT_HR_POLICIES, ...customConfig };

  const policySection = `COMPANY HR POLICIES:
- Probation period: ${policies.probation_period_days} days. Employees on probation are not eligible for ${policies.policy_restrictions}.
- Leave policy: ${policies.leave_types_and_accrual_rules}
- Approval hierarchy: ${policies.who_approves_what}
- Salary revision cycle: ${policies.cycle_details}`;

  const terminologySection = `DOMAIN TERMINOLOGY MAPPING:
${DOMAIN_TERMINOLOGY_MAPPINGS.map(t => `- "${t.term}" = ${t.meaning}`).join('\n')}`;

  const judgmentSection = `COMMON JUDGMENT RULES (Tacit HR Operational Intelligence):
${COMMON_JUDGMENT_RULES.map(r => `- ${r}`).join('\n')}`;

  return `ORGANIZATION KNOWLEDGE CONTEXT:
${policySection}

${terminologySection}

${judgmentSection}`;
}

module.exports = {
  DEFAULT_HR_POLICIES,
  DOMAIN_TERMINOLOGY_MAPPINGS,
  COMMON_JUDGMENT_RULES,
  getOrganizationKnowledgeContext
};
