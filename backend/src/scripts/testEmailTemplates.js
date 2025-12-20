require('dotenv').config();
const { sendEmail } = require('../services/emailService');
const { compileTemplate } = require('../services/templateService');
const emailTemplateModel = require('../models/emailTemplateModel');

const testEmailTemplates = async () => {
    console.log('📧 Testing Email Template System...');
    console.log('====================================');
    
    try {
        // Check if we have templates
        const templates = await emailTemplateModel.getAllTemplates();
        console.log(`📋 Found ${templates.length} email templates`);
        
        if (templates.length === 0) {
            console.log('⚠️  No templates found. Run the add_email_templates_table.js script first.');
            process.exit(1);
        }
        
        // Display available templates
        console.log('\nAvailable Templates:');
        templates.forEach((template, index) => {
            console.log(`${index + 1}. ${template.name} - ${template.subject}`);
        });
        
        // Test template compilation
        console.log('\n🔧 Testing Template Compilation...');
        const welcomeTemplate = await emailTemplateModel.getTemplateByName('welcome_employee');
        
        if (welcomeTemplate) {
            console.log(`\n📝 Testing template: ${welcomeTemplate.name}`);
            
            const variables = {
                company_name: 'Acme Corp',
                first_name: 'John',
                email: 'john.doe@example.com',
                position: 'Software Engineer',
                department: 'Engineering',
                start_date: '2025-01-15',
                temp_password: 'TempPass123!'
            };
            
            const compiledSubject = compileTemplate(welcomeTemplate.subject, variables);
            const compiledHtml = compileTemplate(welcomeTemplate.body_html, variables);
            const compiledText = compileTemplate(welcomeTemplate.body_text, variables);
            
            console.log('✅ Template compilation successful');
            console.log('Subject:', compiledSubject);
            console.log('HTML Body Preview (first 200 chars):', compiledHtml.substring(0, 200) + '...');
            
            // Test sending email if SMTP is configured
            if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
                console.log('\n📤 Testing Email Sending...');
                
                try {
                    const testRecipient = process.env.TEST_EMAIL_RECIPIENT || process.env.SMTP_USER;
                    console.log(`Sending test email to: ${testRecipient}`);
                    
                    const info = await sendEmail({
                        to: testRecipient,
                        subject: compiledSubject,
                        html: compiledHtml,
                        text: compiledText
                    });
                    
                    console.log('✅ Email sent successfully!');
                    console.log('Message ID:', info.messageId);
                } catch (emailError) {
                    console.error('❌ Failed to send email:', emailError.message);
                }
            } else {
                console.log('\n⚠️  SMTP not configured. Skipping email sending test.');
                console.log('To test email sending, configure SMTP settings in your .env file.');
            }
        } else {
            console.log('⚠️  Welcome template not found.');
        }
        
        console.log('\n🎉 Email template system test completed!');
    } catch (error) {
        console.error('❌ Error testing email template system:', error.message);
        process.exit(1);
    }
};

testEmailTemplates();