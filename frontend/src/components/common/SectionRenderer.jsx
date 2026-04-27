import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';

const SectionRenderer = ({ sections }) => {
  const { settings, displayImageUrl } = useOutletContext() || {};

  const renderIcon = (iconStr) => {
    if (!iconStr) return null;
    if (iconStr === 'circle') return <circle cx="12" cy="12" r="10"/>;
    if (iconStr === 'rect') return <rect width="20" height="20" x="2" y="2" rx="4"/>;
    if (iconStr === 'polygon') return <polygon points="12,2 22,22 2,22"/>;
    return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={iconStr}></path>;
  };

  const renderSection = (section) => {
    if (section.isActive === false) return null;

    switch (section.type) {
      case 'Hero':
        return (
          <section key={section.id} className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
            {section.subtitle && section.subtitle.includes('🌟') && (
              <div className="inline-block px-4 py-2 bg-primary-50 text-primary-700 rounded-full font-semibold text-sm mb-6 border border-primary-100 shadow-sm">
                🌟 The #1 HR Platform for Modern Teams
              </div>
            )}
            <h1 className="text-5xl md:text-7xl font-extrabold text-neutral-900 tracking-tight mb-8" dangerouslySetInnerHTML={{ __html: section.title }}></h1>
            <p className="text-xl text-neutral-600 mb-10 max-w-3xl mx-auto leading-relaxed">{section.subtitle}</p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20 relative z-10">
              <Link to="/demo" className="bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-transform hover:scale-105 shadow-lg flex items-center justify-center gap-2">
                Get a Free Demo <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
              </Link>
              <Link to="/pricing" className="bg-white hover:bg-neutral-50 text-neutral-900 border border-neutral-200 font-bold py-4 px-8 rounded-full text-lg transition-colors shadow-sm text-center">
                See Pricing
              </Link>
            </div>
            {settings?.hero_image_url && (
              <div className="rounded-2xl border-4 border-white shadow-2xl overflow-hidden bg-neutral-100 max-w-7xl mx-auto -mt-12">
                <img src={displayImageUrl(settings.hero_image_url)} alt="Main Dashboard" className="w-full h-auto object-cover" />
              </div>
            )}
          </section>
        );

      case 'SocialProof':
        return (
          <section key={section.id} className="bg-neutral-50 py-16 border-y border-neutral-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <p className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-8">{section.title}</p>
              <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale">
                {section.items && section.items.map((item, idx) => (
                  <div key={item.id || idx} className="text-2xl font-bold flex items-center gap-2">
                    {item.icon && (
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        {renderIcon(item.icon)}
                      </svg>
                    )}
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          </section>
        );

      case 'DeepDive':
        return (
          <section key={section.id} className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6" dangerouslySetInnerHTML={{ __html: section.title }}></h2>
                <p className="text-lg text-neutral-600 mb-8 leading-relaxed">{section.subtitle}</p>
                <ul className="space-y-4 mb-8">
                  {section.items && section.items.map((item, idx) => (
                    <li key={item.id || idx} className="flex items-start gap-3">
                      <div className="mt-1 bg-primary-100 text-primary-600 p-1 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
                      <div>
                        <h4 className="font-bold text-neutral-900">{item.title}</h4>
                        <p className="text-neutral-600 text-sm">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary-100 rounded-3xl transform translate-x-4 translate-y-4"></div>
                <div className="rounded-3xl border border-neutral-200 overflow-hidden relative bg-white shadow-lg">
                  <div className="aspect-video bg-neutral-100 flex items-center justify-center text-neutral-400">Image Placeholder</div>
                </div>
              </div>
            </div>
          </section>
        );

      case 'TimeTracking':
        return (
          <section key={section.id} className="py-24 bg-neutral-900 text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 relative">
                 <div className="absolute inset-0 bg-primary-900 rounded-3xl transform -translate-x-4 translate-y-4"></div>
                 <div className="rounded-3xl border border-neutral-700 overflow-hidden relative bg-neutral-800 shadow-2xl">
                   <div className="aspect-video bg-neutral-800 flex items-center justify-center text-neutral-600">Image Placeholder</div>
                 </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6" dangerouslySetInnerHTML={{ __html: section.title }}></h2>
                <p className="text-lg text-neutral-400 mb-8 leading-relaxed">{section.subtitle}</p>
                <ul className="space-y-4 mb-8">
                  {section.items && section.items.map((item, idx) => (
                    <li key={item.id || idx} className="flex items-start gap-3">
                      <div className="mt-1 bg-primary-900 text-primary-400 p-1 rounded-full"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg></div>
                      <div>
                        <h4 className="font-bold text-white">{item.title}</h4>
                        <p className="text-neutral-400 text-sm">{item.desc}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <Link to="/demo" className="text-primary-400 hover:text-primary-300 font-bold inline-flex items-center gap-2 transition-colors">
                  Explore Features <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </Link>
              </div>
            </div>
          </section>
        );

      case 'GridFeatures':
        return (
          <section key={section.id} id="features" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-neutral-900 mb-4">{section.title}</h2>
              <p className="text-xl text-neutral-600 max-w-2xl mx-auto">{section.subtitle}</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {section.items && section.items.map((feature, idx) => (
                <div key={feature.id || idx} className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 hover:shadow-lg transition-all hover:-translate-y-1">
                  <div className="w-12 h-12 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-6">
                    {feature.icon ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {renderIcon(feature.icon)}
                      </svg>
                    ) : (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-neutral-600 leading-relaxed text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </section>
        );

      case 'Testimonial':
        return (
          <section key={section.id} className="bg-primary-50 py-24">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <svg className="w-12 h-12 text-primary-300 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/></svg>
              <h3 className="text-3xl md:text-4xl font-medium text-neutral-900 mb-8 leading-relaxed">"{section.text}"</h3>
              <div className="flex items-center justify-center gap-4">
                <div className="w-12 h-12 bg-primary-200 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
                  {section.author?.charAt(0) || 'U'}
                </div>
                <div className="text-left">
                  <p className="font-bold text-neutral-900">{section.author}</p>
                  <p className="text-sm text-neutral-500">{section.role}</p>
                </div>
              </div>
            </div>
          </section>
        );

      case 'CTA':
        return (
          <section key={section.id} className="bg-primary-500 py-24 px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">{section.title}</h2>
            <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">{section.subtitle}</p>
            <Link to="/demo" className="bg-white text-primary-600 hover:bg-neutral-50 font-bold py-4 px-10 rounded-full text-lg transition-transform hover:scale-105 shadow-lg inline-flex items-center gap-2">
              Start Your Free Demo Today <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </Link>
          </section>
        );

      case 'CustomHTML':
        return (
          <section key={section.id} className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {section.title && <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4 text-center" dangerouslySetInnerHTML={{ __html: section.title }}></h2>}
            {section.subtitle && <p className="text-xl text-neutral-600 mb-12 text-center max-w-3xl mx-auto">{section.subtitle}</p>}
            <div dangerouslySetInnerHTML={{ __html: section.code || '' }} />
          </section>
        );

      case 'PricingPlans':
        return (
          <section key={section.id} className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-neutral-50 border-y border-neutral-100">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-4">{section.title || 'Simple, transparent pricing'}</h2>
              <p className="text-xl text-neutral-600 max-w-2xl mx-auto">{section.subtitle || 'Choose the perfect plan for your team.'}</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {section.plans && section.plans.map((plan, idx) => (
                <div key={plan.id || idx} className={`bg-white rounded-3xl p-8 flex flex-col relative ${plan.isPopular ? 'border-2 border-primary-500 shadow-xl scale-105 z-10' : 'border border-neutral-200 shadow-sm'}`}>
                  {plan.isPopular && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider">
                      Most Popular
                    </div>
                  )}
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-neutral-500 font-medium"> {plan.period}</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {plan.features && plan.features.split('\n').filter(f => f.trim()).map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3 text-neutral-600">
                        <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/demo" className={`w-full py-4 rounded-xl font-bold text-center transition-colors ${plan.isPopular ? 'bg-primary-500 hover:bg-primary-600 text-white shadow-md' : 'bg-primary-50 hover:bg-primary-100 text-primary-700'}`}>
                    Get Started
                  </Link>
                </div>
              ))}
            </div>
          </section>
        );
      
      default:
        return null;
    }
  };

  if (!sections || !Array.isArray(sections)) {
    return <div className="py-24 text-center text-neutral-500">No sections found.</div>;
  }

  return (
    <>
      {sections.map(section => renderSection(section))}
    </>
  );
};

export default SectionRenderer;
