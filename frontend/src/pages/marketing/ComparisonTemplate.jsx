import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon, CheckIcon, XMarkIcon,
  StarIcon, SparklesIcon, ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { PageWrapper, AnimatedSection, AnimatedItem } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';

const ComparisonTemplate = ({ competitor, data }) => {
  if (!data) return null;

  return (
    <PageWrapper>
      <SEO title={data.title} description={data.description} />

      {/* Hero */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-50/60 via-transparent to-transparent dark:from-indigo-500/5" />
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative">
          <motion.div initial="hidden" animate="visible" className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-8"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
              Comparison Guide
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6"
            >
              {data.headline}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              {data.subheadline}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all w-full sm:w-auto justify-center"
              >
                Try HRMS Pro Free
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all w-full sm:w-auto justify-center"
              >
                Compare Pricing
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why HRMS Pro Wins */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Why HRMS Pro</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {data.name} falls short. Here&apos;s where HRMS Pro excels.
            </h2>
          </AnimatedSection>

<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
             {data.advantages.map((item, idx) => (
               <AnimatedItem key={item.title} delay={idx * 0.06}>
                 <div className="group p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl h-full hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                   <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-5 text-2xl group-hover:bg-indigo-50 dark:group-hover:bg-indigo-500/10 transition-colors">
                     {item.icon || <CheckIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />}
                   </div>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                 </div>
               </AnimatedItem>
             ))}
           </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Feature Comparison</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Side-by-side feature comparison
            </h2>
          </AnimatedSection>

          <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 gap-4 p-6 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
              <div className="text-sm font-bold text-gray-900 dark:text-white">Feature</div>
              <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400 text-center">HRMS Pro</div>
              <div className="text-sm font-bold text-gray-500 dark:text-gray-400 text-center">{data.name}</div>
            </div>
            {data.features.map(([feature, us, them], idx) => (
              <div key={feature} className={`grid grid-cols-3 gap-4 px-6 py-4 ${idx % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/20'}`}>
                <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{feature}</div>
                <div className="flex justify-center">
                  {us ? (
                    <CheckIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  ) : (
                    <XMarkIcon className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                  )}
                </div>
                <div className="flex justify-center">
                  {them ? (
                    <CheckIcon className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                  ) : (
                    <XMarkIcon className="w-5 h-5 text-red-300 dark:text-red-600" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Comparison */}
          <div className="mt-12 grid md:grid-cols-2 gap-8">
            <AnimatedItem delay={0.1}>
              <div className="p-8 bg-white dark:bg-gray-900 border-2 border-indigo-500 dark:border-indigo-400 rounded-3xl shadow-xl shadow-indigo-500/10 relative">
                <div className="absolute -top-3 left-8 px-4 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg">Best Value</div>
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2">HRMS Pro</p>
                <p className="text-3xl font-black text-gray-900 dark:text-white mb-4">{data.pricingUs}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">All features included. No hidden fees.</p>
              </div>
            </AnimatedItem>
            <AnimatedItem delay={0.15}>
              <div className="p-8 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{data.name}</p>
                <p className="text-3xl font-black text-gray-500 dark:text-gray-400 mb-4">{data.pricingThem}</p>
                <p className="text-sm text-gray-400 dark:text-gray-500">Plus add-ons and module fees</p>
              </div>
            </AnimatedItem>
          </div>
        </div>
      </section>

      {/* Testimonial / Trust */}
      <section className="py-16 bg-indigo-600 dark:bg-indigo-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="flex items-center justify-center gap-1 mb-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <blockquote className="text-xl lg:text-2xl text-white font-medium max-w-3xl mx-auto leading-relaxed mb-6">
              &ldquo;We switched from {data.name} to HRMS Pro and cut our admin time by 70%. The AI insights alone saved us from losing our top engineering talent.&rdquo;
            </blockquote>
            <p className="text-indigo-200 text-sm font-medium">— Marcus Rodriguez, CHRO</p>
          </AnimatedSection>
        </div>
      </section>

      {/* Verdict */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
          <AnimatedSection>
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
              <ShieldCheckIcon className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
              The Verdict
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              {data.verdict}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all"
              >
                Try HRMS Pro Free
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <Link
                to="/features"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                View All Features
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </PageWrapper>
  );
};

export default ComparisonTemplate;
