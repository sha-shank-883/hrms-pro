import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const WebsiteBuilderContext = createContext(null);

const API_BASE = (import.meta.env.VITE_API_URL || '').replace('/api', '');

const parseJSON = (val) => {
  if (!val) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
};

const defaultSettings = {
  primary_color: '#16a34a',
  theme_mode: 'light',
  font_family: 'Inter',
  logo_url: '',
  hero_image_url: '',
  header_links: [],
  footer_columns: [],
  sections: [],
  company_name: 'HRMS Pro',
  tagline: 'Modern HR management platform for growing businesses.',
  contact_email: 'hello@hrmspro.online',
  contact_phone: '+1 (555) 123-4567',
  contact_address: '100 Tech Lane, Suite 200, San Francisco, CA 94105',
  social_links: [],
  copyright_text: 'All rights reserved.',
  custom_css: '',
  custom_js: '',
  glassmorphism_enabled: true,
  primary_gradient: 'linear-gradient(to right, #16a34a, #15803d)',
  awards: [],
  badges: [],
};

const extractFromHeaderConfig = (cfg) => {
  if (!cfg) return [];
  const parsed = typeof cfg === 'string' ? parseJSON(cfg) : cfg;
  if (Array.isArray(parsed)) return parsed;
  if (parsed.links && Array.isArray(parsed.links)) return parsed.links;
  return [];
};

const extractFromFooterConfig = (cfg) => {
  if (!cfg) return [];
  const parsed = typeof cfg === 'string' ? parseJSON(cfg) : cfg;
  if (Array.isArray(parsed)) return parsed;
  if (parsed.columns && Array.isArray(parsed.columns)) return parsed.columns;
  return [];
};

const flattenParams = (parameters) => {
  const vars = {};
  if (!parameters || typeof parameters !== 'object') return vars;
  for (const [group, entries] of Object.entries(parameters)) {
    if (entries && typeof entries === 'object' && !Array.isArray(entries)) {
      for (const [key, value] of Object.entries(entries)) {
        if (value !== undefined && value !== null) vars[`--${group}-${key.replace(/_/g, '-')}`] = String(value);
      }
    } else if (entries !== undefined && entries !== null) {
      vars[`--${group}`] = String(entries);
    }
  }
  return vars;
};

