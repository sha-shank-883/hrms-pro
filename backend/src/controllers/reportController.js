const { query } = require('../config/database');
const { calculateRisk } = require('../services/churnService');

// Dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Total employees
    const employeesResult = await query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'active\' THEN 1 END) as active FROM employees'
    );

    // Total departments
    const departmentsResult = await query('SELECT COUNT(*) as total FROM departments');

    // Attendance today
    const today = new Date().toISOString().split('T')[0];
    const attendanceResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent
       FROM attendance WHERE date = $1`,
      [today]
    );

    // Leave requests pending
    const leaveResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved
       FROM leave_requests`
    );

    // Tasks statistics
    const tasksResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'todo' THEN 1 END) as todo,
        COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
       FROM tasks`
    );

    // Payroll this month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const payrollResult = await query(
      `SELECT 
        COUNT(*) as total,
        SUM(net_salary) as total_amount,
        COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending
       FROM payroll WHERE month = $1 AND year = $2`,
      [currentMonth, currentYear]
    );

    // Active job postings
    const jobsResult = await query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'open' THEN 1 END) as open
       FROM job_postings`
    );

    res.json({
      success: true,
      data: {
        employees: employeesResult.rows[0],
        departments: departmentsResult.rows[0],
        attendance: attendanceResult.rows[0],
        leaves: leaveResult.rows[0],
        tasks: tasksResult.rows[0],
        payroll: {
          ...payrollResult.rows[0],
          total_amount: parseFloat(payrollResult.rows[0].total_amount || 0),
        },
        jobs: jobsResult.rows[0],
      },
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message,
    });
  }
};

// Attendance report
const getAttendanceReport = async (req, res) => {
  try {
    const { start_date, end_date, department_id } = req.query;

    let queryText = `
      SELECT 
        e.employee_id,
        e.first_name || ' ' || e.last_name as employee_name,
        d.department_name,
        COUNT(*) as total_days,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
        SUM(a.work_hours) as total_hours,
        AVG(a.work_hours) as avg_hours
      FROM employees e
      LEFT JOIN attendance a ON e.employee_id = a.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (start_date) {
      queryText += ` AND a.date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      queryText += ` AND a.date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    if (department_id) {
      queryText += ` AND e.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    queryText += ' GROUP BY e.employee_id, e.first_name, e.last_name, d.department_name ORDER BY e.employee_id';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get attendance report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch attendance report',
      error: error.message,
    });
  }
};

// Leave report
const getLeaveReport = async (req, res) => {
  try {
    const { year, department_id } = req.query;

    let queryText = `
      SELECT 
        e.employee_id,
        e.first_name || ' ' || e.last_name as employee_name,
        d.department_name,
        lr.leave_type,
        COUNT(*) as total_requests,
        SUM(lr.days_count) as total_days,
        COUNT(CASE WHEN lr.status = 'approved' THEN 1 END) as approved_requests,
        COUNT(CASE WHEN lr.status = 'rejected' THEN 1 END) as rejected_requests,
        COUNT(CASE WHEN lr.status = 'pending' THEN 1 END) as pending_requests
      FROM employees e
      LEFT JOIN leave_requests lr ON e.employee_id = lr.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (year) {
      queryText += ` AND EXTRACT(YEAR FROM lr.start_date) = $${paramCount}`;
      params.push(year);
      paramCount++;
    }

    if (department_id) {
      queryText += ` AND e.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    queryText += ' GROUP BY e.employee_id, e.first_name, e.last_name, d.department_name, lr.leave_type ORDER BY e.employee_id';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get leave report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch leave report',
      error: error.message,
    });
  }
};

// Payroll report
const getPayrollReport = async (req, res) => {
  try {
    const { year, month, department_id } = req.query;

    let queryText = `
      SELECT 
        e.employee_id,
        e.first_name || ' ' || e.last_name as employee_name,
        e.position,
        d.department_name,
        p.month,
        p.year,
        p.basic_salary,
        p.allowances,
        p.deductions,
        p.overtime_pay,
        p.bonus,
        p.tax,
        p.net_salary,
        p.payment_status
      FROM payroll p
      JOIN employees e ON p.employee_id = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (year) {
      queryText += ` AND p.year = $${paramCount}`;
      params.push(year);
      paramCount++;
    }

    if (month) {
      queryText += ` AND p.month = $${paramCount}`;
      params.push(month);
      paramCount++;
    }

    if (department_id) {
      queryText += ` AND e.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    queryText += ' ORDER BY p.year DESC, p.month DESC, e.employee_id';

    const result = await query(queryText, params);

    // Calculate totals
    const totals = result.rows.reduce((acc, row) => ({
      total_basic: acc.total_basic + parseFloat(row.basic_salary || 0),
      total_allowances: acc.total_allowances + parseFloat(row.allowances || 0),
      total_deductions: acc.total_deductions + parseFloat(row.deductions || 0),
      total_net: acc.total_net + parseFloat(row.net_salary || 0),
    }), { total_basic: 0, total_allowances: 0, total_deductions: 0, total_net: 0 });

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      totals,
    });
  } catch (error) {
    console.error('Get payroll report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll report',
      error: error.message,
    });
  }
};

