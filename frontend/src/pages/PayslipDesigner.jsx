import React, { useEffect, useState } from 'react';
import { payrollService } from '../services';
import {
  FaPalette,
  FaPlus,
  FaEdit,
  FaTrash,
  FaStar,
  FaRegStar,
  FaTimes,
  FaSave,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaCog,
  FaEye,
  FaEyeSlash,
  FaArrowUp,
  FaArrowDown,
  FaFileInvoiceDollar,
  FaImage,
  FaQrcode,
  FaSignature,
  FaPaintRoller,
  FaEye as FaEyeIcon,
  FaChevronUp,
  FaChevronDown
} from 'react-icons/fa';

const DEFAULT_LAYOUT = {
  colors: {
    primary: '#4f46e5',
    accent: '#10b981',
    background: '#ffffff',
    text: '#1e293b',
    subtext: '#64748b',
    border: '#e2e8f0',
  },
  show_logo: true,
  logo_position: 'top-left',
  show_company_name: true,
  show_qr_code: false,
  show_signature: false,
  currency_symbol: 'auto',
  sections: [
    {
      key: 'employee_details',
      label: 'Employee Details',
      fields: ['employee_name', 'employee_code', 'department', 'designation', 'pan', 'bank_account']
    },
    {
      key: 'earnings',
      label: 'Earnings',
      fields: ['basic_salary', 'hra', 'da', 'conveyance', 'medical_allowance', 'special_allowance', 'overtime_pay', 'bonus', 'gross_pay']
    },
    {
      key: 'deductions',
      label: 'Deductions',
      fields: ['pf', 'esi', 'professional_tax', 'tds', 'social_security', 'medicare', 'total_deductions']
    },
    {
      key: 'summary',
      label: 'Summary',
      fields: ['net_pay', 'payment_status', 'pay_date']
    }
  ],
  excluded_fields: [],
  field_order: []
};

const AVAILABLE_FIELDS = [
  { key: 'employee_name', label: 'Employee Name', section: 'details' },
  { key: 'employee_code', label: 'Employee Code', section: 'details' },
  { key: 'department', label: 'Department', section: 'details' },
  { key: 'designation', label: 'Designation', section: 'details' },
  { key: 'pan', label: 'PAN Number', section: 'details' },
  { key: 'bank_account', label: 'Bank Account', section: 'details' },
  { key: 'uan', label: 'UAN', section: 'details' },
  { key: 'esic', label: 'ESIC Number', section: 'details' },
  { key: 'basic_salary', label: 'Basic Salary', section: 'earnings' },
  { key: 'hra', label: 'HRA', section: 'earnings' },
  { key: 'da', label: 'Dearness Allowance', section: 'earnings' },
  { key: 'conveyance', label: 'Conveyance Allowance', section: 'earnings' },
  { key: 'medical_allowance', label: 'Medical Allowance', section: 'earnings' },
  { key: 'special_allowance', label: 'Special Allowance', section: 'earnings' },
  { key: 'overtime_pay', label: 'Overtime Pay', section: 'earnings' },
  { key: 'bonus', label: 'Bonus', section: 'earnings' },
  { key: 'gross_pay', label: 'Gross Pay', section: 'earnings' },
  { key: 'pf', label: 'PF', section: 'deductions' },
  { key: 'esi', label: 'ESI', section: 'deductions' },
  { key: 'professional_tax', label: 'Professional Tax', section: 'deductions' },
  { key: 'tds', label: 'TDS', section: 'deductions' },
  { key: 'social_security', label: 'Social Security', section: 'deductions' },
  { key: 'medicare', label: 'Medicare', section: 'deductions' },
  { key: 'total_deductions', label: 'Total Deductions', section: 'deductions' },
  { key: 'net_pay', label: 'Net Pay', section: 'summary' },
  { key: 'payment_status', label: 'Payment Status', section: 'summary' },
  { key: 'pay_date', label: 'Pay Date', section: 'summary' },
  { key: 'working_days', label: 'Working Days', section: 'details' },
  { key: 'present_days', label: 'Present Days', section: 'details' },
  { key: 'absent_days', label: 'Absent Days', section: 'details' },
  { key: 'company_name', label: 'Company Name', section: 'details' },
  { key: 'company_address', label: 'Company Address', section: 'details' },
  { key: 'company_logo_url', label: 'Company Logo', section: 'details' }
];

const SECTION_COLORS = {
  details: 'bg-primary-50 border-primary-200 text-blue-700',
  earnings: 'bg-green-50 border-green-200 text-green-700',
  deductions: 'bg-red-50 border-red-200 text-red-700',
  summary: 'bg-secondary-50 border-secondary-200 text-secondary-700'
};

