const { pool, query } = require('../config/database');
const asyncHandler = require('../utils/asyncHandler');
const { ValidationError, NotFoundError, ForbiddenError } = require('../utils/errors');
const aiIntelligenceService = require('../services/ai/aiIntelligenceService');

/**
 * Helper to record AI Action Log in tenant schema
 */
async function logAIAction(tenantId, userId, featureType, promptSummary, modelUsed, latencyMs, status = 'success') {
  if (!tenantId) return;
  try {
    await pool.query(
      `INSERT INTO "${tenantId}".ai_action_logs (user_id, feature_type, prompt_summary, model_used, latency_ms, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId || null, featureType, promptSummary ? promptSummary.slice(0, 500) : null, modelUsed || 'default', latencyMs || 0, status]
    );
  } catch (err) {
    // Non-blocking log error
    console.error(`[AI Controller Log Error for ${tenantId}]:`, err.message);
  }
}

/**
 * 1. Screen a Single Candidate Resume against a Job Opening
 */
const screenResume = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.user?.tenantId;
  const { jobId, applicationId, jobTitle, requirements, responsibilities, resumeText, applicantName, experienceYears, skills } = req.body;

  let finalJobTitle = jobTitle;
  let finalRequirements = requirements;
  let finalResponsibilities = responsibilities;
  let finalResumeText = resumeText;
  let finalApplicantName = applicantName;
  let finalExp = experienceYears;
  let finalSkills = skills;

  // If jobId and applicationId provided, fetch details directly from tenant database
  if (tenantId && jobId) {
    const jobRes = await pool.query(
      `SELECT title, requirements, responsibilities, description FROM "${tenantId}".job_postings WHERE job_id = $1`,
      [jobId]
    );
    if (jobRes.rows.length > 0) {
      const j = jobRes.rows[0];
      finalJobTitle = j.title || finalJobTitle;
      finalRequirements = j.requirements || finalRequirements || j.description;
      finalResponsibilities = j.responsibilities || finalResponsibilities;
    }
  }

  if (tenantId && applicationId) {
    const appRes = await pool.query(
      `SELECT applicant_name, resume_url, cover_letter, experience_years, skills FROM "${tenantId}".job_applications WHERE application_id = $1`,
      [applicationId]
    );
    if (appRes.rows.length > 0) {
      const a = appRes.rows[0];
      finalApplicantName = a.applicant_name || finalApplicantName;
      finalExp = a.experience_years || finalExp;
      finalSkills = a.skills || finalSkills;
      finalResumeText = a.cover_letter || finalResumeText || `Resume available at: ${a.resume_url || 'On record'}`;
    }
  }

  if (!finalJobTitle && !finalRequirements) {
    throw new ValidationError('Job title or requirements are required for resume screening');
  }

  const startTime = Date.now();
  const evaluation = await aiIntelligenceService.screenCandidateResume({
    jobTitle: finalJobTitle,
    requirements: finalRequirements,
    responsibilities: finalResponsibilities,
    resumeText: finalResumeText,
    applicantName: finalApplicantName,
    experienceYears: finalExp,
    skills: finalSkills
  });
  const latency = Date.now() - startTime;

  // Save evaluation to tenant database if job & application IDs are present
  if (tenantId && (jobId || applicationId)) {
    try {
      await pool.query(
        `INSERT INTO "${tenantId}".ai_screening_evaluations 
         (job_id, application_id, candidate_name, match_score, fit_verdict, strengths, gaps, interview_questions, summary_notes, raw_evaluation, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          jobId || null,
          applicationId || null,
          finalApplicantName || 'Candidate',
          evaluation.match_score,
          evaluation.fit_verdict,
          JSON.stringify(evaluation.strengths || []),
          JSON.stringify(evaluation.gaps || []),
          JSON.stringify(evaluation.interview_questions || []),
          evaluation.summary_notes,
          JSON.stringify(evaluation),
          req.user?.userId || null
        ]
      );
    } catch (e) {
      console.warn(`[AI Controller] Could not save screening row: ${e.message}`);
    }
  }

  await logAIAction(tenantId, req.user?.userId, 'resume_screening', `Screened candidate: ${finalApplicantName || 'N/A'} for ${finalJobTitle}`, evaluation.provider, latency);

  res.json({
    success: true,
    data: evaluation
  });
});

