-- Tenant Schema Template
-- This SQL file is run for EACH tenant to create their isolated tables.

-- Users table (Authentication & User Identity)
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  avatar VARCHAR(500),
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  two_factor_secret VARCHAR(255),
  is_two_factor_enabled BOOLEAN DEFAULT false,
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  auth_provider VARCHAR(50) DEFAULT 'local',
  auth_provider_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  department_id SERIAL PRIMARY KEY,
  department_name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id INTEGER,
  budget DECIMAL(15, 2),
  location VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  employee_id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  address TEXT,
  department_id INTEGER REFERENCES departments(department_id) ON DELETE SET NULL,
  position VARCHAR(100),
  hire_date DATE NOT NULL,
  termination_date DATE,
  salary DECIMAL(15, 2),
  employment_type VARCHAR(50),
  status VARCHAR(50) DEFAULT 'active',
  profile_image VARCHAR(500),
  reporting_manager_id INTEGER REFERENCES employees(employee_id),
  social_links JSONB DEFAULT '{}',
  education JSONB DEFAULT '[]',
  experience JSONB DEFAULT '[]',
  about_me TEXT,
  biometric_id VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  attendance_id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  clock_in TIME,
  clock_out TIME,
  check_in_latitude DECIMAL(10, 8),
  check_in_longitude DECIMAL(10, 8),
  check_out_latitude DECIMAL(10, 8),
  check_out_longitude DECIMAL(10, 8),
  location_status VARCHAR(50),
  status VARCHAR(50) DEFAULT 'present',
  work_hours DECIMAL(5, 2),
  notes TEXT,
  device_serial VARCHAR(100),
  punch_source VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date)
);