// Employee demographics report
const getEmployeeDemographics = async (req, res) => {
  try {
    // By department
    const byDepartment = await query(`
      SELECT d.department_name, COUNT(e.employee_id) as count
      FROM departments d
      LEFT JOIN employees e ON d.department_id = e.department_id
      GROUP BY d.department_name
      ORDER BY count DESC
    `);

    // By employment type
    const byEmploymentType = await query(`
      SELECT employment_type, COUNT(*) as count
      FROM employees
      GROUP BY employment_type
      ORDER BY count DESC
    `);

    // By gender
    const byGender = await query(`
      SELECT gender, COUNT(*) as count
      FROM employees
      WHERE gender IS NOT NULL
      GROUP BY gender
      ORDER BY count DESC
    `);

    // By status
    const byStatus = await query(`
      SELECT status, COUNT(*) as count
      FROM employees
      GROUP BY status
      ORDER BY count DESC
    `);

    res.json({
      success: true,
      data: {
        by_department: byDepartment.rows,
        by_employment_type: byEmploymentType.rows,
        by_gender: byGender.rows,
        by_status: byStatus.rows,
      },
    });
  } catch (error) {
    console.error('Get employee demographics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee demographics',
      error: error.message,
    });
  }
};

// Employee report (detailed employee list)
const getEmployeeReport = async (req, res) => {
  try {
    const { department_id, status, employment_type } = req.query;

    let queryText = `
      SELECT 
        e.employee_id,
        e.first_name || ' ' || e.last_name as employee_name,
        e.email,
        e.phone,
        e.position,
        e.employment_type,
        e.status,
        e.date_of_birth,
        e.gender,
        e.address,
        e.hire_date,
        d.department_name,
        u.email as user_email,
        u.role as user_role
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      LEFT JOIN users u ON e.user_id = u.user_id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (department_id) {
      queryText += ` AND e.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    if (status) {
      queryText += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (employment_type) {
      queryText += ` AND e.employment_type = $${paramCount}`;
      params.push(employment_type);
      paramCount++;
    }

    queryText += ' ORDER BY e.employee_id';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get employee report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee report',
      error: error.message,
    });
  }
};

// Recruitment report
const getRecruitmentReport = async (req, res) => {
  try {
    const { year } = req.query;

    let queryText = `
      SELECT 
        jp.job_id,
        jp.title,
        jp.position_type,
        d.department_name,
        jp.status,
        jp.posted_date,
        COUNT(ja.application_id) as total_applications,
        COUNT(CASE WHEN ja.status = 'submitted' THEN 1 END) as submitted,
        COUNT(CASE WHEN ja.status = 'interview' THEN 1 END) as interview,
        COUNT(CASE WHEN ja.status = 'hired' THEN 1 END) as hired,
        COUNT(CASE WHEN ja.status = 'rejected' THEN 1 END) as rejected
      FROM job_postings jp
      LEFT JOIN departments d ON jp.department_id = d.department_id
      LEFT JOIN job_applications ja ON jp.job_id = ja.job_id
      WHERE 1=1
    `;
    const params = [];

    if (year) {
      queryText += ' AND EXTRACT(YEAR FROM jp.posted_date) = $1';
      params.push(year);
    }

    queryText += ' GROUP BY jp.job_id, jp.title, jp.position_type, d.department_name, jp.status, jp.posted_date ORDER BY jp.posted_date DESC';

    const result = await query(queryText, params);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error('Get recruitment report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recruitment report',
      error: error.message,
    });
  }
};

