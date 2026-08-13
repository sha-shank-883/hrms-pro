import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRightIcon, SparklesIcon, ShieldCheckIcon,
  GlobeAltIcon, UserGroupIcon, HeartIcon,
} from '@heroicons/react/24/outline';
import { AnimatedSection, AnimatedItem } from '../../components/common/AnimatedSection';
import SEO from '../../components/common/SEO';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const values = [
  { icon: HeartIcon, title: 'People First', desc: 'We build technology that empowers people, not replaces them. Every feature starts with the question: how does this make work better for humans?' },
  { icon: SparklesIcon, title: 'Innovation at Scale', desc: 'AI-native architecture means we continuously evolve. Our platform learns, adapts, and improves — delivering enterprise-grade innovation without disruption.' },
  { icon: ShieldCheckIcon, title: 'Trust & Security', desc: 'Enterprise data deserves enterprise protection. SOC 2, GDPR, ISO 27001 — security is not a feature, it is the foundation.' },
  { icon: GlobeAltIcon, title: 'Global by Design', desc: 'Built from day one for multi-country, multi-entity, multi-language enterprise operations. Local compliance, global reach.' },
  { icon: UserGroupIcon, title: 'Customer Obsession', desc: 'Our customers are our partners. Dedicated CSMs, rapid response, and a product roadmap shaped by real-world feedback.' },
];

