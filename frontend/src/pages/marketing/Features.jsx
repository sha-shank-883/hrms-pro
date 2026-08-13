import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon, CheckIcon,
  UserGroupIcon, DocumentTextIcon, ClockIcon, BanknotesIcon,
  ChartBarIcon, ShieldCheckIcon, SparklesIcon, CpuChipIcon,
  GlobeAltIcon, DevicePhoneMobileIcon, CloudArrowUpIcon,
  AcademicCapIcon, BriefcaseIcon, CalendarDaysIcon,
  CurrencyDollarIcon, HeartIcon, IdentificationIcon
} from '@heroicons/react/24/outline';
import { AnimatedSection, AnimatedItem } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const modules = [
  {
    title: 'Core HR', icon: UserGroupIcon, color: 'indigo',
    desc: 'The single source of truth for all employee data across your organization.',
    features: [
      'Centralized employee database with custom fields',
      'Interactive org charts with reporting lines',
      'Document management with e-signatures',
      'Compliance tracking and audit trails',
      'Role-based access control and permissions',
      'Automated employee lifecycle workflows',
    ]
  },
  {
    title: 'Time & Attendance', icon: ClockIcon, color: 'blue',
    desc: 'Accurate time tracking with global compliance and seamless payroll integration.',
    features: [
      'Biometric integration (fingerprint, face)',
      'Shift scheduling and swap management',
      'Overtime calculation and approvals',
      'Geofenced mobile check-in/out',
      'Leave and absence management',
      'Real-time attendance dashboards',
    ]
  },
  {
    title: 'Payroll Management', icon: BanknotesIcon, color: 'green',
    desc: 'Automated payroll processing that is accurate, compliant, and tightly integrated with HR and attendance data.',
    features: [
      'Automated payroll runs with salary calculations',
      'Auto-calculations for taxes and deductions',
      'Direct integration with HR and time data',
      'PDF payslip generation and employee portal',
      'Multi-company and multi-branch payroll support',
      'Payroll audit logs and compliance reporting',
    ]
  },
  {
    title: 'Talent Management', icon: AcademicCapIcon, color: 'purple',
    desc: 'Attract, develop, and retain top talent with AI-powered recruiting and onboarding.',
    features: [
      'AI-driven recruitment and applicant tracking (ATS)',
      'Structured onboarding and offboarding workflows',
      'Performance reviews and 360 feedback',
      'Onboarding & training task assignments',
      'Succession planning and career progression',
      'Skills gap analysis and development plans',
    ]
  },
  {
    title: 'Performance & Goals', icon: ChartBarIcon, color: 'amber',
    desc: 'Align your workforce around strategic objectives and drive continuous improvement.',
    features: [
      'OKR and goal setting with team tracking',
      'Continuous feedback and 1-on-1 check-ins',
      '360-degree performance review cycles',
      'Real-time performance analytics',
      'Peer recognition and achievements',
      'Custom review templates and cycles',
    ]
  },
  {
    title: 'Workforce Planning', icon: BriefcaseIcon, color: 'rose',
    desc: 'Plan your workforce strategically with headcount forecasting and compensation structures.',
    features: [
      'Headcount planning and department budgeting',
      'Compensation & salary structure management',
      'Department reorganization and org charts',
      'Churn risk prediction and retention insights',
      'Skills inventory and gap analysis',
      'Workforce payroll cost forecasting',
    ]
  },
  {
    title: 'Employee Experience', icon: HeartIcon, color: 'pink',
    desc: 'Create a connected, engaged workforce with modern employee self-service tools.',
    features: [
      'Employee self-service portal',
      'Mobile-responsive experience for all tasks',
      'Company-wide announcements and notifications',
      'Employee surveys and pulse checks',
      'Recognition and peer acknowledgement',
      'Document access and payslip history',
    ]
  },
  {
    title: 'Analytics & Reporting', icon: ChartBarIcon, color: 'cyan',
    desc: 'Turn people data into actionable insights with powerful dashboards and custom reports.',
    features: [
      'Pre-built HR dashboards and KPI widgets',
      'Custom report builder with filters and exports',
      'Attendance, payroll, and headcount analytics',
      'Automated report scheduling via email',
      'CSV and Excel data exports',
      'Drill-down by department, branch, or role',
    ]
  },
  {
    title: 'Security & Compliance', icon: ShieldCheckIcon, color: 'red',
    desc: 'Enterprise-grade security with robust access control, audit readiness, and data protection.',
    features: [
      'Role-based access control with granular permissions',
      'JWT authentication and session management',
      'Complete audit trail on all data changes',
      'Data encryption at rest and in transit',
      'Multi-tenant data isolation',
      'GDPR-ready data management and export',
    ]
  },
];

