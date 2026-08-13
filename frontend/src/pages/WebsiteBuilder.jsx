import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useWebsiteBuilder } from '../contexts/WebsiteBuilderContext';
import {
  Square3Stack3DIcon,
  DocumentTextIcon,
  SwatchIcon,
  LanguageIcon,
  Cog6ToothIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CheckCircleIcon,
  CheckIcon,
  PhotoIcon,
  SparklesIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  Bars3Icon,
  RectangleStackIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline';

const SECTION_TYPES = [
  { type: 'hero', label: 'Hero Section', desc: 'Main headline, subtitle, primary/secondary CTAs, image/badge' },
  { type: 'features', label: 'Features Grid', desc: 'Grid of feature cards with icons and descriptions' },
  { type: 'pricing', label: 'Pricing Tables', desc: 'Subscription pricing tiers, feature checklists, and buy buttons' },
  { type: 'testimonials', label: 'Testimonials / Reviews', desc: 'Customer quotes, avatar, role, rating stars' },
  { type: 'faq', label: 'FAQ Accordion', desc: 'Frequently asked questions with expandable answers' },
  { type: 'stats', label: 'Statistics Bar', desc: 'Key metrics counter, growth numbers, labels' },
  { type: 'team', label: 'Team Members', desc: 'Leadership profiles, avatars, roles, social links' },
  { type: 'gallery', label: 'Image Gallery', desc: 'Grid/carousel of project or office photos' },
  { type: 'contact_form', label: 'Contact Form', desc: 'Direct message submission form with contact details' },
  { type: 'video', label: 'Video Showcase', desc: 'Embedded video player with title and caption' },
  { type: 'logos', label: 'Client / Press Logos', desc: 'Logo strip of trusted companies or press coverage' },
  { type: 'timeline', label: 'Timeline / Steps', desc: 'Step-by-step process or company history milestone timeline' },
  { type: 'banner', label: 'Announcement Banner', desc: 'Highlighted alert bar or promo banner' },
  { type: 'custom_html', label: 'Custom HTML/Embed', desc: 'Raw HTML block for third-party embeds or widgets' },
];

const PRESET_THEMES = [
  { slug: 'indigo-pro', name: 'Indigo Pro', primary: '#6366f1', secondary: '#8b5cf6', font: 'Inter', desc: 'Modern indigo & violet gradient, rounded cards, sleek SaaS vibe.' },
  { slug: 'emerald-growth', name: 'Emerald Growth', primary: '#10b981', secondary: '#06b6d4', font: 'Outfit', desc: 'Fresh emerald green, bold contrast, dark navigation sidebar.' },
  { slug: 'ocean-trust', name: 'Ocean Trust', primary: '#2563eb', secondary: '#0ea5e9', font: 'Poppins', desc: 'Professional corporate blue, clean geometry, enterprise feel.' },
  { slug: 'midnight-luxe', name: 'Midnight Luxe', primary: '#d4af37', secondary: '#e2b93b', font: 'Playfair Display', desc: 'Dark mode luxury, gold/amber accents, glassmorphism card surfaces.' },
  { slug: 'minimal-stone', name: 'Minimal Stone', primary: '#18181b', secondary: '#3f3f46', font: 'Plus Jakarta Sans', desc: 'Monochrome high-craft minimalism, sharp corners, hairline borders.' },
  { slug: 'sunset-energy', name: 'Sunset Energy', primary: '#f43f5e', secondary: '#fb923c', font: 'Inter', desc: 'Warm orange & rose energy, high conversion CTA highlights.' },
];

const FONT_OPTIONS = [
  { label: 'Inter (Clean Modern)', value: 'Inter, system-ui, -apple-system, sans-serif' },
  { label: 'Outfit (SaaS Display)', value: 'Outfit, system-ui, sans-serif' },
  { label: 'Poppins (Geometric & Friendly)', value: 'Poppins, system-ui, sans-serif' },
  { label: 'Plus Jakarta Sans (Tech Premium)', value: 'Plus Jakarta Sans, system-ui, sans-serif' },
  { label: 'Roboto (Universal Clean)', value: 'Roboto, system-ui, sans-serif' },
  { label: 'Playfair Display (Editorial Luxe)', value: 'Playfair Display, Georgia, serif' },
];

const DEFAULT_HEADER_LINKS = [
  { label: 'Platform', url: '/features' },
  { label: 'Pricing', url: '/pricing' },
  { label: 'About', url: '/about' },
  { label: 'Blog', url: '/blog' },
  { label: 'Contact', url: '/contact' },
];

const DEFAULT_FOOTER_COLUMNS = [
  { title: 'Platform', links: [{ label: 'Features', url: '/features' }, { label: 'Pricing', url: '/pricing' }, { label: 'Demo', url: '/demo' }] },
  { title: 'Resources', links: [{ label: 'Blog', url: '/blog' }, { label: 'FAQ', url: '/faq' }, { label: 'Resources', url: '/resources' }] },
  { title: 'Company', links: [{ label: 'About Us', url: '/about' }, { label: 'Contact', url: '/contact' }] },
  { title: 'Legal', links: [{ label: 'Privacy Policy', url: '/privacy' }, { label: 'Terms of Service', url: '/terms' }] },
];

const WebsiteBuilder = () => {
  const { refreshSettings } = useWebsiteBuilder();
  const [activeTab, setActiveTab] = useState('pages');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Data states
  const [pages, setPages] = useState([]);
  const [selectedPageId, setSelectedPageId] = useState(null);
  const [sections, setSections] = useState([]);
  const [themes, setThemes] = useState([]);
  const [activeThemeId, setActiveThemeId] = useState(null);
  const [labels, setLabels] = useState([]);
  const [mediaList, setMediaList] = useState([]);
  const [globalSettings, setGlobalSettings] = useState({
    company_name: 'HRMS Pro',
    tagline: 'Modern HR management platform',
    contact_email: 'hello@hrmspro.online',
    contact_phone: '+1 (555) 123-4567',
    contact_address: '100 Tech Lane, Suite 200, San Francisco, CA 94105',
    primary_color: '#6366f1',
    secondary_color: '#8b5cf6',
    custom_css: '',
    custom_js: '',
    header_links: DEFAULT_HEADER_LINKS,
    footer_columns: DEFAULT_FOOTER_COLUMNS,
  });

  // Modal & Visual Builder States
  const [showPageModal, setShowPageModal] = useState(false);
  const [pageForm, setPageForm] = useState({ title: '', slug: '', meta_title: '', meta_description: '', is_published: true, is_homepage: false });
  const [editingPageId, setEditingPageId] = useState(null);

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [sectionForm, setSectionForm] = useState({
    section_type: 'hero',
    title: '',
    subtitle: '',
    is_visible: true,
    // Visual Section Structured Fields
    badge: 'Now Available — AI-Native HCM Platform',
    cta_primary_text: 'Get a Free Demo',
    cta_primary_url: '/demo',
    cta_secondary_text: 'Watch Overview',
    cta_secondary_url: '#how-it-works',
    image_url: '',
    items_list: [], // Array for features, pricing tiers, FAQs, team members, stats
    custom_raw_json: '',
    use_raw_json: false,
  });

  // Header & Footer Editor States
  const [headerLinks, setHeaderLinks] = useState(DEFAULT_HEADER_LINKS);
  const [footerColumns, setFooterColumns] = useState(DEFAULT_FOOTER_COLUMNS);

  // Labels Dictionary States
  const [labelFilterNS, setLabelFilterNS] = useState('all');
  const [labelSearch, setLabelSearch] = useState('');
  const [modifiedLabels, setModifiedLabels] = useState({});

  // Dynamic Theme Customizer States
  const [customThemeColors, setCustomThemeColors] = useState({
    primary: '#6366f1',
    primary_hover: '#4f46e5',
    secondary: '#8b5cf6',
    font_family: 'Inter, sans-serif',
  });

  // Dynamic Footer Redesign States
  const [footerDesign, setFooterDesign] = useState({
    variant: 'modern',
    tagline: 'Enterprise-grade HR management platform for global teams.',
    copyright_text: '© 2026 HRMS Pro Inc. All rights reserved.',
    show_newsletter: true,
    show_social_links: true,
    show_trust_badges: true,
    custom_html: `<div class="py-12 border-t border-gray-800 text-center space-y-4">
  <h3 class="text-xl font-bold text-white">HRMS Pro — Custom Footer Studio</h3>
  <p class="text-sm text-gray-400 max-w-md mx-auto">Build any layout using standard HTML & Tailwind CSS classes directly from admin!</p>
  <div class="flex items-center justify-center gap-6 text-xs text-gray-400 pt-2">
    <a href="/features" class="hover:text-primary-400">Features</a>
    <a href="/pricing" class="hover:text-primary-400">Pricing</a>
    <a href="/contact" class="hover:text-primary-400">Contact Us</a>
  </div>
</div>`,
  });

  const showNotification = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ───── FETCH APIS ─────

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/website/pages');
      if (res.data?.success) {
        setPages(res.data.data);
        if (res.data.data.length > 0 && !selectedPageId) {
          setSelectedPageId(res.data.data[0].id);
        }
      }
    } catch {
      showNotification('Failed to load pages', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedPageId]);

  const fetchSections = useCallback(async (pageId) => {
    if (!pageId) return;
    try {
      setLoading(true);
      const res = await api.get(`/website/pages/${pageId}/sections`);
      if (res.data?.success) setSections(res.data.data);
    } catch {
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchThemes = useCallback(async () => {
    try {
      const res = await api.get('/website/themes');
      if (res.data?.success) {
        setThemes(res.data.data);
        const active = res.data.data.find(t => t.is_active);
        if (active) setActiveThemeId(active.id);
      }
    } catch {}
  }, []);

  const fetchLabels = useCallback(async () => {
    try {
      const res = await api.get('/website/labels');
      if (res.data?.success) setLabels(res.data.data);
    } catch {}
  }, []);

  const fetchGlobalSettings = useCallback(async () => {
    try {
      const res = await api.get('/website/global-settings');
      if (res.data?.success && res.data?.data) {
        const data = res.data.data;
        setGlobalSettings(prev => ({ ...prev, ...data }));
        if (data.header_links && Array.isArray(data.header_links) && data.header_links.length > 0) {
          setHeaderLinks(data.header_links);
        }
        if (data.footer_columns && Array.isArray(data.footer_columns) && data.footer_columns.length > 0) {
          setFooterColumns(data.footer_columns);
        }
        if (data.footer_config) {
          try {
            const parsedConfig = typeof data.footer_config === 'string' ? JSON.parse(data.footer_config) : data.footer_config;
            if (parsedConfig && typeof parsedConfig === 'object') {
              setFooterDesign(prev => ({
                ...prev,
                variant: parsedConfig.variant || 'modern',
                tagline: parsedConfig.tagline || prev.tagline,
                copyright_text: parsedConfig.copyright_text || prev.copyright_text,
                show_newsletter: parsedConfig.show_newsletter !== false,
                show_social_links: parsedConfig.show_social_links !== false,
                show_trust_badges: parsedConfig.show_trust_badges !== false,
                custom_html: parsedConfig.custom_html || prev.custom_html,
              }));
              if (parsedConfig.columns && Array.isArray(parsedConfig.columns) && parsedConfig.columns.length > 0) {
                setFooterColumns(parsedConfig.columns);
              }
            }
          } catch {}
        }
      }
    } catch {}
  }, []);

  const fetchMedia = useCallback(async () => {
    try {
      const res = await api.get('/website/media');
      if (res.data?.success) setMediaList(res.data.data);
    } catch {}
  }, []);

  useEffect(() => {
    fetchPages();
    fetchThemes();
    fetchLabels();
    fetchGlobalSettings();
    fetchMedia();
  }, []);

  useEffect(() => {
    if (selectedPageId) {
      fetchSections(selectedPageId);
    }
  }, [selectedPageId, fetchSections]);

  // ───── PAGES ─────

  const handleSavePage = async (e) => {
    e.preventDefault();
    try {
      if (editingPageId) {
        await api.put(`/website/pages/${editingPageId}`, pageForm);
        showNotification('Page updated successfully');
      } else {
        await api.post('/website/pages', pageForm);
        showNotification('New page created');
      }
      setShowPageModal(false);
      setEditingPageId(null);
      setPageForm({ title: '', slug: '', meta_title: '', meta_description: '', is_published: true, is_homepage: false });
      fetchPages();
      refreshSettings();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving page', 'error');
    }
  };

  const handleDeletePage = async (id) => {
    if (!window.confirm('Delete this page?')) return;
    try {
      await api.delete(`/website/pages/${id}`);
      showNotification('Page deleted');
      if (selectedPageId === id) setSelectedPageId(null);
      fetchPages();
      refreshSettings();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to delete page', 'error');
    }
  };

  // ───── VISUAL SECTION BUILDER ─────

  const openSectionModalForEdit = (sec) => {
    setEditingSectionId(sec.id);
    const cfg = sec.settings || {};
    setSectionForm({
      section_type: sec.section_type || 'hero',
      title: sec.title || '',
      subtitle: sec.subtitle || '',
      is_visible: sec.is_visible !== false,
      badge: cfg.badge || cfg.announcement || '',
      cta_primary_text: cfg.cta_primary_text || cfg.cta_text || 'Get Started',
      cta_primary_url: cfg.cta_primary_url || cfg.cta_link || '/demo',
      cta_secondary_text: cfg.cta_secondary_text || 'Learn More',
      cta_secondary_url: cfg.cta_secondary_url || '/features',
      image_url: cfg.image_url || cfg.video_url || '',
      items_list: Array.isArray(cfg.items) ? cfg.items : Array.isArray(cfg.features) ? cfg.features : Array.isArray(cfg.plans) ? cfg.plans : Array.isArray(cfg.faqs) ? cfg.faqs : [],
      custom_raw_json: JSON.stringify(cfg, null, 2),
      use_raw_json: false,
    });
    setShowSectionModal(true);
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      let settingsPayload = {};

      if (sectionForm.use_raw_json) {
        try {
          settingsPayload = JSON.parse(sectionForm.custom_raw_json);
        } catch {
          showNotification('Custom JSON is invalid syntax', 'error');
          return;
        }
      } else {
        settingsPayload = {
          badge: sectionForm.badge,
          cta_primary_text: sectionForm.cta_primary_text,
          cta_primary_url: sectionForm.cta_primary_url,
          cta_secondary_text: sectionForm.cta_secondary_text,
          cta_secondary_url: sectionForm.cta_secondary_url,
          image_url: sectionForm.image_url,
          items: sectionForm.items_list,
        };
      }

      const payload = {
        section_type: sectionForm.section_type,
        title: sectionForm.title,
        subtitle: sectionForm.subtitle,
        settings: settingsPayload,
        is_visible: sectionForm.is_visible,
      };

      if (editingSectionId) {
        await api.put(`/website/sections/${editingSectionId}`, payload);
        showNotification('Section updated');
      } else {
        await api.post(`/website/pages/${selectedPageId}/sections`, payload);
        showNotification('Section added to page');
      }
      setShowSectionModal(false);
      setEditingSectionId(null);
      fetchSections(selectedPageId);
      refreshSettings();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error saving section', 'error');
    }
  };

  const handleMoveSection = async (index, direction) => {
    const newSections = [...sections];
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newSections.length) return;
    const temp = newSections[index];
    newSections[index] = newSections[targetIdx];
    newSections[targetIdx] = temp;

    setSections(newSections);
    const sectionIds = newSections.map(s => s.id);
    try {
      await api.put(`/website/sections/reorder/${selectedPageId}`, { sectionIds });
      showNotification('Section sequence updated');
      refreshSettings();
    } catch {
      fetchSections(selectedPageId);
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm('Delete section?')) return;
    try {
      await api.delete(`/website/sections/${id}`);
      showNotification('Section deleted');
      fetchSections(selectedPageId);
      refreshSettings();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to delete section', 'error');
    }
  };

  // Section Dynamic Items Manager (Add Item / Remove Item in Modal)
  const handleAddSectionItem = () => {
    setSectionForm(prev => ({
      ...prev,
      items_list: [...prev.items_list, { title: 'New Item', desc: 'Description of item', icon: 'SparklesIcon', value: '100+', name: 'Starter Plan', price: '$29' }]
    }));
  };

  const handleUpdateSectionItem = (index, field, val) => {
    setSectionForm(prev => {
      const updated = [...prev.items_list];
      updated[index] = { ...updated[index], [field]: val };
      return { ...prev, items_list: updated };
    });
  };

  const handleRemoveSectionItem = (index) => {
    setSectionForm(prev => ({
      ...prev,
      items_list: prev.items_list.filter((_, i) => i !== index)
    }));
  };

  // ───── HEADER & FOOTER BUILDERS ─────

  const handleAddHeaderLink = () => {
    setHeaderLinks([...headerLinks, { label: 'New Link', url: '/features' }]);
  };

  const handleHeaderLinkChange = (index, field, val) => {
    const updated = [...headerLinks];
    updated[index][field] = val;
    setHeaderLinks(updated);
  };

  const handleRemoveHeaderLink = (index) => {
    setHeaderLinks(headerLinks.filter((_, i) => i !== index));
  };

  const handleAddFooterColumn = () => {
    setFooterColumns([...footerColumns, { title: 'New Column', links: [{ label: 'Link 1', url: '/' }] }]);
  };

  const handleFooterColumnTitleChange = (colIdx, val) => {
    const updated = [...footerColumns];
    updated[colIdx].title = val;
    setFooterColumns(updated);
  };

  const handleAddFooterLink = (colIdx) => {
    const updated = [...footerColumns];
    updated[colIdx].links.push({ label: 'New Link', url: '/' });
    setFooterColumns(updated);
  };

  const handleFooterLinkChange = (colIdx, linkIdx, field, val) => {
    const updated = [...footerColumns];
    updated[colIdx].links[linkIdx][field] = val;
    setFooterColumns(updated);
  };

  const handleRemoveFooterLink = (colIdx, linkIdx) => {
    const updated = [...footerColumns];
    updated[colIdx].links = updated[colIdx].links.filter((_, i) => i !== linkIdx);
    setFooterColumns(updated);
  };

  const handleRemoveFooterColumn = (colIdx) => {
    setFooterColumns(footerColumns.filter((_, i) => i !== colIdx));
  };

  const handleSaveNavAndFooter = async () => {
    try {
      const fullFooterConfig = {
        ...footerDesign,
        columns: footerColumns,
      };
      const payload = {
        ...globalSettings,
        header_config: JSON.stringify(headerLinks),
        footer_config: JSON.stringify(fullFooterConfig),
      };
      await api.put('/website/global-settings', payload);
      showNotification('Header & Footer navigation & design saved live!');
      refreshSettings();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to save footer navigation', 'error');
    }
  };

  // ───── THEMES & DESIGN TOKENS ─────

  useEffect(() => {
    if (themes && activeThemeId) {
      const active = themes.find(t => t.id === activeThemeId);
      if (active && active.parameters) {
        const colors = active.parameters.colors || {};
        const typography = active.parameters.typography || {};
        setCustomThemeColors({
          primary: colors.primary || '#6366f1',
          primary_hover: colors.primary_hover || '#4f46e5',
          secondary: colors.secondary || '#8b5cf6',
          font_family: typography.font_family || 'Inter, sans-serif',
        });
      }
    }
  }, [activeThemeId, themes]);

  const handleActivateTheme = async (themeId) => {
    try {
      await api.post(`/website/themes/${themeId}/activate`);
      setActiveThemeId(themeId);
      fetchThemes();
      showNotification('Theme activated! Public site refreshed.');
      refreshSettings();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to activate theme', 'error');
    }
  };

  const handleSaveCustomThemeColors = async () => {
    if (!activeThemeId) return;
    const currentTheme = themes.find(t => t.id === activeThemeId);
    try {
      const updatedParams = {
        ...(currentTheme?.parameters || {}),
        colors: {
          ...(currentTheme?.parameters?.colors || {}),
          primary: customThemeColors.primary,
          primary_hover: customThemeColors.primary_hover,
          secondary: customThemeColors.secondary,
        },
        typography: {
          ...(currentTheme?.parameters?.typography || {}),
          font_family: customThemeColors.font_family,
        }
      };

      await api.put(`/website/themes/${activeThemeId}`, {
        parameters: updatedParams,
        is_active: true
      });

      showNotification('Active theme colors & font updated live!');
      fetchThemes();
      refreshSettings();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to update theme colors', 'error');
    }
  };

  // ───── CONTENT DICTIONARY (LABELS) ─────

  const handleLabelChange = (id, newVal) => {
    setModifiedLabels(prev => ({ ...prev, [id]: newVal }));
    setLabels(prev => prev.map(l => l.id === id ? { ...l, label_value: newVal } : l));
  };

  const handleSaveBulkLabels = async () => {
    const updates = Object.entries(modifiedLabels).map(([id, val]) => {
      const item = labels.find(l => l.id === Number(id));
      return { id: Number(id), label_value: val, namespace: item?.namespace, label_key: item?.label_key };
    });
    if (updates.length === 0) return;
    try {
      await api.post('/website/labels/bulk', { labels: updates });
      showNotification(`Saved ${updates.length} updated content labels!`);
      setModifiedLabels({});
      fetchLabels();
      refreshSettings();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Failed to bulk save labels', 'error');
    }
  };

  // Filtered dictionary labels
  const namespaces = ['all', ...new Set(labels.map(l => l.namespace))];
  const filteredLabels = labels.filter(l => {
    const matchesNS = labelFilterNS === 'all' || l.namespace === labelFilterNS;
    const matchesSearch = !labelSearch || l.label_key.toLowerCase().includes(labelSearch.toLowerCase()) || l.label_value.toLowerCase().includes(labelSearch.toLowerCase());
    return matchesNS && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl font-medium text-sm flex items-center gap-2 animate-bounce text-white ${toast.type === 'error' ? 'bg-rose-600' : 'bg-emerald-600'}`}>
          <CheckCircleIcon className="w-5 h-5" />
          {toast.msg}
        </div>
      )}

      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-500 text-xs font-bold rounded-full uppercase tracking-wider">Super Admin</span>
            <span className="text-xs text-gray-400">Visual CMS & Dynamic Frontend Engine</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Advanced Website Builder & Visual Editor</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Visually manage Header Navigation, Footer Columns, Page Sections, Themes, and Content Dictionary Labels.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-semibold rounded-xl transition-all flex items-center gap-2"
          >
            <EyeIcon className="w-4 h-4 text-primary-500" />
            Live Preview
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-gray-400" />
          </a>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800/60 p-1.5 rounded-2xl overflow-x-auto">
        {[
          { id: 'pages', label: 'Pages & Routes', icon: DocumentTextIcon },
          { id: 'sections', label: 'Visual Section Builder', icon: Square3Stack3DIcon },
          { id: 'header_nav', label: 'Header Navigation', icon: Bars3Icon },
          { id: 'footer_nav', label: 'Footer Columns', icon: RectangleStackIcon },
          { id: 'themes', label: 'Theme & Color Tokens', icon: PaintBrushIcon },
          { id: 'labels', label: 'Content Dictionary', icon: LanguageIcon },
          { id: 'global', label: 'Global & Media', icon: Cog6ToothIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-500 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'labels' && Object.keys(modifiedLabels).length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* ──────────────── TAB 1: PAGES & ROUTES ──────────────── */}
      {activeTab === 'pages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Website Pages & Custom Routes</h2>
            <button
              onClick={() => {
                setEditingPageId(null);
                setPageForm({ title: '', slug: '', meta_title: '', meta_description: '', is_published: true, is_homepage: false });
                setShowPageModal(true);
              }}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Create New Page
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.map((p) => (
              <div key={p.id} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.is_published ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-gray-100 text-gray-500'}`}>
                      {p.is_published ? 'Published' : 'Draft'}
                    </span>
                    {p.is_homepage && (
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 text-xs font-bold rounded-full">
                        Homepage
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{p.title}</h3>
                  <p className="text-xs font-mono text-primary-600 dark:text-primary-500 mt-1">/{p.slug}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedPageId(p.id);
                      setActiveTab('sections');
                    }}
                    className="text-xs font-semibold text-primary-600 dark:text-primary-500 hover:underline flex items-center gap-1"
                  >
                    Build Sections ({p.sections?.length || 0}) →
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingPageId(p.id);
                        setPageForm({
                          title: p.title,
                          slug: p.slug,
                          meta_title: p.meta_title || '',
                          meta_description: p.meta_description || '',
                          is_published: p.is_published,
                          is_homepage: p.is_homepage || false,
                        });
                        setShowPageModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-primary-600"
                    >
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    {!p.is_homepage && (
                      <button onClick={() => handleDeletePage(p.id)} className="p-2 text-gray-400 hover:text-rose-600">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Page Modal */}
          {showPageModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{editingPageId ? 'Edit Page Details' : 'Create New Page'}</h3>
                <form onSubmit={handleSavePage} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Page Title</label>
                    <input type="text" required placeholder="e.g. Enterprise HR Solution" value={pageForm.title} onChange={e => setPageForm({ ...pageForm, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">URL Slug</label>
                    <input type="text" required placeholder="e.g. enterprise" value={pageForm.slug} onChange={e => setPageForm({ ...pageForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Meta Title (SEO)</label>
                    <input type="text" placeholder="Custom browser tab title" value={pageForm.meta_title} onChange={e => setPageForm({ ...pageForm, meta_title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Meta Description (SEO)</label>
                    <textarea rows={3} placeholder="Brief description for search engines" value={pageForm.meta_description} onChange={e => setPageForm({ ...pageForm, meta_description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm" />
                  </div>
                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input type="checkbox" checked={pageForm.is_published} onChange={e => setPageForm({ ...pageForm, is_published: e.target.checked })} className="rounded border-gray-300 text-primary-600 w-4 h-4" />
                      Published
                    </label>
                    <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                      <input type="checkbox" checked={pageForm.is_homepage} onChange={e => setPageForm({ ...pageForm, is_homepage: e.target.checked })} className="rounded border-gray-300 text-primary-600 w-4 h-4" />
                      Set as Homepage
                    </label>
                  </div>
                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button type="button" onClick={() => setShowPageModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl">Save Page</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB 2: VISUAL SECTION BUILDER ──────────────── */}
      {activeTab === 'sections' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Target Page:</label>
              <select
                value={selectedPageId || ''}
                onChange={e => setSelectedPageId(Number(e.target.value))}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold text-primary-600 dark:text-primary-500"
              >
                {pages.map(p => (
                  <option key={p.id} value={p.id}>{p.title} (/{p.slug})</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setEditingSectionId(null);
                setSectionForm({
                  section_type: 'hero',
                  title: '',
                  subtitle: '',
                  is_visible: true,
                  badge: 'AI-Powered Platform',
                  cta_primary_text: 'Get Started',
                  cta_primary_url: '/demo',
                  cta_secondary_text: 'Learn More',
                  cta_secondary_url: '/features',
                  image_url: '',
                  items_list: [],
                  custom_raw_json: '{}',
                  use_raw_json: false,
                });
                setShowSectionModal(true);
              }}
              className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl flex items-center gap-2 shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Add Visual Section
            </button>
          </div>

          {/* Section Sequence Cards */}
          {sections.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-12 text-center border border-dashed border-gray-200 dark:border-gray-800">
              <Square3Stack3DIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">No sections created yet</h3>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">Build your page by adding component sections using visual forms.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sections.map((sec, idx) => (
                <div key={sec.id} className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-500 font-bold text-sm flex items-center justify-center">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 uppercase">
                          {sec.section_type}
                        </span>
                        {!sec.is_visible && <span className="text-xs text-amber-500 font-semibold">(Hidden)</span>}
                      </div>
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mt-1">{sec.title || 'Untitled Section'}</h4>
                      {sec.subtitle && <p className="text-xs text-gray-500 line-clamp-1">{sec.subtitle}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleMoveSection(idx, -1)} disabled={idx === 0} className="p-2 text-gray-400 hover:text-primary-600 disabled:opacity-30">
                      <ArrowUpIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleMoveSection(idx, 1)} disabled={idx === sections.length - 1} className="p-2 text-gray-400 hover:text-primary-600 disabled:opacity-30">
                      <ArrowDownIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => openSectionModalForEdit(sec)} className="p-2 text-gray-400 hover:text-primary-600" title="Visual Edit">
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteSection(sec.id)} className="p-2 text-gray-400 hover:text-rose-600">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Visual Section Builder Modal */}
          {showSectionModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {editingSectionId ? 'Visual Section Editor' : 'Add New Section'}
                  </h3>
                  <button onClick={() => setSectionForm(prev => ({ ...prev, use_raw_json: !prev.use_raw_json }))} className="text-xs text-primary-600 font-semibold hover:underline">
                    {sectionForm.use_raw_json ? 'Switch to Visual Builder' : 'Switch to Raw JSON'}
                  </button>
                </div>

                <form onSubmit={handleSaveSection} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Component Type</label>
                    <select
                      value={sectionForm.section_type}
                      onChange={e => setSectionForm({ ...sectionForm, section_type: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm font-semibold"
                    >
                      {SECTION_TYPES.map(st => (
                        <option key={st.type} value={st.type}>{st.label} ({st.type})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Section Title</label>
                    <input type="text" placeholder="Section Heading" value={sectionForm.title} onChange={e => setSectionForm({ ...sectionForm, title: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Subtitle / Paragraph</label>
                    <input type="text" placeholder="Lead text caption" value={sectionForm.subtitle} onChange={e => setSectionForm({ ...sectionForm, subtitle: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm" />
                  </div>

                  {!sectionForm.use_raw_json ? (
                    <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Badge Alert Text</label>
                          <input type="text" value={sectionForm.badge} onChange={e => setSectionForm({ ...sectionForm, badge: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Image / Asset URL</label>
                          <input type="text" placeholder="https://..." value={sectionForm.image_url} onChange={e => setSectionForm({ ...sectionForm, image_url: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Primary Button Text</label>
                          <input type="text" value={sectionForm.cta_primary_text} onChange={e => setSectionForm({ ...sectionForm, cta_primary_text: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Primary Button URL</label>
                          <input type="text" value={sectionForm.cta_primary_url} onChange={e => setSectionForm({ ...sectionForm, cta_primary_url: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs font-mono" />
                        </div>
                      </div>

                      {/* Item Cards List Manager */}
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Dynamic Section Items ({sectionForm.items_list.length})</label>
                          <button type="button" onClick={handleAddSectionItem} className="text-xs font-bold text-primary-600 dark:text-primary-500 hover:underline flex items-center gap-1">
                            <PlusIcon className="w-3.5 h-3.5" /> Add Item Card
                          </button>
                        </div>

                        {sectionForm.items_list.map((itm, i) => (
                          <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-500">Item #{i + 1}</span>
                              <button type="button" onClick={() => handleRemoveSectionItem(i)} className="text-rose-500 text-xs hover:underline">Remove</button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" placeholder="Title" value={itm.title || ''} onChange={e => handleUpdateSectionItem(i, 'title', e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs" />
                              <input type="text" placeholder="Description / Value" value={itm.desc || itm.value || ''} onChange={e => handleUpdateSectionItem(i, 'desc', e.target.value)} className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Raw JSON Payload</label>
                      <textarea rows={8} value={sectionForm.custom_raw_json} onChange={e => setSectionForm({ ...sectionForm, custom_raw_json: e.target.value })} className="w-full p-3 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-xs font-mono" />
                    </div>
                  )}

                  <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                    <input type="checkbox" checked={sectionForm.is_visible} onChange={e => setSectionForm({ ...sectionForm, is_visible: e.target.checked })} className="rounded border-gray-300 text-primary-600 w-4 h-4" />
                    Visible on Public Site
                  </label>

                  <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <button type="button" onClick={() => setShowSectionModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400">Cancel</button>
                    <button type="submit" className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl">Save Section</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ──────────────── TAB 3: HEADER NAVIGATION BUILDER ──────────────── */}
      {activeTab === 'header_nav' && (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Header Navigation Links Builder</h2>
              <p className="text-xs text-gray-500">Visually manage your website navbar links and destination URLs.</p>
            </div>
            <button onClick={handleAddHeaderLink} className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl flex items-center gap-1">
              <PlusIcon className="w-4 h-4" /> Add Navbar Link
            </button>
          </div>

          <div className="space-y-3">
            {headerLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                <span className="font-mono text-xs text-gray-400 w-6">#{idx + 1}</span>
                <input
                  type="text"
                  placeholder="Link Label"
                  value={link.label}
                  onChange={e => handleHeaderLinkChange(idx, 'label', e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs font-semibold w-1/3"
                />
                <input
                  type="text"
                  placeholder="URL Path (e.g. /features)"
                  value={link.url}
                  onChange={e => handleHeaderLinkChange(idx, 'url', e.target.value)}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-900 text-xs font-mono flex-1"
                />
                <button onClick={() => handleRemoveHeaderLink(idx)} className="p-2 text-rose-500 hover:text-rose-700">
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
            <button onClick={handleSaveNavAndFooter} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl">
              Save Header Navigation
            </button>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 4: FOOTER REDESIGN STUDIO & NAVIGATION ──────────────── */}
      {activeTab === 'footer_nav' && (
        <div className="space-y-6">
          {/* Footer Redesign Controls Card */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <PaintBrushIcon className="w-5 h-5 text-primary-600" />
                  Footer Design Studio & Layout Controls
                </h2>
                <p className="text-xs text-gray-500">Redesign your public website footer layout, copy, newsletter banner, and visibility options.</p>
              </div>
              <button onClick={handleSaveNavAndFooter} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" /> Save Footer Redesign
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Footer Layout Style Variant Picker */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Footer Layout Variant</label>
                <select
                  value={footerDesign.variant}
                  onChange={e => setFooterDesign({ ...footerDesign, variant: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-semibold"
                >
                  <option value="modern">Modern Enterprise (4-Column Grid + Top Newsletter)</option>
                  <option value="minimal">Minimal Centered (Sleek Logo + Horizontal Link Pills)</option>
                  <option value="dark_luxe">Dark Luxe Gradient (Glassmorphic Cards + Accent Line)</option>
                  <option value="custom_html">100% Custom HTML & Tailwind Studio (Freeform Design)</option>
                </select>
              </div>

              {/* Tagline / Bio Input */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Footer Tagline / Bio</label>
                <input
                  type="text"
                  value={footerDesign.tagline}
                  onChange={e => setFooterDesign({ ...footerDesign, tagline: e.target.value })}
                  placeholder="Enterprise-grade HR management platform..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Copyright Line */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Copyright Line</label>
                <input
                  type="text"
                  value={footerDesign.copyright_text}
                  onChange={e => setFooterDesign({ ...footerDesign, copyright_text: e.target.value })}
                  placeholder="© 2026 HRMS Pro Inc. All rights reserved."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono"
                />
              </div>
            </div>

            {/* Freeform Custom HTML Code Editor */}
            {footerDesign.variant === 'custom_html' && (
              <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-primary-600 dark:text-primary-500 uppercase tracking-wider flex items-center gap-1.5">
                    <DocumentTextIcon className="w-4 h-4" />
                    Custom HTML & Tailwind CSS Code Studio
                  </label>
                  <span className="text-[10px] text-gray-400">Supports all standard HTML5 tags, Tailwind classes, SVG icons, and links</span>
                </div>
                <textarea
                  rows={8}
                  value={footerDesign.custom_html}
                  onChange={e => setFooterDesign({ ...footerDesign, custom_html: e.target.value })}
                  placeholder="<div class='py-12 border-t border-gray-800 text-center'>...</div>"
                  className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono bg-gray-950 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            )}

            {/* Visibility Toggles */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-gray-100 dark:border-gray-800">
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerDesign.show_newsletter}
                  onChange={e => setFooterDesign({ ...footerDesign, show_newsletter: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 w-4 h-4"
                />
                Show Newsletter Signup Banner
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerDesign.show_social_links}
                  onChange={e => setFooterDesign({ ...footerDesign, show_social_links: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 w-4 h-4"
                />
                Show Social Media Icons (LinkedIn, Twitter, GitHub, YouTube)
              </label>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={footerDesign.show_trust_badges}
                  onChange={e => setFooterDesign({ ...footerDesign, show_trust_badges: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 w-4 h-4"
                />
                Show Security & Compliance Badges (SOC 2, GDPR, ISO 27001)
              </label>
            </div>
          </div>

          {/* Footer Link Categories & Columns Manager */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Footer Link Columns & Categories</h2>
                <p className="text-xs text-gray-500">Add and customize link columns displayed in your website footer.</p>
              </div>
              <button onClick={handleAddFooterColumn} className="px-4 py-2 bg-primary-600 text-white text-xs font-bold rounded-xl flex items-center gap-1">
                <PlusIcon className="w-4 h-4" /> Add Footer Column
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {footerColumns.map((col, colIdx) => (
                <div key={colIdx} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <input
                      type="text"
                      value={col.title}
                      onChange={e => handleFooterColumnTitleChange(colIdx, e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 font-bold text-xs w-full mr-2"
                    />
                    <button onClick={() => handleRemoveFooterColumn(colIdx)} className="text-rose-500 p-1">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(col.links || []).map((link, linkIdx) => (
                      <div key={linkIdx} className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="Label"
                          value={link.label}
                          onChange={e => handleFooterLinkChange(colIdx, linkIdx, 'label', e.target.value)}
                          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs w-1/2"
                        />
                        <input
                          type="text"
                          placeholder="URL"
                          value={link.url}
                          onChange={e => handleFooterLinkChange(colIdx, linkIdx, 'url', e.target.value)}
                          className="px-2 py-1 rounded border border-gray-200 dark:border-gray-700 text-xs font-mono w-1/2"
                        />
                        <button onClick={() => handleRemoveFooterLink(colIdx, linkIdx)} className="text-gray-400 hover:text-rose-500">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={() => handleAddFooterLink(colIdx)} className="text-[11px] font-bold text-primary-600 dark:text-primary-500 hover:underline">
                    + Add Link
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={handleSaveNavAndFooter} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl">
                Save Footer Redesign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 5: THEMES & COLOR TOKENS ──────────────── */}
      {activeTab === 'themes' && (
        <div className="space-y-6">
          {/* Active Theme Dynamic Customizer */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">● Currently Active Theme</span>
                </div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mt-1">
                  {themes.find(t => t.id === activeThemeId)?.name || 'Custom Theme'}
                </h2>
              </div>
              <button
                onClick={handleSaveCustomThemeColors}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl shadow-md flex items-center gap-2"
              >
                <SparklesIcon className="w-4 h-4" /> Save Live Color Tokens
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Primary Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customThemeColors.primary}
                    onChange={e => setCustomThemeColors({ ...customThemeColors, primary: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200 p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={customThemeColors.primary}
                    onChange={e => setCustomThemeColors({ ...customThemeColors, primary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Primary Hover Shade</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customThemeColors.primary_hover}
                    onChange={e => setCustomThemeColors({ ...customThemeColors, primary_hover: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200 p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={customThemeColors.primary_hover}
                    onChange={e => setCustomThemeColors({ ...customThemeColors, primary_hover: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Secondary Accent Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customThemeColors.secondary}
                    onChange={e => setCustomThemeColors({ ...customThemeColors, secondary: e.target.value })}
                    className="w-10 h-10 rounded-xl cursor-pointer border border-gray-200 p-1 bg-white"
                  />
                  <input
                    type="text"
                    value={customThemeColors.secondary}
                    onChange={e => setCustomThemeColors({ ...customThemeColors, secondary: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-mono bg-transparent"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Typography Font Family</label>
                <select
                  value={customThemeColors.font_family}
                  onChange={e => setCustomThemeColors({ ...customThemeColors, font_family: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="Inter, sans-serif">Inter (Modern Clean)</option>
                  <option value="Outfit, sans-serif">Outfit (Tech Bold)</option>
                  <option value="Poppins, sans-serif">Poppins (Friendly Corporate)</option>
                  <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans (SaaS Elite)</option>
                  <option value="'Playfair Display', serif">Playfair Display (Luxury Editorial)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Theme Presets Grid */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Theme Presets & One-Click Switcher</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PRESET_THEMES.map(t => {
                const dbTheme = themes.find(x => x.slug === t.slug);
                const isSelected = dbTheme ? dbTheme.id === activeThemeId : false;
                return (
                  <div
                    key={t.slug}
                    className={`p-5 rounded-2xl border transition-all duration-200 space-y-3 ${
                      isSelected
                        ? 'border-emerald-500 dark:border-emerald-400 bg-emerald-50/20 dark:bg-emerald-500/5 ring-2 ring-emerald-500/20'
                        : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 hover:border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-gray-900 dark:text-white">{t.name}</h3>
                      {isSelected ? (
                        <span className="px-2.5 py-0.5 bg-emerald-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                          <CheckIcon className="w-3 h-3" /> Selected
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-gray-400">{t.font}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                    <div className="flex items-center gap-2 pt-2">
                      <div className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: t.primary }} title="Primary" />
                      <div className="w-6 h-6 rounded-full border border-black/10" style={{ backgroundColor: t.secondary }} title="Secondary" />
                      {isSelected ? (
                        <span className="ml-auto text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Active Site Theme
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            if (dbTheme) handleActivateTheme(dbTheme.id);
                            else showNotification(`Preset ${t.name} selected`);
                          }}
                          className="ml-auto px-4 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold rounded-xl transition-all"
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 6: CONTENT DICTIONARY (LABELS) ──────────────── */}
      {activeTab === 'labels' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Content Dictionary Labels (Every Word Editable)</h2>
              <p className="text-xs text-gray-500">Search and edit any text phrase on your website.</p>
            </div>
            {Object.keys(modifiedLabels).length > 0 && (
              <button onClick={handleSaveBulkLabels} className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-md animate-pulse flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" /> Save {Object.keys(modifiedLabels).length} Label Changes
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
              {namespaces.map(ns => (
                <button key={ns} onClick={() => setLabelFilterNS(ns)} className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap ${labelFilterNS === ns ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800'}`}>
                  {ns}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input type="text" placeholder="Search phrase..." value={labelSearch} onChange={e => setLabelSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 text-xs font-semibold text-gray-500">
                  <th className="p-4 w-32">Namespace</th>
                  <th className="p-4 w-56">Label Key</th>
                  <th className="p-4">Editable Text Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                {filteredLabels.map(lbl => {
                  const isModified = modifiedLabels[lbl.id] !== undefined;
                  return (
                    <tr key={lbl.id} className={isModified ? 'bg-amber-50/50 dark:bg-amber-500/5' : ''}>
                      <td className="p-4 font-mono text-xs text-primary-600 dark:text-primary-500 font-semibold">{lbl.namespace}</td>
                      <td className="p-4 font-mono text-xs font-bold text-gray-900 dark:text-gray-200">{lbl.label_key}</td>
                      <td className="p-4">
                        <input type="text" value={lbl.label_value} onChange={e => handleLabelChange(lbl.id, e.target.value)} className={`w-full px-3 py-1.5 rounded-lg border text-xs ${isModified ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20 font-semibold' : 'border-gray-200 dark:border-gray-700 bg-transparent'}`} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ──────────────── TAB 7: GLOBAL & MEDIA ──────────────── */}
      {activeTab === 'global' && (
        <div className="space-y-6">
          <form onSubmit={e => { e.preventDefault(); handleSaveNavAndFooter(); }} className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Global Company Settings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1">Company Name</label>
                <input type="text" value={globalSettings.company_name} onChange={e => setGlobalSettings({ ...globalSettings, company_name: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tagline</label>
                <input type="text" value={globalSettings.tagline} onChange={e => setGlobalSettings({ ...globalSettings, tagline: e.target.value })} className="w-full px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 dark:bg-gray-800 text-sm" />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-xl">Save Settings</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default WebsiteBuilder;
