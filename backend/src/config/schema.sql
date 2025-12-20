-- Advanced HRMS Pro Database Schema
-- PostgreSQL Database

-- Drop tables if exists (for clean setup)
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS job_applications CASCADE;
DROP TABLE IF EXISTS job_postings CASCADE;
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS task_assignments CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Users table (Authentication)
CREATE TABLE users (
  user_id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'employee',
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
CREATE TABLE departments (
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
CREATE TABLE employees (
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE attendance (
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
CREATE TABLE leave_requests (
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
CREATE TABLE tasks (
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
CREATE TABLE task_assignments (
  assignment_id SERIAL PRIMARY KEY,
  task_id INTEGER REFERENCES tasks(task_id) ON DELETE CASCADE,
  employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(task_id, employee_id)
);

-- Task Updates table (Daily updates from assigned employees)
CREATE TABLE task_updates (
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
CREATE TABLE payroll (
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
CREATE TABLE job_postings (
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
CREATE TABLE job_applications (
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
CREATE TABLE documents (
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
CREATE TABLE chat_messages (
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

-- Settings table
CREATE TABLE settings (
  setting_id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  category VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Templates table
CREATE TABLE email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  variables JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_user ON employees(user_id);
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_leave_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_status ON leave_requests(status);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_task_updates_task ON task_updates(task_id);
CREATE INDEX idx_task_updates_employee ON task_updates(employee_id);
CREATE INDEX idx_payroll_employee ON payroll(employee_id);
CREATE INDEX idx_payroll_date ON payroll(month, year);
CREATE INDEX idx_applications_job ON job_applications(job_id);
CREATE INDEX idx_documents_employee ON documents(employee_id);
CREATE INDEX idx_chat_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_receiver ON chat_messages(receiver_id);
CREATE INDEX idx_email_templates_name ON email_templates(name);

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

-- Design System Settings
('design_primary_color', '#8cc63f', 'design', 'Primary brand color for buttons and highlights'),
('design_secondary_color', '#2c3e50', 'design', 'Secondary brand color for headers and sidebars'),
('design_success_color', '#10b981', 'design', 'Success color for positive actions and status'),
('design_warning_color', '#f59e0b', 'design', 'Warning color for cautionary actions and status'),
('design_danger_color', '#ef4444', 'design', 'Danger color for destructive actions and errors'),
('design_info_color', '#3b82f6', 'design', 'Info color for informational elements'),
('design_font_family', 'Inter', 'design', 'Font family for the application'),
('design_font_size_base', '14px', 'design', 'Base font size for the application'),
('design_font_size_sm', '12px', 'design', 'Small font size for the application'),
('design_font_size_lg', '16px', 'design', 'Large font size for the application'),
('design_border_radius', '6px', 'design', 'Border radius for UI elements'),
('design_border_radius_sm', '4px', 'design', 'Small border radius for UI elements'),
('design_border_radius_lg', '8px', 'design', 'Large border radius for UI elements'),
('design_spacing_unit', '4px', 'design', 'Base spacing unit for the design system'),
('design_card_shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 'design', 'Shadow for card components'),
('design_button_shadow', '0 1px 2px 0 rgba(0, 0, 0, 0.05)', 'design', 'Shadow for button components'),
('design_sidebar_width', '280px', 'design', 'Width of the sidebar'),
('design_header_height', '64px', 'design', 'Height of the header'),
('design_button_padding_x', '12px', 'design', 'Horizontal padding for buttons'),
('design_button_padding_y', '6px', 'design', 'Vertical padding for buttons'),
('design_card_padding', '16px', 'design', 'Padding for card components'),
('design_input_height', '36px', 'design', 'Height for input elements'),

-- Module-specific Design Settings
('design_dashboard_widget_bg', '#ffffff', 'design', 'Background color for dashboard widgets'),
('design_dashboard_widget_border', '#e5e7eb', 'design', 'Border color for dashboard widgets'),
('design_dashboard_widget_radius', '8px', 'design', 'Border radius for dashboard widgets'),
('design_dashboard_widget_shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 'design', 'Shadow for dashboard widgets'),
('design_employee_card_bg', '#ffffff', 'design', 'Background color for employee cards'),
('design_employee_card_border', '#e5e7eb', 'design', 'Border color for employee cards'),
('design_employee_card_radius', '8px', 'design', 'Border radius for employee cards'),
('design_employee_card_shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.1)', 'design', 'Shadow for employee cards'),
('design_table_row_hover', '#f9fafb', 'design', 'Background color for table row hover'),
('design_table_border', '#e5e7eb', 'design', 'Border color for tables'),
('design_nav_active_bg', '#8cc63f20', 'design', 'Background color for active navigation items'),
('design_nav_active_border', '#8cc63f', 'design', 'Border color for active navigation items'),
('design_badge_radius', '12px', 'design', 'Border radius for badges'),
('design_form_group_spacing', '16px', 'design', 'Spacing between form groups'),
('design_modal_backdrop', 'rgba(0, 0, 0, 0.5)', 'design', 'Backdrop color for modals'),
('design_chart_primary', '#8cc63f', 'design', 'Primary color for charts'),
('design_chart_secondary', '#2c3e50', 'design', 'Secondary color for charts'),
('design_chart_success', '#10b981', 'design', 'Success color for charts'),
('design_chart_warning', '#f59e0b', 'design', 'Warning color for charts'),
('design_chart_danger', '#ef4444', 'design', 'Danger color for charts'),
('design_progress_bar_height', '8px', 'design', 'Height of progress bars'),
('design_progress_bar_radius', '4px', 'design', 'Border radius for progress bars'),
('design_avatar_size_sm', '24px', 'design', 'Small avatar size'),
('design_avatar_size_md', '32px', 'design', 'Medium avatar size'),
('design_avatar_size_lg', '48px', 'design', 'Large avatar size'),
('design_tooltip_bg', '#1f2937', 'design', 'Background color for tooltips'),
('design_tooltip_text', '#ffffff', 'design', 'Text color for tooltips'),
('design_pagination_active', '#8cc63f', 'design', 'Active pagination item color'),

-- Additional Module-specific Design Settings
-- Recruitment Module
('design_recruitment_card_bg', '#ffffff', 'design', 'Background color for recruitment cards'),
('design_recruitment_card_border', '#e5e7eb', 'design', 'Border color for recruitment cards'),
('design_recruitment_status_badge_radius', '12px', 'design', 'Border radius for recruitment status badges'),

-- Performance Module
('design_performance_chart_height', '300px', 'design', 'Height of performance charts'),
('design_performance_review_card_bg', '#ffffff', 'design', 'Background color for performance review cards'),
('design_performance_rating_star_color', '#f59e0b', 'design', 'Color for performance rating stars'),

-- Payroll Module
('design_payroll_summary_card_bg', '#ffffff', 'design', 'Background color for payroll summary cards'),
('design_payroll_item_border', '#e5e7eb', 'design', 'Border color for payroll items'),

-- Leave Module
('design_leave_request_card_bg', '#ffffff', 'design', 'Background color for leave request cards'),
('design_leave_calendar_cell_height', '100px', 'design', 'Height of leave calendar cells'),
('design_leave_status_approved_color', '#10b981', 'design', 'Color for approved leave status'),
('design_leave_status_pending_color', '#f59e0b', 'design', 'Color for pending leave status'),
('design_leave_status_rejected_color', '#ef4444', 'design', 'Color for rejected leave status'),

-- Attendance Module
('design_attendance_chart_height', '300px', 'design', 'Height of attendance charts'),
('design_attendance_status_present_color', '#10b981', 'design', 'Color for present attendance status'),
('design_attendance_status_absent_color', '#ef4444', 'design', 'Color for absent attendance status'),
('design_attendance_status_late_color', '#f59e0b', 'design', 'Color for late attendance status'),

-- Task Module
('design_task_card_bg', '#ffffff', 'design', 'Background color for task cards'),
('design_task_priority_high_color', '#ef4444', 'design', 'Color for high priority tasks'),
('design_task_priority_medium_color', '#f59e0b', 'design', 'Color for medium priority tasks'),
('design_task_priority_low_color', '#10b981', 'design', 'Color for low priority tasks'),
('design_task_status_todo_color', '#f59e0b', 'design', 'Color for todo task status'),
('design_task_status_inprogress_color', '#3b82f6', 'design', 'Color for in-progress task status'),
('design_task_status_completed_color', '#10b981', 'design', 'Color for completed task status'),
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
('api_rate_limit', '1000', 'system', 'API requests per hour per user');

-- Insert default email templates
INSERT INTO email_templates (name, subject, body_html, body_text, variables) VALUES
('welcome_employee', 'Welcome to {{company_name}} - Your Account Details', '
<h2>Welcome to {{company_name}}, {{first_name}}!</h2>
<p>We''re excited to have you join our team.</p>
<p>Your account has been created with the following details:</p>
<ul>
    <li>Email: {{email}}</li>
    <li>Position: {{position}}</li>
    <li>Department: {{department}}</li>
    <li>Start Date: {{start_date}}</li>
</ul>
<p>You can login to our HR portal using your email and the temporary password: <strong>{{temp_password}}</strong></p>
<p>Please change your password after your first login.</p>
<br>
<p>Best regards,<br>The HR Team</p>
', '
Welcome to {{company_name}}, {{first_name}}!

We''re excited to have you join our team.

Your account has been created with the following details:
- Email: {{email}}
- Position: {{position}}
- Department: {{department}}
- Start Date: {{start_date}}

You can login to our HR portal using your email and the temporary password: {{temp_password}}

Please change your password after your first login.

Best regards,
The HR Team
', '{"company_name": {"required": true, "type": "string", "description": "Company name"}, "first_name": {"required": true, "type": "string", "description": "Employee first name"}, "email": {"required": true, "type": "string", "description": "Employee email"}, "position": {"required": true, "type": "string", "description": "Employee position"}, "department": {"required": true, "type": "string", "description": "Employee department"}, "start_date": {"required": true, "type": "string", "description": "Employee start date"}, "temp_password": {"required": true, "type": "string", "description": "Temporary password"}}'),
('leave_request_submitted', 'Leave Request Submitted - {{employee_name}}', '
<h2>Leave Request Submitted</h2>
<p>{{employee_name}} has submitted a leave request with the following details:</p>
<ul>
    <li>Type: {{leave_type}}</li>
    <li>Dates: {{start_date}} to {{end_date}}</li>
    <li>Reason: {{reason}}</li>
</ul>
<p>Please review this request in the HR portal.</p>
<br>
<p>Best regards,<br>The HR System</p>
', '
Leave Request Submitted

{{employee_name}} has submitted a leave request with the following details:
- Type: {{leave_type}}
- Dates: {{start_date}} to {{end_date}}
- Reason: {{reason}}

Please review this request in the HR portal.

Best regards,
The HR System
', '{"employee_name": {"required": true, "type": "string", "description": "Employee name"}, "leave_type": {"required": true, "type": "string", "description": "Type of leave"}, "start_date": {"required": true, "type": "string", "description": "Leave start date"}, "end_date": {"required": true, "type": "string", "description": "Leave end date"}, "reason": {"required": true, "type": "string", "description": "Reason for leave"}}'),
('leave_request_approved', 'Your Leave Request Has Been Approved', '
<h2>Leave Request Approved</h2>
<p>Hello {{employee_name}},</p>
<p>Your leave request has been approved.</p>
<ul>
    <li>Type: {{leave_type}}</li>
    <li>Dates: {{start_date}} to {{end_date}}</li>
</ul>
<p>If you have any questions, please contact your manager.</p>
<br>
<p>Best regards,<br>The HR Team</p>
', '
Leave Request Approved

Hello {{employee_name}},

Your leave request has been approved.

- Type: {{leave_type}}
- Dates: {{start_date}} to {{end_date}}

If you have any questions, please contact your manager.

Best regards,
The HR Team
', '{"employee_name": {"required": true, "type": "string", "description": "Employee name"}, "leave_type": {"required": true, "type": "string", "description": "Type of leave"}, "start_date": {"required": true, "type": "string", "description": "Leave start date"}, "end_date": {"required": true, "type": "string", "description": "Leave end date"}}'),
('payroll_generated', 'Payroll Processed for {{month_year}}', '
<h2>Payroll Processed</h2>
<p>Hello {{employee_name}},</p>
<p>Your payroll for {{month_year}} has been processed.</p>
<ul>
    <li>Gross Salary: {{gross_salary}}</li>
    <li>Deductions: {{deductions}}</li>
    <li>Net Pay: {{net_pay}}</li>
    <li>Payment Date: {{payment_date}}</li>
</ul>
<p>Payslip is attached to this email.</p>
<br>
<p>Best regards,<br>The Finance Team</p>
', '
Payroll Processed

Hello {{employee_name}},

Your payroll for {{month_year}} has been processed.

- Gross Salary: {{gross_salary}}
- Deductions: {{deductions}}
- Net Pay: {{net_pay}}
- Payment Date: {{payment_date}}

Payslip is attached to this email.

Best regards,
The Finance Team
', '{"employee_name": {"required": true, "type": "string", "description": "Employee name"}, "month_year": {"required": true, "type": "string", "description": "Month and year of payroll"}, "gross_salary": {"required": true, "type": "string", "description": "Gross salary amount"}, "deductions": {"required": true, "type": "string", "description": "Total deductions"}, "net_pay": {"required": true, "type": "string", "description": "Net pay amount"}, "payment_date": {"required": true, "type": "string", "description": "Payment date"}}');

-- Create default admin user (password: admin123)
INSERT INTO users (email, password_hash, role) VALUES
('admin@hrmspro.com', '$2b$10$ZI0JCV5V.vT7b4sMK/FUA.xOFngGT9VQ64TK.ug4EvYwlda2FyTou', 'admin');
