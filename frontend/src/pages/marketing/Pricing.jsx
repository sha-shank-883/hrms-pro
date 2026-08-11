import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon, CheckIcon, XMarkIcon,
  SparklesIcon, ShieldCheckIcon, 
} from '@heroicons/react/24/outline';
import { AnimatedSection, AnimatedItem } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const plans = [
  {
    name: 'Hatch',
    tag: 'For growing teams',
    price: '$6',
    period: '/employee/month',
    desc: 'Essential HR tools for small teams getting started.',
    features: [
      { text: 'Core HR & Employee Records', included: true },
      { text: 'Time-Off Management', included: true },
      { text: 'Basic Reporting', included: true },
      { text: 'Mobile App Access', included: true },
      { text: 'Email Support', included: true },
      { text: 'Performance Management', included: false },
      { text: 'Payroll Integration', included: false },
      { text: 'ATS & Onboarding', included: false },
      { text: 'Advanced Analytics', included: false },
      { text: 'Custom Integrations', included: false },
    ],
    popular: false,
    cta: 'Start Free Trial',
  },
  {
    name: 'Scale',
    tag: 'For scaling companies',
    price: '$12',
    period: '/employee/month',
    desc: 'Advanced features for growing organizations.',
    features: [
      { text: 'Core HR & Employee Records', included: true },
      { text: 'Time-Off Management', included: true },
      { text: 'Advanced Reporting', included: true },
      { text: 'Mobile App Access', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Performance Management', included: true },
      { text: 'Payroll Integration', included: true },
      { text: 'ATS & Onboarding', included: true },
      { text: 'Basic Analytics', included: true },
      { text: 'Custom Integrations', included: false },
    ],
    popular: true,
    cta: 'Start Free Trial',
  },
  {
    name: 'Enterprise',
    tag: 'For global organizations',
    price: 'Custom',
    period: '',
    desc: 'Tailored solutions for large enterprises.',
    features: [
      { text: 'Everything in Scale', included: true },
      { text: 'Multi-Country Payroll', included: true },
      { text: 'Dedicated CSM', included: true },
      { text: 'Custom Integrations', included: true },
      { text: 'White-Label Options', included: true },
      { text: '24/7 Support', included: true },
      { text: 'SSO & Advanced Security', included: true },
      { text: 'SLA Guarantee', included: true },
      { text: 'API Access', included: true },
      { text: 'On-Premise Option', included: true },
    ],
    popular: false,
    cta: 'Contact Sales',
  },
];

const addOns = [
  { name: 'Additional Storage', price: '$0.50', unit: 'GB/month' },
  { name: 'Premium Analytics', price: '$2', unit: '/employee/month' },
  { name: 'Dedicated Training', price: '$500', unit: '/session' },
  { name: 'API Access Tier 2', price: '$1,000', unit: '/month' },
];

const faqs = [
  { q: 'Can I upgrade or downgrade my plan at any time?', a: 'Yes. You can change your plan at any time. Changes take effect at the start of your next billing cycle. No long-term contracts required.' },
  { q: 'Is there a free trial available?', a: 'Yes, we offer a 14-day free trial with full access to all features in the Scale plan. No credit card required.' },
  { q: 'How does per-employee pricing work?', a: 'You are billed based on the number of active employees in your system. Inactive or terminated employees are not counted.' },
  { q: 'What countries does payroll support cover?', a: 'Our Enterprise plan supports payroll processing in 150+ countries. Scale plan includes payroll integration for US and Canada.' },
  { q: 'Do you offer discounts for non-profits?', a: 'Yes, we offer a 20% discount for verified non-profit organizations. Contact our sales team for more information.' },
  { q: 'What kind of support do you provide?', a: 'All plans include email support. Scale plans add priority support with 4-hour response time. Enterprise plans include 24/7 support with a dedicated CSM.' },
];

const Pricing = () => {
  const [annual, setAnnual] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div>
      <SEO
        title="Pricing"
        description="Simple, transparent pricing for HRMS Pro. Plans start at $6/employee/month. Start free, upgrade as you grow. No hidden fees or long-term contracts."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'HRMS Pro Pricing',
          description: 'Simple, transparent pricing for HR management.',
          publisher: { '@type': 'Organization', name: 'HRMS Pro' },
        }}
      />
      {/* ────── Hero ────── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Pricing</span>
            <h1 className="mt-4 text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6">
              Simple, transparent pricing
            </h1>
            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
              Start free, upgrade as you grow. No hidden fees, no surprise charges, 
              and no long-term contracts.
            </p>

            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm font-medium ${!annual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>Monthly</span>
              <button
                onClick={() => setAnnual(!annual)}
                className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${annual ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              >
                <span className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${annual ? 'translate-x-7.5' : 'translate-x-0.5'}`} />
              </button>
              <span className={`text-sm font-medium ${annual ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                Annual <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">Save 20%</span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ────── Plans ────── */}
      <section className="pb-24 lg:pb-32 -mt-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan, idx) => (
              <AnimatedItem key={plan.name} delay={idx * 0.1}>
                <div className={`h-full p-8 rounded-3xl border-2 flex flex-col ${
                  plan.popular
                    ? 'bg-white dark:bg-gray-900 border-indigo-500 dark:border-indigo-400 shadow-xl shadow-indigo-500/10 scale-[1.02] relative'
                    : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                }`}>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                      <SparklesIcon className="w-3 h-3" /> Most Popular
                    </span>
                  )}
                  <div className="mb-1">
                    <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{plan.tag}</span>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1">{plan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1 my-6">
                    <span className="text-4xl font-black text-gray-900 dark:text-white">
                      {annual && plan.price !== 'Custom' ? `$${Math.round(parseFloat(plan.price.replace('$', '')) * 12 * 0.8 / 12)}` : plan.price}
                    </span>
                    {plan.period && <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{plan.desc}</p>

                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f.text} className="flex items-start gap-2.5 text-sm">
                        {f.included ? (
                          <CheckIcon className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                        ) : (
                          <XMarkIcon className="w-4 h-4 text-gray-300 dark:text-gray-600 mt-0.5 shrink-0" />
                        )}
                        <span className={f.included ? 'text-gray-500 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>{f.text}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to="/demo"
                    className={`w-full text-center py-3.5 rounded-xl font-bold text-sm transition-all ${
                      plan.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Add-ons ────── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-3">Optional add-ons</h2>
            <p className="text-gray-500 dark:text-gray-400">Extend your platform with additional capabilities.</p>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {addOns.map((addon) => (
              <div key={addon.name} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 text-center">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-2">{addon.name}</p>
                <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{addon.price}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{addon.unit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── FAQ ────── */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">FAQ</span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Frequently asked questions
            </h2>
          </AnimatedSection>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div key={idx} className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span className="text-sm font-semibold text-gray-900 dark:text-white pr-4">{faq.q}</span>
                  <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${openFaq === idx ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openFaq === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="px-6 pb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed bg-white dark:bg-gray-900">
                    {faq.a}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center p-8 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Still have questions?</p>
            <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-3 transition-all">
              Contact our sales team <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ────── CTA ────── */}
      <section className="pb-24 lg:pb-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 dark:from-indigo-700 dark:via-indigo-800 dark:to-purple-900 rounded-[2.5rem] p-10 lg:p-20 text-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_white/10),_radial-gradient(circle_at_bottom_left,_white/5)]" />
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight mb-6">
                Start your free trial today
              </h2>
              <p className="text-lg text-indigo-200 mb-10">
                No credit card required. Full access to all features. Cancel anytime.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/demo"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-indigo-700 font-bold text-sm rounded-xl hover:bg-indigo-50 transition-all shadow-xl"
                >
                  Get Started Free <ArrowRightIcon className="w-4 h-4" />
                </Link>
                <Link
                  to="/features"
                  className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/10 transition-all"
                >
                  Compare Features
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Pricing;