const SectionBadge = ({ section }) => {
  const color = SECTION_COLORS[section] || 'bg-gray-50 border-gray-200 text-gray-700';
  return <span className={`text-xs font-medium px-2 py-0.5 rounded border ${color}`}>{section}</span>;
};

const PayslipDesigner = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    description: '',
    layout_json: DEFAULT_LAYOUT
  });
  const [expandedSections, setExpandedSections] = useState({});
  const [showDesignSettings, setShowDesignSettings] = useState(true);

  useEffect(() => { loadTemplates(); }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await payrollService.getTemplates();
      setTemplates(response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load templates: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const openEditor = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      const layout = template.layout_json || DEFAULT_LAYOUT;
      setTemplateForm({
        name: template.name || '',
        description: template.description || '',
        layout_json: typeof layout === 'string' ? JSON.parse(layout) : layout
      });
    } else {
      setEditingTemplate(null);
      setTemplateForm({ name: '', description: '', layout_json: JSON.parse(JSON.stringify(DEFAULT_LAYOUT)) });
    }
    setShowEditor(true);
    setExpandedSections({});
    setShowDesignSettings(true);
  };

  const updateLayout = (updater) => {
    setTemplateForm(prev => ({
      ...prev,
      layout_json: updater(prev.layout_json)
    }));
  };

  const toggleFieldExclusion = (fieldKey) => {
    updateLayout(layout => {
      const excluded = [...(layout.excluded_fields || [])];
      const idx = excluded.indexOf(fieldKey);
      if (idx >= 0) excluded.splice(idx, 1);
      else excluded.push(fieldKey);
      return { ...layout, excluded_fields: excluded };
    });
  };

  const isFieldExcluded = (fieldKey) => {
    return (templateForm.layout_json.excluded_fields || []).includes(fieldKey);
  };

  const getFieldsForSection = (sectionKey) => {
    const section = (templateForm.layout_json.sections || []).find(s => s.key === sectionKey);
    return section?.fields || [];
  };

  const moveField = (sectionKey, fieldKey, direction) => {
    updateLayout(layout => {
      const sections = JSON.parse(JSON.stringify(layout.sections || []));
      const section = sections.find(s => s.key === sectionKey);
      if (!section) return layout;
      const idx = section.fields.indexOf(fieldKey);
      if (idx < 0) return layout;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= section.fields.length) return layout;
      [section.fields[idx], section.fields[newIdx]] = [section.fields[newIdx], section.fields[idx]];
      return { ...layout, sections };
    });
  };

  const moveSection = (sectionKey, direction) => {
    updateLayout(layout => {
      const sections = JSON.parse(JSON.stringify(layout.sections || []));
      const idx = sections.findIndex(s => s.key === sectionKey);
      if (idx < 0) return layout;
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= sections.length) return layout;
      [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
      return { ...layout, sections };
    });
  };

  const updateColor = (colorKey, value) => {
    updateLayout(layout => ({
      ...layout,
      colors: { ...(layout.colors || DEFAULT_LAYOUT.colors), [colorKey]: value }
    }));
  };

  const handleSave = async () => {
    if (!templateForm.name.trim()) {
      setError('Template name is required');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const payload = {
        name: templateForm.name,
        description: templateForm.description,
        layout_json: templateForm.layout_json
      };
      if (editingTemplate) {
        await payrollService.updateTemplate(editingTemplate.template_id, payload);
        setSuccess('Template updated successfully');
      } else {
        await payrollService.createTemplate(payload);
        setSuccess('Template created successfully');
      }
      setShowEditor(false);
      loadTemplates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id) => {
    try {
      setError('');
      await payrollService.setDefaultTemplate(id);
      setSuccess('Default template updated');
      loadTemplates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to set default');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    try {
      setError('');
      await payrollService.deleteTemplate(id);
      setSuccess('Template deleted');
      loadTemplates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete template');
    }
  };

  const colors = templateForm.layout_json.colors || DEFAULT_LAYOUT.colors;
  const layout = templateForm.layout_json;

  return (
    <div className="w-full pb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payslip Designer</h1>
          <p className="text-sm text-gray-500 mt-1">Design your payslip layout — colors, fields, sections, and more</p>
        </div>
        <button onClick={() => openEditor()}
          className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2">
          <FaPlus /> New Template
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200 flex items-center gap-3">
          <FaExclamationTriangle /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700"><FaTimes /></button>
        </div>
      )}
      {success && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 border border-green-200 flex items-center gap-3">
          <FaCheckCircle /> {success}
          <button onClick={() => setSuccess('')} className="ml-auto text-green-500 hover:text-green-700"><FaTimes /></button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <FaSpinner className="animate-spin text-3xl text-primary-600" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <FaPalette className="text-5xl mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium text-gray-500">No payslip templates</p>
          <p className="text-sm mt-1">Create your first payslip template to design your organization's payslip layout</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(template => (
            <div key={template.template_id} className={`bg-white rounded-2xl border p-6 shadow-sm hover:shadow-md transition-all ${template.is_default ? 'border-primary-300 ring-1 ring-primary-200' : 'border-gray-100'}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{template.name}</h3>
                  {template.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{template.description}</p>}
                </div>
                {template.is_default && (
                  <span className="flex-shrink-0 ml-2 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded-lg flex items-center gap-1">
                    <FaStar /> Default
                  </span>
                )}
              </div>

              {template.layout_json?.colors && (
                <div className="flex gap-2 mb-3">
                  {Object.entries(template.layout_json.colors).filter(([k]) => k !== 'background').map(([k, v]) => (
                    <div key={k} className="w-5 h-5 rounded-full border border-gray-200" style={{ backgroundColor: v }} title={k} />
                  ))}
                </div>
              )}

              <div className="text-xs text-gray-400 mb-4">
                Created {new Date(template.created_at).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => openEditor(template)} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-all flex items-center gap-1.5">
                  <FaEdit /> Edit
                </button>
                <button onClick={async () => { try { await payrollService.previewTemplate(template.template_id); } catch (e) { setError(e.response?.data?.message || 'Preview failed'); } }} className="px-3 py-1.5 border border-primary-200 text-primary-600 text-xs font-semibold rounded-lg hover:bg-primary-50 transition-all flex items-center gap-1.5">
                  <FaFileInvoiceDollar /> Preview
                </button>
                {!template.is_default && (
                  <button onClick={() => setDefault(template.template_id)} className="px-3 py-1.5 border border-gray-200 text-gray-600 text-xs font-semibold rounded-lg hover:bg-amber-50 transition-all flex items-center gap-1.5">
                    <FaRegStar /> Set Default
                  </button>
                )}
                <button onClick={() => handleDelete(template.template_id)}
                  className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-all flex items-center gap-1.5 ml-auto">
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowEditor(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editingTemplate ? 'Edit Template' : 'Create Template'}</h2>
              <button onClick={() => setShowEditor(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><FaTimes /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Template Name *</label>
                  <input type="text" value={templateForm.name} onChange={e => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                    className="form-input" placeholder="e.g. Standard Payslip" />
                </div>
                <div>
                  <label className="form-label">Description</label>
                  <input type="text" value={templateForm.description} onChange={e => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                    className="form-input" placeholder="Brief description" />
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowDesignSettings(!showDesignSettings)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                    <FaPaintRoller className="text-primary-600" /> Design Settings
                  </h3>
                  {showDesignSettings ? <FaChevronUp className="text-gray-400" /> : <FaChevronDown className="text-gray-400" />}
                </button>

                {showDesignSettings && (
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        { key: 'primary', label: 'Primary' },
                        { key: 'accent', label: 'Accent' },
                        { key: 'text', label: 'Text' },
                        { key: 'subtext', label: 'Subtext' },
                        { key: 'border', label: 'Border' },
                        { key: 'background', label: 'Background' },
                      ].map(({ key, label }) => (
                        <div key={key}>
                          <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
                          <div className="flex items-center gap-2">
                            <input type="color" value={colors[key] || '#000000'}
                              onChange={e => updateColor(key, e.target.value)}
                              className="w-8 h-8 rounded cursor-pointer border border-gray-200" />
                            <input type="text" value={colors[key] || ''}
                              onChange={e => updateColor(key, e.target.value)}
                              className="w-full text-xs border border-gray-200 rounded px-1 py-1" />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-gray-100">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={layout.show_logo !== false}
                          onChange={e => updateLayout(l => ({ ...l, show_logo: e.target.checked }))} />
                        Show Company Logo
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={layout.show_company_name !== false}
                          onChange={e => updateLayout(l => ({ ...l, show_company_name: e.target.checked }))} />
                        Show Company Name
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={layout.show_qr_code === true}
                          onChange={e => updateLayout(l => ({ ...l, show_qr_code: e.target.checked }))} />
                        Show QR Code
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={layout.show_signature === true}
                          onChange={e => updateLayout(l => ({ ...l, show_signature: e.target.checked }))} />
                        Show Signature Line
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Logo Position</label>
                        <select value={layout.logo_position || 'top-left'}
                          onChange={e => updateLayout(l => ({ ...l, logo_position: e.target.value }))}
                          className="form-input text-sm">
                          <option value="top-left">Top Left</option>
                          <option value="top-right">Top Right</option>
                          <option value="top-center">Top Center</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-500 block mb-1">Currency Symbol</label>
                        <select value={layout.currency_symbol || 'auto'}
                          onChange={e => updateLayout(l => ({ ...l, currency_symbol: e.target.value }))}
                          className="form-input text-sm">
                          <option value="auto">Auto (from settings)</option>
                          <option value="$">$ (USD)</option>
                          <option value="₹">₹ (INR)</option>
                          <option value="€">€ (EUR)</option>
                          <option value="£">£ (GBP)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FaCog /> Layout Configuration
                </h3>
                <p className="text-sm text-gray-500 mb-4">Reorder sections, toggle fields on/off, and arrange field order.</p>

                {(templateForm.layout_json.sections || []).map((section, sectionIdx) => {
                  const fields = section.fields || [];
                  const visibleFields = fields.filter(f => !isFieldExcluded(f));
                  const hiddenFields = fields.filter(f => isFieldExcluded(f));
                  const sectionColor = SECTION_COLORS[section.key === 'employee_details' ? 'details' : section.key === 'earnings' ? 'earnings' : section.key === 'deductions' ? 'deductions' : 'summary'];

                  return (
                    <div key={section.key} className="mb-4 border border-gray-200 rounded-xl overflow-hidden">
                      <div className={`flex items-center justify-between px-4 py-3 ${sectionColor.split(' ')[0]} border-b ${sectionColor.split(' ')[1]}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono">#{sectionIdx + 1}</span>
                          <h4 className="font-semibold text-sm">{section.label}</h4>
                          <div className="flex items-center gap-1 ml-2">
                            <button onClick={() => moveSection(section.key, -1)}
                              disabled={sectionIdx === 0}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors"
                              title="Move section up">
                              <FaArrowUp className="text-xs" />
                            </button>
                            <button onClick={() => moveSection(section.key, 1)}
                              disabled={sectionIdx === (templateForm.layout_json.sections?.length || 0) - 1}
                              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors"
                              title="Move section down">
                              <FaArrowDown className="text-xs" />
                            </button>
                          </div>
                        </div>
                        <span className="text-xs font-medium">
                          {visibleFields.length} visible / {hiddenFields.length} hidden
                        </span>
                      </div>
                      <div className="p-3 space-y-2">
                        {fields.map((fieldKey) => {
                          const fieldMeta = AVAILABLE_FIELDS.find(f => f.key === fieldKey);
                          const excluded = isFieldExcluded(fieldKey);
                          return (
                            <div key={fieldKey} className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${excluded ? 'bg-gray-50 border-gray-200 opacity-60' : 'bg-white border-gray-100 hover:border-gray-200'}`}>
                              <span className="text-gray-300 text-xs cursor-grab">⠿</span>
                              <div className="flex-1 min-w-0">
                                <span className={`text-sm font-medium ${excluded ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                  {fieldMeta?.label || fieldKey}
                                </span>
                                {fieldMeta && <SectionBadge section={fieldMeta.section} />}
                              </div>
                              <div className="flex items-center gap-1">
                                <button onClick={() => moveField(section.key, fieldKey, -1)}
                                  disabled={fields.indexOf(fieldKey) === 0}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors">
                                  <FaArrowUp className="text-xs" />
                                </button>
                                <button onClick={() => moveField(section.key, fieldKey, 1)}
                                  disabled={fields.indexOf(fieldKey) === fields.length - 1}
                                  className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-20 transition-colors">
                                  <FaArrowDown className="text-xs" />
                                </button>
                                <button onClick={() => toggleFieldExclusion(fieldKey)}
                                  className={`p-1.5 rounded-lg transition-all ${excluded ? 'text-gray-400 hover:text-primary-600' : 'text-primary-600 hover:text-red-500'}`}
                                  title={excluded ? 'Show field' : 'Hide field'}>
                                  {excluded ? <FaEyeSlash /> : <FaEye />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500">
                  {templateForm.layout_json.excluded_fields?.length || 0} fields hidden
                </div>
                {templateForm.layout_json.colors && (
                  <div className="flex gap-1">
                    {Object.entries(templateForm.layout_json.colors).filter(([k]) => k !== 'background').map(([k, v]) => (
                      <div key={k} className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: v }} title={k} />
                    ))}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {editingTemplate && (
                  <button onClick={async () => { try { await payrollService.previewTemplate(editingTemplate.template_id); } catch (e) { setError(e.response?.data?.message || 'Preview failed'); } }}
                    className="px-6 py-2.5 border border-primary-200 text-primary-700 font-semibold text-sm rounded-xl hover:bg-primary-50 transition-all flex items-center gap-2">
                    <FaFileInvoiceDollar /> Preview
                  </button>
                )}
                <button onClick={() => setShowEditor(false)} className="px-6 py-2.5 border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm rounded-xl shadow-sm transition-all disabled:opacity-50 flex items-center gap-2">
                  {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayslipDesigner;
