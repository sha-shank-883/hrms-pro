import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { settingsService, paymentService, employeeService, tenantService, notificationService } from '../services';
import { useSettings } from '../hooks/useSettings.jsx';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PayPalCheckout from '../components/billing/PayPalCheckout';
import RazorpayCheckout from '../components/billing/RazorpayCheckout';
import SubscriptionCheckoutModal from '../components/billing/SubscriptionCheckoutModal';
import InvoiceModal from '../components/billing/InvoiceModal';
import StatementModal from '../components/billing/StatementModal';
import {
  FaBuilding, FaClock, FaUmbrellaBeach, FaMoneyBillWave, FaBullseye,
  FaChartBar, FaLock, FaBell, FaFile, FaPalette, FaPaintBrush, FaCog,
  FaSave, FaCheckCircle, FaExclamationCircle, FaMobileAlt,
  FaMoon, FaSun, FaCreditCard, FaCrown, FaCheck, FaShieldAlt, FaUsers, FaArrowRight, FaQrcode
} from 'react-icons/fa';
import { SparklesIcon, DocumentTextIcon, DocumentChartBarIcon, EyeIcon, PrinterIcon } from '@heroicons/react/24/outline';

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
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');
  const [formData, setFormData] = useState({});
  const { dark, toggle: toggleTheme } = useTheme();

  // Billing states
  const [billingCurrency, setBillingCurrency] = useState('INR'); // 'INR' | 'USD'
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [seatQuantity, setSeatQuantity] = useState(15);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);

  // Advanced Tenant Billing Profile & Invoice History
  const [tenantBillingProfile, setTenantBillingProfile] = useState({
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    billing_address: '',
    city: '',
    country: 'India',
    tax_id: '',
    billing_currency: 'INR',
    billing_cycle: 'monthly'
  });
  const [tenantInvoices, setTenantInvoices] = useState([]);
  const [activeInvoiceId, setActiveInvoiceId] = useState(null);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [savingBillingProfile, setSavingBillingProfile] = useState(false);
  const [billingProfileSuccess, setBillingProfileSuccess] = useState('');
  const [billingProfileError, setBillingProfileError] = useState('');

  // Tenant Dynamic Notification & Web Push Settings
  const [notifSettings, setNotifSettings] = useState({
    enable_web_push: true,
    enable_in_app_sound: true,
    enable_email_alerts: true,
    event_rules: {
      leave_request: { in_app: true, email: true, push: true },
      leave_approval: { in_app: true, email: true, push: true },
      attendance_regularization: { in_app: true, email: true, push: true },
      task_assigned: { in_app: true, email: true, push: true },
      payroll_published: { in_app: true, email: true, push: true },
      chat_message: { in_app: true, email: false, push: true },
      system_announcement: { in_app: true, email: true, push: true }
    }
  });
  const [savingNotifSettings, setSavingNotifSettings] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState('');
  const [notifError, setNotifError] = useState('');
  const [browserPushPermission, setBrowserPushPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'billing') {
      loadBillingData();
    }
    if (activeTab === 'notifications') {
      loadNotifSettings();
    }
  }, [activeTab]);

  const loadNotifSettings = async () => {
    try {
      const res = await notificationService.getSettings();
      if (res.success && res.data) {
        setNotifSettings({
          enable_web_push: res.data.enable_web_push ?? true,
          enable_in_app_sound: res.data.enable_in_app_sound ?? true,
          enable_email_alerts: res.data.enable_email_alerts ?? true,
          event_rules: res.data.event_rules || notifSettings.event_rules
        });
      }
    } catch (e) {
      console.error('Failed to load notification settings:', e);
    }
  };

  const handleRequestBrowserPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setBrowserPushPermission(perm);
      if (perm === 'granted') {
        new Notification('HRMS Pro', {
          body: 'Browser push notifications are now active!',
          icon: '/favicon.ico'
        });
      }
    }
  };

  const handleTestSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (e) {}
  };

  const handleSaveNotificationSettings = async (e) => {
    e.preventDefault();
    try {
      setSavingNotifSettings(true);
      setNotifError('');
      setNotifSuccess('');
      const res = await notificationService.updateSettings(notifSettings);
      setNotifSuccess(res.message || 'Notification preferences saved successfully');
      setTimeout(() => setNotifSuccess(''), 4000);
    } catch (err) {
      setNotifError(err.response?.data?.message || 'Failed to save notification preferences');
    } finally {
      setSavingNotifSettings(false);
    }
  };

  const loadBillingData = async () => {
    try {
      setBillingLoading(true);
      const [subRes, empRes, myBillingRes] = await Promise.allSettled([
        paymentService.getSubscription(),
        employeeService.getAll({ status: 'active', limit: 1 }),
        tenantService.getMyBilling()
      ]);

      if (subRes.status === 'fulfilled' && subRes.value?.data) {
        setSubscriptionData(subRes.value.data);
        if (subRes.value.data.employeeLimit) {
          setSeatQuantity(subRes.value.data.employeeLimit);
        }
      }
      if (empRes.status === 'fulfilled' && empRes.value?.pagination) {
        setEmployeeCount(empRes.value.pagination.totalItems || 0);
      }
      if (myBillingRes.status === 'fulfilled' && myBillingRes.value?.success) {
        const t = myBillingRes.value.tenant;
        setTenantInvoices(myBillingRes.value.invoices || []);
        if (myBillingRes.value.employeeCount) {
          setEmployeeCount(myBillingRes.value.employeeCount);
        }
        if (t) {
          setTenantBillingProfile({
            contact_person: t.contact_person || '',
            contact_email: t.contact_email || '',
            contact_phone: t.contact_phone || '',
            billing_address: t.billing_address || '',
            city: t.city || '',
            country: t.country || 'India',
            tax_id: t.tax_id || '',
            billing_currency: t.billing_currency || 'INR',
            billing_cycle: t.billing_cycle || 'monthly'
          });
          if (t.billing_currency) {
            setBillingCurrency(t.billing_currency);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setBillingLoading(false);
    }
  };

  const handleSaveBillingProfile = async (e) => {
    e.preventDefault();
    try {
      setSavingBillingProfile(true);
      setBillingProfileError('');
      setBillingProfileSuccess('');
      const res = await tenantService.updateMyBilling(tenantBillingProfile);
      setBillingProfileSuccess(res.message || 'Billing profile and Tax ID updated successfully');
      setTimeout(() => setBillingProfileSuccess(''), 4000);
    } catch (err) {
      setBillingProfileError(err.response?.data?.message || 'Failed to update billing profile');
    } finally {
      setSavingBillingProfile(false);
    }
  };

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
        else if (['working_hours', 'working_days', 'overtime_rate', 'late_arrival_threshold', 'grace_period', 'break_time', 'overtime_enabled', 'auto_clock_out', 'office_latitude', 'office_longitude', 'geofence_radius', 'strict_geofence'].includes(key)) category = 'attendance';
        else if (['annual_leave_days', 'sick_leave_days', 'casual_leave_days', 'max_carry_forward_days', 'advance_notice_days', 'carry_forward_enabled', 'leave_approval_required'].includes(key)) category = 'leave';
        else if (['currency', 'currency_symbol', 'pay_frequency', 'default_tax_rate', 'social_security_rate', 'tax_enabled', 'bonus_enabled'].includes(key)) category = 'payroll';
        else if (['mobile_app_enabled','mobile_feature_dashboard','mobile_feature_attendance','mobile_feature_leaves','mobile_feature_tasks','mobile_feature_chat','mobile_feature_employees','mobile_feature_departments','mobile_feature_payroll','mobile_feature_documents','mobile_feature_recruitment','mobile_feature_performance','mobile_feature_reports','mobile_feature_assets','mobile_feature_holidays','mobile_feature_shifts','mobile_feature_audit_logs','mobile_feature_tenants','mobile_feature_cms','mobile_feature_leads','mobile_feature_biometric_login','mobile_feature_2fa_required','mobile_feature_secure_storage','mobile_feature_push_notifications'].includes(key)) category = 'mobile';
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
    { id: 'billing', name: 'Billing & Plan', icon: <FaCreditCard /> },
    { id: 'general', name: 'General', icon: <FaBuilding /> },
    { id: 'attendance', name: 'Attendance', icon: <FaClock /> },
    { id: 'leave', name: 'Leave', icon: <FaUmbrellaBeach /> },
    { id: 'payroll', name: 'Payroll', icon: <FaMoneyBillWave /> },
    { id: 'recruitment', name: 'Recruitment', icon: <FaBullseye /> },
    { id: 'performance', name: 'Performance', icon: <FaChartBar /> },
    { id: 'security', name: 'Security', icon: <FaLock /> },
    { id: 'notifications', name: 'Notifications', icon: <FaBell /> },
    { id: 'mobile', name: 'Mobile App', icon: <FaMobileAlt /> },
    { id: 'documents', name: 'Documents', icon: <FaFile /> },
    { id: 'branding', name: 'Branding', icon: <FaPalette /> },
    { id: 'design', name: 'Design System', icon: <FaPaintBrush /> },
    { id: 'system', name: 'System', icon: <FaCog /> }
  ];

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your organization's configurations</p>
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

          {/* Billing & Subscription Tab */}
          {activeTab === 'billing' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <FaCrown className="text-amber-500" /> Subscription & Billing
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Manage your organization's subscription tier, seat capacity, and billing details.
                  </p>
                </div>

                {/* Currency Switcher */}
                <div className="inline-flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl self-start md:self-auto border border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => setBillingCurrency('INR')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${billingCurrency === 'INR'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    🇮🇳 INR (₹)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCurrency('USD')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${billingCurrency === 'USD'
                      ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    🇺🇸 USD ($)
                  </button>
                </div>
              </div>

              {/* Subscription & Active Seat Capacity Meter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Active Plan & VIP Membership Card */}
                <div className={`border rounded-3xl p-6 shadow-md relative overflow-hidden transition-all ${
                  (subscriptionData?.plan === 'scale' || user?.subscription_plan === 'scale')
                    ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-400/50 dark:border-amber-500/30'
                    : (subscriptionData?.plan === 'hatch' || user?.subscription_plan === 'hatch')
                    ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-400/50 dark:border-emerald-500/30'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                      Membership Status
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wide ${
                      (subscriptionData?.plan === 'scale' || user?.subscription_plan === 'scale')
                        ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                        : (subscriptionData?.plan === 'hatch' || user?.subscription_plan === 'hatch')
                        ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {(subscriptionData?.plan === 'scale' || user?.subscription_plan === 'scale')
                        ? '👑 SCALE VIP'
                        : (subscriptionData?.plan === 'hatch' || user?.subscription_plan === 'hatch')
                        ? '🛡️ HATCH PRO'
                        : 'FREE TRIAL'}
                    </span>
                  </div>
                  <h4 className="text-2xl font-black text-gray-900 dark:text-white capitalize flex items-center gap-2">
                    {subscriptionData?.plan || user?.subscription_plan || 'Free Trial'} Plan
                  </h4>
                  <div className="mt-2 space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <p>
                      {subscriptionData?.expiresAt || user?.subscription_expiry
                        ? `Renews / Active until ${new Date(subscriptionData?.expiresAt || user?.subscription_expiry).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}`
                        : '14-day trial active'}
                    </p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5 font-medium">
                      <span>Cycle: <strong className="capitalize">{user?.billing_cycle || 'Monthly'}</strong></span>
                      <span>•</span>
                      <span>Auto-Pay: <strong>{user?.auto_renew ? 'Enabled' : 'Manual'}</strong></span>
                    </p>
                  </div>
                </div>

                {/* Employee Capacity Utilization Meter */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Employee Seat Capacity
                      </span>
                      <FaUsers className="text-primary-500" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-gray-900 dark:text-white">
                        {user?.active_employees ?? employeeCount}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        / {subscriptionData?.employeeLimit || user?.employee_limit || 15} Seats Assigned
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mt-3 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          ((user?.active_employees ?? employeeCount) / (subscriptionData?.employeeLimit || user?.employee_limit || 15)) > 0.9
                            ? 'bg-red-500'
                            : ((user?.active_employees ?? employeeCount) / (subscriptionData?.employeeLimit || user?.employee_limit || 15)) > 0.75
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              5,
                              ((user?.active_employees ?? employeeCount) / (subscriptionData?.employeeLimit || user?.employee_limit || 15)) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700 text-xs mt-3">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      {Math.max(0, (subscriptionData?.employeeLimit || user?.employee_limit || 15) - (user?.active_employees ?? employeeCount))} Seats Remaining
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setCheckoutPlan({
                          id: subscriptionData?.plan || user?.subscription_plan || 'scale',
                          name: `${(subscriptionData?.plan || user?.subscription_plan || 'scale').toUpperCase()} Plan`,
                          seats: 5,
                          mode: 'add_seats',
                          isAddon: true,
                          currency: billingCurrency,
                        });
                      }}
                      className="text-primary-600 dark:text-primary-400 hover:underline font-bold"
                    >
                      + Add More Seats
                    </button>
                  </div>
                </div>

                {/* Instant Plan / Capacity Upgrade Action Card */}
                <div className="bg-gradient-to-br from-indigo-900 via-indigo-850 to-purple-900 text-white rounded-3xl p-6 shadow-xl flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-white/20 text-white mb-2 shadow-xs">
                      <SparklesIcon className="h-3.5 w-3.5" /> Direct Capacity Upgrade
                    </span>
                    <h4 className="text-lg font-bold">Scale Your HRMS Power</h4>
                    <p className="text-xs text-indigo-200 mt-1">
                      Instantly increase seat capacity, enable automated payroll, ATS recruitment & AI features.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const seats = Math.max(1, seatQuantity || 25);
                      setCheckoutPlan({
                        id: 'scale',
                        name: 'Scale Plan',
                        seats,
                        currency: billingCurrency,
                      });
                    }}
                    className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-indigo-950 text-xs font-black rounded-2xl hover:bg-indigo-50 transition-all shadow-md active:scale-95"
                  >
                    Upgrade / Renew Plan ({seatQuantity || 25} Seats) <FaArrowRight className="text-[10px]" />
                  </button>
                </div>
              </div>

              {/* Interactive Employee Seats Selector & Pricing Calculator */}
              <div className="bg-gradient-to-r from-primary-500/10 via-primary-500/5 to-transparent border border-primary-500/30 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-400">
                      Dynamic Seat Sizing
                    </span>
                    <h4 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                      How many employees are in your organization?
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Pricing automatically adjusts per active employee seat. Scale up or down at any time.
                    </p>
                  </div>

                  {/* Seat Input & Stepper */}
                  <div className="flex items-center gap-3 self-start md:self-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 shadow-sm">
                    <button
                      type="button"
                      onClick={() => setSeatQuantity(Math.max(1, (seatQuantity || 15) - 5))}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <div className="flex items-center gap-1.5 px-2">
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        value={seatQuantity}
                        onChange={(e) => setSeatQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-16 text-center font-black text-lg bg-transparent border-0 focus:ring-0 text-gray-900 dark:text-white p-0"
                      />
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Seats</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSeatQuantity((seatQuantity || 15) + 5)}
                      className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 font-bold text-gray-700 dark:text-gray-200 flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Range Slider */}
                <div className="space-y-2">
                  <input
                    type="range"
                    min="1"
                    max="200"
                    step="1"
                    value={seatQuantity}
                    onChange={(e) => setSeatQuantity(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 font-medium px-1">
                    <span>1 Employee</span>
                    <span>25</span>
                    <span>50</span>
                    <span>100</span>
                    <span>150</span>
                    <span>200+ Employees</span>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-primary-500/20">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">
                    Quick Presets:
                  </span>
                  {[5, 10, 25, 50, 100, 250].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setSeatQuantity(preset)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg border transition-all ${
                        seatQuantity === preset
                          ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-400'
                      }`}
                    >
                      {preset} Employees
                    </button>
                  ))}
                </div>
              </div>

              {/* Plans Comparison Grid */}
              <div>
                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-4">
                  Available Subscription Plans for {seatQuantity} Employee{seatQuantity > 1 ? 's' : ''}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Hatch Plan */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-primary-400 transition-all">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-lg font-bold text-gray-900 dark:text-white">Hatch</h5>
                        {(subscriptionData?.plan === 'hatch' || user?.subscription_plan === 'hatch') && (
                          <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                            Current Tier
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Essential HR & Attendance for growing teams.
                      </p>

                      <div className="mb-4 bg-gray-50 dark:bg-gray-900/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {billingCurrency === 'INR' ? '₹299' : '$4'} / employee / month
                        </div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                          {billingCurrency === 'INR'
                            ? `₹${(seatQuantity * 299).toLocaleString('en-IN')}`
                            : `$${(seatQuantity * 4).toFixed(2)}`}
                          <span className="text-xs text-gray-500 font-normal"> / month</span>
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                          Total for {seatQuantity} employee seat{seatQuantity > 1 ? 's' : ''}
                        </div>
                      </div>

                      <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-2">
                          <FaCheck className="text-emerald-500 shrink-0" /> {seatQuantity} Employee Seats Included
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheck className="text-emerald-500 shrink-0" /> Attendance & Clock-in with Geofence
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheck className="text-emerald-500 shrink-0" /> Leave Management & Approvals
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheck className="text-emerald-500 shrink-0" /> Employee Directory & Org Chart
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheck className="text-emerald-500 shrink-0" /> Basic Reports & Export
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const seats = Math.max(1, seatQuantity || 10);
                        setCheckoutPlan({
                          id: 'hatch',
                          name: 'Hatch Plan',
                          seats,
                          price: billingCurrency === 'INR' ? (seats * 299) : (seats * 4),
                          currency: billingCurrency,
                        });
                      }}
                      className="mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
                    >
                      Choose Hatch ({seatQuantity} Seats)
                    </button>
                  </div>

                  {/* Scale Plan */}
                  <div className="bg-white dark:bg-gray-800 border-2 border-primary-500 rounded-2xl p-6 shadow-xl relative flex flex-col justify-between">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-500 text-white text-[10px] uppercase font-black tracking-widest py-0.5 px-3 rounded-full shadow-sm">
                      Most Popular
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2 mt-1">
                        <h5 className="text-lg font-bold text-gray-900 dark:text-white">Scale</h5>
                        {(subscriptionData?.plan === 'scale' || user?.subscription_plan === 'scale') && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Current Tier
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Full-suite HRMS with Automated Payroll, Performance & ATS.
                      </p>

                      <div className="mb-4 bg-primary-50/70 dark:bg-primary-950/40 p-3 rounded-xl border border-primary-200/60 dark:border-primary-800/40">
                        <div className="text-xs text-primary-700 dark:text-primary-300 font-semibold">
                          {billingCurrency === 'INR' ? '₹799' : '$10'} / employee / month
                        </div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
                          {billingCurrency === 'INR'
                            ? `₹${(seatQuantity * 799).toLocaleString('en-IN')}`
                            : `$${(seatQuantity * 10).toFixed(2)}`}
                          <span className="text-xs text-gray-500 font-normal"> / month</span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                          Total for {seatQuantity} employee seat{seatQuantity > 1 ? 's' : ''}
                        </div>
                      </div>

                      <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                          <FaCheck className="text-emerald-500 shrink-0" /> {seatQuantity} Employee Seats Included
                        </li>
                        <li className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          <FaCheck className="text-emerald-500 shrink-0" /> Automated Payroll & Payslip Generation
                        </li>
                        <li className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          <FaCheck className="text-emerald-500 shrink-0" /> Performance Reviews, Goals & KPIs
                        </li>
                        <li className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                          <FaCheck className="text-emerald-500 shrink-0" /> Recruitment & ATS Hiring Pipeline
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheck className="text-emerald-500 shrink-0" /> Advanced Analytics & Churn Risk Reports
                        </li>
                      </ul>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        const seats = Math.max(1, seatQuantity || 25);
                        setCheckoutPlan({
                          id: 'scale',
                          name: 'Scale Plan',
                          seats,
                          price: billingCurrency === 'INR' ? (seats * 799) : (seats * 10),
                          currency: billingCurrency,
                        });
                      }}
                      className="mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg transition-all"
                    >
                      Upgrade to Scale ({seatQuantity} Seats)
                    </button>
                  </div>

                  {/* Enterprise Plan */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all">
                    <div>
                      <h5 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Enterprise</h5>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Custom workflows, multi-branch, dedicated SLA, and volume scale.
                      </p>
                      <div className="mb-6">
                        <span className="text-3xl font-black text-gray-900 dark:text-white">Custom</span>
                      </div>

                      <ul className="space-y-2.5 text-xs text-gray-600 dark:text-gray-300">
                        <li className="flex items-center gap-2">
                          <FaCheck className="text-emerald-500 shrink-0" /> Unlimited Employees & Multi-Branch
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheck className="text-emerald-500 shrink-0" /> Custom Domain & White-label Branding
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheck className="text-emerald-500 shrink-0" /> 24/7 Dedicated Account Manager & SLA
                        </li>
                        <li className="flex items-center gap-2">
                          <FaCheck className="text-emerald-500 shrink-0" /> Biometric Hardware API Integration
                        </li>
                      </ul>
                    </div>

                    <a
                      href="mailto:support@hrmspro.online?subject=Enterprise%20Plan%20Inquiry"
                      className="mt-6 w-full py-2.5 px-4 rounded-xl font-bold text-xs text-center border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors block"
                    >
                      Contact Sales
                    </a>
                  </div>
                </div>
              </div>

              {/* Billing Security Badge */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-3">
                  <FaShieldAlt className="text-emerald-500 text-lg shrink-0" />
                  <span>
                    All transactions are 256-bit SSL encrypted. India payments powered by <strong>Razorpay (UPI / Cards / NetBanking)</strong>; Global payments via <strong>PayPal</strong>.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    Razorpay Verified
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">
                    PayPal Verified
                  </span>
                </div>
              </div>

              {/* Company Tax & Billing Information Profile Form */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FaBuilding className="text-primary-600" />
                      Company Tax & Official Invoicing Details
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      This information appears on your official tax invoices and payment receipts.
                    </p>
                  </div>
                </div>

                {billingProfileSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-600" />
                    <span>{billingProfileSuccess}</span>
                  </div>
                )}
                {billingProfileError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-800 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                    <FaExclamationCircle className="text-red-600" />
                    <span>{billingProfileError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveBillingProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Billing Contact Person</label>
                      <input
                        type="text"
                        className="form-input w-full text-xs"
                        placeholder="e.g. John Doe (Finance Head)"
                        value={tenantBillingProfile.contact_person}
                        onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, contact_person: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Billing / Accounts Email</label>
                      <input
                        type="email"
                        className="form-input w-full text-xs"
                        placeholder="billing@yourcompany.com"
                        value={tenantBillingProfile.contact_email}
                        onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, contact_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                      <input
                        type="text"
                        className="form-input w-full text-xs"
                        placeholder="+91 98765 43210"
                        value={tenantBillingProfile.contact_phone}
                        onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, contact_phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Registered Billing Address</label>
                      <input
                        type="text"
                        className="form-input w-full text-xs"
                        placeholder="Office address, Building, Street"
                        value={tenantBillingProfile.billing_address}
                        onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, billing_address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Tax ID / GSTIN Number</label>
                      <input
                        type="text"
                        className="form-input w-full text-xs font-mono"
                        placeholder="e.g. 07AAAAA0000A1Z5"
                        value={tenantBillingProfile.tax_id}
                        onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, tax_id: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">City</label>
                      <input
                        type="text"
                        className="form-input w-full text-xs"
                        placeholder="e.g. Mumbai"
                        value={tenantBillingProfile.city}
                        onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, city: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">Country</label>
                      <input
                        type="text"
                        className="form-input w-full text-xs"
                        placeholder="e.g. India"
                        value={tenantBillingProfile.country}
                        onChange={(e) => setTenantBillingProfile({ ...tenantBillingProfile, country: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="submit"
                      disabled={savingBillingProfile}
                      className="btn btn-primary text-xs flex items-center gap-1.5"
                    >
                      <FaSave className="text-xs" />
                      {savingBillingProfile ? 'Saving...' : 'Save Invoicing Profile'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Billing History & Invoices Section */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
                      Purchase History & Tax Invoices
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Download official GST invoices, payment receipts, and statement of account.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowStatementModal(true)}
                    className="btn btn-secondary btn-xs text-xs flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <DocumentChartBarIcon className="w-4 h-4 text-indigo-600" />
                    Download Statement of Account
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Date & Time</th>
                        <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Invoice #</th>
                        <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Plan Purchased</th>
                        <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Amount</th>
                        <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Payment Gateway</th>
                        <th className="p-3 font-bold text-gray-700 dark:text-gray-300">Status</th>
                        <th className="p-3 font-bold text-gray-700 dark:text-gray-300 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {tenantInvoices.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-8 text-gray-400">
                            <div className="flex flex-col items-center">
                              <FaCreditCard className="text-gray-300 text-3xl mb-2" />
                              <p className="font-medium text-xs">No payment records found yet</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">Your official tax invoices will appear here once you upgrade.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        tenantInvoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors">
                            <td className="p-3 text-gray-500 whitespace-nowrap">
                              {new Date(inv.created_at).toLocaleDateString()} <span className="text-[10px] text-gray-400">{new Date(inv.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="p-3 font-mono font-bold text-gray-900 dark:text-white">
                              {inv.invoice_number || `INV-${inv.id}`}
                            </td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-primary-50 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-100 dark:border-primary-800">
                                {inv.plan_id}
                              </span>
                            </td>
                            <td className="p-3 font-black text-gray-900 dark:text-white">
                              {inv.currency === 'INR' ? '₹' : '$'}{parseFloat(inv.amount).toLocaleString()}
                            </td>
                            <td className="p-3 uppercase text-[10px] font-bold text-gray-600 dark:text-gray-400">
                              {inv.gateway?.replace('_', ' ')}
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                inv.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : inv.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => setActiveInvoiceId(inv.id)}
                                className="btn btn-secondary btn-xs text-xs flex items-center gap-1 text-emerald-700 hover:text-emerald-800 ml-auto"
                              >
                                <EyeIcon className="w-3.5 h-3.5" />
                                View Invoice
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Printable Invoice Modal */}
              {activeInvoiceId && (
                <InvoiceModal invoiceId={activeInvoiceId} onClose={() => setActiveInvoiceId(null)} />
              )}

              {/* Statement of Account Modal */}
              {showStatementModal && (
                <StatementModal
                  tenant={{
                    ...subscriptionData,
                    name: formData.company_name || 'My Organization',
                    tenant_id: user?.tenantId,
                    contact_email: tenantBillingProfile.contact_email || formData.company_email,
                    tax_id: tenantBillingProfile.tax_id
                  }}
                  invoices={tenantInvoices}
                  onClose={() => setShowStatementModal(false)}
                />
              )}

              {/* Unified Subscription Checkout Modal (Razorpay + PayPal Switcher) */}
              {checkoutPlan && (
                <SubscriptionCheckoutModal
                  plan={checkoutPlan}
                  onClose={() => setCheckoutPlan(null)}
                  onSuccess={() => {
                    setCheckoutPlan(null);
                    loadBillingData();
                    if (refreshProfile) refreshProfile();
                  }}
                />
              )}
            </div>
          )}

          {/* General Settings */}
          {activeTab === 'general' && (
            <>
              <div className="card p-6">
                <h3 className="mb-6">General Settings</h3>
                <div className="grid grid-cols-2 gap-4">
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
                  <div className="form-group col-span-2">
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

              <div className="card p-6 mt-4">
                <h3 className="mb-6">Theme Settings</h3>
                <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                      <FaPaintBrush size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-800">Dark Mode</h4>
                      <p className="text-xs text-neutral-500">Switch between light and dark appearance</p>
                    </div>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-200 focus:outline-none ${dark ? 'bg-primary-500' : 'bg-neutral-300'}`}
                  >
                    <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-200 ${dark ? 'translate-x-6' : 'translate-x-1'}`}>
                      {dark ? <FaMoon className="text-xs text-primary-600" /> : <FaSun className="text-xs text-amber-500" />}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Attendance Settings */}
          {activeTab === 'attendance' && (
            <div className="card p-6">
              <h3 className="mb-6">Attendance Settings</h3>
              <div className="grid grid-cols-2 gap-4">
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
                  <small className="text-neutral-400">e.g., 1.5 for 150% of regular pay</small>
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
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.overtime_enabled === 'true'} onChange={(e) => handleChange('overtime_enabled', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    Enable Overtime Tracking
                  </label>
                </div>
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.auto_clock_out === 'true'} onChange={(e) => handleChange('auto_clock_out', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    Auto Clock-Out at End of Day
                  </label>
                </div>

                <div className="col-span-2 mt-8 pt-6 border-t border-neutral-100">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
                      <FaClock size={16} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-neutral-800">Advanced Geofencing</h4>
                      <p className="text-xs text-neutral-500">Secure your attendance by restricting check-ins to authorized locations.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-4 bg-neutral-50 p-6 rounded-xl border border-neutral-200">
                    <div className="form-group">
                      <label className="form-label text-neutral-700 font-semibold mb-1 flex items-center gap-2">
                        Office Latitude
                      </label>
                      <input type="text" className="form-input bg-white" value={formData.office_latitude || ''} onChange={(e) => handleChange('office_latitude', e.target.value)} placeholder="e.g. 37.7749" />
                      <p className="text-[10px] text-neutral-400 mt-1">Use decimal format (e.g., 28.6139)</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-neutral-700 font-semibold mb-1 flex items-center gap-2">
                        Office Longitude
                      </label>
                      <input type="text" className="form-input bg-white" value={formData.office_longitude || ''} onChange={(e) => handleChange('office_longitude', e.target.value)} placeholder="e.g. -122.4194" />
                      <p className="text-[10px] text-neutral-400 mt-1">Use decimal format (e.g., 77.2090)</p>
                    </div>

                    <div className="form-group">
                      <label className="form-label text-neutral-700 font-semibold mb-1">Allowed Radius (Meters)</label>
                      <div className="relative">
                        <input type="number" className="form-input bg-white pr-10" value={formData.geofence_radius || ''} onChange={(e) => handleChange('geofence_radius', e.target.value)} />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-neutral-400">m</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1">Recommended: 200m - 500m</p>
                    </div>

                    <div className="form-group flex items-end pb-1">
                      <label className="flex items-center gap-3 p-3 bg-white border border-neutral-200 rounded-lg cursor-pointer hover:border-primary-300 transition-colors w-full group">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            className="w-5 h-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                            checked={formData.strict_geofence === 'true'}
                            onChange={(e) => handleChange('strict_geofence', e.target.checked ? 'true' : 'false')}
                          />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-neutral-700 block group-hover:text-primary-600 transition-colors">Strict Geofencing</span>
                          <span className="text-[10px] text-neutral-500 leading-tight block">Block check-ins outside the radius.</span>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Leave Settings */}
          {activeTab === 'leave' && (
            <div className="card p-6">
              <h3 className="mb-6">Leave Settings</h3>
              <div className="grid grid-cols-2 gap-4">
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
                  <small className="text-neutral-400">Minimum days notice required for leave request</small>
                </div>
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.carry_forward_enabled === 'true'} onChange={(e) => handleChange('carry_forward_enabled', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    Allow Leave Carry Forward
                  </label>
                </div>
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.leave_approval_required === 'true'} onChange={(e) => handleChange('leave_approval_required', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    Require Manager Approval
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Payroll Settings */}
          {activeTab === 'payroll' && (
            <div className="card p-6">
              <h3 className="mb-6">Payroll Settings</h3>
              <div className="grid grid-cols-2 gap-4">
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
                  <small className="text-neutral-400">Displayed throughout the system (e.g., $, €, £, Rs.)</small>
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
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.tax_enabled === 'true'} onChange={(e) => handleChange('tax_enabled', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    Enable Tax Calculations
                  </label>
                </div>
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.bonus_enabled === 'true'} onChange={(e) => handleChange('bonus_enabled', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    Enable Bonus Payments
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="card p-6">
              <h3 className="mb-6">Security Settings</h3>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.password_require_uppercase === 'true'} onChange={(e) => handleChange('password_require_uppercase', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    Require Uppercase in Password
                  </label>
                </div>
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.password_require_number === 'true'} onChange={(e) => handleChange('password_require_number', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    Require Number in Password
                  </label>
                </div>
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.two_factor_auth === 'true'} onChange={(e) => handleChange('two_factor_auth', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    Enable Two-Factor Authentication
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Dynamic Notification Preferences Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="card p-6 border border-neutral-200 dark:border-gray-700 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-700 pb-4 mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FaBell className="text-primary-600" /> Organization Notification & Web Push Engine
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Configure delivery channels, browser desktop push notifications, and granular module alert triggers.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestSound}
                    className="btn btn-secondary btn-xs text-xs flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <FaBolt className="text-amber-500 text-xs" /> Test Audio Chime
                  </button>
                </div>

                {notifSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                    <FaCheckCircle className="text-emerald-600" />
                    <span>{notifSuccess}</span>
                  </div>
                )}
                {notifError && (
                  <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 text-red-800 dark:text-red-300 rounded-xl text-xs flex items-center gap-2">
                    <FaExclamationCircle className="text-red-600" />
                    <span>{notifError}</span>
                  </div>
                )}

                <form onSubmit={handleSaveNotificationSettings} className="space-y-6">
                  {/* Channels Grid */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Delivery Channels</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Browser Desktop Push */}
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                              <FaGlobe className="text-indigo-500" /> Browser Web Push
                            </span>
                            <input
                              type="checkbox"
                              checked={notifSettings.enable_web_push}
                              onChange={(e) => setNotifSettings({ ...notifSettings, enable_web_push: e.target.checked })}
                              className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Receive instant desktop notifications even when HRMS Pro is in the background.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-gray-700 flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            browserPushPermission === 'granted'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}>
                            Status: {browserPushPermission}
                          </span>
                          {browserPushPermission !== 'granted' && (
                            <button
                              type="button"
                              onClick={handleRequestBrowserPermission}
                              className="text-[10px] font-bold text-primary-600 hover:text-primary-700 underline"
                            >
                              Enable in Browser
                            </button>
                          )}
                        </div>
                      </div>

                      {/* In-App Audio Chime */}
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                              <FaBell className="text-amber-500" /> In-App Audio Chime
                            </span>
                            <input
                              type="checkbox"
                              checked={notifSettings.enable_in_app_sound}
                              onChange={(e) => setNotifSettings({ ...notifSettings, enable_in_app_sound: e.target.checked })}
                              className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Play a pleasant harmonic chime when new tasks, chats, or approvals are received.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-gray-700">
                          <span className="text-[10px] text-gray-400">Web Audio API synth enabled</span>
                        </div>
                      </div>

                      {/* Email Notifications */}
                      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-xs text-gray-900 dark:text-white flex items-center gap-1.5">
                              <FaEnvelope className="text-emerald-500" /> Email Notifications
                            </span>
                            <input
                              type="checkbox"
                              checked={notifSettings.enable_email_alerts}
                              onChange={(e) => setNotifSettings({ ...notifSettings, enable_email_alerts: e.target.checked })}
                              className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400">
                            Dispatch transactional email alerts for critical approvals, payroll runs, and account changes.
                          </p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-200/60 dark:border-gray-700">
                          <span className="text-[10px] text-gray-400">Powered by Brevo / SMTP Queue</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Granular Module Event Rules Matrix */}
                  <div>
                    <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-3">Granular Event Trigger Matrix</h4>
                    <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="p-3 font-bold text-gray-700 dark:text-gray-300">System Event & Activity</th>
                            <th className="p-3 font-bold text-gray-700 dark:text-gray-300 text-center">In-App Feed & Badge</th>
                            <th className="p-3 font-bold text-gray-700 dark:text-gray-300 text-center">Web Push Alert</th>
                            <th className="p-3 font-bold text-gray-700 dark:text-gray-300 text-center">Email Dispatch</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {[
                            { key: 'leave_request', label: 'Leave Application Submitted', desc: 'Alerts manager & HR when an employee requests time off' },
                            { key: 'leave_approval', label: 'Leave Request Approved / Rejected', desc: 'Notifies employee when their leave request decision is made' },
                            { key: 'attendance_regularization', label: 'Attendance Regularization Request', desc: 'Alerts manager when clock-in discrepancy claim is filed' },
                            { key: 'task_assigned', label: 'Task Assigned / Status Updated', desc: 'Notifies assignees when tasks or due dates change' },
                            { key: 'payroll_published', label: 'Payroll Finalized & Payslip Published', desc: 'Notifies employees when monthly payslips are ready' },
                            { key: 'chat_message', label: 'Team Chat Direct & Channel Messages', desc: 'Real-time badge and desktop alert for incoming messages' },
                            { key: 'system_announcement', label: 'Company Announcements & Policy Updates', desc: 'Broadcast notifications to all active organization members' }
                          ].map(ev => {
                            const rule = notifSettings.event_rules?.[ev.key] || { in_app: true, push: true, email: true };
                            return (
                              <tr key={ev.key} className="hover:bg-gray-50/70 dark:hover:bg-gray-750 transition-colors">
                                <td className="p-3">
                                  <div className="font-bold text-gray-900 dark:text-white">{ev.label}</div>
                                  <div className="text-[10px] text-gray-500 dark:text-gray-400">{ev.desc}</div>
                                </td>
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={rule.in_app ?? true}
                                    onChange={(e) => {
                                      const nextRules = { ...notifSettings.event_rules, [ev.key]: { ...rule, in_app: e.target.checked } };
                                      setNotifSettings({ ...notifSettings, event_rules: nextRules });
                                    }}
                                    className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={rule.push ?? true}
                                    onChange={(e) => {
                                      const nextRules = { ...notifSettings.event_rules, [ev.key]: { ...rule, push: e.target.checked } };
                                      setNotifSettings({ ...notifSettings, event_rules: nextRules });
                                    }}
                                    className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <input
                                    type="checkbox"
                                    checked={rule.email ?? true}
                                    onChange={(e) => {
                                      const nextRules = { ...notifSettings.event_rules, [ev.key]: { ...rule, email: e.target.checked } };
                                      setNotifSettings({ ...notifSettings, event_rules: nextRules });
                                    }}
                                    className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                                  />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      type="submit"
                      disabled={savingNotifSettings}
                      className="btn btn-primary text-xs flex items-center gap-1.5"
                    >
                      <FaSave className="text-xs" />
                      {savingNotifSettings ? 'Saving...' : 'Save Notification Preferences'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Mobile App Settings */}
          {activeTab === 'mobile' && (
            <div className="card p-6">
              <h3 className="mb-6">Mobile App Controls</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Enable Mobile App</label>
                  <select className="form-input" value={formData.mobile_app_enabled || 'true'} onChange={(e) => handleChange('mobile_app_enabled', e.target.value)}>
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Require Mobile 2FA</label>
                  <select className="form-input" value={formData.mobile_feature_2fa_required || 'false'} onChange={(e) => handleChange('mobile_feature_2fa_required', e.target.value)}>
                    <option value="false">Disabled</option>
                    <option value="true">Enabled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Biometric Login</label>
                  <select className="form-input" value={formData.mobile_feature_biometric_login || 'true'} onChange={(e) => handleChange('mobile_feature_biometric_login', e.target.value)}>
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Secure Storage</label>
                  <select className="form-input" value={formData.mobile_feature_secure_storage || 'true'} onChange={(e) => handleChange('mobile_feature_secure_storage', e.target.value)}>
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Push Notifications</label>
                  <select className="form-input" value={formData.mobile_feature_push_notifications || 'true'} onChange={(e) => handleChange('mobile_feature_push_notifications', e.target.value)}>
                    <option value="true">Enabled</option>
                    <option value="false">Disabled</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                {[
                  { key: 'mobile_feature_dashboard', label: 'Dashboard' },
                  { key: 'mobile_feature_attendance', label: 'Attendance' },
                  { key: 'mobile_feature_leaves', label: 'Leaves' },
                  { key: 'mobile_feature_tasks', label: 'Tasks' },
                  { key: 'mobile_feature_chat', label: 'Chat' },
                  { key: 'mobile_feature_employees', label: 'Employees' },
                  { key: 'mobile_feature_departments', label: 'Departments' },
                  { key: 'mobile_feature_payroll', label: 'Payroll' },
                  { key: 'mobile_feature_documents', label: 'Documents' },
                  { key: 'mobile_feature_recruitment', label: 'Recruitment' },
                  { key: 'mobile_feature_performance', label: 'Performance' },
                  { key: 'mobile_feature_reports', label: 'Reports' },
                  { key: 'mobile_feature_assets', label: 'Assets' },
                  { key: 'mobile_feature_holidays', label: 'Holidays' },
                  { key: 'mobile_feature_shifts', label: 'Shifts' },
                  { key: 'mobile_feature_audit_logs', label: 'Audit Logs' },
                  { key: 'mobile_feature_tenants', label: 'Tenants' },
                  { key: 'mobile_feature_cms', label: 'CMS' },
                  { key: 'mobile_feature_leads', label: 'Leads' }
                ].map(feature => (
                  <div key={feature.key} className="form-group">
                    <label className="form-label">{feature.label}</label>
                    <select className="form-input" value={formData[feature.key] || 'false'} onChange={(e) => handleChange(feature.key, e.target.value)}>
                      <option value="true">Enabled</option>
                      <option value="false">Disabled</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Branding Settings */}
          {activeTab === 'branding' && (
            <div className="card p-6">
              <h3 className="mb-6">Branding & Customization</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Primary Brand Color</label>
                  <div className="flex items-center gap-4">
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
                  <small className="text-neutral-400">Used for buttons, links, and active states.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Secondary Brand Color</label>
                  <div className="flex items-center gap-4">
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
                  <small className="text-neutral-400">Used for headers, sidebars, and text.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Company Logo URL</label>
                  <input type="url" className="form-input" value={formData.company_logo || ''} onChange={(e) => handleChange('company_logo', e.target.value)} placeholder="https://example.com/logo.png" />
                  {formData.company_logo && (
                    <div className="mt-2 p-4 rounded-lg text-center bg-neutral-100">
                      <p className="text-xs mb-2 text-neutral-400">Preview</p>
                      <img src={formData.company_logo} alt="Logo Preview" className="max-h-[60px]" />
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
            <div className="card p-6">
              <div className="flex justify-between items-center mb-6">
                <h3>Design System</h3>
                <button className="btn btn-secondary" onClick={resetDesignToDefaults}>
                  Reset to Defaults
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">Primary Color</label>
                  <div className="flex items-center gap-4">
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
                  <small className="text-neutral-400">Used for primary buttons, links, and highlights.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Secondary Color</label>
                  <div className="flex items-center gap-4">
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
                  <small className="text-neutral-400">Used for headers, sidebars, and secondary elements.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Success Color</label>
                  <div className="flex items-center gap-4">
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
                  <small className="text-neutral-400">Used for success messages and positive actions.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Warning Color</label>
                  <div className="flex items-center gap-4">
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
                  <small className="text-neutral-400">Used for warnings and cautionary actions.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Danger Color</label>
                  <div className="flex items-center gap-4">
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
                  <small className="text-neutral-400">Used for errors and destructive actions.</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Info Color</label>
                  <div className="flex items-center gap-4">
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
                  <small className="text-neutral-400">Used for informational elements.</small>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_font_size_base || '14px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_font_size_sm || '12px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_font_size_lg || '16px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_border_radius || '6px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_border_radius_sm || '4px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_border_radius_lg || '8px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_spacing_unit || '4px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_sidebar_width || '280px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_header_height || '64px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_button_padding_x || '12px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_button_padding_y || '6px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_card_padding || '16px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_input_height || '36px'}</span>
                    <span>64px</span>
                  </div>
                </div>

                <div className="form-group col-span-2">
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

                <div className="form-group col-span-2">
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
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_dashboard_widget_radius || '8px'}</span>
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
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_badge_radius || '12px'}</span>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_form_group_spacing || '16px'}</span>
                    <span>32px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Modal Backdrop</label>
                  <div className="flex items-center gap-4">
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_progress_bar_height || '8px'}</span>
                    <span>20px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Avatar Sizes</label>
                  <div className="flex gap-4 mt-2">
                    <div className="flex-1">
                      <label className="text-xs">Small</label>
                      <input
                        type="range"
                        min="16"
                        max="48"
                        step="1"
                        value={parseInt(formData.design_avatar_size_sm || '24')}
                        onChange={(e) => handleChange('design_avatar_size_sm', `${e.target.value}px`)}
                        className="w-full"
                      />
                      <div className="text-center text-xs">{formData.design_avatar_size_sm || '24px'}</div>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs">Medium</label>
                      <input
                        type="range"
                        min="24"
                        max="64"
                        step="1"
                        value={parseInt(formData.design_avatar_size_md || '32')}
                        onChange={(e) => handleChange('design_avatar_size_md', `${e.target.value}px`)}
                        className="w-full"
                      />
                      <div className="text-center text-xs">{formData.design_avatar_size_md || '32px'}</div>
                    </div>
                    <div className="flex-1">
                      <label className="text-xs">Large</label>
                      <input
                        type="range"
                        min="32"
                        max="96"
                        step="1"
                        value={parseInt(formData.design_avatar_size_lg || '48')}
                        onChange={(e) => handleChange('design_avatar_size_lg', `${e.target.value}px`)}
                        className="w-full"
                      />
                      <div className="text-center text-xs">{formData.design_avatar_size_lg || '48px'}</div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tooltip Background</label>
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                <div className="form-group col-span-2">
                  <h4 className="mt-8 mb-4 pb-2 border-b border-neutral-200">
                    Module-Specific Design Settings
                  </h4>
                </div>

                {/* Recruitment Module Settings */}
                <div className="form-group col-span-2">
                  <h5 className="mb-4">Recruitment Module</h5>
                </div>

                <div className="form-group">
                  <label className="form-label">Recruitment Card Background</label>
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>0px</span>
                    <span className="font-bold">{formData.design_recruitment_status_badge_radius || '12px'}</span>
                    <span>20px</span>
                  </div>
                </div>

                {/* Performance Module Settings */}
                <div className="form-group col-span-2">
                  <h5 className="mb-4 mt-4">Performance Module</h5>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>100px</span>
                    <span className="font-bold">{formData.design_performance_chart_height || '300px'}</span>
                    <span>500px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Performance Review Card Background</label>
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                <div className="form-group col-span-2">
                  <h5 className="mb-4 mt-4">Payroll Module</h5>
                </div>

                <div className="form-group">
                  <label className="form-label">Payroll Summary Card Background</label>
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                <div className="form-group col-span-2">
                  <h5 className="mb-4 mt-4">Leave Module</h5>
                </div>

                <div className="form-group">
                  <label className="form-label">Leave Request Card Background</label>
                  <div className="flex items-center gap-4">
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
                    className="w-full"
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                    <span>50px</span>
                    <span className="font-bold">{formData.design_leave_calendar_cell_height || '100px'}</span>
                    <span>200px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Approved Leave Status Color</label>
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                <div className="form-group col-span-2">
                  <h5 className="mb-4 mt-4">Attendance Module</h5>
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
                    className="w-full"
                  />
                  <div className="flex justify-between mt-2">
                    <span>100px</span>
                    <span className="font-bold">{formData.design_attendance_chart_height || '300px'}</span>
                    <span>500px</span>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Present Status Color</label>
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                <div className="form-group col-span-2">
                  <h5 className="mb-4 mt-4">Task Module</h5>
                </div>

                <div className="form-group">
                  <label className="form-label">Task Card Background</label>
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
                  <div className="flex items-center gap-4">
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
            <div className="card p-6">
              <h3 className="mb-6">System Settings</h3>
              <div className="grid grid-cols-2 gap-4">
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
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.backup_enabled === 'true'} onChange={(e) => handleChange('backup_enabled', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    Enable Automatic Backups
                  </label>
                </div>
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.audit_logging === 'true'} onChange={(e) => handleChange('audit_logging', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    Enable Audit Logging
                  </label>
                </div>
                <div className="form-group col-span-2">
                  <label className="flex items-center cursor-pointer">
                    <input type="checkbox" checked={formData.maintenance_mode === 'true'} onChange={(e) => handleChange('maintenance_mode', e.target.checked ? 'true' : 'false')} className="mr-2" />
                    <span className="text-red-600">Maintenance Mode (disables access for non-admins)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Other tabs placeholder */}
          {['recruitment', 'performance', 'notifications', 'documents'].includes(activeTab) && (
            <div className="card text-center py-12 px-6">
              <h3 className="mb-4">{categories.find(c => c.id === activeTab)?.icon} {categories.find(c => c.id === activeTab)?.name} Settings</h3>
              <p className="text-neutral-400 mb-6">Advanced settings for {activeTab} will be configured based on your needs.</p>
              <p className="text-sm text-neutral-400">Contact administrator for custom configuration.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
