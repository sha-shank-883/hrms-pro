import React, { useEffect, useState } from 'react';
import { recruitmentService, departmentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import { FaBriefcase, FaUsers, FaPlus, FaSearch, FaTimes, FaFilter, FaCheckCircle, FaExclamationCircle, FaCloudUploadAlt } from 'react-icons/fa';
import { FiEdit2, FiTrash2, FiExternalLink } from 'react-icons/fi';
const Recruitment = () => {
  const { user } = useAuth();
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
        limit: 10
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
        limit: 10
      };

      const response = await recruitmentService.getAllApplications(params);
      setApplications(response.data);
      setAppPagination(response.pagination);
    } catch (error) {
      console.error('Failed to load applications:', error);
    }
  };

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
    setError('');

    try {
      if (editingJob) {
        await recruitmentService.updateJob(editingJob.job_id, jobFormData);
        setSuccess('Job posting updated!');
      } else {
        await recruitmentService.createJob(jobFormData);
        setSuccess('Job posting created!');
      }
      loadJobs();
      handleCloseJobModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Operation failed: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleAppSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await recruitmentService.createApplication(appFormData);
      setSuccess('Application submitted!');
      loadApplications();
      handleCloseAppModal();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Application failed: ' + (error.response?.data?.message || error.message));
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

    // Check if file is PDF
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
        // Append skills to cover letter or notes if found
        cover_letter: prev.cover_letter + (data.data.skills ? `\n\nSkills found in resume: ${data.data.skills}` : '')
      }));

      setSuccess('Resume parsed successfully! Form auto-filled.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Parse resume error:', error);
      setError('Failed to parse resume: ' + (error.response?.data?.message || error.message));
    } finally {
      setParsingLoading(false);
      // Clear the file input
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
    <div className="page-container">
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
      )}

      {activeTab === 'applications' && (
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
                        <button
                          className="p-1.5 text-neutral-400 hover:text-danger hover:bg-danger-50 rounded transition-colors"
                          onClick={() => handleDeleteApp(app.application_id)}
                          title="Delete"
                        >
                          <FiTrash2 size={16} />
                        </button>
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
      )}

      {/* Job Posting Modal */}
      {showJobModal && (
        <div className="modal-overlay" onClick={handleCloseJobModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingJob ? 'Edit Job Posting' : 'New Job Posting'}</h2>
              <button onClick={handleCloseJobModal} className="modal-close">
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleJobSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Job Title <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={jobFormData.title}
                    onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    value={jobFormData.description}
                    onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })}
                    rows="3"
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
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Responsibilities</label>
                  <textarea
                    className="form-input"
                    value={jobFormData.responsibilities}
                    onChange={(e) => setJobFormData({ ...jobFormData, responsibilities: e.target.value })}
                    rows="3"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseJobModal}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingJob ? 'Update Posting' : 'Create Posting'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showAppModal && (
        <div className="modal-overlay" onClick={handleCloseAppModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Submit Application</h2>
              <button onClick={handleCloseAppModal} className="modal-close">
                <FaTimes />
              </button>
            </div>

            <div className="modal-body space-y-6">
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-primary-700 mb-1">Auto-fill from Resume</h4>
                  <p className="text-xs text-primary-600">Upload a PDF resume to automatically fill available details.</p>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeParse}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full z-10"
                    disabled={parsingLoading}
                  />
                  <button className="btn btn-primary btn-sm flex items-center gap-2" disabled={parsingLoading}>
                    {parsingLoading ? <FaExclamationCircle className="animate-spin" /> : <FaCloudUploadAlt />}
                    {parsingLoading ? 'Parsing...' : 'Upload PDF'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleAppSubmit}>
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
                      rows="4"
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

                <div className="modal-footer px-0 pb-0 pt-6">
                  <button type="button" className="btn btn-secondary" onClick={handleCloseAppModal}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Submit Application</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recruitment;

