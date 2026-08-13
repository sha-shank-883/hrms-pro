import React from 'react';
import { motion } from 'framer-motion';
import { PageWrapper, AnimatedItem } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';
import {
  ArrowPathIcon,
  ShieldCheckIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

const sections = [
  {
    title: '1. Subscription Cancellation',
    icon: ArrowPathIcon,
    content: [
      'You can cancel your HRMS Pro subscription at any time directly through your dashboard by navigating to Administration > Settings > Billing & Plan.',
      'Upon cancellation, your subscription will remain active until the end of your current paid billing period (monthly or annual), and you will not be charged again.',
      'We do not charge any cancellation fees or penalties for ending your subscription.',
      'You retain access to export all your employee, payroll, attendance, and organizational records for up to 30 days following the cancellation date.',
    ],
  },
  {
    title: '2. 7-Day Money-Back Guarantee (New Subscriptions)',
    icon: ShieldCheckIcon,
    content: [
      'We offer a 100% risk-free 7-day money-back guarantee for first-time subscribers on all Hatch and Scale plans.',
      'If you find that HRMS Pro does not meet your business or operational requirements within the first 7 calendar days of your initial purchase, you are eligible for a full refund.',
      'To request a full refund within 7 days, simply email support@hrmspro.online with your registered Organization/Tenant ID and payment transaction reference.',
    ],
  },
  {
    title: '3. Refund Eligibility & Exceptions',
    icon: CheckCircleIcon,
    content: [
      'Eligible Refunds: Accidental duplicate charges, billing discrepancies, verified technical platform downtime exceeding SLA (>1% downtime in a billing cycle), or requests made within the 7-day initial guarantee window.',
      'Non-Refundable: Partial-month usage after the 7-day window, change of mind after extended usage, or accounts suspended due to violations of our Terms of Service (such as fraudulent activity or malicious usage).',
      'Enterprise Custom Contracts: Enterprise plans with custom software development, dedicated instance deployment, or custom SLAs are governed by the specific terms detailed in their signed Master Services Agreement (MSA).',
    ],
  },
  {
    title: '4. Refund Processing & Timelines',
    icon: ClockIcon,
    content: [
      'Once your refund request is verified and approved by our billing team, the refund is initiated within 24 to 48 business hours.',
      'Refunds are credited directly to the original payment method used during checkout (Razorpay: UPI, Debit/Credit Card, Net Banking; or PayPal).',
      'Banking Processing Timeline: Depending on your issuing bank or payment gateway, funds typically reflect in your account within 5 to 7 business days.',
      'You will receive an automated email confirmation with the Razorpay/PayPal refund reference number as soon as the refund transaction is initiated.',
    ],
  },
  {
    title: '5. Contact & Support for Billing Queries',
    icon: ExclamationCircleIcon,
    content: [
      'If you have any questions, encounter billing discrepancies, or need assistance with your subscription, please reach out to our dedicated billing and support desk:',
      'Email: support@hrmspro.online or billing@hrmspro.online',
      'Operating Hours: Monday – Friday, 9:00 AM – 6:00 PM IST',
      'Address: HRMS Pro Technologies, 100 Tech Park, Outer Ring Road, Bangalore, Karnataka 560103, India',
    ],
  },
];

const CancellationRefund = () => {
  const { t } = useWebsiteBuilder();

  return (
    <PageWrapper>
      <SEO
        title="Cancellation & Refund Policy"
        description="Review HRMS Pro's Cancellation and Refund Policy. Transparent guidelines on subscription cancellation, 7-day money-back guarantee, and refund timelines."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Cancellation and Refund Policy',
          description: 'HRMS Pro cancellation terms and refund procedures.',
          publisher: { '@type': 'Organization', name: 'HRMS Pro' },
        }}
      />

      {/* Hero Header */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">
              Policies & Compliance
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.05] mb-6">
              Cancellation & Refund Policy
            </h1>
            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              We believe in complete transparency and customer trust. Read below for our fair and clear cancellation and refund process.
            </p>
            <p className="text-xs text-gray-400 mt-4">
              Last Updated: August 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* Policy Sections */}
      <section className="py-16 lg:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 space-y-8">
          {sections.map((section, idx) => (
            <AnimatedItem key={section.title} delay={idx * 0.05}>
              <div className="p-8 bg-gray-50/70 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-xl">
                    <section.icon className="w-6 h-6" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {section.title}
                  </h2>
                </div>
                <ul className="space-y-2.5 pl-2 text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  {section.content.map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-2.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedItem>
          ))}
        </div>
      </section>
    </PageWrapper>
  );
};

export default CancellationRefund;
