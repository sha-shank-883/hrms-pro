import React from 'react';
import { motion } from 'framer-motion';
import { AnimatedSection, AnimatedItem, PageWrapper } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';

const sections = [
  {
    title: 'Information We Collect',
    content: 'We collect information you provide directly to us, such as when you create an account, fill out a form, or communicate with us. This includes your name, email address, company name, phone number, and billing information. We also automatically collect certain information when you use our platform, including IP address, browser type, operating system, and usage data.'
  },
  {
    title: 'How We Use Your Information',
    content: 'We use the information we collect to provide, maintain, and improve our HR management platform; to process transactions and send related information; to communicate with you about product updates, features, and support; to detect and prevent fraud and abuse; and to comply with legal obligations.'
  },
  {
    title: 'Data Sharing and Disclosure',
    content: 'We do not sell your personal information. We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data hosting, and email delivery. These providers are contractually bound to protect your information and use it only for the purposes we specify.'
  },
  {
    title: 'Data Security',
    content: 'We implement industry-standard security measures to protect your information, including encryption at rest and in transit, regular security audits, access controls, and employee training. Our platform is SOC 2 Type II certified and GDPR compliant. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.'
  },
  {
    title: 'Data Retention',
    content: 'We retain your information for as long as your account is active or as needed to provide you services. We will retain and use your information as necessary to comply with our legal obligations, resolve disputes, and enforce our agreements. Upon account termination, we will delete or anonymize your data within 90 days.'
  },
  {
    title: 'Your Rights',
    content: 'Depending on your jurisdiction, you may have the right to access, correct, delete, or port your personal data. You may also have the right to restrict or object to certain processing activities. To exercise these rights, please contact our privacy team at privacy@hrmspro.online. We will respond to your request within 30 days.'
  },
  {
    title: 'Cookies and Tracking',
    content: 'We use cookies and similar tracking technologies to enhance your experience, analyze usage, and deliver personalized content. You can control cookie preferences through your browser settings. Disabling cookies may affect certain features of our platform. We use both session cookies (which expire when you close your browser) and persistent cookies (which remain until deleted).'
  },
  {
    title: 'International Data Transfers',
    content: 'Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place through Standard Contractual Clauses and other lawful transfer mechanisms. By using our platform, you consent to the transfer of your information to countries that may have different data protection laws than your jurisdiction.'
  },
  {
    title: 'Changes to This Policy',
    content: 'We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a prominent notice on our platform. Your continued use of our services after the effective date of any changes constitutes your acceptance of the updated policy.'
  },
  {
    title: 'Contact Us',
    content: 'If you have questions about this Privacy Policy or our data practices, please contact us at privacy@hrmspro.online or write to us at: HRMS Pro, 100 Tech Lane, Suite 200, San Francisco, CA 94105, USA.'
  },
];

const Privacy = () => {
  const { t } = useWebsiteBuilder();
  return (
    <PageWrapper>
      <SEO
        title="Privacy Policy"
        description="Read HRMS Pro's Privacy Policy to understand how we collect, use, and protect your personal information. We are committed to data privacy and security."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Privacy Policy',
          description: 'HRMS Pro privacy policy and data protection practices.',
          publisher: { '@type': 'Organization', name: 'HRMS Pro' },
        }}
      />
      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Legal</span>
            <h1 className="mt-4 text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6">
              {t('privacy.title', 'Privacy Policy')}
            </h1>
            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {t('privacy.subtitle', 'We are committed to protecting your personal data and maintaining transparent information practices.')}
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 lg:py-32 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-10">
              HRMS Pro ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our HR management platform and website. Please read this policy carefully.
            </p>
          </div>
          <div className="space-y-8 mt-12">
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

export default Privacy;
