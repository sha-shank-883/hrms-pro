import { useState, useEffect } from 'react';
import { settingsService } from '../services';
import { useSettings } from '../hooks/useSettings.jsx';
import {
  FaBuilding, FaClock, FaUmbrellaBeach, FaMoneyBillWave, FaBullseye,
  FaChartBar, FaLock, FaBell, FaFile, FaPalette, FaPaintBrush, FaCog,
  FaSave, FaCheckCircle, FaExclamationCircle
} from 'react-icons/fa';

// Perfect default values for design settings
const DEFAULT_DESIGN_SETTINGS = {
  design_primary_color: '#8cc63f',
  design_secondary_color: '#2c3e50',
  design_success_color: '#10b981',
  design_warning_color: '#f59e0b',
  design_danger_color: '#ef4444',
  design_info_color: '#3b82f6',
  design_font_family: 'Inter',
  design_font_size_base: '14px',
  design_font_size_sm: '12px',
  design_font_size_lg: '16px',
  design_border_radius: '6px',
  design_border_radius_sm: '4px',
  design_border_radius_lg: '8px',
  design_spacing_unit: '4px',
  design_sidebar_width: '280px',
  design_header_height: '64px',
  design_button_padding_x: '12px',
  design_button_padding_y: '6px',
  design_card_padding: '16px',
  design_input_height: '36px',
  design_card_shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  design_button_shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  // Module-specific design settings
  design_dashboard_widget_bg: '#ffffff',
  design_dashboard_widget_border: '#e5e7eb',
  design_dashboard_widget_radius: '8px',
  design_dashboard_widget_shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  design_employee_card_bg: '#ffffff',
  design_employee_card_border: '#e5e7eb',
  design_employee_card_radius: '8px',
  design_employee_card_shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  design_table_row_hover: '#f9fafb',
  design_table_border: '#e5e7eb',
  design_nav_active_bg: '#8cc63f20',
  design_nav_active_border: '#8cc63f',
  design_badge_radius: '12px',
  design_form_group_spacing: '16px',
  design_modal_backdrop: 'rgba(0, 0, 0, 0.5)',
  design_chart_primary: '#8cc63f',
  design_chart_secondary: '#2c3e50',
  design_chart_success: '#10b981',
  design_chart_warning: '#f59e0b',
  design_chart_danger: '#ef4444',
  design_progress_bar_height: '8px',
  design_progress_bar_radius: '4px',
  design_avatar_size_sm: '24px',
  design_avatar_size_md: '32px',
  design_avatar_size_lg: '48px',
  design_tooltip_bg: '#1f2937',
  design_tooltip_text: '#ffffff',
  design_pagination_active: '#8cc63f',

  // Additional Module-specific Design Settings
  // Recruitment Module
  design_recruitment_card_bg: '#ffffff',
  design_recruitment_card_border: '#e5e7eb',
  design_recruitment_status_badge_radius: '12px',

  // Performance Module
  design_performance_chart_height: '300px',
  design_performance_review_card_bg: '#ffffff',
  design_performance_rating_star_color: '#f59e0b',

  // Payroll Module
  design_payroll_summary_card_bg: '#ffffff',
  design_payroll_item_border: '#e5e7eb',

  // Leave Module
  design_leave_request_card_bg: '#ffffff',
  design_leave_calendar_cell_height: '100px',
  design_leave_status_approved_color: '#10b981',
  design_leave_status_pending_color: '#f59e0b',
  design_leave_status_rejected_color: '#ef4444',

  // Attendance Module
  design_attendance_chart_height: '300px',
  design_attendance_status_present_color: '#10b981',
  design_attendance_status_absent_color: '#ef4444',
  design_attendance_status_late_color: '#f59e0b',

  // Task Module
  design_task_card_bg: '#ffffff',
  design_task_priority_high_color: '#ef4444',
  design_task_priority_medium_color: '#f59e0b',
  design_task_priority_low_color: '#10b981',
  design_task_status_todo_color: '#f59e0b',
  design_task_status_inprogress_color: '#3b82f6',
  design_task_status_completed_color: '#10b981'
};
const Settings = () => {
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getAll();
      const settingsObj = {};
      response.data.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      setSettings(settingsObj);
      setFormData(settingsObj);
      setError('');
    } catch (error) {
      setError('Failed to load settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  // Reset design settings to default values
  const resetDesignToDefaults = () => {
    setFormData({ ...formData, ...DEFAULT_DESIGN_SETTINGS });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const settingsArray = Object.keys(formData).map(key => {
        let category = null;
        if (['brand_primary_color', 'brand_secondary_color', 'company_logo', 'login_message'].includes(key)) category = 'branding';
        else if (['company_name', 'company_email', 'company_phone', 'company_website', 'company_address', 'timezone', 'date_format'].includes(key)) category = 'general';
        else if (['working_hours', 'working_days', 'overtime_rate', 'late_arrival_threshold', 'grace_period', 'break_time', 'overtime_enabled', 'auto_clock_out'].includes(key)) category = 'attendance';
        else if (['annual_leave_days', 'sick_leave_days', 'casual_leave_days', 'max_carry_forward_days', 'advance_notice_days', 'carry_forward_enabled', 'leave_approval_required'].includes(key)) category = 'leave';
        else if (['currency', 'currency_symbol', 'pay_frequency', 'default_tax_rate', 'social_security_rate', 'tax_enabled', 'bonus_enabled'].includes(key)) category = 'payroll';
        else if (key.startsWith('password_') || key === 'max_login_attempts' || key === 'session_timeout' || key === 'two_factor_auth') category = 'security';
        else if (key.startsWith('design_')) category = 'design';
        else if (['backup_frequency', 'data_retention_days', 'api_rate_limit', 'backup_enabled', 'audit_logging', 'maintenance_mode'].includes(key)) category = 'system';

        return {
          key,
          value: formData[key],
          category
        };
      });
      await settingsService.bulkUpdate(settingsArray);
      setSuccess('Settings saved successfully!');
      refreshSettings(); // Refresh global settings
      loadSettings();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to save settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !formData.company_name) return <div className="flex items-center justify-center h-screen"><div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div></div>;

  const categories = [
    { id: 'general', name: 'General', icon: <FaBuilding /> },
    { id: 'attendance', name: 'Attendance', icon: <FaClock /> },
    { id: 'leave', name: 'Leave', icon: <FaUmbrellaBeach /> },
    { id: 'payroll', name: 'Payroll', icon: <FaMoneyBillWave /> },
    { id: 'recruitment', name: 'Recruitment', icon: <FaBullseye /> },
    { id: 'performance', name: 'Performance', icon: <FaChartBar /> },
    { id: 'security', name: 'Security', icon: <FaLock /> },
    { id: 'notifications', name: 'Notifications', icon: <FaBell /> },
    { id: 'documents', name: 'Documents', icon: <FaFile /> },
    { id: 'branding', name: 'Branding', icon: <FaPalette /> },
    { id: 'design', name: 'Design System', icon: <FaPaintBrush /> },
    { id: 'system', name: 'System', icon: <FaCog /> }
  ];

  return (
    <div className="page-container h-[calc(100vh-64px)] overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-6 px-1">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Settings</h1>
          <p className="text-neutral-500">Manage your organization's configurations</p>
        </div>
        <button className="btn btn-primary flex items-center gap-2" onClick={handleSave} disabled={loading}>
          <FaSave /> Save Changes
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <FaExclamationCircle /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg flex items-center gap-2">
          <FaCheckCircle /> {success}
        </div>
      )}

      {/* Sidebar Layout */}
      <div className="flex flex-1 gap-6 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-neutral-200 overflow-y-auto custom-scrollbar h-full">
          <div className="p-2 space-y-1">
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === cat.id
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                onClick={() => setActiveTab(cat.id)}
              >
                <div className={`${activeTab === cat.id ? 'text-primary-600' : 'text-neutral-400'}`}>
                  {cat.icon}
                </div>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-neutral-200 overflow-y-auto custom-scrollbar h-full p-6">

          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>General Settings</h3>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Company Name *</label>
                  <input type="text" className="form-input" value={formData.company_name || ''} onChange={(e) => handleChange('company_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Email *</label>
                  <input type="email" className="form-input" value={formData.company_email || ''} onChange={(e) => handleChange('company_email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Phone</label>
                  <input type="text" className="form-input" value={formData.company_phone || ''} onChange={(e) => handleChange('company_phone', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Website</label>
                  <input type="url" className="form-input" value={formData.company_website || ''} onChange={(e) => handleChange('company_website', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Company Address</label>
                  <textarea className="form-input" value={formData.company_address || ''} onChange={(e) => handleChange('company_address', e.target.value)} rows="2" />
                </div>
                <div className="form-group">
                  <label className="form-label">Timezone</label>
                  <select className="form-input" value={formData.timezone || ''} onChange={(e) => handleChange('timezone', e.target.value)}>
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date Format</label>
                  <select className="form-input" value={formData.date_format || ''} onChange={(e) => handleChange('date_format', e.target.value)}>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Attendance Settings */}
          {activeTab === 'attendance' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Attendance Settings</h3>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Working Hours per Day *</label>
                  <input type="number" className="form-input" value={formData.working_hours || ''} onChange={(e) => handleChange('working_hours', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Working Days per Week *</label>
                  <input type="number" className="form-input" value={formData.working_days || ''} onChange={(e) => handleChange('working_days', e.target.value)} min="1" max="7" />
                </div>
                <div className="form-group">
                  <label className="form-label">Overtime Rate Multiplier</label>
                  <input type="number" step="0.1" className="form-input" value={formData.overtime_rate || ''} onChange={(e) => handleChange('overtime_rate', e.target.value)} />
                  <small style={{ color: '#6b7280' }}>e.g., 1.5 for 150% of regular pay</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Late Arrival Threshold (minutes)</label>
                  <input type="number" className="form-input" value={formData.late_arrival_threshold || ''} onChange={(e) => handleChange('late_arrival_threshold', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Grace Period (minutes)</label>
                  <input type="number" className="form-input" value={formData.grace_period || ''} onChange={(e) => handleChange('grace_period', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Break Time (minutes)</label>
                  <input type="number" className="form-input" value={formData.break_time || ''} onChange={(e) => handleChange('break_time', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.overtime_enabled === 'true'} onChange={(e) => handleChange('overtime_enabled', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    Enable Overtime Tracking
                  </label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.auto_clock_out === 'true'} onChange={(e) => handleChange('auto_clock_out', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    Auto Clock-Out at End of Day
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Leave Settings */}
          {activeTab === 'leave' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Leave Settings</h3>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Annual Leave Days *</label>
                  <input type="number" className="form-input" value={formData.annual_leave_days || ''} onChange={(e) => handleChange('annual_leave_days', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Sick Leave Days *</label>
                  <input type="number" className="form-input" value={formData.sick_leave_days || ''} onChange={(e) => handleChange('sick_leave_days', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Casual Leave Days *</label>
                  <input type="number" className="form-input" value={formData.casual_leave_days || ''} onChange={(e) => handleChange('casual_leave_days', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Carry Forward Days</label>
                  <input type="number" className="form-input" value={formData.max_carry_forward_days || ''} onChange={(e) => handleChange('max_carry_forward_days', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Advance Notice Days</label>
                  <input type="number" className="form-input" value={formData.advance_notice_days || ''} onChange={(e) => handleChange('advance_notice_days', e.target.value)} />
                  <small style={{ color: '#6b7280' }}>Minimum days notice required for leave request</small>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.carry_forward_enabled === 'true'} onChange={(e) => handleChange('carry_forward_enabled', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    Allow Leave Carry Forward
                  </label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.leave_approval_required === 'true'} onChange={(e) => handleChange('leave_approval_required', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    Require Manager Approval
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Payroll Settings */}
          {activeTab === 'payroll' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Payroll Settings</h3>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Currency *</label>
                  <select className="form-input" value={formData.currency || ''} onChange={(e) => handleChange('currency', e.target.value)}>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                    <option value="INR">INR - Indian Rupee</option>
                    <option value="CAD">CAD - Canadian Dollar</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Currency Symbol *</label>
                  <input type="text" className="form-input" value={formData.currency_symbol || ''} onChange={(e) => handleChange('currency_symbol', e.target.value)} placeholder="$, €, £, Rs." />
                  <small style={{ color: '#6b7280' }}>Displayed throughout the system (e.g., $, €, £, Rs.)</small>
                </div>
                <div className="form-group">
                  <label className="form-label">Pay Frequency</label>
                  <select className="form-input" value={formData.pay_frequency || ''} onChange={(e) => handleChange('pay_frequency', e.target.value)}>
                    <option value="weekly">Weekly</option>
                    <option value="bi-weekly">Bi-Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Default Tax Rate (%)</label>
                  <input type="number" step="0.1" className="form-input" value={formData.default_tax_rate || ''} onChange={(e) => handleChange('default_tax_rate', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Social Security Rate (%)</label>
                  <input type="number" step="0.1" className="form-input" value={formData.social_security_rate || ''} onChange={(e) => handleChange('social_security_rate', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.tax_enabled === 'true'} onChange={(e) => handleChange('tax_enabled', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    Enable Tax Calculations
                  </label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.bonus_enabled === 'true'} onChange={(e) => handleChange('bonus_enabled', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    Enable Bonus Payments
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Security Settings</h3>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Minimum Password Length</label>
                  <input type="number" className="form-input" value={formData.password_min_length || ''} onChange={(e) => handleChange('password_min_length', e.target.value)} min="6" max="32" />
                </div>
                <div className="form-group">
                  <label className="form-label">Password Expiry (days)</label>
                  <input type="number" className="form-input" value={formData.password_expiry_days || ''} onChange={(e) => handleChange('password_expiry_days', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Login Attempts</label>
                  <input type="number" className="form-input" value={formData.max_login_attempts || ''} onChange={(e) => handleChange('max_login_attempts', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Session Timeout (minutes)</label>
                  <input type="number" className="form-input" value={formData.session_timeout || ''} onChange={(e) => handleChange('session_timeout', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.password_require_uppercase === 'true'} onChange={(e) => handleChange('password_require_uppercase', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    Require Uppercase in Password
                  </label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.password_require_number === 'true'} onChange={(e) => handleChange('password_require_number', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    Require Number in Password
                  </label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.two_factor_auth === 'true'} onChange={(e) => handleChange('two_factor_auth', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    Enable Two-Factor Authentication
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Branding Settings */}
          {activeTab === 'branding' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Branding & Customization</h3>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Primary Brand Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.brand_primary_color || '#8cc63f'}
                      onChange={(e) => handleChange('brand_primary_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.brand_primary_color || ''}
                      onChange={(e) => handleChange('brand_primary_color', e.target.value)}
                      placeholder="#8cc63f"
                    />
                  </div>
                  <small style={{ color: '#6b7280' }}>Used for buttons, links, and active states.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Secondary Brand Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.brand_secondary_color || '#2c3e50'}
                      onChange={(e) => handleChange('brand_secondary_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.brand_secondary_color || ''}
                      onChange={(e) => handleChange('brand_secondary_color', e.target.value)}
                      placeholder="#2c3e50"
                    />
                  </div>
                  <small style={{ color: '#6b7280' }}>Used for headers, sidebars, and text.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Company Logo URL</label>
                  <input type="url" className="form-input" value={formData.company_logo || ''} onChange={(e) => handleChange('company_logo', e.target.value)} placeholder="https://example.com/logo.png" />
                  {formData.company_logo && (
                    <div style={{ marginTop: '0.5rem', padding: '1rem', background: '#f4f6f8', borderRadius: '0.5rem', textAlign: 'center' }}>
                      <p style={{ fontSize: '0.75rem', marginBottom: '0.5rem', color: '#6b7280' }}>Preview</p>
                      <img src={formData.company_logo} alt="Logo Preview" style={{ maxHeight: '60px' }} />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Login Page Message</label>
                  <textarea
                    className="form-input"
                    value={formData.login_message || ''}
                    onChange={(e) => handleChange('login_message', e.target.value)}
                    rows="3"
                    placeholder="Welcome to our HR Portal..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Design System Settings */}
          {activeTab === 'design' && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Design System</h3>
                <button className="btn btn-secondary" onClick={resetDesignToDefaults}>
                  Reset to Defaults
                </button>
              </div>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Primary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_primary_color || '#8cc63f'}
                      onChange={(e) => handleChange('design_primary_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_primary_color || ''}
                      onChange={(e) => handleChange('design_primary_color', e.target.value)}
                      placeholder="#8cc63f"
                    />
                  </div>
                  <small style={{ color: '#6b7280' }}>Used for primary buttons, links, and highlights.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Secondary Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_secondary_color || '#2c3e50'}
                      onChange={(e) => handleChange('design_secondary_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_secondary_color || ''}
                      onChange={(e) => handleChange('design_secondary_color', e.target.value)}
                      placeholder="#2c3e50"
                    />
                  </div>
                  <small style={{ color: '#6b7280' }}>Used for headers, sidebars, and secondary elements.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Success Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_success_color || '#10b981'}
                      onChange={(e) => handleChange('design_success_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_success_color || ''}
                      onChange={(e) => handleChange('design_success_color', e.target.value)}
                      placeholder="#10b981"
                    />
                  </div>
                  <small style={{ color: '#6b7280' }}>Used for success messages and positive actions.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Warning Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_warning_color || '#f59e0b'}
                      onChange={(e) => handleChange('design_warning_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_warning_color || ''}
                      onChange={(e) => handleChange('design_warning_color', e.target.value)}
                      placeholder="#f59e0b"
                    />
                  </div>
                  <small style={{ color: '#6b7280' }}>Used for warnings and cautionary actions.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Danger Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_danger_color || '#ef4444'}
                      onChange={(e) => handleChange('design_danger_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_danger_color || ''}
                      onChange={(e) => handleChange('design_danger_color', e.target.value)}
                      placeholder="#ef4444"
                    />
                  </div>
                  <small style={{ color: '#6b7280' }}>Used for errors and destructive actions.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Info Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_info_color || '#3b82f6'}
                      onChange={(e) => handleChange('design_info_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_info_color || ''}
                      onChange={(e) => handleChange('design_info_color', e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                  <small style={{ color: '#6b7280' }}>Used for informational elements.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Font Family</label>
                  <select
                    className="form-input"
                    value={formData.design_font_family || 'Inter'}
                    onChange={(e) => handleChange('design_font_family', e.target.value)}
                  >
                    <option value="Inter">Inter (Default)</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                    <option value="Lato">Lato</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Source Sans Pro">Source Sans Pro</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Base Font Size (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="1"
                    value={parseInt(formData.design_font_size_base || '14')}
                    onChange={(e) => handleChange('design_font_size_base', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_font_size_base || '14px'}</span>
                    <span>24px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Small Font Size (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="16"
                    step="1"
                    value={parseInt(formData.design_font_size_sm || '12')}
                    onChange={(e) => handleChange('design_font_size_sm', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_font_size_sm || '12px'}</span>
                    <span>16px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Large Font Size (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="28"
                    step="1"
                    value={parseInt(formData.design_font_size_lg || '16')}
                    onChange={(e) => handleChange('design_font_size_lg', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_font_size_lg || '16px'}</span>
                    <span>28px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Border Radius (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={parseInt(formData.design_border_radius || '6')}
                    onChange={(e) => handleChange('design_border_radius', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_border_radius || '6px'}</span>
                    <span>20px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Small Border Radius (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={parseInt(formData.design_border_radius_sm || '4')}
                    onChange={(e) => handleChange('design_border_radius_sm', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_border_radius_sm || '4px'}</span>
                    <span>12px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Large Border Radius (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="1"
                    value={parseInt(formData.design_border_radius_lg || '8')}
                    onChange={(e) => handleChange('design_border_radius_lg', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_border_radius_lg || '8px'}</span>
                    <span>24px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Spacing Unit (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={parseInt(formData.design_spacing_unit || '4')}
                    onChange={(e) => handleChange('design_spacing_unit', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_spacing_unit || '4px'}</span>
                    <span>12px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Sidebar Width (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="400"
                    step="10"
                    value={parseInt(formData.design_sidebar_width || '280')}
                    onChange={(e) => handleChange('design_sidebar_width', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_sidebar_width || '280px'}</span>
                    <span>400px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Header Height (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="4"
                    value={parseInt(formData.design_header_height || '64')}
                    onChange={(e) => handleChange('design_header_height', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_header_height || '64px'}</span>
                    <span>120px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Button Horizontal Padding (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    step="1"
                    value={parseInt(formData.design_button_padding_x || '12')}
                    onChange={(e) => handleChange('design_button_padding_x', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_button_padding_x || '12px'}</span>
                    <span>32px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Button Vertical Padding (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={parseInt(formData.design_button_padding_y || '6')}
                    onChange={(e) => handleChange('design_button_padding_y', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_button_padding_y || '6px'}</span>
                    <span>20px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Card Padding (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    step="1"
                    value={parseInt(formData.design_card_padding || '16')}
                    onChange={(e) => handleChange('design_card_padding', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_card_padding || '16px'}</span>
                    <span>32px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Input Height (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="64"
                    step="1"
                    value={parseInt(formData.design_input_height || '36')}
                    onChange={(e) => handleChange('design_input_height', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_input_height || '36px'}</span>
                    <span>64px</span>
                  </div>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Card Shadow</label>
                  <select
                    className="form-input"
                    value={formData.design_card_shadow || '0 1px 3px 0 rgba(0, 0, 0, 0.1)'}
                    onChange={(e) => handleChange('design_card_shadow', e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="0 1px 2px 0 rgba(0, 0, 0, 0.05)">Light</option>
                    <option value="0 1px 3px 0 rgba(0, 0, 0, 0.1)">Medium (Default)</option>
                    <option value="0 4px 6px -1px rgba(0, 0, 0, 0.1)">Heavy</option>
                    <option value="0 10px 15px -3px rgba(0, 0, 0, 0.1)">Very Heavy</option>
                  </select>
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Button Shadow</label>
                  <select
                    className="form-input"
                    value={formData.design_button_shadow || '0 1px 2px 0 rgba(0, 0, 0, 0.05)'}
                    onChange={(e) => handleChange('design_button_shadow', e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="0 1px 1px 0 rgba(0, 0, 0, 0.05)">Light</option>
                    <option value="0 1px 2px 0 rgba(0, 0, 0, 0.05)">Medium (Default)</option>
                    <option value="0 2px 4px 0 rgba(0, 0, 0, 0.1)">Heavy</option>
                    <option value="0 4px 6px 0 rgba(0, 0, 0, 0.1)">Very Heavy</option>
                  </select>
                </div>

                {/* Module-specific design settings */}
                <div className="form-group">
                  <label className="form-label">Dashboard Widget Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_dashboard_widget_bg || '#ffffff'}
                      onChange={(e) => handleChange('design_dashboard_widget_bg', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_dashboard_widget_bg || ''}
                      onChange={(e) => handleChange('design_dashboard_widget_bg', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dashboard Widget Border</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_dashboard_widget_border || '#e5e7eb'}
                      onChange={(e) => handleChange('design_dashboard_widget_border', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_dashboard_widget_border || ''}
                      onChange={(e) => handleChange('design_dashboard_widget_border', e.target.value)}
                      placeholder="#e5e7eb"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dashboard Widget Radius (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={parseInt(formData.design_dashboard_widget_radius || '8')}
                    onChange={(e) => handleChange('design_dashboard_widget_radius', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_dashboard_widget_radius || '8px'}</span>
                    <span>20px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Dashboard Widget Shadow</label>
                  <select
                    className="form-input"
                    value={formData.design_dashboard_widget_shadow || '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}
                    onChange={(e) => handleChange('design_dashboard_widget_shadow', e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="0 1px 2px 0 rgba(0, 0, 0, 0.05)">Light</option>
                    <option value="0 1px 3px 0 rgba(0, 0, 0, 0.1)">Medium</option>
                    <option value="0 4px 6px -1px rgba(0, 0, 0, 0.1)">Heavy (Default)</option>
                    <option value="0 10px 15px -3px rgba(0, 0, 0, 0.1)">Very Heavy</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Employee Card Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_employee_card_bg || '#ffffff'}
                      onChange={(e) => handleChange('design_employee_card_bg', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_employee_card_bg || ''}
                      onChange={(e) => handleChange('design_employee_card_bg', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Employee Card Border</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_employee_card_border || '#e5e7eb'}
                      onChange={(e) => handleChange('design_employee_card_border', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_employee_card_border || ''}
                      onChange={(e) => handleChange('design_employee_card_border', e.target.value)}
                      placeholder="#e5e7eb"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Table Row Hover Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_table_row_hover || '#f9fafb'}
                      onChange={(e) => handleChange('design_table_row_hover', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_table_row_hover || ''}
                      onChange={(e) => handleChange('design_table_row_hover', e.target.value)}
                      placeholder="#f9fafb"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Table Border Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_table_border || '#e5e7eb'}
                      onChange={(e) => handleChange('design_table_border', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_table_border || ''}
                      onChange={(e) => handleChange('design_table_border', e.target.value)}
                      placeholder="#e5e7eb"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Badge Radius (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={parseInt(formData.design_badge_radius || '12')}
                    onChange={(e) => handleChange('design_badge_radius', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_badge_radius || '12px'}</span>
                    <span>20px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Form Group Spacing (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="32"
                    step="1"
                    value={parseInt(formData.design_form_group_spacing || '16')}
                    onChange={(e) => handleChange('design_form_group_spacing', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_form_group_spacing || '16px'}</span>
                    <span>32px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Modal Backdrop</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_modal_backdrop || 'rgba(0, 0, 0, 0.5)'}
                      onChange={(e) => handleChange('design_modal_backdrop', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_modal_backdrop || ''}
                      onChange={(e) => handleChange('design_modal_backdrop', e.target.value)}
                      placeholder="rgba(0, 0, 0, 0.5)"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Progress Bar Height (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={parseInt(formData.design_progress_bar_height || '8')}
                    onChange={(e) => handleChange('design_progress_bar_height', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_progress_bar_height || '8px'}</span>
                    <span>20px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Avatar Sizes</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                    <div>
                      <label className="text-xs">Small</label>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        step="1"
                        value={parseInt(formData.design_avatar_size_sm || '24')}
                        onChange={(e) => handleChange('design_avatar_size_sm', `${e.target.value}px`)}
                        style={{ width: '100%' }}
                      />
                      <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>{formData.design_avatar_size_sm || '24px'}</div>
                    </div>
                    <div>
                      <label className="text-xs">Medium</label>
                      <input
                        type="range"
                        min="24"
                        max="64"
                        step="1"
                        value={parseInt(formData.design_avatar_size_md || '32')}
                        onChange={(e) => handleChange('design_avatar_size_md', `${e.target.value}px`)}
                        style={{ width: '100%' }}
                      />
                      <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>{formData.design_avatar_size_md || '32px'}</div>
                    </div>
                    <div>
                      <label className="text-xs">Large</label>
                      <input
                        type="range"
                        min="32"
                        max="96"
                        step="1"
                        value={parseInt(formData.design_avatar_size_lg || '48')}
                        onChange={(e) => handleChange('design_avatar_size_lg', `${e.target.value}px`)}
                        style={{ width: '100%' }}
                      />
                      <div style={{ textAlign: 'center', fontSize: '0.75rem' }}>{formData.design_avatar_size_lg || '48px'}</div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tooltip Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_tooltip_bg || '#1f2937'}
                      onChange={(e) => handleChange('design_tooltip_bg', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_tooltip_bg || ''}
                      onChange={(e) => handleChange('design_tooltip_bg', e.target.value)}
                      placeholder="#1f2937"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tooltip Text Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_tooltip_text || '#ffffff'}
                      onChange={(e) => handleChange('design_tooltip_text', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_tooltip_text || ''}
                      onChange={(e) => handleChange('design_tooltip_text', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                {/* Module-Specific Design Settings Header */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h4 style={{ marginTop: '2rem', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid #e5e7eb' }}>
                    Module-Specific Design Settings
                  </h4>
                </div>

                {/* Recruitment Module Settings */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h5 style={{ marginBottom: '1rem' }}>Recruitment Module</h5>
                </div>

                <div className="form-group">
                  <label className="form-label">Recruitment Card Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_recruitment_card_bg || '#ffffff'}
                      onChange={(e) => handleChange('design_recruitment_card_bg', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_recruitment_card_bg || ''}
                      onChange={(e) => handleChange('design_recruitment_card_bg', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Recruitment Card Border</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_recruitment_card_border || '#e5e7eb'}
                      onChange={(e) => handleChange('design_recruitment_card_border', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_recruitment_card_border || ''}
                      onChange={(e) => handleChange('design_recruitment_card_border', e.target.value)}
                      placeholder="#e5e7eb"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Recruitment Status Badge Radius (px)</label>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={parseInt(formData.design_recruitment_status_badge_radius || '12')}
                    onChange={(e) => handleChange('design_recruitment_status_badge_radius', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>0px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_recruitment_status_badge_radius || '12px'}</span>
                    <span>20px</span>
                  </div>
                </div>

                {/* Performance Module Settings */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h5 style={{ marginBottom: '1rem', marginTop: '1rem' }}>Performance Module</h5>
                </div>

                <div className="form-group">
                  <label className="form-label">Performance Chart Height (px)</label>
                  <input
                    type="range"
                    min="100"
                    max="500"
                    step="10"
                    value={parseInt(formData.design_performance_chart_height || '300')}
                    onChange={(e) => handleChange('design_performance_chart_height', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>100px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_performance_chart_height || '300px'}</span>
                    <span>500px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Performance Review Card Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_performance_review_card_bg || '#ffffff'}
                      onChange={(e) => handleChange('design_performance_review_card_bg', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_performance_review_card_bg || ''}
                      onChange={(e) => handleChange('design_performance_review_card_bg', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Performance Rating Star Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_performance_rating_star_color || '#f59e0b'}
                      onChange={(e) => handleChange('design_performance_rating_star_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_performance_rating_star_color || ''}
                      onChange={(e) => handleChange('design_performance_rating_star_color', e.target.value)}
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>

                {/* Payroll Module Settings */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h5 style={{ marginBottom: '1rem', marginTop: '1rem' }}>Payroll Module</h5>
                </div>

                <div className="form-group">
                  <label className="form-label">Payroll Summary Card Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_payroll_summary_card_bg || '#ffffff'}
                      onChange={(e) => handleChange('design_payroll_summary_card_bg', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_payroll_summary_card_bg || ''}
                      onChange={(e) => handleChange('design_payroll_summary_card_bg', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Payroll Item Border</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_payroll_item_border || '#e5e7eb'}
                      onChange={(e) => handleChange('design_payroll_item_border', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_payroll_item_border || ''}
                      onChange={(e) => handleChange('design_payroll_item_border', e.target.value)}
                      placeholder="#e5e7eb"
                    />
                  </div>
                </div>

                {/* Leave Module Settings */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h5 style={{ marginBottom: '1rem', marginTop: '1rem' }}>Leave Module</h5>
                </div>

                <div className="form-group">
                  <label className="form-label">Leave Request Card Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_leave_request_card_bg || '#ffffff'}
                      onChange={(e) => handleChange('design_leave_request_card_bg', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_leave_request_card_bg || ''}
                      onChange={(e) => handleChange('design_leave_request_card_bg', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Leave Calendar Cell Height (px)</label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={parseInt(formData.design_leave_calendar_cell_height || '100')}
                    onChange={(e) => handleChange('design_leave_calendar_cell_height', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>50px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_leave_calendar_cell_height || '100px'}</span>
                    <span>200px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Approved Leave Status Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_leave_status_approved_color || '#10b981'}
                      onChange={(e) => handleChange('design_leave_status_approved_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_leave_status_approved_color || ''}
                      onChange={(e) => handleChange('design_leave_status_approved_color', e.target.value)}
                      placeholder="#10b981"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Pending Leave Status Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_leave_status_pending_color || '#f59e0b'}
                      onChange={(e) => handleChange('design_leave_status_pending_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_leave_status_pending_color || ''}
                      onChange={(e) => handleChange('design_leave_status_pending_color', e.target.value)}
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Rejected Leave Status Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_leave_status_rejected_color || '#ef4444'}
                      onChange={(e) => handleChange('design_leave_status_rejected_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_leave_status_rejected_color || ''}
                      onChange={(e) => handleChange('design_leave_status_rejected_color', e.target.value)}
                      placeholder="#ef4444"
                    />
                  </div>
                </div>

                {/* Attendance Module Settings */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h5 style={{ marginBottom: '1rem', marginTop: '1rem' }}>Attendance Module</h5>
                </div>

                <div className="form-group">
                  <label className="form-label">Attendance Chart Height (px)</label>
                  <input
                    type="range"
                    min="100"
                    max="500"
                    step="10"
                    value={parseInt(formData.design_attendance_chart_height || '300')}
                    onChange={(e) => handleChange('design_attendance_chart_height', `${e.target.value}px`)}
                    style={{ width: '100%' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>100px</span>
                    <span style={{ fontWeight: 'bold' }}>{formData.design_attendance_chart_height || '300px'}</span>
                    <span>500px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Present Status Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_attendance_status_present_color || '#10b981'}
                      onChange={(e) => handleChange('design_attendance_status_present_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_attendance_status_present_color || ''}
                      onChange={(e) => handleChange('design_attendance_status_present_color', e.target.value)}
                      placeholder="#10b981"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Absent Status Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_attendance_status_absent_color || '#ef4444'}
                      onChange={(e) => handleChange('design_attendance_status_absent_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_attendance_status_absent_color || ''}
                      onChange={(e) => handleChange('design_attendance_status_absent_color', e.target.value)}
                      placeholder="#ef4444"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Late Status Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_attendance_status_late_color || '#f59e0b'}
                      onChange={(e) => handleChange('design_attendance_status_late_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_attendance_status_late_color || ''}
                      onChange={(e) => handleChange('design_attendance_status_late_color', e.target.value)}
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>

                {/* Task Module Settings */}
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <h5 style={{ marginBottom: '1rem', marginTop: '1rem' }}>Task Module</h5>
                </div>

                <div className="form-group">
                  <label className="form-label">Task Card Background</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_task_card_bg || '#ffffff'}
                      onChange={(e) => handleChange('design_task_card_bg', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_task_card_bg || ''}
                      onChange={(e) => handleChange('design_task_card_bg', e.target.value)}
                      placeholder="#ffffff"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">High Priority Task Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_task_priority_high_color || '#ef4444'}
                      onChange={(e) => handleChange('design_task_priority_high_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_task_priority_high_color || ''}
                      onChange={(e) => handleChange('design_task_priority_high_color', e.target.value)}
                      placeholder="#ef4444"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Medium Priority Task Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_task_priority_medium_color || '#f59e0b'}
                      onChange={(e) => handleChange('design_task_priority_medium_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_task_priority_medium_color || ''}
                      onChange={(e) => handleChange('design_task_priority_medium_color', e.target.value)}
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Low Priority Task Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_task_priority_low_color || '#10b981'}
                      onChange={(e) => handleChange('design_task_priority_low_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_task_priority_low_color || ''}
                      onChange={(e) => handleChange('design_task_priority_low_color', e.target.value)}
                      placeholder="#10b981"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Todo Task Status Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_task_status_todo_color || '#f59e0b'}
                      onChange={(e) => handleChange('design_task_status_todo_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_task_status_todo_color || ''}
                      onChange={(e) => handleChange('design_task_status_todo_color', e.target.value)}
                      placeholder="#f59e0b"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">In Progress Task Status Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_task_status_inprogress_color || '#3b82f6'}
                      onChange={(e) => handleChange('design_task_status_inprogress_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_task_status_inprogress_color || ''}
                      onChange={(e) => handleChange('design_task_status_inprogress_color', e.target.value)}
                      placeholder="#3b82f6"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Completed Task Status Color</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <input
                      type="color"
                      value={formData.design_task_status_completed_color || '#10b981'}
                      onChange={(e) => handleChange('design_task_status_completed_color', e.target.value)}
                      style={{ width: '50px', height: '50px', padding: '0', border: 'none', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      value={formData.design_task_status_completed_color || ''}
                      onChange={(e) => handleChange('design_task_status_completed_color', e.target.value)}
                      placeholder="#10b981"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}      {/* System Settings */}
          {activeTab === 'system' && (
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>System Settings</h3>
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Backup Frequency</label>
                  <select className="form-input" value={formData.backup_frequency || ''} onChange={(e) => handleChange('backup_frequency', e.target.value)}>
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Data Retention (days)</label>
                  <input type="number" className="form-input" value={formData.data_retention_days || ''} onChange={(e) => handleChange('data_retention_days', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">API Rate Limit (requests/hour)</label>
                  <input type="number" className="form-input" value={formData.api_rate_limit || ''} onChange={(e) => handleChange('api_rate_limit', e.target.value)} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.backup_enabled === 'true'} onChange={(e) => handleChange('backup_enabled', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    Enable Automatic Backups
                  </label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.audit_logging === 'true'} onChange={(e) => handleChange('audit_logging', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    Enable Audit Logging
                  </label>
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input type="checkbox" checked={formData.maintenance_mode === 'true'} onChange={(e) => handleChange('maintenance_mode', e.target.checked ? 'true' : 'false')} style={{ marginRight: '0.5rem' }} />
                    <span style={{ color: '#dc2626' }}>Maintenance Mode (disables access for non-admins)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs placeholder */}
          {['recruitment', 'performance', 'notifications', 'documents'].includes(activeTab) && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>{categories.find(c => c.id === activeTab)?.icon} {categories.find(c => c.id === activeTab)?.name} Settings</h3>
              <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Advanced settings for {activeTab} will be configured based on your needs.</p>
              <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>Contact administrator for custom configuration.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
