import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRightIcon, CheckIcon, PlayIcon, ArrowDownTrayIcon,
  UserGroupIcon, DocumentTextIcon, ClockIcon, BanknotesIcon,
  ChartBarIcon, ShieldCheckIcon, SparklesIcon, CpuChipIcon,
  GlobeAltIcon, DevicePhoneMobileIcon, CloudArrowUpIcon,
  StarIcon, ChevronRightIcon, CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { PageWrapper, AnimatedSection, AnimatedItem, StaggerContainer } from '../../components/common/AnimatedSection';
import SEO, { OrganizationSchema } from '../../components/common/SEO';
import LeadMagnetModal from '../../components/marketing/LeadMagnetModal';
import blogPosts from './blogPosts';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } }
};

const stats = [
  { value: '10K+', label: 'Companies Trust Us', icon: '🏢' },
  { value: '2M+', label: 'Employees Onboarded', icon: '👥' },
  { value: '150+', label: 'Countries Supported', icon: '🌐' },
  { value: '99.9%', label: 'Uptime SLA', icon: '⚡' },
];

const features = [
  {
    icon: UserGroupIcon, title: 'Core HR',
    desc: 'Centralized employee records, org charts, and document management with real-time data sync across your organization.'
  },
  {
    icon: ClockIcon, title: 'Time & Attendance',
    desc: 'Biometric integration, shift scheduling, overtime tracking, and automated timesheets with global compliance.'
  },
  {
    icon: BanknotesIcon, title: 'Payroll Management',
    desc: 'Multi-country payroll processing with auto-calculations, tax compliance, and direct integration with HR data.'
  },
  {
    icon: ChartBarIcon, title: 'Performance & Goals',
    desc: 'OKR tracking, 360-degree reviews, continuous feedback, and AI-powered performance insights to drive growth.'
  },
  {
    icon: DocumentTextIcon, title: 'Talent Management',
    desc: 'End-to-end recruitment, onboarding workflows, learning management, and succession planning in one platform.'
  },
  {
    icon: ShieldCheckIcon, title: 'Compliance & Security',
    desc: 'SOC 2 Type II certified, GDPR compliant, role-based access, audit trails, and enterprise-grade data encryption.'
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
    icon: CloudArrowUpIcon, title: 'Seamless Integrations',
    desc: 'Connect with 100+ tools — Slack, Zoom, Salesforce, QuickBooks — for a unified HR tech stack.'
  },
  {
    icon: ChartBarIcon, title: 'Real-Time Analytics',
    desc: '150+ pre-built metrics and customizable dashboards give leadership instant visibility into workforce health.'
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
    items: ['Recruitment ATS', 'Onboarding', 'Performance Reviews', 'Learning Management'],
    image: null
  },
  {
    name: 'Payroll', tag: 'Global & Local',
    items: ['Multi-Country Payroll', 'Tax Compliance', 'Benefits Admin', 'Payslip Portal'],
    image: null
  },
  {
    name: 'Workforce', tag: 'Plan & Optimize',
    items: ['Workforce Planning', 'Compensation Benchmarking', 'Time Tracking', 'Shift Scheduling'],
    image: null
  },
];

const testimonials = [
  {
    quote: 'HRMS Pro transformed our people operations. We reduced admin time by 70% and improved employee satisfaction scores across the board.',
    author: 'Sarah Chen', role: 'VP of People, TechFlow Inc.', rating: 5,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150&h=150'
  },
  {
    quote: 'The AI-powered insights helped us identify retention risks we had completely missed. Within a quarter, we reduced voluntary attrition by 35%.',
    author: 'Marcus Rodriguez', role: 'CHRO, OmniCorp Global', rating: 5,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150'
  },
  {
    quote: 'Implementing HRMS Pro across 12 countries was seamless. The multi-currency payroll and compliance features saved us millions in penalties.',
    author: 'Emily Watson', role: 'Director of HR Ops, ScaleUp Ltd.', rating: 5,
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150'
  },
];

