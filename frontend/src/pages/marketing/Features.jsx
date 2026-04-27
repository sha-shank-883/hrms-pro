import React from 'react';
import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  CalendarIcon,
  BriefcaseIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const Features = () => {
  const modules = [
    {
      id: 'employee-management',
      title: 'Employee Management',
      description: 'A centralized, secure database for all your employee information. Store documents, track history, and manage access effortlessly.',
      icon: UsersIcon,
      image: '/mockups/dashboard.png',
      reverse: false
    },
    {
      id: 'payroll',
      title: 'Automated Payroll',
      description: 'Run payroll accurately and on time. Automatically calculate taxes, deductions, and handle multiple pay cycles with our intuitive interface.',
      icon: CurrencyDollarIcon,
      image: '/mockups/payroll.png',
      reverse: true
    },
    {
      id: 'attendance',
      title: 'Time & Attendance',
      description: 'Track employee hours, manage shifts, and monitor real-time attendance with geo-fencing and biometric integration.',
      icon: ClockIcon,
      image: '/mockups/attendance.png',
      reverse: false
    },
    {
      id: 'leave',
      title: 'Leave Management',
      description: 'Customize time-off policies, automate approval workflows, and give employees a self-service portal to manage their balances.',
      icon: CalendarIcon,
      image: '/mockups/dashboard.png', // Reusing for now
      reverse: true
    },
    {
      id: 'recruitment',
      title: 'Recruitment & ATS',
      description: 'Streamline your hiring process from job posting to onboarding. Track applicants, schedule interviews, and collaborate with your team.',
      icon: BriefcaseIcon,
      image: '/mockups/payroll.png', // Reusing for now
      reverse: false
    },
    {
      id: 'performance',
      title: 'Performance Tracking',
      description: 'Set OKRs, conduct 360-degree reviews, and track employee development with continuous feedback loops.',
      icon: ChartBarIcon,
      image: '/mockups/attendance.png', // Reusing for now
      reverse: true
    }
  ];

  return (
    <div className="pt-20 bg-white min-h-screen">
      {/* Header */}
      <div className="bg-primary-50 py-24 border-b border-primary-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-extrabold text-neutral-900 tracking-tight mb-6">Powerful features for modern HR</h1>
          <p className="text-xl text-neutral-600">Everything you need to manage the entire employee lifecycle in one beautiful platform.</p>
        </div>
      </div>

      {/* Modules */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 space-y-32">
        {modules.map((mod) => (
          <div key={mod.id} id={mod.id} className={`flex flex-col ${mod.reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} gap-16 items-center`}>
            <div className="flex-1 space-y-6">
              <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center shadow-inner">
                <mod.icon className="w-8 h-8" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900">{mod.title}</h2>
              <p className="text-xl text-neutral-600 leading-relaxed">{mod.description}</p>
              <ul className="space-y-4 pt-4">
                {[1, 2, 3].map(i => (
                  <li key={i} className="flex items-center gap-3 text-neutral-700">
                    <svg className="w-6 h-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    Advanced capability highlight {i}
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex-1 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-200 to-purple-200 rounded-3xl blur-2xl opacity-40 transform translate-x-4 translate-y-4"></div>
              <img src={mod.image} alt={mod.title} className="relative rounded-2xl shadow-xl border border-neutral-200 w-full object-cover" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;
