import React from 'react';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  ServerIcon,
  DocumentCheckIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-gradient-to-b from-primary-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 font-medium text-sm mb-6 border border-primary-200">
              <span className="flex h-2 w-2 rounded-full bg-primary-600"></span>
              Introducing the all-new HRMS Pro 2.0
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-neutral-900 tracking-tight mb-8">
              The Modern HRMS for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400">Growing Teams</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Streamline your HR processes, empower your employees, and make data-driven decisions with our all-in-one platform designed specifically for modern scaling businesses.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/signup" className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-1">
                Start Free Trial
              </Link>
              <Link to="/features" className="px-8 py-4 bg-white hover:bg-neutral-50 text-neutral-900 font-bold rounded-full shadow-md border border-neutral-200 transition-all hover:-translate-y-1">
                Explore Features
              </Link>
            </div>
            <p className="mt-4 text-sm text-neutral-500">No credit card required • 14-day free trial • Cancel anytime</p>
          </div>
          
          <div className="mt-20 relative mx-auto max-w-6xl">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10"></div>
            <img 
              src="/mockups/dashboard.png" 
              alt="HRMS Dashboard" 
              className="rounded-2xl shadow-2xl border border-neutral-200 relative z-0 w-full"
            />
          </div>
        </div>
      </section>

      {/* Statistics / Social Proof Section */}
      <section className="py-12 border-b border-neutral-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-extrabold text-primary-600">10k+</p>
              <p className="mt-2 text-neutral-600 font-medium">Companies Worldwide</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-primary-600">5M+</p>
              <p className="mt-2 text-neutral-600 font-medium">Employees Managed</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-primary-600">99.9%</p>
              <p className="mt-2 text-neutral-600 font-medium">Uptime SLA</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-primary-600">24/7</p>
              <p className="mt-2 text-neutral-600 font-medium">Customer Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Modules Section */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">A complete ecosystem for your workforce</h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">Replace scattered spreadsheets and disconnected apps with one unified platform.</p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { title: 'Core HR & Employee Data', desc: 'Centralized, secure database for all employee records, documents, and historical data. Never lose a file again.', icon: UserGroupIcon },
              { title: 'Automated Payroll Processing', desc: 'Run accurate payroll in minutes. We handle tax calculations, deductions, and direct deposits automatically.', icon: CurrencyDollarIcon },
              { title: 'Time, Attendance & Leave', desc: 'Track hours, manage shifts with geo-fencing, and automate complex time-off approval workflows.', icon: ClockIcon },
              { title: 'Performance Management', desc: 'Set organizational OKRs, conduct 360-degree reviews, and track employee growth seamlessly.', icon: ChartBarIcon },
              { title: 'Recruitment & ATS', desc: 'Post jobs, track applicants through custom pipelines, and seamlessly convert candidates to employees.', icon: DocumentCheckIcon },
              { title: 'Seamless Integrations', desc: 'Connect with your favorite tools like Slack, Google Workspace, and accounting software.', icon: ArrowsRightLeftIcon },
            ].map((feature, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white border border-neutral-100 shadow-sm hover:shadow-xl transition-shadow duration-300 group">
                <div className="w-14 h-14 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3">{feature.title}</h3>
                <p className="text-neutral-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works / Value Proposition */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary-200 to-blue-200 rounded-3xl blur-3xl opacity-40"></div>
              <img src="/mockups/attendance.png" alt="Attendance tracking" className="relative rounded-2xl shadow-2xl border border-neutral-100" />
            </div>
            <div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-neutral-900">Transform how you manage time and attendance</h2>
              <p className="text-xl text-neutral-600 mb-8 leading-relaxed">Stop chasing timesheets. Our intelligent attendance module gives you real-time visibility into your workforce.</p>
              
              <ul className="space-y-6">
                {[
                  { title: 'Geo-Fenced Clock-ins', desc: 'Ensure employees are where they need to be with GPS-restricted attendance capturing.' },
                  { title: 'Automated Shift Rostering', desc: 'Create and distribute complex shift schedules in minutes with collision detection.' },
                  { title: 'Real-time Analytics', desc: 'Monitor overtime, absenteeism, and labor costs through interactive dashboards.' }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-4">
                    <div className="w-8 h-8 mt-1 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-neutral-900">{item.title}</h4>
                      <p className="text-neutral-600 mt-1">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Compliance */}
      <section className="py-24 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Enterprise-grade security you can trust</h2>
          <p className="text-xl text-neutral-400 max-w-3xl mx-auto mb-16">Your employee data is your most sensitive asset. We protect it with industry-leading security practices and rigorous compliance standards.</p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-neutral-800 rounded-2xl border border-neutral-700">
              <ShieldCheckIcon className="w-12 h-12 text-primary-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3">Data Encryption</h3>
              <p className="text-neutral-400">All data is encrypted at rest using AES-256 and in transit using TLS 1.3 protocols.</p>
            </div>
            <div className="p-8 bg-neutral-800 rounded-2xl border border-neutral-700">
              <DocumentCheckIcon className="w-12 h-12 text-primary-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3">Global Compliance</h3>
              <p className="text-neutral-400">Fully compliant with GDPR, CCPA, SOC 2 Type II, and local labor data regulations.</p>
            </div>
            <div className="p-8 bg-neutral-800 rounded-2xl border border-neutral-700">
              <ServerIcon className="w-12 h-12 text-primary-400 mx-auto mb-6" />
              <h3 className="text-xl font-bold mb-3">Reliable Infrastructure</h3>
              <p className="text-neutral-400">Hosted on enterprise cloud providers with continuous backups and disaster recovery.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">Loved by HR Teams</h2>
            <p className="text-xl text-neutral-600">Join the thousands of professionals who have upgraded their HR operations.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: "Sarah Jenkins", role: "HR Director, TechFlow", text: "HRMS Pro completely transformed how we handle employee onboarding. What used to take days now takes minutes. Highly recommended!" },
              { name: "Marcus Johnson", role: "CEO, Innovate Inc", text: "The automated payroll processing alone has saved us countless hours of manual calculations and compliance headaches." },
              { name: "Elena Rodriguez", role: "Operations Manager, RetailCo", text: "The geo-fenced attendance tracking gave us the exact visibility we needed for our distributed retail workforce. Fantastic tool." }
            ].map((t, i) => (
              <div key={i} className="bg-white p-8 rounded-2xl shadow-lg border border-neutral-100 flex flex-col">
                <div className="flex text-yellow-400 mb-4">
                  {[1,2,3,4,5].map(star => <svg key={star} className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}
                </div>
                <p className="text-neutral-700 mb-8 flex-1 italic">"{t.text}"</p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-lg`}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900">{t.name}</h4>
                    <p className="text-sm text-neutral-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-primary-600 opacity-5"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-6">Ready to transform your HR?</h2>
          <p className="text-xl text-neutral-600 mb-10">Join thousands of companies that use HRMS Pro to manage their teams, process payroll, and scale effectively.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/signup" className="px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-full shadow-lg transition-all hover:-translate-y-1">
              Start Your Free Trial
            </Link>
            <Link to="/demo" className="px-8 py-4 bg-white hover:bg-neutral-50 text-neutral-900 font-bold rounded-full shadow-md border border-neutral-200 transition-all hover:-translate-y-1">
              Request a Live Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
