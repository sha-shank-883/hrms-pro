import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../../services/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const renderIcon = (iconStr) => {
  if (!iconStr) return null;
  if (iconStr.startsWith('M')) {
    return (
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={iconStr} />
      </svg>
    );
  }
  return <span className="text-3xl">{iconStr}</span>;
};

const API_BASE = (import.meta.env.VITE_API_URL || '').replace('/api', '');

const resolveImage = (url, displayImageUrl) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (displayImageUrl) return displayImageUrl(url);
  return `${API_BASE}${url}`;
};

const SectionRendererV2 = ({ sections, themeMode, displayImageUrl }) => {
  const [blogPosts, setBlogPosts] = useState([]);
  const [faqOpen, setFaqOpen] = useState({});
  const [activeTabs, setActiveTabs] = useState({});

  useEffect(() => {
    const fetchBlogPosts = async () => {
      try {
        const res = await api.get('/blog-posts?limit=3&published=true');
        if (res.data?.success) setBlogPosts(res.data.data || []);
      } catch { }
    };
    if (sections?.some(s => s.section_type === 'blog_posts' && s.settings?.auto_fetch !== false)) {
      fetchBlogPosts();
    }
  }, [sections]);

  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return null;
  }

  const img = (url) => resolveImage(url, displayImageUrl);

  const renderSection = (section) => {
    if (section.is_visible === false) return null;

    const s = section.settings || {};
    const sectionStyle = section.custom_css ? (
      <style>{section.custom_css}</style>
    ) : null;
    const secId = section.custom_id || `section-${section.id || section._key}`;
    const secClass = [section.custom_class, 'relative overflow-hidden'].filter(Boolean).join(' ');

    switch (section.section_type) {

      case 'hero': {
        const layout = s.layout || 'center';
        const isSplit = layout === 'split';
        return (
          <section key={secId} id={secId} className={`${secClass} ${isSplit ? '' : 'pt-32 pb-24'} bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900`}>
            {sectionStyle}
            <div className={`max-w-7xl mx-auto px-6 lg:px-8 ${isSplit ? 'grid lg:grid-cols-2 gap-16 items-center min-h-[80vh] py-20' : 'text-center'}`}>
              <div className={isSplit ? '' : 'max-w-4xl mx-auto'}>
                {s.badge && (
                  <motion.div initial="hidden" whileInView="visible" variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-8">
                    {s.badge}
                  </motion.div>
                )}
                <motion.h1 initial="hidden" whileInView="visible" variants={fadeInUp}
                  className="text-5xl md:text-7xl lg:text-8xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6"
                  dangerouslySetInnerHTML={{ __html: s.title || 'Headline Here' }}
                />
                {s.subtitle && (
                  <motion.p initial="hidden" whileInView="visible" variants={fadeInUp} transition={{ delay: 0.1 }}
                    className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
                    {s.subtitle}
                  </motion.p>
                )}
                {(s.cta_primary || s.cta_secondary) && (
                  <motion.div initial="hidden" whileInView="visible" variants={fadeInUp} transition={{ delay: 0.2 }}
                    className={`flex flex-wrap gap-4 ${isSplit ? '' : 'justify-center'}`}>
                    {s.cta_primary && (
                      <Link to={s.cta_primary.url || '/demo'}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-2xl shadow-lg shadow-indigo-500/25 hover:shadow-xl transition-all duration-300">
                        {s.cta_primary.text || 'Get Started'}
                      </Link>
                    )}
                    {s.cta_secondary && (
                      <Link to={s.cta_secondary.url || '/features'}
                        className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold text-sm rounded-2xl hover:bg-gray-50 transition-all duration-300">
                        {s.cta_secondary.text || 'Learn More'}
                      </Link>
                    )}
                  </motion.div>
                )}
              </div>
              {isSplit && s.image && (
                <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
                  className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
                  <img src={img(s.image)} alt={s.title || ''} className="relative rounded-3xl shadow-2xl w-full" />
                </motion.div>
              )}
            </div>
            {!isSplit && s.image && (
              <motion.div initial={{ opacity: 0, y: 60 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.4 }}
                className="max-w-7xl mx-auto px-6 lg:px-8 mt-16">
                <div className="relative rounded-3xl p-2 bg-gradient-to-b from-gray-200/50 to-transparent dark:from-gray-700/50 border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden">
                  <img src={img(s.image)} alt="" className="rounded-2xl w-full" />
                </div>
              </motion.div>
            )}
          </section>
        );
      }

      case 'features': {
        const items = s.items || [];
        const cols = s.columns || 3;
        const gridCols = cols === 1 ? 'md:grid-cols-1' : cols === 2 ? 'md:grid-cols-2' : cols === 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3';
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 lg:py-32 bg-white dark:bg-gray-950`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              {(s.title || s.subtitle) && (
                <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-20">
                  {s.title && <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{s.title}</h2>}
                  {s.subtitle && <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">{s.subtitle}</p>}
                </div>
              )}
              <div className={`grid ${gridCols} gap-8`}>
                {items.map((item, idx) => (
                  <motion.div key={item._key || idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: idx * 0.06 }}
                    className="group p-8 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                    {item.icon && (
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-5 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 transition-all duration-300">
                        {renderIcon(item.icon)}
                      </div>
                    )}
                    {item.title && <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{item.title}</h3>}
                    {item.desc && <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'pricing': {
        const plans = s.plans || [];
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              {(s.title || s.subtitle) && (
                <div className="text-center max-w-3xl mx-auto mb-16">
                  {s.title && <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{s.title}</h2>}
                  {s.subtitle && <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">{s.subtitle}</p>}
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {plans.map((plan, idx) => (
                  <motion.div key={plan._key || idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: idx * 0.1 }}
                    className={`h-full p-8 rounded-3xl border-2 flex flex-col ${plan.popular
                      ? 'bg-white dark:bg-gray-900 border-indigo-500 shadow-xl shadow-indigo-500/10 scale-[1.02]'
                      : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                    }`}>
                    {plan.popular && <span className="inline-block self-start px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg mb-4">Most Popular</span>}
                    {plan.name && <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>}
                    {plan.desc && <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{plan.desc}</p>}
                    <div className="flex items-baseline gap-1 mb-6">
                      {plan.price && <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>}
                      {plan.period && <span className="text-sm text-gray-500 dark:text-gray-400">{plan.period}</span>}
                    </div>
                    {plan.features && (
                      <ul className="space-y-3 mb-8 flex-1">
                        {(Array.isArray(plan.features) ? plan.features : (plan.features || '').split('\n').filter(Boolean)).map((f, fi) => (
                          <li key={fi} className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                    <Link to={plan.cta_url || '/demo'}
                      className={`w-full text-center py-3 rounded-2xl font-bold text-sm transition-all ${plan.popular
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                      }`}>
                      {plan.cta_text || (plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial')}
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'testimonials': {
        const items = s.items || [];
        const layout = s.layout || 'grid';
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              {(s.title || s.subtitle) && (
                <div className="text-center max-w-3xl mx-auto mb-16">
                  {s.title && <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{s.title}</h2>}
                  {s.subtitle && <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">{s.subtitle}</p>}
                </div>
              )}
              <div className={`${layout === 'carousel' ? 'flex overflow-x-auto gap-8 pb-4 snap-x snap-mandatory' : 'grid md:grid-cols-3 gap-8'}`}>
                {items.map((item, idx) => (
                  <motion.div key={item._key || idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: idx * 0.1 }}
                    className={`${layout === 'carousel' ? 'snap-center shrink-0 w-[350px]' : ''} h-full p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl flex flex-col`}>
                    {item.rating > 0 && (
                      <div className="flex gap-1 mb-5">
                        {Array.from({ length: item.rating }).map((_, i) => (
                          <svg key={i} className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                        ))}
                      </div>
                    )}
                    {item.quote && <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 flex-1">&ldquo;{item.quote}&rdquo;</p>}
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                      {item.avatar && <img src={img(item.avatar)} alt={item.author} className="w-10 h-10 rounded-full object-cover" />}
                      {!item.avatar && item.author && (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          {item.author.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                      )}
                      <div>
                        {item.author && <p className="text-sm font-bold text-gray-900 dark:text-white">{item.author}</p>}
                        {item.role && <p className="text-xs text-gray-500 dark:text-gray-400">{item.role}</p>}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'logos': {
        const items = s.items || [];
        return (
          <section key={secId} id={secId} className={`${secClass} py-14 border-y border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              {s.title && <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mb-8">{s.title}</p>}
              <div className="flex flex-wrap justify-center items-center gap-10 lg:gap-16 opacity-40 dark:opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
                {items.map((item, idx) => (
                  item.logo_url
                    ? <img key={idx} src={img(item.logo_url)} alt={item.name} className="h-8 w-auto" />
                    : <span key={idx} className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{item.name}</span>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'stats': {
        const items = s.items || [];
        return (
          <section key={secId} id={secId} className={`${secClass} py-20 bg-indigo-600 dark:bg-indigo-700`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              {(s.title || s.subtitle) && (
                <div className="text-center mb-12">
                  {s.title && <h2 className="text-3xl font-black text-white">{s.title}</h2>}
                  {s.subtitle && <p className="text-indigo-200 mt-2">{s.subtitle}</p>}
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-10 text-center">
                {items.map((item, idx) => (
                  <motion.div key={item._key || idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: idx * 0.1 }}>
                    {item.value && <p className="text-4xl lg:text-5xl font-black text-white mb-2">{item.value}</p>}
                    {item.label && <p className="text-indigo-200 text-sm font-medium">{item.label}</p>}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'cta': {
        const ctaStyle = s.style || 'gradient';
        const isSimple = ctaStyle === 'simple';
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 lg:py-32 bg-white dark:bg-gray-950`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className={`relative overflow-hidden ${isSimple ? 'bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800' : 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800'} rounded-[2.5rem] p-10 lg:p-20 text-center`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,white/10)]" />
                <div className="relative z-10 max-w-3xl mx-auto">
                  {s.title && <h2 className={`text-3xl lg:text-5xl font-black tracking-tight mb-6 ${isSimple ? 'text-gray-900 dark:text-white' : 'text-white'}`}>{s.title}</h2>}
                  {s.subtitle && <p className={`text-lg mb-10 max-w-2xl mx-auto ${isSimple ? 'text-gray-500' : 'text-indigo-200'}`}>{s.subtitle}</p>}
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto">
                    {s.show_input ? (
                      <>
                        <input type="email" placeholder={s.input_placeholder || 'Enter your work email'}
                          className={`w-full px-5 py-3.5 rounded-2xl text-sm focus:outline-none focus:ring-2 ${isSimple ? 'border border-gray-200 bg-white text-gray-900' : 'bg-white/10 border border-white/20 text-white placeholder:text-indigo-200 focus:ring-white/30'}`} />
                        <Link to={s.button_url || '/demo'}
                          className={`w-full sm:w-auto px-8 py-3.5 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 whitespace-nowrap ${isSimple ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-700 hover:bg-indigo-50'}`}>
                          {s.button_text || 'Get Started'}
                        </Link>
                      </>
                    ) : (
                      <Link to={s.button_url || '/demo'}
                        className={`px-8 py-3.5 font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2 ${isSimple ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-indigo-700 hover:bg-indigo-50'}`}>
                        {s.button_text || 'Get Started'}
                      </Link>
                    )}
                  </div>
                  {s.footnote && <p className={`text-xs mt-4 ${isSimple ? 'text-gray-400' : 'text-indigo-300'}`}>{s.footnote}</p>}
                </div>
              </div>
            </div>
          </section>
        );
      }

      case 'content':
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 lg:py-32 bg-white dark:bg-gray-950`}>
            {sectionStyle}
            <div className="max-w-4xl mx-auto px-6 lg:px-8">
              {s.title && <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-8">{s.title}</h2>}
              {s.content && (
                <div className="prose prose-lg max-w-none dark:prose-invert text-gray-700 dark:text-gray-300 prose-headings:font-bold prose-a:text-indigo-600"
                  dangerouslySetInnerHTML={{ __html: s.content }} />
              )}
            </div>
          </section>
        );

      case 'faq': {
        const items = s.items || [];
        const faqKey = `faq-${secId}`;
        const openIdx = faqOpen[faqKey] ?? null;
        const toggleFaq = (idx) => setFaqOpen(prev => ({ ...prev, [faqKey]: prev[faqKey] === idx ? null : idx }));
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50`}>
            {sectionStyle}
            <div className="max-w-3xl mx-auto px-6 lg:px-8">
              {(s.title || s.subtitle) && (
                <div className="text-center mb-12">
                  {s.title && <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{s.title}</h2>}
                  {s.subtitle && <p className="mt-4 text-gray-500 dark:text-gray-400">{s.subtitle}</p>}
                </div>
              )}
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={item._key || idx} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                    <button onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left">
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">{item.question}</span>
                      <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${openIdx === idx ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {openIdx === idx && item.answer && (
                      <div className="px-6 pb-5 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-gray-800 pt-4">
                        {item.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'team': {
        const items = s.items || [];
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 lg:py-32 bg-white dark:bg-gray-950`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              {(s.title || s.subtitle) && (
                <div className="text-center max-w-3xl mx-auto mb-16">
                  {s.title && <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{s.title}</h2>}
                  {s.subtitle && <p className="mt-4 text-gray-500 dark:text-gray-400">{s.subtitle}</p>}
                </div>
              )}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {items.map((item, idx) => (
                  <motion.div key={item._key || idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: idx * 0.06 }}
                    className="text-center group">
                    {item.avatar ? (
                      <img src={img(item.avatar)} alt={item.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4 border-4 border-gray-100 dark:border-gray-800 group-hover:border-indigo-200 transition-all" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mx-auto mb-4 border-4 border-gray-100 dark:border-gray-800">
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{item.name ? item.name.charAt(0) : '?'}</span>
                      </div>
                    )}
                    {item.name && <h3 className="font-bold text-gray-900 dark:text-white">{item.name}</h3>}
                    {item.role && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.role}</p>}
                    {item.bio && <p className="text-xs text-gray-400 mt-2 max-w-xs mx-auto">{item.bio}</p>}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'newsletter':
        return (
          <section key={secId} id={secId} className={`${secClass} py-20 bg-indigo-600`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  {s.title && <h3 className="text-white font-bold text-lg">{s.title}</h3>}
                  {s.subtitle && <p className="text-indigo-200 text-sm mt-1">{s.subtitle}</p>}
                </div>
                <form className="flex gap-2 w-full sm:w-auto" onSubmit={(e) => e.preventDefault()}>
                  <input type="email" placeholder={s.placeholder || 'your@email.com'}
                    className="px-4 py-2.5 rounded-xl text-sm bg-white/10 border border-white/20 text-white placeholder:text-indigo-200 focus:outline-none focus:ring-2 focus:ring-white/30 w-full sm:w-64" />
                  <button type="submit" className="px-5 py-2.5 bg-white text-indigo-700 text-sm font-semibold rounded-xl hover:bg-indigo-50 transition-all shrink-0">
                    {s.button_text || 'Subscribe'}
                  </button>
                </form>
              </div>
            </div>
          </section>
        );

      case 'contact_form':
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50`}>
            {sectionStyle}
            <div className="max-w-3xl mx-auto px-6 lg:px-8">
              <div className="text-center mb-12">
                {s.title && <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{s.title}</h2>}
                {s.subtitle && <p className="mt-4 text-gray-500 dark:text-gray-400">{s.subtitle}</p>}
              </div>
              <form className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div className="grid md:grid-cols-2 gap-5">
                  <input type="text" placeholder="Your Name" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                  <input type="email" placeholder="Your Email" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
                <textarea rows={4} placeholder="Your Message" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                <button type="submit" className="px-8 py-3 bg-indigo-600 text-white font-semibold text-sm rounded-xl hover:bg-indigo-700 transition-all">
                  {s.button_text || 'Send Message'}
                </button>
              </form>
            </div>
          </section>
        );

      case 'blog_posts': {
        const posts = blogPosts.length > 0 ? blogPosts.slice(0, s.count || 3) : [];
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 lg:py-32 bg-white dark:bg-gray-950`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-16">
                {s.title && <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{s.title}</h2>}
                {s.subtitle && <p className="mt-4 text-gray-500 dark:text-gray-400">{s.subtitle}</p>}
              </div>
              {posts.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-8">
                  {posts.map((post, idx) => (
                    <motion.div key={post.id || idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: idx * 0.1 }}
                      className="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden hover:shadow-lg transition-all">
                      {post.image_url && <img src={img(post.image_url)} alt={post.title} className="w-full h-48 object-cover" />}
                      <div className="p-6">
                        {post.title && <h3 className="font-bold text-gray-900 dark:text-white mb-2">{post.title}</h3>}
                        {post.excerpt && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{post.excerpt}</p>}
                        <Link to={`/blog/${post.slug || post.id}`} className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Read More</Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 text-sm">
                  <p>No blog posts available yet. {s.fallback_text}</p>
                </div>
              )}
            </div>
          </section>
        );
      }

      case 'video': {
        const url = s.url || '';
        const isYoutube = url.includes('youtube') || url.includes('youtu.be');
        const isVimeo = url.includes('vimeo');
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 bg-gray-900 text-white`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
              {s.title && <h2 className="text-4xl lg:text-5xl font-black mb-6">{s.title}</h2>}
              {s.subtitle && <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">{s.subtitle}</p>}
              <div className="max-w-4xl mx-auto aspect-video bg-gray-800 rounded-3xl overflow-hidden shadow-2xl border border-gray-700">
                {isYoutube || isVimeo ? (
                  <iframe src={url} className="w-full h-full" frameBorder="0" allow="autoplay; fullscreen" title={s.title || 'Video'} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <p className="text-gray-500 text-sm">Video placeholder</p>
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      }

      case 'gallery': {
        const items = s.items || [];
        const cols = s.columns || 3;
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 bg-gray-50 dark:bg-gray-900/50`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              {s.title && <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight text-center mb-12">{s.title}</h2>}
              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                {items.map((item, idx) => (
                  <motion.div key={item._key || idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: idx * 0.06 }}
                    className="group relative aspect-square rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {item.url ? (
                      <img src={img(item.url)} alt={item.alt || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">{item.alt || 'Gallery Image'}</div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'tabs': {
        const items = s.items || [];
        const tabKey = `tabs-${secId}`;
        const activeTab = activeTabs[tabKey] ?? 0;
        const setActiveTab = (idx) => setActiveTabs(prev => ({ ...prev, [tabKey]: idx }));
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 bg-white dark:bg-gray-950`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8">
              {s.title && <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight text-center mb-12">{s.title}</h2>}
              <div className="flex flex-wrap justify-center gap-2 mb-10">
                {items.map((item, idx) => (
                  <button key={item._key || idx} onClick={() => setActiveTab(idx)}
                    className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === idx ? 'bg-indigo-600 text-white shadow-md' : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100'}`}>
                    {item.tab || `Tab ${idx + 1}`}
                  </button>
                ))}
              </div>
              <div className="max-w-4xl mx-auto">
                {items[activeTab] && (
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
                    className="prose prose-lg max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: items[activeTab].content || '' }} />
                )}
              </div>
            </div>
          </section>
        );
      }

      case 'divider':
        return (
          <div key={secId} id={secId} className={secClass}>
            {sectionStyle}
            <hr className="border-gray-200 dark:border-gray-700"
              style={{
                height: s.height || '1px',
                borderStyle: s.style === 'dashed' ? 'dashed' : s.style === 'dotted' ? 'dotted' : 'solid',
                borderColor: s.color || undefined,
                borderWidth: 0,
                borderTopWidth: s.height || '1px'
              }} />
          </div>
        );

      case 'integrations': {
        const items = s.items || [];
        return (
          <section key={secId} id={secId} className={`${secClass} py-20 bg-white dark:bg-gray-950`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
              {(s.title || s.subtitle) && (
                <div className="mb-10">
                  {s.title && <h2 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{s.title}</h2>}
                  {s.subtitle && <p className="text-gray-500 dark:text-gray-400 mt-2">{s.subtitle}</p>}
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-4">
                {items.map((item, idx) => (
                  item.logo_url
                    ? <img key={idx} src={img(item.logo_url)} alt={item.name} className="h-10 w-auto grayscale hover:grayscale-0 transition-all" />
                    : <span key={idx} className="px-5 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:border-indigo-200 hover:text-indigo-600 transition-all">
                      {item.name}
                    </span>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'timeline': {
        const items = s.items || [];
        return (
          <section key={secId} id={secId} className={`${secClass} py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50`}>
            {sectionStyle}
            <div className="max-w-4xl mx-auto px-6 lg:px-8">
              {(s.title || s.subtitle) && (
                <div className="text-center mb-16">
                  {s.title && <h2 className="text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">{s.title}</h2>}
                  {s.subtitle && <p className="mt-4 text-gray-500 dark:text-gray-400">{s.subtitle}</p>}
                </div>
              )}
              <div className="relative">
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />
                {items.map((item, idx) => (
                  <motion.div key={item._key || idx} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: idx * 0.1 }}
                    className="relative pl-20 pb-12 last:pb-0">
                    <div className="absolute left-5 top-1 w-6 h-6 bg-indigo-600 rounded-full border-4 border-white dark:border-gray-900 shadow" />
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-6 hover:shadow-md transition-all">
                      {item.year && <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{item.year}</span>}
                      {item.event && <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-1">{item.event}</h3>}
                      {item.desc && <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{item.desc}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );
      }

      case 'banner':
        return (
          <div key={secId} id={secId} className={`${secClass} bg-indigo-600 text-white`}>
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 lg:px-8 py-3 flex items-center justify-center gap-4 text-sm">
              <span>{s.text || ''}</span>
              {s.link && <Link to={s.link} className="font-semibold underline hover:no-underline whitespace-nowrap">{s.link_text || 'Learn More'}</Link>}
            </div>
          </div>
        );

      case 'custom_html':
        return (
          <section key={secId} id={secId} className={`${secClass} py-12 max-w-7xl mx-auto px-6 lg:px-8`}>
            {sectionStyle}
            {s.title && <h2 className="text-3xl font-black text-gray-900 dark:text-white text-center mb-8">{s.title}</h2>}
            <div dangerouslySetInnerHTML={{ __html: s.code || '' }} />
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`overflow-hidden ${themeMode === 'dark' ? 'dark' : ''}`}>
      {sections.map((section, idx) => {
        const rendered = renderSection(section);
        if (!rendered) return null;
        return (
          <motion.div key={section.id || section._key || idx}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}>
            {rendered}
          </motion.div>
        );
      })}
    </div>
  );
};

export default SectionRendererV2;