-- Attendance Regularization table
CREATE TABLE IF NOT EXISTS attendance_regularization (
  regularization_id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  original_clock_in TIME,
  original_clock_out TIME,
  requested_clock_in TIME NOT NULL,
  requested_clock_out TIME NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave Requests table
CREATE TABLE IF NOT EXISTS leave_requests (
  leave_id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  leave_type VARCHAR(50) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days_count INTEGER NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(user_id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  task_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'todo',
  due_date DATE,
  created_by INTEGER REFERENCES users(user_id),
  department_id INTEGER REFERENCES departments(department_id),
  estimated_hours DECIMAL(5, 2),
  actual_hours DECIMAL(5, 2),
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Task Assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  assignment_id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, employee_id)
);

-- Task Updates table (Daily updates from assigned employees)
CREATE TABLE IF NOT EXISTS task_updates (
  update_id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  update_text TEXT NOT NULL,
  hours_spent DECIMAL(5, 2),
  progress_percentage INTEGER,
  status VARCHAR(50),
  attachments TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shift Rostering tables
CREATE TABLE IF NOT EXISTS shifts (
  shift_id SERIAL PRIMARY KEY,
  shift_name VARCHAR(50) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS employee_shifts (
  assignment_id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  shift_id INTEGER REFERENCES shifts(shift_id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  assigned_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payroll table
CREATE TABLE IF NOT EXISTS payroll (
  payroll_id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  basic_salary DECIMAL(15, 2) NOT NULL,
  allowances DECIMAL(15, 2) DEFAULT 0,
  deductions DECIMAL(15, 2) DEFAULT 0,
  overtime_pay DECIMAL(15, 2) DEFAULT 0,
  bonus DECIMAL(15, 2) DEFAULT 0,
  tax DECIMAL(15, 2) DEFAULT 0,
  net_salary DECIMAL(15, 2) NOT NULL,
  payment_date DATE,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, month, year)
);

-- Payroll Runs table (batch payroll processing)
CREATE TABLE IF NOT EXISTS payroll_runs (
  run_id SERIAL PRIMARY KEY,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  total_employees INTEGER DEFAULT 0,
  total_gross DECIMAL(15, 2) DEFAULT 0,
  total_deductions DECIMAL(15, 2) DEFAULT 0,
  total_net DECIMAL(15, 2) DEFAULT 0,
  generated_by INTEGER REFERENCES users(user_id),
  finalized_at TIMESTAMP,
  paid_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(period_month, period_year)
);

-- Payslips table (individual employee payslips per run)
CREATE TABLE IF NOT EXISTS payslips (
  payslip_id SERIAL PRIMARY KEY,
  run_id INTEGER REFERENCES payroll_runs(run_id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  payroll_record_id INTEGER REFERENCES payroll(payroll_id) ON DELETE SET NULL,
  basic_salary DECIMAL(15, 2) NOT NULL,
  gross_pay DECIMAL(15, 2) NOT NULL,
  total_deductions DECIMAL(15, 2) NOT NULL,
  net_pay DECIMAL(15, 2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  payment_date DATE,
  payment_method VARCHAR(50),
  pdf_path VARCHAR(500),
  qr_code VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  notes TEXT,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(run_id, employee_id)
);

-- Payslip itemized earnings
CREATE TABLE IF NOT EXISTS payslip_earnings (
  earning_id SERIAL PRIMARY KEY,
  payslip_id INTEGER REFERENCES payslips(payslip_id) ON DELETE CASCADE,
  component_name VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  is_taxable BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payslip itemized deductions
CREATE TABLE IF NOT EXISTS payslip_deductions (
  deduction_id SERIAL PRIMARY KEY,
  payslip_id INTEGER REFERENCES payslips(payslip_id) ON DELETE CASCADE,
  component_name VARCHAR(100) NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Configurable payslip templates (JSON-based layout)
CREATE TABLE IF NOT EXISTS payslip_templates (
  template_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  layout_json JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES users(user_id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email queue for payslip delivery
CREATE TABLE IF NOT EXISTS email_queue (
  queue_id SERIAL PRIMARY KEY,
  payslip_id INTEGER REFERENCES payslips(payslip_id) ON DELETE CASCADE,
  recipient_email VARCHAR(255) NOT NULL,
  recipient_name VARCHAR(255),
  subject VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Postings table (Recruitment)
CREATE TABLE IF NOT EXISTS job_postings (
  job_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  department_id INTEGER REFERENCES departments(department_id),
  position_type VARCHAR(50),
  experience_required VARCHAR(100),
  salary_range VARCHAR(100),
  location VARCHAR(255),
  requirements TEXT,
  responsibilities TEXT,
  status VARCHAR(50) DEFAULT 'open',
  posted_by INTEGER REFERENCES users(user_id),
  posted_date DATE DEFAULT CURRENT_DATE,
  deadline DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Job Applications table
CREATE TABLE IF NOT EXISTS job_applications (
  application_id SERIAL PRIMARY KEY,
  job_id INTEGER REFERENCES job_postings(job_id) ON DELETE CASCADE,
  applicant_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  resume_url VARCHAR(500),
  cover_letter TEXT,
  experience_years INTEGER,
  current_salary DECIMAL(15, 2),
  expected_salary DECIMAL(15, 2),
  status VARCHAR(50) DEFAULT 'submitted',
  interview_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  document_id SERIAL PRIMARY KEY,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_size INTEGER,
  uploaded_by INTEGER REFERENCES users(user_id),
  description TEXT,
  is_confidential BOOLEAN DEFAULT false,
  expiry_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  message_id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  attachment_url VARCHAR(500),
  attachment_type VARCHAR(50),
  attachment_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Message Reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  reaction_id SERIAL PRIMARY KEY,
  message_id INTEGER REFERENCES chat_messages(message_id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
  reaction VARCHAR(10) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(message_id, user_id)
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  asset_id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'Hardware', 'Software', 'License', 'Other'
  serial_number VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'Available', -- 'Available', 'Assigned', 'Maintenance', 'Retired'
  assigned_to INTEGER REFERENCES employees(employee_id) ON DELETE SET NULL,
  department_id INTEGER REFERENCES departments(department_id) ON DELETE SET NULL,
  purchase_date DATE,
  cost DECIMAL(15, 2),
  vendor VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  setting_id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_user ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_task_updates_task ON task_updates(task_id);
CREATE INDEX IF NOT EXISTS idx_task_updates_employee ON task_updates(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee ON payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_date ON payroll(month, year);
CREATE INDEX IF NOT EXISTS idx_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_documents_employee ON documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_receiver ON chat_messages(receiver_id);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, category, description) VALUES
-- General Settings
('company_name', 'HRMS Pro', 'general', 'Company name'),
('company_email', 'info@hrmspro.com', 'general', 'Company email'),
('company_phone', '+1-234-567-8900', 'general', 'Company phone number'),
('company_address', '123 Business Street, City, State 12345', 'general', 'Company address'),
('company_website', 'https://hrmspro.com', 'general', 'Company website'),
('company_logo_url', '', 'general', 'Company logo URL'),
('timezone', 'America/New_York', 'general', 'Default timezone'),
('date_format', 'MM/DD/YYYY', 'general', 'Date format'),
('language', 'en', 'general', 'Default language'),

-- Attendance Settings
('working_hours', '8', 'attendance', 'Standard working hours per day'),
('working_days', '5', 'attendance', 'Working days per week'),
('overtime_enabled', 'true', 'attendance', 'Enable overtime tracking'),
('overtime_rate', '1.5', 'attendance', 'Overtime pay multiplier'),
('late_arrival_threshold', '15', 'attendance', 'Late arrival threshold in minutes'),
('early_departure_threshold', '15', 'attendance', 'Early departure threshold in minutes'),
('auto_clock_out', 'true', 'attendance', 'Auto clock-out at end of day'),
('grace_period', '10', 'attendance', 'Grace period for clock-in (minutes)'),
('break_time', '60', 'attendance', 'Default break time in minutes'),

-- Leave Settings
('leave_types', '["Sick Leave", "Casual Leave", "Vacation", "Maternity Leave", "Paternity Leave", "Bereavement Leave", "Unpaid Leave"]', 'leave', 'Available leave types'),
('annual_leave_days', '20', 'leave', 'Annual leave days per employee'),
('sick_leave_days', '10', 'leave', 'Sick leave days per employee'),
('casual_leave_days', '12', 'leave', 'Casual leave days per employee'),
('carry_forward_enabled', 'true', 'leave', 'Allow leave carry forward to next year'),
('max_carry_forward_days', '5', 'leave', 'Maximum days that can be carried forward'),
('leave_approval_required', 'true', 'leave', 'Require manager approval for leave'),
('advance_notice_days', '3', 'leave', 'Minimum days notice for leave request'),
('negative_balance_allowed', 'false', 'leave', 'Allow negative leave balance'),

-- Payroll Settings
('currency', 'USD', 'payroll', 'Default currency'),
('currency_symbol', '$', 'payroll', 'Currency symbol'),
('pay_frequency', 'monthly', 'payroll', 'Pay frequency (weekly, bi-weekly, monthly)'),
('tax_enabled', 'true', 'payroll', 'Enable tax calculations'),
('default_tax_rate', '20', 'payroll', 'Default tax rate percentage'),
('social_security_rate', '6.2', 'payroll', 'Social security tax rate percentage'),
('medicare_rate', '1.45', 'payroll', 'Medicare tax rate percentage'),
('bonus_enabled', 'true', 'payroll', 'Enable bonus payments'),
('allowances_enabled', 'true', 'payroll', 'Enable allowances'),
('deductions_enabled', 'true', 'payroll', 'Enable deductions'),
('payslip_generation', 'true', 'payroll', 'Auto-generate payslips'),
('default_allowances', '0', 'payroll', 'Default allowances amount'),
('late_arrival_deduction_rate', '1', 'payroll', 'Deduction rate for late arrivals (%)'),
('early_departure_deduction_rate', '1', 'payroll', 'Deduction rate for early departures (%)'),

-- Recruitment Settings
('job_posting_enabled', 'true', 'recruitment', 'Enable job posting'),
('application_deadline_days', '30', 'recruitment', 'Default application deadline in days'),
('interview_rounds', '3', 'recruitment', 'Default number of interview rounds'),
('auto_reject_after_days', '90', 'recruitment', 'Auto-reject inactive applications after days'),
('background_check_required', 'true', 'recruitment', 'Require background check'),
('reference_check_required', 'true', 'recruitment', 'Require reference check'),

-- Performance Settings
('performance_review_enabled', 'true', 'performance', 'Enable performance reviews'),
('review_cycle', 'annual', 'performance', 'Review cycle (quarterly, semi-annual, annual)'),
('self_assessment_enabled', 'true', 'performance', 'Enable employee self-assessment'),
('360_feedback_enabled', 'true', 'performance', 'Enable 360-degree feedback'),
('goal_setting_enabled', 'true', 'performance', 'Enable goal setting'),

-- Security Settings
('password_min_length', '8', 'security', 'Minimum password length'),
('password_require_uppercase', 'true', 'security', 'Require uppercase in password'),
('password_require_number', 'true', 'security', 'Require number in password'),
('password_require_special', 'true', 'security', 'Require special character in password'),
('password_expiry_days', '90', 'security', 'Password expiry in days'),
('max_login_attempts', '5', 'security', 'Maximum login attempts before lockout'),
('session_timeout', '60', 'security', 'Session timeout in minutes'),
('two_factor_auth', 'false', 'security', 'Enable two-factor authentication'),

-- Notification Settings
('email_notifications', 'true', 'notifications', 'Enable email notifications'),
('sms_notifications', 'false', 'notifications', 'Enable SMS notifications'),
('push_notifications', 'true', 'notifications', 'Enable push notifications'),
('notify_leave_approval', 'true', 'notifications', 'Notify on leave approval/rejection'),
('notify_payroll', 'true', 'notifications', 'Notify on payroll processing'),
('notify_attendance', 'true', 'notifications', 'Notify on attendance issues'),
('notify_tasks', 'true', 'notifications', 'Notify on task assignments'),

-- Mobile App Settings
('mobile_app_enabled', 'true', 'mobile', 'Enable mobile app access'),
('mobile_feature_dashboard', 'true', 'mobile', 'Allow dashboard in mobile app'),
('mobile_feature_attendance', 'true', 'mobile', 'Allow attendance in mobile app'),
('mobile_feature_leaves', 'true', 'mobile', 'Allow leave management in mobile app'),
('mobile_feature_tasks', 'true', 'mobile', 'Allow tasks in mobile app'),
('mobile_feature_chat', 'true', 'mobile', 'Allow chat in mobile app'),
('mobile_feature_employees', 'true', 'mobile', 'Allow employee directory in mobile app'),
('mobile_feature_departments', 'true', 'mobile', 'Allow department browsing in mobile app'),
('mobile_feature_payroll', 'true', 'mobile', 'Allow payroll in mobile app'),
('mobile_feature_documents', 'true', 'mobile', 'Allow documents in mobile app'),
('mobile_feature_recruitment', 'true', 'mobile', 'Allow recruitment in mobile app'),
('mobile_feature_performance', 'true', 'mobile', 'Allow performance in mobile app'),
('mobile_feature_reports', 'true', 'mobile', 'Allow reports in mobile app'),
('mobile_feature_assets', 'true', 'mobile', 'Allow assets in mobile app'),
('mobile_feature_holidays', 'true', 'mobile', 'Allow holidays in mobile app'),
('mobile_feature_shifts', 'true', 'mobile', 'Allow shifts in mobile app'),
('mobile_feature_audit_logs', 'false', 'mobile', 'Allow audit logs in mobile app'),
('mobile_feature_tenants', 'false', 'mobile', 'Allow tenant management in mobile app'),
('mobile_feature_cms', 'false', 'mobile', 'Allow CMS management in mobile app'),
('mobile_feature_leads', 'false', 'mobile', 'Allow lead/demo management in mobile app'),
('mobile_feature_biometric_login', 'true', 'mobile', 'Allow biometric login in mobile app'),
('mobile_feature_2fa_required', 'false', 'mobile', 'Require 2FA for mobile login'),
('mobile_feature_secure_storage', 'true', 'mobile', 'Require secure storage for mobile credentials'),
('mobile_feature_push_notifications', 'true', 'mobile', 'Enable push notifications on mobile app'),

-- Document Settings
('max_file_size', '10', 'documents', 'Maximum file size in MB'),
('allowed_file_types', '["pdf", "doc", "docx", "jpg", "png", "xlsx"]', 'documents', 'Allowed file types'),
('document_retention_days', '2555', 'documents', 'Document retention period in days (7 years)'),
('auto_archive', 'true', 'documents', 'Auto-archive old documents'),

-- System Settings
('maintenance_mode', 'false', 'system', 'Enable maintenance mode'),
('backup_enabled', 'true', 'system', 'Enable automatic backups'),
('backup_frequency', 'daily', 'system', 'Backup frequency'),
('data_retention_days', '365', 'system', 'Data retention period in days'),
('audit_logging', 'true', 'system', 'Enable audit logging'),
('api_rate_limit', '1000', 'system', 'API requests per hour per user')
ON CONFLICT (setting_key) DO NOTHING;

-- ============================================================================
-- Support Module Tables
-- ============================================================================

CREATE TABLE IF NOT EXISTS faq_categories (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS faq_articles (
  article_id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES faq_categories(category_id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords JSONB DEFAULT '[]'::jsonb,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_agents (
  agent_id SERIAL PRIMARY KEY,
  user_id INTEGER,
  is_available BOOLEAN DEFAULT true,
  max_concurrent_chats INTEGER DEFAULT 5,
  current_chats INTEGER DEFAULT 0,
  auto_assign BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_chats (
  chat_id SERIAL PRIMARY KEY,
  user_id INTEGER,
  agent_id INTEGER,
  status VARCHAR(50) DEFAULT 'active',
  source VARCHAR(50) DEFAULT 'widget',
  is_ai_active BOOLEAN DEFAULT true,
  ai_confidence DECIMAL(5,4),
  department VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'normal',
  unread_count INTEGER DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_messages (
  message_id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES support_chats(chat_id) ON DELETE CASCADE,
  sender_id INTEGER,
  sender_type VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(50) DEFAULT 'text',
  attachment_url VARCHAR(500),
  attachment_name VARCHAR(255),
  attachment_size INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_tickets (
  ticket_id SERIAL PRIMARY KEY,
  ticket_number VARCHAR(50) UNIQUE NOT NULL,
  user_id INTEGER,
  assigned_to INTEGER,
  chat_id INTEGER,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  priority VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'open',
  source VARCHAR(50) DEFAULT 'auto',
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ticket_comments (
  comment_id SERIAL PRIMARY KEY,
  ticket_id INTEGER REFERENCES support_tickets(ticket_id) ON DELETE CASCADE,
  user_id INTEGER,
  comment TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false,
  attachment_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_logs (
  log_id SERIAL PRIMARY KEY,
  chat_id INTEGER REFERENCES support_chats(chat_id) ON DELETE CASCADE,
  user_id INTEGER,
  query_text TEXT NOT NULL,
  response_text TEXT,
  provider VARCHAR(50) NOT NULL,
  confidence DECIMAL(5,4),
  is_faq_match BOOLEAN DEFAULT false,
  faq_article_id INTEGER,
  response_time_ms INTEGER,
  tokens_used INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS canned_replies (
  reply_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  shortcuts JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS support_notification_prefs (
  pref_id SERIAL PRIMARY KEY,
  user_id INTEGER,
  email_new_ticket BOOLEAN DEFAULT true,
  email_ticket_update BOOLEAN DEFAULT true,
  email_chat_assigned BOOLEAN DEFAULT true,
  email_escalation BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



