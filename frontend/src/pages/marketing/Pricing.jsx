import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Pricing = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: 'Basic',
      description: 'Essential HR tools for small teams just getting started.',
      priceMonthly: 9,
      priceAnnual: 7,
      popular: false,
      features: ['Up to 50 employees', 'Employee Directory', 'Leave Management', 'Basic Reports', 'Email Support']
    },
    {
      name: 'Pro',
      description: 'Advanced features for growing companies that need more power.',
      priceMonthly: 19,
      priceAnnual: 15,
      popular: true,
      features: ['Up to 500 employees', 'Automated Payroll', 'Time & Attendance', 'Performance Reviews', 'Priority Support', 'Custom Workflows']
    },
    {
      name: 'Enterprise',
      description: 'Custom solutions for large organizations with complex needs.',
      priceMonthly: 39,
      priceAnnual: 29,
      popular: false,
      features: ['Unlimited employees', 'Advanced Analytics', 'API Access', 'Dedicated Account Manager', 'Custom Integrations', 'SLA Guarantee']
    }
  ];

  return (
    <div className="pt-20 bg-neutral-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-extrabold text-neutral-900 tracking-tight mb-6">Simple, transparent pricing</h1>
          <p className="text-xl text-neutral-600 mb-10">Choose the perfect plan for your team's needs. No hidden fees.</p>
          
          <div className="flex items-center justify-center gap-4">
            <span className={`text-lg ${!isAnnual ? 'font-bold text-neutral-900' : 'text-neutral-500'}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative inline-flex h-8 w-16 items-center rounded-full bg-primary-600 transition-colors focus:outline-none"
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${isAnnual ? 'translate-x-9' : 'translate-x-1'}`} />
            </button>
            <span className={`text-lg flex items-center gap-2 ${isAnnual ? 'font-bold text-neutral-900' : 'text-neutral-500'}`}>
              Annually <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Save 20%</span>
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div key={plan.name} className={`relative flex flex-col p-8 rounded-3xl bg-white border ${plan.popular ? 'border-primary-500 shadow-2xl shadow-primary-500/20' : 'border-neutral-200 shadow-lg'} transition-transform hover:-translate-y-2`}>
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <span className="bg-primary-500 text-white text-sm font-bold px-4 py-1 rounded-full uppercase tracking-wide">Most Popular</span>
                </div>
              )}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
                <p className="text-neutral-500 h-12">{plan.description}</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-extrabold text-neutral-900">${isAnnual ? plan.priceAnnual : plan.priceMonthly}</span>
                <span className="text-neutral-500">/user/month</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    <span className="text-neutral-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Link to="/signup" className={`w-full py-4 rounded-xl font-bold text-center transition-colors ${plan.popular ? 'bg-primary-600 hover:bg-primary-700 text-white' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900'}`}>
                Get Started
              </Link>
            </div>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-32 max-w-5xl mx-auto hidden md:block">
          <h2 className="text-3xl font-bold text-center mb-12">Compare features</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="py-4 px-6 font-bold text-neutral-900 border-b-2 border-neutral-200">Features</th>
                  <th className="py-4 px-6 font-bold text-center text-neutral-900 border-b-2 border-neutral-200">Basic</th>
                  <th className="py-4 px-6 font-bold text-center text-neutral-900 border-b-2 border-neutral-200">Pro</th>
                  <th className="py-4 px-6 font-bold text-center text-neutral-900 border-b-2 border-neutral-200">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {['Core HR', 'Time & Attendance', 'Payroll Processing', 'Performance Management', 'Custom Integrations'].map((feature, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50">
                    <td className="py-4 px-6 font-medium text-neutral-700">{feature}</td>
                    <td className="py-4 px-6 text-center">{idx < 1 ? '✓' : '—'}</td>
                    <td className="py-4 px-6 text-center">{idx < 4 ? '✓' : '—'}</td>
                    <td className="py-4 px-6 text-center text-primary-600 font-bold">✓</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Pricing;
