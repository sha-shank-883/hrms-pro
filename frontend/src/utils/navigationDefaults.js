export const defaultNavigation = [
  {
    key: 'platform', label: 'Platform', href: '/features',
    columns: [
      {
        title: 'Core HR',
        links: [
          { label: 'Employee Management', href: '/features#employee-management', desc: 'Centralized employee database' },
          { label: 'Payroll Processing', href: '/features#payroll', desc: 'Automated payroll & tax filing' },
          { label: 'Time & Attendance', href: '/features#attendance', desc: 'GPS geo-fencing & biometrics' },
        ],
      },
      {
        title: 'Workforce',
        links: [
          { label: 'Leave Management', href: '/features#leave', desc: 'Time-off & absence tracking' },
          { label: 'Performance', href: '/features#performance', desc: 'OKRs, reviews & feedback' },
          { label: 'Recruitment', href: '/features#recruitment', desc: 'ATS & applicant tracking' },
        ],
      },
    ],
  },
  { key: 'pricing', label: 'Pricing', href: '/pricing' },
  { key: 'about', label: 'About', href: '/about' },
  { key: 'blog', label: 'Blog', href: '/blog' },
  {
    key: 'resources', label: 'Resources', href: '/blog',
    columns: [
      {
        title: 'Learn',
        links: [
          { label: 'Blog', href: '/blog', desc: 'HR insights & guides' },
          { label: 'Case Studies', href: '/case-studies', desc: 'Customer success stories' },
          { label: 'FAQ', href: '/faq', desc: 'Frequently asked questions' },
        ],
      },
      {
        title: 'Connect',
        links: [
          { label: 'Integrations', href: '/integrations', desc: 'Connect your tools' },
          { label: 'Partners', href: '/partners', desc: 'Become a partner' },
          { label: 'API Docs', href: '/docs', desc: 'Developer documentation' },
        ],
      },
    ],
  },
  { key: 'contact', label: 'Contact', href: '/contact' },
];