const integrations = [
  'Slack', 'Zoom', 'Microsoft Teams', 'Google Workspace',
  'Salesforce', 'QuickBooks', 'SAP', 'Oracle',
  'Xero', 'BambooHR', 'Workday', 'ADP'
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
      { label: 'Engineering', value: 85, color: 'bg-indigo-500' },
      { label: 'Sales', value: 65, color: 'bg-purple-500' },
      { label: 'Marketing', value: 45, color: 'bg-pink-500' },
      { label: 'Product & Design', value: 35, color: 'bg-blue-500' },
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
      { text: 'Benefits deductions synced with MetLife API', time: '4 hours ago' }
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
      { label: 'Outstanding (5★)', pct: 15, color: 'bg-indigo-600' },
      { label: 'Exceeds (4★)', pct: 35, color: 'bg-indigo-400' },
      { label: 'Meets (3★)', pct: 48, color: 'bg-indigo-300' },
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
  const [email, setEmail] = useState('');
  const [magnetOpen, setMagnetOpen] = useState(false);
  const [exited, setExited] = useState(false);
  const [activeTab, setActiveTab] = useState('core-hr');

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
      {/* ────── Hero Section ────── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/60 via-transparent to-transparent dark:from-indigo-500/5" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-gradient-to-b from-indigo-100/30 to-transparent dark:from-indigo-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-4xl mx-auto text-center">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-8">
              <SparklesIcon className="w-3.5 h-3.5" />
              Now Available — AI-Native HCM Platform v3.0
            </motion.div>

            <motion.h1 variants={fadeInUp} className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6">
              The{' '}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">AI-Powered</span>{' '}
              HR Platform for Global Enterprises
            </motion.h1>

            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              Unify your people, payroll, and performance data on a single platform.
              Automate workflows, unlock AI-driven insights, and empower your workforce
              — from hire to retire.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 transition-all duration-300 w-full sm:w-auto justify-center"
              >
                Get a Free Demo
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                to="#how-it-works"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 w-full sm:w-auto justify-center"
              >
                <PlayIcon className="w-4 h-4" />
                Watch Overview
              </Link>
            </motion.div>

<motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
               {stats.map((stat) => (
                 <div key={stat.label} className="text-center">
                   <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
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
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/10 dark:shadow-indigo-500/5'
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
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50/50 dark:bg-indigo-500/5 border border-indigo-100/30 dark:border-indigo-500/10 rounded-lg">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Live System Sync</span>
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
                          <p className="text-xs text-gray-400">Workspace Tenant: TechFlow Inc.</p>
                        </div>
                        <div className="flex gap-2">
                          <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
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
                                      <circle cx={x} cy={y} r="3.5" className="fill-white dark:fill-gray-900 stroke-indigo-500 stroke-2" />
                                      <text x={x} y={y - 8} textAnchor="middle" className="text-[8px] font-bold fill-indigo-600 dark:fill-indigo-400">
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
                                      className="w-full bg-gradient-to-t from-indigo-500 to-purple-500 rounded-t-lg shadow-md shadow-indigo-500/10"
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
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping" />
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
                      <span>SECURE & COMPLIANT ENV</span>
                      <span className="flex items-center gap-1">
                        <ShieldCheckIcon className="w-3.5 h-3.5 text-emerald-500" />
                        SOC 2 Type II Verified
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────── Social Proof: Customer Logos Marquee ────── */}
      <section className="py-14 border-y border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mb-8">
            Trusted by innovative teams worldwide
          </p>
          <div className="relative">
            <div className="flex gap-16 animate-marquee whitespace-nowrap">
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex gap-16 items-center">
                  {['TechFlow', 'OmniCorp', 'ScaleUp', 'NexGen', 'CloudBase', 'DataSync', 'GreenLeaf', 'PrimeStack'].map((name) => (
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
              { label: 'SOC 2 Type II', icon: 'shield' },
              { label: 'GDPR Compliant', icon: 'check' },
              { label: 'ISO 27001', icon: 'shield' },
              { label: '256-bit Encryption', icon: 'lock' },
              { label: '99.9% Uptime SLA', icon: 'cloud' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm">
                {item.icon === 'shield' && <ShieldCheckIcon className="w-4 h-4 text-indigo-500" />}
                {item.icon === 'check' && (
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                )}
                {item.icon === 'lock' && (
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
                {item.icon === 'cloud' && (
                  <svg className="w-4 h-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">All-in-One Platform</span>
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
                  <span className="inline-block px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold rounded-lg mb-4">
                    {product.tag}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{product.name}</h3>
                  <ul className="space-y-2.5">
                    {product.items.map((item) => (
                      <li key={item} className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                        <CheckIcon className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link to="/demo" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-2 transition-all">
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
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Features</span>
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
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-all duration-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── AI Intelligence Section ────── */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center mb-20">
            <AnimatedSection>
              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">HRMS Pro AI</span>
              <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
                Intelligence that transforms how you work
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                Our AI engine learns your workforce patterns, predicts outcomes, and automates
                complex processes — so your HR team can focus on what matters most: your people.
              </p>
              <div className="flex flex-wrap gap-3">
                {['Predictive Analytics', 'Smart Automation', 'Skills Intelligence', 'Compliance AI'].map((tag) => (
                  <span key={tag} className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400">
                    {tag}
                  </span>
                ))}
              </div>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 dark:from-indigo-500/10 dark:to-purple-500/10 rounded-3xl blur-3xl" />
                <div className="relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 lg:p-10">
                  <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center">
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
                          <div className="bg-indigo-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-br-sm max-w-[85%]">
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
                  <feat.icon className="w-8 h-8 text-indigo-600 dark:text-indigo-400 mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── ROI / Stats Bar ────── */}
      <section className="py-20 bg-indigo-600 dark:bg-indigo-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10 text-center">
            {[
              { value: '254%', label: 'Average ROI in first year' },
              { value: '70%', label: 'Reduction in admin tasks' },
              { value: '< 6 weeks', label: 'Average implementation time' },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-4xl lg:text-5xl font-black text-white mb-2">{item.value}</p>
                <p className="text-indigo-200 text-sm font-medium">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Testimonials ────── */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Testimonials</span>
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
                        className="w-10 h-10 rounded-full object-cover border border-indigo-100 dark:border-indigo-500/20"
                        src={t.image}
                        alt={t.author}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
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
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Blog</span>
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
                    <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-semibold text-indigo-600 dark:text-indigo-400">
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
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
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
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Integrations</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
              Connect your tech stack
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
              100+ pre-built integrations with the tools you already use.
            </p>
          </AnimatedSection>

          <div className="flex flex-wrap justify-center gap-4">
            {integrations.map((name) => (
              <span key={name} className="px-5 py-2.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:border-indigo-200 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all">
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
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Pricing</span>
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
                    ? 'bg-white dark:bg-gray-900 border-indigo-500 dark:border-indigo-400 shadow-xl shadow-indigo-500/10 scale-[1.02]'
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                }`}>
                  {plan.popular && (
                    <span className="inline-block self-start px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg mb-4">
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
                        <CheckIcon className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/demo"
                    className={`w-full text-center py-3 rounded-xl font-bold text-sm transition-all ${
                      plan.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
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
      <section className="py-16 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-y border-indigo-100 dark:border-indigo-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-start gap-5 max-w-xl">
              <div className="w-14 h-14 rounded-2xl bg-white dark:bg-gray-900 border border-indigo-100 dark:border-indigo-800 shadow-sm flex items-center justify-center shrink-0">
                <DocumentTextIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
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
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all"
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
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 dark:from-indigo-700 dark:via-indigo-800 dark:to-purple-900 rounded-[2.5rem] p-10 lg:p-20 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_white/10),_radial-gradient(circle_at_bottom_left,_white/5)]" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <AnimatedSection>
                <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight mb-6">
                  Ready to transform your HR operations?
                </h2>
                <p className="text-lg text-indigo-200 mb-10 max-w-2xl mx-auto">
                  Join thousands of companies that have modernized their people operations with HRMS Pro.
                  Get your free demo environment today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your work email"
                    className="w-full px-5 py-3.5 bg-white/10 border border-white/20 text-white placeholder:text-indigo-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                  <Link
                    to="/demo"
                    className="w-full sm:w-auto px-8 py-3.5 bg-white text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    Get Started
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
                <p className="text-xs text-indigo-300 dark:text-indigo-400 mt-4">
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
