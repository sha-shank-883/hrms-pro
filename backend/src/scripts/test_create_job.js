const { pool, query } = require('../config/database');

async function testCreateJob() {
  console.log('Testing job creation query directly...');
  try {
    const title = 'Staff Software Engineer (AI Systems)';
    const description = 'Lead development of next-generation AI workflows and automations.';
    const position_type = 'full-time';
    const experience_required = '5+ years';
    const salary_range = '$120,000 - $160,000';
    const location = 'Remote, US';
    const requirements = 'Expertise in React, Node.js, PostgreSQL, AI LLM integrations.';
    const responsibilities = 'Architect scalable services and lead technical implementations.';
    const deadline = '2026-12-31';

    // Check user
    const uRes = await query('SELECT user_id FROM users LIMIT 1');
    const posted_by = uRes.rows.length > 0 ? uRes.rows[0].user_id : null;

    // Check dept
    const dRes = await query('SELECT department_id FROM departments LIMIT 1');
    const validDeptId = dRes.rows.length > 0 ? dRes.rows[0].department_id : null;

    const insertRes = await query(
      `INSERT INTO job_postings (
        title, description, department_id, position_type, experience_required,
        salary_range, location, requirements, responsibilities, posted_by, deadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        title, description, validDeptId, position_type, experience_required,
        salary_range, location, requirements, responsibilities, posted_by, deadline
      ]
    );

    console.log('✅ Successfully created job posting:', insertRes.rows[0]);

    // Clean up test record
    await query('DELETE FROM job_postings WHERE job_id = $1', [insertRes.rows[0].job_id]);
    console.log('✅ Successfully verified and cleaned up test job posting!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Job creation test failed:', err);
    process.exit(1);
  }
}

testCreateJob();
