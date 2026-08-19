const crypto = require('crypto');
const { generateWithFallback } = require('./providerFactory');
const { sanitizeInput, wrapInBoundary, parseStructuredJSON } = require('./aiSanitizer');

// In-memory response cache for idempotent AI queries (7-day TTL)
const cache = new Map();
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getHashKey(prefix, data) {
  const serialized = typeof data === 'string' ? data : JSON.stringify(data);
  return `${prefix}:${crypto.createHash('sha256').update(serialized).digest('hex')}`;
}

function getFromCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setToCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
  // Maintain cache size under 3000 items
  if (cache.size > 3000) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

/**
 * 1. Screen Candidate Resume against Job Opening
 */
async function screenCandidateResume({ jobTitle, requirements, responsibilities, resumeText, applicantName, experienceYears, skills }) {
  const cacheKey = getHashKey('resume_screen', { jobTitle, requirements, resumeText, experienceYears, skills });
  const cached = getFromCache(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const prompt = `You are a certified Principal Technical Recruiter and Talent Acquisition Specialist.
Evaluate the following candidate application against the job requirements with strict analytical precision.

Target Job Opening:
- Title: ${sanitizeInput(jobTitle || 'Unspecified Role')}
- Required Qualifications: ${sanitizeInput(requirements || 'Standard industry requirements')}
- Key Responsibilities: ${sanitizeInput(responsibilities || 'Standard role responsibilities')}

Candidate Profile:
- Applicant Name: ${sanitizeInput(applicantName || 'Candidate')}
- Experience: ${sanitizeInput(experienceYears ? `${experienceYears} years` : 'Not specified')}
- Listed Skills: ${sanitizeInput(Array.isArray(skills) ? skills.join(', ') : (skills || 'Not specified'))}

${wrapInBoundary('candidate_resume', resumeText || 'No detailed resume text provided.')}

Instructions:
1. Objectively compare the candidate's verified experience, technical stack, and achievements against the job requirements.
2. Determine an objective Match Score from 0 to 100.
3. Classify fit_verdict as one of: "Strong Fit" (85-100), "Good Fit" (70-84), "Potential Fit" (50-69), or "Low Fit" (0-49).
4. Provide 3-5 specific strengths and 2-4 gaps/missing qualifications.
5. Provide a 2-3 sentence executive recommendation summary.
6. Provide 5 tailored interview questions targeting their specific gaps and claimed accomplishments.

Return ONLY a valid JSON object matching this exact structure:
{
  "match_score": 85,
  "fit_verdict": "Strong Fit",
  "summary_notes": "Candidate demonstrates 5+ years of robust full-stack expertise with PostgreSQL and React...",
  "strengths": ["Strong backend architectural background", "Demonstrated hands-on experience with microservices"],
  "gaps": ["No direct mention of Redis caching", "Slightly less experience in team leadership"],
  "interview_questions": [
    "Can you describe how you architected your PostgreSQL database schema for multi-tenant isolation?",
    "How have you handled high concurrency in your previous role?"
  ]
}`;

  const result = await generateWithFallback(prompt);
  if (!result.success && !result.response) {
    throw new Error(result.error || 'AI candidate screening service temporarily unavailable');
  }

  const parsed = parseStructuredJSON(result.response, {
    match_score: 70,
    fit_verdict: 'Good Fit',
    summary_notes: result.response ? result.response.slice(0, 300) : 'Evaluation completed.',
    strengths: ['Relevant domain background'],
    gaps: ['Requires interview verification'],
    interview_questions: ['Describe your experience with the core tech stack required for this position.']
  });

  // Ensure score is bounded between 0 and 100
  parsed.match_score = Math.max(0, Math.min(100, parseInt(parsed.match_score) || 70));
  parsed.provider = result.provider;

  setToCache(cacheKey, parsed);
  return parsed;
}

/**
 * 2. Generate Professional Job Opening & Description
 */
async function generateJobPosting({ title, department, positionType, experienceRequired, location, salaryRange, keyResponsibilities, requirements, notes }) {
  const cacheKey = getHashKey('job_gen', { title, department, positionType, experienceRequired, location, notes });
  const cached = getFromCache(cacheKey);
  if (cached) return { ...cached, fromCache: true };

  const prompt = `You are an expert HR Director and Copywriter.
Create a high-converting, professional, and comprehensive Job Posting based on the parameters below.

Parameters:
- Role Title: ${sanitizeInput(title)}
- Department: ${sanitizeInput(department || 'Engineering')}
- Position Type: ${sanitizeInput(positionType || 'Full-time')}
- Experience Level: ${sanitizeInput(experienceRequired || '2-5 years')}
- Location: ${sanitizeInput(location || 'Remote / Hybrid')}
- Salary Range: ${sanitizeInput(salaryRange || 'Competitive')}
${notes ? wrapInBoundary('custom_hiring_notes', notes) : ''}
${keyResponsibilities ? wrapInBoundary('must_have_responsibilities', keyResponsibilities) : ''}
${requirements ? wrapInBoundary('must_have_requirements', requirements) : ''}

Return ONLY a valid JSON object matching this exact structure:
{
  "title": "Senior Full Stack Engineer",
  "summary": "We are seeking a high-performing engineer to scale our enterprise HRMS SaaS platform...",
  "responsibilities": [
    "Design, build, and maintain scalable multi-tenant REST APIs using Node.js and PostgreSQL",
    "Collaborate with product designers to implement responsive, high-performance web components in React"
  ],
  "requirements": [
    "3+ years of professional full-stack development experience",
    "Deep expertise in modern JavaScript (ES6+), React, and Node.js"
  ],
  "preferred_qualifications": [
    "Experience with SaaS multi-tenancy and high-volume relational databases",
    "Familiarity with Docker containerization and CI/CD pipelines"
  ],
  "benefits_and_perks": [
    "Competitive salary with performance bonuses",
    "Flexible hybrid/remote work schedule",
    "Comprehensive health insurance and paid time off"
  ],
  "seo_tags": ["FullStack", "NodeJS", "React", "PostgreSQL", "Remote"]
}`;

  const result = await generateWithFallback(prompt);
  if (!result.success && !result.response) {
    throw new Error(result.error || 'AI Job posting generator service temporarily unavailable');
  }

  const parsed = parseStructuredJSON(result.response, {
    title: title || 'Job Opening',
    summary: result.response ? result.response.slice(0, 300) : 'Exciting career opportunity.',
    responsibilities: ['Execute key departmental duties and projects.'],
    requirements: ['Relevant experience in the required domain.'],
    preferred_qualifications: ['Strong communication and collaborative mindset.'],
    benefits_and_perks: ['Competitive package and growth opportunities.'],
    seo_tags: [department || 'HR']
  });

  parsed.provider = result.provider;
  setToCache(cacheKey, parsed);
  return parsed;
}

/**
 * 3. Smart HR Email Drafter
 */
async function draftHREmail({ purpose, recipientName, recipientRole, subjectHint, tone, keyDetails, customInstructions }) {
  const prompt = `You are a Chief People Officer and Communications Specialist.
Draft a professional, clear, and engaging HR email tailored to the specific context below.

Context:
- Email Purpose: ${sanitizeInput(purpose || 'General HR Communication')}
- Recipient Name: ${sanitizeInput(recipientName || 'Candidate/Employee')}
- Recipient Role/Title: ${sanitizeInput(recipientRole || 'Team Member')}
- Subject Suggestion: ${sanitizeInput(subjectHint || '')}
- Desired Tone: ${sanitizeInput(tone || 'Professional & Warm')}
${keyDetails ? wrapInBoundary('key_details_to_include', keyDetails) : ''}
${customInstructions ? wrapInBoundary('custom_instructions', customInstructions) : ''}

Formatting Directives:
- Create an engaging, unambiguous Subject line.
- Provide both HTML-ready formatting (\`bodyHtml\` with clean <p>, <ul>, <li> tags) and clean plain text (\`bodyText\`).
- Include standard placeholders like [Company Name], [Time/Date], or [Link] only where specific details are not provided.

Return ONLY a valid JSON object matching this structure:
{
  "subject": "Interview Invitation: Senior Full Stack Engineer at [Company Name]",
  "bodyHtml": "<p>Dear Alex,</p><p>Thank you for applying to our team...</p>",
  "bodyText": "Dear Alex,\\n\\nThank you for applying to our team..."
}`;

  const result = await generateWithFallback(prompt);
  if (!result.success && !result.response) {
    throw new Error(result.error || 'AI Email Drafter service temporarily unavailable');
  }

  const parsed = parseStructuredJSON(result.response, {
    subject: subjectHint || 'Update regarding your application / HR Notification',
    bodyHtml: `<p>${result.response || 'Please review the attached details.'}</p>`,
    bodyText: result.response || 'Please review the attached details.'
  });

  parsed.provider = result.provider;
  return parsed;
}

/**
 * 4. Generate Employee Performance & Appraisal Summary
 */
async function generateEmployeePerformanceReport({ employeeName, position, department, attendanceStats, taskStats, reviewsHistory, period, managerNotes }) {
  const prompt = `You are an Executive Talent Development Lead and Performance Coach.
Generate a structured, insightful, and motivating employee performance review summary based on the operational data below.

Employee Profile:
- Name: ${sanitizeInput(employeeName || 'Employee')}
- Position: ${sanitizeInput(position || 'Staff')}
- Department: ${sanitizeInput(department || 'General')}
- Review Period: ${sanitizeInput(period || 'Quarterly')}

Operational Metrics:
- Attendance & Punctuality: ${JSON.stringify(attendanceStats || { present_days: 22, late_days: 1, on_time_rate: '96%' })}
- Task Execution: ${JSON.stringify(taskStats || { completed: 18, pending: 2, completion_rate: '90%' })}
- Historical Review Scores: ${JSON.stringify(reviewsHistory || [])}
${managerNotes ? wrapInBoundary('manager_observations', managerNotes) : ''}

Instructions:
1. Synthesize quantitative attendance/task metrics with qualitative performance.
2. Provide a Performance Rating (1.0 to 5.0) and Rating Label ("Exceptional", "Exceeds Expectations", "Meets Expectations", "Needs Improvement").
3. Highlight 3 key accomplishments and 2 targeted developmental/growth focus areas.
4. Recommend concrete next steps (e.g. leadership grooming, technical upskilling, goal adjustment).

Return ONLY a valid JSON object matching this structure:
{
  "rating": 4.5,
  "rating_label": "Exceeds Expectations",
  "executive_summary": "Alex has delivered consistent high-impact outcomes across the review cycle...",
  "key_achievements": [
    "Maintained a 96% on-time attendance and 90% task velocity",
    "Successfully spearheaded core backend refactoring"
  ],
  "development_areas": [
    "Expand cross-functional mentorship with junior team members",
    "Improve documentation turnaround time"
  ],
  "action_plan": "Recommended for advanced technical leadership training and eligible for merit review."
}`;

  const result = await generateWithFallback(prompt);
  if (!result.success && !result.response) {
    throw new Error(result.error || 'AI Performance Report service temporarily unavailable');
  }

  const parsed = parseStructuredJSON(result.response, {
    rating: 4.0,
    rating_label: 'Meets Expectations',
    executive_summary: result.response ? result.response.slice(0, 300) : 'Performance summary generated successfully.',
    key_achievements: ['Consistent operational contributions.'],
    development_areas: ['Continue proactive goal tracking.'],
    action_plan: 'Maintain current cadence and review at next appraisal cycle.'
  });

  parsed.provider = result.provider;
  return parsed;
}

/**
 * 5. Generate Company Executive Workforce & Productivity Insights
 */
async function generateExecutiveInsights({ workforceSummary }) {
  const prompt = `You are a Chief HR Strategist and Workforce Analytics Advisor for enterprise leadership.
Analyze the following high-level organizational workforce metrics and produce an executive briefing with strategic action points.

Workforce Snapshot:
${JSON.stringify(workforceSummary || {}, null, 2)}

Instructions:
1. Compute an overall Workforce Health Score (0 to 100).
2. Generate an Executive Headline summarizing the organizational state.
3. Analyze key workforce drivers: productivity vs payroll cost, attendance stability, and retention/churn risks.
4. Outline 3-5 strategic recommendations for C-suite and HR leadership to optimize headcount efficiency and organizational health.

Return ONLY a valid JSON object matching this structure:
{
  "workforce_health_score": 88,
  "executive_headline": "Healthy operational momentum with strong task delivery across engineering and sales",
  "productivity_analysis": "Overall task completion rate is high at 89%, while absenteeism remains well within healthy thresholds...",
  "cost_vs_output_commentary": "Payroll expense alignment is optimal relative to current organizational output...",
  "strategic_recommendations": [
    "Scale recruitment in high-velocity departments to prevent workload bottlenecks",
    "Implement quarterly retention check-ins for high-turnover-risk cohorts",
    "Standardize performance appraisal cycles across all subsidiary branches"
  ]
}`;

  const result = await generateWithFallback(prompt);
  if (!result.success && !result.response) {
    throw new Error(result.error || 'AI Executive Insights service temporarily unavailable');
  }

  const parsed = parseStructuredJSON(result.response, {
    workforce_health_score: 85,
    executive_headline: 'Stable organizational performance across departments.',
    productivity_analysis: result.response ? result.response.slice(0, 300) : 'Overall workforce metrics indicate solid engagement.',
    cost_vs_output_commentary: 'Compensation and operational delivery remain balanced.',
    strategic_recommendations: [
      'Maintain continuous feedback loops and weekly 1-on-1s.',
      'Monitor attendance regularization trends.'
    ]
  });

  parsed.provider = result.provider;
  return parsed;
}

module.exports = {
  screenCandidateResume,
  generateJobPosting,
  draftHREmail,
  generateEmployeePerformanceReport,
  generateExecutiveInsights
};