const team = [
  { name: 'Alex Rivera', role: 'CEO & Co-Founder', bio: 'HR technology leader with extensive experience in building workforce management platforms for mid-market and enterprise teams.', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=150&h=150' },
  { name: 'Dr. Priya Sharma', role: 'CTO & Co-Founder', bio: 'Full-stack architect specializing in multi-tenant SaaS platforms, real-time analytics, and biometric device integrations.', image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150' },
  { name: 'James Mitchell', role: 'CPO', bio: 'Product leader focused on self-service HR workflows, payroll automation, and mobile-first employee experiences.', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=150&h=150' },
  { name: 'Sarah Okafor', role: 'Head of Customer Success', bio: 'Customer success specialist helping organizations streamline onboarding, adoption, and HR process transformation.', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150&h=150' },
];

const milestones = [
  { year: '2020', event: 'HRMS Pro founded with a vision to build a modern, unified HR platform for growing organizations.' },
  { year: '2021', event: 'Core HR and Attendance modules launched. First customers onboarded with biometric device integration.' },
  { year: '2022', event: 'Payroll automation and PDF payslip engine released. Expanded multi-company and multi-branch support.' },
  { year: '2023', event: 'Recruitment ATS, onboarding workflows, and performance management launched.' },
  { year: '2024', event: 'Website Builder, custom pages, and dynamic public site management added. REST API and webhook support released.' },
  { year: '2025', event: 'Analytics dashboards, asset management, and advanced reporting overhauled. Mobile-optimized employee self-service launched.' },
];

const About = () => {
  const { t } = useWebsiteBuilder();
  return (
    <div>
      <SEO
        title="About Us"
        description="Learn about HRMS Pro, our mission, leadership team, and values. We build AI-powered HR technology for global enterprises."
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'AboutPage',
          name: 'About HRMS Pro',
          description: 'HRMS Pro is on a mission to transform how enterprises manage their people.',
          publisher: { '@type': 'Organization', name: 'HRMS Pro' },
        }}
      />
      {/* ────── Hero ────── */}
      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28 overflow-hidden bg-gradient-to-b from-gray-50 via-white to-white dark:from-gray-950 dark:via-gray-900 dark:to-gray-900">
        <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center relative">
          <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">About Us</span>
            <h1 className="mt-4 text-5xl lg:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[0.95] mb-6">
              {t('about.title', 'We believe work should work for everyone')}
            </h1>
            <p className="text-lg lg:text-xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
              {t('about.subtitle', 'HRMS Pro is on a mission to transform how enterprises manage their most valuable asset — their people. We build AI-powered HR technology that is global, intelligent, and human-centric.')}
            </p>
            <Link to="/demo" className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-primary-500/25 transition-all">
              {t('about.cta_primary', 'Get a Free Demo')} <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ────── Stats ────── */}
      <section className="py-16 bg-primary-600 dark:bg-primary-700">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: 'Multi-Tenant', label: 'SaaS Architecture' },
              { value: 'Full-Suite', label: 'HR + Payroll + ATS' },
              { value: 'Biometric', label: 'Attendance Integration' },
              { value: '99.9%', label: 'Uptime SLA' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl lg:text-4xl font-black text-white">{s.value}</p>
                <p className="text-sm text-primary-200 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Story ────── */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Our Story</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Built by HR leaders, for HR leaders
            </h2>
          </AnimatedSection>

          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-500 dark:text-gray-400 space-y-6">
            <p>
              HRMS Pro was built to solve a real problem: growing businesses outgrow spreadsheets
              and disconnected tools, but legacy HR systems are too complex and too expensive.
              We set out to build a modern, unified HRMS that any organization can deploy quickly
              and customize fully.
            </p>
            <p>
              Our platform covers the entire employee lifecycle — from recruitment and onboarding 
              to payroll, attendance, performance, and asset management — all in a single system
              with a shared data model. No integrations tax. No sync delays. No data silos.
            </p>
            <p>
              Today, HRMS Pro is trusted by organizations to automate their HR operations,
              reduce administrative burden, and give leadership real-time visibility into their
              workforce. Our team continues to build, iterate, and improve — driven by customer
              feedback and a genuine belief that HR software should work for people, not against them.
            </p>
          </div>
        </div>
      </section>

      {/* ────── Values ────── */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Our Values</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              What drives us
            </h2>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((v, idx) => (
              <AnimatedItem key={v.title} delay={idx * 0.08}>
                <div className="h-full p-8 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl hover:shadow-lg transition-all duration-300">
                  <v.icon className="w-8 h-8 text-primary-600 dark:text-primary-500 mb-5" />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{v.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{v.desc}</p>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── Timeline ────── */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Milestones</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Our journey
            </h2>
          </AnimatedSection>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100 dark:bg-gray-800" />
            <div className="space-y-10">
              {milestones.map((m, idx) => (
                <AnimatedItem key={m.year} delay={idx * 0.08}>
                  <div className="relative pl-12">
                    <div className="absolute left-2.5 top-1.5 w-3 h-3 rounded-full bg-primary-600 dark:bg-primary-400 border-2 border-white dark:border-gray-950" />
                    <span className="text-xs font-bold text-primary-600 dark:text-primary-500">{m.year}</span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{m.event}</p>
                  </div>
                </AnimatedItem>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ────── Leadership ────── */}
      <section className="py-24 lg:py-32 bg-gray-50 dark:bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <AnimatedSection className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-semibold text-primary-600 dark:text-primary-500 uppercase tracking-widest">Leadership</span>
            <h2 className="mt-4 text-4xl lg:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Meet the team
            </h2>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((m, idx) => (
              <AnimatedItem key={m.name} delay={idx * 0.1}>
                <div className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl text-center hover:shadow-lg transition-all">
                  {m.image ? (
                    <img
                      className="w-16 h-16 rounded-full object-cover mx-auto mb-4 border border-primary-100 dark:border-primary-500/20"
                      src={m.image}
                      alt={m.name}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center mx-auto mb-4">
                      <span className="text-xl font-bold text-primary-600 dark:text-primary-500">{m.name.split(' ').map(n => n[0]).join('')}</span>
                    </div>
                  )}
                  <h4 className="font-bold text-gray-900 dark:text-white text-sm">{m.name}</h4>
                  <p className="text-xs text-primary-600 dark:text-primary-500 font-medium mt-0.5">{m.role}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{m.bio}</p>
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* ────── CTA ────── */}
      <section className="py-24 lg:py-32 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="relative overflow-hidden bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 dark:from-primary-700 dark:via-primary-800 dark:to-secondary-900 rounded-[2.5rem] p-10 lg:p-20 text-center">
            <div className="relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl lg:text-5xl font-black text-white tracking-tight mb-6">
                Join us in shaping the future of work
              </h2>
              <p className="text-lg text-primary-200 mb-10">
                Explore career opportunities or get a demo of the platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/demo" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold text-sm rounded-xl hover:bg-primary-50 transition-all shadow-xl">
                  Get a Demo <ArrowRightIcon className="w-4 h-4" />
                </Link>
                <Link to="/contact" className="inline-flex items-center gap-2 px-8 py-4 border border-white/20 text-white font-semibold text-sm rounded-xl hover:bg-white/10 transition-all">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
