import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LockClosedIcon,
  SparklesIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const MODULE_METADATA = {
  payroll: {
    name: 'Automated Payroll & Salary Processing',
    tier: 'Scale (Pro) / Enterprise',
    description: 'Process employee salaries, generate custom compliant payslips, execute batch salary disbursements, and export statutory reports with one click.',
    features: ['One-click payroll calculation', 'Custom visual payslip designer', 'Automatic tax and statutory deductions', 'Bank disbursement batch exports']
  },
  recruitment: {
    name: 'Recruitment & ATS Hiring Pipeline',
    tier: 'Enterprise',
    description: 'Track job openings, manage candidates through custom stage pipelines, schedule interviews, and streamline candidate onboarding.',
    features: ['Visual Kanban applicant tracking', 'Job vacancy publishing', 'Resume & candidate scorecard review', 'Interview schedule coordination']
  },
  assets: {
    name: 'Company Asset Inventory',
    tier: 'Scale (Pro) / Enterprise',
    description: 'Track company hardware, laptops, peripherals, and office assets with assignment custody history and status logging.',
    features: ['Hardware & serial number tracking', 'Employee custody allocation', 'Return and maintenance logs', 'Asset status lifecycle']
  },
  chat: {
    name: 'Real-time Team Messaging',
    tier: 'Scale (Pro) / Enterprise',
    description: 'Collaborate with your team instantly via real-time department channels and 1-on-1 direct messages.',
    features: ['Encrypted instant team messaging', 'Department-based public/private channels', 'File sharing & message reactions', 'Online presence status']
  },
  performance: {
    name: 'Performance Reviews & Appraisals',
    tier: 'Hatch (Starter) / Pro / Enterprise',
    description: 'Conduct 360-degree performance evaluations, set quarterly OKRs, track KPIs, and manage employee growth goals.',
    features: ['OKR & Goal tracking', 'Performance review cycles', 'Manager and peer review workflows', 'Employee rating matrices']
  },
  biometrics: {
    name: 'Biometric Device Integration',
    tier: 'Enterprise',
    description: 'Connect on-premise biometric hardware (ZKTeco, CAMS) for automated real-time attendance punching.',
    features: ['Real-time push webhook sync', 'Hardware serial number registry', 'Automated punch-to-timesheet calculation', 'Multi-location device mapping']
  },
  live_activity: {
    name: 'Live Activity Stream & Radar',
    tier: 'Enterprise',
    description: 'Monitor real-time employee check-ins, active work sessions, and departmental presence across offices.',
    features: ['Live real-time activity ticker', 'Geofence check-in radar', 'Immediate audit notifications', 'Live workforce attendance map']
  },
  reports_analytics: {
    name: 'Advanced Reports & Churn Analytics',
    tier: 'Hatch (Starter) / Pro / Enterprise',
    description: 'Deep-dive into workforce metrics, attrition risk models, headcount trends, and custom report builders.',
    features: ['Predictive employee churn score', 'Custom visual report builder', 'Departmental cost breakdowns', 'CSV & PDF bulk export']
  },
  audit_logs: {
    name: 'Security Audit & Compliance Logs',
    tier: 'Enterprise',
    description: 'Comprehensive immutable audit trail of all administrative actions, data edits, logins, and system changes.',
    features: ['SOC2 & ISO compliant audit trail', 'IP address & user-agent tracking', 'Sensitive data change history', 'Security incident forensic logs']
  }
};

const ModuleGuard = ({ module, children }) => {
  const { user, hasModule } = useAuth();

  if (hasModule(module)) {
    return children;
  }

  const meta = MODULE_METADATA[module] || {
    name: `${module.charAt(0).toUpperCase() + module.slice(1)} Module`,
    tier: 'Pro / Enterprise',
    description: 'This feature is part of our premium business plans.',
    features: ['Enhanced automation & productivity', 'Role-based access control', 'Full data isolation']
  };

  const isAdmin = user?.role === 'admin' || user?.isSuperAdmin;

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-3xl border border-neutral-200/80 dark:border-gray-700 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 p-8 text-white relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3.5 bg-white/15 rounded-2xl backdrop-blur-md border border-white/20 shadow-inner">
              <LockClosedIcon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/20 text-amber-200 border border-amber-400/30 rounded-full text-xs font-bold tracking-wide uppercase mb-2">
                <SparklesIcon className="w-3.5 h-3.5" />
                Available on {meta.tier}
              </div>
              <h2 className="text-2xl font-black tracking-tight">{meta.name}</h2>
              <p className="text-primary-100 text-sm mt-1 leading-relaxed">
                {meta.description}
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8">
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
            What's included with this module:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {meta.features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-gray-750 border border-neutral-100 dark:border-gray-700 text-xs text-neutral-700 dark:text-gray-300">
                <ShieldCheckIcon className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Action / Upgrade Section */}
          <div className="pt-6 border-t border-neutral-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-neutral-500 dark:text-gray-400 text-center sm:text-left">
              {isAdmin ? (
                <span>You can upgrade your subscription anytime from the billing tab.</span>
              ) : (
                <span className="flex items-center gap-1.5 justify-center sm:justify-start">
                  <BuildingOfficeIcon className="w-4 h-4 text-neutral-400" />
                  Contact your organization's administrator to request access.
                </span>
              )}
            </div>

            {isAdmin && (
              <Link
                to="/settings?tab=billing"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all"
              >
                <span>Upgrade Plan</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleGuard;
