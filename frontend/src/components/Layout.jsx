import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { leaveService, taskService } from '../services';
import {
  FaHome, FaUsers, FaCalendarCheck, FaMoneyBillWave, FaCog,
  FaSignOutAlt, FaBars, FaTimes, FaFileAlt, FaTasks,
  FaUserPlus, FaUserMinus, FaBoxOpen, FaHistory, FaComments,
  FaUserSlash, FaBuilding, FaChartLine, FaSitemap, FaBolt,
  FaSearch, FaBell, FaQuestionCircle, FaEnvelope,
  FaChevronDown, FaUser, FaFileInvoiceDollar, FaCheckDouble,
  FaPlane
} from 'react-icons/fa';

const Layout = () => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const { notifications, markAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Auto-mark as read on route change
  useEffect(() => {
    const path = location.pathname;
    if (path === '/leaves') markAsRead('leaves');
    if (path === '/tasks') markAsRead('tasks');
    if (path === '/chat') markAsRead('chat');
    if (path === '/attendance') markAsRead('attendance');
    if (path === '/live-activity') markAsRead('liveActivity');
  }, [location.pathname, markAsRead]);

  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth <= 1024) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getProfilePicture = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const cleanBaseUrl = baseUrl.replace('/api', '');
    return `${cleanBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const NavItem = ({ to, icon, label, count, badgeColor = 'primary-soft' }) => {
    const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
    return (
      <NavLink
        to={to}
        className={`nav-item flex items-center gap-4 px-4 py-4 text-base font-medium rounded-xl transition-all duration-200 mb-2 mx-2 ${isActive
          ? 'bg-green-50 text-green-700 border-l-4 border-green-500 pl-4 shadow-sm'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 hover:shadow-sm'
          }`}
      >
        <span className={`nav-icon text-xl ${isActive ? 'text-green-600' : 'text-neutral-500'}`}>{icon}</span>
        <span className="flex-1 truncate">{label}</span>
        {count > 0 && (
          <span className={`badge badge-${badgeColor} badge-sm ml-auto ${isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-neutral-100 text-neutral-600 border-neutral-200'}`}>{count}</span>
        )}
      </NavLink>
    );
  };

  const NavSection = ({ title }) => (
    <div className="px-6 mt-8 mb-4 text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-3">
      <span className="flex-1">{title}</span>
      <span className="border-t border-neutral-200 flex-1"></span>
    </div>
  );

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-neutral-50">
      {/* Notification Panel */}
      {/* Notification Panel */}
      {showNotifications && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
          <div className="absolute top-20 right-4 md:right-20 w-80 md:w-96 bg-white rounded-xl shadow-2xl border border-neutral-100 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
              <h3 className="font-bold text-neutral-800 flex items-center gap-2">
                <FaBell className="text-primary-600" /> Notifications
              </h3>
              <button className="text-xs font-medium text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:bg-primary-50 px-2 py-1 rounded transition-colors">
                <FaCheckDouble /> Mark all read
              </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar p-2 space-y-2">
              {notifications.leaves > 0 && (
                <Link
                  to="/leaves"
                  className="block p-3 rounded-xl hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all group"
                  onClick={() => setShowNotifications(false)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-amber-800 text-sm flex items-center gap-2">
                      <FaCalendarCheck className="text-amber-500" /> Leave Requests
                    </span>
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">{notifications.leaves} new</span>
                  </div>
                  <p className="text-xs text-neutral-600 group-hover:text-neutral-800">You have {notifications.leaves} pending leave applications requiring approval.</p>
                </Link>
              )}

              {notifications.tasks > 0 && (
                <Link
                  to="/tasks"
                  className="block p-3 rounded-xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all group"
                  onClick={() => setShowNotifications(false)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-blue-800 text-sm flex items-center gap-2">
                      <FaTasks className="text-blue-500" /> Pending Tasks
                    </span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">{notifications.tasks} new</span>
                  </div>
                  <p className="text-xs text-neutral-600 group-hover:text-neutral-800">You have {notifications.tasks} tasks assigned to you that are pending or in progress.</p>
                </Link>
              )}

              {notifications.chat > 0 && (
                <Link
                  to="/chat"
                  className="block p-3 rounded-xl hover:bg-green-50 border border-transparent hover:border-green-100 transition-all group"
                  onClick={() => setShowNotifications(false)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-green-800 text-sm flex items-center gap-2">
                      <FaComments className="text-green-500" /> New Messages
                    </span>
                    <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded-full">{notifications.chat} new</span>
                  </div>
                  <p className="text-xs text-neutral-600 group-hover:text-neutral-800">You have {notifications.chat} unread messages from your team.</p>
                </Link>
              )}

              {notifications.leaves === 0 && notifications.tasks === 0 && notifications.chat === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                  <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mb-3">
                    <FaBell className="text-2xl text-neutral-300" />
                  </div>
                  <p className="text-sm font-medium">No new notifications</p>
                  <p className="text-xs text-neutral-400 mt-1">You're all caught up!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {(notifications.leaves > 0 || notifications.tasks > 0 || notifications.chat > 0) && (
              <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-center">
                <p className="text-xs text-neutral-500">Real-time updates enabled</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Mobile Overlay */}
      {isSidebarOpen && window.innerWidth <= 1024 && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Using flex layout instead of fixed positioning on desktop */}
      <aside className={`app-sidebar w-72 flex-shrink-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-auto lg:relative lg:transform-none`}>
        {/* Sidebar Header - More Padding */}
        <div className="h-20 flex items-center justify-between px-6 border-b border-neutral-200 bg-white">
          <div className="flex items-center gap-4 overflow-hidden">
            {settings.company_logo ? (
              <img src={settings.company_logo} alt="Logo" className="h-10 object-contain" />
            ) : (
              <div className="h-12 w-12 bg-green-500 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {settings.company_name ? settings.company_name.charAt(0) : 'H'}
              </div>
            )}
            <div className="overflow-hidden">
              <span className="font-bold text-xl text-neutral-900 truncate block">
                {settings.company_name || "HRMS Pro"}
              </span>
              <span className="text-sm text-neutral-500 truncate block">Human Resources</span>
            </div>
          </div>
          <button className="lg:hidden text-neutral-500 hover:text-neutral-700 p-2 rounded-md hover:bg-neutral-100" onClick={() => setIsSidebarOpen(false)}>
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Sidebar Nav - More Spacious */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 custom-scrollbar bg-white">
          <NavItem to="/" icon={<FaHome />} label="Dashboard" />

          {(user.role === 'admin' || user.role === 'manager') && (
            <NavItem to="/live-activity" icon={<FaBolt />} label="Live Activity" count={notifications.liveActivity} />
          )}

          <NavItem to="/chat" icon={<FaComments />} label="Chat" count={notifications.chat} />

          <NavSection title="Main Modules" />
          <NavItem to="/employees" icon={<FaUsers />} label="Employees" />
          <NavItem to="/departments" icon={<FaBuilding />} label="Departments" />
          <NavItem to="/attendance" icon={<FaCalendarCheck />} label="Attendance" count={notifications.attendance} />
          <NavItem to="/leaves" icon={<FaPlane />} label="Leaves" count={notifications.leaves} />
          <NavItem to="/tasks" icon={<FaTasks />} label="Tasks" count={notifications.tasks} />
          <NavItem to="/performance" icon={<FaChartLine />} label="Performance" />
          <NavItem to="/payroll" icon={<FaMoneyBillWave />} label="Payroll" />
          <NavItem to="/recruitment" icon={<FaUserPlus />} label="Recruitment" />
          <NavItem to="/documents" icon={<FaFileAlt />} label="Documents" />
          <NavItem to="/assets" icon={<FaBoxOpen />} label="Assets" />

          {user.role === 'admin' && (
            <>
              <NavSection title="Administration" />
              {localStorage.getItem('tenant_id') === 'tenant_default' && (
                <NavItem to="/super-admin" icon={<FaBolt />} label="SaaS Admin" />
              )}
              <NavItem to="/reports" icon={<FaFileAlt />} label="Reports" />
              <NavItem to="/email-templates" icon={<FaFileAlt />} label="Email Templates" />
              <NavItem to="/send-email" icon={<FaEnvelope />} label="Send Email" />
              <NavItem to="/audit-logs" icon={<FaHistory />} label="Audit Logs" />
              <NavItem to="/settings" icon={<FaCog />} label="Settings" />
            </>
          )}

          {user.role === 'employee' && (
            <>
              <NavSection title="My Items" />
              <NavItem to="/profile" icon={<FaUsers />} label="My Profile" />
              <NavItem to="/my-payslips" icon={<FaMoneyBillWave />} label="My Payslips" />
            </>
          )}
        </nav>

        {/* Sidebar Footer removed - moved to Header */}
      </aside>

      {/* Main Content Area - Adjusted for larger sidebar */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white border-b border-neutral-200 flex items-center justify-between px-6 lg:px-8 z-10 shadow-sm sticky top-0">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-3 rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors duration-200 lg:hidden"
            >
              <FaBars className="text-xl" />
            </button>
            {/* Global Search */}
            <div className="hidden md:flex items-center relative">
              <FaSearch className="absolute left-4 text-neutral-400 text-lg" />
              <input
                type="text"
                placeholder="Search employees, tasks..."
                className="pl-12 pr-6 py-3 bg-white border border-neutral-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 w-80 transition-all shadow-sm hover:shadow-md"
              />
            </div>
            <button
              className="md:hidden p-3 rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors duration-200"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <FaSearch className="text-xl" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <button className="notification-button" onClick={() => setShowNotifications(!showNotifications)}>
              <FaBell className="notification-bell" />
              <span className={`notification-badge ${notifications.leaves > 0 || notifications.tasks > 0 || notifications.chat > 0 ? 'show' : ''}`}>
                {notifications.leaves > 0 ? notifications.leaves : ''}
              </span>
            </button>
            <button className="p-3 text-neutral-500 hover:text-green-600 transition-colors duration-200 rounded-md hover:bg-neutral-100">
              <FaQuestionCircle className="text-xl" />
            </button>
            <div className="h-8 w-px bg-neutral-200 mx-2"></div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-3 hover:bg-neutral-50 rounded-xl p-2 transition-all duration-200 border border-transparent hover:border-neutral-200"
              >
                <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center overflow-hidden border border-neutral-300">
                  {user?.profile_image ? (
                    <img src={getProfilePicture(user.profile_image)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-neutral-600">{user?.first_name?.charAt(0) || 'U'}</span>
                  )}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-neutral-700 leading-tight">{user?.first_name}</p>
                  <p className="text-xs text-neutral-500 capitalize leading-tight">{user?.role}</p>
                </div>
                <FaChevronDown className={`text-neutral-400 text-xs transition-transform duration-200 ${isProfileMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isProfileMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsProfileMenuOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-neutral-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                    <div className="px-4 py-3 border-b border-neutral-100 mb-1">
                      <p className="text-sm font-semibold text-neutral-900">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
                    </div>

                    <div className="px-1">
                      <Link
                        to="/profile"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-green-600 rounded-lg transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FaUser className="text-neutral-400" />
                        My Profile
                      </Link>
                      <Link
                        to="/my-payslips"
                        className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-green-600 rounded-lg transition-colors"
                        onClick={() => setIsProfileMenuOpen(false)}
                      >
                        <FaFileInvoiceDollar className="text-neutral-400" />
                        My Payslips
                      </Link>
                    </div>

                    <div className="border-t border-neutral-100 my-1"></div>

                    <div className="px-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                      >
                        <FaSignOutAlt />
                        Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-y-auto bg-neutral-50 w-full relative pb-10">
          <div className="min-h-full p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;