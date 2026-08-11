import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaPlay, FaCheck, FaTimes, FaArrowRight, FaVideo } from 'react-icons/fa';

const SectionRenderer = ({ sections, layoutTemplate }) => {
  const { settings, displayImageUrl } = useOutletContext() || {};

  const renderIcon = (iconStr) => {
    if (!iconStr) return null;
    // Simple mapping for common icons or handle raw path
    if (iconStr.startsWith('M')) {
      return (
        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={iconStr}></path>
        </svg>
      );
    }
    return <span>{iconStr}</span>; // treat as emoji or plain text
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const renderSection = (section) => {
    if (section.isActive === false) return null;

    // Apply per-section custom CSS if it exists
    const sectionStyle = section.customCss ? (
      <style dangerouslySetInnerHTML={{ __html: section.customCss }} />
    ) : null;

    switch (section.type) {
      case 'Hero':
        return (
          <section key={section.id} className="relative pt-32 pb-24 overflow-hidden border-b border-neutral-100 dark:border-neutral-900">
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
              <motion.h1 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                className="text-5xl md:text-8xl font-black text-neutral-900 dark:text-white tracking-tighter mb-8 leading-[0.95]"
                dangerouslySetInnerHTML={{ __html: section.title }}
              />
              <motion.p 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.1 }}
                className="text-xl md:text-2xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto mb-12 leading-relaxed"
              >
                {section.subtitle}
              </motion.p>
              <motion.div 
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: 0.2 }}
                className="flex flex-wrap justify-center gap-4 mb-20"
              >
                <Link to="/demo" className="bg-primary-600 text-white font-black py-5 px-10 rounded-2xl text-lg hover:bg-neutral-900 dark:hover:bg-white dark:hover:text-black transition-all shadow-2xl shadow-primary-500/20 active:scale-95">
                  {settings?.cta_label || 'Get a Demo'}
                </Link>
                <Link to="/pricing" className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-800 font-black py-5 px-10 rounded-2xl text-lg hover:neutral-50 transition-all active:scale-95">
                  See Pricing
                </Link>
              </motion.div>
              {settings?.hero_image_url && (
                <motion.div 
                  initial={{ opacity: 0, y: 100 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                  className="relative mx-auto max-w-6xl rounded-3xl p-2 bg-gradient-to-b from-white to-transparent dark:from-neutral-800 dark:to-transparent border border-neutral-200 dark:border-neutral-800 shadow-2xl"
                >
                  <img src={displayImageUrl(settings.hero_image_url)} className="rounded-2xl w-full shadow-inner" alt="Hero" />
                </motion.div>
              )}
            </div>
            {/* Background elements */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-gradient-to-b from-primary-50/50 dark:from-primary-900/10 to-transparent -z-0"></div>
          </section>
        );

      case 'VideoHero':
        return (
          <section key={section.id} className="pt-24 pb-20 bg-neutral-900 text-white overflow-hidden relative">
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <motion.h2 initial="hidden" whileInView="visible" variants={fadeInUp} className="text-4xl md:text-6xl font-black mb-6 leading-tight">{section.title}</motion.h2>
                <motion.p initial="hidden" whileInView="visible" transition={{ delay: 0.1 }} variants={fadeInUp} className="text-xl text-neutral-400 mb-8">{section.subtitle}</motion.p>
                <Link to="/demo" className="inline-flex items-center gap-3 bg-primary-600 px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all active:scale-95 shadow-xl shadow-primary-500/10">
                   <FaPlay size={12}/> Watch Demo Video
                </Link>
              </div>
              <motion.div 
                initial={{ rotateY: 20, opacity: 0, scale: 0.8 }}
                whileInView={{ rotateY: 0, opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
                className="relative group cursor-pointer"
              >
                <div className="aspect-video bg-neutral-800 rounded-3xl border border-neutral-700 shadow-2xl overflow-hidden flex items-center justify-center">
                   {section.videoUrl?.includes('youtube') || section.videoUrl?.includes('vimeo') ? (
                     <iframe src={section.videoUrl} className="w-full h-full" frameBorder="0" allow="autoplay; fullscreen" title={section.title}></iframe>
                   ) : (
                     <FaVideo className="text-8xl text-neutral-700" />
                   )}
                </div>
              </motion.div>
            </div>
          </section>
        );

      case 'FeatureHeavy':
        return (
          <section key={section.id} className="py-32 bg-white dark:bg-neutral-950">
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-6xl font-black text-neutral-900 dark:text-white mb-6 leading-tight">{section.title}</h2>
                <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">{section.subtitle}</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
                {section.items?.map((item, idx) => (
                  <motion.div 
                    key={item.id || idx}
                    initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} transition={{ delay: idx * 0.1 }}
                    className="group"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 flex items-center justify-center text-3xl mb-6 shadow-sm group-hover:bg-primary-600 group-hover:text-white transition-all duration-300">
                      {renderIcon(item.icon)}
                    </div>
                    <h3 className="text-2xl font-black text-neutral-900 dark:text-white mb-4 group-hover:text-primary-600 transition-colors">{item.title}</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'ComparisonTable':
        return (
          <section key={section.id} className="py-32 bg-neutral-50 dark:bg-neutral-900/50">
            {sectionStyle}
            <div className="max-w-4xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-black text-neutral-900 dark:text-white mb-4">Why Choose Us?</h2>
                <p className="text-neutral-500">How HRMS Pro stacks up against traditional competitors.</p>
              </div>
              <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden">
                 <table className="w-full">
                   <thead>
                     <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/50">
                       <th className="px-8 py-6 text-left text-xs font-black uppercase text-neutral-400">Features</th>
                       <th className="px-8 py-6 text-center text-xs font-black uppercase text-primary-600">HRMS Pro</th>
                       <th className="px-8 py-6 text-center text-xs font-black uppercase text-neutral-400">Traditional</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                     {section.comparisons?.map((row, idx) => (
                       <tr key={row.id || idx} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/20">
                         <td className="px-8 py-4 font-bold text-neutral-800 dark:text-neutral-200 text-sm">{row.feature}</td>
                         <td className="px-8 py-4 text-center">
                            {row.us ? <div className="mx-auto w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center"><FaCheck size={10}/></div> : <FaTimes className="mx-auto text-neutral-300"/>}
                         </td>
                         <td className="px-8 py-4 text-center">
                            {row.them ? <div className="mx-auto w-6 h-6 bg-red-100 text-red-500 rounded-full flex items-center justify-center"><FaCheck size={10}/></div> : <FaTimes className="mx-auto text-neutral-300"/>}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </div>
          </section>
        );

      case 'SocialProof':
        return (
          <section key={section.id} className="py-20 border-y border-neutral-100 dark:border-neutral-900 bg-white dark:bg-neutral-950">
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 text-center">
              <p className="text-neutral-400 uppercase font-black tracking-tighter text-sm mb-12">{section.title || 'Trusted by innovative teams worldwide'}</p>
              <div className="flex flex-wrap justify-center items-center gap-16 opacity-40 dark:opacity-20 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
                 {section.items?.map((brand, idx) => (
                   <span key={brand.id || idx} className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white flex items-center gap-3">
                     {brand.name}
                   </span>
                 ))}
              </div>
            </div>
          </section>
        );

      case 'CTA':
        return (
          <section key={section.id} className="py-24 max-w-7xl mx-auto px-6">
            {sectionStyle}
            <div className="bg-primary-600 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/10 to-transparent"></div>
               <div className="relative z-10 max-w-3xl mx-auto">
                 <h2 className="text-4xl md:text-7xl font-black text-white mb-8 tracking-tighter leading-none">{section.title}</h2>
                 <p className="text-xl text-primary-100 mb-12">{section.subtitle}</p>
                 <Link to="/demo" className="bg-white text-primary-600 px-10 py-5 rounded-2xl font-black text-lg hover:shadow-2xl hover:scale-105 transition-all inline-flex items-center gap-3">
                   {settings?.cta_label || 'Get Started Now'} <FaArrowRight size={14}/>
                 </Link>
               </div>
            </div>
          </section>
        );
      
      case 'GridFeatures':
        return (
          <section key={section.id} className="py-32 bg-white dark:bg-black">
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-6xl font-black text-neutral-900 dark:text-white mb-6 leading-tight">{section.title}</h2>
                <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-3xl mx-auto">{section.subtitle}</p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {section.items?.map((item, idx) => (
                   <motion.div 
                    key={item.id || idx}
                    whileHover={{ scale: 1.02 }}
                    className="p-8 bg-neutral-50 dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl"
                   >
                     <div className="text-3xl mb-6">{renderIcon(item.icon)}</div>
                     <h4 className="text-xl font-bold dark:text-white mb-3">{item.title}</h4>
                     <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
                   </motion.div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'CustomHTML':
        return (
          <section key={section.id} className="py-24 max-w-7xl mx-auto px-6 section-custom">
            {sectionStyle}
            {section.title && <h2 className="text-4xl font-black mb-6 text-center leading-tight tracking-tighter" dangerouslySetInnerHTML={{ __html: section.title }} />}
            {section.subtitle && <p className="text-xl text-neutral-500 mb-12 text-center max-w-2xl mx-auto">{section.subtitle}</p>}
            <div dangerouslySetInnerHTML={{ __html: section.code || '' }} />
          </section>
        );

      case 'PricingPlans':
        return (
          <section key={section.id} className="py-32 bg-neutral-900 text-white overflow-hidden">
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-20">
                <h2 className="text-4xl md:text-6xl font-black mb-6 tracking-tighter">{section.title || 'Simple Pricing'}</h2>
                <p className="text-xl text-neutral-400">{section.subtitle || 'Scale your business with ease.'}</p>
              </div>
              <div className="grid lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
                 {section.plans?.map((plan, idx) => (
                   <div key={plan.id || idx} className={`p-10 rounded-[3rem] ${plan.isPopular ? 'bg-primary-600 scale-105 shadow-3xl shadow-primary-500/20 relative' : 'bg-neutral-800'} transition-all`}>
                      {plan.isPopular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-primary-600 px-4 py-1 rounded-full font-black text-xs uppercase">Most Popular</div>}
                      <h4 className="text-2xl font-black mb-2">{plan.name}</h4>
                      <div className="flex items-baseline gap-2 mb-8">
                        <span className="text-5xl font-black">{plan.price}</span>
                        <span className="text-neutral-400 text-sm">{plan.period}</span>
                      </div>
                      <ul className="space-y-4 mb-12 text-neutral-300">
                         {plan.features?.split('\n').map((f, fi) => (
                           <li key={fi} className="flex gap-3 items-center text-sm font-bold">
                             <FaCheck className={plan.isPopular ? 'text-white' : 'text-primary-500'} /> {f}
                           </li>
                         ))}
                      </ul>
                      <Link to="/demo" className={`w-full py-5 rounded-2xl font-black text-center block transition-all ${plan.isPopular ? 'bg-white text-primary-600 hover:bg-neutral-100' : 'bg-primary-600 text-white hover:bg-primary-700'}`}>
                        Start 14-Day Free Trial
                      </Link>
                   </div>
                 ))}
              </div>
            </div>
          </section>
        );

      case 'ResourceLibrary':
        return (
          <section key={section.id} className="py-24 bg-neutral-50 dark:bg-neutral-900/50">
            {sectionStyle}
            <div className="max-w-7xl mx-auto px-6 text-center">
              <h2 className="text-4xl font-black mb-6">{section.title}</h2>
              <p className="text-xl text-neutral-500 mb-12 max-w-2xl mx-auto">{section.subtitle}</p>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {(section.items || [1,2,3,4]).map((item, idx) => (
                  <div key={idx} className="bg-white dark:bg-neutral-900 p-6 rounded-3xl border border-neutral-200 dark:border-neutral-800 text-left hover:shadow-xl transition-all">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                       <FaBookOpen />
                    </div>
                    <h4 className="font-bold mb-2">{item.title || 'Guide Title'}</h4>
                    <p className="text-xs text-neutral-500 mb-4">{item.desc || 'Learn best practices for HR management.'}</p>
                    <Link to="/resources" className="text-primary-600 text-xs font-black flex items-center gap-1">View Library <FaArrowRight size={8}/></Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  if (!sections || !Array.isArray(sections)) {
    return <div className="py-24 text-center text-neutral-500">No sections discovered.</div>;
  }

  return (
    <div className={`cms-content-wrapper overflow-hidden ${settings?.theme_mode === 'dark' ? 'dark' : ''}`}>
      {sections.map(section => renderSection(section))}
    </div>
  );
};

export default SectionRenderer;