const benefits = [
  {
    icon: CloudArrowUpIcon, title: 'Single Data Model',
    desc: 'All modules share one database — no integrations, no sync delays, no data inconsistencies.'
  },
  {
    icon: SparklesIcon, title: 'Automated Intelligence',
    desc: 'Smart workflows automate leave approvals, payroll runs, onboarding tasks, and email notifications without manual effort.'
  },
  {
    icon: GlobeAltIcon, title: 'Multi-Company Ready',
    desc: 'Built for multi-tenant, multi-company, and multi-branch operations with isolated data and centralized admin control.'
  },
  {
    icon: DevicePhoneMobileIcon, title: 'Mobile-Responsive Experience',
    desc: 'Fully responsive web app ensures employees and managers can complete HR tasks from any device, anywhere.'
  },
  {
    icon: CpuChipIcon, title: 'No-Code Configurability',
    desc: 'Configure workflows, forms, roles, and processes through admin settings — no developer required.'
  },
  {
    icon: ShieldCheckIcon, title: 'Enterprise Security',
    desc: 'Role-based access control, JWT authentication, encrypted data storage, and complete audit trails on all changes.'
  },
];

const Features = () => {
  const { t } = useWebsiteBuilder();
  return (
    <div>
      {/* ────── Hero ────── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-50/40 via-transparent to-transparent dark:from-primary-500/5" />
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Platform</span>
            <h1 className="mt-4 text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6">
              {t('features.title', 'Everything you need to manage your workforce')}
            </h1>
            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              {t('features.subtitle', 'A unified HCM platform covering the entire employee lifecycle — from recruitment to retirement — with AI-powered intelligence and global compliance built in.')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/demo" className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-500/25 transition-all">
                {t('features.cta_primary', 'Get a Free Demo')} <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link to="/pricing" className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm rounded-xl transition-all">
                {t('features.cta_secondary', 'View Pricing')}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────── Benefits Bar ────── */}
      <section className="py-16 bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b, idx) => (
              <AnimatedItem key={b.title} delay={idx * 0.06}>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                    <b.icon className="w-5 h-5 text-primary-600 dark:text-primary-500" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{b.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Modules ────── */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">All Modules</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Comprehensive HR modules, deeply integrated
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Every module shares a single data model — no silos, no integrations, no data loss.
            </p>
          </AnimatedSection>

          <div className="space-y-12">
            {modules.map((mod, idx) => (
              <AnimatedItem key={mod.title} delay={idx * 0.05}>
                <div className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 lg:p-10 hover:shadow-lg transition-all duration-300">
                  <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
                    <div className="min-w-0">
                      <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-5 group-hover:bg-primary-600 dark:group-hover:bg-primary-500 transition-all duration-300">
                        <mod.icon className="w-7 h-7 text-primary-600 dark:text-primary-500 group-hover:text-white transition-all duration-300" />
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">{mod.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{mod.desc}</p>
                    </div>
                    <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
                      {mod.features.map((feat) => (
                        <div key={feat} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                          <CheckIcon className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-500 dark:text-gray-400">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Compare ────── */}
      <section className="py-16 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Compare</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
              How do we stack up?
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-10">
              See how HRMS Pro compares against other leading HR platforms.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { label: 'vs BambooHR', url: '/vs-bamboohr' },
                { label: 'vs Gusto', url: '/vs-gusto' },
                { label: 'vs Rippling', url: '/vs-rippling' },
              ].map((item) => (
                <Link
                  key={item.label}
                  to={item.url}
                  className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ────── CTA ────── */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 dark:from-primary-700 dark:via-primary-800 dark:to-secondary-900 rounded-[2.5rem] p-10 lg:p-20 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_white/10),_radial-gradient(circle_at_bottom_left,_white/5)]" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight mb-6">
                See the platform in action
              </h2>
              <p className="text-lg text-primary-200 mb-10 max-w-2xl mx-auto">
                Get a personalized walkthrough of HRMS Pro tailored to your organization's needs.
              </p>
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold text-sm rounded-xl hover:bg-primary-50 transition-all shadow-xl"
              >
                Book Your Demo <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;
