-- Tenant Schema Template
-- This SQL file is run for EACH tenant to create their isolated tables.

-- Users table (Authentication)
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
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
  status VARCHAR(50) DEFAULT 'present',
  work_hours DECIMAL(5, 2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(employee_id, date)
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


