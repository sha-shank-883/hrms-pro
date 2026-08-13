import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRightIcon, HomeIcon } from '@heroicons/react/24/outline';
import { PageWrapper } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';

const NotFound = () => {
  return (
    <PageWrapper>
      <SEO title="Page Not Found" description="The page you are looking for does not exist or has been moved." />
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="mb-8">
              <span className="text-[120px] sm:text-[160px] font-black text-gray-100 dark:text-gray-800 leading-none select-none">
                404
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
              Page not found
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
              Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or never existed.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-500/25 transition-all"
              >
                <HomeIcon className="w-4 h-4" />
                Go Home
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
              >
                Contact Support
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PageWrapper>
  );
};

export default NotFound;
