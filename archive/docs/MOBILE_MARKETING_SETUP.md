# Mobile Marketing Screen Setup Guide

The mobile app now features a dynamic marketing/demo booking page that pulls all content from your website settings managed by super admins.

## Access Points

### For Users:
1. **Before Login**: Users see a "View Demo & Features" button on the login screen
2. **After Login**: From Dashboard, users can navigate to the Marketing screen via menu

### For Super Admins:
- Go to **Settings > Website Settings** to manage all marketing content

## Available Settings Fields

### Hero Section
- **Hero Title**: Main headline (e.g., "HR Management System")
- **Hero Subtitle**: Subheading description
- **Hero Image**: Banner image that displays at the top

### Branding
- **Primary Color**: Main brand color (used for buttons, accents, badges)
- **Font Family**: Typography style
- **Logo**: Company logo

### Features Section
- **Show Grid Features**: Toggle (default: true)
- **Grid Features Title**: Section heading
- **Grid Features Subtitle**: Description
- Displays: Attendance, Payroll, Performance, Recruitment features

### Why Choose Us Section
- **Show Deep Dive**: Toggle (default: true)
- **Deep Dive Title**: Section heading
- **Deep Dive Subtitle**: Description

### Testimonials
- **Show Testimonials**: Toggle (default: true)
- **Testimonial Text**: Review text
- **Testimonial Author**: Author name
- **Testimonial Role**: Position/Company

### Pricing Section
- **Sections**: JSON array of pricing plans with:
  - `title`: Plan name
  - `description`: Plan details
  - `price`: Price display
  - `billing_period`: Billing frequency
  - `features`: Array of features included
  - `featured`: Boolean (shows as "Popular")

Example pricing section JSON:
```json
[
  {
    "title": "Starter",
    "description": "For small teams",
    "price": "$99/month",
    "billing_period": "Billed monthly",
    "featured": false,
    "features": ["Up to 50 employees", "Basic attendance", "Email support"]
  },
  {
    "title": "Professional",
    "description": "For growing businesses",
    "price": "$299/month",
    "billing_period": "Billed monthly",
    "featured": true,
    "features": ["Up to 500 employees", "All features", "Priority support", "Analytics"]
  },
  {
    "title": "Enterprise",
    "description": "For large organizations",
    "price": "Custom",
    "billing_period": "Contact sales",
    "featured": false,
    "features": ["Unlimited employees", "Custom features", "Dedicated support"]
  }
]
```

### Call-to-Action Section
- **Show CTA**: Toggle (default: true)
- **CTA Title**: Main headline
- **CTA Subtitle**: Description

### Contact Information
- **Contact Email**: Support email (clickable, opens email client)
- **Contact Phone**: Support phone (clickable, calls phone)
- **Contact Address**: Office address (clickable, opens maps)
- **Company Description**: Footer company info

## Demo Booking Form

When users click "Book a Demo" or "Choose Plan", they see a modal form with:
- Company Name (required)
- Email Address (required)
- Phone Number (required)
- Number of Employees (optional)
- Message (optional)

Submissions are sent to your backend's `/leads/demo` endpoint and stored in the database for your sales team.

## URL Format for Images

Images uploaded in Website Settings are stored at:
- `{API_URL}/uploads/website/{filename}`

The app automatically appends this URL to image paths from settings.

## Testing on Mobile

1. Update Website Settings in the web admin panel
2. Install the mobile app
3. Go to Login → "View Demo & Features" button
4. Verify all content displays correctly
5. Test the booking form submission

## Features That Update Dynamically

✅ Hero section content and image
✅ Primary color (affects all buttons, accents)
✅ Feature cards
✅ Why Choose Us section
✅ Testimonial display
✅ Pricing plans (via sections)
✅ Contact information
✅ CTA section

All changes made in Website Settings are immediately reflected when users view the Marketing screen (after refresh).