// Predictive analytics for employee turnover
const getTurnoverPrediction = async (req, res) => {
  try {
    console.log('Turnover prediction request received. User:', req.user);

    // Get historical turnover data (last 12 months)
    const turnoverHistory = await query(`
      SELECT 
        EXTRACT(MONTH FROM termination_date) as month,
        EXTRACT(YEAR FROM termination_date) as year,
        COUNT(*) as terminations
      FROM employees 
      WHERE status = 'terminated' 
        AND termination_date IS NOT NULL
        AND termination_date >= CURRENT_DATE - INTERVAL '12 months'
      GROUP BY EXTRACT(MONTH FROM termination_date), EXTRACT(YEAR FROM termination_date)
      ORDER BY year, month
    `);

    // Get employee satisfaction data (simulated)
    const satisfactionData = await query(`
      SELECT 
        e.department_id,
        d.department_name,
        COUNT(*) as employee_count,
        AVG(CASE WHEN e.status = 'active' THEN 1 ELSE 0 END) as retention_rate
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      GROUP BY e.department_id, d.department_name
    `);

    // Calculate turnover risk factors
    const riskFactors = await query(`
      SELECT 
        d.department_name,
        COUNT(e.employee_id) as total_employees,
        COUNT(CASE WHEN e.status = 'terminated' THEN 1 END) as terminated_count,
        ROUND(
          (COUNT(CASE WHEN e.status = 'terminated' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(e.employee_id), 0)), 2
        ) as turnover_rate,
        CASE 
          WHEN (COUNT(CASE WHEN e.status = 'terminated' THEN 1 END) * 100.0 / 
                NULLIF(COUNT(e.employee_id), 0)) > 15 THEN 'High'
          WHEN (COUNT(CASE WHEN e.status = 'terminated' THEN 1 END) * 100.0 / 
                NULLIF(COUNT(e.employee_id), 0)) > 8 THEN 'Medium'
          ELSE 'Low'
        END as risk_level
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      GROUP BY d.department_name
    `);

    // Predict next quarter turnover (simple calculation)
    const totalEmployees = await query('SELECT COUNT(*) as total FROM employees WHERE status = \'active\'');
    const recentTerminations = await query(`
      SELECT COUNT(*) as count FROM employees 
      WHERE status = 'terminated' 
        AND termination_date IS NOT NULL
        AND termination_date >= CURRENT_DATE - INTERVAL '3 months'
    `);

    const avgMonthlyTurnover = recentTerminations.rows[0] ? recentTerminations.rows[0].count / 3 : 0;
    const totalActiveEmployees = totalEmployees.rows[0] ? parseInt(totalEmployees.rows[0].total) : 0;

    res.json({
      success: true,
      data: {
        turnover_history: turnoverHistory.rows,
        satisfaction_data: satisfactionData.rows,
        risk_factors: riskFactors.rows,
        predictions: {
          total_active_employees: totalActiveEmployees,
          avg_monthly_turnover: avgMonthlyTurnover,
          predicted_next_quarter_turnover: Math.round(avgMonthlyTurnover * 3),
          predicted_turnover_rate: totalActiveEmployees > 0 ? ((avgMonthlyTurnover / totalActiveEmployees) * 100).toFixed(2) + '%' : '0.00%'
        }
      }
    });
  } catch (error) {
    console.error('Get turnover prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch turnover predictions',
      error: error.message,
    });
  }
};

// Performance analytics
const getPerformanceAnalytics = async (req, res) => {
  try {
    console.log('Performance analytics request received. User:', req.user);

    // Task completion rates by department
    const taskCompletion = await query(`
      SELECT 
        d.department_name,
        COUNT(t.task_id) as total_tasks,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as completed_tasks,
        ROUND(
          (COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(t.task_id), 0)), 2
        ) as completion_rate
      FROM tasks t
      LEFT JOIN employees e ON t.assigned_to = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      GROUP BY d.department_name
    `);

    // Employee productivity scores (simulated)
    const productivityScores = await query(`
      SELECT 
        e.employee_id,
        e.first_name || ' ' || e.last_name as employee_name,
        d.department_name,
        COUNT(t.task_id) as tasks_assigned,
        COUNT(CASE WHEN t.status = 'completed' THEN 1 END) as tasks_completed,
        ROUND(
          (COUNT(CASE WHEN t.status = 'completed' THEN 1 END) * 100.0 / 
           NULLIF(COUNT(t.task_id), 0)), 2
        ) as productivity_score
      FROM employees e
      LEFT JOIN tasks t ON e.employee_id = t.assigned_to
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE e.status = 'active'
      GROUP BY e.employee_id, e.first_name, e.last_name, d.department_name
      HAVING COUNT(t.task_id) > 0
      ORDER BY productivity_score DESC
      LIMIT 10
    `);

    // High performers recognition
    const highPerformers = productivityScores.rows ? productivityScores.rows.filter(emp => parseFloat(emp.productivity_score) >= 90) : [];

    res.json({
      success: true,
      data: {
        task_completion_by_department: taskCompletion.rows,
        top_performers: productivityScores.rows ? productivityScores.rows.slice(0, 5) : [],
        high_performers_count: highPerformers.length,
        overall_productivity: productivityScores.rows && productivityScores.rows.length > 0 ?
          (productivityScores.rows.reduce((sum, emp) => sum + parseFloat(emp.productivity_score || 0), 0) / productivityScores.rows.length).toFixed(2) : 0
      }
    });
  } catch (error) {
    console.error('Get performance analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch performance analytics',
      error: error.message,
    });
  }
};