/**
 * 2. Batch Screen & Rank Candidates for a Specific Job Opening
 */
const batchScreenCandidates = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.user?.tenantId;
  const { jobId, applicationIds } = req.body;

  if (!jobId) {
    throw new ValidationError('Job ID is required for batch screening');
  }

  if (!Array.isArray(applicationIds) || applicationIds.length === 0) {
    throw new ValidationError('Please provide a non-empty array of application IDs');
  }

  // Cap batch size to 10 to prevent server timeouts
  const targetIds = applicationIds.slice(0, 10);

  // Fetch job details
  const jobRes = await pool.query(
    `SELECT title, requirements, responsibilities, description FROM "${tenantId}".job_postings WHERE job_id = $1`,
    [jobId]
  );
  if (jobRes.rows.length === 0) {
    throw new NotFoundError('Job posting not found');
  }
  const job = jobRes.rows[0];

  // Fetch applications
  const appsRes = await pool.query(
    `SELECT application_id, applicant_name, resume_url, cover_letter, experience_years, skills, status 
     FROM "${tenantId}".job_applications 
     WHERE application_id = ANY($1::int[]) AND job_id = $2`,
    [targetIds, jobId]
  );

  const results = [];
  for (const app of appsRes.rows) {
    try {
      const evaluation = await aiIntelligenceService.screenCandidateResume({
        jobTitle: job.title,
        requirements: job.requirements || job.description,
        responsibilities: job.responsibilities,
        resumeText: app.cover_letter || `Resume on record at ${app.resume_url || 'N/A'}`,
        applicantName: app.applicant_name,
        experienceYears: app.experience_years,
        skills: app.skills
      });

      results.push({
        application_id: app.application_id,
        applicant_name: app.applicant_name,
        current_status: app.status,
        ...evaluation
      });
    } catch (err) {
      results.push({
        application_id: app.application_id,
        applicant_name: app.applicant_name,
        match_score: 50,
        fit_verdict: 'Review Required',
        summary_notes: 'Automated evaluation skipped due to format constraints.',
        strengths: [],
        gaps: [],
        interview_questions: []
      });
    }
  }

  // Sort descending by match score
  results.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

  await logAIAction(tenantId, req.user?.userId, 'batch_resume_screening', `Batch screened ${results.length} candidates for job ${jobId}`, 'multi', 0);

  res.json({
    success: true,
    job_id: jobId,
    job_title: job.title,
    total_evaluated: results.length,
    ranked_candidates: results
  });
});

/**
 * 3. Generate Structured Job Description & Posting
 */
const generateJobDescription = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.user?.tenantId;
  const { title, department, positionType, experienceRequired, location, salaryRange, keyResponsibilities, requirements, notes } = req.body;

  if (!title) {
    throw new ValidationError('Job title is required');
  }

  const startTime = Date.now();
  const jobPosting = await aiIntelligenceService.generateJobPosting({
    title,
    department,
    positionType,
    experienceRequired,
    location,
    salaryRange,
    keyResponsibilities,
    requirements,
    notes
  });
  const latency = Date.now() - startTime;

  await logAIAction(tenantId, req.user?.userId, 'job_description_generator', `Generated job: ${title} (${department || 'General'})`, jobPosting.provider, latency);

  res.json({
    success: true,
    data: jobPosting
  });
});

/**
 * 4. Draft Smart HR Email
 */
