require('dotenv').config();
const { sendEmail } = require('../services/emailService');
const { compileTemplate } = require('../services/templateService');
const emailTemplateModel = require('../models/emailTemplateModel');

const testEmailTemplates = async () => {
    
    
    
    try {
        // Check if we have templates
        const templates = await emailTemplateModel.getAllTemplates();
        
        
        if (templates.length === 0) {
            
            process.exit(1);
        }
        
        // Display available templates
        
        templates.forEach((template, index) => {
            
        });
        
        // Test template compilation
        
        const welcomeTemplate = await emailTemplateModel.getTemplateByName('welcome_employee');
        
        if (welcomeTemplate) {
            
            
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
            
            
            
            
            
            // Test sending email if SMTP is configured
            if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
                
                
                try {
                    const testRecipient = process.env.TEST_EMAIL_RECIPIENT || process.env.SMTP_USER;
                    
                    
                    const info = await sendEmail({
                        to: testRecipient,
                        subject: compiledSubject,
                        html: compiledHtml,
                        text: compiledText
                    });
                    
                    
                    
                } catch (emailError) {
                    console.error('❌ Failed to send email:', emailError.message);
                }
            } else {
                
                
            }
        } else {
            
        }
        
        
    } catch (error) {
        console.error('❌ Error testing email template system:', error.message);
        process.exit(1);
    }
};

testEmailTemplates();