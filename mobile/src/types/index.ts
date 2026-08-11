export interface User {
  user_id: number;
  email: string;
  role: 'admin' | 'manager' | 'employee';
  permissions?: string[];
  employee_id?: number;
  first_name?: string;
  last_name?: string;
  is_two_factor_enabled?: boolean;
  profile_image?: string;
  is_active?: boolean;
}

export interface Employee {
  employee_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  position?: string;
  department_id?: number;
  department_name?: string;
  status: string;
  employment_type?: string;
  salary?: number;
  profile_image?: string;
  hire_date?: string;
  reporting_manager_id?: number;
}

export interface LeaveRequest {
  leave_id: number;
  employee_id: number;
  leave_type: string;
  start_date: string;
  end_date: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  applied_on?: string;
  employee_name?: string;
}

export interface Task {
  task_id: number;
  title: string;
  description?: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  assigned_to?: number[];
  created_by?: number;
}

export interface Attendance {
  attendance_id: number;
  employee_id: number;
  date: string;
  clock_in?: string;
  clock_out?: string;
  status: string;
  work_hours?: number;
}

export interface Payroll {
  payroll_id: number;
  employee_id: number;
  month: number;
  year: number;
  basic_salary: number;
  allowances?: number;
  deductions?: number;
  net_salary: number;
  status: string;
}

export interface PayslipEarning {
  id: number;
  payslip_id: number;
  component_name: string;
  amount: number;
  is_taxable: boolean;
}

export interface PayslipDeduction {
  id: number;
  payslip_id: number;
  component_name: string;
  amount: number;
  is_taxable: boolean;
}

export interface PayslipV2 {
  id: number;
  run_id: number;
  employee_id: number;
  employee_name: string;
  department_name: string;
  designation: string;
  period_month: number;
  period_year: number;
  basic_salary: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  payment_status: string;
  payment_date: string;
  payment_method: string;
  earnings: PayslipEarning[];
  deductions: PayslipDeduction[];
  verification_hash: string;
  is_verified: boolean;
  created_at: string;
}

export interface ChatMessage {
  message_id: number;
  sender_id: number;
  receiver_id?: number;
  channel_id?: number;
  message: string;
  created_at: string;
  is_read: boolean;
  is_delivered: boolean;
  attachment_url?: string;
  reply_to_id?: number;
}

export interface Conversation {
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
  position?: string;
  department_name?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  is_active?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface Module {
  id: string;
  name: string;
  icon: string;
  route: string;
  color: string;
  description?: string;
}

export interface StatSummary {
  label: string;
  value: number;
  icon: string;
  color: string;
}
