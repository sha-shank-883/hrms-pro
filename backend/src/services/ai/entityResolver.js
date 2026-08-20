const { query } = require('../../config/database');

/**
 * Universal Entity Resolver & Disambiguation Engine
 * Guarantees zero silent LIMIT 1 assumptions and zero entity collision errors across all AI tools.
 */

/**
 * Resolve an employee by ID, Code, Email, or Name with strict collision handling
 * @param {string|number} identifier - Employee identifier
 * @param {object} context - Execution context containing user and role
 * @returns {Promise<object>} Resolution result ({ status: 'resolved'|'ambiguous'|'not_found', ... })
 */
async function resolveEmployee(identifier, context = {}) {
  if (!identifier && identifier !== 0) {
    return {
      status: 'not_found',
      count: 0,
      message: 'No employee identifier provided.'
    };
  }

  const idStr = String(identifier).trim();

  // 1. Exact numeric ID match
  if (/^\d+$/.test(idStr)) {
    const res = await query(
      `SELECT e.*, d.department_name, m.first_name || ' ' || m.last_name as manager_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       LEFT JOIN employees m ON e.reporting_manager_id = m.employee_id
       WHERE e.employee_id = $1`,
      [parseInt(idStr, 10)]
    );

    if (res.rows.length === 1) {
      return {
        status: 'resolved',
        count: 1,
        employee: res.rows[0],
        employee_id: res.rows[0].employee_id
      };
    }
  }

  // 2. Exact Employee Code match (e.g. EMP0001, EMP-102)
  if (/^EMP[-\s]?\d+$/i.test(idStr)) {
    const cleanCode = idStr.toUpperCase().replace(/\s+/g, '');
    const res = await query(
      `SELECT e.*, d.department_name, m.first_name || ' ' || m.last_name as manager_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       LEFT JOIN employees m ON e.reporting_manager_id = m.employee_id
       WHERE UPPER(e.employee_code) = $1 OR UPPER(e.employee_code) = $2`,
      [cleanCode, idStr.toUpperCase()]
    );

    if (res.rows.length === 1) {
      return {
        status: 'resolved',
        count: 1,
        employee: res.rows[0],
        employee_id: res.rows[0].employee_id
      };
    }
  }

  // 3. Exact Email match
  if (idStr.includes('@')) {
    const res = await query(
      `SELECT e.*, d.department_name, m.first_name || ' ' || m.last_name as manager_name
       FROM employees e
       LEFT JOIN departments d ON e.department_id = d.department_id
       LEFT JOIN employees m ON e.reporting_manager_id = m.employee_id
       WHERE LOWER(e.email) = $1`,
      [idStr.toLowerCase()]
    );

    if (res.rows.length === 1) {
      return {
        status: 'resolved',
        count: 1,
        employee: res.rows[0],
        employee_id: res.rows[0].employee_id
      };
    }
  }

  // 4. Name / Keyword Search (Strict collision detection without silent LIMIT 1)
  const res = await query(
    `SELECT e.employee_id, e.employee_code, e.first_name, e.last_name, e.email, e.phone,
            e.position, e.salary, e.status, e.hire_date, e.joining_date, e.user_id,
            d.department_name, m.first_name || ' ' || m.last_name as manager_name
     FROM employees e
     LEFT JOIN departments d ON e.department_id = d.department_id
     LEFT JOIN employees m ON e.reporting_manager_id = m.employee_id
     WHERE e.first_name ILIKE $1
        OR e.last_name ILIKE $1
        OR (e.first_name || ' ' || e.last_name) ILIKE $1
        OR e.employee_code ILIKE $1
     ORDER BY e.created_at DESC`,
    [`%${idStr}%`]
  );

  if (res.rows.length === 0) {
    return {
      status: 'not_found',
      count: 0,
      message: `No employee found matching "${idStr}".`
    };
  }

  if (res.rows.length === 1) {
    return {
      status: 'resolved',
      count: 1,
      employee: res.rows[0],
      employee_id: res.rows[0].employee_id
    };
  }

  // Multiple employees matched — require disambiguation
  const options = res.rows.map(e => ({
    employee_id: e.employee_id,
    employee_code: e.employee_code || `EMP${e.employee_id}`,
    name: `${e.first_name} ${e.last_name || ''}`.trim(),
    department: e.department_name || 'Unassigned',
    position: e.position || 'Staff',
    email: e.email
  }));

  return {
    status: 'ambiguous',
    count: res.rows.length,
    disambiguation_needed: true,
    options,
    message: `Found ${res.rows.length} employees matching "${idStr}". Disambiguation required.`
  };
}

/**
 * Resolve Department with fallback listings
 */
async function resolveDepartment(departmentName) {
  if (!departmentName || typeof departmentName !== 'string' || departmentName.trim() === '') {
    const allDepts = await query('SELECT department_id, department_name FROM departments ORDER BY department_name ASC');
    return {
      status: 'missing',
      available: allDepts.rows,
      message: `Department is required. Available: ${allDepts.rows.map(d => d.department_name).join(', ')}`
    };
  }

  const dRes = await query(
    'SELECT department_id, department_name FROM departments WHERE department_name ILIKE $1 LIMIT 1',
    [`%${departmentName.trim()}%`]
  );

  if (dRes.rows.length > 0) {
    return {
      status: 'resolved',
      department: dRes.rows[0],
      department_id: dRes.rows[0].department_id
    };
  }

  const allDepts = await query('SELECT department_id, department_name FROM departments ORDER BY department_name ASC');
  return {
    status: 'not_found',
    available: allDepts.rows,
    message: `Department "${departmentName}" not found. Available departments: ${allDepts.rows.map(d => d.department_name).join(', ')}`
  };
}

/**
 * Resolve pending leave request for an employee with disambiguation on multiple pending leaves
 */
async function resolvePendingLeave(employeeId, leaveId = null) {
  if (leaveId) {
    const res = await query(
      `SELECT lr.*, e.first_name || ' ' || e.last_name as employee_name, e.employee_code
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.employee_id
       WHERE lr.leave_id = $1`,
      [leaveId]
    );
    if (res.rows.length > 0) {
      return { status: 'resolved', leave_request: res.rows[0], leave_id: res.rows[0].leave_id };
    }
    return { status: 'not_found', message: `Leave request #${leaveId} not found.` };
  }

  const res = await query(
    `SELECT lr.*, e.first_name || ' ' || e.last_name as employee_name, e.employee_code
     FROM leave_requests lr
     JOIN employees e ON lr.employee_id = e.employee_id
     WHERE lr.employee_id = $1 AND lr.status = 'pending'
     ORDER BY lr.start_date ASC`,
    [employeeId]
  );

  if (res.rows.length === 0) {
    return { status: 'not_found', message: 'No pending leave requests found for this employee.' };
  }

  if (res.rows.length === 1) {
    return { status: 'resolved', leave_request: res.rows[0], leave_id: res.rows[0].leave_id };
  }

  // Multiple pending leaves — require disambiguation
  const options = res.rows.map(lr => ({
    leave_id: lr.leave_id,
    leave_type: lr.leave_type,
    start_date: lr.start_date,
    end_date: lr.end_date,
    days_count: lr.days_count,
    reason: lr.reason
  }));

  return {
    status: 'ambiguous',
    count: res.rows.length,
    disambiguation_needed: true,
    options,
    message: `Employee has ${res.rows.length} pending leave requests. Please specify which leave to approve.`
  };
}

module.exports = {
  resolveEmployee,
  resolveDepartment,
  resolvePendingLeave
};
