import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon, CheckIcon, ArrowDownTrayIcon,
  UserGroupIcon, DocumentTextIcon, ClockIcon, BanknotesIcon,
  ChartBarIcon, ShieldCheckIcon, SparklesIcon, CpuChipIcon,
  GlobeAltIcon, DevicePhoneMobileIcon, CloudArrowUpIcon,
  StarIcon, ChevronRightIcon, CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { PageWrapper, AnimatedSection, AnimatedItem, StaggerContainer } from '../../components/common/AnimatedSection';
import SEO, { OrganizationSchema, SoftwareApplicationSchema, WebSiteSchema } from '../../components/common/SEO';
import LeadMagnetModal from '../../components/marketing/LeadMagnetModal';
import blogPosts from './blogPosts';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const stats = [
  { value: 'Full-Suite', label: 'HR + Payroll + ATS', icon: '🏢' },
  { value: 'Biometric', label: 'Attendance Integration', icon: '👥' },
  { value: 'Multi-Tenant', label: 'Multi-Company Support', icon: '🌐' },
  { value: '99.9%', label: 'Uptime SLA', icon: '⚡' },
];

const features = [
  {
    icon: UserGroupIcon, title: 'Core HR',
    desc: 'Centralized employee records, org charts, and document management with real-time data sync across your organization.'
  },
  {
    icon: ClockIcon, title: 'Time & Attendance',
    desc: 'Biometric device integration, shift scheduling, overtime tracking, and leave management with automated timesheets.'
  },
  {
    icon: BanknotesIcon, title: 'Payroll Management',
    desc: 'Automated payroll runs with tax and deduction calculations, PDF payslip generation, and full audit logging — integrated with HR data.'
  },
  {
    icon: ChartBarIcon, title: 'Performance & Goals',
    desc: 'OKR tracking, 360-degree reviews, continuous feedback, and real-time performance dashboards to drive team growth.'
  },
  {
    icon: DocumentTextIcon, title: 'Talent Management',
    desc: 'End-to-end recruitment ATS, structured onboarding and offboarding workflows, and succession planning in one platform.'
  },
  {
    icon: ShieldCheckIcon, title: 'Security & Access Control',
    desc: 'Role-based access control, JWT authentication, multi-tenant data isolation, complete audit trails, and encrypted storage.'
  },
];

const aiFeatures = [
  {
    icon: SparklesIcon, title: 'AI-Powered Insights',
    desc: 'Predictive analytics surface attrition risks, skill gaps, and hiring needs before they become problems.'
  },
  {
    icon: CpuChipIcon, title: 'Smart Automation',
    desc: 'Automate repetitive HR tasks — leave approvals, offer letters, onboarding checklists — with intelligent workflows.'
  },
  {
    icon: GlobeAltIcon, title: 'Global Intelligence',
    desc: 'Navigate multi-country compliance, payroll regulations, and localized benefits with AI-driven guidance.'
  },
  {
    icon: DevicePhoneMobileIcon, title: 'Employee Self-Service',
    desc: 'Mobile-first experience lets employees manage time-off, access payslips, update profiles, and connect with teams.'
  },
  {
    icon: CloudArrowUpIcon, title: 'Flexible Integrations',
    desc: 'Connect via REST API, Webhooks, CSV/Excel export, SMTP email, and biometric device APIs for a unified HR tech stack.'
  },
  {
    icon: ChartBarIcon, title: 'Real-Time Analytics',
    desc: 'Pre-built HR dashboards and customizable reports give leadership instant visibility into workforce health and payroll data.'
  },
];

const products = [
  {
    name: 'HR Core', tag: 'System of Record',
    items: ['Employee Database', 'Org Charts', 'Document Management', 'Compliance Tracking'],
    image: null
  },
  {
    name: 'Talent', tag: 'Acquire & Develop',
    items: ['Recruitment ATS', 'Onboarding Workflows', 'Performance Reviews', 'Offboarding & Exit'],
    image: null
  },
  {
    name: 'Payroll', tag: 'Automate & Comply',
    items: ['Automated Payroll Runs', 'Tax & Deductions', 'PDF Payslip Portal', 'Payroll Audit Logs'],
    image: null
  },
  {
    name: 'Workforce', tag: 'Plan & Optimize',
    items: ['Headcount Planning', 'Salary Structure Management', 'Time Tracking', 'Shift Scheduling'],
    image: null
  },
];

