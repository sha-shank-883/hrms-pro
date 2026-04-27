import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { FaSave, FaImage, FaPalette, FaThLarge, FaLink, FaList, FaPlus, FaTrash, FaArrowUp, FaArrowDown, FaEye, FaEyeSlash } from 'react-icons/fa';
import SectionBuilder from '../components/common/SectionBuilder';

const WebsiteSettings = () => {
  const [activeTab, setActiveTab] = useState('branding');
  
  const [settings, setSettings] = useState({
    primary_color: '#16a34a',
    font_family: 'Inter',
    logo_url: '',
    header_links: [],
    footer_columns: [],
    sections: []
  });
  
  const [files, setFiles] = useState({ logo: null });
  const [cmsPages, setCmsPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchCmsPages();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/website-settings');
      if (res.data.success && res.data.data) {
        const data = res.data.data;
        setSettings({
          ...data,
          header_links: typeof data.header_links === 'string' ? JSON.parse(data.header_links) : (data.header_links || []),
          footer_columns: typeof data.footer_columns === 'string' ? JSON.parse(data.footer_columns) : (data.footer_columns || []),
          sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : (data.sections || []),
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
      toast.error('Failed to load website settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchCmsPages = async () => {
    try {
      const res = await api.get('/cms/pages');
      if (res.data.success) {
        setCmsPages(res.data.data.filter(p => p.published_status === 'published'));
      }
    } catch (error) {
      console.error('Failed to fetch CMS pages', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles(prev => ({ ...prev, [name]: selectedFiles[0] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('primary_color', settings.primary_color || '');
      formData.append('font_family', settings.font_family || '');
      formData.append('header_links', JSON.stringify(settings.header_links));
      formData.append('footer_columns', JSON.stringify(settings.footer_columns));
      formData.append('sections', JSON.stringify(settings.sections));

      if (files.logo) {
        formData.append('logo', files.logo);
      }

      const res = await api.put('/website-settings', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        toast.success('Website settings updated successfully!');
        setFiles({ logo: null });
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-neutral-500">Loading settings...</div>;

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const displayImageUrl = (url) => url ? (url.startsWith('http') ? url : `${backendUrl}${url}`) : null;

  const TabButton = ({ id, label, icon: Icon }) => (
    <button type="button" onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === id ? 'border-primary-500 text-primary-600 bg-primary-50' : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50'}`}>
      <Icon className={activeTab === id ? 'text-primary-500' : 'text-neutral-400'} /> {label}
    </button>
  );

  const ToggleSwitch = ({ checked, onChange, label }) => (
    <label className="flex items-center cursor-pointer gap-2" title={checked ? "Visible" : "Hidden"}>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked !== false} onChange={(e) => onChange(e.target.checked)} />
        <div className={`block w-10 h-5 rounded-full transition-colors ${checked !== false ? 'bg-primary-500' : 'bg-neutral-300'}`}></div>
        <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${checked !== false ? 'transform translate-x-5' : ''}`}></div>
      </div>
      {label && <span className="text-xs font-medium text-neutral-600">{label}</span>}
    </label>
  );

  const CmsPageSelector = ({ onChange }) => (
    <select className="form-select text-xs mt-1 w-full bg-neutral-50" value="" onChange={(e) => { if(e.target.value) onChange(e.target.value); }}>
      <option value="">-- Link to CMS Page --</option>
      {cmsPages.map(p => <option key={p.id} value={`/${p.slug}`}>{p.title}</option>)}
    </select>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Advanced Page Builder</h1>
          <p className="page-subtitle">Fully dynamic layout, content, and visibility toggles</p>
        </div>
        <a href="/" target="_blank" rel="noopener noreferrer" className="btn btn-secondary">View Live Website</a>
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden mb-6 flex overflow-x-auto custom-scrollbar">
        <TabButton id="branding" label="Branding & Theme" icon={FaPalette} />
        <TabButton id="header" label="Header Navigation" icon={FaLink} />
        <TabButton id="builder" label="Page Builder" icon={FaThLarge} />
        <TabButton id="footer" label="Footer Layout" icon={FaList} />
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          
          {/* BRANDING TAB */}
          {activeTab === 'branding' && (
            <div className="card animate-in fade-in zoom-in-95 duration-200">
              <div className="card-header"><h3 className="card-title">Branding & Theme</h3></div>
              <div className="card-body space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="form-label">Primary Theme Color</label>
                    <div className="flex gap-3 items-center">
                      <input type="color" name="primary_color" className="h-10 w-10 p-1 rounded cursor-pointer border border-neutral-200" value={settings.primary_color || '#16a34a'} onChange={handleChange} />
                      <input type="text" name="primary_color" className="form-input flex-1" value={settings.primary_color || '#16a34a'} onChange={handleChange} />
                    </div>
                  </div>
                  <div>
                    <label className="form-label">Font Family</label>
                    <select name="font_family" className="form-select" value={settings.font_family || 'Inter'} onChange={handleChange}>
                      <option value="Inter">Inter (Default)</option>
                      <option value="Roboto">Roboto</option>
                      <option value="Outfit">Outfit</option>
                      <option value="Poppins">Poppins</option>
                      <option value="Open Sans">Open Sans</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">Logo (Optional)</label>
                  {settings.logo_url && (
                    <div className="mb-2 p-2 bg-neutral-100 rounded inline-block"><img src={displayImageUrl(settings.logo_url)} alt="Logo" className="h-8 object-contain" /></div>
                  )}
                  <input type="file" name="logo" accept="image/*" className="form-input" onChange={handleFileChange} />
                </div>
              </div>
            </div>
          )}

          {/* HEADER TAB */}
          {activeTab === 'header' && (
            <div className="card animate-in fade-in zoom-in-95 duration-200">
              <div className="card-header flex justify-between items-center">
                <h3 className="card-title">Top Navigation Links</h3>
                <button type="button" onClick={() => setSettings(prev => ({...prev, header_links: [...prev.header_links, { id: Date.now().toString(), label: 'New Link', url: '/', isActive: true }]}))} className="btn btn-secondary text-sm py-1.5"><FaPlus /> Add Link</button>
              </div>
              <div className="card-body space-y-4">
                {settings.header_links.length === 0 ? <p className="text-neutral-500 text-center py-4">No header links.</p> : (
                  settings.header_links.map((link, index) => (
                    <div key={link.id} className={`flex items-start gap-4 p-4 rounded-lg border ${link.isActive !== false ? 'bg-white border-neutral-200' : 'bg-neutral-50 border-neutral-200 opacity-60'}`}>
                      <div className="flex flex-col gap-1 mt-1">
                        <button type="button" onClick={() => {
                          const arr = [...settings.header_links];
                          if(index>0) { [arr[index-1], arr[index]] = [arr[index], arr[index-1]]; setSettings(p => ({...p, header_links: arr})); }
                        }} disabled={index === 0} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"><FaArrowUp /></button>
                        <button type="button" onClick={() => {
                          const arr = [...settings.header_links];
                          if(index<arr.length-1) { [arr[index+1], arr[index]] = [arr[index], arr[index+1]]; setSettings(p => ({...p, header_links: arr})); }
                        }} disabled={index === settings.header_links.length - 1} className="text-neutral-400 hover:text-neutral-700 disabled:opacity-30"><FaArrowDown /></button>
                      </div>
                      <div className="flex-1 grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-neutral-500">Label</label>
                          <input type="text" className="form-input mt-1 text-sm" value={link.label} onChange={(e) => {
                            const arr = [...settings.header_links]; arr[index].label = e.target.value; setSettings(p => ({...p, header_links: arr}));
                          }} />
                        </div>
                        <div>
                          <label className="text-xs text-neutral-500">URL</label>
                          <input type="text" className="form-input mt-1 text-sm" value={link.url} onChange={(e) => {
                            const arr = [...settings.header_links]; arr[index].url = e.target.value; setSettings(p => ({...p, header_links: arr}));
                          }} />
                          <CmsPageSelector onChange={(val) => { const arr = [...settings.header_links]; arr[index].url = val; setSettings(p => ({...p, header_links: arr})); }} />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-3">
                        <ToggleSwitch checked={link.isActive !== false} onChange={(val) => { const arr = [...settings.header_links]; arr[index].isActive = val; setSettings(p => ({...p, header_links: arr})); }} />
                        <button type="button" onClick={() => setSettings(p => ({...p, header_links: p.header_links.filter(l => l.id !== link.id)}))} className="text-red-500 hover:text-red-700 p-1"><FaTrash /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* PAGE BUILDER TAB */}
          {activeTab === 'builder' && (
            <SectionBuilder sections={settings.sections} onChange={(newSections) => setSettings(p => ({ ...p, sections: newSections }))} />
          )}

          {/* FOOTER TAB */}
          {activeTab === 'footer' && (
            <div className="card animate-in fade-in zoom-in-95 duration-200">
              <div className="card-header flex justify-between items-center">
                <h3 className="card-title">Footer Columns</h3>
                <button type="button" onClick={() => setSettings(prev => ({...prev, footer_columns: [...prev.footer_columns, { id: Date.now().toString(), title: 'New Column', isActive: true, links: [] }]}))} className="btn btn-secondary text-sm py-1.5"><FaPlus /> Add Column</button>
              </div>
              <div className="card-body space-y-6">
                {settings.footer_columns.length === 0 ? <p className="text-neutral-500 text-center py-4">No footer columns.</p> : (
                  settings.footer_columns.map((col, colIndex) => (
                    <div key={col.id} className={`p-4 rounded-xl border ${col.isActive !== false ? 'bg-neutral-50 border-neutral-200' : 'bg-white border-neutral-200 opacity-60'}`}>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3 w-full max-w-xs">
                          <input type="text" className="form-input font-bold" value={col.title} onChange={(e) => {
                            const arr = [...settings.footer_columns]; arr[colIndex].title = e.target.value; setSettings(p => ({...p, footer_columns: arr}));
                          }} />
                        </div>
                        <div className="flex items-center gap-4">
                          <ToggleSwitch checked={col.isActive !== false} onChange={(val) => { const arr = [...settings.footer_columns]; arr[colIndex].isActive = val; setSettings(p => ({...p, footer_columns: arr})); }} />
                          <button type="button" onClick={() => setSettings(p => ({...p, footer_columns: p.footer_columns.filter(c => c.id !== col.id)}))} className="text-red-500 hover:text-red-700 p-2"><FaTrash /></button>
                        </div>
                      </div>
                      
                      <div className="space-y-3 pl-4 border-l-2 border-neutral-200">
                        {col.links && col.links.map((link, linkIndex) => (
                          <div key={link.id} className={`flex gap-3 items-start ${link.isActive === false ? 'opacity-50' : ''}`}>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <input type="text" className="form-input text-xs" placeholder="Label" value={link.label} onChange={(e) => {
                                const arr = [...settings.footer_columns]; arr[colIndex].links[linkIndex].label = e.target.value; setSettings(p => ({...p, footer_columns: arr}));
                              }} />
                              <div>
                                <input type="text" className="form-input text-xs" placeholder="URL" value={link.url} onChange={(e) => {
                                  const arr = [...settings.footer_columns]; arr[colIndex].links[linkIndex].url = e.target.value; setSettings(p => ({...p, footer_columns: arr}));
                                }} />
                                <CmsPageSelector onChange={(val) => { const arr = [...settings.footer_columns]; arr[colIndex].links[linkIndex].url = val; setSettings(p => ({...p, footer_columns: arr})); }} />
                              </div>
                            </div>
                            <div className="pt-2">
                              <ToggleSwitch checked={link.isActive !== false} onChange={(val) => { const arr = [...settings.footer_columns]; arr[colIndex].links[linkIndex].isActive = val; setSettings(p => ({...p, footer_columns: arr})); }} />
                            </div>
                            <button type="button" onClick={() => {
                              const arr = [...settings.footer_columns]; arr[colIndex].links = arr[colIndex].links.filter(l => l.id !== link.id); setSettings(p => ({...p, footer_columns: arr}));
                            }} className="text-neutral-400 hover:text-red-500 px-2 pt-2"><FaTrash size={12} /></button>
                          </div>
                        ))}
                        <button type="button" onClick={() => {
                          const arr = [...settings.footer_columns];
                          if (!arr[colIndex].links) arr[colIndex].links = [];
                          arr[colIndex].links.push({ id: Date.now().toString(), label: 'New Link', url: '/', isActive: true });
                          setSettings(p => ({...p, footer_columns: arr}));
                        }} className="text-xs text-primary-600 font-semibold hover:underline">+ Add Link</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-24 card">
            <div className="card-body">
              <button type="submit" disabled={saving} className="btn btn-primary w-full justify-center py-3 text-lg font-bold">
                {saving ? 'Saving...' : <><FaSave /> Publish Site</>}
              </button>
              <p className="text-xs text-neutral-500 mt-4 text-center">Changes immediately reflect on live site.</p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default WebsiteSettings;
