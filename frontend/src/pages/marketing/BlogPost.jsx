import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDaysIcon, ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { AnimatedDiv, AnimatedItem, StaggerContainer, PageWrapper } from '../../components/common/AnimatedSection';
import SEO, { BlogPostSchema } from '../../components/common/SEO';
import blogPostsData from './blogPosts';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }); }
  catch { return dateStr; }
};

const BlogPost = () => {
  const { id } = useParams();
  const post = blogPostsData.find(p => p.id === id);

  const relatedPosts = post
    ? blogPostsData.filter((p) => p.id !== post.id && p.category === post.category).slice(0, 3)
    : [];

  if (!post) {
    return (
      <PageWrapper>
        <div className="pt-32 pb-24 px-6 text-center">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Article Not Found</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">The article you are looking for does not exist or has been removed.</p>
            <Link to="/blog" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all">
              Back to Blog
            </Link>
          </motion.div>
        </div>
      </PageWrapper>
    );
  }

  const postForSchema = {
    id: post.id,
    title: post.title,
    excerpt: post.excerpt,
    image_url: post.image,
    published_at: post.date,
    author_name: post.author?.name,
  };

  return (
    <PageWrapper>
      <SEO
        title={post.title}
        description={post.excerpt}
        image={post.image}
        type="article"
        publishedTime={post.date}
        author={post.author?.name}
      />
      <BlogPostSchema post={postForSchema} />
      <article className="bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 pt-24">
          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
            <Link to="/blog" className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              <ArrowLeftIcon className="w-4 h-4" />
              Back to all articles
            </Link>
          </motion.div>
        </div>

        <div className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-4"
          >
            {post.category}
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-white leading-tight tracking-tight mb-6"
          >
            {post.title}
          </motion.h1>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }}
            className="flex flex-wrap items-center gap-6 text-sm text-gray-500 dark:text-gray-400 mb-8"
          >
            <div className="flex items-center gap-3">
              <img src={post.author?.image || 'https://i.pravatar.cc/150?u=a042581f4e29026024d'} alt={post.author?.name}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white dark:ring-gray-800"
              />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">{post.author?.name}</p>
                <p className="text-xs">{post.author?.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <CalendarDaysIcon className="w-4 h-4" />
                {formatDate(post.date)}
              </span>
              {post.readTime && (
                <>
                  <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="flex items-center gap-1.5">
                    <ClockIcon className="w-4 h-4" />
                    {post.readTime}
                  </span>
                </>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}
          className="max-w-6xl mx-auto px-6 lg:px-8 mb-12"
        >
          <img src={post.image || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'}
            alt={post.title}
            className="w-full rounded-2xl border border-gray-100 dark:border-gray-800 object-cover aspect-[21/9]"
          />
        </motion.div>

        <div className="max-w-3xl mx-auto px-6 lg:px-8 pb-16">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="prose prose-gray dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-white prose-headings:font-bold prose-a:text-indigo-600 dark:prose-a:text-indigo-400 prose-blockquote:border-l-indigo-500 prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-gray-800/50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:not-italic prose-blockquote:text-gray-700 dark:prose-blockquote:text-gray-300 prose-li:marker:text-indigo-500 max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {post.tags && post.tags.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-800"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mr-2">Topics:</span>
                {post.tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
             className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between"
           >
             <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Share this article</span>
             <div className="flex items-center gap-3">
               {['twitter', 'linkedin', 'copy'].map((platform) => (
                 <motion.button key={platform}
                   whileHover={{ scale: 1.1 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={() => {
                     const url = window.location.href;
                     if (platform === 'twitter') {
                       window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`, '_blank');
                     } else if (platform === 'linkedin') {
                       window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
                     } else if (platform === 'copy') {
                       navigator.clipboard.writeText(url);
                     }
                   }}
                   className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                 >
                   {platform === 'twitter' && (
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                   )}
                   {platform === 'linkedin' && (
                     <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                   )}
                   {platform === 'copy' && (
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2h-4m6 8l6-6" /></svg>
                   )}
                 </motion.button>
               ))}
             </div>
           </motion.div>
        </div>

        {relatedPosts.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-800">
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
              <AnimatedDiv variant="fadeInUp" delay={0}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-10 text-center">Related Articles</h3>
              </AnimatedDiv>
              <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {relatedPosts.map((related, i) => (
                  <AnimatedItem key={related.id} delay={i * 0.06}>
                    <Link to={`/blog/${related.id}`}
                      className="group bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden block"
                    >
                      <div className="h-48 overflow-hidden">
                        <img src={related.image || 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80'}
                          alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      <div className="p-6">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{related.category}</span>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white mt-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                          {related.title}
                        </h4>
                      </div>
                    </Link>
                  </AnimatedItem>
                ))}
              </StaggerContainer>
            </div>
          </div>
        )}
      </article>
    </PageWrapper>
  );
};

export default BlogPost;