const testimonials = [
  {
    quote: 'HRMS Pro simplified our entire HR process. Payroll that used to take days now runs automatically, and employees can access their payslips without calling HR at all.',
    author: 'Operations Director', role: 'Manufacturing Company, 200+ Employees', rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150'
  },
  {
    quote: 'The biometric attendance integration was exactly what we needed. Real-time tracking, automated overtime, and leave management all in one place — the visibility is incredible.',
    author: 'HR Manager', role: 'Logistics Firm, 500+ Employees', rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150'
  },
  {
    quote: 'Onboarding new hires used to be a chaos of spreadsheets and emails. With HRMS Pro, everything is structured — task checklists, document management, and role setup all flow automatically.',
    author: 'People Operations Lead', role: 'Technology Services Company', rating: 5,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150'
  },
];

const integrations = [
  'Biometric Device API (ZK Teco / Hikvision)',
  'Google Analytics 4',
  'Google Tag Manager',
  'REST API & Developer Endpoints',
  'Custom Webhooks',
  'CSV & Excel Data Export',
  'Automated SMTP Email Gateway',
  'PDF Payslip Generation Engine',
  'JSON Workforce Data Feeds'
];

const pricingPlans = [
  {
    name: 'Starter', price: '$6', period: '/employee/month',
    desc: 'Essential HR tools for small teams getting started.',
    features: ['Core HR & Employee Records', 'Time-Off Management', 'Basic Reporting', 'Mobile App Access', 'Email Support'],
    popular: false
  },
  {
    name: 'Growth', price: '$12', period: '/employee/month',
    desc: 'Advanced features for scaling organizations.',
    features: ['Everything in Starter', 'Performance Management', 'Payroll Integration', 'ATS & Onboarding', 'Advanced Analytics', 'Priority Support'],
    popular: true
  },
  {
    name: 'Enterprise', price: 'Custom', period: '',
    desc: 'Tailored solutions for global enterprises.',
    features: ['Everything in Growth', 'Multi-Country Payroll', 'Dedicated CSM', 'Custom Integrations', 'White-Label Options', '24/7 Support'],
    popular: false
  },
];

const dashboardTabs = [
  { id: 'core-hr', name: 'Core HR', icon: UserGroupIcon },
  { id: 'attendance', name: 'Attendance', icon: ClockIcon },
  { id: 'payroll', name: 'Payroll', icon: BanknotesIcon },
  { id: 'performance', name: 'Performance', icon: ChartBarIcon }
];

