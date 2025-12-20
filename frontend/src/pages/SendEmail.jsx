import React, { useState, useEffect } from 'react';
import { FaPaperPlane, FaEnvelope, FaUsers, FaTimes } from 'react-icons/fa';
import api from '../services/api';

const SendEmail = () => {
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                    className={`p-3 rounded-md cursor-pointer border ${
                      selectedTemplate?.id === template.id
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
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
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
                        onChange={(e) => setFormData({...formData, to: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, cc: e.target.value})}
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
                        onChange={(e) => setFormData({...formData, bcc: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
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
    </div>
  );
};

export default SendEmail;