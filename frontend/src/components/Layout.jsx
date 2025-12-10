import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { leaveService, taskService, chatService } from '../services';
import {
  FaHome, FaUsers, FaCalendarCheck, FaMoneyBillWave, FaCog,
  FaSignOutAlt, FaBars, FaTimes, FaFileAlt, FaTasks,
  FaUserPlus, FaUserMinus, FaBoxOpen, FaHistory, FaComments, FaUserSlash, FaBuilding, FaChartLine
} from 'react-icons/fa';
import '../styles/Layout.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  // Initialize sidebar based on window width to prevent covering content on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [notifications, setNotifications] = useState({
    leaves: 0,
    tasks: 0,
    chat: 0
  });

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      // Fetch pending leaves count
      const leavesResponse = await leaveService.getAll();
      const pendingLeaves = leavesResponse.data.filter(l => l.status === 'pending').length;

      // Fetch pending/in-progress tasks count
      const tasksResponse = await taskService.getAll();
      const pendingTasks = tasksResponse.data.filter(t => t.status === 'todo' || t.status === 'in_progress').length;

      // Fetch unread messages count (if chat service has this endpoint)
      // For now, we'll use 0 or implement later
      const unreadMessages = 0;

      setNotifications({
        leaves: pendingLeaves,
        tasks: pendingTasks,
        chat: unreadMessages
      });
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {settings.company_logo ? (
            <img
              src={settings.company_logo}
              alt={settings.company_name || "Company Logo"}
              style={{ maxHeight: '40px', maxWidth: '100%', objectFit: 'contain' }}
            />
          ) : (
            <h2>{settings.company_name || "HRMS Pro"}</h2>
          )}
        </div>

        <nav className="sidebar-nav">
          <Link to="/" className={`nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <FaHome /> Dashboard
          </Link>

          <Link to="/chat" className={`nav-item ${location.pathname === '/chat' ? 'active' : ''}`}>
            <FaComments /> Chat
            {notifications.chat > 0 && <span className="badge badge-warning">{notifications.chat}</span>}
          </Link>

          {(user.role === 'admin' || user.role === 'manager') && (
            <>
              <div className="nav-section-title">Organization</div>
              <Link to="/departments" className={`nav-item ${location.pathname === '/departments' ? 'active' : ''}`}>
                <FaUsers /> Departments
              </Link>
              <Link to="/employees" className={`nav-item ${location.pathname === '/employees' ? 'active' : ''}`}>
                <FaUsers /> Employees
              </Link>
              <Link to="/onboarding" className={`nav-item ${location.pathname === '/onboarding' ? 'active' : ''}`}>
                <FaUserPlus /> Onboarding
              </Link>
              <Link to="/offboarding" className={`nav-item ${location.pathname === '/offboarding' ? 'active' : ''}`}>
                <FaUserSlash /> Offboarding
              </Link>
            </>
          )}

          <div className="nav-section-title">Management</div>
          <Link to="/attendance" className={`nav-item ${location.pathname === '/attendance' ? 'active' : ''}`}>
            <FaCalendarCheck /> Attendance
          </Link>
          <Link to="/leaves" className={`nav-item ${location.pathname === '/leaves' ? 'active' : ''}`}>
            <FaCalendarCheck /> Leaves
            {notifications.leaves > 0 && <span className="badge badge-warning">{notifications.leaves}</span>}
          </Link>
          <Link to="/tasks" className={`nav-item ${location.pathname === '/tasks' ? 'active' : ''}`}>
            <FaTasks /> Tasks
            {notifications.tasks > 0 && <span className="badge badge-warning">{notifications.tasks}</span>}
          </Link>
          <Link to="/performance" className={`nav-item ${location.pathname.startsWith('/performance') ? 'active' : ''}`}>
            <FaUsers /> Performance
          </Link>

          {(user.role === 'admin' || user.role === 'manager') && (
            <>
              <Link to="/payroll" className={`nav-item ${location.pathname === '/payroll' ? 'active' : ''}`}>
                <FaMoneyBillWave /> Payroll
              </Link>
              <Link to="/recruitment" className={`nav-item ${location.pathname === '/recruitment' ? 'active' : ''}`}>
                <FaUserPlus /> Recruitment
              </Link>
            </>
          )}

          {user.role === 'employee' && (
            <Link to="/my-payslips" className={`nav-item ${location.pathname === '/my-payslips' ? 'active' : ''}`}>
              <FaMoneyBillWave /> My Payslips
            </Link>
          )}

          <div className="nav-section-title">Resources</div>
          <Link to="/documents" className={`nav-item ${location.pathname === '/documents' ? 'active' : ''}`}>
            <FaFileAlt /> Documents
          </Link>
          {user.role === 'employee' && (
            <Link to="/my-documents" className={`nav-item ${location.pathname === '/my-documents' ? 'active' : ''}`}>
              <FaFileAlt /> My Documents
            </Link>
          )}
          <Link to="/assets" className={`nav-item ${location.pathname === '/assets' ? 'active' : ''}`}>
            <FaBoxOpen /> Assets
          </Link>

          {user.role === 'admin' && (
            <Link to="/audit-logs" className={`nav-item ${location.pathname === '/audit-logs' ? 'active' : ''}`}>
              <FaHistory /> Audit Logs
            </Link>
          )}

          {(user.role === 'admin') && (
            <>
              <div className="nav-section-title">Analytics</div>
              <Link to="/reports/churn-risk" className={`nav-item ${location.pathname === '/reports/churn-risk' ? 'active' : ''}`}>
                <FaChartLine /> Churn Risk (Beta)
              </Link>
            </>
          )}

          {user.role === 'admin' && localStorage.getItem('tenant_id') === 'tenant_default' && (
            <Link to="/super-admin" className={`nav-item ${location.pathname === '/super-admin' ? 'active' : ''}`}>
              <FaBuilding /> SaaS Admin
            </Link>
          )}

          <div className="nav-section-title">Settings</div>
          <Link to="/profile" className={`nav-item ${location.pathname === '/profile' ? 'active' : ''}`}>
            <FaCog /> Profile
          </Link>
          {user.role === 'admin' && (
            <Link to="/settings" className={`nav-item ${location.pathname === '/settings' ? 'active' : ''}`}>
              <FaCog /> System Settings
            </Link>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <header className="header">
          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <FaTimes /> : <FaBars />}
          </button>

          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.first_name} {user?.last_name}</span>
              <span className="user-role badge badge-info">{user?.role}</span>
            </div>
            <button className="btn btn-danger" onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;