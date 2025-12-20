// Utility to apply design system settings dynamically
export const applyDesignSettings = (settings) => {
  // Get root element
  const root = document.documentElement;
  
  // Apply colors
  if (settings.design_primary_color) {
    root.style.setProperty('--primary-color', settings.design_primary_color);
  }
  
  if (settings.design_secondary_color) {
    root.style.setProperty('--secondary-color', settings.design_secondary_color);
  }
  
  if (settings.design_success_color) {
    root.style.setProperty('--success-color', settings.design_success_color);
  }
  
  if (settings.design_warning_color) {
    root.style.setProperty('--warning-color', settings.design_warning_color);
  }
  
  if (settings.design_danger_color) {
    root.style.setProperty('--danger-color', settings.design_danger_color);
  }
  
  if (settings.design_info_color) {
    root.style.setProperty('--info-color', settings.design_info_color);
  }
  
  // Apply typography
  if (settings.design_font_family) {
    root.style.setProperty('--font-family', settings.design_font_family);
  }
  
  if (settings.design_font_size_base) {
    root.style.setProperty('--font-size-base', settings.design_font_size_base);
  }
  
  if (settings.design_font_size_sm) {
    root.style.setProperty('--font-size-sm', settings.design_font_size_sm);
  }
  
  if (settings.design_font_size_lg) {
    root.style.setProperty('--font-size-lg', settings.design_font_size_lg);
  }
  
  // Apply spacing
  if (settings.design_spacing_unit) {
    root.style.setProperty('--spacing-unit', settings.design_spacing_unit);
  }
  
  // Apply borders
  if (settings.design_border_radius) {
    root.style.setProperty('--border-radius', settings.design_border_radius);
  }
  
  if (settings.design_border_radius_sm) {
    root.style.setProperty('--border-radius-sm', settings.design_border_radius_sm);
  }
  
  if (settings.design_border_radius_lg) {
    root.style.setProperty('--border-radius-lg', settings.design_border_radius_lg);
  }
  
  // Apply shadows
  if (settings.design_card_shadow) {
    root.style.setProperty('--card-shadow', settings.design_card_shadow);
  }
  
  if (settings.design_button_shadow) {
    root.style.setProperty('--button-shadow', settings.design_button_shadow);
  }
  
  // Apply layout
  if (settings.design_sidebar_width) {
    root.style.setProperty('--sidebar-width', settings.design_sidebar_width);
  }
  
  if (settings.design_header_height) {
    root.style.setProperty('--header-height', settings.design_header_height);
  }
  
  // Apply component sizes
  if (settings.design_button_padding_x) {
    root.style.setProperty('--button-padding-x', settings.design_button_padding_x);
  }
  
  if (settings.design_button_padding_y) {
    root.style.setProperty('--button-padding-y', settings.design_button_padding_y);
  }
  
  if (settings.design_card_padding) {
    root.style.setProperty('--card-padding', settings.design_card_padding);
  }
  
  if (settings.design_input_height) {
    root.style.setProperty('--input-height', settings.design_input_height);
  }
  
  // Apply module-specific design settings
  if (settings.design_dashboard_widget_bg) {
    root.style.setProperty('--dashboard-widget-bg', settings.design_dashboard_widget_bg);
  }
  
  if (settings.design_dashboard_widget_border) {
    root.style.setProperty('--dashboard-widget-border', settings.design_dashboard_widget_border);
  }
  
  if (settings.design_dashboard_widget_radius) {
    root.style.setProperty('--dashboard-widget-radius', settings.design_dashboard_widget_radius);
  }
  
  if (settings.design_dashboard_widget_shadow) {
    root.style.setProperty('--dashboard-widget-shadow', settings.design_dashboard_widget_shadow);
  }
  
  if (settings.design_employee_card_bg) {
    root.style.setProperty('--employee-card-bg', settings.design_employee_card_bg);
  }
  
  if (settings.design_employee_card_border) {
    root.style.setProperty('--employee-card-border', settings.design_employee_card_border);
  }  
  if (settings.design_employee_card_radius) {
    root.style.setProperty('--employee-card-radius', settings.design_employee_card_radius);
  }
  
  if (settings.design_employee_card_shadow) {
    root.style.setProperty('--employee-card-shadow', settings.design_employee_card_shadow);
  }
  
  if (settings.design_table_row_hover) {
    root.style.setProperty('--table-row-hover', settings.design_table_row_hover);
  }
  
  if (settings.design_table_border) {
    root.style.setProperty('--table-border', settings.design_table_border);
  }
  
  if (settings.design_nav_active_bg) {
    root.style.setProperty('--nav-active-bg', settings.design_nav_active_bg);
  }
  
  if (settings.design_nav_active_border) {
    root.style.setProperty('--nav-active-border', settings.design_nav_active_border);
  }
  
  if (settings.design_badge_radius) {
    root.style.setProperty('--badge-radius', settings.design_badge_radius);
  }
  
  if (settings.design_form_group_spacing) {
    root.style.setProperty('--form-group-spacing', settings.design_form_group_spacing);
  }
  
  if (settings.design_modal_backdrop) {
    root.style.setProperty('--modal-backdrop', settings.design_modal_backdrop);
  }
  
  if (settings.design_chart_primary) {
    root.style.setProperty('--chart-primary', settings.design_chart_primary);
  }
  
  if (settings.design_chart_secondary) {
    root.style.setProperty('--chart-secondary', settings.design_chart_secondary);
  }
  
  if (settings.design_chart_success) {
    root.style.setProperty('--chart-success', settings.design_chart_success);
  }
  
  if (settings.design_chart_warning) {
    root.style.setProperty('--chart-warning', settings.design_chart_warning);
  }
  
  if (settings.design_chart_danger) {
    root.style.setProperty('--chart-danger', settings.design_chart_danger);
  }
  
  if (settings.design_progress_bar_height) {
    root.style.setProperty('--progress-bar-height', settings.design_progress_bar_height);
  }
  
  if (settings.design_progress_bar_radius) {
    root.style.setProperty('--progress-bar-radius', settings.design_progress_bar_radius);
  }
  
  if (settings.design_avatar_size_sm) {
    root.style.setProperty('--avatar-size-sm', settings.design_avatar_size_sm);
  }
  
  if (settings.design_avatar_size_md) {
    root.style.setProperty('--avatar-size-md', settings.design_avatar_size_md);
  }
  
  if (settings.design_avatar_size_lg) {
    root.style.setProperty('--avatar-size-lg', settings.design_avatar_size_lg);
  }
  
  if (settings.design_tooltip_bg) {
    root.style.setProperty('--tooltip-bg', settings.design_tooltip_bg);
  }
  
  if (settings.design_tooltip_text) {
    root.style.setProperty('--tooltip-text', settings.design_tooltip_text);
  }
  
  if (settings.design_pagination_active) {
    root.style.setProperty('--pagination-active', settings.design_pagination_active);
  }
  
  // Additional module-specific design settings
  // Recruitment Module
  if (settings.design_recruitment_card_bg) {
    root.style.setProperty('--recruitment-card-bg', settings.design_recruitment_card_bg);
  }
  
  if (settings.design_recruitment_card_border) {
    root.style.setProperty('--recruitment-card-border', settings.design_recruitment_card_border);
  }
  
  if (settings.design_recruitment_status_badge_radius) {
    root.style.setProperty('--recruitment-status-badge-radius', settings.design_recruitment_status_badge_radius);
  }
  
  // Performance Module
  if (settings.design_performance_chart_height) {
    root.style.setProperty('--performance-chart-height', settings.design_performance_chart_height);
  }
  
  if (settings.design_performance_review_card_bg) {
    root.style.setProperty('--performance-review-card-bg', settings.design_performance_review_card_bg);
  }
  
  if (settings.design_performance_rating_star_color) {
    root.style.setProperty('--performance-rating-star-color', settings.design_performance_rating_star_color);
  }
  
  // Payroll Module
  if (settings.design_payroll_summary_card_bg) {
    root.style.setProperty('--payroll-summary-card-bg', settings.design_payroll_summary_card_bg);
  }
  
  if (settings.design_payroll_item_border) {
    root.style.setProperty('--payroll-item-border', settings.design_payroll_item_border);
  }
  
  // Leave Module
  if (settings.design_leave_request_card_bg) {
    root.style.setProperty('--leave-request-card-bg', settings.design_leave_request_card_bg);
  }
  
  if (settings.design_leave_calendar_cell_height) {
    root.style.setProperty('--leave-calendar-cell-height', settings.design_leave_calendar_cell_height);
  }
  
  if (settings.design_leave_status_approved_color) {
    root.style.setProperty('--leave-status-approved-color', settings.design_leave_status_approved_color);
  }
  
  if (settings.design_leave_status_pending_color) {
    root.style.setProperty('--leave-status-pending-color', settings.design_leave_status_pending_color);
  }
  
  if (settings.design_leave_status_rejected_color) {
    root.style.setProperty('--leave-status-rejected-color', settings.design_leave_status_rejected_color);
  }
  
  // Attendance Module
  if (settings.design_attendance_chart_height) {
    root.style.setProperty('--attendance-chart-height', settings.design_attendance_chart_height);
  }
  
  if (settings.design_attendance_status_present_color) {
    root.style.setProperty('--attendance-status-present-color', settings.design_attendance_status_present_color);
  }
  
  if (settings.design_attendance_status_absent_color) {
    root.style.setProperty('--attendance-status-absent-color', settings.design_attendance_status_absent_color);
  }
  
  if (settings.design_attendance_status_late_color) {
    root.style.setProperty('--attendance-status-late-color', settings.design_attendance_status_late_color);
  }
  
  // Task Module
  if (settings.design_task_card_bg) {
    root.style.setProperty('--task-card-bg', settings.design_task_card_bg);
  }
  
  if (settings.design_task_priority_high_color) {
    root.style.setProperty('--task-priority-high-color', settings.design_task_priority_high_color);
  }
  
  if (settings.design_task_priority_medium_color) {
    root.style.setProperty('--task-priority-medium-color', settings.design_task_priority_medium_color);
  }
  
  if (settings.design_task_priority_low_color) {
    root.style.setProperty('--task-priority-low-color', settings.design_task_priority_low_color);
  }
  
  if (settings.design_task_status_todo_color) {
    root.style.setProperty('--task-status-todo-color', settings.design_task_status_todo_color);
  }
  
  if (settings.design_task_status_inprogress_color) {
    root.style.setProperty('--task-status-inprogress-color', settings.design_task_status_inprogress_color);
  }
  
  if (settings.design_task_status_completed_color) {
    root.style.setProperty('--task-status-completed-color', settings.design_task_status_completed_color);
  }
  
  // Update button styles dynamically
  updateButtonStyles(settings.design_primary_color, settings);
};

