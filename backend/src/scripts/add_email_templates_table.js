require('dotenv').config();
const { query } = require('../config/database');

const createEmailTemplatesTable = async () => {
    console.log('📦 Creating email_templates table...');
    
    try {
        // Create the email_templates table
        await query(`
            CREATE TABLE IF NOT EXISTS email_templates (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                subject TEXT NOT NULL,
                body_html TEXT,
                body_text TEXT,
                variables JSONB DEFAULT '{}',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        console.log('✅ Email templates table created successfully');
        
        // Add indexes
        await query(`
            CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name)
        `);
        
        console.log('✅ Indexes created successfully');
        
        // Insert default templates
        console.log('📦 Inserting default email templates...');
        
        const defaultTemplates = [
            {
                name: 'welcome_employee',
                subject: 'Welcome to {{company_name}} - Your Account Details',
                body_html: `
                    <h2>Welcome to {{company_name}}, {{first_name}}!</h2>
                    <p>We're excited to have you join our team.</p>
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
                `,
                body_text: `
                    Welcome to {{company_name}}, {{first_name}}!
                    
                    We're excited to have you join our team.
                    
                    Your account has been created with the following details:
                    - Email: {{email}}
                    - Position: {{position}}
                    - Department: {{department}}
                    - Start Date: {{start_date}}
                    
                    You can login to our HR portal using your email and the temporary password: {{temp_password}}
                    
                    Please change your password after your first login.
                    
                    Best regards,
                    The HR Team
                `,
                variables: {
                    company_name: { required: true, type: 'string', description: 'Company name' },
                    first_name: { required: true, type: 'string', description: 'Employee first name' },
                    email: { required: true, type: 'string', description: 'Employee email' },
                    position: { required: true, type: 'string', description: 'Employee position' },
                    department: { required: true, type: 'string', description: 'Employee department' },
                    start_date: { required: true, type: 'string', description: 'Employee start date' },
                    temp_password: { required: true, type: 'string', description: 'Temporary password' }
                }
            },
            {
                name: 'leave_request_submitted',
                subject: 'Leave Request Submitted - {{employee_name}}',
                body_html: `
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
                `,
                body_text: `
                    Leave Request Submitted
                    
                    {{employee_name}} has submitted a leave request with the following details:
                    - Type: {{leave_type}}
                    - Dates: {{start_date}} to {{end_date}}
                    - Reason: {{reason}}
                    
                    Please review this request in the HR portal.
                    
                    Best regards,
                    The HR System
                `,
                variables: {
                    employee_name: { required: true, type: 'string', description: 'Employee name' },
                    leave_type: { required: true, type: 'string', description: 'Type of leave' },
                    start_date: { required: true, type: 'string', description: 'Leave start date' },
                    end_date: { required: true, type: 'string', description: 'Leave end date' },
                    reason: { required: true, type: 'string', description: 'Reason for leave' }
                }
            },
            {
                name: 'leave_request_approved',
                subject: 'Your Leave Request Has Been Approved',
                body_html: `
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
                `,
                body_text: `
                    Leave Request Approved
                    
                    Hello {{employee_name}},
                    
                    Your leave request has been approved.
                    
                    - Type: {{leave_type}}
                    - Dates: {{start_date}} to {{end_date}}
                    
                    If you have any questions, please contact your manager.
                    
                    Best regards,
                    The HR Team
                `,
                variables: {
                    employee_name: { required: true, type: 'string', description: 'Employee name' },
                    leave_type: { required: true, type: 'string', description: 'Type of leave' },
                    start_date: { required: true, type: 'string', description: 'Leave start date' },
                    end_date: { required: true, type: 'string', description: 'Leave end date' }
                }
            },
            {
                name: 'payroll_generated',
                subject: 'Payroll Processed for {{month_year}}',
                body_html: `
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
                `,
                body_text: `
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
                `,
                variables: {
                    employee_name: { required: true, type: 'string', description: 'Employee name' },
                    month_year: { required: true, type: 'string', description: 'Month and year of payroll' },
                    gross_salary: { required: true, type: 'string', description: 'Gross salary amount' },
                    deductions: { required: true, type: 'string', description: 'Total deductions' },
                    net_pay: { required: true, type: 'string', description: 'Net pay amount' },
                    payment_date: { required: true, type: 'string', description: 'Payment date' }
                }
            }
        ];
        
        for (const template of defaultTemplates) {
            try {
                await query(
                    `INSERT INTO email_templates (name, subject, body_html, body_text, variables)
                     VALUES ($1, $2, $3, $4, $5)
                     ON CONFLICT (name) DO NOTHING`,
                    [
                        template.name,
                        template.subject,
                        template.body_html.trim(),
                        template.body_text.trim(),
                        JSON.stringify(template.variables)
                    ]
                );
                console.log(`✅ Default template "${template.name}" inserted or already exists`);
            } catch (insertError) {
                console.error(`❌ Error inserting template "${template.name}":`, insertError.message);
            }
        }
        
        console.log('🎉 Email templates table setup completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating email templates table:', error.message);
        process.exit(1);
    }
};

createEmailTemplatesTable();