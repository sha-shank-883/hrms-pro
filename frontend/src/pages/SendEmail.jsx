import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaEnvelope, FaUsers, FaTimes, FaRobot, FaMagic, FaCheck } from 'react-icons/fa';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { aiIntelligenceService } from '../services';
import AIModal from '../components/ai/AIModal';

const SendEmail = () => {
  const { hasModule } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
    variables: {}
  });
  const [sending, setSending] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showEmployeeSelector, setShowEmployeeSelector] = useState(false);

  // AI Drafter States
  const [showAiDrafterModal, setShowAiDrafterModal] = useState(false);
  const [aiDrafterLoading, setAiDrafterLoading] = useState(false);
  const [aiDrafterError, setAiDrafterError] = useState('');
  const [aiDrafterResult, setAiDrafterResult] = useState(null);
  const [aiDraftPrompt, setAiDraftPrompt] = useState({
    purpose: 'interview_invite',
    recipientName: '',
    recipientRole: '',
    tone: 'Professional & Warm',
    keyDetails: '',
    customInstructions: ''
  });

  const handleGenerateEmailWithAI = async () => {
    setAiDrafterLoading(true);
    setAiDrafterError('');
    setAiDrafterResult(null);

    try {
      const res = await aiIntelligenceService.draftEmail({
        purpose: aiDraftPrompt.purpose,
        recipientName: aiDraftPrompt.recipientName,
        recipientRole: aiDraftPrompt.recipientRole,
        tone: aiDraftPrompt.tone,
        keyDetails: aiDraftPrompt.keyDetails,
        customInstructions: aiDraftPrompt.customInstructions
      });
      setAiDrafterResult(res.data);
    } catch (err) {
      setAiDrafterError(err.response?.data?.message || err.message || 'Failed to draft email with AI');
    } finally {
      setAiDrafterLoading(false);
    }
  };

  const applyAiDraftToEditor = () => {
    if (!aiDrafterResult) return;
    setFormData(prev => ({
      ...prev,
      subject: aiDrafterResult.subject || prev.subject,
      body: aiDrafterResult.bodyText || aiDrafterResult.bodyHtml || prev.body
    }));
    setShowAiDrafterModal(false);
  };

  useEffect(() => {
    loadTemplates();
    loadEmployees();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.get('/email-templates');
      setTemplates(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load email templates');
      console.error('Error loading templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data.data || []);
    } catch (err) {
      console.error('Error loading employees:', err);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setFormData({
      to: '',
      cc: '',
      bcc: '',
      subject: template.subject || '',
      body: template.body_html || template.body_text || '',
      variables: {}
    });

    // Initialize variables
    try {
      const vars = template.variables || {};
      const initialVars = {};
      Object.keys(vars).forEach(key => {
        initialVars[key] = '';
      });
      setFormData(prev => ({
        ...prev,
        variables: initialVars
      }));
    } catch (e) {
      console.error('Error initializing variables:', e);
    }
  };

  const handleVariableChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      variables: {
        ...prev.variables,
        [key]: value
      }
    }));
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();

    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const requestData = {
        template_name: selectedTemplate.name,
        to: formData.to,
        variables: formData.variables
      };

      await api.post('/email-templates/send', requestData);

      alert('Email sent successfully!');
      // Reset form
      setSelectedTemplate(null);
      setFormData({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
        variables: {}
      });
    } catch (err) {
      setError('Failed to send email: ' + (err.response?.data?.message || err.message));
      console.error('Error sending email:', err);
    } finally {
      setSending(false);
    }
  };

  const insertEmployeeEmail = (email) => {
    const currentTo = formData.to;
    const newTo = currentTo ? `${currentTo}, ${email}` : email;
    setFormData(prev => ({
      ...prev,
      to: newTo
    }));
    setShowEmployeeSelector(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Send Email</h1>
        <p className="mt-1 text-sm text-gray-500">
          Send customized emails to employees using templates
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaTimes className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 lg:grid-cols-3 gap-6">
        {/* Template Selection */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Email Templates</h3>
              <p className="mt-1 text-sm text-gray-500">Select a template to customize</p>
            </div>
            <div className="p-4">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`p-3 rounded-md cursor-pointer border ${selectedTemplate?.id === template.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:bg-gray-50'
                      }`}
                  >
                    <h4 className="font-medium text-gray-900">{template.name}</h4>
                    <p className="text-sm text-gray-500 truncate">{template.subject}</p>
                    {template.variables && Object.keys(template.variables).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.keys(template.variables).slice(0, 3).map((key) => (
                          <span
                            key={key}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-blue-800"
                          >
                            {key}
                          </span>
                        ))}
                        {Object.keys(template.variables).length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{Object.keys(template.variables).length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Email Composition */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Compose Email</h3>
              <p className="mt-1 text-sm text-gray-500">Customize and send your email</p>
            </div>
            <div className="p-4">
              {hasModule('ai_assistant') && (
                <div className="mb-5 bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/40 dark:to-purple-950/40 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm">
                      <FaRobot size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">AI Smart HR Email Drafter</h4>
                      <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80">Draft interview invites, offer letters, appraisals, and notices with custom tone.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAiDrafterModal(true)}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-sm flex items-center gap-1.5 shrink-0 transition-all"
                  >
                    <FaMagic size={12} /> Open AI Drafter
                  </button>
                </div>
              )}

              {selectedTemplate ? (
                <form onSubmit={handleSendEmail} className="space-y-4">
                  {/* Recipients */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.to}
                        onChange={(e) => setFormData({ ...formData, to: e.target.value })}
                        required
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="recipient@example.com"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmployeeSelector(true)}
                        className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                        title="Select from employees"
                      >
                        <FaUsers className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* CC/BCC */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        CC
                      </label>
                      <input
                        type="text"
                        value={formData.cc}
                        onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="cc@example.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        BCC
                      </label>
                      <input
                        type="text"
                        value={formData.bcc}
                        onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
                        className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="bcc@example.com"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Variables */}
                  {selectedTemplate.variables && Object.keys(selectedTemplate.variables).length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Template Variables</h4>
                      <div className="space-y-3 p-3 bg-gray-50 rounded-md">
                        {Object.keys(selectedTemplate.variables).map((key) => (
                          <div key={key}>
                            <label className="block text-sm text-gray-600">
                              {key}
                              {selectedTemplate.variables[key].required && (
                                <span className="text-red-500"> *</span>
                              )}
                              {selectedTemplate.variables[key].description && (
                                <span className="text-gray-500 text-xs ml-2">
                                  ({selectedTemplate.variables[key].description})
                                </span>
                              )}
                            </label>
                            <input
                              type="text"
                              value={formData.variables[key] || ''}
                              onChange={(e) => handleVariableChange(key, e.target.value)}
                              required={selectedTemplate.variables[key].required}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Preview */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Email Preview</h4>
                    <div className="border border-gray-300 rounded-md p-4 bg-white min-h-[100px]">
                      {formData.body ? (
                        <div dangerouslySetInnerHTML={{ __html: formData.body }} />
                      ) : (
                        <p className="text-gray-500">Select a template to see preview</p>
                      )}
                    </div>
                  </div>

                  {/* Send Button */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={sending}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      <FaPaperPlane className="-ml-1 mr-2 h-5 w-5" />
                      {sending ? 'Sending...' : 'Send Email'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-12">
                  <FaEnvelope className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No template selected</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Select a template from the list to start composing your email.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Employee Selector Modal */}
      {showEmployeeSelector && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Select Employee
                </h3>
                <button
                  onClick={() => setShowEmployeeSelector(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>

              <div className="mt-2 max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {employees.map((employee) => (
                    <div
                      key={employee.employee_id}
                      onClick={() => insertEmployeeEmail(employee.email)}
                      className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-green-800 font-medium">
                            {employee.first_name?.charAt(0)}{employee.last_name?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </p>
                          <p className="text-sm text-gray-500">{employee.email}</p>
                          {employee.position && (
                            <p className="text-xs text-gray-400">{employee.position}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {employees.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No employees found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* AI Smart HR Email Drafter Modal */}
      <AIModal
        isOpen={showAiDrafterModal}
        onClose={() => setShowAiDrafterModal(false)}
        title="AI Smart HR Email Drafter"
        subtitle="Generate customized, high-converting communications"
        loading={aiDrafterLoading}
        loadingText="Crafting professional email with context and tone..."
        error={aiDrafterError}
        onRetry={handleGenerateEmailWithAI}
        onApply={aiDrafterResult ? applyAiDraftToEditor : handleGenerateEmailWithAI}
        applyText={aiDrafterResult ? "Insert into Email Editor" : "Generate Email"}
      >
        {!aiDrafterResult ? (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Purpose / Context</label>
                <select
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  value={aiDraftPrompt.purpose}
                  onChange={(e) => setAiDraftPrompt({ ...aiDraftPrompt, purpose: e.target.value })}
                >
                  <option value="interview_invite">Interview Invitation & Scheduling</option>
                  <option value="job_offer">Formal Job Offer & Welcome</option>
                  <option value="rejection_talent_pool">Polite Rejection & Talent Pool Retention</option>
                  <option value="employee_announcement">Company Policy / Event Announcement</option>
                  <option value="performance_feedback">Appraisal Feedback & Performance Review</option>
                  <option value="warning_notice">Formal HR Warning / Escalation</option>
                  <option value="custom">Custom HR Communication</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Communication Tone</label>
                <select
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  value={aiDraftPrompt.tone}
                  onChange={(e) => setAiDraftPrompt({ ...aiDraftPrompt, tone: e.target.value })}
                >
                  <option value="Professional & Warm">Professional & Warm (Recommended)</option>
                  <option value="Formal & Executive">Formal & Executive</option>
                  <option value="Enthusiastic & Welcoming">Enthusiastic & Welcoming</option>
                  <option value="Empathetic & Supportive">Empathetic & Supportive</option>
                  <option value="Direct & Urgent">Direct & Urgent</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Recipient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Connor"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  value={aiDraftPrompt.recipientName}
                  onChange={(e) => setAiDraftPrompt({ ...aiDraftPrompt, recipientName: e.target.value })}
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Recipient Role / Position</label>
                <input
                  type="text"
                  placeholder="e.g. Software Engineer Candidate"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                  value={aiDraftPrompt.recipientRole}
                  onChange={(e) => setAiDraftPrompt({ ...aiDraftPrompt, recipientRole: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Key Points to Include (Dates, Location, Specific Perks, Feedback)</label>
              <textarea
                rows="3"
                placeholder="e.g. Technical round scheduled for Monday 10:00 AM via Google Meet. Interviewers will be Jane Doe and John Smith."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                value={aiDraftPrompt.keyDetails}
                onChange={(e) => setAiDraftPrompt({ ...aiDraftPrompt, keyDetails: e.target.value })}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Generated Subject:</span>
              <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">{aiDrafterResult.subject}</p>
            </div>

            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block mb-1">Email Body Preview:</span>
              <div
                className="p-4 bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-700 leading-relaxed text-slate-700 dark:text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap"
              >
                {aiDrafterResult.bodyText || aiDrafterResult.bodyHtml}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setAiDrafterResult(null)}
              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold underline text-xs"
            >
              ← Edit Prompt & Regenerate
            </button>
          </div>
        )}
      </AIModal>
    </div>
  );
};

export default SendEmail;