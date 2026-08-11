export const hasAccess = (user, roles = [], permissions = []) => {
  if (!user) return false;
  if (roles.length === 0 && permissions.length === 0) return true;
  if (roles.includes(user.role)) return true;

  const userPermissions = Array.isArray(user.permissions) ? user.permissions : [];
  return permissions.some((permission) => userPermissions.includes(permission));
};

export const isSuperAdminTenant = (user, tenantId) => {
  return user?.role === 'admin' && tenantId === 'tenant_default';
};

const MOBILE_FEATURE_KEY = {
  dashboard: 'mobile_feature_dashboard',
  attendance: 'mobile_feature_attendance',
  leaves: 'mobile_feature_leaves',
  tasks: 'mobile_feature_tasks',
  chat: 'mobile_feature_chat',
  employees: 'mobile_feature_employees',
  departments: 'mobile_feature_departments',
  payroll: 'mobile_feature_payroll',
  payrollSelf: 'mobile_feature_payroll',
  documents: 'mobile_feature_documents',
  recruitment: 'mobile_feature_recruitment',
  performance: 'mobile_feature_performance',
  reports: 'mobile_feature_reports',
  assets: 'mobile_feature_assets',
  holidays: 'mobile_feature_holidays',
  shifts: 'mobile_feature_shifts',
  auditLogs: 'mobile_feature_audit_logs',
  tenants: 'mobile_feature_tenants',
  cms: 'mobile_feature_cms',
  leads: 'mobile_feature_leads',
};

export const MODULE_ACCESS = {
  dashboard: {},
  profile: {},
  chat: {},
  attendance: {},
  leaves: {},
  tasks: {},
  performance: {},
  documents: {},
  assets: {},
  holidays: {},
  shifts: { roles: ['admin', 'manager'], permissions: ['attendance:update'] },
  employees: { roles: ['admin', 'manager'], permissions: ['employees:read'] },
  departments: { roles: ['admin', 'manager'], permissions: ['departments:read'] },
  payroll: { roles: ['admin', 'manager'], permissions: ['payroll:read'] },
  recruitment: { roles: ['admin', 'manager'], permissions: ['recruitment:read'] },
  reports: { roles: ['admin', 'manager'], permissions: ['reports:read'] },
  settings: { roles: ['admin'], permissions: ['settings:read'] },
  auditLogs: { roles: ['admin'], permissions: ['audit_logs:read'] },
  cms: { superAdmin: true },
  tenants: { superAdmin: true },
  leads: { superAdmin: true },
};

const isMobileFeatureEnabled = (moduleKey, mobileSettings) => {
  if (!mobileSettings) return true;
  const settingKey = MOBILE_FEATURE_KEY[moduleKey];
  if (!settingKey) return true;
  const value = mobileSettings[settingKey];
  return value !== 'false' && value !== false;
};

export const canOpenModule = (user, tenantId, moduleKey, mobileSettings) => {
  if (!isMobileFeatureEnabled(moduleKey, mobileSettings)) return false;

  const access = MODULE_ACCESS[moduleKey] || {};
  if (access.superAdmin) return isSuperAdminTenant(user, tenantId);
  return hasAccess(user, access.roles || [], access.permissions || []);
};
