/**
 * Demonstration script for the Email Template System
 * This script shows how to use all features of the email template system
 */

require('dotenv').config();
const { sendEmail } = require('../services/emailService');
const { compileTemplate, validateVariables, formatDate, formatCurrency, formatNumber } = require('../services/templateService');
const emailTemplateModel = require('../models/emailTemplateModel');

const demonstrateEmailTemplates = async () => {
    console.log('📧 Email Template System Demonstration');
    console.log('=====================================');
    
    try {
        // 1. Show all available templates
        console.log('\n📋 Available Email Templates:');
        const templates = await emailTemplateModel.getAllTemplates();
        templates.forEach((template, index) => {
            console.log(`${index + 1}. ${template.name} - ${template.subject.substring(0, 50)}...`);
        });
        
        // 2. Demonstrate template compilation with variables
        console.log('\n🔧 Template Compilation Demo:');
        
        // Get the welcome template
        const welcomeTemplate = await emailTemplateModel.getTemplateByName('welcome_employee');
        if (welcomeTemplate) {
            console.log(`\n📝 Template: ${welcomeTemplate.name}`);
            
            // Define variables for the template
            const variables = {
                company_name: 'Tech Innovations Inc.',
                first_name: 'Alex',
                email: 'alex.johnson@example.com',
                position: 'Senior Developer',
                department: 'Engineering',
                start_date: '2025-03-01',
                temp_password: 'Welcome2025!'
            };
            
            // Compile the template
            const compiledSubject = compileTemplate(welcomeTemplate.subject, variables);
            const compiledHtml = compileTemplate(welcomeTemplate.body_html, variables);
            const compiledText = compileTemplate(welcomeTemplate.body_text, variables);
            
            console.log('✅ Template compilation successful');
            console.log('Subject:', compiledSubject);
            console.log('HTML Preview (first 150 chars):', compiledHtml.substring(0, 150) + '...');
        }
        
        // 3. Demonstrate variable validation
        console.log('\n🔍 Variable Validation Demo:');
        
        if (welcomeTemplate && welcomeTemplate.variables) {
            console.log('Template requires variables:', Object.keys(welcomeTemplate.variables));
            
            // Test with missing required variables
            const incompleteVariables = {
                company_name: 'Tech Innovations Inc.',
                first_name: 'Alex'
                // Missing other required variables
            };
            
            const validation = validateVariables(incompleteVariables, welcomeTemplate.variables);
            console.log('Validation with incomplete data:', validation.isValid ? 'Valid' : 'Invalid');
            if (!validation.isValid) {
                console.log('Errors:', validation.errors);
            }
            
            // Test with complete variables
            const completeVariables = {
                company_name: 'Tech Innovations Inc.',
                first_name: 'Alex',
                email: 'alex.johnson@example.com',
                position: 'Senior Developer',
                department: 'Engineering',
                start_date: '2025-03-01',
                temp_password: 'Welcome2025!'
            };
            
            const completeValidation = validateVariables(completeVariables, welcomeTemplate.variables);
            console.log('Validation with complete data:', completeValidation.isValid ? 'Valid' : 'Invalid');
        }
        
        // 4. Demonstrate formatting helpers
        console.log('\n🎨 Formatting Helpers Demo:');
        
        const currentDate = new Date();
        console.log('Current date formatted (YYYY-MM-DD):', formatDate(currentDate, 'YYYY-MM-DD'));
        console.log('Current date formatted (MM/DD/YYYY):', formatDate(currentDate, 'MM/DD/YYYY'));
        console.log('Salary formatted as USD:', formatCurrency(75000, 'USD'));
        console.log('Bonus formatted with 2 decimals:', formatNumber(5500.75, 2));
        
        // 5. Demonstrate nested object support
        console.log('\n📂 Nested Object Support Demo:');
        
        const nestedTemplate = 'Hello {{user.firstName}} {{user.lastName}}, welcome to {{company.name}}!';
        const nestedVariables = {
            user: {
                firstName: 'John',
                lastName: 'Doe'
            },
            company: {
                name: 'Global Solutions Ltd.'
            }
        };
        
        const nestedResult = compileTemplate(nestedTemplate, nestedVariables);
        console.log('Nested template result:', nestedResult);
        
        // 6. Demonstrate array support
        console.log('\n📊 Array Support Demo:');
        
        const arrayTemplate = 'Team members: {{team[0].name}}, {{team[1].name}}, and {{team[2].name}}';
        const arrayVariables = {
            team: [
                { name: 'Alice' },
                { name: 'Bob' },
                { name: 'Charlie' }
            ]
        };
        
        const arrayResult = compileTemplate(arrayTemplate, arrayVariables);
        console.log('Array template result:', arrayResult);
        
        // 7. Demonstrate helper functions in templates
        console.log('\n⚙️ Helper Functions in Templates Demo:');
        
        const helperTemplate = `
            Pay Period: {{startDate}} to {{endDate}}
            Gross Salary: {{grossSalary}}
            Bonus: {{bonus}}
            Total: {{total}}
        `;
        
        const helperVariables = {
            startDate: '2025-02-01',
            endDate: '2025-02-28',
            grossSalary: 85000,
            bonus: 5000,
            total: 90000
            // Note: formatDate, formatCurrency, formatNumber are not passed here
            // They are automatically available in the template service
        };
        
        const helperResult = compileTemplate(helperTemplate, helperVariables);
        console.log('Helper functions template result:');
        console.log(helperResult);
        
        // 8. Demonstrate template creation
        console.log('\n➕ Template Creation Demo:');
        
        const newTemplate = {
            name: 'birthday_greeting_' + Date.now(), // Unique name for demo
            subject: 'Happy Birthday, {{firstName}}!',
            body_html: `
                <h2>🎂 Happy Birthday!</h2>
                <p>Dear {{firstName}} {{lastName}},</p>
                <p>On behalf of the entire {{companyName}} team, we wish you a wonderful birthday!</p>
                <p>We appreciate your hard work and dedication.</p>
                <br>
                <p>Celebrate well!<br>The HR Team</p>
            `,
            body_text: `
                🎂 Happy Birthday!
                
                Dear {{firstName}} {{lastName}},
                
                On behalf of the entire {{companyName}} team, we wish you a wonderful birthday!
                
                We appreciate your hard work and dedication.
                
                Celebrate well!
                The HR Team
            `,
            variables: {
                firstName: { required: true, type: 'string', description: 'Employee first name' },
                lastName: { required: true, type: 'string', description: 'Employee last name' },
                companyName: { required: true, type: 'string', description: 'Company name' }
            }
        };
        
        const createdTemplate = await emailTemplateModel.createTemplate(newTemplate);
        console.log('✅ Template created successfully with ID:', createdTemplate.id);
        
        // Clean up by deleting the demo template
        await emailTemplateModel.deleteTemplate(createdTemplate.id);
        console.log('🧹 Demo template cleaned up');
        
        console.log('\n🎉 Email Template System Demonstration Completed Successfully!');
        console.log('\n📚 For more information, see EMAIL_TEMPLATES.md');
        
    } catch (error) {
        console.error('❌ Error in demonstration:', error.message);
        process.exit(1);
    }
};

demonstrateEmailTemplates();