export const WebsiteBuilderProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [labels, setLabels] = useState({});
  const [themeParams, setThemeParams] = useState({});
  const [loading, setLoading] = useState(true);

  const applyThemeVariables = useCallback((params) => {
    if (!params || Object.keys(params).length === 0) return;
    const root = document.documentElement;

    Object.entries(params).forEach(([key, value]) => root.style.setProperty(key, value));

    const primary = params['--colors-primary'] || '#6366f1';
    const primaryHover = params['--colors-primary-hover'] || '#4f46e5';
    const secondary = params['--colors-secondary'] || '#8b5cf6';
    const fontFamily = params['--typography-font-family'] || 'Inter, system-ui, sans-serif';

    root.style.setProperty('--primary-color', primary);
    root.style.setProperty('--primary-dark', primaryHover);
    root.style.setProperty('--primary-light', primary);
    root.style.setProperty('--primary-lighter', primary + '18');
    root.style.setProperty('--primary-darker', primaryHover);
    root.style.setProperty('--colors-primary', primary);
    root.style.setProperty('--colors-primary-hover', primaryHover);
    // Secondary color — used by from-secondary-500 / to-secondary-600 etc via Tailwind CSS vars
    root.style.setProperty('--secondary-color', secondary);
    root.style.setProperty('--secondary-dark', secondary);
    root.style.setProperty('--secondary-darker', secondary);
    root.style.setProperty('--secondary-light', secondary + '40');
    root.style.setProperty('--secondary-lighter', secondary + '18');
    root.style.setProperty('--colors-secondary', secondary);

    if (fontFamily) {
      root.style.fontFamily = fontFamily;
    }

    let overrideStyle = document.getElementById('ws-theme-override');
    if (!overrideStyle) {
      overrideStyle = document.createElement('style');
      overrideStyle.id = 'ws-theme-override';
      document.head.appendChild(overrideStyle);
    }

    overrideStyle.textContent = `
      :root {
        --colors-primary: ${primary} !important;
        --colors-primary-hover: ${primaryHover} !important;
        --colors-secondary: ${secondary} !important;
        --typography-font-family: ${fontFamily} !important;
        --primary-color: ${primary} !important;
        --primary-dark: ${primaryHover} !important;
        --primary-light: ${primary} !important;
        --secondary-color: ${secondary} !important;
        font-family: ${fontFamily} !important;
      }

      body {
        font-family: ${fontFamily} !important;
      }

      /* Always Enforce High-Contrast White Text on Filled Buttons */
      .text-white, .text-white * {
        color: #ffffff !important;
      }

      /* Primary Background Buttons, Badges & Icons (Normal State) */
      .bg-primary-600, .bg-primary-500, .bg-primary-700, .bg-primary-800,
      .bg-emerald-600, .bg-emerald-500, .bg-emerald-700,
      .bg-green-600, .bg-green-500, .bg-teal-600,
      .bg-blue-600, .bg-blue-500, .bg-secondary-600, .bg-violet-600,
      .btn-primary, button[type="submit"] {
        background-color: ${primary} !important;
        color: #ffffff !important;
      }

      .bg-primary-600 *, .bg-primary-500 *, .bg-primary-700 *,
      .bg-emerald-600 *, .bg-emerald-500 *,
      .bg-blue-600 *, .bg-secondary-600 *,
      .btn-primary *, button[type="submit"] * {
        color: #ffffff !important;
      }

      /* Hover Background Buttons */
      .hover\\:bg-primary-700:hover, .hover\\:bg-primary-600:hover, .hover\\:bg-primary-800:hover,
      .hover\\:bg-emerald-700:hover, .hover\\:bg-emerald-600:hover,
      .hover\\:bg-green-700:hover, .hover\\:bg-blue-700:hover, .hover\\:bg-secondary-700:hover {
        background-color: ${primaryHover} !important;
        color: #ffffff !important;
      }

      /* Light Tint Backgrounds & Badges (Normal State) */
      .bg-primary-50, .bg-primary-100, .bg-primary-500\\/10, .bg-primary-500\\/20, .bg-primary-600\\/10,
      .bg-emerald-50, .bg-emerald-100, .bg-emerald-500\\/10, .bg-emerald-500\\/20,
      .bg-green-50, .bg-green-100, .bg-blue-50, .bg-secondary-50 {
        background-color: ${primary}18 !important;
      }

      /* Primary Text & Icon Highlights (Only when NOT inside white text containers) */
      :not(.text-white) > .text-primary-600,
      :not(.text-white) > .text-primary-500,
      .text-primary-700, .text-primary-400,
      .text-emerald-600, .text-emerald-500, .text-emerald-700, .text-emerald-400,
      .text-green-600, .text-green-500, .text-teal-600,
      .text-blue-600, .text-blue-500, .text-secondary-600 {
        color: ${primary} !important;
      }

      /* Header Navigation Links & Active State */
      header nav a.ws-nav-link:hover,
      header nav button.ws-nav-link:hover,
      header nav a:hover,
      header nav button:hover,
      header a:hover,
      header button:hover,
      .lg\\:hidden nav a:hover,
      .lg\\:hidden nav button:hover {
        color: ${primaryHover} !important;
      }

      header nav .ws-nav-link-active,
      header nav a.ws-nav-link-active,
      header nav button.ws-nav-link-active,
      .ws-nav-link-active {
        color: ${primary} !important;
        background-color: ${primary}1f !important;
      }

      /* Mega Menu & Sub-navigation Links */
      header .animate-fade-in a:hover p,
      header .animate-fade-in a:hover {
        color: ${primaryHover} !important;
      }

      /* Footer Headers & Footer Links */
      footer h5, footer h4, .ws-footer-title {
        color: ${primary} !important;
      }

      footer a:hover,
      footer ul a:hover,
      footer .ws-footer-link:hover,
      footer p a:hover {
        color: ${primaryHover} !important;
      }

      /* Social Icons & Contact Icons in Footer */
      footer a.rounded-xl:hover {
        background-color: ${primaryHover} !important;
        color: #ffffff !important;
      }

      /* Header Logo Icon & Brand Accent */
      header .bg-gradient-to-br,
      footer .bg-gradient-to-br {
        background: linear-gradient(135deg, ${primary}, ${secondary}) !important;
      }

      /* Hover Text & Link Highlights */
      .hover\\:text-primary-600:hover, .hover\\:text-primary-500:hover, .hover\\:text-primary-400:hover,
      .hover\\:text-emerald-600:hover, .hover\\:text-emerald-500:hover, .hover\\:text-emerald-400:hover,
      .hover\\:text-green-600:hover, .hover\\:text-blue-600:hover, .hover\\:text-secondary-600:hover {
        color: ${primaryHover} !important;
      }

      /* Border Colors (Normal State & Hover State) */
      .border-primary-600, .border-primary-500, .border-primary-400,
      .border-emerald-600, .border-emerald-500, .border-emerald-400,
      .border-green-600, .border-blue-600, .border-secondary-600,
      .hover\\:border-primary-500:hover, .hover\\:border-primary-600:hover,
      .hover\\:border-emerald-500:hover, .hover\\:border-emerald-600:hover {
        border-color: ${primary} !important;
      }

      .border-primary-100, .border-primary-200, .border-primary-300,
      .border-emerald-100, .border-emerald-200, .border-emerald-300 {
        border-color: ${primary}35 !important;
      }

      /* Gradients — remaining un-migrated Tailwind hardcoded classes */
      .from-primary-600, .from-primary-700,
      .from-emerald-600, .from-emerald-500, .from-emerald-700,
      .from-green-600, .from-blue-600, .from-secondary-600 {
        --tw-gradient-from: ${primary} var(--tw-gradient-from-position) !important;
        --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to) !important;
      }

      .to-primary-800, .to-primary-900,
      .to-emerald-700, .to-emerald-800, .to-green-600, .to-blue-600 {
        --tw-gradient-to: ${secondary} var(--tw-gradient-to-position) !important;
      }

      .via-primary-600, .via-emerald-600 {
        --tw-gradient-via: ${secondary} var(--tw-gradient-via-position) !important;
      }

      /* Input Focus Rings */
      .focus\\:ring-primary-500:focus, .focus\\:ring-primary-600:focus, .ring-primary-500 {
        --tw-ring-color: ${primary} !important;
      }

      /* Button Glow & Drop Shadows */
      .shadow-primary-500\\/20, .shadow-primary-500\\/25, .shadow-primary-500\\/30, .shadow-primary-600\\/20 {
        box-shadow: 0 10px 25px -5px ${primary}40 !important;
      }
    `;
  }, []);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const [gsRes, themeRes, labelRes] = await Promise.all([
        api.get('/website/global-settings/public'),
        api.get('/website/themes/active'),
        api.get('/website/labels/public'),
      ]);

      if (gsRes.data.success && gsRes.data.data) {
        const raw = gsRes.data.data;
        const mapped = {
          ...defaultSettings,
          company_name: raw.company_name || defaultSettings.company_name,
          tagline: raw.tagline || defaultSettings.tagline,
          logo_url: raw.logo_url || '',
          favicon_url: raw.favicon_url || '',
          primary_color: raw.primary_color || defaultSettings.primary_color,
          secondary_color: raw.secondary_color || '#8b5cf6',
          font_family: raw.font_family || defaultSettings.font_family,
          theme_mode: raw.theme_mode || defaultSettings.theme_mode,
          contact_email: raw.contact_email || defaultSettings.contact_email,
          contact_phone: raw.contact_phone || defaultSettings.contact_phone,
          contact_address: raw.contact_address || defaultSettings.contact_address,
          social_links: parseJSON(raw.social_links) || [],
          header_links: extractFromHeaderConfig(raw.header_config),
          footer_columns: extractFromFooterConfig(raw.footer_config),
          footer_config: raw.footer_config,
          header_config: raw.header_config,
          custom_css: raw.custom_css || '',
          custom_js: raw.custom_js || '',
        };
        setSettings(prev => ({ ...prev, ...mapped }));
      } else {
        await fallbackFetch();
      }

      if (themeRes.data?.success && themeRes.data?.data?.parameters) {
        const vars = flattenParams(themeRes.data.data.parameters);
        setThemeParams(vars);
        applyThemeVariables(vars);
      }

      if (labelRes.data?.success && labelRes.data?.data) {
        setLabels(labelRes.data.data);
      }
    } catch {
      await fallbackFetch();
    } finally {
      setLoading(false);
    }
  }, [applyThemeVariables]);

  const fallbackFetch = useCallback(async () => {
    try {
      const res = await api.get('/website-settings');
      if (res.data.success && res.data.data) {
        const raw = res.data.data;
        raw.header_links = parseJSON(raw.header_links) || [];
        raw.footer_columns = parseJSON(raw.footer_columns) || [];
        raw.sections = parseJSON(raw.sections) || [];
        raw.social_links = parseJSON(raw.social_links) || [];
        raw.awards = parseJSON(raw.awards) || [];
        raw.badges = parseJSON(raw.badges) || [];
        raw.custom_css = raw.custom_css || '';
        raw.custom_js = raw.custom_js || '';
        setSettings(prev => ({ ...prev, ...raw }));
      }
    } catch { }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    if (!settings.custom_css) {
      const existing = document.getElementById('ws-global-css');
      if (existing) existing.remove();
      return;
    }
    let styleTag = document.getElementById('ws-global-css');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'ws-global-css';
      document.head.appendChild(styleTag);
    }
    styleTag.textContent = settings.custom_css;
    return () => {
      const tag = document.getElementById('ws-global-css');
      if (tag) tag.remove();
    };
  }, [settings.custom_css]);

  useEffect(() => {
    if (localStorage.getItem('theme')) return;
    if (settings.theme_mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (settings.theme_mode === 'light') {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme_mode]);

  const displayImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const t = useCallback((key, fallback) => {
    if (labels[key] !== undefined) return labels[key];
    return fallback ?? key;
  }, [labels]);

  return (
    <WebsiteBuilderContext.Provider value={{ settings, labels, themeParams, loading, displayImageUrl, refreshSettings: fetchSettings, t }}>
      {children}
    </WebsiteBuilderContext.Provider>
  );
};

export const useWebsiteBuilder = () => {
  const ctx = useContext(WebsiteBuilderContext);
  if (!ctx) {
    return {
      settings: defaultSettings,
      labels: {},
      themeParams: {},
      loading: false,
      displayImageUrl: (url) => url || null,
      refreshSettings: () => {},
      t: (key, fallback) => fallback ?? key,
    };
  }
  return ctx;
};

export default WebsiteBuilderContext;
