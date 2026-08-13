import React, { useState } from 'react';
import api from '../../services/api';
import { AnimatedSection } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';

const features = [
  'Instant auto-provisioning of your demo environment',
  'Full access to all features including payroll and analytics',
  'Pre-loaded sample data to explore immediately',
  'Invite up to 5 team members to evaluate together',
  'Free onboarding call with a product specialist',
];

const Demo = () => {
  const { t } = useWebsiteBuilder();
  const [formData, setFormData] = useState({
    name: '', email: '', company_name: '', phone: '', password: '', employees: '1-50', job_title: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/leads/demo', formData);
      if (res.data.success) setSuccess(true);
      else setError(res.data.message || 'Failed to submit demo request.');
    } catch (err) {
      setError(err.response?.data?.message || 'Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-32 px-6 flex justify-center items-start bg-gray-50 dark:bg-gray-950">
        <AnimatedSection className="max-w-lg w-full bg-white dark:bg-gray-900 p-10 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800 text-center">
          <div className="w-20 h-20 rounded-2xl bg-green-50 dark:bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {t('demo.success_title', 'Demo Request Received!')}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('demo.success_message', 'Thank you for your interest! We are setting up your personalized demo environment. You will receive an email with your login credentials within the next 15 minutes.')}
          </p>
          <p className="text-sm text-primary-600 dark:text-primary-500 font-medium">
            Redirecting to home in 10 seconds...
          </p>
        </AnimatedSection>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-24 pb-24 px-6">
      <SEO
        title="Get a Demo"
        description="Try HRMS Pro free for 14 days. Get instant access to a fully-functional HRMS environment. No credit card required, no commitment."
      />
      <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-start">
        <div className="lg:sticky lg:top-28">
          <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">
            {t('demo.badge', 'Get Started')}
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-6">
            {t('demo.headline', 'Try HRMS Pro free for 14 days')}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
            {t('demo.subheadline', 'Get instant access to a fully-functional HRMS environment. No credit card required, no commitment.')}
          </p>

          <div className="space-y-5">
            {features.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-3.5 h-3.5 text-primary-600 dark:text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-800">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-xl text-sm text-red-600 dark:text-red-400 font-medium">
                {error}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</label>
                <input required type="text" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Company *</label>
                <input required type="text" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Acme Corp" value={formData.company_name} onChange={e => setFormData({ ...formData, company_name: e.target.value })} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Work Email *</label>
              <input required type="email" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="john@company.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>

            <div className="grid sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input type="tel" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Employees</label>
                <select className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none" value={formData.employees} onChange={e => setFormData({ ...formData, employees: e.target.value })}>
                  <option>1-50</option>
                  <option>51-200</option>
                  <option>201-500</option>
                  <option>501-1000</option>
                  <option>1000+</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Job Title</label>
              <input type="text" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="HR Director" value={formData.job_title} onChange={e => setFormData({ ...formData, job_title: e.target.value })} />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Create Password *</label>
              <input required type="password" className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent" placeholder="Min. 8 characters" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : 'Start Free Trial'}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              By clicking "Start Free Trial", you agree to our{' '}
              <a href="/terms" className="text-primary-600 dark:text-primary-500 hover:underline">Terms of Service</a> and{' '}
              <a href="/privacy" className="text-primary-600 dark:text-primary-500 hover:underline">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Demo;