// Breakdown of Churn Risk by Employee
const getChurnRiskAnalysis = async (req, res) => {
  try {
    const { department_id } = req.query;

    // Get all active employees
    let queryText = `
      SELECT e.employee_id, e.first_name, e.last_name, e.department_id, d.department_name
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE e.status = 'active'
    `;
    const params = [];

    if (department_id) {
      queryText += ' AND e.department_id = $1';
      params.push(department_id);
    }

    const employeesResult = await query(queryText, params);

    const riskAnalysis = [];

    // Calculate risk for each employee
    for (const emp of employeesResult.rows) {
      const riskData = await calculateRisk(emp.employee_id);
      if (riskData) {
        riskAnalysis.push({
          ...emp,
          ...riskData
        });
      }
    }

    // Sort by Risk Score (High to Low)
    riskAnalysis.sort((a, b) => b.riskScore - a.riskScore);

    res.json({
      success: true,
      data: riskAnalysis
    });
  } catch (error) {
    console.error('Get churn risk analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch churn risk analysis',
      error: error.message
    });
  }
};

// Payroll trend analysis
const getPayrollTrends = async (req, res) => {
  try {
    console.log('Payroll trends request received. User:', req.user);

    // Monthly payroll trends (last 12 months)
    const monthlyTrends = await query(`
      SELECT 
        year,
        month,
        SUM(net_salary) as total_payroll,
        COUNT(*) as employee_count,
        ROUND(AVG(net_salary), 2) as avg_salary
      FROM payroll
      WHERE (year = EXTRACT(YEAR FROM CURRENT_DATE) AND month <= EXTRACT(MONTH FROM CURRENT_DATE))
         OR (year = EXTRACT(YEAR FROM CURRENT_DATE) - 1 AND month > EXTRACT(MONTH FROM CURRENT_DATE))
      GROUP BY year, month
      ORDER BY year, month
    `);

    // Department-wise salary distribution
    const deptSalaryDistribution = await query(`
      SELECT 
        d.department_name,
        COUNT(p.employee_id) as employee_count,
        ROUND(AVG(p.net_salary), 2) as avg_salary,
        ROUND(MIN(p.net_salary), 2) as min_salary,
        ROUND(MAX(p.net_salary), 2) as max_salary
      FROM payroll p
      JOIN employees e ON p.employee_id = e.employee_id
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE p.year = EXTRACT(YEAR FROM CURRENT_DATE) 
        AND p.month = EXTRACT(MONTH FROM CURRENT_DATE)
      GROUP BY d.department_name
      ORDER BY avg_salary DESC
    `);

    // Salary growth analysis
    const currentMonth = await query(`
      SELECT ROUND(AVG(net_salary), 2) as avg_salary
      FROM payroll
      WHERE year = EXTRACT(YEAR FROM CURRENT_DATE) 
        AND month = EXTRACT(MONTH FROM CURRENT_DATE)
    `);

    const previousMonth = await query(`
      SELECT ROUND(AVG(net_salary), 2) as avg_salary
      FROM payroll
      WHERE (year = EXTRACT(YEAR FROM CURRENT_DATE) AND month = EXTRACT(MONTH FROM CURRENT_DATE) - 1)
         OR (year = EXTRACT(YEAR FROM CURRENT_DATE) - 1 AND month = 12)
    `);

    const currentAvg = currentMonth.rows[0] ? currentMonth.rows[0].avg_salary : 0;
    const previousAvg = previousMonth.rows[0] ? previousMonth.rows[0].avg_salary : 0;
    const growthRate = previousAvg && previousAvg > 0 ?
      (((currentAvg - previousAvg) / previousAvg) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        monthly_trends: monthlyTrends.rows,
        department_salary_distribution: deptSalaryDistribution.rows,
        salary_growth: {
          current_month_avg: currentAvg || 0,
          previous_month_avg: previousAvg || 0,
          growth_rate: growthRate + '%'
        }
      }
    });
  } catch (error) {
    console.error('Get payroll trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll trends',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboardStats,
  getAttendanceReport,
  getLeaveReport,
  getPayrollReport,
  getEmployeeDemographics,
  getEmployeeReport,
  getRecruitmentReport,
  getTurnoverPrediction,
  getPerformanceAnalytics,
  getPayrollTrends,
  getChurnRiskAnalysis
};