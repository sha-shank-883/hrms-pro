import React from 'react';
import { Link } from 'react-router-dom';

const blogPosts = [
  {
    id: 'automating-payroll',
    title: 'Automating Payroll: Reducing Errors and Saving Days of Work',
    excerpt: 'Manual payroll processing is prone to costly human errors. Learn how modern HRMS platforms automate tax calculations, deductions, and deposits to ensure 100% accuracy and save your finance team days of administrative work every month.',
    category: 'Productivity',
    date: 'April 24, 2026',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80',
    featured: true
  },
  {
    id: 'modern-employee-onboarding',
    title: 'The Complete Guide to Modern Employee Onboarding',
    excerpt: 'First impressions matter. Discover strategies to build a seamless onboarding experience that improves employee retention by up to 82% using automated document collection and structured learning paths.',
    category: 'Culture',
    date: 'April 18, 2026',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'geo-fencing-attendance',
    title: 'Geo-Fencing and Biometrics: The Future of Time & Attendance',
    excerpt: 'Time theft costs businesses billions annually. See how integrating geo-fencing and biometric verification into your HRMS can enforce attendance policies effortlessly for both remote and on-site workers.',
    category: 'Technology',
    date: 'April 10, 2026',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'continuous-feedback-culture',
    title: 'Building a High-Performance Culture with Continuous Feedback',
    excerpt: 'Annual performance reviews are dead. Learn why transitioning to a continuous feedback model with regular 1-on-1s and 360-degree reviews drives massive improvements in employee performance and engagement.',
    category: 'Leadership',
    date: 'April 5, 2026',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'navigating-hr-compliance',
    title: 'Navigating Compliance: How HRMS Protects Your Business',
    excerpt: 'Labor laws are constantly changing. Find out how an integrated HR software automatically keeps your business compliant with GDPR, SOC 2, and local employment regulations, mitigating massive legal risks.',
    category: 'Legal',
    date: 'March 28, 2026',
    readTime: '9 min read',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'hybrid-work-management',
    title: 'Mastering Hybrid Work: Tools Every HR Team Needs',
    excerpt: 'Managing a hybrid workforce presents unique challenges. Explore the essential digital tools and HRMS features required to maintain culture, track productivity, and ensure equitable treatment across all locations.',
    category: 'Future of Work',
    date: 'March 15, 2026',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80'
  }
];

const Blog = () => {
  const featuredPost = blogPosts.find(p => p.featured);
  const regularPosts = blogPosts.filter(p => !p.featured);

  return (
    <div className="pt-20 bg-neutral-50 min-h-screen pb-24">
      {/* Blog Header & Newsletter */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl font-extrabold text-neutral-900 tracking-tight mb-4">Insights for Modern HR</h1>
              <p className="text-xl text-neutral-600">Actionable advice, industry trends, and practical guides to help you manage your workforce better.</p>
            </div>
            <div className="bg-primary-50 p-8 rounded-3xl border border-primary-100">
              <h3 className="text-2xl font-bold text-neutral-900 mb-2">Subscribe to our newsletter</h3>
              <p className="text-neutral-600 mb-6">Get the latest HR insights delivered straight to your inbox every week.</p>
              <form className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your work email" 
                  className="flex-1 px-4 py-3 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-primary-500 outline-none"
                  required
                />
                <button type="submit" className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-colors">
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-20">
            <h2 className="text-2xl font-bold text-neutral-900 mb-8 flex items-center gap-2">
              <span className="w-2 h-8 bg-primary-500 rounded-full inline-block"></span>
              Featured Article
            </h2>
            <article className="group bg-white rounded-3xl shadow-xl border border-neutral-100 overflow-hidden flex flex-col md:flex-row hover:shadow-2xl transition-shadow">
              <div className="md:w-1/2 relative overflow-hidden">
                <img src={featuredPost.image} alt={featuredPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 min-h-[300px]" />
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-sm font-bold text-primary-700 shadow-sm uppercase tracking-wider">
                  {featuredPost.category}
                </div>
              </div>
              <div className="md:w-1/2 p-10 md:p-14 flex flex-col justify-center">
                <div className="flex items-center gap-4 text-sm text-neutral-500 font-medium mb-4">
                  <span>{featuredPost.date}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-neutral-300"></span>
                  <span>{featuredPost.readTime}</span>
                </div>
                <h3 className="text-3xl font-extrabold text-neutral-900 mb-4 group-hover:text-primary-600 transition-colors">
                  <Link to={`/blog/${featuredPost.id}`}>{featuredPost.title}</Link>
                </h3>
                <p className="text-lg text-neutral-600 mb-8 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <Link to={`/blog/${featuredPost.id}`} className="inline-flex items-center gap-2 text-primary-600 font-bold hover:text-primary-700 text-lg w-max">
                  Read full article 
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </Link>
              </div>
            </article>
          </div>
        )}

        {/* Post Grid */}
        <h2 className="text-2xl font-bold text-neutral-900 mb-8 flex items-center gap-2">
          <span className="w-2 h-8 bg-neutral-800 rounded-full inline-block"></span>
          Latest Articles
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {regularPosts.map(post => (
            <article key={post.id} className="flex flex-col bg-white rounded-2xl overflow-hidden border border-neutral-100 shadow-md hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="relative h-56 overflow-hidden">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary-700 uppercase tracking-wide">
                  {post.category}
                </div>
              </div>
              <div className="p-8 flex flex-col flex-1">
                <div className="flex items-center gap-3 text-xs text-neutral-500 font-medium mb-3">
                  <span>{post.date}</span>
                  <span className="w-1 h-1 rounded-full bg-neutral-300"></span>
                  <span>{post.readTime}</span>
                </div>
                <h3 className="text-xl font-bold text-neutral-900 mb-3 group-hover:text-primary-600 transition-colors line-clamp-2">
                  <Link to={`/blog/${post.id}`}>{post.title}</Link>
                </h3>
                <p className="text-neutral-600 flex-1 line-clamp-3 mb-6 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="pt-6 border-t border-neutral-100">
                  <Link to={`/blog/${post.id}`} className="text-primary-600 font-semibold hover:text-primary-700 flex items-center gap-1 group/link">
                    Read article <svg className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        
        {/* Pagination placeholder */}
        <div className="mt-16 flex justify-center">
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-neutral-200 text-neutral-500 hover:bg-neutral-50 disabled:opacity-50" disabled>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button className="w-10 h-10 rounded-lg flex items-center justify-center bg-primary-600 text-white font-medium">1</button>
            <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-medium">2</button>
            <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-neutral-200 text-neutral-700 hover:bg-neutral-50 font-medium">3</button>
            <button className="w-10 h-10 rounded-lg flex items-center justify-center border border-neutral-200 text-neutral-700 hover:bg-neutral-50">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Blog;
