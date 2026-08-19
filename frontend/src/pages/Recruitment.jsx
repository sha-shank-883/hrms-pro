import React, { useEffect, useState } from 'react';
import { recruitmentService, departmentService, aiIntelligenceService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import { FaBriefcase, FaUsers, FaPlus, FaSearch, FaTimes, FaFilter, FaCheckCircle, FaExclamationCircle, FaCloudUploadAlt, FaMagic, FaStar, FaAward, FaRobot } from 'react-icons/fa';
import { FiEdit2, FiTrash2, FiExternalLink, FiAward, FiCheckSquare, FiHelpCircle } from 'react-icons/fi';
import AIModal from '../components/ai/AIModal';

const Recruitment = () => {
  const { user, hasModule } = useAuth();
  const { getSetting } = useSettings();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showAppModal, setShowAppModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('jobs');

  // AI Intelligence States
  const [showAiJobModal, setShowAiJobModal] = useState(false);
  const [aiJobLoading, setAiJobLoading] = useState(false);
  const [aiJobError, setAiJobError] = useState('');
  const [aiJobResult, setAiJobResult] = useState(null);

  const [showAiScreeningModal, setShowAiScreeningModal] = useState(false);
  const [aiScreeningLoading, setAiScreeningLoading] = useState(false);
  const [aiScreeningError, setAiScreeningError] = useState('');
  const [aiScreeningResult, setAiScreeningResult] = useState(null);
  const [activeScreeningApp, setActiveScreeningApp] = useState(null);

  const [showAiBatchModal, setShowAiBatchModal] = useState(false);
  const [aiBatchLoading, setAiBatchLoading] = useState(false);
  const [aiBatchError, setAiBatchError] = useState('');
  const [aiBatchResult, setAiBatchResult] = useState(null);
  const [jobFormData, setJobFormData] = useState({
    title: '',
    description: '',
    department_id: '',
    position_type: 'full-time',
    experience_required: '',
    salary_range: '',
    location: '',
    requirements: '',
    responsibilities: '',
    deadline: ''
  });
  const [appFormData, setAppFormData] = useState({
    job_id: '',
    applicant_name: '',
    email: '',
    phone: '',
    resume_url: '',
    cover_letter: '',
    experience_years: '',
    current_salary: '',
    expected_salary: ''
  });
  const [jobPagination, setJobPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  });
  const [appPagination, setAppPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNext: false,
    hasPrev: false
  });
  const [jobFilters, setJobFilters] = useState({
    status: '',
    department_id: ''
  });
  const [appFilters, setAppFilters] = useState({
    status: '',
    job_id: ''
  });
  const [parsingLoading, setParsingLoading] = useState(false);

  useEffect(() => {
    loadJobs();
    loadApplications();
    loadDepartments();
  }, []);

  const loadJobs = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        limit: 10,
        status: jobFilters.status || undefined,
        department_id: jobFilters.department_id || undefined
      };

      const response = await recruitmentService.getAllJobs(params);
      setJobs(response.data);
      setJobPagination(response.pagination);
      setError('');
    } catch (error) {
      setError('Failed to load jobs: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async (page = 1) => {
    try {
      const params = {
        page: page,
        limit: 10,
        status: appFilters.status || undefined,
        job_id: appFilters.job_id || undefined
      };

      const response = await recruitmentService.getAllApplications(params);
      setApplications(response.data);
      setAppPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

  useEffect(() => {
    loadJobs(1);
  }, [jobFilters]);

  useEffect(() => {
    loadApplications(1);
  }, [appFilters]);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to load departments:', error);
    }
  };

  const handleJobPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= jobPagination.totalPages) {
      loadJobs(newPage);
    }
  };

  const handleAppPageChange = (newPage) => {
    if (newPage >= 1 && newPage <= appPagination.totalPages) {
      loadApplications(newPage);
    }
  };

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    setJobModalError('');
    setJobSubmitting(true);

    try {
      if (editingJob) {
        await recruitmentService.updateJob(editingJob.job_id, jobFormData);
        setSuccess('Job opening updated successfully!');
      } else {
        await recruitmentService.createJob(jobFormData);
        setSuccess('Job opening created successfully!');
      }
      loadJobs();
      handleCloseJobModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to save job opening';
      setJobModalError(msg);
    } finally {
      setJobSubmitting(false);
    }
  };

  const handleAppSubmit = async (e) => {
    e.preventDefault();
    setAppModalError('');
    setAppSubmitting(true);

    try {
      await recruitmentService.createApplication(appFormData);
      setSuccess('Application submitted successfully!');
      loadApplications();
      handleCloseAppModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to submit application';
      setAppModalError(msg);
    } finally {
      setAppSubmitting(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (window.confirm('Delete this job posting?')) {
      try {
        await recruitmentService.deleteJob(id);
        setSuccess('Job deleted!');
        loadJobs();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDeleteApp = async (id) => {
    if (window.confirm('Delete this application?')) {
      try {
        await recruitmentService.deleteApplication(id);
        setSuccess('Application deleted!');
        loadApplications();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Delete failed: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleResumeParse = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are supported for parsing');
      return;
    }

    try {
      setParsingLoading(true);
      setError('');
      const data = await recruitmentService.parseResume(file);

      setAppFormData(prev => ({
        ...prev,
        applicant_name: data.data.name || prev.applicant_name,
        email: data.data.email || prev.email,
        phone: data.data.phone || prev.phone,
        cover_letter: prev.cover_letter + (data.data.skills ? `\n\nSkills found in resume: ${data.data.skills}` : '')
      }));

      setSuccess('Resume parsed successfully! Form auto-filled.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Parse resume error:', error);
      setError('Failed to parse resume: ' + (error.response?.data?.message || error.message));
    } finally {
      setParsingLoading(false);
      e.target.value = '';
    }
  };

  const handleUpdateAppStatus = async (id, status) => {
    try {
      await recruitmentService.updateApplicationStatus(id, { status });
      setSuccess(`Application ${status}!`);
      loadApplications();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Status update failed: ' + (error.response?.data?.message || error.message));
    }
  };

  // AI Handlers
  const handleGenerateJobWithAI = async () => {
    if (!jobFormData.title) {
      alert('Please enter a Job Title first so AI can draft tailored specifications.');
      return;
    }
    setShowAiJobModal(true);
    setAiJobLoading(true);
    setAiJobError('');
    setAiJobResult(null);

    try {
      const selectedDept = departments.find(d => String(d.department_id) === String(jobFormData.department_id))?.department_name;
      const res = await aiIntelligenceService.generateJobDescription({
        title: jobFormData.title,
        department: selectedDept,
        positionType: jobFormData.position_type,
        experienceRequired: jobFormData.experience_required,
        location: jobFormData.location,
        salaryRange: jobFormData.salary_range,
        notes: jobFormData.description || jobFormData.requirements
      });
      setAiJobResult(res.data);
    } catch (err) {
      setAiJobError(err.response?.data?.message || err.message || 'Failed to generate job description with AI');
    } finally {
      setAiJobLoading(false);
    }
  };

  const applyAiJobToForm = () => {
    if (!aiJobResult) return;
    setJobFormData(prev => ({
      ...prev,
      title: aiJobResult.title || prev.title,
      description: aiJobResult.summary || prev.description,
      requirements: Array.isArray(aiJobResult.requirements) ? aiJobResult.requirements.map(r => `• ${r}`).join('\n') : (aiJobResult.requirements || prev.requirements),
      responsibilities: Array.isArray(aiJobResult.responsibilities) ? aiJobResult.responsibilities.map(r => `• ${r}`).join('\n') : (aiJobResult.responsibilities || prev.responsibilities)
    }));
    setShowAiJobModal(false);
    setSuccess('AI Job Description applied to form!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleScreenCandidateWithAI = async (app) => {
    setActiveScreeningApp(app);
    setShowAiScreeningModal(true);
    setAiScreeningLoading(true);
    setAiScreeningError('');
    setAiScreeningResult(null);

    try {
      const res = await aiIntelligenceService.screenResume({
        jobId: app.job_id,
        applicationId: app.application_id,
        applicantName: app.applicant_name,
        experienceYears: app.experience_years,
        skills: app.skills,
        resumeText: app.cover_letter || `Resume URL: ${app.resume_url || 'On file'}`
      });
      setAiScreeningResult(res.data);
    } catch (err) {
      setAiScreeningError(err.response?.data?.message || err.message || 'Failed to screen candidate with AI');
    } finally {
      setAiScreeningLoading(false);
    }
  };

  const handleBatchScreenCandidates = async () => {
    if (!appFilters.job_id) {
      alert('Please select a specific Job Role in the filter above to rank its candidates.');
      return;
    }
    const filteredApps = applications.filter(a => String(a.job_id) === String(appFilters.job_id));
    if (filteredApps.length === 0) {
      alert('No applications found for the selected job in current view.');
      return;
    }

    setShowAiBatchModal(true);
    setAiBatchLoading(true);
    setAiBatchError('');
    setAiBatchResult(null);

    try {
      const res = await aiIntelligenceService.batchScreenCandidates({
        jobId: parseInt(appFilters.job_id),
        applicationIds: filteredApps.map(a => a.application_id)
      });
      setAiBatchResult(res);
    } catch (err) {
      setAiBatchError(err.response?.data?.message || err.message || 'Failed to run batch candidate ranking');
    } finally {
      setAiBatchLoading(false);
    }
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setJobFormData({
      title: job.title,
      description: job.description || '',
      department_id: job.department_id || '',
      position_type: job.position_type || 'full-time',
      experience_required: job.experience_required || '',
      salary_range: job.salary_range || '',
      location: job.location || '',
      requirements: job.requirements || '',
      responsibilities: job.responsibilities || '',
      deadline: job.deadline || ''
    });
    setShowJobModal(true);
  };

  const handleCloseJobModal = () => {
    setShowJobModal(false);
    setEditingJob(null);
    setJobModalError('');
    setError('');
    setJobFormData({
      title: '',
      description: '',
      department_id: '',
      position_type: 'full-time',
      experience_required: '',
      salary_range: '',
      location: '',
      requirements: '',
      responsibilities: '',
      deadline: ''
    });
  };

  const handleCloseAppModal = () => {
    setShowAppModal(false);
    setSelectedJob(null);
    setAppModalError('');
    setError('');
    setAppFormData({
      job_id: '',
      applicant_name: '',
      email: '',
      phone: '',
      resume_url: '',
      cover_letter: '',
      experience_years: '',
      current_salary: '',
      expected_salary: ''
    });
  };

  if (loading && activeTab === 'jobs') return <div className="loading">Loading...</div>;

  const positionTypes = ['full-time', 'part-time', 'contract', 'internship', 'remote'];
  const appStatuses = ['pending', 'reviewed', 'interview', 'offered', 'rejected'];

  return (
    <div className="">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Recruitment & Hiring</h1>
          <p className="text-neutral-500">Manage job postings, candidates, and hiring pipelines</p>
        </div>
        <div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingJob(null);
              setJobFormData({
                title: '',
                description: '',
                department_id: '',
                position_type: 'full-time',
                experience_required: '',
                salary_range: '',
                location: '',
                requirements: '',
                responsibilities: '',
                deadline: ''
              });
              setShowJobModal(true);
            }}
          >
            <FaPlus className="mr-2" /> Post New Job
          </button>
        </div>
      </div>

      {error && (
        <div className="badge badge-danger w-full justify-start p-4 mb-6 rounded-lg text-sm">
          <FaExclamationCircle className="mr-2" /> {error}
        </div>
      )}

      {success && (
        <div className="badge badge-success w-full justify-start p-4 mb-6 rounded-lg text-sm">
          <FaCheckCircle className="mr-2" /> {success}
        </div>
      )}

      {/* Tabs */}
      <div className="tabs mb-6 overflow-x-auto no-scrollbar">
        <button
          className={`tab-item ${activeTab === 'jobs' ? 'tab-item-active' : 'tab-item-inactive'}`}
          onClick={() => setActiveTab('jobs')}
        >
          <FaBriefcase className="mr-2" /> Job Postings
        </button>
        <button
          className={`tab-item ${activeTab === 'applications' ? 'tab-item-active' : 'tab-item-inactive'}`}
          onClick={() => setActiveTab('applications')}
        >
          <FaUsers className="mr-2" /> Applications
        </button>
      </div>

      {activeTab === 'jobs' && (
        <div className="space-y-6">
          {/* Job Filters */}
          <div className="card">
            <div className="card-body">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 items-end w-full">
                <div className="w-full">
                  <label className="form-label mb-1">Department</label>
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                    <select
                      className="form-select pl-9 w-full"
                      value={jobFilters.department_id}
                      onChange={(e) => setJobFilters({ ...jobFilters, department_id: e.target.value })}
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="w-full">
                  <label className="form-label mb-1">Status</label>
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                    <select
                      className="form-select pl-9 w-full"
                      value={jobFilters.status}
                      onChange={(e) => setJobFilters({ ...jobFilters, status: e.target.value })}
                    >
                      <option value="">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="on-hold">On Hold</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 sm:col-span-2 md:col-span-1 w-full mt-2 md:mt-0">
                  <button
                    className="btn btn-secondary h-[42px] px-4"
                    onClick={() => setJobFilters({ status: '', department_id: '' })}
                  >
                    <FaSearch size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0">
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Department</th>
                    <th>Type</th>
                    <th>Location</th>
                    <th>Applicants</th>
                    <th>Posted / Deadline</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-neutral-500">
                        <div className="flex flex-col items-center">
                          <FaBriefcase size={32} className="text-neutral-200 mb-2" />
                          <p>No job postings found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    jobs.map((job) => (
                      <tr key={job.job_id}>
                        <td className="font-semibold text-neutral-900">{job.title}</td>
                        <td>{job.department_name || '-'}</td>
                        <td>
                          <span className="capitalize">{job.position_type?.replace('-', ' ')}</span>
                        </td>
                        <td>{job.location}</td>
                        <td>
                          <button
                            className="text-primary-600 hover:underline text-sm font-medium"
                            onClick={() => setActiveTab('applications')}
                          >
                            View Applicants
                          </button>
                        </td>
                        <td>
                          <div className="text-xs text-neutral-500">
                            <div>Posted: {formatDate(job.posted_date || new Date(), getSetting('date_format'))}</div>
                            {job.deadline && <div className="text-neutral-400 mt-0.5">Due: {formatDate(job.deadline, getSetting('date_format'))}</div>}
                          </div>
                        </td>
                        <td>
                          <div className="flex gap-1">
                            <button
                              className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
                              onClick={() => handleEditJob(job)}
                              title="Edit"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              className="p-1.5 text-neutral-400 hover:text-danger hover:bg-danger-50 rounded transition-colors"
                              onClick={() => handleDeleteJob(job.job_id)}
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                            <button
                              className="p-1.5 text-neutral-400 hover:text-info hover:bg-info-50 rounded transition-colors"
                              onClick={() => {
                                setSelectedJob(job);
                                setAppFormData(prev => ({ ...prev, job_id: job.job_id }));
                                setShowAppModal(true);
                              }}
                              title="Add Applicant"
                            >
                              <FaPlus size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Job Pagination */}
            {jobPagination.totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-neutral-100 bg-neutral-50">
                <span className="text-xs text-neutral-500">
                  Showing page {jobPagination.currentPage} of {jobPagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleJobPageChange(jobPagination.currentPage - 1)}
                    disabled={!jobPagination.hasPrev}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleJobPageChange(jobPagination.currentPage + 1)}
                    disabled={!jobPagination.hasNext}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-6">
          {/* Application Filters */}
          <div className="card">
            <div className="card-body">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4 items-end w-full">
                <div className="w-full">
                  <label className="form-label mb-1">Job Role</label>
                  <div className="relative">
                    <FaBriefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                    <select
                      className="form-select pl-9 w-full"
                      value={appFilters.job_id}
                      onChange={(e) => setAppFilters({ ...appFilters, job_id: e.target.value })}
                    >
                      <option value="">All Job Roles</option>
                      {jobs.map(job => (
                        <option key={job.job_id} value={job.job_id}>{job.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="w-full">
                  <label className="form-label mb-1">Status</label>
                  <div className="relative">
                    <FaFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={12} />
                    <select
                      className="form-select pl-9 w-full"
                      value={appFilters.status}
                      onChange={(e) => setAppFilters({ ...appFilters, status: e.target.value })}
                    >
                      <option value="">All Statuses</option>
                      {appStatuses.map(status => (
                        <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-2 sm:col-span-2 md:col-span-1 w-full mt-2 md:mt-0 items-center justify-end">
                  <button
                    className="btn btn-secondary h-[42px] px-4"
                    onClick={() => setAppFilters({ status: '', job_id: '' })}
                    title="Reset filters"
                  >
                    <FaSearch size={14} />
                  </button>
                  {hasModule('ai_assistant') && (
                    <button
                      type="button"
                      className="btn h-[42px] px-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold flex items-center gap-1.5 shadow-sm text-xs rounded-xl border-none"
                      onClick={handleBatchScreenCandidates}
                      title="AI will analyze and rank all candidates for the selected job"
                    >
                      <FaRobot size={13} /> AI Rank
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card p-0">
            <div className="data-table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Job Applied For</th>
                    <th>Experience</th>
                    <th>Status</th>
                    <th>Applied On</th>
                    <th>Resume</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-neutral-500">
                        <div className="flex flex-col items-center">
                          <FaUsers size={32} className="text-neutral-200 mb-2" />
                          <p>No applications found.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.application_id}>
                        <td>
                          <div className="font-semibold text-neutral-900">{app.applicant_name}</div>
                          <div className="text-xs text-neutral-500">{app.email}</div>
                          <div className="text-xs text-neutral-500">{app.phone}</div>
                        </td>
                        <td>
                          <div className="font-medium text-neutral-700">{app.job_title || 'Unknown Job'}</div>
                        </td>
                        <td>{app.experience_years ? `${app.experience_years} years` : '-'}</td>
                        <td>
                          <select
                            className={`badge badge-${app.status === 'offered' ? 'success' :
                              app.status === 'rejected' ? 'danger' :
                                app.status === 'interview' ? 'info' :
                                  app.status === 'reviewed' ? 'info' :
                                    'neutral'
                              } border-none font-semibold cursor-pointer outline-none`}
                            value={app.status}
                            onChange={(e) => handleUpdateAppStatus(app.application_id, e.target.value)}
                          >
                            {appStatuses.map(status => (
                              <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                            ))}
                          </select>
                        </td>
                        <td className="text-neutral-600 text-sm">
                          {formatDate(app.application_date, getSetting('date_format'))}
                        </td>
                        <td>
                          {app.resume_url ? (
                            <a
                              href={app.resume_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-800 flex items-center gap-1 text-sm font-semibold"
                            >
                              View <FiExternalLink size={12} />
                            </a>
                          ) : <span className="text-neutral-400 text-sm">-</span>}
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            {hasModule('ai_assistant') && (
                              <button
                                type="button"
                                className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold flex items-center gap-1 border border-indigo-200/60 shadow-xs transition-colors"
                                onClick={() => handleScreenCandidateWithAI(app)}
                                title="AI Match & Interview Questions"
                              >
                                <FaMagic size={11} className="text-indigo-500" /> AI Fit
                              </button>
                            )}
                            <button
                              className="p-1.5 text-neutral-400 hover:text-danger hover:bg-danger-50 rounded transition-colors"
                              onClick={() => handleDeleteApp(app.application_id)}
                              title="Delete"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Application Pagination */}
            {appPagination.totalPages > 1 && (
              <div className="flex justify-between items-center p-4 border-t border-neutral-100 bg-neutral-50">
                <span className="text-xs text-neutral-500">
                  Showing page {appPagination.currentPage} of {appPagination.totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAppPageChange(appPagination.currentPage - 1)}
                    disabled={!appPagination.hasPrev}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleAppPageChange(appPagination.currentPage + 1)}
                    disabled={!appPagination.hasNext}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Job Posting Modal */}
      {showJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs" onClick={handleCloseJobModal}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-neutral-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-slate-800 flex justify-between items-center bg-neutral-50/50 dark:bg-slate-850 shrink-0">
              <div>
                <h2 className="text-base font-bold text-neutral-800 dark:text-white">{editingJob ? 'Edit Job Opening' : 'Create New Job Opening'}</h2>
                <p className="text-xs text-neutral-500 dark:text-slate-400">Post recruitment details, requirements, and responsibilities</p>
              </div>
              <button onClick={handleCloseJobModal} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800">
                <FaTimes size={16} />
              </button>
            </div>

            <form onSubmit={handleJobSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Modal Body - Scrollable */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                {jobModalError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                    <FaExclamationCircle className="shrink-0 text-red-500" size={14} />
                    <span>{jobModalError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Job Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={jobFormData.title}
                    onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                    placeholder="e.g. Senior Full Stack Developer"
                    required
                  />
                </div>

                {hasModule('ai_assistant') && (
                  <div className="bg-gradient-to-r from-indigo-50/90 to-purple-50/90 dark:from-indigo-950/40 dark:to-purple-950/40 p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-sm shrink-0">
                        <FaRobot size={15} />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-indigo-950 dark:text-indigo-200">AI Job Description Drafter</h4>
                        <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">Draft comprehensive responsibilities, requirements & skills in seconds.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleGenerateJobWithAI}
                      disabled={!jobFormData.title || aiJobLoading}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg shadow-sm disabled:opacity-40 flex items-center justify-center gap-1.5 transition-all shrink-0"
                    >
                      <FaMagic size={11} /> Auto-Draft with AI
                    </button>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={jobFormData.description}
                    onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                    rows="3"
                    placeholder="Brief overview of the role..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <select
                      className="form-input"
                      value={jobFormData.department_id}
                      onChange={(e) => setJobFormData({ ...jobFormData, department_id: e.target.value })}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Position Type</label>
                    <select
                      className="form-input"
                      value={jobFormData.position_type}
                      onChange={(e) => setJobFormData({ ...jobFormData, position_type: e.target.value })}
                    >
                      {positionTypes.map(type => <option key={type} value={type}>{type.replace('-', ' ')}</option>)}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience</label>
                    <input
                      type="text"
                      className="form-input"
                      value={jobFormData.experience_required}
                      onChange={(e) => setJobFormData({ ...jobFormData, experience_required: e.target.value })}
                      placeholder="e.g. 2-5 years"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Salary Range</label>
                    <input
                      type="text"
                      className="form-input"
                      value={jobFormData.salary_range}
                      onChange={(e) => setJobFormData({ ...jobFormData, salary_range: e.target.value })}
                      placeholder="e.g. $50k - $70k"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-input"
                      value={jobFormData.location}
                      onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })}
                      placeholder="e.g. Remote / New York, NY"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Deadline</label>
                    <input
                      type="date"
                      className="form-input"
                      value={jobFormData.deadline}
                      onChange={(e) => setJobFormData({ ...jobFormData, deadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Requirements</label>
                  <textarea
                    className="form-input"
                    value={jobFormData.requirements}
                    onChange={(e) => setJobFormData({ ...jobFormData, requirements: e.target.value })}
                    rows="3"
                    placeholder="Bullet points of key qualifications..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Responsibilities</label>
                  <textarea
                    className="form-input"
                    value={jobFormData.responsibilities}
                    onChange={(e) => setJobFormData({ ...jobFormData, responsibilities: e.target.value })}
                    rows="3"
                    placeholder="Bullet points of day-to-day duties..."
                  />
                </div>
              </div>

              {/* Modal Footer - Sticky */}
              <div className="px-6 py-3.5 bg-neutral-50 dark:bg-slate-850 border-t border-neutral-100 dark:border-slate-800 flex justify-end items-center gap-3 shrink-0">
                <button type="button" className="btn btn-secondary text-xs" onClick={handleCloseJobModal} disabled={jobSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary text-xs flex items-center gap-2" disabled={jobSubmitting}>
                  {jobSubmitting && <FaExclamationCircle className="animate-spin" />}
                  <span>{jobSubmitting ? 'Saving Opening...' : editingJob ? 'Update Posting' : 'Create Posting'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs" onClick={handleCloseAppModal}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200 border border-neutral-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-slate-800 flex justify-between items-center bg-neutral-50/50 dark:bg-slate-850 shrink-0">
              <div>
                <h2 className="text-base font-bold text-neutral-800 dark:text-white">Submit Candidate Application</h2>
                <p className="text-xs text-neutral-500 dark:text-slate-400">Add applicant details or auto-extract from PDF resume</p>
              </div>
              <button onClick={handleCloseAppModal} className="text-neutral-400 hover:text-neutral-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-slate-800">
                <FaTimes size={16} />
              </button>
            </div>

            <form onSubmit={handleAppSubmit} className="flex flex-col flex-1 overflow-hidden">
              {/* Scrollable Body */}
              <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                {appModalError && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
                    <FaExclamationCircle className="shrink-0 text-red-500" size={14} />
                    <span>{appModalError}</span>
                  </div>
                )}

                <div className="bg-primary-50 dark:bg-primary-950/30 border border-primary-100 dark:border-primary-900/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-primary-800 dark:text-primary-300 mb-0.5">Auto-fill from Resume</h4>
                    <p className="text-[11px] text-primary-600 dark:text-primary-400">Upload a PDF resume to automatically parse and fill candidate details.</p>
                  </div>
                  <div className="relative shrink-0">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleResumeParse}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full z-10"
                      disabled={parsingLoading}
                    />
                    <button type="button" className="btn btn-primary btn-sm flex items-center gap-1.5 text-xs" disabled={parsingLoading}>
                      {parsingLoading ? <FaExclamationCircle className="animate-spin" /> : <FaCloudUploadAlt />}
                      {parsingLoading ? 'Parsing...' : 'Upload PDF'}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Job *</label>
                    <select
                      className="form-input"
                      value={appFormData.job_id}
                      onChange={(e) => setAppFormData({ ...appFormData, job_id: e.target.value })}
                      required
                    >
                      <option value="">Select Job</option>
                      {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.title}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="form-input"
                        value={appFormData.applicant_name}
                        onChange={(e) => setAppFormData({ ...appFormData, applicant_name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email *</label>
                      <input
                        type="email"
                        className="form-input"
                        value={appFormData.email}
                        onChange={(e) => setAppFormData({ ...appFormData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={appFormData.phone}
                        onChange={(e) => setAppFormData({ ...appFormData, phone: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Experience (years)</label>
                      <input
                        type="number"
                        className="form-input"
                        value={appFormData.experience_years}
                        onChange={(e) => setAppFormData({ ...appFormData, experience_years: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-group">
                      <label className="form-label">Current Salary</label>
                      <input
                        type="text"
                        className="form-input"
                        value={appFormData.current_salary}
                        onChange={(e) => setAppFormData({ ...appFormData, current_salary: e.target.value })}
                        placeholder="e.g. $45k"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Expected Salary</label>
                      <input
                        type="text"
                        className="form-input"
                        value={appFormData.expected_salary}
                        onChange={(e) => setAppFormData({ ...appFormData, expected_salary: e.target.value })}
                        placeholder="e.g. $55k"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Cover Letter / Notes</label>
                    <textarea
                      className="form-input"
                      value={appFormData.cover_letter}
                      onChange={(e) => setAppFormData({ ...appFormData, cover_letter: e.target.value })}
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Resume URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={appFormData.resume_url}
                      onChange={(e) => setAppFormData({ ...appFormData, resume_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="px-6 py-3.5 bg-neutral-50 dark:bg-slate-850 border-t border-neutral-100 dark:border-slate-800 flex justify-end items-center gap-3 shrink-0">
                <button type="button" className="btn btn-secondary text-xs" onClick={handleCloseAppModal} disabled={appSubmitting}>Cancel</button>
                <button type="submit" className="btn btn-primary text-xs flex items-center gap-2" disabled={appSubmitting}>
                  {appSubmitting && <FaExclamationCircle className="animate-spin" />}
                  <span>{appSubmitting ? 'Submitting Application...' : 'Submit Application'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 1. AI Job Posting Preview Modal */}
      <AIModal
        isOpen={showAiJobModal}
        onClose={() => setShowAiJobModal(false)}
        title="AI Job Description Preview"
        subtitle={`Generated for ${aiJobResult?.title || jobFormData.title}`}
        loading={aiJobLoading}
        loadingText="Analyzing job market trends and writing requirements..."
        error={aiJobError}
        onRetry={handleGenerateJobWithAI}
        onApply={applyAiJobToForm}
        applyText="Apply to Form"
      >
        {aiJobResult && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Role Summary:</span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{aiJobResult.summary}</p>
            </div>

            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Key Responsibilities:</span>
              <ul className="space-y-1 pl-4 list-disc text-slate-600 dark:text-slate-300">
                {Array.isArray(aiJobResult.responsibilities) && aiJobResult.responsibilities.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div>
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Core Requirements:</span>
              <ul className="space-y-1 pl-4 list-disc text-slate-600 dark:text-slate-300">
                {Array.isArray(aiJobResult.requirements) && aiJobResult.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {aiJobResult.preferred_qualifications?.length > 0 && (
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1.5">Preferred Qualifications:</span>
                <ul className="space-y-1 pl-4 list-disc text-slate-600 dark:text-slate-300">
                  {aiJobResult.preferred_qualifications.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiJobResult.seo_tags?.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-1.5">
                {aiJobResult.seo_tags.map((tag, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </AIModal>

      {/* 2. AI Single Candidate Fit Analysis Modal */}
      <AIModal
        isOpen={showAiScreeningModal}
        onClose={() => setShowAiScreeningModal(false)}
        title="AI Candidate Match Fit Analysis"
        subtitle={`Evaluation for ${activeScreeningApp?.applicant_name || 'Candidate'}`}
        loading={aiScreeningLoading}
        loadingText="Evaluating candidate experience and extracting interview questions..."
        error={aiScreeningError}
        onRetry={() => activeScreeningApp && handleScreenCandidateWithAI(activeScreeningApp)}
      >
        {aiScreeningResult && (
          <div className="space-y-4 text-xs">
            {/* Fit Score Radial Header */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Candidate Match Score</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className={`text-3xl font-extrabold ${
                    aiScreeningResult.match_score >= 80 ? 'text-emerald-600 dark:text-emerald-400' :
                    aiScreeningResult.match_score >= 60 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {aiScreeningResult.match_score}%
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    aiScreeningResult.fit_verdict === 'Strong Fit' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300' :
                    aiScreeningResult.fit_verdict === 'Good Fit' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300' :
                    'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                  }`}>
                    {aiScreeningResult.fit_verdict || 'Evaluated'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block">AI Screening Engine</span>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Gemini 2.0 Flash</span>
              </div>
            </div>

            {/* Executive Notes */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">Executive Summary:</span>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{aiScreeningResult.summary_notes}</p>
            </div>

            {/* Strengths & Gaps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
                <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 mb-2">
                  <FiCheckSquare className="text-emerald-600" /> Key Strengths
                </span>
                <ul className="space-y-1 pl-4 list-disc text-emerald-900 dark:text-emerald-200">
                  {Array.isArray(aiScreeningResult.strengths) && aiScreeningResult.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5 mb-2">
                  <FiAward className="text-amber-600" /> Gaps & Growth Areas
                </span>
                <ul className="space-y-1 pl-4 list-disc text-amber-900 dark:text-amber-200">
                  {Array.isArray(aiScreeningResult.gaps) && aiScreeningResult.gaps.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Tailored Interview Questions */}
            {aiScreeningResult.interview_questions?.length > 0 && (
              <div className="p-3.5 bg-indigo-50/40 dark:bg-indigo-950/20 rounded-xl border border-indigo-100 dark:border-indigo-900/40">
                <span className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 mb-2">
                  <FiHelpCircle className="text-indigo-600" /> Recommended Interview Questions
                </span>
                <ol className="space-y-1.5 pl-4 list-decimal text-slate-700 dark:text-slate-300">
                  {aiScreeningResult.interview_questions.map((q, i) => (
                    <li key={i} className="pl-1 leading-relaxed">{q}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}
      </AIModal>

      {/* 3. AI Batch Candidate Ranking Modal */}
      <AIModal
        isOpen={showAiBatchModal}
        onClose={() => setShowAiBatchModal(false)}
        title="AI Candidate Pipeline Ranking"
        subtitle={`Ranked candidates for ${aiBatchResult?.job_title || 'Selected Job'}`}
        loading={aiBatchLoading}
        loadingText="Screening and ranking all candidates in parallel..."
        error={aiBatchError}
        onRetry={handleBatchScreenCandidates}
      >
        {aiBatchResult && (
          <div className="space-y-4 text-xs">
            <p className="text-slate-600 dark:text-slate-400">
              Evaluated <strong>{aiBatchResult.total_evaluated}</strong> applicants and ranked them by verified skill alignment:
            </p>

            <div className="space-y-2.5">
              {aiBatchResult.ranked_candidates?.map((cand, idx) => (
                <div
                  key={cand.application_id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{cand.applicant_name}</h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{cand.summary_notes}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`text-base font-extrabold block ${
                      cand.match_score >= 80 ? 'text-emerald-600' :
                      cand.match_score >= 60 ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {cand.match_score}%
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400">{cand.fit_verdict}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AIModal>
    </div>
  );
};

export default Recruitment;
