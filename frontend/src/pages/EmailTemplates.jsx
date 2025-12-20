import React, { useState, useEffect, useRef } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes, FaEnvelope, FaBold, FaItalic, FaUnderline, FaAlignLeft, FaAlignCenter, FaAlignRight, FaListUl, FaListOl, FaLink, FaImage, FaPalette, FaCode } from 'react-icons/fa';
import api from '../services/api';

const EmailTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    body_html: '',
    body_text: '',
    variables: '{}'
  });
  
  const [editorMode, setEditorMode] = useState('visual'); // 'visual' or 'code'
  const [selection, setSelection] = useState(null);
  const editorRef = useRef(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [sendData, setSendData] = useState({
    to: '',
    variables: {}
  });

  useEffect(() => {
    loadTemplates();
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

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({
      name: '',
      subject: '',
      body_html: '',
      body_text: '',
      variables: '{}'
    });
    setShowForm(true);
  };
  
  const handleCreateWelcomeTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: 'Welcome Email',
      subject: 'Welcome to {{company_name}}!',
      body_html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #2c3e50;">Welcome to {{company_name}}!</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p>Hi {{first_name}},</p>
            <p>Welcome to our team! We're excited to have you on board.</p>
            <p>Here are your account details:</p>
            <ul>
              <li><strong>Email:</strong> {{email}}</li>
              <li><strong>Position:</strong> {{position}}</li>
              <li><strong>Department:</strong> {{department}}</li>
              <li><strong>Start Date:</strong> {{start_date}}</li>
            </ul>
            <p>Your temporary password is: <strong>{{temp_password}}</strong></p>
            <p>Please log in and change your password as soon as possible.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="display: inline-block; padding: 12px 24px; background-color: #3498db; color: white; text-decoration: none; border-radius: 4px;">Log In to Your Account</a>
            </div>
            <p>Best regards,<br/>The HR Team</p>
          </div>
          <div style="padding: 20px; text-align: center; background-color: #f8f9fa; color: #7f8c8d; font-size: 12px;">
            <p>&copy; 2025 {{company_name}}. All rights reserved.</p>
          </div>
        </div>
      `,
      body_text: `Welcome to {{company_name}}!

Hi {{first_name}},

Welcome to our team! We're excited to have you on board.

Here are your account details:
- Email: {{email}}
- Position: {{position}}
- Department: {{department}}
- Start Date: {{start_date}}

Your temporary password is: {{temp_password}}

Please log in and change your password as soon as possible.

Best regards,
The HR Team`,
      variables: JSON.stringify({
        company_name: { required: true, type: 'string', description: 'Company name' },
        first_name: { required: true, type: 'string', description: 'Employee first name' },
        email: { required: true, type: 'string', description: 'Employee email' },
        position: { required: true, type: 'string', description: 'Employee position' },
        department: { required: true, type: 'string', description: 'Employee department' },
        start_date: { required: true, type: 'string', description: 'Employee start date' },
        temp_password: { required: true, type: 'string', description: 'Temporary password' }
      }, null, 2)
    });
    setShowForm(true);
  };
  
  const handleCreateLeaveApprovedTemplate = () => {
    setEditingTemplate(null);
    setFormData({
      name: 'Leave Approved',
      subject: 'Your Leave Request Has Been Approved',
      body_html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
            <h1 style="color: #27ae60;">Leave Approved!</h1>
          </div>
          <div style="padding: 30px; background-color: #ffffff;">
            <p>Hi {{employee_name}},</p>
            <p>Great news! Your leave request has been approved.</p>
            <div style="background-color: #e8f5e9; padding: 20px; border-radius: 4px; margin: 20px 0;">
              <h3 style="margin-top: 0;">Leave Details</h3>
              <ul>
                <li><strong>Type:</strong> {{leave_type}}</li>
                <li><strong>Dates:</strong> {{start_date}} to {{end_date}}</li>
              </ul>
            </div>
            <p>If you have any questions, please contact your manager.</p>
            <p>Enjoy your time off!</p>
            <p>Best regards,<br/>The HR Team</p>
          </div>
          <div style="padding: 20px; text-align: center; background-color: #f8f9fa; color: #7f8c8d; font-size: 12px;">
            <p>&copy; 2025 {{company_name}}. All rights reserved.</p>
          </div>
        </div>
      `,
      body_text: `Leave Approved!

Hi {{employee_name}},

Great news! Your leave request has been approved.

Leave Details:
- Type: {{leave_type}}
- Dates: {{start_date}} to {{end_date}}

If you have any questions, please contact your manager.

Enjoy your time off!

Best regards,
The HR Team`,
      variables: JSON.stringify({
        employee_name: { required: true, type: 'string', description: 'Employee name' },
        leave_type: { required: true, type: 'string', description: 'Type of leave' },
        start_date: { required: true, type: 'string', description: 'Leave start date' },
        end_date: { required: true, type: 'string', description: 'Leave end date' },
        company_name: { required: true, type: 'string', description: 'Company name' }
      }, null, 2)
    });
    setShowForm(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      subject: template.subject,
      body_html: template.body_html || '',
      body_text: template.body_text || '',
      variables: JSON.stringify(template.variables || {}, null, 2)
    });
    setShowForm(true);
  };
  
  const handleSendTest = (template) => {
    setEditingTemplate(template);
    try {
      const vars = template.variables || {};
      const initialVars = {};
      Object.keys(vars).forEach(key => {
        initialVars[key] = '';
      });
      setSendData({
        to: '',
        variables: initialVars
      });
    } catch (e) {
      setSendData({
        to: '',
        variables: {}
      });
    }
    setShowSendModal(true);
  };
  
  const handleSendEmail = async (e) => {
    e.preventDefault();
    
    try {
      const requestData = {
        template_name: editingTemplate.name,
        to: sendData.to,
        variables: sendData.variables
      };
      
      await api.post('/email-templates/send', requestData);
      
      alert('Email sent successfully!');
      setShowSendModal(false);
    } catch (err) {
      alert('Failed to send email: ' + (err.response?.data?.message || err.message));
      console.error('Error sending email:', err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await api.delete(`/email-templates/${id}`);
        loadTemplates();
      } catch (err) {
        setError('Failed to delete template');
        console.error('Error deleting template:', err);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate JSON
      let variablesObj = {};
      if (formData.variables) {
        variablesObj = JSON.parse(formData.variables);
      }
      
      const submitData = {
        ...formData,
        variables: variablesObj
      };
      
      if (editingTemplate) {
        await api.put(`/email-templates/${editingTemplate.id}`, submitData);
      } else {
        await api.post('/email-templates', submitData);
      }
      
      setShowForm(false);
      loadTemplates();
    } catch (err) {
      setError('Failed to save template: ' + (err.response?.data?.message || err.message));
      console.error('Error saving template:', err);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingTemplate(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Rich text editor functions
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current.focus();
  };
  
  const handleEditorChange = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      setFormData(prev => ({
        ...prev,
        body_html: content
      }));
    }
  };
  
  const handleEditorInput = () => {
    handleEditorChange();
  };
  
  const handleEditorBlur = () => {
    handleEditorChange();
  };
  
  const insertVariable = (variable) => {
    const formattedVar = `{{${variable}}}`;
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(formattedVar));
        handleEditorChange();
      }
    }
  };
  
  const getAvailableVariables = () => {
    try {
      const vars = JSON.parse(formData.variables);
      return Object.keys(vars);
    } catch (e) {
      return [];
    }
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Templates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage email templates for automated communications
          </p>
          <p className="mt-2 text-sm text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
              <FaEnvelope className="mr-1" /> New
            </span>
            Use the envelope icon next to templates to send test emails
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCreate}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <FaPlus className="-ml-1 mr-2 h-5 w-5" />
            Create Template
          </button>
          <div className="relative group inline-block">
            <button
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaPlus className="-ml-1 mr-2 h-5 w-5" />
              Sample Templates
            </button>
            <div className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-10 border border-gray-200">
              <button
                onClick={handleCreateWelcomeTemplate}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Welcome Email
              </button>
              <button
                onClick={handleCreateLeaveApprovedTemplate}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                Leave Approved
              </button>
            </div>
          </div>
        </div>
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

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
                </h3>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Template Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                    Subject
                  </label>
                  <input
                    type="text"
                    name="subject"
                    id="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="body_html" className="block text-sm font-medium text-gray-700">
                    HTML Body
                  </label>
                  
                  {/* Editor Mode Toggle */}
                  <div className="flex border-b border-gray-200 mb-2">
                    <button
                      type="button"
                      onClick={() => setEditorMode('visual')}
                      className={`px-4 py-2 text-sm font-medium ${editorMode === 'visual' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Visual Editor
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('code')}
                      className={`px-4 py-2 text-sm font-medium ${editorMode === 'code' ? 'border-b-2 border-green-500 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      Code Editor
                    </button>
                  </div>
                  
                  {editorMode === 'visual' && (
                    <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded">
                      <strong>Visual Editor Tips:</strong> Use the toolbar to format text. Click "Variables" to insert template variables. Switch to Code Editor for direct HTML editing.
                    </div>
                  )}
                  
                  {editorMode === 'visual' ? (
                    <>
                      {/* Toolbar */}
                      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-300 rounded-t-md">
                        <button
                          type="button"
                          onClick={() => formatText('bold')}
                          className="p-2 rounded hover:bg-gray-200"
                          title="Bold"
                        >
                          <FaBold />
                        </button>
                        <button
                          type="button"
                          onClick={() => formatText('italic')}
                          className="p-2 rounded hover:bg-gray-200"
                          title="Italic"
                        >
                          <FaItalic />
                        </button>
                        <button
                          type="button"
                          onClick={() => formatText('underline')}
                          className="p-2 rounded hover:bg-gray-200"
                          title="Underline"
                        >
                          <FaUnderline />
                        </button>
                        <div className="border-r border-gray-300 mx-1"></div>
                        <button
                          type="button"
                          onClick={() => formatText('justifyLeft')}
                          className="p-2 rounded hover:bg-gray-200"
                          title="Align Left"
                        >
                          <FaAlignLeft />
                        </button>
                        <button
                          type="button"
                          onClick={() => formatText('justifyCenter')}
                          className="p-2 rounded hover:bg-gray-200"
                          title="Align Center"
                        >
                          <FaAlignCenter />
                        </button>
                        <button
                          type="button"
                          onClick={() => formatText('justifyRight')}
                          className="p-2 rounded hover:bg-gray-200"
                          title="Align Right"
                        >
                          <FaAlignRight />
                        </button>
                        <div className="border-r border-gray-300 mx-1"></div>
                        <button
                          type="button"
                          onClick={() => formatText('insertUnorderedList')}
                          className="p-2 rounded hover:bg-gray-200"
                          title="Bullet List"
                        >
                          <FaListUl />
                        </button>
                        <button
                          type="button"
                          onClick={() => formatText('insertOrderedList')}
                          className="p-2 rounded hover:bg-gray-200"
                          title="Numbered List"
                        >
                          <FaListOl />
                        </button>
                        <div className="border-r border-gray-300 mx-1"></div>
                        <div className="relative group">
                          <button
                            type="button"
                            className="p-2 rounded hover:bg-gray-200 flex items-center"
                            title="Insert Variable"
                          >
                            <FaCode className="mr-1" /> Variables
                          </button>
                          <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 hidden group-hover:block z-10 border border-gray-200">
                            {getAvailableVariables().length > 0 ? (
                              getAvailableVariables().map(variable => (
                                <button
                                  key={variable}
                                  type="button"
                                  onClick={() => insertVariable(variable)}
                                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  {{variable}}
                                </button>
                              ))
                            ) : (
                              <div className="px-4 py-2 text-sm text-gray-500">No variables defined</div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Visual Editor */}
                      <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleEditorInput}
                        onBlur={handleEditorBlur}
                        dangerouslySetInnerHTML={{ __html: formData.body_html }}
                        className="min-h-[200px] p-4 border border-gray-300 rounded-b-md focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500"
                        style={{ minHeight: '200px' }}
                      />
                    </>
                  ) : (
                    /* Code Editor */
                    <textarea
                      name="body_html"
                      id="body_html"
                      rows={10}
                      value={formData.body_html}
                      onChange={handleChange}
                      className="mt-1 block w-full font-mono text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Enter HTML code here..."
                    />
                  )}
                </div>
                
                <div>
                  <label htmlFor="body_text" className="block text-sm font-medium text-gray-700">
                    Text Body
                  </label>
                  <textarea
                    name="body_text"
                    id="body_text"
                    rows={4}
                    value={formData.body_text}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="variables" className="block text-sm font-medium text-gray-700">
                    Variables (JSON)
                  </label>
                  <textarea
                    name="variables"
                    id="variables"
                    rows={4}
                    value={formData.variables}
                    onChange={handleChange}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 font-mono text-sm"
                    placeholder='{"variable_name": {"required": true, "type": "string", "description": "Description"}}'
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Define required variables for this template in JSON format
                  </p>
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-xs text-blue-700">
                      <strong>Tip:</strong> Use variables in your template with double curly braces, e.g., {'{{first_name}}'}. 
                      Insert variables using the "Variables" button in the visual editor toolbar.
                    </p>
                  </div>
                </div>
                
                {/* Preview Button */}
                <div className="flex justify-between items-center pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      // Open preview in new tab
                      const previewWindow = window.open('', '_blank');
                      previewWindow.document.write(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <title>Email Preview</title>
                          <style>
                            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                            .email-container { max-width: 600px; margin: 0 auto; }
                          </style>
                        </head>
                        <body>
                          <div class="email-container">
                            ${formData.body_html || '<p>Email content will appear here</p>'}
                          </div>
                        </body>
                        </html>
                      `);
                      previewWindow.document.close();
                    }}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Preview Email
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <FaSave className="-ml-1 mr-2 h-5 w-5" />
                      Save Template
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {templates.length === 0 ? (
            <li className="px-6 py-12 text-center">
              <FaEnvelope className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No templates</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new email template.
              </p>
              <div className="mt-6">
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                  New Template
                </button>
              </div>
            </li>
          ) : (
            templates.map((template) => (
              <li key={template.id}>
                <div className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-green-600 truncate">
                          {template.name}
                        </p>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {template.subject}
                      </p>
                      <div className="mt-2 text-xs text-gray-400 truncate">
                        {template.body_html ? (
                          <span dangerouslySetInnerHTML={{ __html: template.body_html.replace(/<[^>]*>/g, '').substring(0, 100) + '...' }} />
                        ) : (
                          'No preview available'
                        )}
                      </div>
                      <div className="mt-2 flex items-center text-xs text-gray-400">
                        <span>
                          Created {new Date(template.created_at).toLocaleDateString()}
                        </span>
                        {template.updated_at !== template.created_at && (
                          <span className="ml-2">
                            • Updated {new Date(template.updated_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => handleEdit(template)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        title="Edit Template"
                      >
                        <FaEdit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleSendTest(template)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        title="Send Test Email"
                      >
                        <FaEnvelope className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        title="Delete Template"
                      >
                        <FaTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  {template.variables && Object.keys(template.variables).length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500">Required Variables:</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {Object.entries(template.variables).map(([key, value]) => (
                          <span 
                            key={key} 
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {key}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
      
      {/* Send Email Modal */}
      {showSendModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium leading-6 text-gray-900">
                  Send Test Email: {editingTemplate?.name}
                </h3>
                <button
                  onClick={() => setShowSendModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <FaTimes className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    name="to"
                    id="to"
                    value={sendData.to}
                    onChange={(e) => setSendData({...sendData, to: e.target.value})}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="recipient@example.com"
                  />
                </div>
                
                {editingTemplate?.variables && Object.keys(editingTemplate.variables).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Template Variables</h4>
                    <div className="space-y-3">
                      {Object.keys(editingTemplate.variables).map((key) => (
                        <div key={key}>
                          <label htmlFor={`var_${key}`} className="block text-sm text-gray-600">
                            {key}
                            {editingTemplate.variables[key].required && (
                              <span className="text-red-500"> *</span>
                            )}
                            {editingTemplate.variables[key].description && (
                              <span className="text-gray-500 text-xs ml-2">
                                ({editingTemplate.variables[key].description})
                              </span>
                            )}
                          </label>
                          <input
                            type="text"
                            id={`var_${key}`}
                            value={sendData.variables[key] || ''}
                            onChange={(e) => setSendData({
                              ...sendData,
                              variables: {
                                ...sendData.variables,
                                [key]: e.target.value
                              }
                            })}
                            required={editingTemplate.variables[key].required}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowSendModal(false)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FaEnvelope className="-ml-1 mr-2 h-5 w-5" />
                    Send Email
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;