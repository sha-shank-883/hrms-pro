import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { AnimatedSection, AnimatedItem, PageWrapper } from '../../components/common/AnimatedSection';
import SEO, { FAQSchema, BreadcrumbSchema } from '../../components/common/SEO';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';

const faqCategories = [
  {
    name: 'Getting Started',
    questions: [
      { q: 'How do I create an account?', a: 'Visit our sign-up page and enter your work email, company name, and create a password. You will receive a confirmation email to verify your account. Once verified, you can log in and start setting up your HR environment.' },
      { q: 'Is there a free trial?', a: 'Yes, we offer a 14-day free trial with full access to all features in the Scale plan. No credit card is required. You can invite up to 5 team members to evaluate the platform together.' },
      { q: 'How long does it take to set up?', a: 'Most companies are fully operational within 1-2 weeks. Our onboarding team provides guided setup, data migration assistance, and training sessions. Enterprise implementations typically take 4-6 weeks.' },
      { q: 'Can I import data from my existing HR system?', a: 'Yes, we support data import from Excel, CSV, and most major HR platforms including BambooHR, Gusto, ADP, and Workday. Our migration team handles the data mapping and transfer.' },
    ]
  },
  {
    name: 'Billing & Plans',
    questions: [
      { q: 'How does per-employee pricing work?', a: 'You are billed based on the number of active employees in your system. Inactive or terminated employees are not counted. You can add or remove employees at any time, and charges adjust accordingly.' },
      { q: 'Can I change my plan?', a: 'Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. There are no long-term contracts or early termination fees.' },
      { q: 'Do you offer discounts?', a: 'We offer annual billing discounts (save 20%), non-profit discounts (20% off), and volume pricing for organizations with 500+ employees. Contact our sales team for custom pricing.' },
      { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, Mastercard, American Express), ACH bank transfers, and wire transfers for annual enterprise plans. Invoicing is available for Enterprise customers.' },
    ]
  },
  {
    name: 'Features & Functionality',
    questions: [
      { q: 'Does HRMS Pro support multi-country payroll?', a: 'Yes, our Enterprise plan supports payroll processing in 150+ countries with automated tax calculations, statutory compliance, and local reporting. The Scale plan includes payroll for US and Canada.' },
      { q: 'Can I customize workflows and approval processes?', a: 'Absolutely. Our no-code workflow builder lets you create custom approval chains, automated notifications, and conditional logic for leave requests, expense reports, and other HR processes.' },
      { q: 'Is there a mobile app?', a: 'Yes, we offer native mobile apps for iOS and Android. Employees can check attendance, request time off, view payslips, and update their profiles. Managers can approve requests and view team data.' },
      { q: 'How does the AI assistant work?', a: 'Our AI assistant analyzes your workforce data to provide predictive insights, automate routine tasks, and answer natural language questions. It can identify attrition risks, suggest optimal shift schedules, and generate reports.' },
    ]
  },
  {
    name: 'Security & Compliance',
    questions: [
      { q: 'Is my data secure?', a: 'Yes. We are SOC 2 Type II certified and GDPR compliant. All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We conduct regular penetration testing and security audits by independent third parties.' },
      { q: 'Where is my data stored?', a: 'Data is stored in secure cloud data centers. We offer data residency options including US, EU, and APAC regions. You can choose your preferred region during setup.' },
      { q: 'Do you have backup and disaster recovery?', a: 'Yes, we perform automated daily backups with point-in-time recovery. Our infrastructure spans multiple availability zones with automatic failover. Our RPO is 1 hour and RTO is 4 hours.' },
      { q: 'Are you compliant with local regulations?', a: 'We maintain compliance with GDPR, CCPA, SOC 2, ISO 27001, and HIPAA. Our platform supports country-specific regulations including France\'s CNIL, Germany\'s BDSG, and UK\'s Data Protection Act.' },
    ]
  },
  {
    name: 'Support',
    questions: [
      { q: 'What kind of support do you offer?', a: 'All plans include email support with 24-hour response. Scale plans add priority support with 4-hour response time. Enterprise plans include 24/7 phone and chat support with a dedicated Customer Success Manager.' },
      { q: 'Do you provide training?', a: 'Yes, we provide onboarding training for all new customers. Scale and Enterprise plans include advanced training sessions for HR administrators and managers. Custom training programs are available.' },
      { q: 'Is there a knowledge base?', a: 'Yes, our help center includes documentation, video tutorials, best practice guides, and API documentation. We also host monthly webinars and maintain an active community forum.' },
      { q: 'How do I get help with technical issues?', a: 'You can submit a support ticket through the platform, email support@hrmspro.online, or use the in-app chat. For urgent issues, Enterprise customers have access to our 24/7 hotline.' },
    ]
  },
];

const FAQPage = () => {
  const { t } = useWebsiteBuilder();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Getting Started');
  const [openItems, setOpenItems] = useState({});

  const allQuestions = faqCategories.flatMap(cat => cat.questions);
  const filteredQuestions = searchQuery
    ? allQuestions.filter(
        q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
             q.a.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqCategories.find(c => c.name === activeCategory)?.questions || [];

  const toggleItem = (idx) => {
    setOpenItems(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const schemaQuestions = allQuestions.map(q => ({ question: q.q, answer: q.a }));

  return (
    <PageWrapper>
      <SEO
        title="FAQ"
        description="Find answers to frequently asked questions about HRMS Pro. Learn about getting started, billing, features, security, and support."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Frequently Asked Questions',
          description: 'HRMS Pro frequently asked questions.',
          publisher: { '@type': 'Organization', name: 'HRMS Pro' },
        }}
      />
      <FAQSchema questions={schemaQuestions} />
      <BreadcrumbSchema items={[{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }]} />

      <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-20 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">{t('faq.eyebrow', 'Support')}</span>
            <h1 className="mt-4 text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6">
              {t('faq.title', 'Frequently Asked Questions')}
            </h1>
            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-8 leading-relaxed">
              {t('faq.subtitle', "Everything you need to know about HRMS Pro. Can't find what you're looking for? Contact our team.")}
            </p>
            <div className="relative max-w-md mx-auto">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          {!searchQuery && (
            <div className="flex flex-wrap gap-2 mb-10 justify-center">
              {faqCategories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => { setActiveCategory(cat.name); setOpenItems({}); }}
                  className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    activeCategory === cat.name
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500 dark:text-gray-400">No FAQs found matching your search.</p>
              </div>
            ) : (
              filteredQuestions.map((faq, idx) => (
                <AnimatedItem key={idx} delay={idx * 0.03}>
                  <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900">
                    <button
                      onClick={() => toggleItem(idx)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-900 dark:text-white pr-4">{faq.q}</span>
                      <svg className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${openItems[idx] ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${openItems[idx] ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                      <p className="px-6 pb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </AnimatedItem>
              ))
            )}
          </div>

          <div className="mt-12 text-center p-8 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-3xl">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Still have questions?</p>
            <Link to="/contact" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-500 hover:gap-3 transition-all">
              Contact our support team <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </PageWrapper>
  );
};

export default FAQPage;
