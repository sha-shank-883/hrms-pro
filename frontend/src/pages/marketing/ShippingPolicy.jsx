import React from 'react';
import { motion } from 'framer-motion';
import { PageWrapper, AnimatedItem } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';
import {
  BoltIcon,
  EnvelopeOpenIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

const sections = [
  {
    title: '1. Nature of Product & Digital SaaS Delivery',
    icon: ComputerDesktopIcon,
    content: [
      'HRMS Pro is a cloud-based, multi-tenant Human Resource Management Software-as-a-Service (SaaS) platform.',
      'No physical goods, CDs, boxes, or hard copies are shipped or delivered to your physical address.',
      'All products, features, modules (Attendance, Payroll, ATS, Performance, Org Chart), and license upgrades are delivered electronically and hosted in our high-availability cloud infrastructure.',
    ],
  },
  {
    title: '2. Instant Delivery Timeline & Process',
    icon: BoltIcon,
    content: [
      'Immediate Automated Activation (0 to 15 minutes): Upon successful payment completion via Razorpay (UPI, Credit/Debit Card, Net Banking) or PayPal, your subscription tier, employee seat capacity, and access permissions are updated automatically in real-time.',
      'Instant Web Access: You can immediately begin using all features, invite team members, and configure payroll without any manual intervention or waiting period.',
      'Maximum Provisioning Window: In rare instances of high network traffic or scheduled maintenance, electronic provisioning will complete within a maximum of 24 business hours.',
    ],
  },
  {
    title: '3. Electronic Confirmation & Credentials',
    icon: EnvelopeOpenIcon,
    content: [
      'Confirmation Email: A digital invoice, payment receipt, and subscription confirmation email containing your Tenant ID and plan details is automatically dispatched to your registered account email address immediately after payment capture.',
      'Login Credentials: If you are an existing user, your current login credentials will immediately have access to upgraded limits. For new tenant signups, account activation links are sent directly via email.',
    ],
  },
  {
    title: '4. Shipping & Delivery Charges',
    icon: ShieldCheckIcon,
    content: [
      'Shipping Cost: ₹0.00 / $0.00 (Zero Delivery Charges).',
      'Because all services are delivered over secure internet connections (HTTPS/TLS 1.3), there are no packaging, customs, postal, or courier delivery fees.',
    ],
  },
  {
    title: '5. Non-Receipt of Service or Delivery Assistance',
    icon: QuestionMarkCircleIcon,
    content: [
      'If you have completed a payment but have not received your automated confirmation email or your subscription limits have not updated within 15 minutes, please contact our support desk immediately:',
      'Email: support@hrmspro.online (Subject: Provisioning Assistance - [Your Tenant ID])',
      'Helpline: +91 80 4567 8900 / +1 (555) 123-4567',
      'Business Hours: Monday through Friday, 9:00 AM – 6:00 PM IST',
      'Address: HRMS Pro Technologies, 100 Tech Park, Outer Ring Road, Bangalore, Karnataka 560103, India',
    ],
  },
];

const ShippingPolicy = () => {
  const { t } = useWebsiteBuilder();

  return (
    <PageWrapper>
      <SEO
        title="Shipping & Delivery Policy"
        description="Review HRMS Pro's Shipping and Delivery Policy. Clear guidance on digital SaaS delivery, instant activation timelines, and zero delivery charges."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Shipping and Delivery Policy',
          description: 'HRMS Pro electronic delivery timelines and procedures for cloud SaaS services.',
          publisher: { '@type': 'Organization', name: 'HRMS Pro' },
        }}
      />

      {/* Hero Header */}
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">
              Digital Service Delivery
            </span>
            <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.05] mb-6">
              Shipping & Delivery Policy
            </h1>
            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              HRMS Pro is an enterprise cloud software platform. Learn how digital delivery and immediate subscription activations work.
            </p>
            <p className="text-xs text-gray-400 mt-4">
              Last Updated: August 2026
            </p>
          </motion.div>
        </div>
      </section>

      {/* Policy Content */}
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

export default ShippingPolicy;
