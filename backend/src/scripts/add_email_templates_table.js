require('dotenv').config();
const { pool } = require('../config/database');

const createEmailTemplatesTable = async () => {
    const client = await pool.connect();
    try {
        console.log('📦 Starting email templates schema update...');

        // Get all schemes
        const schemasRes = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        `);

        const schemas = schemasRes.rows.map(r => r.schema_name);
        console.log('Found schemas:', schemas);

        const defaultTemplates = [
            {
                name: 'welcome_employee',
                subject: 'Welcome to {{company_name}} - Your Account Details',
                body_html: `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px; }
        .content { padding: 40px 30px; }
        .welcome-text { font-size: 18px; color: #555; margin-bottom: 30px; }
        .details-box { background-color: #f9f9f9; border-left: 4px solid #764ba2; padding: 20px; margin-bottom: 30px; border-radius: 4px; }
        .details-item { margin-bottom: 10px; font-size: 15px; }
        .details-label { font-weight: 600; color: #777; width: 100px; display: inline-block; }
        .btn { display: inline-block; background-color: #764ba2; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 25px; font-weight: bold; margin-top: 10px; transition: background-color 0.3s; }
        .btn:hover { background-color: #5a387e; }
        .footer { background-color: #f4f7f6; padding: 20px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; }
        .temp-password { background-color: #eee; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold; letter-spacing: 1px; color: #d00; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to {{company_name}}!</h1>
        </div>
        <div class="content">
            <p class="welcome-text">Hi {{first_name}},</p>
            <p>We are absolutely thrilled to welcome you to the team! Your journey with us begins now, and we can't wait to see all the great things we'll achieve together.</p>
            
            <p>Your employee account has been successfully created. Here are your onboarding details:</p>
            
            <div class="details-box">
                <div class="details-item"><span class="details-label">Position:</span> {{position}}</div>
                <div class="details-item"><span class="details-label">Department:</span> {{department}}</div>
                <div class="details-item"><span class="details-label">Start Date:</span> {{start_date}}</div>
                <div class="details-item"><span class="details-label">Email:</span> {{email}}</div>
            </div>

            <p>You can access the HR Portal using the credentials below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <p>Temporary Password: <span class="temp-password">{{temp_password}}</span></p>
                <a href="#" class="btn">Login to HR Portal</a>
            </div>

            <p><em>Security Tip: Please change your password immediately after your first login to keep your account secure.</em></p>
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} {{company_name}}. All rights reserved.<br>
            If you have any questions, please reach out to the HR department.
        </div>
    </div>
</body>
</html>
                `,
                body_text: `
                    WELCOME TO {{company_name}}!
                    
                    Hi {{first_name}},
                    
                    We are absolutely thrilled to welcome you to the team! Your journey with us begins now.
                    
                    Here are your account details:
                    --------------------------------------------------
                    Position:    {{position}}
                    Department:  {{department}}
                    Start Date:  {{start_date}}
                    Email:       {{email}}
                    --------------------------------------------------
                    
                    Temporary Password: {{temp_password}}
                    
                    Please login and change your password immediately.
                    
                    Best regards,
                    The {{company_name}} Team
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

        for (const schema of schemas) {
            console.log(`Checking schema: ${schema}`);

            // Create table in this schema
            await client.query(`
                CREATE TABLE IF NOT EXISTS "${schema}".email_templates (
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
            console.log(`✅ Table email_templates ensured in ${schema}`);

            // Add indexes (if not already present)
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_${schema}_email_templates_name ON "${schema}".email_templates(name)
            `);
            console.log(`✅ Index idx_${schema}_email_templates_name ensured in ${schema}`);

            // Insert default templates
            for (const template of defaultTemplates) {
                try {
                    await client.query(
                        `INSERT INTO "${schema}".email_templates (name, subject, body_html, body_text, variables)
                         VALUES ($1, $2, $3, $4, $5)
                         ON CONFLICT (name) DO UPDATE SET
                            subject = EXCLUDED.subject,
                            body_html = EXCLUDED.body_html,
                            body_text = EXCLUDED.body_text,
                            variables = EXCLUDED.variables,
                            updated_at = CURRENT_TIMESTAMP
                        `,
                        [
                            template.name,
                            template.subject,
                            template.body_html.trim(),
                            template.body_text.trim(),
                            JSON.stringify(template.variables)
                        ]
                    );
                    console.log(`   - Template "${template.name}" synced in ${schema}`);
                } catch (insertError) {
                    console.error(`   ❌ Error inserting template "${template.name}" in ${schema}:`, insertError.message);
                }
            }
        }

        console.log('🎉 Email templates table update completed across all schemas!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating email templates:', error.message);
        process.exit(1);
    } finally {
        client.release();
    }
};

createEmailTemplatesTable();