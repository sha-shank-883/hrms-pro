import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon, EnvelopeIcon, ClockIcon,
  GlobeAltIcon, CheckIcon, ChatBubbleLeftRightIcon,
  QuestionMarkCircleIcon, CurrencyDollarIcon, WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { AnimatedSection, AnimatedItem, StaggerContainer } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const supportChannels = [
  { icon: ChatBubbleLeftRightIcon, label: 'Sales Inquiry', value: 'Talk to our team about plans, pricing, and onboarding.' },
  { icon: WrenchScrewdriverIcon, label: 'Technical Support', value: 'Get help with your account, integrations, or biometric setup.' },
  { icon: CurrencyDollarIcon, label: 'Billing Questions', value: 'Questions about invoices, subscriptions, or plan upgrades.' },
  { icon: QuestionMarkCircleIcon, label: 'General Questions', value: "Not sure where to start? We'll point you in the right direction." },
];

const Contact = () => {
  const { t, settings } = useWebsiteBuilder();
  const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/leads/contact', { ...formData, source: 'Contact Form' });
      setSubmitted(true);
    } catch {
      setError(`Something went wrong. Please try again or email us directly at ${settings?.contact_email || 'info@hrmspro.online'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SEO title="Contact Us — HRMS Pro" description="Get in touch with the HRMS Pro team. We're ready to help with sales, support, billing, or general questions." />

      {/* Hero */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary-50/60 via-transparent to-transparent dark:from-primary-500/5" />
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Contact</span>
            <h1 className="mt-4 text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6">
              {t('contact.title', 'Get in touch')}
            </h1>
            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              {t('contact.subtitle', 'Have questions about HRMS Pro? Our team is ready to help. Fill in the form and we will get back to you within 24 hours.')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Grid */}
      <section className="py-16 lg:py-24 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                    <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Message Sent!</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Thank you for reaching out. Our team will respond to <strong className="text-gray-900 dark:text-white">{formData.email}</strong> within 24 hours.
                  </p>
                  <Link to="/" className="text-primary-600 dark:text-primary-500 font-semibold text-sm hover:underline">
                    Back to Home
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 lg:p-10 space-y-6 shadow-sm">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Send us a message</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">We typically respond within 24 business hours.</p>
                  </div>
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">{error}</div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</label>
                      <input required type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" placeholder="Jane Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Work Email *</label>
                      <input required type="email" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" placeholder="jane@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                      <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" placeholder="Acme Corp" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone (optional)</label>
                      <input type="tel" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject *</label>
                    <select required className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 appearance-none cursor-pointer transition-all" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
                      <option value="">Select a subject</option>
                      <option value="sales">Sales Inquiry</option>
                      <option value="support">Technical Support</option>
                      <option value="partnership">Partnership Opportunity</option>
                      <option value="billing">Billing Question</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Message *</label>
                    <textarea required rows={5} className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-all" placeholder="Tell us how we can help..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                  </div>
                  <button type="submit" disabled={loading} className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm shadow-primary-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('contact.send', 'Send Message')}<ArrowRightIcon className="w-4 h-4" /></>}
                  </button>
                  <p className="text-xs text-gray-400 text-center">We respect your privacy. Your information is never shared with third parties.</p>
                </form>
              )}
            </div>

            <div className="lg:col-span-2 space-y-5">
              <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                  <EnvelopeIcon className="w-5 h-5 text-primary-600 dark:text-primary-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Email Us</p>
                  <a href={`mailto:${settings?.contact_email || 'info@hrmspro.online'}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                    {settings?.contact_email || 'info@hrmspro.online'}
                  </a>
                </div>
              </div>
              
              {settings?.contact_phone && (
                <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-primary-600 dark:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Call Us</p>
                    <a href={`tel:${settings.contact_phone}`} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {settings.contact_phone}
                    </a>
                  </div>
                </div>
              )}

              <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                  <ClockIcon className="w-5 h-5 text-primary-600 dark:text-primary-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Response Time</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Within 24 business hours</p>
                </div>
              </div>
              <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
                  <GlobeAltIcon className="w-5 h-5 text-primary-600 dark:text-primary-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">Platform</p>
                  <a href="https://hrmspro.online" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">hrmspro.online</a>
                </div>
              </div>
              <div className="p-6 bg-primary-50 dark:bg-primary-500/5 border border-primary-100 dark:border-primary-500/20 rounded-3xl">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">Prefer a demo instead?</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">See HRMS Pro in action with a personalized walkthrough tailored to your organization's needs.</p>
                <Link to="/demo" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-500 hover:gap-3 transition-all">
                  Book your free demo <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Support Types */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">How Can We Help?</span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Choose your inquiry type</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-xl mx-auto text-base">Use the contact form above and select the right subject — our team routes your message to the right specialist automatically.</p>
          </AnimatedSection>
          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportChannels.map((channel, idx) => (
              <AnimatedItem key={channel.label} delay={idx * 0.08}>
                <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 h-full">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-4">
                    <channel.icon className="w-5 h-5 text-primary-600 dark:text-primary-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">{channel.label}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{channel.value}</p>
                </div>
              </AnimatedItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-4">Ready to see HRMS Pro in action?</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Book a free personalized demo and see how HRMS Pro can streamline your HR, payroll, and attendance operations.</p>
            <Link to="/demo" className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-500/25 hover:-translate-y-0.5 transition-all duration-300">
              Book a Free Demo
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
};

export default Contact;
