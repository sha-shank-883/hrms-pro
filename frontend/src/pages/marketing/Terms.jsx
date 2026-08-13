import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedItem, PageWrapper } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';

const sections = [
  {
    title: 'Acceptance of Terms',
    content: 'By accessing or using HRMS Pro ("the Platform"), you agree to be bound by these Terms of Service. If you do not agree to all the terms, you may not access the Platform. We reserve the right to update these terms at any time, and continued use constitutes acceptance of changes.'
  },
  {
    title: 'Account Registration',
    content: 'You must create an account to use the Platform. You agree to provide accurate, current, and complete information during registration and to update it as necessary. You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account. Notify us immediately of any unauthorized use.'
  },
  {
    title: 'Subscription and Billing',
    content: 'Our Platform is offered on a subscription basis. Fees are billed in advance on a monthly or annual basis as selected. All fees are non-refundable except as expressly stated. We may change our fees with 30 days notice. Late payments may result in service suspension. You are responsible for all taxes associated with your subscription.'
  },
  {
    title: 'User Responsibilities',
    content: 'You agree to use the Platform in compliance with all applicable laws and regulations. You must not: upload malicious code, attempt to breach security measures, exceed authorized access levels, use the Platform for unlawful purposes, or interfere with other users\' enjoyment of the service. You are responsible for all content uploaded to your account.'
  },
  {
    title: 'Data Ownership and Protection',
    content: 'You retain all rights to your data. We will not access your data except as necessary to provide support, maintain the Platform, or comply with legal obligations. We implement industry-standard security measures to protect your data. We will notify you of any data breach affecting your information within 72 hours of discovery.'
  },
  {
    title: 'Intellectual Property',
    content: 'The Platform, including its code, design, features, and documentation, is owned by HRMS Pro and protected by intellectual property laws. You are granted a limited, non-exclusive, non-transferable license to use the Platform during your subscription. You may not copy, modify, reverse engineer, or create derivative works without our consent.'
  },
  {
    title: 'Service Level and Availability',
    content: 'We strive to maintain 99.9% uptime, excluding scheduled maintenance. We will provide advance notice of planned maintenance. Our service is provided "as is" without warranties of merchantability or fitness for a particular purpose. We are not liable for service interruptions beyond our reasonable control.'
  },
  {
    title: 'Limitation of Liability',
    content: 'To the maximum extent permitted by law, HRMS Pro shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunity. Our total liability for any claim shall not exceed the amount paid by you in the 12 months preceding the claim.'
  },
  {
    title: 'Termination',
    content: 'Either party may terminate the agreement with 30 days written notice. We may terminate immediately if you breach these terms. Upon termination, you will have 30 days to export your data. After this period, your data will be permanently deleted. Prepaid fees for the remaining billing period will be refunded on a pro-rata basis.'
  },
  {
    title: 'Governing Law',
    content: 'These terms are governed by the laws of the State of California, United States. Any disputes shall be resolved through binding arbitration in San Francisco, California. The United Nations Convention on Contracts for the International Sale of Goods does not apply to these terms.'
  },
];

const Terms = () => {
  const { t } = useWebsiteBuilder();
  return (
    <PageWrapper>
      <SEO
        title="Terms of Service"
        description="Review HRMS Pro's Terms of Service. Understand your rights and responsibilities when using our HR management platform."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Terms of Service',
          description: 'HRMS Pro terms of service and conditions of use.',
          publisher: { '@type': 'Organization', name: 'HRMS Pro' },
        }}
      />
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Legal</span>
            <h1 className="mt-4 text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6">
              {t('terms.title', 'Terms of Service')}
            </h1>
            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {t('terms.subtitle', 'Please review the terms and conditions governing your use of our services.')}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 lg:py-32 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="space-y-8">
            {sections.map((section, idx) => (
              <AnimatedItem key={section.title} delay={idx * 0.04}>
                <div className="p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{section.title}</h2>
                  <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{section.content}</p>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};

export default Terms;
