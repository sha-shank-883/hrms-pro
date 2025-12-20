# Email Template System Documentation

## Overview

The HRMS Pro Email Template System provides a flexible way to create, manage, and send customized emails to employees and other recipients. The system supports template variables, validation, and various formatting helpers.

## Features

- Template management (CRUD operations)
- Variable substitution with validation
- Support for HTML and plain text emails
- Built-in formatting helpers (dates, currency, numbers)
- RESTful API for integration
- Predefined templates for common HR scenarios

## API Endpoints

### Manage Email Templates

All template management endpoints require admin authentication.

#### Get All Templates
```
GET /api/email-templates
```

#### Get Template by ID
```
GET /api/email-templates/:id
```

#### Create New Template
```
POST /api/email-templates
```

Request Body:
```json
{
  "name": "welcome_employee",
  "subject": "Welcome to {{company_name}}!",
  "body_html": "<h1>Welcome {{first_name}}!</h1><p>Your temporary password is: {{temp_password}}</p>",
  "body_text": "Welcome {{first_name}}! Your temporary password is: {{temp_password}}",
  "variables": {
    "company_name": {
      "required": true,
      "type": "string",
      "description": "Company name"
    },
    "first_name": {
      "required": true,
      "type": "string",
      "description": "Employee first name"
    },
    "temp_password": {
      "required": true,
      "type": "string",
      "description": "Temporary password"
    }
  }
}
```

#### Update Template
```
PUT /api/email-templates/:id
```

#### Delete Template
```
DELETE /api/email-templates/:id
```

### Send Templated Emails

Sending emails requires admin or manager authentication.

#### Send Email Using Template
```
POST /api/email-templates/send
```

Request Body:
```json
{
  "template_name": "welcome_employee",
  "to": "employee@example.com",
  "variables": {
    "company_name": "Acme Corp",
    "first_name": "John",
    "temp_password": "TempPass123!"
  }
}
```

Alternatively, you can use `template_id` instead of `template_name`.

## Template Variables

### Basic Syntax

Template variables use double curly braces: `{{variable_name}}`

### Supported Data Types

- Strings
- Numbers
- Booleans
- Objects (access properties with dot notation: `{{user.name}}`)
- Arrays (access elements with bracket notation: `{{users[0].name}}`)

### Built-in Formatting Helpers

#### Date Formatting
```handlebars
{{formatDate date "YYYY-MM-DD"}}
{{formatDate date "MM/DD/YYYY"}}
{{formatDate date "DD/MM/YYYY"}}
```

#### Currency Formatting
```handlebars
{{formatCurrency amount "USD" "en-US"}}
{{formatCurrency amount "EUR" "de-DE"}}
```

#### Number Formatting
```handlebars
{{formatNumber number 2}} <!-- Formats to 2 decimal places -->
```

### Example Template with Helpers

```html
<h1>Payroll Summary for {{formatDate pay_period_start "MM/DD/YYYY"}} - {{formatDate pay_period_end "MM/DD/YYYY"}}</h1>
<p>Hello {{employee_name}},</p>
<p>Your gross salary: {{formatCurrency gross_salary "USD"}}</p>
<p>Total deductions: {{formatCurrency deductions "USD"}}</p>
<p>Net pay: {{formatCurrency net_pay "USD"}}</p>
```

## Default Templates

The system comes with several predefined templates:

### 1. Welcome Employee
- **Name**: `welcome_employee`
- **Purpose**: Send to new employees with account details
- **Variables**:
  - `company_name` (required)
  - `first_name` (required)
  - `email` (required)
  - `position` (required)
  - `department` (required)
  - `start_date` (required)
  - `temp_password` (required)

### 2. Leave Request Submitted
- **Name**: `leave_request_submitted`
- **Purpose**: Notify managers when employees submit leave requests
- **Variables**:
  - `employee_name` (required)
  - `leave_type` (required)
  - `start_date` (required)
  - `end_date` (required)
  - `reason` (required)

### 3. Leave Request Approved
- **Name**: `leave_request_approved`
- **Purpose**: Notify employees when their leave requests are approved
- **Variables**:
  - `employee_name` (required)
  - `leave_type` (required)
  - `start_date` (required)
  - `end_date` (required)

### 4. Payroll Generated
- **Name**: `payroll_generated`
- **Purpose**: Notify employees when payroll is processed
- **Variables**:
  - `employee_name` (required)
  - `month_year` (required)
  - `gross_salary` (required)
  - `deductions` (required)
  - `net_pay` (required)
  - `payment_date` (required)

## Usage Examples

### Creating a Custom Template

```javascript
// Create a birthday greeting template
const templateData = {
  name: 'birthday_greeting',
  subject: 'Happy Birthday, {{employee.first_name}}!',
  body_html: `
    <h2>Happy Birthday!</h2>
    <p>Dear {{employee.first_name}} {{employee.last_name}},</p>
    <p>On behalf of the entire {{company.name}} team, we wish you a very happy birthday!</p>
    <p>Thank you for your continued dedication and hard work.</p>
    <br>
    <p>Best wishes,<br>The HR Team</p>
  `,
  body_text: `
    Happy Birthday!
    
    Dear {{employee.first_name}} {{employee.last_name}},
    
    On behalf of the entire {{company.name}} team, we wish you a very happy birthday!
    
    Thank you for your continued dedication and hard work.
    
    Best wishes,
    The HR Team
  `,
  variables: {
    'employee.first_name': {
      required: true,
      type: 'string',
      description: 'Employee first name'
    },
    'employee.last_name': {
      required: true,
      type: 'string',
      description: 'Employee last name'
    },
    'company.name': {
      required: true,
      type: 'string',
      description: 'Company name'
    }
  }
};

// Send using the template
const emailData = {
  template_name: 'birthday_greeting',
  to: 'employee@example.com',
  variables: {
    employee: {
      first_name: 'John',
      last_name: 'Doe'
    },
    company: {
      name: 'Acme Corp'
    }
  }
};
```

### Sending with Validation

```javascript
// This will validate that all required variables are provided
const emailData = {
  template_name: 'welcome_employee',
  to: 'new.employee@example.com',
  variables: {
    company_name: 'Acme Corp',
    first_name: 'Jane',
    email: 'jane.doe@example.com',
    position: 'Software Engineer',
    department: 'Engineering',
    start_date: '2025-01-15',
    temp_password: 'Welcome123!'
  }
};
```

## Database Schema

The email templates are stored in the `email_templates` table with the following structure:

```sql
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
```

## Testing

To test the email template system:

1. Ensure your database is set up with the email templates table
2. Run the test script: `node backend/src/scripts/testEmailTemplates.js`
3. Configure SMTP settings in your `.env` file to test actual email sending

## Extending the System

### Adding New Formatting Helpers

You can extend the template service by adding new formatting functions in `backend/src/services/templateService.js` and then exposing them in the `sendTemplatedEmail` controller function.

### Creating More Default Templates

Add new templates to the `backend/src/config/schema.sql` file in the default templates insert section.