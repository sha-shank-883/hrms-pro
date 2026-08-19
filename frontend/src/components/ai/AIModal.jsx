import React, { useState } from 'react';
import {
  SparklesIcon,
  XMarkIcon,
  CheckIcon,
  ClipboardDocumentCheckIcon,
  ArrowPathIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  EnvelopeIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const AIModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon = SparklesIcon,
  loading,
  loadingText = 'AI is thinking and analyzing...',
  error,
  children,
  onApply,
  applyText = 'Apply to Form',
  onRetry,
  footer
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (textToCopy) => {
    if (!textToCopy) return;
    navigator.clipboard.writeText(typeof textToCopy === 'string' ? textToCopy : JSON.stringify(textToCopy, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-indigo-100 dark:border-indigo-900/40 overflow-hidden transform transition-all animate-fadeIn">
        {/* Top Gradient Header Accent */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/50">
              <Icon className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {title || 'AI Intelligence'}
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm">
                  Pro AI
                </span>
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-indigo-200 dark:border-indigo-900 border-t-indigo-600 animate-spin" />
                <SparklesIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="mt-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                {loadingText}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Analyzing with Gemini 2.0 & Groq AI Engine...
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300">
              <div className="flex items-start gap-3">
                <ExclamationTriangleIcon className="w-5 h-5 mt-0.5 shrink-0" />
                <div className="flex-1 text-xs">
                  <p className="font-semibold">AI Generation Notice</p>
                  <p className="mt-1">{error}</p>
                  {onRetry && (
                    <button
                      onClick={onRetry}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                      <ArrowPathIcon className="w-3.5 h-3.5" /> Retry Action
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            children
          )}
        </div>

        {/* Modal Footer */}
        {!loading && (
          <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <SparklesIcon className="w-3.5 h-3.5 text-indigo-500" /> Multi-Tenant AI Safe
              </span>
            </div>
            <div className="flex items-center gap-2">
              {footer ? (
                footer
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
                  >
                    Close
                  </button>
                  {onApply && (
                    <button
                      type="button"
                      onClick={onApply}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-md hover:shadow-lg transition-all"
                    >
                      <CheckIcon className="w-4 h-4" />
                      {applyText}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIModal;
