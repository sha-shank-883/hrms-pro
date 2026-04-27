import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import api from '../../services/api';

const PublicLayout = () => {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/website-settings');
        if (res.data.success && res.data.data) {
          const data = res.data.data;
          const parsedSettings = {
            ...data,
            header_links: typeof data.header_links === 'string' ? JSON.parse(data.header_links) : (data.header_links || []),
            footer_columns: typeof data.footer_columns === 'string' ? JSON.parse(data.footer_columns) : (data.footer_columns || []),
            sections: typeof data.sections === 'string' ? JSON.parse(data.sections) : (data.sections || []),
          };
          setSettings(parsedSettings);
        }
      } catch (e) {
        console.error('Failed to load website settings', e);
      }
    };
    fetchSettings();
  }, []);

  const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const displayImageUrl = (url) => url ? (url.startsWith('http') ? url : `${backendUrl}${url}`) : null;

  return (
    <div className="min-h-screen flex flex-col bg-white text-neutral-900 font-sans" style={settings ? { '--primary-color': settings.primary_color, fontFamily: settings.font_family } : {}}>
      {settings && (
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --primary-color: ${settings.primary_color};
          }
          .text-primary-500 { color: ${settings.primary_color}; }
          .bg-primary-500 { background-color: ${settings.primary_color}; }
          .hover\\:bg-primary-600:hover { filter: brightness(0.9); }
          .hover\\:text-primary-600:hover { filter: brightness(0.9); }
          .border-l-primary-500 { border-left-color: ${settings.primary_color}; }
        `}} />
      )}
      <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Link to="/" className="flex items-center gap-2">
                {settings?.logo_url ? (
                  <img src={displayImageUrl(settings.logo_url)} alt="Logo" className="h-8 object-contain" />
                ) : (
                  <>
                    <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-xl" style={settings?.primary_color ? { backgroundColor: settings.primary_color } : {}}>H</div>
                    <span className="font-bold text-2xl tracking-tight text-neutral-900">HRMS Pro</span>
                  </>
                )}
              </Link>
              <nav className="hidden md:ml-10 md:flex md:space-x-8">
                <Link to="/features" className="text-neutral-600 hover:text-primary-600 font-medium transition-colors">Features</Link>
                <Link to="/pricing" className="text-neutral-600 hover:text-primary-600 font-medium transition-colors">Pricing</Link>
                <Link to="/about" className="text-neutral-600 hover:text-primary-600 font-medium transition-colors">About</Link>
                <Link to="/blog" className="text-neutral-600 hover:text-primary-600 font-medium transition-colors">Blog</Link>
                <Link to="/contact" className="text-neutral-600 hover:text-primary-600 font-medium transition-colors">Contact</Link>
                
                {settings?.header_links?.filter(link => link.isActive !== false && !['/features', '/pricing', '/about', '/blog', '/contact', '/'].includes(link.url)).map(link => (
                  <a key={link.id} href={link.url} className="text-neutral-600 hover:text-primary-600 font-medium transition-colors">
                    {link.label}
                  </a>
                ))}
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="hidden md:inline-flex text-neutral-600 hover:text-neutral-900 font-medium">Log In</Link>
              <Link to="/demo" className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2.5 px-6 rounded-full transition-colors shadow-sm">
                Get a Free Demo
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 pt-20">
        <Outlet context={{ settings, displayImageUrl }} />
      </main>
      
      <footer className="bg-neutral-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-8 justify-between">
          <div className="w-full md:w-auto md:flex-1 md:max-w-xs">
            <div className="flex items-center gap-2 mb-4">
              {settings?.logo_url ? (
                  <img src={displayImageUrl(settings.logo_url)} alt="Logo" className="h-8 object-contain grayscale brightness-200" />
              ) : (
                <>
                  <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center text-white font-bold" style={settings?.primary_color ? { backgroundColor: settings.primary_color } : {}}>H</div>
                  <span className="font-bold text-xl tracking-tight">HRMS Pro</span>
                </>
              )}
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">Setting people free to do great work.</p>
          </div>
          
          {settings?.footer_columns?.filter(col => col.isActive !== false).map(col => (
            <div key={col.id} className="w-full sm:w-1/2 md:w-auto">
              <h4 className="font-semibold mb-4 text-white">{col.title}</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                {col.links?.filter(link => link.isActive !== false).map(link => (
                  <li key={link.id}>
                    <a href={link.url} className="hover:text-primary-400 transition-colors">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-neutral-800 text-sm text-neutral-500 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} HRMS Pro. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