const activeMockData = {
  'core-hr': {
    stats: [
      { label: 'Total Headcount', value: '1,248', change: '+12% MoM', changeType: 'positive' },
      { label: 'Open Requisitions', value: '23', change: '8 Active ATS', changeType: 'neutral' },
      { label: 'Departments', value: '6', change: 'Global Teams', changeType: 'neutral' }
    ],
    chartTitle: 'Employee Distribution by Department',
    chartType: 'bars',
    chartData: [
      { label: 'Engineering', value: 85, color: 'bg-primary-500' },
      { label: 'Sales', value: 65, color: 'bg-secondary-500' },
      { label: 'Marketing', value: 45, color: 'bg-pink-500' },
      { label: 'Product & Design', value: 35, color: 'bg-primary-500' },
      { label: 'Operations', value: 25, color: 'bg-teal-500' },
      { label: 'Human Resources', value: 15, color: 'bg-emerald-500' }
    ],
    logs: [
      { text: 'Sarah Jenkins onboarded into Engineering', time: '2 mins ago' },
      { text: 'John Doe signed employment contract (Offer accepted)', time: '15 mins ago' },
      { text: 'New department created: AI Platform Dev', time: '1 hour ago' },
      { text: 'Employee file updated: Emily Watson (Promo to Director)', time: '3 hours ago' }
    ]
  },
  'attendance': {
    stats: [
      { label: 'Present Today', value: '98.4%', change: '1,228 Active', changeType: 'positive' },
      { label: 'Avg. Working Hours', value: '8.2h', change: 'Optimal SLA', changeType: 'positive' },
      { label: 'Pending Leaves', value: '4 Requests', change: 'Requires Action', changeType: 'negative' }
    ],
    chartTitle: 'Weekly Present Rate (%)',
    chartType: 'line',
    chartPoints: [
      { label: 'Mon', height: 70, val: '96%' },
      { label: 'Tue', height: 85, val: '98%' },
      { label: 'Wed', height: 95, val: '99%' },
      { label: 'Thu', height: 80, val: '97%' },
      { label: 'Fri', height: 65, val: '95%' }
    ],
    logs: [
      { text: 'Marcus Aurelius checked in (Remote Office)', time: 'Just now' },
      { text: 'Emily Watson requested annual leave (Dec 22-26)', time: '10 mins ago' },
      { text: 'Overtime auto-timesheet approved for Engineering team', time: '45 mins ago' },
      { text: 'Approved leave request for Liam Neeson (Personal)', time: '2 hours ago' }
    ]
  },
  'payroll': {
    stats: [
      { label: 'Active Cycle', value: 'June 2026', change: 'In Progress', changeType: 'neutral' },
      { label: 'Total Disbursed', value: '$1.24M', change: '+4.2% MoM', changeType: 'neutral' },
      { label: 'Tax Compliance', value: '100%', change: 'Auto-Filed', changeType: 'success' }
    ],
    chartTitle: 'Monthly Payroll Spending (USD)',
    chartType: 'columns',
    chartColumns: [
      { label: 'Mar', value: '$980K', height: 50 },
      { label: 'Apr', value: '$1.02M', height: 62 },
      { label: 'May', value: '$1.15M', height: 78 },
      { label: 'Jun', value: '$1.24M', height: 90 }
    ],
    logs: [
      { text: 'Automated direct deposits initiated for 452 employees', time: '1 min ago' },
      { text: 'Tax filing form 1099 completed for contractor payouts', time: '25 mins ago' },
      { text: 'Q2 performance bonuses verified and added to payslips', time: '1 hour ago' },
      { text: 'Payroll tax deductions auto-calculated and audit logged', time: '4 hours ago' }
    ]
  },
  'performance': {
    stats: [
      { label: 'Average Rating', value: '4.7 / 5.0', change: 'Exceeds Target', changeType: 'positive' },
      { label: 'OKR Progress', value: '82%', change: '+5.4% this Q', changeType: 'positive' },
      { label: 'Review Cycle', value: '96%', change: 'Reviews Done', changeType: 'success' }
    ],
    chartTitle: 'Performance Review Rating Distribution',
    chartType: 'distribution',
    chartDistribution: [
      { label: 'Outstanding (5★)', pct: 15, color: 'bg-primary-600' },
      { label: 'Exceeds (4★)', pct: 35, color: 'bg-primary-400' },
      { label: 'Meets (3★)', pct: 48, color: 'bg-primary-300' },
      { label: 'Needs Imp. (2★)', pct: 2, color: 'bg-gray-300 dark:bg-gray-700' }
    ],
    logs: [
      { text: 'Sarah Chen completed 360 review for Marcus Rodriguez', time: '5 mins ago' },
      { text: 'Engineering team achieved OKR: Speed up backend API', time: '12 mins ago' },
      { text: 'Annual performance reviews launched for Sales team', time: '2 hours ago' },
      { text: 'Self-evaluations submitted by 94% of employees', time: '5 hours ago' }
    ]
  }
};

