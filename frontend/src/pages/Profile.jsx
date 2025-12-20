import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeeService, authService, leaveService, documentService, payrollService, assetService, performanceService, attendanceService, taskService, auditService, uploadService, departmentService } from '../services';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { formatDate } from '../utils/settingsHelper';
import { validatePassword } from '../utils/passwordHelper';
import { FaUser, FaBriefcase, FaCalendarCheck, FaFileAlt, FaLock, FaCamera, FaEnvelope, FaPhone, FaMapMarkerAlt, FaBirthdayCake, FaDownload, FaEye, FaMoneyBillWave, FaLaptop, FaChartLine, FaCheckCircle, FaTimesCircle, FaClock, FaTasks, FaHistory, FaExternalLinkAlt, FaGraduationCap, FaLinkedin, FaTwitter, FaGithub, FaUserTie, FaIdCard, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

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
  const [employeeTasks, setEmployeeTasks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const cleanBaseUrl = baseUrl.replace('/api', '');
    return `${cleanBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loadingTabs, setLoadingTabs] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Security & UI Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showIDCard, setShowIDCard] = useState(false);
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
  const [idCardQrCode, setIdCardQrCode] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    address: '',
    position: '',
    employment_type: '',
    department_id: '',
    reporting_manager_id: '',
    salary: '',
    status: ''
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

  // ID Card QR Code Fetcher
  useEffect(() => {
    const fetchIDCardQRCode = async () => {
      if (showIDCard && !idCardQrCode && profile?.employee_id) {
        try {
          const res = await employeeService.getQRCode(profile.employee_id);
          if (res.success) {
            setIdCardQrCode(res.qrCodeUrl);
          }
        } catch (error) {
          console.error('Failed to fetch ID card QR code:', error);
        }
      }
    };
    fetchIDCardQRCode();
  }, [showIDCard, profile, idCardQrCode]);

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
            employment_type: employeeData.employment_type || 'full-time',
            department_id: employeeData.department_id || '',
            reporting_manager_id: employeeData.reporting_manager_id || '',
            salary: employeeData.salary || '',
            status: employeeData.status || 'active'
          });
        }

        // Load departments and managers if admin
        if (user.role === 'admin') {
          try {
            const [deptRes, empRes] = await Promise.all([
              departmentService.getAll(),
              employeeService.getAll({ limit: 1000 })
            ]);
            setDepartments(deptRes.data || []);
            setManagers(empRes.data || []);
          } catch (e) {
            console.error('Failed to load aux data:', e);
          }
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

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await uploadService.uploadFile(formData);
      const photoUrl = uploadRes.url || uploadRes.data?.url || uploadRes.path; // Adjust based on API response

      if (!photoUrl) throw new Error('Failed to get upload URL');

      await employeeService.updatePartial(profile.employee_id, { profile_image: photoUrl });

      setSuccess('Profile picture updated successfully!');
      loadProfile(); // Reload to show new photo
    } catch (err) {
      console.error('Photo upload error:', err);
      setError('Failed to upload photo: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingPhoto(false);
    }
  };

  if (loading && !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="p-8 text-center">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg inline-block">{error}</div>
        <div className="mt-4">
          <button className="btn btn-secondary" onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  if (!profile) return <div className="text-center p-8 text-gray-500"><h3>Profile Not Found</h3></div>;

  const sections = [
    { id: 'personal', label: 'Personal', icon: <FaUser /> },
    { id: 'job', label: 'Job', icon: <FaBriefcase /> },
    { id: 'background', label: 'Background', icon: <FaGraduationCap /> },
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
    <div className="page-container">

      {/* 1. Header Section */}
      <div className="card mb-6 overflow-hidden">
        <div className="h-40 bg-primary-600 relative">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        </div>

        <div className="px-8 pb-8 flex flex-col md:flex-row items-end -mt-16 gap-6 relative z-10">
          <div className="relative w-32 h-32 md:w-40 md:h-40">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white shadow-md bg-white p-1 overflow-hidden">
              <div className="w-full h-full rounded-full bg-neutral-100 flex items-center justify-center overflow-hidden relative">
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
                {profile.profile_image ? (
                  <img src={getProfilePicture(profile.profile_image)} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-neutral-300">
                    {profile.first_name?.charAt(0)}{profile.last_name?.charAt(0)}
                  </span>
                )}
              </div>
            </div>
            {canEdit && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
                <button
                  className="absolute bottom-1 right-1 bg-primary-600 text-white p-2.5 rounded-full shadow-lg border-2 border-white hover:bg-primary-700 transition-all z-20"
                  title="Update Profile Photo"
                  disabled={uploadingPhoto}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaCamera size={16} />
                </button>
              </>
            )}
          </div>

          <div className="flex-1 pb-2 text-center md:text-left">
            <h1 className="text-3xl font-bold text-neutral-900 mb-1">{profile.first_name} {profile.last_name}</h1>
            <p className="text-lg text-neutral-500 font-medium mb-3">{profile.position || 'Employee'}</p>

            <div className="flex flex-wrap gap-2 justify-center md:justify-start">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
                <FaEnvelope size={10} /> {profile.email}
              </span>
              {profile.phone && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700">
                  <FaPhone size={10} /> {profile.phone}
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${profile.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'}`}>
                <span className={`w-2 h-2 rounded-full ${profile.status === 'active' ? 'bg-success-500' : 'bg-warning-500'}`}></span>
                {profile.status}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pb-4">
            <button className="btn btn-secondary" onClick={() => setShowIDCard(true)}>
              <FaIdCard /> <span>ID Card</span>
            </button>
            {canEdit && !isEditing && (
              <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                <FaEdit /> <span>Edit Profile</span>
              </button>
            )}
            {isOwnProfile && (
              <button className="btn btn-secondary" onClick={() => setShowPasswordModal(true)} title="Security Settings">
                <FaLock />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Content Area with Sidebar */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="card p-2 sticky top-4">
            <nav className="flex flex-col space-y-1">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveTab(section.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === section.id
                    ? 'bg-primary-50 text-primary-600 shadow-sm'
                    : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
                    }`}
                >
                  <span className={`text-lg ${activeTab === section.id ? 'text-primary-600' : 'text-neutral-400'}`}>
                    {section.icon}
                  </span>
                  {section.label}
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          {/* Messages */}
          {error && <div className="mb-6 p-4 rounded-lg bg-danger-50 text-danger border border-danger-50 flex items-center gap-3"><FaTimesCircle /> {error}</div>}
          {success && <div className="mb-6 p-4 rounded-lg bg-success-50 text-success border border-success-50 flex items-center gap-3"><FaCheckCircle /> {success}</div>}

          {/* 4. Content */}
          <div className="min-h-[400px]">
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="card md:col-span-2">
                  <div className="card-header">
                    <h3 className="card-title">Basic Information</h3>
                  </div>
                  <div className="p-6">
                    {!isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div>
                          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Full Name</label>
                          <div className="text-neutral-900 font-medium">{profile.first_name} {profile.last_name}</div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Gender</label>
                          <div className="text-neutral-900 font-medium capitalize">{profile.gender || '-'}</div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Date of Birth</label>
                          <div className="text-neutral-900 font-medium">{profile.date_of_birth ? formatDate(profile.date_of_birth, getSetting('date_format')) : '-'}</div>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Address</label>
                          <div className="text-neutral-900 font-medium">{profile.address || '-'}</div>
                        </div>
                        {profile.about_me && (
                          <div className="md:col-span-2 mt-2">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1 block">About Me</label>
                            <p className="text-gray-700 leading-relaxed">{profile.about_me}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <form id="edit-form" onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="form-group">
                          <label className="form-label">First Name</label>
                          <input className="form-input" name="first_name" value={formData.first_name} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Last Name</label>
                          <input className="form-input" name="last_name" value={formData.last_name} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Phone</label>
                          <input className="form-input" name="phone" value={formData.phone} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Address</label>
                          <input className="form-input" name="address" value={formData.address} onChange={handleChange} />
                        </div>
                        {user.role === 'admin' && (
                          <>
                            <div className="form-group">
                              <label className="form-label">Department</label>
                              <select className="form-input" name="department_id" value={formData.department_id} onChange={handleChange}>
                                <option value="">Select Department</option>
                                {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.department_name}</option>)}
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Position</label>
                              <input className="form-input" name="position" value={formData.position} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Reporting Manager</label>
                              <select className="form-input" name="reporting_manager_id" value={formData.reporting_manager_id} onChange={handleChange}>
                                <option value="">None</option>
                                {managers.filter(m => m.employee_id !== profile.employee_id).map(m => (
                                  <option key={m.employee_id} value={m.employee_id}>{m.first_name} {m.last_name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Salary</label>
                              <input className="form-input" type="number" name="salary" value={formData.salary} onChange={handleChange} />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Employment Type</label>
                              <select className="form-input" name="employment_type" value={formData.employment_type} onChange={handleChange}>
                                <option value="full-time">Full-time</option>
                                <option value="part-time">Part-time</option>
                                <option value="contract">Contract</option>
                                <option value="intern">Intern</option>
                              </select>
                            </div>
                            <div className="form-group">
                              <label className="form-label">Status</label>
                              <select className="form-input" name="status" value={formData.status} onChange={handleChange}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="terminated">Terminated</option>
                              </select>
                            </div>
                          </>
                        )}
                      </form>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Contact Info</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Work Email</label>
                        <a href={`mailto:${profile.email}`} className="text-primary-600 hover:text-primary-800 font-medium">{profile.email}</a>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Phone</label>
                        <div className="text-neutral-900 font-medium">{profile.phone || 'No phone number'}</div>
                      </div>
                      {profile.social_links && Object.keys(profile.social_links).length > 0 && (
                        <div className="pt-4 border-t border-gray-100">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">Social Profiles</label>
                          <div className="flex gap-4">
                            {profile.social_links.linkedin && (
                              <a href={profile.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-700 hover:text-blue-900 transition-colors" title="LinkedIn"><FaLinkedin size={20} /></a>
                            )}
                            {profile.social_links.twitter && (
                              <a href={profile.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-600 transition-colors" title="Twitter"><FaTwitter size={20} /></a>
                            )}
                            {profile.social_links.github && (
                              <a href={profile.social_links.github} target="_blank" rel="noopener noreferrer" className="text-gray-800 hover:text-black transition-colors" title="GitHub"><FaGithub size={20} /></a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {isOwnProfile && (
                    <div className="card">
                      <div className="card-header flex justify-between items-center">
                        <h3 className="card-title flex items-center gap-2"><FaLock className="text-gray-400" /> Security</h3>
                      </div>
                      <div className="p-6">
                        <div className="flex justify-between items-center bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                          <div>
                            <div className="font-semibold text-neutral-900 text-sm">Two-Factor Auth</div>
                            <p className="text-xs text-neutral-500 mt-0.5">{profile.is_two_factor_enabled ? 'Enabled' : 'Disabled'}</p>
                          </div>
                          <button
                            className={`text-xs px-3 py-1.5 rounded-md font-medium transition-colors ${profile.is_two_factor_enabled
                              ? 'bg-danger-50 text-danger hover:bg-danger-100'
                              : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                              }`}
                            onClick={profile.is_two_factor_enabled ? handleDisable2FA : handleEnable2FA}
                          >
                            {profile.is_two_factor_enabled ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'job' && (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Job Information</h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Department</label>
                    <div className="text-neutral-900 font-medium">{profile.department_name || 'Unassigned'}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Position</label>
                    <div className="text-neutral-900 font-medium">{profile.position || 'Unassigned'}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Reporting Manager</label>
                    <div className="flex items-center gap-2">
                      {profile.manager_first_name ? (
                        <>
                          <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs">
                            <FaUserTie />
                          </div>
                          <span className="font-medium text-neutral-900">{profile.manager_first_name} {profile.manager_last_name}</span>
                        </>
                      ) : <span className="text-neutral-400 italic">None (Top Level)</span>}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Employment Status</label>
                    <span className={`badge badge-${profile.status === 'active' ? 'success' : 'neutral'}`}>
                      {profile.status}
                    </span>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Hire Date</label>
                    <div className="text-neutral-900 font-medium">{profile.hire_date ? formatDate(profile.hire_date, getSetting('date_format')) : '-'}</div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Employee ID</label>
                    <div className="text-neutral-900 font-medium font-mono">#{profile.employee_id}</div>
                  </div>
                  {(isOwnProfile || user.role === 'admin') && (
                    <div>
                      <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-1 block">Salary</label>
                      <div className="text-neutral-900 font-medium blur-sm hover:blur-none transition-all cursor-default">********</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'background' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title flex items-center gap-2"><FaGraduationCap className="text-primary-600" /> Education</h3>
                  </div>
                  <div className="p-6">
                    {profile.education && profile.education.length > 0 ? (
                      <ul className="space-y-6 relative border-l-2 border-neutral-100 ml-3 pl-6">
                        {profile.education.map((edu, idx) => (
                          <li key={idx} className="relative">
                            <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary-400"></span>
                            <div className="font-bold text-neutral-900 text-lg">{edu.degree}</div>
                            <div className="text-neutral-600 font-medium">{edu.school}</div>
                            <div className="text-sm text-neutral-400 mt-1">{edu.year}</div>
                          </li>
                        ))}
                      </ul>
                    ) : <div className="text-neutral-400 italic text-center py-4">No education history added.</div>}
                  </div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title flex items-center gap-2"><FaBriefcase className="text-primary-600" /> Experience</h3>
                  </div>
                  <div className="p-6">
                    {profile.experience && profile.experience.length > 0 ? (
                      <ul className="space-y-6 relative border-l-2 border-neutral-100 ml-3 pl-6">
                        {profile.experience.map((exp, idx) => (
                          <li key={idx} className="relative">
                            <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-white border-2 border-primary-400"></span>
                            <div className="font-bold text-neutral-900 text-lg">{exp.title}</div>
                            <div className="text-neutral-600 font-medium">{exp.company}</div>
                            <div className="text-sm text-neutral-400 mt-1">{exp.duration}</div>
                          </li>
                        ))}
                      </ul>
                    ) : <div className="text-neutral-400 italic text-center py-4">No previous experience added.</div>}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'time_off' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card md:col-span-1">
                  <div className="card-header flex justify-between items-center">
                    <h3 className="card-title">Balances</h3>
                    <button className="text-primary-600 hover:text-primary-800 text-sm font-medium" onClick={() => navigate('/leaves')}>Manage</button>
                  </div>
                  <div className="p-4">
                    {loadingTabs ? <div className="text-center py-4 text-neutral-400">Loading balances...</div> : (
                      <div className="space-y-3">
                        {leaveBalance.length > 0 ? leaveBalance.map((bal, idx) => (
                          <div key={idx} className="bg-neutral-50 p-4 rounded-lg flex items-center justify-between border border-neutral-100">
                            <div>
                              <div className="font-semibold text-neutral-700">{bal.leave_type_name}</div>
                              <div className="text-xs text-neutral-500">Used: {bal.used_days}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-neutral-900">{bal.available_days}</div>
                              <div className="text-xs text-neutral-400 uppercase font-semibold">Days</div>
                            </div>
                          </div>
                        )) : <div className="text-neutral-400 text-center">No balances found.</div>}
                      </div>
                    )}
                  </div>
                </div>
                <div className="card md:col-span-2">
                  <div className="card-header">
                    <h3 className="card-title">Leave History</h3>
                  </div>
                  <div className="p-0 table-responsive">
                    {loadingTabs ? <div className="p-4 text-center text-neutral-400">Loading history...</div> : (
                      <table className="table w-full">
                        <thead><tr><th>Type</th><th>Dates</th><th>Status</th><th className="text-right">Action</th></tr></thead>
                        <tbody>
                          {leaveHistory.length > 0 ? leaveHistory.slice(0, 5).map(leave => (
                            <tr key={leave.leave_id}>
                              <td className="font-medium text-neutral-900">{leave.leave_type}</td>
                              <td className="text-neutral-600 text-sm">{formatDate(leave.start_date, getSetting('date_format'))} - {formatDate(leave.end_date, getSetting('date_format'))}</td>
                              <td>
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${leave.status === 'approved' ? 'bg-success-100 text-success-700' :
                                  leave.status === 'pending' ? 'bg-warning-100 text-warning-700' : 'bg-danger-100 text-danger-700'
                                  }`}>
                                  {leave.status}
                                </span>
                              </td>
                              <td className="text-right">
                                <button className="text-primary-600 hover:text-primary-800 text-sm font-medium" onClick={() => navigate('/leaves')}>View</button>
                              </td>
                            </tr>
                          )) : <tr><td colSpan="4" className="text-center py-4 text-neutral-500">No leave history.</td></tr>}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Similar patterns for other tabs... */}
            {activeTab === 'documents' && (
              <div className="card">
                <div className="card-header flex justify-between items-center">
                  <h3 className="card-title">Documents</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(isOwnProfile ? '/my-documents' : '/documents')}>Manage Documents</button>
                </div>
                <div className="p-6">
                  {loadingTabs ? <div className="text-center text-neutral-400">Loading documents...</div> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {documents.length > 0 ? documents.map(doc => (
                        <div key={doc.document_id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center flex-shrink-0">
                              <FaFileAlt />
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-neutral-900 truncate">{doc.title}</div>
                              <div className="text-xs text-neutral-500">{formatDate(doc.created_at, getSetting('date_format'))}</div>
                            </div>
                          </div>
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-primary-600 transition-colors p-2">
                            <FaDownload />
                          </a>
                        </div>
                      )) : <div className="col-span-full text-center py-8 text-neutral-400 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">No documents found.</div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'payroll' && (
              <div className="card">
                <div className="card-header flex justify-between items-center">
                  <h3 className="card-title flex items-center gap-2"><FaMoneyBillWave className="text-success-600" /> Payroll History</h3>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(user.role === 'employee' ? '/my-payslips' : '/payroll')}>Go to Payroll</button>
                </div>
                <div className="p-0 table-responsive">
                  {loadingTabs ? <div className="p-4 text-center text-neutral-400">Loading payroll...</div> : (
                    <table className="table w-full">
                      <thead><tr><th>Pay Period</th><th>Net Salary</th><th>Pay Date</th><th>Status</th><th className="text-right">Action</th></tr></thead>
                      <tbody>
                        {payrollHistory.length > 0 ? payrollHistory.map(pay => (
                          <tr key={pay.id}>
                            <td className="font-medium text-neutral-900">{pay.pay_period_start} - {pay.pay_period_end}</td>
                            <td className="text-neutral-700 font-mono">{settings.currency || '$'}{pay.net_salary}</td>
                            <td className="text-neutral-500">{formatDate(pay.payment_date, getSetting('date_format'))}</td>
                            <td>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${pay.status === 'paid' ? 'bg-success-100 text-success-700' : 'bg-warning-100 text-warning-700'
                                }`}>{pay.status}</span>
                            </td>
                            <td className="text-right">
                              <button className="text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded text-sm font-medium transition-colors" onClick={() => navigate(user.role === 'employee' ? '/my-payslips' : '/payroll')}>View</button>
                            </td>
                          </tr>
                        )) : <tr><td colSpan="5" className="text-center py-8 text-neutral-500">No payroll records found.</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'assets' && (
              <div className="card">
                <div className="card-header flex justify-between items-center">
                  <h3 className="card-title flex items-center gap-2"><FaLaptop className="text-primary-500" /> Assigned Assets</h3>
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate('/assets')}>Manage Assets</button>
                </div>
                <div className="p-6">
                  {loadingTabs ? <div className="text-center text-neutral-400">Loading assets...</div> : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {assets.length > 0 ? assets.map(asset => (
                        <div key={asset.asset_id}
                          className="group p-5 border border-neutral-200 rounded-xl hover:shadow-md transition-all cursor-pointer bg-white"
                          onClick={() => navigate('/assets')}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="w-12 h-12 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center text-xl group-hover:bg-primary-600 group-hover:text-white transition-colors">
                              <FaLaptop />
                            </div>
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-info-50 text-info-700">{asset.status}</span>
                          </div>
                          <h4 className="font-bold text-neutral-900 mb-1">{asset.asset_name}</h4>
                          <p className="text-sm text-neutral-500 font-mono">SN: {asset.serial_number}</p>
                        </div>
                      )) : <div className="col-span-full text-center py-8 text-neutral-400 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">No assets assigned.</div>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="card">
                <div className="card-header flex justify-between items-center">
                  <h3 className="card-title flex items-center gap-2"><FaChartLine className="text-warning-600" /> Performance Reviews</h3>
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate('/performance')}>Go to Performance</button>
                </div>
                <div className="p-0 table-responsive">
                  {loadingTabs ? <div className="p-4 text-center text-neutral-400">Loading reviews...</div> : (
                    <table className="data-table w-full">
                      <thead><tr><th>Cycle</th><th>Review Date</th><th>Rating</th><th>Status</th><th className="text-right">Action</th></tr></thead>
                      <tbody>
                        {performanceReviews.length > 0 ? performanceReviews.map(review => (
                          <tr key={review.review_id}>
                            <td className="font-medium text-neutral-900">{review.review_cycle}</td>
                            <td className="text-neutral-500">{formatDate(review.review_date, getSetting('date_format'))}</td>
                            <td>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-neutral-900">{review.rating}</span>
                                <span className="text-xs text-neutral-400">/ 5</span>
                              </div>
                            </td>
                            <td>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${review.status === 'completed' ? 'bg-success-100 text-success-700' : 'bg-primary-100 text-primary-700'
                                }`}>{review.status}</span>
                            </td>
                            <td className="text-right">
                              <button className="text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-3 py-1 rounded text-sm font-medium transition-colors" onClick={() => navigate('/performance')}>View</button>
                            </td>
                          </tr>
                        )) : <tr><td colSpan="5" className="text-center py-8 text-neutral-500">No performance reviews found.</td></tr>}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'attendance' && (
              <div className="card">
                <div className="card-header flex justify-between items-center">
                  <h3 className="card-title flex items-center gap-2"><FaClock className="text-info-600" /> Recent Attendance</h3>
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate('/attendance')}>View Attendance</button>
                </div>
                <div className="p-0 table-responsive">
                  <table className="data-table w-full">
                    <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Status</th></tr></thead>
                    <tbody>
                      {attendanceLogs.length > 0 ? attendanceLogs.slice(0, 10).map((log, idx) => (
                        <tr key={idx}>
                          <td className="font-medium">{formatDate(log.date, getSetting('date_format'))}</td>
                          <td>{log.check_in || '--:--'}</td>
                          <td>{log.check_out || '--:--'}</td>
                          <td>
                            <span className={`badge badge-${log.status === 'present' ? 'success' : log.status === 'absent' ? 'danger' : 'warning'}`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      )) : <tr><td colSpan="4" className="text-center py-8 text-neutral-500 italic">No attendance records found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'tasks' && (
              <div className="card">
                <div className="card-header flex justify-between items-center">
                  <h3 className="card-title flex items-center gap-2"><FaTasks className="text-danger-600" /> Assigned Tasks</h3>
                  <button className="btn btn-sm btn-secondary" onClick={() => navigate('/tasks')}>Go to Tasks</button>
                </div>
                <div className="p-0 table-responsive">
                  <table className="data-table w-full">
                    <thead><tr><th>Title</th><th>Priority</th><th>Due Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {employeeTasks.length > 0 ? employeeTasks.map(task => (
                        <tr key={task.task_id}>
                          <td className="font-medium">{task.title}</td>
                          <td>
                            <span className={`badge badge-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'info'}`}>
                              {task.priority}
                            </span>
                          </td>
                          <td className="text-neutral-500">{formatDate(task.due_date, getSetting('date_format'))}</td>
                          <td>
                            <span className={`badge badge-${task.status === 'completed' ? 'success' : 'primary'}`}>
                              {task.status}
                            </span>
                          </td>
                        </tr>
                      )) : <tr><td colSpan="4" className="text-center py-8 text-neutral-500 italic">No assigned tasks found.</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'audit' && (
              <div className="card">
                <div className="card-header flex justify-between items-center">
                  <h3 className="card-title flex items-center gap-2"><FaHistory className="text-neutral-500" /> Activity Log</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-4 pb-4 border-b border-neutral-100 last:border-0 last:pb-0">
                        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 shrink-0">
                          <FaHistory size={14} />
                        </div>
                        <div>
                          <p className="text-sm text-neutral-800"><span className="font-semibold">Profile Updated:</span> Personal details were modified.</p>
                          <p className="text-xs text-neutral-400 mt-1">{new Date().toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {isEditing && (
            <div className="fixed bottom-0 left-0 right-0 bg-white p-4 border-t border-gray-200 z-50 flex justify-end gap-3 shadow-lg">
              <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Save Changes</button>
            </div>
          )}

          {showPasswordModal && (
            <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Change Password</h2>
                  <button onClick={() => setShowPasswordModal(false)} className="modal-close"><FaTimes /></button>
                </div>
                <form onSubmit={handlePasswordChange}>
                  <div className="modal-body space-y-4">
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input type="password" name="currentPassword" className="form-input" value={passwordData.currentPassword} onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input type="password" name="newPassword" className="form-input" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input type="password" name="confirmPassword" className="form-input" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} required />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowPasswordModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Change Password</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {show2FAModal && (
            <div className="modal-overlay" onClick={() => setShow2FAModal(false)}>
              <div className="modal modal-sm text-center" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Enable 2FA</h2>
                  <button onClick={() => setShow2FAModal(false)} className="modal-close"><FaTimes /></button>
                </div>
                <div className="modal-body">
                  <p className="text-sm text-neutral-500 mb-4">Scan this QR code with your Authenticator App</p>
                  <div className="bg-white p-2 inline-block border border-neutral-100 rounded-lg mb-4">
                    <img src={qrCode} alt="QR" className="w-48 h-48 object-contain" />
                  </div>
                  <p className="font-mono text-xs text-neutral-400 bg-neutral-50 p-2 rounded mb-6 select-all">{twoFASecret}</p>
                  <form onSubmit={handleVerify2FA}>
                    <input
                      className="form-input text-center text-xl tracking-[0.5em] font-mono mb-4"
                      placeholder="000000"
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value)}
                    />
                    <button className="btn btn-primary w-full">Verify & Enable</button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Digital ID Card Modal */}
          {showIDCard && (
            <div className="modal-overlay" onClick={() => setShowIDCard(false)}>
              <div className="modal modal-sm" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h2 className="modal-title">Employee ID Card</h2>
                  <button onClick={() => setShowIDCard(false)} className="modal-close">
                    <FaTimes />
                  </button>
                </div>

                <div className="modal-body p-0 overflow-hidden bg-neutral-100">
                  {/* Premium ID Card Design */}
                  <div className="relative w-full overflow-hidden bg-white shadow-2xl rounded-b-xl print:shadow-none">
                    {/* Top Banner */}
                    <div className="h-32 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 relative overflow-hidden">
                      {/* Abstract Shapes */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-10 -mb-10 blur-lg"></div>
                      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                      {/* Company Logo/Name */}
                      <div className="absolute top-6 left-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-bold text-xl border border-white/30 shadow-lg">
                          K
                        </div>
                        <div>
                          <h1 className="text-white font-bold text-lg tracking-wider ">KEKA CORP</h1>
                          <p className="text-primary-100 text-xs uppercase tracking-widest font-medium">Official ID Card</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-8 pb-8 -mt-16 relative z-10">
                      {/* Profile Photo */}
                      <div className="flex justify-center mb-6">
                        <div className="relative">
                          <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl bg-neutral-200 overflow-hidden">
                            {profile.profile_image ? (
                              <img src={getProfilePicture(profile.profile_image)} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-4xl font-bold">
                                {profile.first_name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          {/* Status Indicator */}
                          <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white ${profile.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                      </div>

                      {/* Personal Info */}
                      <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-neutral-800 mb-1">{profile.first_name} {profile.last_name}</h2>
                        <div className="inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold tracking-wide border border-primary-100">
                          {profile.position || 'Employee'}
                        </div>
                      </div>

                      {/* Details Grid */}
                      <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 mb-6">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                          <div className="text-left">
                            <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">ID Number</p>
                            <p className="font-mono text-neutral-800 font-bold text-sm tracking-wide">#{profile.employee_id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">Joined Date</p>
                            <p className="text-neutral-800 font-semibold text-sm">{profile.hire_date ? new Date(profile.hire_date).toLocaleDateString() : 'N/A'}</p>
                          </div>
                          <div className="text-left">
                            <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">Department</p>
                            <p className="text-neutral-800 font-semibold text-sm truncate">{profile.department_name && profile.department_name.split(' ')[0] || 'General'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">Blood Group</p>
                            <p className="text-neutral-800 font-semibold text-sm">{profile.blood_group || 'O+'}</p>
                          </div>
                        </div>
                      </div>

                      {/* QR Code Section */}
                      <div className="flex flex-col items-center justify-center gap-3 border-t border-dashed border-neutral-200 pt-6">
                        <div className="bg-white p-2 rounded-xl border border-neutral-200 shadow-sm">
                          {idCardQrCode ? (
                            <img src={idCardQrCode} alt="Employee QR Code" className="w-24 h-24 object-contain" />
                          ) : (
                            <div className="w-24 h-24 bg-neutral-100 flex items-center justify-center text-xs text-neutral-400">
                              Generating...
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 font-medium">Scan to verify employee identity</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer bg-white border-t border-neutral-100 p-4">
                  <button className="btn btn-primary w-full shadow-lg" onClick={() => window.print()}>
                    <FaDownload className="mr-2" /> Download/Print ID
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
