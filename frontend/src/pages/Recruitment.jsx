import React, { useEffect, useState } from 'react';
import { recruitmentService, departmentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Recruitment</h1>
        <button className="btn btn-primary" onClick={() => setShowJobModal(true)}>+ New Job</button>
      </div>

      {error && <div className="error" style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.375rem' }}>{error}</div>}
      {success && <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#d1fae5', color: '#065f46', borderRadius: '0.375rem' }}>{success}</div>}

      {/* Tab Navigation */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', marginBottom: '1rem' }}>
          <button
            className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('jobs')}
            style={{
              borderBottom: activeTab === 'jobs' ? '2px solid #3b82f6' : 'none',
              borderRadius: '0.375rem 0.375rem 0 0',
              marginRight: '0.5rem'
            }}
          >
            Job Postings
          </button>
          <button
            className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab('applications')}
            style={{
              borderBottom: activeTab === 'applications' ? '2px solid #3b82f6' : 'none',
              borderRadius: '0.375rem 0.375rem 0 0'
            }}
          >
            Applications
          </button>
        </div>

        {/* Jobs Content */}
        {activeTab === 'jobs' && (
          <div>
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Experience</th>
                  <th>Salary</th>
                  <th>Deadline</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No job postings found.
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job.job_id}>
                      <td><strong>{job.title}</strong></td>
                      <td>{job.position_type}</td>
                      <td>{job.location}</td>
                      <td>{job.experience_required}</td>
                      <td>{job.salary_range}</td>
                      <td>{job.deadline ? new Date(job.deadline).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button className="btn btn-info" style={{ fontSize: '0.75rem' }} onClick={() => handleEditJob(job)}>Edit</button>
                          <button className="btn btn-danger" style={{ fontSize: '0.75rem' }} onClick={() => handleDeleteJob(job.job_id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Job Pagination */}
            {jobPagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleJobPageChange(jobPagination.currentPage - 1)}
                  disabled={!jobPagination.hasPrev}
                >
                  Previous
                </button>
                <span style={{ margin: '0 1rem', color: '#6b7280' }}>
                  Page {jobPagination.currentPage} of {jobPagination.totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleJobPageChange(jobPagination.currentPage + 1)}
                  disabled={!jobPagination.hasNext}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* Applications Content */}
        {activeTab === 'applications' && (
          <div>
            <table className="table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Applicant</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Experience</th>
                  <th>Expected Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No applications found.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.application_id}>
                      <td><strong>{app.job_title}</strong></td>
                      <td>{app.applicant_name}</td>
                      <td>{app.email}</td>
                      <td>{app.phone || 'N/A'}</td>
                      <td>{app.experience_years || 'N/A'} years</td>
                      <td>{app.expected_salary || 'N/A'}</td>
                      <td>
                        <span className={`badge badge-${app.status === 'pending' ? 'secondary' : app.status === 'reviewed' ? 'info' : app.status === 'interview' ? 'warning' : app.status === 'offered' ? 'success' : 'danger'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <select
                            className="form-input"
                            value={app.status}
                            onChange={(e) => handleUpdateAppStatus(app.application_id, e.target.value)}
                            style={{ fontSize: '0.75rem', padding: '0.25rem' }}
                          >
                            {appStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                          </select>
                          <a href={app.resume_url} target="_blank" rel="noopener noreferrer" className="btn btn-info" style={{ fontSize: '0.75rem' }}>
                            Resume
                          </a>
                          <button className="btn btn-danger" style={{ fontSize: '0.75rem' }} onClick={() => handleDeleteApp(app.application_id)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Application Pagination Controls */}
            {appPagination.totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '2rem', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleAppPageChange(appPagination.currentPage - 1)}
                  disabled={!appPagination.hasPrev}
                >
                  Previous
                </button>

                {/* Numbered page buttons */}
                {Array.from({ length: Math.min(5, appPagination.totalPages) }, (_, i) => {
                  let pageNum;
                  if (appPagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (appPagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (appPagination.currentPage >= appPagination.totalPages - 2) {
                    pageNum = appPagination.totalPages - 4 + i;
                  } else {
                    pageNum = appPagination.currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={`btn ${pageNum === appPagination.currentPage ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => handleAppPageChange(pageNum)}
                      style={{ minWidth: '40px' }}
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  className="btn btn-secondary"
                  onClick={() => handleAppPageChange(appPagination.currentPage + 1)}
                  disabled={!appPagination.hasNext}
                >
                  Next
                </button>

                <span style={{ marginLeft: '1rem', color: '#6b7280' }}>
                  Page {appPagination.currentPage} of {appPagination.totalPages}
                  {' '}({appPagination.totalItems} total applications)
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Job Posting Modal */}
      {showJobModal && (
        <div className="modal-overlay" onClick={handleCloseJobModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <h2>{editingJob ? 'Edit Job Posting' : 'New Job Posting'}</h2>
            {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}
            <form onSubmit={handleJobSubmit}>
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input type="text" className="form-input" value={jobFormData.title} onChange={(e) => setJobFormData({ ...jobFormData, title: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={jobFormData.description} onChange={(e) => setJobFormData({ ...jobFormData, description: e.target.value })} rows="3" />
              </div>

              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-input" value={jobFormData.department_id} onChange={(e) => setJobFormData({ ...jobFormData, department_id: e.target.value })}>
                    <option value="">Select Department</option>
                    {departments.map(dept => <option key={dept.department_id} value={dept.department_id}>{dept.department_name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Position Type</label>
                  <select className="form-input" value={jobFormData.position_type} onChange={(e) => setJobFormData({ ...jobFormData, position_type: e.target.value })}>
                    {positionTypes.map(type => <option key={type} value={type}>{type.replace('-', ' ')}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Experience Required</label>
                  <input type="text" className="form-input" value={jobFormData.experience_required} onChange={(e) => setJobFormData({ ...jobFormData, experience_required: e.target.value })} placeholder="e.g., 2-5 years" />
                </div>

                <div className="form-group">
                  <label className="form-label">Salary Range</label>
                  <input type="text" className="form-input" value={jobFormData.salary_range} onChange={(e) => setJobFormData({ ...jobFormData, salary_range: e.target.value })} placeholder="e.g., $50,000 - $70,000" />
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input type="text" className="form-input" value={jobFormData.location} onChange={(e) => setJobFormData({ ...jobFormData, location: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-input" value={jobFormData.deadline} onChange={(e) => setJobFormData({ ...jobFormData, deadline: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Requirements</label>
                <textarea className="form-input" value={jobFormData.requirements} onChange={(e) => setJobFormData({ ...jobFormData, requirements: e.target.value })} rows="3" />
              </div>

              <div className="form-group">
                <label className="form-label">Responsibilities</label>
                <textarea className="form-input" value={jobFormData.responsibilities} onChange={(e) => setJobFormData({ ...jobFormData, responsibilities: e.target.value })} rows="3" />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">{editingJob ? 'Update' : 'Create'}</button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseJobModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showAppModal && (
        <div className="modal-overlay" onClick={handleCloseAppModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
            <h2>Submit Application</h2>
            {error && <div className="error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f0f9ff', borderRadius: '0.5rem', border: '1px dashed #0ea5e9' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', fontWeight: 600, color: '#0369a1' }}>Auto-fill from Resume</h4>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#0c4a6e' }}>Upload a PDF resume to automatically fill available details.</p>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleResumeParse}
                    style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%', cursor: 'pointer', zIndex: 10 }}
                    disabled={parsingLoading}
                  />
                  <button className="btn btn-info" disabled={parsingLoading} style={{ pointerEvents: 'none' }}>
                    {parsingLoading ? 'Parsing...' : 'Upload PDF'}
                  </button>
                </div>
              </div>
            </div>

            <form onSubmit={handleAppSubmit}>
              <div className="form-group">
                <label className="form-label">Job *</label>
                <select className="form-input" value={appFormData.job_id} onChange={(e) => setAppFormData({ ...appFormData, job_id: e.target.value })} required>
                  <option value="">Select Job</option>
                  {jobs.map(job => <option key={job.job_id} value={job.job_id}>{job.title}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" value={appFormData.applicant_name} onChange={(e) => setAppFormData({ ...appFormData, applicant_name: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" value={appFormData.email} onChange={(e) => setAppFormData({ ...appFormData, email: e.target.value })} required />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="tel" className="form-input" value={appFormData.phone} onChange={(e) => setAppFormData({ ...appFormData, phone: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Experience (years)</label>
                  <input type="number" className="form-input" value={appFormData.experience_years} onChange={(e) => setAppFormData({ ...appFormData, experience_years: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Current Salary</label>
                  <input type="text" className="form-input" value={appFormData.current_salary} onChange={(e) => setAppFormData({ ...appFormData, current_salary: e.target.value })} />
                </div>

                <div className="form-group">
                  <label className="form-label">Expected Salary</label>
                  <input type="text" className="form-input" value={appFormData.expected_salary} onChange={(e) => setAppFormData({ ...appFormData, expected_salary: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Resume URL *</label>
                <input type="url" className="form-input" value={appFormData.resume_url} onChange={(e) => setAppFormData({ ...appFormData, resume_url: e.target.value })} required placeholder="https://example.com/resume.pdf" />
              </div>

              <div className="form-group">
                <label className="form-label">Cover Letter</label>
                <textarea className="form-input" value={appFormData.cover_letter} onChange={(e) => setAppFormData({ ...appFormData, cover_letter: e.target.value })} rows="4" />
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Submit Application</button>
                <button type="button" className="btn btn-secondary" onClick={handleCloseAppModal}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Recruitment;