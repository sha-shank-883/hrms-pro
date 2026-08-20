const { query } = require('../../../config/database');
const { resolveEmployee } = require('../entityResolver');

/**
 * Attendance Domain Tools for HR AI Operations Agent
 */
const attendanceTools = [
  {
    name: 'getAttendanceSummary',
    domain: 'attendance',
    description: 'Get monthly or date-range attendance summary (present, absent, late, half-day rates, missing punches) for the company or a specific employee.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        employee_id: { type: 'number', description: 'Optional Employee ID' },
        employee_name: { type: 'string', description: 'Optional Employee Name' },
        month: { type: 'number', description: 'Month (1-12)' },
        year: { type: 'number', description: 'Year (e.g. 2026)' },
        date: { type: 'string', description: 'Specific Date YYYY-MM-DD or "today"' }
      }
    },
    execute: async (args, context) => {
      const { employee_id, employee_name, month, year, date } = args;
      const { user } = context;
      const role = user?.role || 'employee';

      let targetEmpId = employee_id;

      if (!targetEmpId && employee_name) {
        const resEmp = await resolveEmployee(employee_name, context);
        if (resEmp.status === 'ambiguous') {
          return {
            success: true,
            disambiguation_needed: true,
            disambiguation_options: resEmp.options,
            count: resEmp.count,
            message: resEmp.message
          };
        }
        if (resEmp.status === 'resolved') {
          targetEmpId = resEmp.employee_id;
        } else {
          return { success: false, message: `Employee "${employee_name}" not found.` };
        }
      } else if (!targetEmpId && role === 'employee') {
        const myEmp = await query('SELECT employee_id FROM employees WHERE user_id = $1', [user.userId]);
        if (myEmp.rows.length > 0) targetEmpId = myEmp.rows[0].employee_id;
      }

      const curYear = year || new Date().getFullYear();
      const curMonth = month || (new Date().getMonth() + 1);

      let sql = `
        SELECT a.status, COUNT(*) as count,
               COALESCE(SUM(a.total_hours), 0) as total_hours,
               COUNT(CASE WHEN a.clock_in IS NOT NULL AND a.clock_out IS NULL THEN 1 END) as missing_punches
        FROM attendance a
        WHERE 1=1
      `;
      const params = [];
      let pIdx = 1;

      if (targetEmpId) {
        sql += ` AND a.employee_id = $${pIdx}`;
        params.push(targetEmpId);
        pIdx++;
      }

      if (date) {
        const targetDate = date === 'today' ? new Date().toISOString().split('T')[0] : date;
        sql += ` AND a.date = $${pIdx}`;
        params.push(targetDate);
        pIdx++;
      } else {
        sql += ` AND EXTRACT(MONTH FROM a.date) = $${pIdx} AND EXTRACT(YEAR FROM a.date) = $${pIdx + 1}`;
        params.push(curMonth, curYear);
        pIdx += 2;
      }

      sql += ` GROUP BY a.status`;

      const res = await query(sql, params);
      const summary = {
        present: 0,
        absent: 0,
        half_day: 0,
        total_hours: 0,
        missing_punches: 0
      };

      res.rows.forEach(r => {
        const st = (r.status || '').toLowerCase();
        if (st === 'present') summary.present += parseInt(r.count, 10);
        else if (st === 'absent') summary.absent += parseInt(r.count, 10);
        else if (st === 'half-day' || st === 'half_day') summary.half_day += parseInt(r.count, 10);
        summary.total_hours += parseFloat(r.total_hours || 0);
        summary.missing_punches += parseInt(r.missing_punches || 0, 10);
      });

      const totalRecorded = summary.present + summary.absent + summary.half_day;
      const attendancePercentage = totalRecorded > 0 ? ((summary.present + summary.half_day * 0.5) / totalRecorded * 100).toFixed(1) : '100.0';

      return {
        success: true,
        data: {
          period: date ? `Date: ${date}` : `Month: ${curMonth}/${curYear}`,
          ...summary,
          attendance_rate: `${attendancePercentage}%`
        },
        message: `Attendance Summary (${date ? date : `${curMonth}/${curYear}`}): Present: ${summary.present}, Absent: ${summary.absent}, Half-Day: ${summary.half_day}, Attendance Rate: ${attendancePercentage}%, Missing Punches: ${summary.missing_punches}.`
      };
    }
  },

  {
    name: 'getMissingPunches',
    domain: 'attendance',
    description: 'Retrieve all unpunched attendance entries (missing clock-out) that require regularization or manager approval.',
    type: 'read',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Number of records to fetch (default: 15)' }
      }
    },
    execute: async (args, context) => {
      const limit = args.limit || 15;
      const res = await query(`
        SELECT a.attendance_id, a.employee_id, a.date, a.clock_in, a.clock_out, a.status,
               e.first_name || ' ' || e.last_name as employee_name, e.employee_code, d.department_name
        FROM attendance a
        JOIN employees e ON a.employee_id = e.employee_id
        LEFT JOIN departments d ON e.department_id = d.department_id
        WHERE a.clock_in IS NOT NULL AND a.clock_out IS NULL AND a.date < CURRENT_DATE
        ORDER BY a.date DESC
        LIMIT $1
      `, [limit]);

      return {
        success: true,
        count: res.rows.length,
        data: res.rows,
        message: `Found ${res.rows.length} attendance record(s) with missing clock-out punches.`
      };
    }
  },

  {
    name: 'regularizeAttendance',
    domain: 'attendance',
    description: 'Submit an attendance punch regularization or mark official attendance status with in/out timestamps.',
    type: 'write',
    isSensitive: false,
    requiredRole: ['employee', 'manager', 'hr', 'admin', 'super_admin'],
    parameters: {
      type: 'object',
      properties: {
        employee_id: { type: 'number', description: 'Employee ID' },
        employee_name: { type: 'string', description: 'Employee Name' },
        date: { type: 'string', description: 'Date YYYY-MM-DD (Mandatory)' },
        clock_in: { type: 'string', description: 'Clock In Time (e.g. 09:30 AM)' },
        clock_out: { type: 'string', description: 'Clock Out Time (e.g. 06:30 PM)' },
        status: { type: 'string', enum: ['present', 'absent', 'half-day'], description: 'Attendance Status' },
        reason: { type: 'string', description: 'Reason for regularization' }
      },
      required: ['date']
    },
    execute: async (args, context) => {
      const { employee_id, employee_name, date, clock_in = null, clock_out = null, status = 'present' } = args;
      const { user } = context;

      let targetEmp = null;
      if (employee_id || employee_name) {
        const resEmp = await resolveEmployee(employee_id || employee_name, context);
        if (resEmp.status === 'ambiguous') {
          return {
            success: true,
            disambiguation_needed: true,
            disambiguation_options: resEmp.options,
            count: resEmp.count,
            message: resEmp.message
          };
        }
        if (resEmp.status === 'resolved') {
          targetEmp = resEmp.employee;
        }
      }

      if (!targetEmp) {
        const myEmp = await query('SELECT employee_id, first_name, last_name FROM employees WHERE user_id = $1', [user.userId]);
        if (myEmp.rows.length > 0) targetEmp = myEmp.rows[0];
      }

      if (!targetEmp) return { success: false, message: 'Could not resolve target employee for attendance regularization.' };

      const empId = targetEmp.employee_id;
      const targetDate = date === 'today' ? new Date().toISOString().split('T')[0] : date;

      // Compute total hours dynamically if clock in/out provided
      let calculatedHours = null;
      if (clock_in && clock_out) {
        try {
          const inParts = clock_in.replace(/[^0-9:]/g, '').split(':').map(Number);
          const outParts = clock_out.replace(/[^0-9:]/g, '').split(':').map(Number);
          if (inParts.length >= 2 && outParts.length >= 2) {
            const inMins = inParts[0] * 60 + inParts[1];
            const outMins = outParts[0] * 60 + outParts[1];
            calculatedHours = Math.max(0, parseFloat(((outMins - inMins) / 60).toFixed(2)));
          }
        } catch (_) {}
      }
      if (calculatedHours === null && status === 'present') calculatedHours = 8.0;
      if (status === 'half-day' || status === 'half_day') calculatedHours = 4.0;
      if (status === 'absent') calculatedHours = 0.0;

      // Upsert attendance record
      const exist = await query('SELECT attendance_id FROM attendance WHERE employee_id = $1 AND date = $2', [empId, targetDate]);
      let savedId;
      if (exist.rows.length > 0) {
        savedId = exist.rows[0].attendance_id;
        await query(
          `UPDATE attendance SET clock_in = $1, clock_out = $2, status = $3, total_hours = $4, updated_at = CURRENT_TIMESTAMP WHERE attendance_id = $5`,
          [clock_in, clock_out, status, calculatedHours, savedId]
        );
      } else {
        const ins = await query(
          `INSERT INTO attendance (employee_id, date, clock_in, clock_out, status, total_hours) VALUES ($1, $2, $3, $4, $5, $6) RETURNING attendance_id`,
          [empId, targetDate, clock_in, clock_out, status, calculatedHours]
        );
        savedId = ins.rows[0].attendance_id;
      }

      // Verification
      const vRes = await query('SELECT attendance_id, status, clock_in, clock_out, total_hours FROM attendance WHERE attendance_id = $1', [savedId]);
      if (vRes.rows.length === 0) return { success: false, message: 'Database verification failed for attendance regularization.' };

      return {
        success: true,
        data: vRes.rows[0],
        message: `Attendance for **${targetEmp.first_name} ${targetEmp.last_name || ''}** on **${targetDate}** regularized to **${status.toUpperCase()}** (${clock_in ? `In: ${clock_in}` : 'No In Punch'}, ${clock_out ? `Out: ${clock_out}` : 'No Out Punch'}, Total Hours: **${calculatedHours || 0}h**).`
      };
    }
  }
];

module.exports = attendanceTools;