// Update button styles dynamically
const updateButtonStyles = (primaryColor, settings) => {
  if (!primaryColor) return;
  
  // Create or update style element for button colors
  let styleElement = document.getElementById('dynamic-button-styles');
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = 'dynamic-button-styles';
    document.head.appendChild(styleElement);
  }
  
  // Get color variations
  const hoverColor = settings.design_primary_hover_color || adjustColor(primaryColor, -10);
  const activeColor = settings.design_primary_active_color || adjustColor(primaryColor, -20);
  
  // Generate button styles based on primary color
  styleElement.textContent = `
    .btn-primary {
      background-color: ${primaryColor};
      border-color: ${primaryColor};
    }
    
    .btn-primary:hover {
      background-color: ${hoverColor};
      border-color: ${hoverColor};
    }
    
    .btn-primary:active {
      background-color: ${activeColor};
      border-color: ${activeColor};
    }
    
    /* Also update other elements that use primary color */
    .card::before {
      background-color: ${primaryColor};
    }
    
    .nav-item.active {
      background-color: ${adjustColor(primaryColor, 50)}20; /* 20% opacity */
      color: ${primaryColor};
      border-left-color: ${primaryColor};
    }
  `;
};

// Helper function to adjust color brightness
const adjustColor = (color, amount) => {
  // Convert hex to RGB
  let hex = color.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  r = Math.max(0, Math.min(255, r + amount));
  g = Math.max(0, Math.min(255, g + amount));
  b = Math.max(0, Math.min(255, b + amount));
  
  // Convert back to hex
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// Apply design settings on load and when settings change
export const initializeDesignSystem = (settings) => {
  // Apply initial settings
  applyDesignSettings(settings);
  
  // Listen for settings changes
  window.addEventListener('settingsUpdated', (event) => {
    applyDesignSettings(event.detail);
  });
};