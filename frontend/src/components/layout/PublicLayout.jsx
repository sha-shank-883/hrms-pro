import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, ChevronDownIcon, ArrowRightIcon, ShieldCheckIcon, StarIcon, PlusIcon, MinusIcon, MapPinIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';

const SocialIcon = ({ platform }) => {
  if (platform === 'linkedin') {
    return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>;
  }
  if (platform === 'twitter' || platform === 'x') {
    return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;
  }
  if (platform === 'github') {
    return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>;
  }
  if (platform === 'youtube') {
    return <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
  }
  return null;
};

const navLinks = [
  { label: 'Platform', url: '/features', children: [
    { label: 'Core HR', url: '/features', desc: 'Centralized employee records and org charts' },
    { label: 'Time & Attendance', url: '/features', desc: 'Biometric tracking and shift scheduling' },
    { label: 'Payroll Management', url: '/features', desc: 'Multi-country payroll with tax compliance' },
    { label: 'Performance & Goals', url: '/features', desc: 'OKRs, 360 reviews, and AI insights' },
    { label: 'Talent Management', url: '/features', desc: 'Recruiting, onboarding, and learning' },
    { label: 'Analytics & Reporting', url: '/features', desc: '150+ pre-built metrics and dashboards' },
  ]},
  { label: 'Pricing', url: '/pricing' },
  { label: 'About', url: '/about' },
  { label: 'Resources', columns: [
    { title: 'Content', links: [
      { label: 'Blog', url: '/blog', desc: 'HR insights and guides' },
      { label: 'Resources', url: '/resources', desc: 'E-books, whitepapers, and videos' },
      { label: 'FAQ', url: '/faq', desc: 'Frequently asked questions' },
    ]},
    { title: 'Compare', links: [
      { label: 'vs BambooHR', url: '/vs-bamboohr', desc: 'See how we compare' },
      { label: 'vs Gusto', url: '/vs-gusto', desc: 'Modern HR vs simple payroll' },
      { label: 'vs Rippling', url: '/vs-rippling', desc: 'Enterprise power without complexity' },
    ]},
    { title: 'Company', links: [
      { label: 'About Us', url: '/about', desc: 'Our mission and team' },
      { label: 'Contact', url: '/contact', desc: 'Get in touch with us' },
    ]},
  ]},
  { label: 'Contact', url: '/contact' },
];

const footerColumns = [
  { title: 'Platform', links: [
    { label: 'Features', url: '/features' },
    { label: 'Pricing', url: '/pricing' },
    { label: 'Demo', url: '/demo' },
    { label: 'Integrations', url: '/features' },
    { label: 'Security', url: '/privacy' },
    { label: 'API Documentation', url: '/resources' },
  ]},
  { title: 'Resources', links: [
    { label: 'Blog', url: '/blog' },
    { label: 'Guides & E-books', url: '/resources' },
    { label: 'FAQ', url: '/faq' },
    { label: 'Documentation', url: '/resources' },
    { label: 'Status Page', url: '#' },
  ]},
  { title: 'Compare', links: [
    { label: 'vs BambooHR', url: '/vs-bamboohr' },
    { label: 'vs Gusto', url: '/vs-gusto' },
    { label: 'vs Rippling', url: '/vs-rippling' },
  ]},
  { title: 'Company', links: [
    { label: 'About Us', url: '/about' },
    { label: 'Careers', url: '#' },
    { label: 'Contact', url: '/contact' },
    { label: 'Partners', url: '#' },
  ]},
  { title: 'Legal & Policies', links: [
    { label: 'Terms & Conditions', url: '/terms' },
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Cancellation & Refund', url: '/cancellation-refund' },
    { label: 'Shipping Policy', url: '/shipping-policy' },
    { label: 'Pricing & Plans', url: '/pricing' },
    { label: 'Contact Us', url: '/contact' },
  ]},
  { title: 'Support', links: [
    { label: 'Help Center & FAQ', url: '/faq' },
    { label: 'Contact Support', url: '/contact' },
    { label: 'Documentation', url: '/resources' },
    { label: 'Security & Compliance', url: '/privacy' },
  ]},
];

const PublicLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState({});
  const { dark, toggle: toggleTheme } = useTheme();
  const { settings, displayImageUrl, t, loading } = useWebsiteBuilder();
  const dropdownRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
    setOpenDropdown(null);
    setMobileExpanded({});
  }, [location]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (href) => location.pathname === href;

  const BrandLogo = ({ size = 'md', className = '' }) => {
    const [imgError, setImgError] = useState(false);
    const logoUrl = settings?.logo_url ? displayImageUrl(settings.logo_url) : null;
    const initial = (settings?.company_name || 'H').trim().charAt(0).toUpperCase() || 'H';

    const sizeClasses = {
      sm: 'w-8 h-8 text-base rounded-lg',
      md: 'w-10 h-10 text-lg rounded-xl',
      lg: 'w-11 h-11 text-xl rounded-2xl',
    }[size] || 'w-10 h-10 text-lg rounded-xl';

    if (logoUrl && !imgError) {
      return (
        <img
          src={logoUrl}
          alt={settings?.company_name || 'HRMS Pro'}
          className={`h-10 object-contain ${className}`}
          onError={() => setImgError(true)}
        />
      );
    }

    return (
      <div className={`${sizeClasses} bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-black shadow-md shadow-primary-500/20 group-hover:shadow-lg transition-all duration-300 ${className}`}>
        {initial}
      </div>
    );
  };

  const toggleMobileExpand = (label) => {
    setMobileExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  };

  const getLinks = (item) => {
    if (item.columns) {
      return item.columns.flatMap(col => col.links || []);
    }
    return item.children || [];
  };

  const renderDesktopMegaMenu = (item) => {
    if (!item.columns && !item.children) return null;
    const links = getLinks(item);
    const hasColumns = !!item.columns;

    return (
      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl shadow-black/5 p-4 animate-fade-in ${hasColumns ? 'w-[600px]' : 'w-72'}`}>
        {hasColumns ? (
          <div className="grid grid-cols-2 gap-4">
            {item.columns.map((col, colIdx) => (
              <div key={col.title || colIdx}>
                {col.title && (
                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-3">
                    {col.title}
                  </p>
                )}
                <div className="space-y-0.5">
                  {(col.links || []).map((link, linkIdx) => (
                    <Link key={link.label || link.id || linkIdx} to={link.url || link.href}
                      className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${isActive(link.url || link.href) ? 'ws-nav-link-active bg-primary-50 dark:bg-primary-500/10' : 'ws-nav-link hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{link.label}</p>
                        {link.desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{link.desc}</p>}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-0.5">
            {links.map((child) => (
              <Link key={child.label || child.id} to={child.url || child.href}
                className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${isActive(child.url || child.href) ? 'ws-nav-link-active bg-primary-50 dark:bg-primary-500/10' : 'ws-nav-link hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{child.label}</p>
                  {child.desc && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{child.desc}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderNavItem = (item) => {
    const hasChildren = item.children || item.columns;
    if (hasChildren) {
      const isItemActive = getLinks(item).some(c => isActive(c.url || c.href));
      return (
        <div key={item.label || item.id} className="relative"
          onMouseEnter={() => setOpenDropdown(item.label)}
          onMouseLeave={() => setOpenDropdown(null)}
        >
          <button
            onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              openDropdown === item.label || isItemActive
                ? 'ws-nav-link-active text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-primary-500/10'
                : 'ws-nav-link text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {item.label}
            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === item.label && renderDesktopMegaMenu(item)}
        </div>
      );
    }
    const isSingleActive = isActive(item.url || item.href);
    return (
      <Link key={item.label || item.id} to={item.url || item.href}
        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
          isSingleActive
            ? 'ws-nav-link-active text-primary-600 dark:text-primary-500 bg-primary-50 dark:bg-primary-500/10'
            : 'ws-nav-link text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        {item.label}
      </Link>
    );
  };

  const renderMobileNavItem = (item) => {
    const hasChildren = item.children || item.columns;
    const links = getLinks(item);
    const expanded = mobileExpanded[item.label];

    if (hasChildren) {
      return (
        <div key={item.label || item.id}>
          <button onClick={() => toggleMobileExpand(item.label)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            {item.label}
            {expanded ? <MinusIcon className="w-4 h-4 text-gray-400" /> : <PlusIcon className="w-4 h-4 text-gray-400" />}
          </button>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="pl-4 pb-2 space-y-0.5">
              {links.map((child) => (
                <Link key={child.label || child.id} to={child.url || child.href}
                  className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(child.url || child.href)
                      ? 'ws-nav-link-active bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-500'
                      : 'ws-nav-link text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {child.label}
                  {child.desc && <span className="block text-xs text-gray-400 mt-0.5">{child.desc}</span>}
                </Link>
              ))}
            </div>
          </div>
        </div>
      );
    }

    return (
      <Link key={item.label || item.id} to={item.url || item.href}
        className={`block px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
          isActive(item.url || item.href)
            ? 'ws-nav-link-active bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-500'
            : 'ws-nav-link text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        {item.label}
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-white dark:bg-gray-950 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full border-2 border-primary-500/20 animate-ping absolute" />
          <div className="w-16 h-16 rounded-full border-t-2 border-r-2 border-primary-600 animate-spin" />
          <div className="w-4 h-4 rounded-full bg-primary-600 absolute" />
        </div>
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide animate-pulse">
          Loading...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm'
          : 'bg-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-20">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <BrandLogo size="md" />
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
              {settings.company_name || 'HRMS Pro'}
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
            {(settings.header_links && settings.header_links.length > 0 ? settings.header_links : navLinks).map(renderNavItem)}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Toggle theme"
            >
              {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-4 py-2">
              {t('nav.sign_in', 'Sign In')}
            </Link>
            <Link to="/demo"
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-primary-500/20 hover:shadow-md hover:shadow-primary-500/30 transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              {t('nav.get_demo', 'Get a Demo')}
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
              title="Toggle theme"
            >
              {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-300" /> : <Bars3Icon className="w-6 h-6 text-gray-500 dark:text-gray-300" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 shadow-lg overflow-hidden"
            >
              <div className="px-6 py-6 space-y-1">
                {(settings.header_links && settings.header_links.length > 0 ? settings.header_links : navLinks).map(renderMobileNavItem)}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="pt-4 space-y-3 border-t border-gray-100 dark:border-gray-800 mt-4"
                >
                  <Link to="/login" className="block w-full text-center px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Sign In
                  </Link>
                  <Link to="/demo" className="block w-full text-center px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl transition-colors">
                    Get a Demo
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Dynamic Footer Design Variants */}
      {(() => {
        let footerCfg = {
          variant: 'modern',
          tagline: settings.tagline || 'Enterprise-grade HR management platform for global teams.',
          copyright_text: `© ${new Date().getFullYear()} ${settings.company_name || 'HRMS Pro'}. ${t('footer.rights_reserved', 'All rights reserved.')}`,
          show_newsletter: true,
          show_social_links: true,
          show_trust_badges: true,
        };

        if (settings?.footer_config) {
          try {
            const parsed = typeof settings.footer_config === 'string' ? JSON.parse(settings.footer_config) : settings.footer_config;
            if (parsed && typeof parsed === 'object') {
              footerCfg = {
                variant: parsed.variant || 'modern',
                tagline: parsed.tagline || settings.tagline || 'Enterprise-grade HR management platform for global teams.',
                copyright_text: parsed.copyright_text || `© ${new Date().getFullYear()} ${settings.company_name || 'HRMS Pro'}. ${t('footer.rights_reserved', 'All rights reserved.')}`,
                show_newsletter: parsed.show_newsletter !== false,
                show_social_links: parsed.show_social_links !== false,
                show_trust_badges: parsed.show_trust_badges !== false,
                custom_html: parsed.custom_html || '',
              };
            }
          } catch {}
        }

        const activeCols = settings?.footer_columns && settings.footer_columns.length > 0 ? settings.footer_columns : footerColumns;

        return (
          <>
            {/* Optional Newsletter Signup Banner */}
            {footerCfg.show_newsletter && (
              <div className="bg-gray-900 dark:bg-gray-950 border-t border-gray-800">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-gray-300 font-medium">
                      {t('footer.newsletter_title', 'Stay ahead with HR insights. Get the latest guides and trends delivered weekly.')}
                    </p>
                    <form className="flex gap-2 w-full sm:w-auto" onSubmit={(e) => e.preventDefault()}>
                      <input type="email" placeholder={t('footer.newsletter_placeholder', 'Enter your work email')}
                        className="px-4 py-2.5 rounded-xl text-sm bg-gray-800 border border-gray-700 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 w-full sm:w-64"
                      />
                      <button type="submit" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shrink-0 shadow-sm">
                        {t('footer.subscribe', 'Subscribe')}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Main Content */}
            <footer className="bg-gray-950 dark:bg-black text-gray-300">
              {/* VARIANT 1: 100% CUSTOM HTML & TAILWIND STUDIO */}
              {footerCfg.variant === 'custom_html' && (
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12" dangerouslySetInnerHTML={{ __html: footerCfg.custom_html }} />
              )}

              {/* VARIANT 2: MINIMAL CENTERED */}
              {footerCfg.variant === 'minimal' && (
                <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 text-center space-y-8">
                  <Link to="/" className="inline-flex items-center gap-2.5 group">
                    <BrandLogo size="md" />
                    <span className="font-bold text-xl text-white">{settings.company_name || 'HRMS Pro'}</span>
                  </Link>

                  <p className="text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">{footerCfg.tagline}</p>

                  {/* Horizontal Link Categories */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {activeCols.flatMap(c => c.links || []).map((link, idx) => (
                      <Link key={idx} to={link.url || link.href || '/'} className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-xs font-semibold text-gray-300 hover:text-white transition-all border border-gray-800">
                        {link.label}
                      </Link>
                    ))}
                  </div>

                  {footerCfg.show_social_links && (
                    <div className="flex items-center justify-center gap-4 pt-2">
                      {[['linkedin', 'https://linkedin.com'], ['twitter', 'https://twitter.com'], ['github', 'https://github.com'], ['youtube', 'https://youtube.com']].map(([platform, url]) => (
                        <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-xl bg-gray-900 border border-gray-800 hover:bg-primary-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                          <SocialIcon platform={platform} />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="pt-8 border-t border-gray-800/60 text-xs text-gray-500">
                    {footerCfg.copyright_text}
                  </div>
                </div>
              )}

              {/* VARIANT 3: DARK LUXE GRADIENT */}
              {footerCfg.variant === 'dark_luxe' && (
                <div className="relative overflow-hidden">
                  <div className="h-1.5 w-full bg-gradient-to-r from-primary-500 via-secondary-500 to-pink-500" />
                  <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 space-y-12">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 p-8 rounded-3xl bg-gray-900/60 backdrop-blur border border-gray-800 shadow-2xl">
                      <div className="lg:col-span-2 space-y-6">
                        <Link to="/" className="flex items-center gap-3">
                          <BrandLogo size="lg" />
                          <span className="font-extrabold text-2xl tracking-tight text-white">{settings.company_name || 'HRMS Pro'}</span>
                        </Link>

                        <p className="text-sm text-gray-300 leading-relaxed">
                          {footerCfg.tagline}
                        </p>

                        {footerCfg.show_social_links && (
                          <div className="flex items-center gap-3 pt-2">
                            {[['linkedin', 'https://linkedin.com'], ['twitter', 'https://twitter.com'], ['github', 'https://github.com'], ['youtube', 'https://youtube.com']].map(([platform, url]) => (
                              <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-800/80 border border-gray-700 hover:border-primary-500 hover:bg-primary-600 flex items-center justify-center text-gray-300 hover:text-white transition-all">
                                <SocialIcon platform={platform} />
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-8">
                        {activeCols.map((col, colIndex) => (
                          <div key={col.title || colIndex} className="space-y-4">
                            <h5 className="text-xs font-bold text-primary-400 uppercase tracking-widest">{col.title}</h5>
                            <ul className="space-y-3">
                              {col.links && col.links.map((link, linkIndex) => (
                                <li key={link.label || linkIndex}>
                                  <Link to={link.url || link.href || '/'} className="text-sm text-gray-400 hover:text-white transition-colors">
                                    {link.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-gray-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
                      <p>{footerCfg.copyright_text}</p>
                      <div className="flex items-center gap-4">
                        <Link to="/privacy" className="hover:text-white">Privacy Policy</Link>
                        <span>•</span>
                        <Link to="/terms" className="hover:text-white">Terms of Service</Link>
                        <span>•</span>
                        <Link to="/contact" className="hover:text-white">Support</Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VARIANT 4: MODERN ENTERPRISE (HIGH DENSITY 12-COLUMN GRID) */}
              {(footerCfg.variant === 'modern' || (!['custom_html', 'minimal', 'dark_luxe'].includes(footerCfg.variant))) && (
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-16">
                    {/* Left Col: Brand Info, Contact Pills & Socials */}
                    <div className="lg:col-span-4 space-y-6">
                      <Link to="/" className="flex items-center gap-3 group">
                        <BrandLogo size="md" />
                        <div className="flex flex-col">
                          <span className="font-extrabold text-xl tracking-tight text-white">{settings.company_name || 'HRMS Pro'}</span>
                          <span className="text-[10px] uppercase font-bold tracking-widest text-primary-400">Enterprise HCM Platform</span>
                        </div>
                      </Link>

                      <p className="text-sm text-gray-400 leading-relaxed">
                        {footerCfg.tagline}
                      </p>

                      {/* Contact Info Pills */}
                      <div className="space-y-2.5 text-xs text-gray-300 pt-1">
                        <div className="flex items-center gap-2.5 bg-gray-900/80 border border-gray-800 px-3.5 py-2 rounded-xl">
                          <svg className="w-4 h-4 text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <a href={`mailto:${settings.contact_email || 'hello@hrmspro.online'}`} className="hover:text-white transition-colors">
                            {settings.contact_email || 'hello@hrmspro.online'}
                          </a>
                        </div>
                        <div className="flex items-center gap-2.5 bg-gray-900/80 border border-gray-800 px-3.5 py-2 rounded-xl">
                          <svg className="w-4 h-4 text-primary-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.65l1.5 3.75a1 1 0 00.94.65H17a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h10z" />
                          </svg>
                          <span>{settings.contact_phone || '+1 (555) 123-4567'}</span>
                        </div>
                        <div className="flex items-center gap-2.5 bg-gray-900/80 border border-gray-800 px-3.5 py-2 rounded-xl">
                          <MapPinIcon className="w-4 h-4 text-primary-400 shrink-0" />
                          <span>{settings.contact_address || '100 Tech Lane, Suite 200, San Francisco, CA'}</span>
                        </div>
                      </div>

                      {footerCfg.show_social_links && (
                        <div className="flex items-center gap-3 pt-2">
                          {[['linkedin', 'https://linkedin.com'], ['twitter', 'https://twitter.com'], ['github', 'https://github.com'], ['youtube', 'https://youtube.com']].map(([platform, url]) => (
                            <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-gray-900 border border-gray-800 hover:bg-primary-600 flex items-center justify-center text-gray-400 hover:text-white transition-all">
                              <SocialIcon platform={platform} />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Col: 4 Category Links Grid */}
                    <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
                      {activeCols.map((col, colIndex) => (
                        <div key={col.title || colIndex} className="space-y-4">
                          <h5 className="text-xs font-bold text-white uppercase tracking-widest border-b border-gray-800 pb-2">{col.title}</h5>
                          <ul className="space-y-2.5">
                            {col.links && col.links.map((link, linkIndex) => (
                              <li key={link.label || linkIndex}>
                                <Link to={link.url || link.href || '/'} className="ws-footer-link text-xs font-medium text-gray-400 hover:text-white transition-colors inline-block py-0.5">
                                  {link.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {footerCfg.show_trust_badges && (
                    <div className="py-8 border-t border-gray-800/80">
                      <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-12">
                        {[
                          { label: t('footer.badge_soc2', 'SOC 2 Type II Certified'), icon: 'shield' },
                          { label: t('footer.badge_gdpr', 'GDPR Compliant'), icon: 'check' },
                          { label: t('footer.badge_iso', 'ISO 27001 Certified'), icon: 'shield' },
                          { label: '256-bit SSL Encrypted', icon: 'shield' },
                          { label: '99.99% Uptime SLA', icon: 'check' },
                        ].map((badge, i) => (
                          <div key={i} className="flex items-center gap-2">
                            {badge.icon === 'shield' ? (
                              <ShieldCheckIcon className="w-4 h-4 text-primary-400" />
                            ) : (
                              <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                            )}
                            <span className="text-xs text-gray-400 font-medium">{badge.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="py-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-gray-400">{footerCfg.copyright_text}</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-4 gap-y-2">
                      <Link to="/terms" className="text-xs text-gray-400 hover:text-white transition-colors">Terms & Conditions</Link>
                      <span className="text-gray-700">|</span>
                      <Link to="/privacy" className="text-xs text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
                      <span className="text-gray-700">|</span>
                      <Link to="/cancellation-refund" className="text-xs text-gray-400 hover:text-white transition-colors">Cancellation & Refund</Link>
                      <span className="text-gray-700">|</span>
                      <Link to="/shipping-policy" className="text-xs text-gray-400 hover:text-white transition-colors">Shipping Policy</Link>
                      <span className="text-gray-700">|</span>
                      <Link to="/pricing" className="text-xs text-gray-400 hover:text-white transition-colors">Pricing</Link>
                      <span className="text-gray-700">|</span>
                      <Link to="/contact" className="text-xs text-gray-400 hover:text-white transition-colors">Contact Us</Link>
                    </div>
                  </div>
                </div>
              )}
            </footer>
          </>
        );
      })()}
    </div>
  );
};

export default PublicLayout;
