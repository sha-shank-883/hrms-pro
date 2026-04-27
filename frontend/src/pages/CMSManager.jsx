import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FaPlus, FaEdit, FaTrash, FaGlobe } from 'react-icons/fa';
import SectionBuilder from '../components/common/SectionBuilder';

const CMSManager = () => {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: null, slug: '', title: '', content_html: '', meta_title: '', meta_description: '', published_status: 'draft', sections: []
  });
  const [activeTab, setActiveTab] = useState('settings');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await api.get('/cms/pages');
      if (res.data.success) {
        setPages(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (page = null) => {
    if (page) {
      setFormData({
        ...page,
        sections: typeof page.sections === 'string' ? JSON.parse(page.sections) : (page.sections || [])
      });
    } else {
      setFormData({ id: null, slug: '', title: '', content_html: '', meta_title: '', meta_description: '', published_status: 'draft', sections: [] });
    }
    setActiveTab('settings');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        sections: formData.sections
      };
      
      if (formData.id) {
        await api.put(`/cms/pages/${formData.id}`, payload);
      } else {
        await api.post('/cms/pages', payload);
      }
      setIsModalOpen(false);
      fetchPages();
    } catch (error) {
      console.error('Error saving page:', error);
      alert(error.response?.data?.message || 'Error saving page');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this page?')) {
      try {
        await api.delete(`/cms/pages/${id}`);
        fetchPages();
      } catch (error) {
        console.error('Error deleting page:', error);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-800">Website CMS</h1>
          <p className="text-sm text-neutral-500">Manage dynamic pages for the marketing website.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary flex items-center gap-2">
          <FaPlus /> Create Page
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-neutral-500">Loading...</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-200">
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase">Page Title</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase">Slug / URL</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-neutral-500 uppercase">Last Updated</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {pages.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-neutral-500">
                    No pages found. Create one to get started.
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr key={page.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 font-medium text-neutral-900">{page.title}</td>
                    <td className="px-6 py-4 text-sm text-blue-600 flex items-center gap-2">
                      <FaGlobe className="text-neutral-400" /> /{page.slug}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold uppercase ${page.published_status === 'published' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                        {page.published_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-neutral-500">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="p-2 text-neutral-400 hover:text-blue-600" title="View Page">
                        <FaGlobe />
                      </a>
                      <button onClick={() => handleOpenModal(page)} className="p-2 text-neutral-400 hover:text-blue-600" title="Edit Page">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(page.id)} className="p-2 text-neutral-400 hover:text-red-600" title="Delete Page">
                        <FaTrash />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for CMS Editing */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center bg-neutral-50 rounded-t-xl">
              <h2 className="text-xl font-bold">{formData.id ? 'Edit Page' : 'Create Page'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-neutral-800">&times;</button>
            </div>
            
            <div className="flex border-b border-neutral-200 bg-white px-6">
              <button className={`py-3 px-4 text-sm font-bold border-b-2 ${activeTab === 'settings' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`} onClick={() => setActiveTab('settings')}>Page Settings</button>
              <button className={`py-3 px-4 text-sm font-bold border-b-2 ${activeTab === 'builder' ? 'border-primary-500 text-primary-600' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`} onClick={() => setActiveTab('builder')}>Page Builder</button>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 bg-neutral-50">
                
                {activeTab === 'settings' && (
                  <div className="space-y-6 max-w-3xl">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Title</label>
                        <input required type="text" className="w-full input bg-white" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Slug (URL path)</label>
                        <input required type="text" className="w-full input bg-white" placeholder="e.g., about-us" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Status</label>
                        <select className="w-full input bg-white" value={formData.published_status} onChange={e => setFormData({...formData, published_status: e.target.value})}>
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">SEO Meta Title</label>
                        <input type="text" className="w-full input bg-white" value={formData.meta_title} onChange={e => setFormData({...formData, meta_title: e.target.value})} />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-neutral-700 mb-1">SEO Meta Description</label>
                      <textarea className="w-full input h-24 bg-white" value={formData.meta_description} onChange={e => setFormData({...formData, meta_description: e.target.value})} />
                    </div>

                    <div className="pt-4 border-t border-neutral-200">
                      <label className="block text-sm font-medium text-neutral-700 mb-1">Legacy HTML Content</label>
                      <p className="text-xs text-neutral-500 mb-2">If you use the Page Builder, this content will be ignored. Only use this for old simple pages.</p>
                      <textarea className="w-full input min-h-[150px] font-mono text-sm bg-white" placeholder="<h1>Heading</h1><p>Content goes here...</p>" value={formData.content_html} onChange={e => setFormData({...formData, content_html: e.target.value})} />
                    </div>
                  </div>
                )}

                {activeTab === 'builder' && (
                  <div className="max-w-5xl mx-auto">
                    <SectionBuilder 
                      sections={formData.sections} 
                      onChange={(newSections) => setFormData(p => ({ ...p, sections: newSections }))} 
                    />
                  </div>
                )}

              </div>

              <div className="p-4 border-t border-neutral-200 bg-white flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Page</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CMSManager;
