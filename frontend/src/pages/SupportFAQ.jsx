import React, { useState, useEffect, useCallback } from 'react';
import { supportService } from '../services/supportService';
import {
  FaPlus, FaSearch, FaSpinner, FaEdit, FaTrash, FaTimes,
  FaCheck, FaQuestionCircle, FaFolder, FaExternalLinkAlt
} from 'react-icons/fa';

const SupportFAQ = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showArticleModal, setShowArticleModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [articleForm, setArticleForm] = useState({ question: '', answer: '', category_id: '', keywords: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', display_order: 0 });
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('articles');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page: 1, limit: 50 };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      const [articleResult, catResult] = await Promise.all([
        supportService.getFAQs(params),
        supportService.getFAQCategories()
      ]);
      setArticles(articleResult.articles || []);
      setPagination(articleResult.pagination);
      setCategories(catResult.data || []);
    } catch (err) {
      console.error('Failed to load FAQs:', err);
    } finally {
      setLoading(false);
    }
  }, [search, categoryFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const openArticleModal = (article = null) => {
    if (article) {
      setEditingArticle(article);
      setArticleForm({
        question: article.question,
        answer: article.answer,
        category_id: article.category_id || '',
        keywords: JSON.parse(article.keywords || '[]').join(', ')
      });
    } else {
      setEditingArticle(null);
      setArticleForm({ question: '', answer: '', category_id: categories[0]?.category_id || '', keywords: '' });
    }
    setShowArticleModal(true);
  };

  const handleSaveArticle = async (e) => {
    e.preventDefault();
    if (!articleForm.question || !articleForm.answer) return;
    setSubmitting(true);
    try {
      const data = {
        ...articleForm,
        category_id: parseInt(articleForm.category_id),
        keywords: articleForm.keywords.split(',').map(k => k.trim()).filter(Boolean)
      };
      if (editingArticle) {
        await supportService.updateFAQ(editingArticle.article_id, data);
      } else {
        await supportService.createFAQ(data);
      }
      setShowArticleModal(false);
      loadData();
    } catch (err) {
      console.error('Failed to save article:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteArticle = async (id) => {
    if (!window.confirm('Delete this FAQ article?')) return;
    try {
      await supportService.deleteFAQ(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete article:', err);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.slug) return;
    setSubmitting(true);
    try {
      await supportService.createFAOCategory(categoryForm);
      setShowCategoryModal(false);
      setCategoryForm({ name: '', slug: '', description: '', display_order: 0 });
      loadData();
    } catch (err) {
      console.error('Failed to save category:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete this category and all its articles?')) return;
    try {
      await supportService.deleteFAOCategory(id);
      loadData();
    } catch (err) {
      console.error('Failed to delete category:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
          <p className="text-gray-500 text-sm mt-1">Manage knowledge base for auto-reply system</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCategoryModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <FaFolder size={12} /> New Category
          </button>
          <button onClick={() => openArticleModal(null)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            <FaPlus size={12} /> New Article
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap border-b border-gray-200 pb-3">
        <button onClick={() => setActiveTab('articles')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'articles' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
          <FaQuestionCircle className="inline mr-1.5" size={12} /> Articles ({pagination?.total || 0})
        </button>
        <button onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === 'categories' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}>
          <FaFolder className="inline mr-1.5" size={12} /> Categories ({categories.length})
        </button>
      </div>

      {activeTab === 'articles' && (
        <>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-blue-400" />
            </div>
            <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400">
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.category_id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <FaSpinner className="animate-spin text-3xl text-blue-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {articles.length === 0 ? (
                <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                  <FaQuestionCircle className="text-gray-300 text-4xl mx-auto mb-3" />
                  <p className="text-gray-500">No FAQ articles yet</p>
                  <button onClick={() => openArticleModal(null)} className="mt-3 text-sm text-blue-600 hover:underline">
                    Create your first article
                  </button>
                </div>
              ) : (
                articles.map(article => (
                  <div key={article.article_id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{article.category_name || 'Uncategorized'}</span>
                          {!article.is_published && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Draft</span>}
                        </div>
                        <h3 className="text-base font-semibold text-gray-900 mb-1">{article.question}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2">{article.answer}</p>
                        {article.keywords && JSON.parse(article.keywords).length > 0 && (
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {JSON.parse(article.keywords).map((kw, i) => (
                              <span key={i} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{kw}</span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                          <span>👍 {article.helpful_count || 0}</span>
                          <span>👎 {article.not_helpful_count || 0}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openArticleModal(article)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <FaEdit size={13} />
                        </button>
                        <button onClick={() => handleDeleteArticle(article.article_id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <FaTrash size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}

              {pagination && pagination.totalPages > 1 && (
                <div className="flex justify-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40">
                    Previous
                  </button>
                  <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-40">
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl border border-gray-200">
          {categories.length === 0 ? (
            <div className="p-12 text-center">
              <FaFolder className="text-gray-300 text-4xl mx-auto mb-3" />
              <p className="text-gray-500">No categories yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {categories.map(cat => (
                <div key={cat.category_id} className="px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${cat.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <div>
                      <p className="text-sm font-medium text-gray-800">{cat.name}</p>
                      <p className="text-xs text-gray-400">{cat.slug} · {cat.article_count || 0} articles</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteCategory(cat.category_id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors">
                    <FaTrash size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showArticleModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowArticleModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                {editingArticle ? 'Edit Article' : 'New Article'}
              </h2>
              <button onClick={() => setShowArticleModal(false)} className="text-gray-400 hover:text-gray-600">
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSaveArticle} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question *</label>
                <input type="text" value={articleForm.question} onChange={e => setArticleForm(p => ({ ...p, question: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Answer *</label>
                <textarea value={articleForm.answer} onChange={e => setArticleForm(p => ({ ...p, answer: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400 min-h-[120px]" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={articleForm.category_id} onChange={e => setArticleForm(p => ({ ...p, category_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400">
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Keywords (comma separated)</label>
                  <input type="text" value={articleForm.keywords} onChange={e => setArticleForm(p => ({ ...p, keywords: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400"
                    placeholder="login, password, access" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowArticleModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? <FaSpinner className="animate-spin" /> : editingArticle ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCategoryModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">New Category</h2>
              <button onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-gray-600"><FaTimes /></button>
            </div>
            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input type="text" value={categoryForm.name} onChange={e => setCategoryForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                <input type="text" value={categoryForm.slug} onChange={e => setCategoryForm(p => ({ ...p, slug: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" required
                  placeholder="login-issues" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input type="text" value={categoryForm.description} onChange={e => setCategoryForm(p => ({ ...p, description: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-400" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowCategoryModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50">
                  {submitting ? <FaSpinner className="animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportFAQ;
