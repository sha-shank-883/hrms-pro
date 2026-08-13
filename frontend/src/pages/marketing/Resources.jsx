import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaArrowRight, FaBookOpen, FaFilePdf, FaVideo, FaDownload } from 'react-icons/fa';
import { PageWrapper } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';

const staticResources = [
  {
    id: 1, type: 'guide', title: 'The Complete Guide to HR Automation',
    excerpt: 'Learn how to automate your HR processes and save up to 70% of administrative time. This comprehensive guide covers everything from onboarding workflows to payroll automation with dynamic settings integration.',
    button_text: 'Download PDF',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=400&q=80',
    download_url: '/resources/hr-automation-guide.pdf',
  },
  {
    id: 2, type: 'ebook', title: 'The Future of Work: 2026 Edition',
    excerpt: 'Explore the trends shaping the future of work, from AI-powered HR to hybrid workforce management strategies. Includes case studies on dynamic settings implementation.',
    button_text: 'Get Free Copy',
    image_url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80',
    download_url: '/resources/future-of-work-ebook.pdf',
  },
  {
    id: 3, type: 'whitepaper', title: 'Payroll Compliance Across 150+ Countries',
    excerpt: 'A deep dive into global payroll compliance, tax regulations, and best practices for multinational organizations. Shows how HRMS settings adapt to local requirements.',
    button_text: 'Read Whitepaper',
    image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=400&q=80',
    download_url: '/resources/payroll-compliance-whitepaper.pdf',
  },
  {
    id: 4, type: 'video', title: 'HRMS Pro Product Tour',
    excerpt: 'See the platform in action. A walkthrough of all key features including dynamic currency settings, smart overtime detection, and AI-powered payroll automation.',
    button_text: 'Watch Video',
    image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80',
    download_url: 'https://www.youtube.com/watch?v=demo',
  },
  {
    id: 5, type: 'guide', title: 'Employee Onboarding Best Practices',
    excerpt: 'Create a seamless onboarding experience that improves retention by 82% and accelerates time-to-productivity. Includes integrated settings workflow examples.',
    button_text: 'Download Guide',
    image_url: 'https://images.unsplash.com/photo-1521734217035-716a31e28414?auto=format&fit=crop&w=400&q=80',
    download_url: '/resources/onboarding-best-practices.pdf',
  },
  {
    id: 6, type: 'ebook', title: 'Building a Culture of Continuous Feedback',
    excerpt: 'Learn how to transition from annual reviews to continuous feedback models that drive real performance improvements. Includes performance module deep-dive.',
    button_text: 'Get Ebook',
    image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=400&q=80',
    download_url: '/resources/continuous-feedback-ebook.pdf',
  },
  {
    id: 7, type: 'whitepaper', title: 'AI in HR: A Strategic Framework',
    excerpt: 'Understand how artificial intelligence is transforming HR operations and how to build an AI-ready HR strategy. Real examples from HRMS Pro implementation.',
    button_text: 'Read Paper',
    image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e50423?auto=format&fit=crop&w=400&q=80',
    download_url: '/resources/ai-hr-strategy-whitepaper.pdf',
  },
  {
    id: 8, type: 'video', title: 'Setting Up Multi-Country Payroll',
    excerpt: 'A step-by-step walkthrough of configuring and running payroll across multiple countries in HRMS Pro. Shows dynamic currency and tax settings in action.',
    button_text: 'Watch Now',
    image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80',
    download_url: 'https://www.youtube.com/watch?v=demo',
  },
  {
    id: 9, type: 'guide', title: 'OKR Implementation Guide for HR Leaders',
    excerpt: 'A practical guide to implementing OKRs in your organization, aligned with performance management and goal tracking. Includes HRMS Pro configuration tips.',
    button_text: 'Download Guide',
    image_url: 'https://images.unsplash.com/photo-1551650975-87d17f56ee5f?auto=format&fit=crop&w=400&q=80',
    download_url: '/resources/okr-implementation-guide.pdf',
  },
];

const filters = [
  { id: 'all', label: 'All Resources' },
  { id: 'guide', label: 'Guides' },
  { id: 'ebook', label: 'E-Books' },
  { id: 'whitepaper', label: 'Whitepapers' },
  { id: 'video', label: 'Videos' },
];

const Resources = () => {
  const { t } = useWebsiteBuilder();
  const [activeFilter, setActiveFilter] = useState('all');

  const filteredResources = activeFilter === 'all'
    ? staticResources
    : staticResources.filter(r => r.type === activeFilter);

  return (
    <PageWrapper>
      <SEO
        title="Resources"
        description="Expert guides, research, and tools to help you build a more productive and engaged team. Download free HR resources from HRMS Pro."
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.span initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1.5 rounded-full bg-primary-50 dark:bg-primary-500/10 border border-primary-100 dark:border-primary-500/20 text-primary-600 dark:text-primary-500 text-xs font-semibold mb-4"
            >
              {t('resources.eyebrow', 'Knowledge Center')}
            </motion.span>
            <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight"
            >
              {t('resources.title', 'Insights to Master your Workforce')}
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto"
            >
              {t('resources.subtitle', 'Expert guides, research, and downloadable templates to help you build a productive workforce.')}
            </motion.p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {filters.map(filter => (
              <button key={filter.id} onClick={() => setActiveFilter(filter.id)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 ${
                  activeFilter === filter.id
                    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-lg'
                    : 'bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredResources.map((resource, idx) => (
<motion.div key={resource.id} layout
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0 }}
                   whileHover={{ y: -4 }}
                   className="group relative bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 overflow-hidden hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-500"
                 >
                   <div className="h-56 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
                     <img src={resource.image_url} alt={resource.title}
                       className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                     />
                     <div className="absolute top-4 left-4">
                       <span className="px-3 py-1.5 rounded-full bg-white/90 dark:bg-gray-900/90 text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 backdrop-blur-md border border-white/20 dark:border-gray-700/50">
                         {resource.type}
                       </span>
                     </div>
                     <div className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border border-white/20 dark:border-gray-700/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <FaDownload className="w-4 h-4 text-primary-600 dark:text-primary-500" />
                     </div>
                   </div>
                   <div className="p-8">
                     <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                       {resource.title}
                     </h3>
                     <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-3">
                       {resource.excerpt}
                     </p>
                     <a href={resource.download_url}
                       onClick={(e) => {
                         if (resource.download_url.startsWith('#')) {
                           e.preventDefault();
                         }
                       }}
                       className="inline-flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                     >
                       {resource.button_text || (resource.type === 'video' ? 'Watch Video' : 'Download')} <FaArrowRight className="text-primary-500" />
                     </a>
                   </div>
                 </motion.div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="mt-24 p-12 lg:p-16 bg-gray-900 dark:bg-white rounded-[2.5rem] relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-secondary-500/10 blur-[100px] rounded-full" />
            <div className="relative z-10 grid lg:grid-cols-2 items-center gap-10">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-white dark:text-gray-900 mb-4 tracking-tight">
                  Don't miss any updates from us.
                </h2>
                <p className="text-gray-400 dark:text-gray-600 text-sm">Join 5,000+ HR leaders who get our best content directly in their inbox every week.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <input type="email" placeholder="Work email address"
                  className="flex-1 px-5 py-3.5 rounded-xl bg-white/10 dark:bg-gray-100 border border-white/20 dark:border-gray-300 text-white dark:text-gray-900 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm"
                />
                <button className="px-7 py-3.5 bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary-500/20 active:scale-95 whitespace-nowrap">
                  Join Now
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Resources;
