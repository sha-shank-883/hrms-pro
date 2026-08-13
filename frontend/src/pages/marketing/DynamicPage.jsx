import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import SectionRendererV2 from '../../components/common/SectionRendererV2';
import { useWebsiteBuilder } from '../../contexts/WebsiteBuilderContext';

const DynamicPage = () => {
  const { slug } = useParams();
  const { themeMode, displayImageUrl, settings } = useWebsiteBuilder();
  const [page, setPage] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        setLoading(true);
        setNotFound(false);
        const path = slug ? `/website/pages/public/${slug}` : '/website/pages/home';
        const res = await api.get(path);
        if (!active) return;
        if (res.data?.success && res.data?.data) {
          setPage(res.data.data);
        } else {
          setNotFound(true);
        }
      } catch {
        if (!active) return;
        setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => { active = false; };
  }, [slug]);

  useEffect(() => {
    if (page?.meta_title) document.title = page.meta_title;
    else if (page?.title) document.title = `${page.title} | ${settings.company_name || 'HRMS Pro'}`;
    if (page?.meta_description) {
      const tag = document.querySelector('meta[name="description"]');
      if (tag) tag.setAttribute('content', page.meta_description);
    }
  }, [page, settings.company_name]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl px-6">
          <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-2/3 mx-auto" />
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-lg w-1/2 mx-auto" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-24">
        <p className="text-6xl font-bold text-gray-200 dark:text-gray-700 mb-4">404</p>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {settings.company_name ? 'Page Not Found' : 'Page Not Found'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md">
          The page you are looking for does not exist or has not been published yet.
        </p>
        <Link to="/" className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all duration-200">
          Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div>
      {page.custom_css && <style>{page.custom_css}</style>}
      <SectionRendererV2
        sections={page.sections || []}
        themeMode={themeMode}
        displayImageUrl={displayImageUrl}
      />
      {page.custom_js && (
        <script dangerouslySetInnerHTML={{ __html: page.custom_js }} />
      )}
    </div>
  );
};

export default DynamicPage;
