import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const parseJson = <T>(value: any, fallback: T): T => {
  if (!value) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
};

export const useBranding = () => {
  const { settings } = useAuth();

  return useMemo(() => {
    const brandName = settings?.mobile_brand_name || 'HRMS Suite';
    const heroTitle = settings?.mobile_hero_title || `${brandName} for modern enterprises`;
    const heroSubtitle = settings?.mobile_hero_subtitle || 'A premium HRMS mobile experience with dynamic branding and rich employee workflows.';
    const pricingPlans = parseJson(settings?.mobile_pricing_plans, [
      {
        id: 'starter',
        title: 'Starter',
        priceMonthly: '19',
        priceYearly: '199',
        features: ['Up to 50 employees', 'Attendance & Leaves', 'Basic Payroll'],
        badge: 'Best for teams',
      },
      {
        id: 'professional',
        title: 'Professional',
        priceMonthly: '49',
        priceYearly: '499',
        features: ['Advanced HR', 'Payroll automation', 'Shift management'],
        badge: 'Popular',
      },
      {
        id: 'enterprise',
        title: 'Enterprise',
        priceMonthly: '99',
        priceYearly: '999',
        features: ['Custom workflows', 'BI reports', 'Dedicated support'],
        badge: 'Premium',
      },
    ]);
    const featureModules = parseJson(settings?.mobile_feature_modules, [
      { title: 'Attendance', subtitle: 'Geo-aware clock in/out', icon: 'Clock' },
      { title: 'Payroll', subtitle: 'Payslips & tax details', icon: 'CreditCard' },
      { title: 'Leave Management', subtitle: 'Calendar and approvals', icon: 'Calendar' },
      { title: 'Shift Scheduling', subtitle: 'Flexible rosters', icon: 'Clock', },
      { title: 'Reports', subtitle: 'Live analytics dashboards', icon: 'BarChart3' },
      { title: 'Task Management', subtitle: 'Kanban-style task flow', icon: 'CheckSquare' },
      { title: 'Notifications', subtitle: 'Real-time alerts', icon: 'Bell' },
      { title: 'Geo Tracking', subtitle: 'Location-based attendance', icon: 'MapPin' },
    ]);
    const testimonials = parseJson(settings?.mobile_testimonials, [
      { name: 'Sofia Patel', title: 'HR Lead', quote: 'The HRMS mobile experience is polished and user-friendly — perfect for distributed teams.' },
      { name: 'Ravi Kumar', title: 'Operations Manager', quote: 'Modern UI, fast performance, and complete visibility into attendance and payroll.' },
    ]);
    const contact = {
      email: settings?.mobile_support_email || 'support@hrms-suite.com',
      phone: settings?.mobile_support_phone || '+1 800 123 4567',
      address: settings?.mobile_office_address || '2400 Corporate Way, Suite 400',
      chatUrl: settings?.mobile_support_chat_url || '',
    };

    return {
      brandName,
      heroTitle,
      heroSubtitle,
      pricingPlans,
      featureModules,
      testimonials,
      contact,
      appLogo: settings?.mobile_brand_logo_url || null,
      heroBanner: settings?.mobile_hero_banner_url || null,
      primaryColor: settings?.mobile_brand_primary_color || '#2563eb',
      accentColor: settings?.mobile_brand_accent_color || '#22c55e',
    };
  }, [settings]);
};
