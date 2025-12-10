import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeService, authService, leaveService, documentService, payrollService, assetService, performanceService, attendanceService, taskService, auditService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import { validatePassword } from '../utils/passwordHelper';
import { FaUser, FaBriefcase, FaCalendarCheck, FaFileAlt, FaLock, FaCamera, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBirthdayCake, FaDownload, FaEye, FaMoneyBillWave, FaLaptop, FaChartLine, FaCheckCircle, FaTimesCircle, FaClock, FaTasks, FaHistory, FaExternalLinkAlt } from 'react-icons/fa';

const Profile = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { settings, getSetting } = useSettings();

  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Dynamic Data States
  const [leaveBalance, setLeaveBalance] = useState([]);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [assets, setAssets] = useState([]);
  const [performanceGoals, setPerformanceGoals] = useState([]);
  const [performanceReviews, setPerformanceReviews] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingTabs, setLoadingTabs] = useState(false);

  // Security Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [twoFASecret, setTwoFASecret] = useState('');
  const [otp, setOtp] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    position: '',
    employment_type: ''
  });

  // Determine if viewing own profile
  const isOwnProfile = !id || (profile && profile.user_id === user.userId);
  const canEdit = isOwnProfile || user.role === 'admin';

  useEffect(() => {
    loadProfile();
  }, [id]);

  // Effect to load tab data when profile changes or tab changes
  useEffect(() => {
    if (profile && profile.employee_id) {
      if (activeTab === 'time_off') loadLeaveData();
      else if (activeTab === 'documents') loadDocuments();
      else if (activeTab === 'payroll') loadPayroll();
      else if (activeTab === 'assets') loadAssets();
      else if (activeTab === 'performance') loadPerformance();
      else if (activeTab === 'attendance') loadAttendance();
      else if (activeTab === 'tasks') loadTasks();
      else if (activeTab === 'audit') loadAuditLogs();
    }
  }, [activeTab, profile]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError('');

      let employeeData = null;
      let userData = null;

      if (id) {
        // Fetch specific employee by ID
        try {
          const response = await employeeService.getById(id);
          employeeData = response.data;
        } catch (e) {
          if (e.response && e.response.status === 404) {
            // Employee not found, maybe just a user?
            // But we don't have user_id from 'id' param easily unless we query users. 
            // For other profiles, we stick to employee requirement.
            throw e;
          }
          throw e;
        }

        if (isOwnProfile) {
          const userRes = await authService.getProfile();
          userData = userRes.data;
        }
      } else {
        // Fetch current user's profile
        // We try to fetch both, but if employee fetch fails (404), we proceed with just user data

        try {
          const userResponse = await authService.getProfile();
          userData = userResponse.data;
        } catch (e) {
          throw new Error('Failed to load user profile');
        }

        try {
          const employeeResponse = await employeeService.getByUserId(user.userId);
          employeeData = employeeResponse.data;
        } catch (e) {
          console.log('No employee record found for this user, proceeding with basic profile.');
          // Ignore 404 for employee record
        }
      }

      if (employeeData || userData) {
        setProfile({
          ...(employeeData || {}),
          // Fallback to user data if employee data missing
          first_name: employeeData?.first_name || 'Admin',
          last_name: employeeData?.last_name || 'User',
          email: employeeData?.email || userData?.email,
          position: employeeData?.position || 'Administrator',
          status: employeeData?.status || 'Active',
          user_id: userData?.user_id || employeeData?.user_id,
          employee_id: employeeData?.employee_id || null, // Might be null
          is_two_factor_enabled: userData ? userData.is_two_factor_enabled : (employeeData?.is_two_factor_enabled || false)
        });

        // Initialize form data only if employee data exists, or with defaults
        if (employeeData) {
          setFormData({
            first_name: employeeData.first_name || '',
            last_name: employeeData.last_name || '',
            phone: employeeData.phone || '',
            date_of_birth: employeeData.date_of_birth ? employeeData.date_of_birth.split('T')[0] : '',
            gender: employeeData.gender || '',
            address: employeeData.address || '',
            position: employeeData.position || '',
            employment_type: employeeData.employment_type || 'full-time'
          });
        }
      } else {
        setError('Profile not found');
      }
    } catch (error) {
      console.error('Profile load error:', error);
      const msg = error.response?.data?.message || error.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaveData = async () => {
    if (!profile?.employee_id) return;
    try {
      setLoadingTabs(true);
      const [balanceRes, historyRes] = await Promise.all([
        leaveService.getBalance(profile.employee_id),
        leaveService.getAll({ employee_id: profile.employee_id })
      ]);
      setLeaveBalance(balanceRes.data || []);
      setLeaveHistory(historyRes.data || []);
    } catch (err) { console.error("Error loading leave data", err); } finally { setLoadingTabs(false); }
  };

  const loadDocuments = async () => {
    if (!profile?.employee_id) return;
    try {
      setLoadingTabs(true);
      const docsRes = await documentService.getAll({ employee_id: profile.employee_id });
      setDocuments(docsRes.data || []);
    } catch (err) { console.error("Error loading documents", err); } finally { setLoadingTabs(false); }
  };

  const loadPayroll = async () => {
    if (!profile?.employee_id) return;
    try {
      setLoadingTabs(true);
      const payrollRes = await payrollService.getAll({ employee_id: profile.employee_id });
      setPayrollHistory(payrollRes.data || []);
    } catch (err) { console.error("Error loading payroll", err); } finally { setLoadingTabs(false); }
  };

  const loadAssets = async () => {
    if (!profile?.employee_id) return;
    try {
      setLoadingTabs(true);
      const assetRes = await assetService.getAll({ employee_id: profile.employee_id });
      setAssets(assetRes.data || []);
    } catch (err) { console.error("Error loading assets", err); } finally { setLoadingTabs(false); }
  };

  const loadPerformance = async () => {
    if (!profile?.employee_id) return;
    try {
      setLoadingTabs(true);
      const [goalsRes, reviewsRes] = await Promise.all([
        performanceService.getGoals({ employee_id: profile.employee_id }),
        performanceService.getReviews({ employee_id: profile.employee_id })
      ]);
      setPerformanceGoals(goalsRes.data || []);
      setPerformanceReviews(reviewsRes.data || []);
    } catch (err) { console.error("Error loading performance", err); } finally { setLoadingTabs(false); }
  };

  const loadAttendance = async () => {
    if (!profile?.employee_id) return;
    try {
      setLoadingTabs(true);
      const res = await attendanceService.getAll({ employee_id: profile.employee_id });
      setAttendanceLogs(res.data || []);
    } catch (err) { console.error("Error loading attendance", err); } finally { setLoadingTabs(false); }
  };

  const loadTasks = async () => {
    if (!profile?.employee_id) return;
    try {
      setLoadingTabs(true);
      const res = await taskService.getAll({ assigned_to: profile.employee_id });
      setEmployeeTasks(res.data || []);
    } catch (err) { console.error("Error loading tasks", err); } finally { setLoadingTabs(false); }
  };

  const loadAuditLogs = async () => {
    if (!profile?.user_id) return;
    try {
      setLoadingTabs(true);
      const res = await auditService.getLogs({ user_id: profile.user_id });
      setAuditLogs(res.data || []);
    } catch (err) { console.error("Error loading audit logs", err); } finally { setLoadingTabs(false); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await employeeService.update(profile.employee_id, formData);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      loadProfile();
    } catch (error) {
      setError('Failed to update profile: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match'); return;
    }
    try {
      await authService.changePassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setError('Failed to change password: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEnable2FA = async () => {
    try {
      const data = await authService.setup2FA();
      setQrCode(data.qrCode);
      setTwoFASecret(data.secret);
      setShow2FAModal(true);
    } catch (error) {
      setError('Failed to setup 2FA');
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    try {
      await authService.verify2FASetup(otp);
      setSuccess('2FA enabled');
      setShow2FAModal(false);
      loadProfile();
    } catch (error) {
      setError('Invalid OTP');
    }
  };

  const handleDisable2FA = async () => {
    if (!window.confirm('Disable 2FA?')) return;
    try {
      await authService.disable2FA();
      setSuccess('2FA disabled');
      loadProfile();
    } catch (e) { setError('Failed to disable 2FA'); }
  };

  if (loading) return <div className="loading">Loading Profile...</div>;

  if (error) {
    return (
      <div className="error-container" style={{ padding: '2rem', textAlign: 'center' }}>
        <div className="alert alert-danger" style={{ marginBottom: '1rem', display: 'inline-block' }}>{error}</div>
        <div style={{ marginTop: '1rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
          {isOwnProfile && <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>If you are an admin, you may need to Create an Employee record for yourself.</p>}
        </div>
      </div>
    );
  }

  if (!profile) return <div className="empty-state"><h3>Profile Not Found</h3></div>;

  const sections = [
    { id: 'personal', label: 'Personal', icon: <FaUser /> },
    { id: 'job', label: 'Job', icon: <FaBriefcase /> },
    { id: 'time_off', label: 'Time Off', icon: <FaCalendarCheck /> },
    { id: 'documents', label: 'Documents', icon: <FaFileAlt /> },
    { id: 'payroll', label: 'Payroll', icon: <FaMoneyBillWave /> },
    { id: 'assets', label: 'Assets', icon: <FaLaptop /> },
    { id: 'performance', label: 'Performance', icon: <FaChartLine /> },
    { id: 'attendance', label: 'Attendance', icon: <FaClock /> },
    { id: 'tasks', label: 'Tasks', icon: <FaTasks /> },
    { id: 'audit', label: 'Audit Log', icon: <FaHistory /> },
  ];

  return (
    <div className="profile-page">
      {/* 1. Header Section */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ height: '100px', background: 'linear-gradient(to right, #8cc63f, #2c3e50)' }}></div>

        <div style={{ padding: '0 2rem 2rem 2rem', display: 'flex', alignItems: 'flex-end', marginTop: '-50px', gap: '2rem', flexWrap: 'wrap' }}>
          <div style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: 'white',
            padding: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '3rem', color: '#aaa', overflow: 'hidden'
            }}>
              {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
            </div>
          </div>

          <div style={{ flex: 1, paddingBottom: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#2c3e50' }}>{profile.first_name} {profile.last_name}</h1>
            <p style={{ margin: '0.25rem 0', fontSize: '1.1rem', color: '#666' }}>{profile.position}</p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
              <span className="badge badge-secondary"><FaEnvelope style={{ marginRight: '5px' }} /> {profile.email}</span>
              {profile.phone && <span className="badge badge-secondary"><FaPhone style={{ marginRight: '5px' }} /> {profile.phone}</span>}
              <span className={`badge badge-${profile.status === 'active' ? 'success' : 'warning'}`}>{profile.status}</span>
            </div>
          </div>

          <div style={{ paddingBottom: '1rem' }}>
            {canEdit && !isEditing && (
              <button className="btn btn-outline" onClick={() => setIsEditing(true)}>Edit Profile</button>
            )}
            {isOwnProfile && (
              <button className="btn btn-secondary" style={{ marginLeft: '0.5rem' }} onClick={() => setShowPasswordModal(true)}>
                <FaLock />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Tabs */}
      <div style={{
        display: 'flex',
        gap: '2rem',
        borderBottom: '1px solid #e0e0e0',
        marginBottom: '2rem',
        padding: '0 1rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap'
      }}>
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            style={{
              padding: '1rem 0',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === section.id ? '3px solid #8cc63f' : '3px solid transparent',
              color: activeTab === section.id ? '#2c3e50' : '#888',
              fontWeight: activeTab === section.id ? '600' : '500',
              cursor: 'pointer',
              fontSize: '1rem',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            {section.icon} {section.label}
          </button>
        ))}
      </div>

      {/* 3. Messages */}
      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* 4. Content */}
      <div className="tab-content" style={{ minHeight: '400px' }}>
        {activeTab === 'personal' && (
          <div className="grid grid-cols-2">
            <div className="card">
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Basic Information</h3>
              {!isEditing ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div><label className="form-label">Full Name</label><div>{profile.first_name} {profile.last_name}</div></div>
                  <div><label className="form-label">Gender</label><div style={{ textTransform: 'capitalize' }}>{profile.gender || '-'}</div></div>
                  <div><label className="form-label">Date of Birth</label><div>{profile.date_of_birth ? formatDate(profile.date_of_birth, getSetting('date_format')) : '-'}</div></div>
                  <div><label className="form-label">Address</label><div>{profile.address || '-'}</div></div>
                </div>
              ) : (
                <form id="edit-form" onSubmit={handleSubmit}>
                  <div className="form-group"><label className="form-label">First Name</label><input className="form-input" name="first_name" value={formData.first_name} onChange={handleChange} /></div>
                  <div className="form-group"><label className="form-label">Last Name</label><input className="form-input" name="last_name" value={formData.last_name} onChange={handleChange} /></div>
                  <div className="form-group"><label className="form-label">Phone</label><input className="form-input" name="phone" value={formData.phone} onChange={handleChange} /></div>
                  <div className="form-group"><label className="form-label">Address</label><input className="form-input" name="address" value={formData.address} onChange={handleChange} /></div>
                </form>
              )}
            </div>
            <div className="card">
              <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Contact Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div><label className="form-label">Work Email</label><div><a href={`mailto:${profile.email}`} style={{ color: '#3498db' }}>{profile.email}</a></div></div>
                <div><label className="form-label">Phone</label><div>{profile.phone || 'No phone number'}</div></div>
              </div>
            </div>
            {isOwnProfile && (
              <div className="card">
                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '0.5rem', marginBottom: '1rem' }}>Account Security</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>Two-Factor Authentication</strong>
                    <p style={{ fontSize: '0.85rem', color: '#666' }}>{profile.is_two_factor_enabled ? 'Enabled' : 'Disabled'}</p>
                  </div>
                  <button className={`btn ${profile.is_two_factor_enabled ? 'btn-danger' : 'btn-primary'}`} onClick={profile.is_two_factor_enabled ? handleDisable2FA : handleEnable2FA}>
                    {profile.is_two_factor_enabled ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'job' && (
          <div className="card">
            <h3 style={{ marginBottom: '1.5rem' }}>Job Information</h3>
            <div className="grid grid-cols-2">
              <div><label className="form-label">Department</label><div><h3>{profile.department_name || 'Unassigned'}</h3></div></div>
              <div><label className="form-label">Position</label><div><h3>{profile.position || 'Unassigned'}</h3></div></div>
              <div><label className="form-label">Employment Status</label><div><span className={`badge badge-${profile.status === 'active' ? 'success' : 'secondary'}`}>{profile.status}</span></div></div>
              <div><label className="form-label">Hire Date</label><div>{profile.hire_date ? formatDate(profile.hire_date, getSetting('date_format')) : '-'}</div></div>
              <div><label className="form-label">Employee ID</label><div>#{profile.employee_id}</div></div>
              {(isOwnProfile || user.role === 'admin') && <div><label className="form-label">Salary</label><div>********</div></div>}
            </div>
          </div>
        )}

        {activeTab === 'time_off' && (
          <div className="grid grid-cols-2">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3>Time Off Balances</h3>
                <button className="btn btn-sm btn-outline" onClick={() => navigate('/leaves')}>Manage Time Off</button>
              </div>
              {loadingTabs ? <p>Loading balances...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {leaveBalance.length > 0 ? leaveBalance.map((bal, idx) => (
                    <div key={idx} style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8cc63f' }}>{bal.available_days}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>{bal.leave_type} Used: {bal.used_days}</div>
                      <div style={{ fontWeight: '600' }}>{bal.leave_type_name}</div>
                    </div>
                  )) : <p>No leave balances found.</p>}
                </div>
              )}
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}>Leave History</h3>
              {loadingTabs ? <p>Loading history...</p> : (
                <div className="table-container">
                  <table className="table">
                    <thead><tr><th>Type</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {leaveHistory.length > 0 ? leaveHistory.slice(0, 5).map(leave => (
                        <tr key={leave.leave_id}>
                          <td>{leave.leave_type}</td>
                          <td><small>{formatDate(leave.start_date, getSetting('date_format'))} - {formatDate(leave.end_date, getSetting('date_format'))}</small></td>
                          <td><span className={`badge badge-${leave.status === 'approved' ? 'success' : leave.status === 'pending' ? 'warning' : 'danger'}`}>{leave.status}</span></td>
                          <td><button className="btn btn-sm btn-outline" onClick={() => navigate('/leaves')}>View</button></td>
                        </tr>
                      )) : <tr><td colSpan="4">No leave history.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3>Documents</h3>
              <button className="btn btn-sm btn-outline" onClick={() => navigate(isOwnProfile ? '/my-documents' : '/documents')}>Manage Documents</button>
            </div>
            {loadingTabs ? <p>Loading documents...</p> : (
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                {documents.length > 0 ? documents.map(doc => (
                  <div key={doc.document_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid #eee', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ fontSize: '1.5rem', color: '#888' }}><FaFileAlt /></div>
                      <div><div style={{ fontWeight: '600' }}>{doc.title}</div><div style={{ fontSize: '0.8rem', color: '#888' }}>{formatDate(doc.created_at, getSetting('date_format'))}</div></div>
                    </div>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline"><FaDownload /></a>
                  </div>
                )) : <p>No documents found.</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'payroll' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3><FaMoneyBillWave /> Payroll History</h3>
              <button className="btn btn-sm btn-outline" onClick={() => navigate(user.role === 'employee' ? '/my-payslips' : '/payroll')}>Go to Payroll</button>
            </div>
            {loadingTabs ? <p>Loading payroll...</p> : (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Pay Period</th><th>Net Salary</th><th>Pay Date</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>
                    {payrollHistory.length > 0 ? payrollHistory.map(pay => (
                      <tr key={pay.id}>
                        <td>{pay.pay_period_start} - {pay.pay_period_end}</td>
                        <td>{settings.currency || '$'}{pay.net_salary}</td>
                        <td>{formatDate(pay.payment_date, getSetting('date_format'))}</td>
                        <td><span className={`badge badge-${pay.status === 'paid' ? 'success' : 'warning'}`}>{pay.status}</span></td>
                        <td><button className="btn btn-sm btn-info" onClick={() => navigate(user.role === 'employee' ? '/my-payslips' : '/payroll')}><FaEye /> View</button></td>
                      </tr>
                    )) : <tr><td colSpan="5">No payroll records found.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3><FaLaptop /> Assigned Assets</h3>
              <button className="btn btn-sm btn-outline" onClick={() => navigate('/assets')}>Manage Assets</button>
            </div>
            {loadingTabs ? <p>Loading assets...</p> : (
              <div className="grid grid-cols-2" style={{ gap: '1rem' }}>
                {assets.length > 0 ? assets.map(asset => (
                  <div key={asset.asset_id}
                    style={{ padding: '1rem', border: '1px solid #eee', borderRadius: '8px', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => navigate('/assets')}
                  >
                    <div style={{ fontSize: '2rem', color: '#110fa3' }}><FaLaptop /></div>
                    <div>
                      <div style={{ fontWeight: '600' }}>{asset.asset_name}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>SN: {asset.serial_number}</div>
                      <span className={`badge badge-info`}>{asset.status}</span>
                    </div>
                  </div>
                )) : <p>No assets assigned.</p>}
              </div>
            )}
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="grid grid-cols-2">
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3><FaChartLine /> Performance Goals</h3>
                <button className="btn btn-sm btn-outline" onClick={() => navigate('/performance')}>View All Goals</button>
              </div>
              {loadingTabs ? <p>Loading goals...</p> : (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {performanceGoals.length > 0 ? performanceGoals.map(goal => (
                    <li key={goal.goal_id}
                      style={{ padding: '1rem', borderBottom: '1px solid #eee', cursor: 'pointer' }}
                      onClick={() => navigate('/performance')}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}><strong>{goal.title}</strong><span className={`badge badge-${goal.status === 'completed' ? 'success' : 'primary'}`}>{goal.status}</span></div>
                      <p style={{ margin: '0.5rem 0', fontSize: '0.9rem', color: '#666' }}>{goal.description}</p>
                    </li>
                  )) : <p>No active goals.</p>}
                </ul>
              )}
            </div>
            <div className="card">
              <h3 style={{ marginBottom: '1.5rem' }}><FaCheckCircle /> Recent Reviews</h3>
              {loadingTabs ? <p>Loading reviews...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {performanceReviews.length > 0 ? performanceReviews.map(review => (
                    <div key={review.review_id}
                      style={{ padding: '1rem', background: '#f8f9fa', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s', border: '1px solid transparent' }}
                      onClick={() => navigate(`/performance/review/${review.review_id}`)}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = '#8cc63f'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                        {review.review_period}
                        <FaExternalLinkAlt style={{ fontSize: '0.8rem', color: '#888' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}><span>Rating: {review.rating}/5</span><span className="badge badge-success">{review.status}</span></div>
                    </div>
                  )) : <p>No reviews found.</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3><FaClock /> Attendance</h3>
              <button className="btn btn-sm btn-outline" onClick={() => navigate('/attendance')}>View Full Log</button>
            </div>
            {loadingTabs ? <p>Loading attendance...</p> : (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Date</th><th>Clock In</th><th>Clock Out</th><th>Hours</th><th>Status</th></tr></thead>
                  <tbody>
                    {attendanceLogs.length > 0 ? attendanceLogs.map((log, i) => (
                      <tr key={i}>
                        <td>{formatDate(log.date || log.created_at, getSetting('date_format'))}</td>
                        <td>{log.clock_in ? new Date(log.clock_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td>{log.clock_out ? new Date(log.clock_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                        <td>{log.total_hours ? parseFloat(log.total_hours).toFixed(2) : '-'}</td>
                        <td><span className={`badge badge-${log.status === 'present' ? 'success' : 'secondary'}`}>{log.status || 'Present'}</span></td>
                      </tr>
                    )) : <tr><td colSpan="5">No attendance records.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3><FaTasks /> Assigned Tasks</h3>
              <button className="btn btn-sm btn-outline" onClick={() => navigate('/tasks')}>Go to Tasks</button>
            </div>
            {loadingTabs ? <p>Loading tasks...</p> : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {employeeTasks.length > 0 ? employeeTasks.map(task => (
                  <li key={task.task_id}
                    style={{ padding: '1rem', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => navigate('/tasks')}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{task.title}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>Due: {formatDate(task.due_date, getSetting('date_format'))}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge badge-${task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'info' : 'warning'}`}>{task.status.replace('_', ' ')}</span>
                      <FaExternalLinkAlt style={{ color: '#888', fontSize: '0.8rem' }} />
                    </div>
                  </li>
                )) : <p>No tasks assigned.</p>}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3><FaHistory /> Activity Log</h3>
              <button className="btn btn-sm btn-outline" onClick={() => navigate('/audit-logs')}>Full Audit Log</button>
            </div>
            {loadingTabs ? <p>Loading logs...</p> : (
              <div className="table-container">
                <table className="table">
                  <thead><tr><th>Action</th><th>Target</th><th>IP Address</th><th>Time</th></tr></thead>
                  <tbody>
                    {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                      <tr key={i}>
                        <td>{log.action}</td>
                        <td>{log.target || '-'}</td>
                        <td>{log.ip_address}</td>
                        <td>{new Date(log.created_at).toLocaleString()}</td>
                      </tr>
                    )) : <tr><td colSpan="4">No activity records.</td></tr>}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white', padding: '1rem', borderTop: '1px solid #ddd', zIndex: 100, display: 'flex', justifyContent: 'flex-end', gap: '1rem', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
          <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
          <button className="btn btn-success" onClick={handleSubmit} style={{ backgroundColor: 'var(--success-color)', color: 'white' }}>Save Changes</button>
        </div>
      )}

      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Change Password</h2>
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input type="password" className="form-input" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input type="password" className="form-input" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="submit" className="btn btn-primary">Change Password</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {show2FAModal && (
        <div className="modal-overlay" onClick={() => setShow2FAModal(false)}>
          <div className="modal" style={{ textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <h2>Enable 2FA</h2>
            <p>Scan with Authenticator App</p>
            <img src={qrCode} alt="QR" style={{ margin: '1rem 0' }} />
            <p><small>{twoFASecret}</small></p>
            <form onSubmit={handleVerify2FA}>
              <input className="form-input" placeholder="Enter Code" value={otp} onChange={e => setOtp(e.target.value)} style={{ marginBottom: '1rem', textAlign: 'center', fontSize: '1.2rem', letterSpacing: '5px' }} />
              <button className="btn btn-primary">Verify</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
