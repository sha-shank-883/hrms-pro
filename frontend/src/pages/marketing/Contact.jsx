import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon, EnvelopeIcon, PhoneIcon, MapPinIcon,
  ClockIcon, GlobeAltIcon, CheckIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { AnimatedSection } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const offices = [
  {
    city: 'San Francisco', country: 'USA',
    address: '100 Tech Lane, Suite 200, San Francisco, CA 94105',
    phone: '+1 (555) 123-4567',
    email: 'sf@hrmspro.com',
    icon: MapPinIcon,
  },
  {
    city: 'London', country: 'UK',
    address: '20 St James Street, London, SW1A 1ES',
    phone: '+44 (20) 7123 4567',
    email: 'london@hrmspro.com',
    icon: MapPinIcon,
  },
  {
    city: 'Singapore', country: 'Singapore',
    address: '1 Raffles Place, #20-01, Singapore 048616',
    phone: '+65 6789 0123',
    email: 'sg@hrmspro.com',
    icon: MapPinIcon,
  },
  {
    city: 'Sydney', country: 'Australia',
    address: '50 Martin Place, Sydney, NSW 2000',
    phone: '+61 (2) 9876 5432',
    email: 'sydney@hrmspro.com',
    icon: MapPinIcon,
  },
];

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', company: '', phone: '', subject: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/leads/contact', formData);
      if (res.data.success) {
        setSubmitted(true);
      } else {
        setError(res.data.message || 'Failed to send message.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ────── Hero ────── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Contact</span>
            <h1 className="mt-4 text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6">
              Get in touch
            </h1>
            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Have questions about HRMS Pro? Our team is ready to help.
              Reach out and we will get back to you within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ────── Contact Grid ────── */}
      <section className="pb-24 lg:pb-32 -mt-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-10 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-6">
                    <CheckIcon className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Message Sent!</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Thank you for reaching out. Our team will respond within 24 hours.
                  </p>
                  <Link to="/" className="text-indigo-600 dark:text-indigo-400 font-semibold text-sm hover:underline">
                    Back to Home
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 lg:p-10 space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                      {error}
                    </div>
                  )}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</label>
                      <input required type="text" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="John Doe" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Work Email *</label>
                      <input required type="email" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="john@company.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company</label>
                      <input type="text" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="Acme Corp" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                      <input type="tel" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Subject *</label>
                      <select required className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}>
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
                      <textarea required rows={5} className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none" placeholder="Tell us how we can help..." value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} />
                  </div>

                  <button type="submit" disabled={loading} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {loading ? (
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : 'Send Message'}
                  </button>
                </form>
              )}
            </div>

            {/* Info Sidebar */}
            <div className="lg:col-span-2 space-y-6">
              {[
                { icon: EnvelopeIcon, label: 'Email Us', value: 'hello@hrmspro.com', href: 'mailto:hello@hrmspro.com' },
                { icon: PhoneIcon, label: 'Call Us', value: '+1 (555) 123-4567', href: 'tel:+15551234567' },
                { icon: ClockIcon, label: 'Hours', value: 'Mon-Fri, 9:00 AM - 6:00 PM EST' },
                { icon: GlobeAltIcon, label: 'Demo', value: 'Schedule a personalized demo', href: '/demo' },
              ].map((item) => (
                <div key={item.label} className="flex gap-4 p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                     <item.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                   </div>
                     <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">{item.label}</p>
                    {item.href ? (
                      <a href={item.href} className="text-sm font-semibold text-gray-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                        {item.value}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                    )}
                  </div>
              ))}

              <div className="p-6 bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 rounded-3xl">
                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-2">Prefer a demo instead?</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Get a personalized walkthrough of HRMS Pro tailored to your organization.
                </p>
                <Link to="/demo" className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:gap-3 transition-all">
                  Book your demo <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────── Offices ────── */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900/50 border-y border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center mb-12">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Our Offices</span>
            <h2 className="mt-4 text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Global presence</h2>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {offices.map((office) => (
              <div key={office.city} className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl">
                <office.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400 mb-4" />
                <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{office.city}, {office.country}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{office.address}</p>
                <a href={`tel:${office.phone}`} className="block text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{office.phone}</a>
                <a href={`mailto:${office.email}`} className="block text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5">{office.email}</a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
