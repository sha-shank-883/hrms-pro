// Define all available modules and their allowed operations
export const PERMISSION_MODULES = [
  { id: 'employees', label: 'Employees', operations: ['read', 'create', 'update', 'delete'] },
  { id: 'departments', label: 'Departments', operations: ['read', 'create', 'update', 'delete'] },
  { id: 'attendance', label: 'Attendance', operations: ['read', 'create', 'update', 'delete'] },
  { id: 'leaves', label: 'Leaves', operations: ['read', 'create', 'update', 'delete', 'approve'] },
  { id: 'tasks', label: 'Tasks', operations: ['read', 'create', 'update', 'delete'] },
  { id: 'performance', label: 'Performance', operations: ['read', 'create', 'update', 'delete'] },
  { id: 'payroll', label: 'Payroll', operations: ['read', 'create', 'update', 'delete'] },
  { id: 'recruitment', label: 'Recruitment', operations: ['read', 'create', 'update', 'delete'] },
  { id: 'documents', label: 'Documents', operations: ['read', 'create', 'update', 'delete'] },
  { id: 'assets', label: 'Assets', operations: ['read', 'create', 'update', 'delete'] },
  { id: 'reports', label: 'Reports', operations: ['read'] }, // Usually just read/generate
  { id: 'audit_logs', label: 'Audit Logs', operations: ['read'] },
  { id: 'settings', label: 'System Settings', operations: ['read', 'update'] },
];

// Helper to get all possible permissions for easy "Select All"
export const getAllPermissions = () => {
  return PERMISSION_MODULES.flatMap(module =>
    module.operations.map(op => `${module.id}:${op}`)
  );
};
