const { pool, query } = require('../config/database');

async function testEmailQueue() {
  console.log('Testing email queue SQL queries...');
  try {
    const status = 'pending';
    const limitNum = 15;
    const offset = 0;
    const params = [];
    let paramIdx = 1;

    let sql = `SELECT eq.*, 
      COALESCE(e.first_name || ' ' || e.last_name, eq.recipient_email, 'Recipient') as employee_name, 
      ps.employee_id
      FROM email_queue eq
      LEFT JOIN payslips ps ON eq.payslip_id = ps.payslip_id
      LEFT JOIN employees e ON ps.employee_id = e.employee_id
      WHERE 1=1`;
    let countSql = `SELECT COUNT(*) as total FROM email_queue eq WHERE 1=1`;

    if (status) {
      sql += ` AND eq.status = $${paramIdx}`;
      countSql += ` AND eq.status = $${paramIdx}`;
      params.push(status);
      paramIdx++;
    }

    sql += ' ORDER BY eq.created_at DESC';
    sql += ` LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
    params.push(limitNum, offset);

    console.log('Count SQL:', countSql);
    console.log('List SQL:', sql);
    console.log('Params for count:', params.slice(0, -2));
    console.log('Params for list:', params);

    const countResult = await query(countSql, params.slice(0, -2));
    console.log('Count result total:', countResult.rows[0].total);

    const listResult = await query(sql, params);
    console.log('List result rows count:', listResult.rows.length);

    console.log('✅ Email queue queries executed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Email queue query failed:', err);
    process.exit(1);
  }
}

testEmailQueue();