const Home = () => {
  const { t } = useWebsiteBuilder();
  const [email, setEmail] = useState('');
  const [magnetOpen, setMagnetOpen] = useState(false);
  const [exited, setExited] = useState(false);
  const [activeTab, setActiveTab] = useState('core-hr');
  const [employeeCount, setEmployeeCount] = useState(120);
  const [hourlyRate, setHourlyRate] = useState(45);

  const hoursSavedPerMonth = Math.round(employeeCount * 0.42);
  const annualSavingsDollars = Math.round(hoursSavedPerMonth * hourlyRate * 12);

  // Exit-intent detection
  useEffect(() => {
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !exited && !magnetOpen) {
        setExited(true);
        setMagnetOpen(true);
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [exited, magnetOpen]);

  const leadMagnet = {
    title: 'HR Compliance Checklist 2026',
    description: 'A comprehensive checklist covering every compliance requirement your HR team needs to know — from GDPR and SOC 2 to local labor laws. Download your free copy.'
  };

  return (
    <PageWrapper>
      <SEO
        title="Modern HR Management Platform"
        description="HRMS Pro is an all-in-one AI-powered HR platform. Automate payroll, track attendance, manage performance, and streamline HR operations for growing businesses."
      />
      <OrganizationSchema />
      <SoftwareApplicationSchema />
      <WebSiteSchema />
      {/* ────── Hero Section ────── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-50/60 via-transparent to-transparent dark:from-primary-500/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-primary-100/30 to-transparent dark:from-primary-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 rounded-full text-xs font-semibold text-primary-600 dark:text-primary-500 mb-8">
              <SparklesIcon className="w-3.5 h-3.5" />
              {t('hero.badge', 'Now Available — AI-Native HCM Platform v3.0')}
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6">
              {t('hero.title', 'The AI-Powered HR Platform for Global Enterprises')}
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              {t('hero.subtitle', 'Unify your people, payroll, and performance data on a single platform. Automate workflows, unlock AI-driven insights, and empower your workforce — from hire to retire.')}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-500/25 hover:shadow-xl hover:shadow-primary-500/30 hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto justify-center"
              >
                {t('hero.cta_primary', 'Get a Free Demo')}
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 w-full sm:w-auto justify-center"
              >
                <ChevronRightIcon className="w-4 h-4" />
                {t('hero.cta_secondary', 'Explore Features')}
              </Link>
            </motion.div>

<motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
               {stats.map((stat) => (
                 <div key={stat.label} className="text-center">
                   <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mx-auto mb-3">
                     <span className="text-2xl">{stat.icon}</span>
                   </div>
                   <p className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white">{stat.value}</p>
                   <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{stat.label}</p>
                 </div>
               ))}
             </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="mt-16 lg:mt-20 relative mx-auto max-w-6xl"
          >
            <div className="relative rounded-3xl p-2 bg-gradient-to-b from-gray-200/50 to-transparent dark:from-gray-700/50 dark:to-transparent border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-10 bg-gray-100 dark:bg-gray-800 flex items-center gap-1.5 px-4 z-10">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-gray-400 font-medium">HRMS Pro — Interactive Dashboard Preview</span>
              </div>
              
              <div className="pt-10 bg-white dark:bg-gray-950 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
                  {/* Left Sidebar navigation inside mockup */}
                  <div className="lg:col-span-3 bg-gray-50/50 dark:bg-gray-900/40 p-4 border-r border-gray-100 dark:border-gray-800/80 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible whitespace-nowrap lg:whitespace-normal">
                    {dashboardTabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                            isActive
                              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/10 dark:shadow-primary-500/5'
                              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-850 hover:text-gray-900 dark:hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                          {tab.name}
                        </button>
                      );
                    })}
                    
                    {/* Add a tiny bottom design detail in the mockup sidebar */}
                    <div className="hidden lg:block mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50/50 dark:bg-primary-500/5 border border-primary-100/30 dark:border-primary-500/10 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-medium text-primary-600 dark:text-primary-500 uppercase tracking-wider">Live System Sync</span>
                      </div>
                    </div>
                  </div>

                  {/* Main mockup content area */}
                  <div className="lg:col-span-9 p-6 flex flex-col justify-between bg-white dark:bg-gray-950">
                    <div>
                      {/* Header in mockup */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <div>
                          <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {activeMockData[activeTab].chartTitle}
                          </h4>
                          <p className="text-xs text-gray-400">Workspace: Demo Organization</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-500 text-[10px] font-bold rounded-full uppercase tracking-wider">
                            Real-time
                          </span>
                          <span className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[10px] font-semibold rounded-full">
                            API Active
                          </span>
                        </div>
                      </div>

                      {/* Stats grid in mockup */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        {activeMockData[activeTab].stats.map((stat, i) => (
                          <div key={i} className="p-4 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-800/80 rounded-2xl shadow-sm">
                            <p className="text-xs font-medium text-gray-400">{stat.label}</p>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</span>
                              <span className={`text-[10px] font-bold ${
                                stat.changeType === 'positive'
                                  ? 'text-emerald-500'
                                  : stat.changeType === 'negative'
                                  ? 'text-rose-500'
                                  : 'text-gray-400'
                              }`}>
                                {stat.change}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Content block: visualization */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        <div className="lg:col-span-7 bg-gray-50/30 dark:bg-gray-900/10 border border-gray-100 dark:border-gray-850 rounded-2xl p-4 flex flex-col justify-center min-h-[200px]">
                          {/* Bars Chart */}
                          {activeMockData[activeTab].chartType === 'bars' && (
                            <div className="space-y-3">
                              {activeMockData[activeTab].chartData.map((bar, idx) => (
                                <div key={idx} className="space-y-1">
                                  <div className="flex justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
                                    <span>{bar.label}</span>
                                    <span>{bar.value}%</span>
                                  </div>
                                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${bar.value}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                      className={`h-full ${bar.color} rounded-full`}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Line Chart */}
                          {activeMockData[activeTab].chartType === 'line' && (
                            <div className="relative w-full h-full flex flex-col justify-between">
                              <svg className="w-full h-32 overflow-visible" viewBox="0 0 300 100">
                                <defs>
                                  <linearGradient id="glow-grad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                                  </linearGradient>
                                </defs>
                                <motion.path
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 0.8 }}
                                  d="M 10 90 Q 75 50, 150 20 T 290 30 L 290 100 L 10 100 Z"
                                  fill="url(#glow-grad)"
                                />
                                <motion.path
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  transition={{ duration: 1 }}
                                  d="M 10 90 Q 75 50, 150 20 T 290 30"
                                  fill="none"
                                  stroke="#6366f1"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                />
                                {activeMockData[activeTab].chartPoints.map((pt, idx) => {
                                  const x = 10 + idx * 70;
                                  const y = 100 - pt.height;
                                  return (
                                    <g key={idx}>
                                      <circle cx={x} cy={y} r="3.5" className="fill-white dark:fill-gray-900 stroke-primary-500 stroke-2" />
                                      <text x={x} y={y - 8} textAnchor="middle" className="text-[8px] font-bold fill-primary-600 dark:fill-primary-400">
                                        {pt.val}
                                      </text>
                                    </g>
                                  );
                                })}
                              </svg>
                              <div className="flex justify-between px-2 text-[10px] font-semibold text-gray-400 mt-2">
                                {activeMockData[activeTab].chartPoints.map((pt, i) => (
                                  <span key={i}>{pt.label}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Column Chart */}
                          {activeMockData[activeTab].chartType === 'columns' && (
                            <div className="w-full h-full flex flex-col justify-end">
                              <div className="flex justify-around items-end h-32 px-4 border-b border-gray-100 dark:border-gray-800">
                                {activeMockData[activeTab].chartColumns.map((col, idx) => (
                                  <div key={idx} className="flex flex-col items-center gap-2 w-full max-w-[40px]">
                                    <span className="text-[10px] font-bold text-gray-400">{col.value}</span>
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: `${col.height}px` }}
                                      transition={{ duration: 0.6, ease: "easeOut" }}
                                      className="w-full bg-gradient-to-t from-primary-500 to-secondary-500 rounded-t-lg shadow-md shadow-primary-500/10"
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex justify-around text-[10px] font-semibold text-gray-400 mt-2">
                                {activeMockData[activeTab].chartColumns.map((col, i) => (
                                  <span key={i} className="w-full max-w-[40px] text-center">{col.label}</span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Distribution Progress Bars */}
                          {activeMockData[activeTab].chartType === 'distribution' && (
                            <div className="space-y-3.5">
                              {activeMockData[activeTab].chartDistribution.map((dist, idx) => (
                                <div key={idx}>
                                  <div className="flex justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                                    <span>{dist.label}</span>
                                    <span>{dist.pct}%</span>
                                  </div>
                                  <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${dist.pct}%` }}
                                      transition={{ duration: 0.8, ease: "easeOut" }}
                                      className={`h-full ${dist.color} rounded-full`}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Logs section in mockup */}
                        <div className="lg:col-span-5 bg-gray-50/10 dark:bg-gray-900/5 border border-gray-100 dark:border-gray-800/60 rounded-2xl p-4 flex flex-col justify-between">
                          <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-ping" />
                            Activity Logs
                          </p>
                          <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px] pr-1">
                            <AnimatePresence mode="popLayout">
                              {activeMockData[activeTab].logs.map((log, index) => (
                                <motion.div
                                  key={log.text}
                                  initial={{ opacity: 0, x: 20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ duration: 0.25, delay: index * 0.05 }}
                                  className="flex flex-col p-2.5 bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-850 rounded-xl shadow-xs"
                                >
                                  <span className="text-[11px] font-medium text-gray-800 dark:text-gray-300 leading-tight">
                                    {log.text}
                                  </span>
                                  <span className="text-[9px] text-gray-400 mt-1">{log.time}</span>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom disclaimer footer inside mock */}
                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400">
                      <span>MULTI-TENANT & ROLE-PROTECTED</span>
                      <span className="flex items-center gap-1">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                        Encrypted & Audit-Logged
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────── Industry Coverage Bar ────── */}
      <section className="py-14 border-y border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mb-8">
            Trusted across industries worldwide
          </p>
          <div className="relative">
            <div className="flex gap-16 animate-marquee whitespace-nowrap">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex gap-16 items-center">
                  {['Manufacturing', 'Logistics & Supply Chain', 'Technology Services', 'Healthcare & Clinics', 'Retail & Distribution', 'Education & Training', 'Construction & Engineering', 'Professional Services'].map((name) => (
                    <span key={name} className="text-xl lg:text-2xl font-bold text-gray-300 dark:text-gray-700 tracking-tight select-none">{name}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ────── Trust & Security Bar ────── */}
      <section className="py-10 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
              Security & Compliance
            </span>
            {[
              { label: 'Role-Based Access Control', icon: 'shield' },
              { label: 'GDPR-Ready Data Management', icon: 'check' },
              { label: 'Multi-Tenant Data Isolation', icon: 'shield' },
              { label: '256-bit Encryption', icon: 'lock' },
              { label: '99.9% Uptime SLA', icon: 'cloud' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                {item.icon === 'shield' && <ShieldCheckIcon className="w-4 h-4 text-primary-500" />}
                {item.icon === 'check' && (
                  <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
                {item.icon === 'lock' && (
                  <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {item.icon === 'cloud' && (
                  <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                )}
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">All-in-One Platform</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Everything you need to manage your people
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              From recruiting to retirement, HRMS Pro unifies every stage of the employee lifecycle
              on a single, intelligent platform.
            </p>
          </AnimatedSection>

          <div className="grid lg:grid-cols-4 gap-8">
            {products.map((product, idx) => (
              <AnimatedItem key={product.name} delay={idx * 0.1}>
                <div className="h-full p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <span className="inline-block px-3 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-500 text-xs font-semibold rounded-lg mb-4">
                    {product.tag}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{product.name}</h3>
                  <ul className="space-y-2.5">
                    {product.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                        <CheckIcon className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link to="/demo" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-primary-500 hover:gap-2 transition-all">
                    Learn more <ChevronRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Features Grid ────── */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Features</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Enterprise-grade HR capabilities
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Deep functionality across every HR domain, backed by AI and global compliance.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <AnimatedItem key={feature.title} delay={idx * 0.06}>
                <div className="group p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-5 group-hover:bg-primary-600 dark:group-hover:bg-primary-500 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-primary-600 dark:text-primary-500 group-hover:text-white transition-all duration-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Interactive ROI & Savings Calculator Section ────── */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-gray-900 via-gray-950 to-primary-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="px-4 py-1.5 rounded-full bg-primary-500/20 border border-primary-500/30 text-xs font-bold text-primary-300 uppercase tracking-widest inline-block mb-4">
              Interactive ROI Calculator
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
              Calculate Your Team's Time & Cost Savings
            </h2>
            <p className="mt-4 text-base sm:text-lg text-gray-300">
              See how much time your HR team reclaims and how many dollars you save every year with HRMS Pro automation.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-gray-900/80 backdrop-blur-xl border border-gray-800 p-8 sm:p-12 rounded-3xl shadow-2xl">
            {/* Left Controls: Sliders */}
            <div className="lg:col-span-7 space-y-8">
              {/* Slider 1: Employee Count */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <label className="text-gray-300">Total Employee Headcount</label>
                  <span className="text-primary-400 font-extrabold text-lg px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                    {employeeCount} Employees
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={employeeCount}
                  onChange={(e) => setEmployeeCount(Number(e.target.value))}
                  className="w-full h-2.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                  <span>10 Team Members</span>
                  <span>500</span>
                  <span>1,000+ Enterprise</span>
                </div>
              </div>

              {/* Slider 2: Average Hourly HR Rate */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm font-semibold">
                  <label className="text-gray-300">Average Hourly HR Admin Cost</label>
                  <span className="text-primary-400 font-extrabold text-lg px-3 py-1 bg-primary-500/10 border border-primary-500/20 rounded-xl">
                    ${hourlyRate} / hour
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="120"
                  step="5"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full h-2.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-500"
                />
                <div className="flex justify-between text-[11px] text-gray-500 font-mono">
                  <span>$20/hr (Junior)</span>
                  <span>$60/hr</span>
                  <span>$120/hr (Senior People Ops)</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-850/60 border border-gray-800 text-xs text-gray-400 leading-relaxed flex items-center gap-3">
                <ShieldCheckIcon className="w-5 h-5 text-primary-400 shrink-0" />
                <span>Based on verified customer metrics showing 0.42 admin hours saved per employee per month via automated payroll and time-off tracking.</span>
              </div>
            </div>

            {/* Right Display: Live Financial Metrics */}
            <div className="lg:col-span-5 bg-gradient-to-br from-primary-900/40 via-secondary-900/20 to-gray-900 border border-primary-500/30 p-8 rounded-3xl space-y-6 text-center lg:text-left">
              <div>
                <p className="text-xs font-bold text-primary-300 uppercase tracking-widest mb-1">Estimated Annual Savings</p>
                <p className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                  ${annualSavingsDollars.toLocaleString()}
                  <span className="text-xs font-semibold text-primary-300 font-normal"> / year</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
                <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800">
                  <p className="text-2xl font-bold text-emerald-400">{hoursSavedPerMonth} hrs</p>
                  <p className="text-[11px] text-gray-400 font-medium">Reclaimed / Month</p>
                </div>
                <div className="p-4 bg-gray-900/80 rounded-2xl border border-gray-800">
                  <p className="text-2xl font-bold text-primary-400">75% Faster</p>
                  <p className="text-[11px] text-gray-400 font-medium">Payroll Execution</p>
                </div>
              </div>

              <Link
                to="/demo"
                className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-500/25 flex items-center justify-center gap-2 transition-all duration-200"
              >
                Schedule Custom ROI Breakdown
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ────── AI Intelligence Section ────── */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <AnimatedSection>
              <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">HRMS Pro AI</span>
              <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
                Intelligence that transforms how you work
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                Our AI engine learns your workforce patterns, predicts outcomes, and automates
                complex processes — so your HR team can focus on what matters most: your people.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Payroll Automation', 'Workflow Automation', 'Attendance Analytics', 'Leave Management'].map((tag) => (
                  <span key={tag} className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 dark:from-primary-500/10 dark:to-secondary-500/10 rounded-3xl blur-3xl" />
                <div className="relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
                      <SparklesIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white text-sm">HRMS Pro AI Assistant</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Online — Ready to help</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      { q: 'Show attrition risk for Q4', a: 'Based on current trends, Q4 attrition risk is 12.4% — up 2.1% from last quarter. Key drivers: compensation gap in Engineering and limited growth paths in Sales.' },
                      { q: 'Generate a headcount report', a: 'Headcount: 1,247 active employees across 6 departments. 23 open reqs, 14 in final stage. 92% fill rate within target SLA.' },
                    ].map((msg, i) => (
                      <div key={i}>
                        <div className="flex justify-end mb-2">
                          <div className="bg-primary-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%]">
                            {msg.q}
                          </div>
                        </div>
                        <div className="flex justify-start">
                          <div className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-sm px-4 py-2.5 rounded-2xl rounded-bl-sm max-w-[85%]">
                            {msg.a}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aiFeatures.map((feat, idx) => (
              <AnimatedItem key={feat.title} delay={idx * 0.06}>
                <div className="p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-md transition-all duration-300">
                  <feat.icon className="w-8 h-8 text-primary-600 dark:text-primary-500 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Platform Highlights Bar ────── */}
      <section className="py-20 bg-primary-600 dark:bg-primary-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 text-center">
            {[
              { value: 'Hours Saved', label: 'Every payroll cycle — automated end to end' },
              { value: 'Less Admin', label: 'Leave, attendance & payroll run automatically' },
              { value: 'Fast Setup', label: 'Go live in days, not months' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-4xl lg:text-5xl font-black text-white mb-2">{item.value}</p>
                <p className="text-primary-200 text-sm font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Testimonials ────── */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Testimonials</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Trusted by HR leaders worldwide
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <AnimatedItem key={t.author} delay={idx * 0.1}>
                <div className="h-full p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex flex-col">
                  <div className="flex gap-1 mb-5">
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <StarIcon key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6 flex-1">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    {t.image ? (
                      <img
                        className="w-10 h-10 rounded-full object-cover border border-primary-100 dark:border-primary-500/20"
                        src={t.image}
                        alt={t.author}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-600 dark:text-primary-500 font-bold text-sm">
                        {t.author.split(' ').map(n => n[0]).join('')}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{t.author}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t.role}</p>
                    </div>
                  </div>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Latest from Blog ────── */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Blog</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Latest insights from our team
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Actionable HR advice, industry trends, and practical guides to help you manage your workforce better.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid md:grid-cols-3 gap-8 mb-12">
            {blogPosts.slice(0, 3).map((post, idx) => (
              <AnimatedItem key={post.id} delay={idx * 0.06}>
                <Link to={`/blog/${post.id}`}
                  className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden h-full"
                >
                  <div className="relative h-52 overflow-hidden">
                    <img src={post.image} alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-semibold text-primary-600 dark:text-primary-500">
                      {post.category}
                    </div>
                  </div>
                  <div className="p-8 flex flex-col flex-1">
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                      <span className="flex items-center gap-1">
                        <CalendarDaysIcon className="w-3.5 h-3.5" />
                        {post.date}
                      </span>
                      {post.readTime && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                          <span className="text-xs">{post.readTime}</span>
                        </>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex-1 line-clamp-3 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{post.author?.name}</span>
                    </div>
                  </div>
                </Link>
              </AnimatedItem>
            ))}
          </StaggerContainer>

          <AnimatedSection className="text-center">
            <Link to="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm rounded-xl hover:bg-gray-800 dark:hover:bg-gray-100 transition-all shadow-sm"
            >
              View All Articles <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* ────── Integrations ────── */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedSection>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">APIs & Integrations</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
              Connect HRMS Pro with Your Tech Stack
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              Biometric hardware sync, developer REST APIs, automated webhooks, and flexible data exports out of the box.
            </p>
          </AnimatedSection>

          <div className="flex flex-wrap justify-center gap-4">
            {integrations.map((name) => (
              <span key={name} className="px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-primary-200 dark:hover:border-primary-700 hover:text-primary-600 dark:hover:text-primary-400 transition-all">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Pricing ────── */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Pricing</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
              Start free, upgrade as you grow. No hidden fees or surprise charges.
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, idx) => (
              <AnimatedItem key={plan.name} delay={idx * 0.1}>
                <div className={`h-full p-8 rounded-3xl border-2 flex flex-col ${
                  plan.popular
                    ? 'bg-white dark:bg-gray-900 border-primary-500 dark:border-primary-400 shadow-xl shadow-primary-500/10 scale-[1.02]'
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                }`}>
                  {plan.popular && (
                    <span className="inline-block self-start px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-lg mb-4">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{plan.desc}</p>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                    {plan.period && <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                        <CheckIcon className="w-4 h-4 text-primary-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/demo"
                    className={`w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                      plan.popular
                        ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/20'
                        : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                  </Link>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Lead Magnet CTA ────── */}
      <section className="py-16 bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950/30 dark:to-secondary-950/30 border-y border-primary-100 dark:border-primary-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-5 max-w-xl">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 border border-primary-100 dark:border-primary-800 shadow-sm flex items-center justify-center shrink-0">
                <DocumentTextIcon className="w-7 h-7 text-primary-600 dark:text-primary-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  Free Resource: HR Compliance Checklist 2026
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Essential compliance requirements every HR team needs to know. Download our comprehensive checklist.
                </p>
              </div>
            </div>
            <button
              onClick={() => setMagnetOpen(true)}
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl transition-all"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Download Free Guide
            </button>
          </div>
        </div>
      </section>

      {/* ────── Final CTA ────── */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 dark:from-primary-700 dark:via-primary-800 dark:to-secondary-900 rounded-[2.5rem] p-10 lg:p-20 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_white/10),_radial-gradient(circle_at_bottom_left,_white/5)]" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <AnimatedSection>
                <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight mb-6">
                  Ready to transform your HR operations?
                </h2>
                <p className="text-lg text-primary-200 mb-10 max-w-2xl mx-auto">
                  Join thousands of companies that have modernized their people operations with HRMS Pro.
                  Get your free demo environment today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email"
                    className="w-full px-5 py-3.5 bg-white/10 border border-white/20 text-white placeholder:text-primary-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <Link
                    to={`/demo${email ? `?email=${encodeURIComponent(email)}` : ''}`}
                    className="w-full sm:w-auto px-8 py-3.5 bg-white text-primary-700 font-bold text-sm rounded-xl hover:bg-primary-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    Get Started
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-xs text-primary-300 dark:text-primary-500 mt-4">
                  No credit card required. Free 14-day trial.
                </p>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      <LeadMagnetModal open={magnetOpen} onClose={() => setMagnetOpen(false)} resource={leadMagnet} />
    </PageWrapper>
  );
};

export default Home;