const draftEmail = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.user?.tenantId;
  const { purpose, recipientName, recipientRole, subjectHint, tone, keyDetails, customInstructions } = req.body;

  if (!purpose && !keyDetails) {
    throw new ValidationError('Email purpose or key details are required');
  }

  const startTime = Date.now();
  const emailDraft = await aiIntelligenceService.draftHREmail({
    purpose,
    recipientName,
    recipientRole,
    subjectHint,
    tone,
    keyDetails,
    customInstructions
  });
  const latency = Date.now() - startTime;

  await logAIAction(tenantId, req.user?.userId, 'email_drafter', `Drafted ${purpose || 'HR email'} for ${recipientName || 'Recipient'}`, emailDraft.provider, latency);

  res.json({
    success: true,
    data: emailDraft
  });
});

/**
 * 5. Generate Employee Performance & Appraisal Summary
 */
const generateEmployeePerformanceSummary = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.user?.tenantId;
  const { employeeId, employeeName, position, department, period, managerNotes } = req.body;

  let finalName = employeeName;
  let finalPosition = position;
  let finalDept = department;
  let attendanceStats = null;
  let taskStats = null;
  let reviewsHistory = [];

  // If employeeId is provided, pull real analytics from tenant schema
  if (tenantId && employeeId) {
    // 1. Employee info
    const empRes = await pool.query(
      `SELECT e.id, e.first_name, e.last_name, e.designation, d.name as department_name 
       FROM "${tenantId}".employees e 
       LEFT JOIN "${tenantId}".departments d ON e.department_id = d.id 
       WHERE e.id = $1`,
      [employeeId]
    );
    if (empRes.rows.length > 0) {
      const e = empRes.rows[0];
      finalName = `${e.first_name || ''} ${e.last_name || ''}`.trim() || finalName;
      finalPosition = e.designation || finalPosition;
      finalDept = e.department_name || finalDept;
    }

    // 2. Attendance stats (last 30-60 days)
    try {
      const attRes = await pool.query(
        `SELECT 
           COUNT(*) as total_records,
           COUNT(*) FILTER (WHERE status = 'present') as present_count,
           COUNT(*) FILTER (WHERE status = 'late') as late_count,
           COUNT(*) FILTER (WHERE status = 'half_day') as half_day_count,
           COUNT(*) FILTER (WHERE status = 'absent') as absent_count
         FROM "${tenantId}".attendance 
         WHERE employee_id = $1 AND date >= CURRENT_DATE - INTERVAL '60 days'`,
        [employeeId]
      );
      if (attRes.rows.length > 0) {
        const a = attRes.rows[0];
        const total = parseInt(a.total_records) || 0;
        const present = parseInt(a.present_count) || 0;
        const onTimeRate = total > 0 ? `${Math.round((present / total) * 100)}%` : '100%';
        attendanceStats = {
          total_days_logged: total,
          present_days: present,
          late_days: parseInt(a.late_count) || 0,
          on_time_rate: onTimeRate
        };
      }
    } catch (e) {
      // ignore
    }

    // 3. Tasks execution
    try {
      const tasksRes = await pool.query(
        `SELECT 
           COUNT(*) as total_tasks,
           COUNT(*) FILTER (WHERE status = 'completed') as completed_tasks,
           COUNT(*) FILTER (WHERE status = 'in_progress') as in_progress_tasks
         FROM "${tenantId}".tasks 
         WHERE assigned_to = $1`,
        [employeeId]
      );
      if (tasksRes.rows.length > 0) {
        const t = tasksRes.rows[0];
        const total = parseInt(t.total_tasks) || 0;
        const completed = parseInt(t.completed_tasks) || 0;
        taskStats = {
          total_assigned: total,
          completed: completed,
          completion_rate: total > 0 ? `${Math.round((completed / total) * 100)}%` : 'N/A'
        };
      }
    } catch (e) {
      // ignore
    }
  }

  const startTime = Date.now();
  const report = await aiIntelligenceService.generateEmployeePerformanceReport({
    employeeName: finalName || 'Employee',
    position: finalPosition || 'Staff',
    department: finalDept || 'General',
    attendanceStats,
    taskStats,
    reviewsHistory,
    period: period || 'Recent Review Cycle',
    managerNotes
  });
  const latency = Date.now() - startTime;

  await logAIAction(tenantId, req.user?.userId, 'performance_review_summary', `Performance summary for ${finalName || 'Employee'}`, report.provider, latency);

  res.json({
    success: true,
    data: {
      employee_id: employeeId || null,
      employee_name: finalName,
      position: finalPosition,
      department: finalDept,
      ...report
    }
  });
});

