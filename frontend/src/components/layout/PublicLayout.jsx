import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bars3Icon, XMarkIcon, ChevronDownIcon, ArrowRightIcon, ShieldCheckIcon, StarIcon, PlusIcon, MinusIcon, MapPinIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../context/ThemeContext';

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
  { title: 'Legal', links: [
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Terms of Service', url: '/terms' },
    { label: 'GDPR', url: '/privacy' },
    { label: 'SOC 2', url: '/privacy' },
    { label: 'Data Processing', url: '/privacy' },
  ]},
  { title: 'Support', links: [
    { label: 'Help Center', url: '/faq' },
    { label: 'Community', url: '#' },
    { label: 'Contact Support', url: '/contact' },
    { label: 'System Status', url: '#' },
  ]},
];

const PublicLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState({});
  const { dark, toggle: toggleTheme } = useTheme();
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
                      className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${isActive(link.url || link.href) ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
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
                className={`flex items-start gap-3 p-3 rounded-xl transition-all duration-200 ${isActive(child.url || child.href) ? 'bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
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
      return (
        <div key={item.label || item.id} className="relative"
          onMouseEnter={() => setOpenDropdown(item.label)}
          onMouseLeave={() => setOpenDropdown(null)}
        >
          <button
            onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
            className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
              openDropdown === item.label || getLinks(item).some(c => isActive(c.url || c.href))
                ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {item.label}
            <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ${openDropdown === item.label ? 'rotate-180' : ''}`} />
          </button>
          {openDropdown === item.label && renderDesktopMegaMenu(item)}
        </div>
      );
    }
    return (
      <Link key={item.label || item.id} to={item.url || item.href}
        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
          isActive(item.url || item.href)
            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
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
                      ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
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
            ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
        }`}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm'
          : 'bg-transparent'
      }`}>
        <nav className="max-w-7xl mx-auto flex items-center justify-between px-6 lg:px-8 h-20">
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
              H
            </div>
            <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">
              HRMS Pro
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1" ref={dropdownRef}>
            {navLinks.map(renderNavItem)}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
              title="Toggle theme"
            >
              {dark ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <Link to="/login" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-4 py-2">
              Sign In
            </Link>
            <Link to="/demo"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-sm shadow-indigo-500/20 hover:shadow-md hover:shadow-indigo-500/30 transition-all duration-200 hover:-translate-y-0.5 inline-flex items-center gap-2"
            >
              Get a Demo
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
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
                {navLinks.map(renderMobileNavItem)}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="pt-4 space-y-3 border-t border-gray-100 dark:border-gray-800 mt-4"
                >
                  <Link to="/login" className="block w-full text-center px-4 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 font-semibold text-sm rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    Sign In
                  </Link>
                  <Link to="/demo" className="block w-full text-center px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-colors">
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

      <div className="bg-gray-900 dark:bg-gray-950 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-300 font-medium">
              Stay ahead with HR insights. Get the latest guides and trends delivered weekly.
            </p>
            <form className="flex gap-2 w-full sm:w-auto" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your work email"
                className="px-4 py-2.5 rounded-xl text-sm bg-gray-800 border border-gray-700 text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
              />
              <button type="submit" className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-all shrink-0 shadow-sm">
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

<footer className="bg-gray-950 dark:bg-black text-gray-300">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12 py-16">
            <div className="sm:col-span-2 lg:col-span-2">
              <Link to="/" className="flex items-center gap-2.5 mb-5 group">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shadow-indigo-500/20 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-all duration-300">
                  H
                </div>
                <span className="font-bold text-xl text-white">HRMS Pro</span>
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed mb-6 max-w-md">
                Enterprise-grade HR management platform for global teams. Automate payroll, track attendance, manage performance, and empower your workforce with AI-driven insights across 150+ countries.
              </p>
              <div className="flex items-center gap-4 mb-6">
                {[['linkedin', 'https://linkedin.com/company/hrmspro', true], ['twitter', 'https://twitter.com/hrmspro', true], ['github', 'https://github.com/hrmspro', false], ['youtube', 'https://youtube.com/@hrmspro', true]].map(([platform, url, newTab]) => (
                  <a key={platform} href={url} target={newTab ? "_blank" : "_self"} rel={newTab ? "noopener noreferrer" : ""}
                    className="w-10 h-10 rounded-xl bg-gray-800 hover:bg-indigo-600 flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                    aria-label={platform}
                  >
                    <SocialIcon platform={platform} />
                  </a>
                ))}
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <a href="mailto:hello@hrmspro.online" className="text-gray-400 hover:text-white transition-colors">hello@hrmspro.online</a>
                </div>
                <div className="flex items-start gap-2">
                  <svg className="w-4 h-4 text-gray-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.65l1.5 3.75a1 1 0 00.94.65H17a2 2 0 012 2v7a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h10z" />
                  </svg>
                  <span className="text-gray-400">+1 (555) 123-4567</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPinIcon className="w-4 h-4 text-gray-500 mt-0.5" />
                  <span className="text-gray-400">100 Tech Lane, Suite 200, San Francisco, CA 94105</span>
                </div>
              </div>
            </div>

            {footerColumns.map((col, colIndex) => (
              <div key={col.title || colIndex}>
                <h5 className="text-xs font-semibold text-white uppercase tracking-widest mb-4">{col.title}</h5>
                <ul className="space-y-2.5">
                  {col.links && col.links.map((link, linkIndex) => (
                    <li key={link.label || linkIndex}>
                      <Link to={link.url || link.href || '/'} className="text-sm text-gray-400 hover:text-white transition-colors inline-block py-1">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="py-8 border-t border-gray-800">
            <div className="flex flex-wrap items-center justify-center gap-6 lg:gap-10">
              {[
                { label: 'SOC 2 Type II Certified', icon: 'shield' },
                { label: 'GDPR Compliant', icon: 'check' },
                { label: 'ISO 27001 Certified', icon: 'shield' },
              ].map((badge, i) => (
                <div key={i} className="flex items-center gap-2">
                  {badge.icon === 'shield' ? (
                    <ShieldCheckIcon className="w-4 h-4 text-indigo-400" />
                  ) : (
                    <svg className="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                  <span className="text-xs text-gray-400">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="py-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} HRMS Pro. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/privacy" className="text-xs text-gray-400 hover:text-white transition-colors">Privacy Policy</Link>
              <span className="text-gray-600">|</span>
              <Link to="/terms" className="text-xs text-gray-400 hover:text-white transition-colors">Terms of Service</Link>
              <span className="text-gray-600">|</span>
              <Link to="/faq" className="text-xs text-gray-400 hover:text-white transition-colors">FAQ</Link>
              <span className="text-gray-600">|</span>
              <Link to="/contact" className="text-xs text-gray-400 hover:text-white transition-colors">Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
