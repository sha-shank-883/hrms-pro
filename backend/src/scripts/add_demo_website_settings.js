const { pool } = require('../config/database');

async function run() {
  console.log('Adding demo page columns to shared.website_settings...');
  await pool.query(`
    ALTER TABLE shared.website_settings
    ADD COLUMN IF NOT EXISTS demo_headline TEXT DEFAULT 'Try HRMS Pro free for 14 days',
    ADD COLUMN IF NOT EXISTS demo_subheadline TEXT DEFAULT 'Get instant access to a fully-functional HRMS environment. No credit card required, no commitment.',
    ADD COLUMN IF NOT EXISTS demo_features JSONB DEFAULT '[{"text":"Instant auto-provisioning of your demo environment"},{"text":"Full access to all features including payroll and analytics"},{"text":"Pre-loaded sample data to explore immediately"},{"text":"Invite up to 5 team members to evaluate together"},{"text":"Free onboarding call with a product specialist"}]'::jsonb,
    ADD COLUMN IF NOT EXISTS demo_success_title VARCHAR(255) DEFAULT 'Demo Request Received!',
    ADD COLUMN IF NOT EXISTS demo_success_message TEXT DEFAULT 'Thank you for your interest! We are setting up your personalized demo environment. You will receive an email with your login credentials within the next 15 minutes.',
    ADD COLUMN IF NOT EXISTS demo_button_text VARCHAR(100) DEFAULT 'Start Free Trial',
    ADD COLUMN IF NOT EXISTS demo_badge VARCHAR(100) DEFAULT 'Get Started',
    ADD COLUMN IF NOT EXISTS newsletter_show BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS newsletter_headline TEXT DEFAULT 'Stay ahead with HR insights. Get the latest guides and trends delivered weekly.',
    ADD COLUMN IF NOT EXISTS newsletter_placeholder VARCHAR(255) DEFAULT 'Enter your work email',
    ADD COLUMN IF NOT EXISTS newsletter_button VARCHAR(100) DEFAULT 'Subscribe',
    ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '[{"label":"Capterra Best Value 2026","icon":"star"},{"label":"G2 Leader HRMS 2026","icon":"star"},{"label":"Top Rated 4.9/5","icon":"star"},{"label":"SOC 2 Type II Certified","icon":"shield"}]'::jsonb,
    ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[{"label":"SOC 2 Type II","icon":"shield"},{"label":"GDPR Compliant","icon":"check"}]'::jsonb,
    ADD COLUMN IF NOT EXISTS sign_in_label VARCHAR(50) DEFAULT 'Sign In',
    ADD COLUMN IF NOT EXISTS cta_label VARCHAR(50) DEFAULT 'Get a Demo'
  `);
  console.log('Done adding demo/global columns to shared.website_settings');
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