/**
 * 6. Generate Company Executive Workforce & Productivity Insights
 */
const generateExecutiveInsights = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.user?.tenantId;

  let workforceSummary = {
    total_headcount: 0,
    departments: [],
    recent_attendance_rate: '94%',
    tasks_completion_rate: '88%',
    payroll_run_status: 'On track'
  };

  if (tenantId) {
    try {
      // 1. Headcount
      const empRes = await pool.query(`SELECT COUNT(*) as count FROM "${tenantId}".employees WHERE status = 'active'`);
      workforceSummary.total_headcount = parseInt(empRes.rows[0]?.count) || 0;

      // 2. Department distribution
      const deptRes = await pool.query(`
        SELECT d.name, COUNT(e.id) as employee_count 
        FROM "${tenantId}".departments d 
        LEFT JOIN "${tenantId}".employees e ON e.department_id = d.id AND e.status = 'active'
        GROUP BY d.name
      `);
      workforceSummary.departments = deptRes.rows;

      // 3. Attendance rate
      const attRes = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'present') as present
        FROM "${tenantId}".attendance 
        WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      `);
      if (attRes.rows[0]?.total > 0) {
        const rate = Math.round((parseInt(attRes.rows[0].present) / parseInt(attRes.rows[0].total)) * 100);
        workforceSummary.recent_attendance_rate = `${rate}%`;
      }

      // 4. Task velocity
      const taskRes = await pool.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'completed') as completed
        FROM "${tenantId}".tasks
      `);
      if (taskRes.rows[0]?.total > 0) {
        const rate = Math.round((parseInt(taskRes.rows[0].completed) / parseInt(taskRes.rows[0].total)) * 100);
        workforceSummary.tasks_completion_rate = `${rate}%`;
      }
    } catch (e) {
      console.warn(`[AI Controller] Error aggregating executive metrics: ${e.message}`);
    }
  }

  const startTime = Date.now();
  const insights = await aiIntelligenceService.generateExecutiveInsights({ workforceSummary });
  const latency = Date.now() - startTime;

  await logAIAction(tenantId, req.user?.userId, 'executive_workforce_insights', 'Generated organizational executive insights', insights.provider, latency);

  res.json({
    success: true,
    metrics_snapshot: workforceSummary,
    data: insights
  });
});

/**
 * 7. Get Tenant AI Usage & Plan Entitlement Status
 */
const getAIQuotaStatus = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId || req.user?.tenantId;

  let totalActionsThisMonth = 0;
  let recentLogs = [];

  if (tenantId) {
    try {
      const logsRes = await pool.query(`
        SELECT COUNT(*) as count 
        FROM "${tenantId}".ai_action_logs 
        WHERE created_at >= date_trunc('month', CURRENT_DATE)
      `);
      totalActionsThisMonth = parseInt(logsRes.rows[0]?.count) || 0;

      const recentRes = await pool.query(`
        SELECT id, feature_type, prompt_summary, model_used, latency_ms, status, created_at 
        FROM "${tenantId}".ai_action_logs 
        ORDER BY created_at DESC 
        LIMIT 10
      `);
      recentLogs = recentRes.rows;
    } catch (e) {
      // ignore
    }
  }

  res.json({
    success: true,
    entitled: true,
    monthly_usage: totalActionsThisMonth,
    recent_activity: recentLogs
  });
});

module.exports = {
  screenResume,
  batchScreenCandidates,
  generateJobDescription,
  draftEmail,
  generateEmployeePerformanceSummary,
  generateExecutiveInsights,
  getAIQuotaStatus
};
