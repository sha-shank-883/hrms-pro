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

export const WebsiteBuilderProvider = ({ children }) => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/website/global-settings/public');
      if (res.data.success && res.data.data) {
        const raw = res.data.data;
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
          custom_css: raw.custom_css || '',
          custom_js: raw.custom_js || '',
        };
        setSettings(prev => ({ ...prev, ...mapped }));
      } else {
        await fallbackFetch();
      }
    } catch {
      await fallbackFetch();
    } finally {
      setLoading(false);
    }
  }, []);

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
    if (settings.theme_mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme_mode]);

  const displayImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  return (
    <WebsiteBuilderContext.Provider value={{ settings, loading, displayImageUrl, refreshSettings: fetchSettings }}>
      {children}
    </WebsiteBuilderContext.Provider>
  );
};

export const useWebsiteBuilder = () => {
  const ctx = useContext(WebsiteBuilderContext);
  if (!ctx) throw new Error('useWebsiteBuilder must be used within a WebsiteBuilderProvider');
  return ctx;
};

export default WebsiteBuilderContext;
