import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MagnifyingGlassIcon, CalendarDaysIcon, ClockIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { AnimatedSection, AnimatedDiv, AnimatedItem, StaggerContainer, PageWrapper } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';
import blogPosts from './blogPosts';

const Blog = () => {
  const { t } = useWebsiteBuilder();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [visibleCount, setVisibleCount] = useState(9);

  const categories = ['All', ...new Set(blogPosts.map((p) => p.category).filter(Boolean))];
  const featuredPost = blogPosts.find((p) => p.featured);
  const filteredPosts = blogPosts.filter((post) => {
    const matchesCategory = activeCategory === 'All' || post.category === activeCategory;
    const matchesSearch = !searchQuery ||
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.tags || []).some((t) => typeof t === 'string' && t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch && post.id !== featuredPost?.id;
  });
  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPosts.length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
    catch { return dateStr; }
  };

  return (
    <PageWrapper>
      <SEO
        title="Blog"
        description="Actionable HR advice, industry trends, and practical guides to help you manage your workforce better. Insights from the HRMS Pro team."
      />
      <section className="relative bg-gradient-to-br from-gray-50 to-white dark:from-gray-950 dark:to-gray-900 pt-24 pb-16 lg:pt-32 overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-32 -right-32 w-96 h-96 bg-primary-200 dark:bg-primary-800/20 rounded-full blur-3xl opacity-30"
        />
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">{t('blog.eyebrow', 'Blog')}</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-6"
          >
            {t('blog.title', 'Insights for modern HR')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8"
          >
            {t('blog.subtitle', 'Actionable advice, industry trends, and practical guides to help you manage your workforce better.')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="relative max-w-md mx-auto"
          >
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text" placeholder="Search articles..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setVisibleCount(9); }}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </motion.div>
        </div>
      </section>

      <AnimatedSection className="py-16 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {!searchQuery && categories.length > 1 && (
            <AnimatedDiv variant="fadeInUp" delay={0}>
              <div className="flex flex-wrap gap-2 mb-10 justify-center">
                {categories.map((cat) => (
                  <motion.button
                    key={cat}
                    onClick={() => { setActiveCategory(cat); setVisibleCount(9); }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                       activeCategory === cat
                         ? 'bg-primary-600 text-white shadow-sm'
                         : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat}
                  </motion.button>
                ))}
              </div>
            </AnimatedDiv>
          )}

          <AnimatePresence mode="wait">
            {featuredPost && !searchQuery && activeCategory === 'All' && (
              <motion.div
                key="featured"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-16"
              >
                <div className="flex items-center gap-2 mb-6">
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-1.5 h-6 bg-primary-600 rounded-full"
                  />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Featured Article</h2>
                </div>
                <Link
                  to={`/blog/${featuredPost.id}`}
                  className="group block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
                >
                  <div className="grid md:grid-cols-2 gap-0">
                    <div className="relative overflow-hidden min-h-[280px]">
                      <img
                        src={featuredPost.image || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'}
                        alt={featuredPost.title}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-semibold text-primary-600 dark:text-primary-500">
                        {featuredPost.category}
                      </div>
                    </div>
                    <div className="p-8 sm:p-10 flex flex-col justify-center">
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <span className="flex items-center gap-1.5">
                          <CalendarDaysIcon className="w-4 h-4" />
                          {formatDate(featuredPost.date)}
                        </span>
                        {featuredPost.readTime && (
                          <span className="flex items-center gap-1.5">
                            <ClockIcon className="w-4 h-4" />
                            {featuredPost.readTime}
                          </span>
                        )}
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {featuredPost.title}
                      </h3>
                      <p className="text-gray-500 dark:text-gray-400 mb-6 line-clamp-3">{featuredPost.excerpt}</p>
                      <div className="flex items-center gap-3">
                        <img src={featuredPost.author?.image || 'https://i.pravatar.cc/150?u=a042581f4e29026024d'} alt={featuredPost.author?.name} className="w-9 h-9 rounded-full object-cover" />
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{featuredPost.author?.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{featuredPost.author?.role}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {visiblePosts.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                <p className="text-gray-500 dark:text-gray-400">No articles found matching your search.</p>
              </motion.div>
            ) : (
              <motion.div key={activeCategory + searchQuery} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {!searchQuery && activeCategory === 'All' && (
                  <div className="flex items-center gap-2 mb-6">
                    <span className="w-1.5 h-6 bg-gray-900 dark:bg-white rounded-full" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Articles</h2>
                  </div>
                )}
                <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                  {visiblePosts.map((post, i) => (
                    <AnimatedItem key={post.id} delay={i * 0.04}>
                      <Link
                        to={`/blog/${post.id}`}
                        className="group flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden h-full"
                      >
                        <div className="relative h-52 overflow-hidden">
                          <img
                            src={post.image || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-xs font-semibold text-primary-600 dark:text-primary-500">
                            {post.category}
                          </div>
                        </div>
                        <div className="p-6 flex flex-col flex-1">
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <span className="flex items-center gap-1">
                              <CalendarDaysIcon className="w-3.5 h-3.5" />
                              {formatDate(post.date)}
                            </span>
                            {post.readTime && (
                              <>
                                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                                <span className="flex items-center gap-1">
                                  <ClockIcon className="w-3.5 h-3.5" />
                                  {post.readTime}
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                            {post.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex-1 line-clamp-3 mb-4">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <img src={post.author?.image || 'https://i.pravatar.cc/150?u=a042581f4e29026024d'} alt={post.author?.name} className="w-7 h-7 rounded-full object-cover" />
                            <span className="text-xs text-gray-500 dark:text-gray-400">{post.author?.name}</span>
                          </div>
                        </div>
                      </Link>
                    </AnimatedItem>
                  ))}
                </StaggerContainer>

                {hasMore && (
                  <AnimatedDiv variant="fadeInUp" delay={0.2}>
                    <div className="text-center mt-12">
                      <motion.button
                        onClick={() => setVisibleCount(visibleCount + 6)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
                      >
                        Load More Articles
                      </motion.button>
                    </div>
                  </AnimatedDiv>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AnimatedSection>

      <AnimatedSection className="py-16 bg-gradient-to-br from-primary-600 to-primary-800">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <AnimatedDiv variant="fadeInUp" delay={0}>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">Stay ahead with HR insights</h2>
            <p className="text-primary-100 mb-8">
              Get the latest articles, guides, and industry trends delivered to your inbox every week.
            </p>
          </AnimatedDiv>
          <AnimatedDiv variant="fadeInUp" delay={0.1}>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your work email"
                className="flex-1 px-4 py-3 rounded-xl border-0 text-sm focus:outline-none focus:ring-2 focus:ring-white/50" required
              />
              <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-white text-primary-700 font-semibold text-sm rounded-xl hover:bg-gray-100 transition-all duration-200"
              >
                Subscribe
              </motion.button>
            </form>
          </AnimatedDiv>
        </div>
      </AnimatedSection>
    </PageWrapper>
  );
};

export default Blog;
