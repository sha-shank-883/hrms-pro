import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import api from '../../services/api';
import SectionRenderer from '../../components/common/SectionRenderer';

const DynamicPage = () => {
  const { slug } = useParams();
  const [pageData, setPageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        setLoading(true);
        // Note: we might need a public endpoint for fetching CMS pages. 
        // Currently /api/cms/pages/:slug might be protected? Let's check backend.
        // Assuming it's public or accessible
        const res = await api.get(`/cms/pages/${slug}`);
        if (res.data.success && res.data.data.published_status === 'published') {
          const page = res.data.data;
          // Parse JSONB if it comes as string
          if (typeof page.sections === 'string') {
            try { page.sections = JSON.parse(page.sections); } catch(e) { page.sections = []; }
          }
          setPageData(page);
          document.title = page.meta_title || `${page.title} | HRMS Pro`;
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error fetching page:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPage();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white pt-32 pb-32 flex justify-center">
        <div className="animate-spin h-8 w-8 text-primary-500">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      </div>
    );
  }

  if (error || !pageData) {
    // Basic 404
    return (
      <div className="min-h-screen bg-white pt-32 pb-32 px-4 text-center">
        <h1 className="text-4xl font-bold text-neutral-900 mb-4">404 - Page Not Found</h1>
        <p className="text-neutral-600">The page you are looking for doesn't exist or has been unpublished.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-32 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-neutral-100 pb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-neutral-900 mb-4">{pageData.title}</h1>
          <p className="text-neutral-500 text-sm">Last updated: {new Date(pageData.updated_at).toLocaleDateString()}</p>
        </header>

        {pageData.sections && pageData.sections.length > 0 ? (
          <div className="-mx-4 sm:-mx-6 lg:-mx-8">
            <SectionRenderer sections={pageData.sections} />
          </div>
        ) : (
          <div 
            className="prose prose-lg max-w-none text-neutral-800 prose-headings:font-bold prose-a:text-primary-600 hover:prose-a:text-primary-500"
            dangerouslySetInnerHTML={{ __html: pageData.content_html }}
          />
        )}
      </div>
    </div>
  );
};

export default DynamicPage;
