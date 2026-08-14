import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import { useSettings } from '../hooks/useSettings.jsx';
import { useTheme } from '../context/ThemeContext';
import { leaveService, taskService, searchService, tenantService } from '../services';
import SubscriptionBanner from '../components/billing/SubscriptionBanner';
import {
  FaHome, FaUsers, FaCalendarCheck, FaMoneyBillWave, FaCog,
  FaSignOutAlt, FaBars, FaTimes, FaFileAlt, FaTasks,
  FaUserPlus, FaUserMinus, FaBoxOpen, FaHistory, FaComments,
  FaUserSlash, FaBuilding, FaChartLine, FaSitemap, FaBolt,
  FaSearch, FaBell, FaQuestionCircle, FaEnvelope,
  FaChevronDown, FaUser, FaFileInvoiceDollar, FaCheckDouble,
  FaPlane, FaPalette, FaMoon, FaSun,
  FaHeadset, FaTicketAlt, FaGlobe, FaCreditCard, FaCrown,
  FaLayerGroup, FaThLarge, FaFingerprint, FaMobileAlt,
  FaBullhorn, FaShieldAlt, FaHeartbeat, FaDatabase
} from 'react-icons/fa';

const PlatformBroadcastBanner = () => {
  const [broadcasts, setBroadcasts] = useState([]);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dismissed_broadcasts') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchBroadcasts = async () => {
      try {
        const res = await tenantService.getActiveBroadcasts();
        if (res.success && res.broadcasts) {
          setBroadcasts(res.broadcasts);
        }
      } catch (err) {
        // silent fail
      }
    };
    fetchBroadcasts();
  }, []);

  const handleDismiss = (id) => {
    const next = [...dismissed, id];
    setDismissed(next);
    localStorage.setItem('dismissed_broadcasts', JSON.stringify(next));
  };

  const visible = broadcasts.filter(b => !dismissed.includes(b.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-1">
      {visible.map(b => (
        <div
          key={b.id}
          className={`px-6 py-2.5 flex items-center justify-between text-xs font-medium border-b transition-all shadow-xs ${
            b.type === 'warning' ? 'bg-amber-500 text-white border-amber-600' :
            b.type === 'critical' ? 'bg-red-600 text-white border-red-700' :
            b.type === 'maintenance' ? 'bg-purple-600 text-white border-purple-700' :
            'bg-blue-600 text-white border-blue-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="uppercase text-[10px] font-black tracking-wider px-1.5 py-0.5 rounded bg-black/20">
              {b.type}
            </span>
            <span className="font-bold">{b.title}:</span>
            <span>{b.message}</span>
          </div>
          {b.dismissible && (
            <button
              onClick={() => handleDismiss(b.id)}
              className="text-white/80 hover:text-white p-1 rounded hover:bg-black/10 text-sm leading-none"
              title="Dismiss announcement"
            >
              &times;
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

const Layout = () => {
  const { user, logout, hasModule } = useAuth();
  const { settings } = useSettings();
  const { notifications, feed, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const { dark, toggle: toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [impersonated, setImpersonated] = useState(false);
  const [impersonatedTenantId, setImpersonatedTenantId] = useState('');

  useEffect(() => {
    const originalAuth = sessionStorage.getItem('originalSuperAdminAuth');
    if (originalAuth) {
      setImpersonated(true);
      setImpersonatedTenantId(localStorage.getItem('tenant_id') || '');
    } else {
      setImpersonated(false);
    }
  }, [location.pathname]);

  const handleExitImpersonation = () => {
    try {
      const originalAuth = sessionStorage.getItem('originalSuperAdminAuth');
      if (originalAuth) {
        const { token, user, tenantId } = JSON.parse(originalAuth);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('tenant_id', tenantId);
        sessionStorage.removeItem('originalSuperAdminAuth');
        window.location.href = '/super-admin';
      }
    } catch (e) {
      console.error('Failed to exit impersonation:', e);
      sessionStorage.removeItem('originalSuperAdminAuth');
      window.location.href = '/login';
    }
  };

  const searchRef = useRef(null);
  const sidebarNavRef = useRef(null);
  const sidebarScrollRef = useRef(0);

  useEffect(() => {
    const nav = sidebarNavRef.current;
    if (!nav) return;
    const onScroll = () => { sidebarScrollRef.current = nav.scrollTop; };
    nav.addEventListener('scroll', onScroll, { passive: true });
    return () => nav.removeEventListener('scroll', onScroll);
  }, []);

  useLayoutEffect(() => {
    if (sidebarNavRef.current) {
      sidebarNavRef.current.scrollTop = sidebarScrollRef.current;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const STATIC_MODULES = [
    { label: 'Dashboard', path: '/' },
    { label: 'Employees', path: '/employees' },
    { label: 'Departments', path: '/departments' },
    { label: 'Attendance', path: '/attendance' },
    { label: 'Leaves', path: '/leaves' },
    { label: 'Tasks', path: '/tasks' },
    { label: 'Performance', path: '/performance' },
    { label: 'Payroll', path: '/payroll' },
    { label: 'Recruitment', path: '/recruitment' },
    { label: 'Documents', path: '/documents' },
    { label: 'Assets', path: '/assets' },
    { label: 'Chat', path: '/chat' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        setIsSearching(true);
        try {
          const filteredModules = STATIC_MODULES.filter(m => m.label.toLowerCase().includes(searchQuery.toLowerCase()));
          const res = await searchService.globalSearch(searchQuery);
          if (res.success) {
            setSearchResults({
              modules: filteredModules,
              ...res.data
            });
          }
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults(null);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSelect = (path) => {
    navigate(path);
    setSearchQuery('');
    setSearchResults(null);
    setIsSearchOpen(false);
  };


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
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const cleanBaseUrl = baseUrl.replace('/api', '');
    return `${cleanBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
  };

  const SubNavItem = ({ to, label }) => {
    const isActive = location.pathname === to;
    return (
      <NavLink
        to={to}
        className={`block px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all ${isActive
          ? 'bg-green-100 text-green-700 font-semibold'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
        }`}
      >
        {label}
      </NavLink>
    );
  };

  const NavItem = ({ to, icon, label, count, badgeColor = 'primary-soft' }) => {
    const isActive = location.pathname === to || (to !== '/' && to !== '/dashboard' && to !== '/super-admin' && location.pathname.startsWith(`${to}/`));
    return (
      <NavLink
        to={to}
        className={`nav-item flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-150 mb-0.5 mx-1 ${isActive
          ? 'bg-primary-50 text-primary-700 font-bold border-l-2 border-primary-600 pl-2.5 shadow-xs'
          : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
      >
        <span className={`nav-icon text-sm shrink-0 ${isActive ? 'text-primary-600' : 'text-neutral-400'}`}>{icon}</span>
        <span className="flex-1 truncate tracking-tight">{label}</span>
        {count > 0 && (
          <span className={`badge badge-${badgeColor} badge-sm ml-auto text-[10px] px-1.5 py-0.2 font-bold ${isActive ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-600'}`}>{count}</span>
        )}
      </NavLink>
    );
  };

  const NavSection = ({ title }) => (
    <div className="px-3 mt-4 mb-1.5 text-[10px] font-extrabold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
      <span className="shrink-0">{title}</span>
      <span className="border-t border-neutral-200 flex-1"></span>
    </div>
  );

  return (
    <div className="app-shell flex h-screen overflow-hidden bg-neutral-50">
      {/* Notification Panel */}
      {showNotifications && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
          <div className="absolute top-16 right-4 md:right-20 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-neutral-200 dark:border-gray-700 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-neutral-100 dark:border-gray-700 flex justify-between items-center bg-neutral-50 dark:bg-gray-850">
              <div className="flex items-center gap-2">
                <FaBell className="text-primary-600" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Notifications</h3>
                {(notifications.total > 0 || unreadCount > 0) && (
                  <span className="bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {notifications.total || unreadCount} unread
                  </span>
                )}
              </div>
              <button 
                onClick={() => markAllAsRead()}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:bg-primary-50 dark:hover:bg-primary-950/50 px-2 py-1 rounded transition-colors"
              >
                <FaCheckDouble className="text-[10px]" /> Mark all read
              </button>
            </div>

            {/* Actionable Module Cards */}
            <div className="overflow-y-auto custom-scrollbar p-3 space-y-2.5 max-h-[60vh]">
              {/* Super Admin Platform Action Cards */}
              {(user?.isSuperAdmin || user?.role === 'super_admin') ? (
                <>
                  {notifications.leads > 0 && (
                    <Link
                      to="/super-admin/demo-requests"
                      className="block p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-900/50 transition-all group"
                      onClick={() => setShowNotifications(false)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-blue-900 dark:text-blue-300 text-xs flex items-center gap-1.5">
                          <FaUsers className="text-blue-500" /> New Demo Leads
                        </span>
                        <span className="bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {notifications.leads} pending
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-800 dark:text-blue-400">
                        {notifications.leads} potential client lead(s) requested product demos.
                      </p>
                    </Link>
                  )}

                  {notifications.billing > 0 && (
                    <Link
                      to="/super-admin/billing"
                      className="block p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-900/50 transition-all group"
                      onClick={() => setShowNotifications(false)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                          <FaCreditCard className="text-emerald-500" /> Platform Payments
                        </span>
                        <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {notifications.billing} recent
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                        {notifications.billing} subscription payment transaction(s) logged in the last 24h.
                      </p>
                    </Link>
                  )}
                </>
              ) : (
                /* Tenant Organization Action Cards */
                <>
                  {notifications.leaves > 0 && (
                    <Link
                      to="/leaves"
                      className="block p-3 rounded-xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/60 dark:bg-amber-950/20 dark:border-amber-900/50 transition-all group"
                      onClick={() => setShowNotifications(false)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1.5">
                          <FaCalendarCheck className="text-amber-500" /> Leave Approvals
                        </span>
                        <span className="bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {notifications.leaves} pending
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800 dark:text-amber-400">
                        You have {notifications.leaves} leave request(s) awaiting your action.
                      </p>
                    </Link>
                  )}

                  {notifications.attendance > 0 && (
                    <Link
                      to="/attendance"
                      className="block p-3 rounded-xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200/60 dark:bg-purple-950/20 dark:border-purple-900/50 transition-all group"
                      onClick={() => setShowNotifications(false)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-purple-900 dark:text-purple-300 text-xs flex items-center gap-1.5">
                          <FaClock className="text-purple-500" /> Regularization Requests
                        </span>
                        <span className="bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {notifications.attendance} pending
                        </span>
                      </div>
                      <p className="text-[11px] text-purple-800 dark:text-purple-400">
                        {notifications.attendance} attendance regularization claim(s) need review.
                      </p>
                    </Link>
                  )}

                  {notifications.tasks > 0 && (
                    <Link
                      to="/tasks"
                      className="block p-3 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-900/50 transition-all group"
                      onClick={() => setShowNotifications(false)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-blue-900 dark:text-blue-300 text-xs flex items-center gap-1.5">
                          <FaTasks className="text-blue-500" /> Pending Tasks
                        </span>
                        <span className="bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {notifications.tasks} active
                        </span>
                      </div>
                      <p className="text-[11px] text-blue-800 dark:text-blue-400">
                        You have {notifications.tasks} task(s) in progress or awaiting completion.
                      </p>
                    </Link>
                  )}

                  {notifications.chat > 0 && (
                    <Link
                      to="/chat"
                      className="block p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 dark:bg-emerald-950/20 dark:border-emerald-900/50 transition-all group"
                      onClick={() => setShowNotifications(false)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-emerald-900 dark:text-emerald-300 text-xs flex items-center gap-1.5">
                          <FaComments className="text-emerald-500" /> Unread Messages
                        </span>
                        <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          {notifications.chat} new
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
                        You have {notifications.chat} unread direct or channel message(s).
                      </p>
                    </Link>
                  )}
                </>
              )}

              {/* Feed Items */}
              {feed && feed.length > 0 && (
                <div className="pt-2 border-t border-neutral-100 dark:border-gray-700 space-y-1.5">
                  <p className="text-[10px] font-extrabold uppercase text-neutral-400 px-1 tracking-wider">Recent Activity</p>
                  {feed.slice(0, 5).map(item => (
                    <div
                      key={item.id}
                      onClick={() => {
                        markAsRead(item.id);
                        if (item.action_url) {
                          navigate(item.action_url);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        !item.is_read
                          ? 'bg-primary-50/40 border-primary-200 dark:bg-primary-950/30 dark:border-primary-800'
                          : 'bg-neutral-50/50 border-neutral-100 dark:bg-gray-800 dark:border-gray-700 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-1">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1">
                          {!item.is_read && <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0"></span>}
                          {item.title}
                        </span>
                        <span className="text-[9px] text-neutral-400 shrink-0">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-300 line-clamp-2 mt-0.5">{item.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {notifications.leaves === 0 && notifications.attendance === 0 && notifications.tasks === 0 && notifications.chat === 0 && notifications.leads === 0 && notifications.billing === 0 && (!feed || feed.length === 0) && (
                <div className="flex flex-col items-center justify-center py-8 text-neutral-400">
                  <div className="w-12 h-12 bg-neutral-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-2">
                    <FaBell className="text-xl text-neutral-300 dark:text-neutral-500" />
                  </div>
                  <p className="text-xs font-bold text-neutral-700 dark:text-neutral-300">No unread notifications</p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">You're completely up to date!</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 bg-neutral-50 dark:bg-gray-850 border-t border-neutral-100 dark:border-gray-700 flex items-center justify-between text-[11px] text-neutral-500 px-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                Live Socket Sync
              </span>
              <Link
                to="/settings?tab=notifications"
                onClick={() => setShowNotifications(false)}
                className="font-bold text-primary-600 hover:text-primary-700"
              >
                Settings
              </Link>
            </div>
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

      {/* Sidebar - Fixed on mobile to overlay, relative on desktop to push content */}
      <aside className={`app-sidebar w-64 flex flex-col bg-white h-full fixed inset-y-0 left-0 lg:relative flex-shrink-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:z-auto lg:transform-none shadow-xl lg:shadow-none border-r border-neutral-200/80`}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-neutral-200/80 bg-white">
          <div className="flex items-center gap-3 overflow-hidden">
            {settings.company_logo ? (
              <img src={settings.company_logo} alt="Logo" className="h-8 object-contain" />
            ) : (
              <div className="h-9 w-9 bg-primary-600 rounded-xl flex items-center justify-center text-white font-black text-base shadow-xs">
                {settings.company_name ? settings.company_name.charAt(0) : 'H'}
              </div>
            )}
            <div className="overflow-hidden">
              <span className="font-bold text-sm text-neutral-900 truncate block">
                {settings.company_name || "HRMS Pro"}
              </span>
              <span className="text-[11px] text-neutral-400 truncate block font-medium">
                {(user?.isSuperAdmin || user?.role === 'super_admin') ? 'Super Admin Portal' : 'Workspace'}
              </span>
            </div>
          </div>
          <button className="lg:hidden text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100" onClick={() => setIsSidebarOpen(false)}>
            <FaTimes className="text-base" />
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav ref={sidebarNavRef} className="flex-1 overflow-y-auto py-3 px-2 custom-scrollbar bg-white" style={{ overflowAnchor: 'none' }}>
          {(user?.isSuperAdmin || user?.role === 'super_admin') ? (
            <>
              <NavSection title="Tenants & Revenue" />
              <NavItem to="/super-admin" icon={<FaBuilding />} label="Tenants" count={notifications.tenants} />
              <NavItem to="/super-admin/billing" icon={<FaCreditCard />} label="Billing" count={notifications.billing} />
              <NavItem to="/super-admin/plans" icon={<FaLayerGroup />} label="Plans" />
              <NavItem to="/super-admin/entitlements" icon={<FaThLarge />} label="Modules" />

              <NavSection title="Growth & Marketing" />
              <NavItem to="/super-admin/growth" icon={<FaChartLine />} label="Growth" />
              <NavItem to="/super-admin/demo-requests" icon={<FaUsers />} label="Leads" count={notifications.leads} />
              <NavItem to="/super-admin/website" icon={<FaGlobe />} label="Website" />

              <NavSection title="Platform Operations" />
              <NavItem to="/super-admin/broadcasts" icon={<FaBullhorn />} label="Broadcasts" />
              <NavItem to="/super-admin/platform-audit" icon={<FaShieldAlt />} label="Audit" />
              <NavItem to="/super-admin/health" icon={<FaHeartbeat />} label="Health" />
              <NavItem to="/super-admin/backups" icon={<FaDatabase />} label="Backups" />
              <NavItem to="/super-admin/biometrics" icon={<FaFingerprint />} label="Biometrics" />
              <NavItem to="/super-admin/mobile-config" icon={<FaMobileAlt />} label="Mobile" />
            </>
          ) : (
            <>
              <NavItem to="/dashboard" icon={<FaHome />} label="Dashboard" />

              {(() => {
                const hasAccess = (roles = [], perms = []) => {
                  if (roles.includes(user.role)) return true;
                  if (perms.length > 0 && user.permissions && perms.some(p => user.permissions.includes(p))) return true;
                  return false;
                };

                return (
                  <>
              {hasModule('live_activity') && hasAccess(['admin', 'manager'], ['reports:read']) && (
                <NavItem to="/live-activity" icon={<FaBolt />} label="Live Activity" count={notifications.liveActivity} />
              )}

              {hasModule('chat') && (
                <NavItem to="/chat" icon={<FaComments />} label="Chat" count={notifications.chat} />
              )}

              <NavSection title="Main Modules" />
              
              {hasModule('core_hr') && hasAccess(['admin', 'manager'], ['employees:read']) && (
                <>
                  <NavItem to="/employees" icon={<FaUsers />} label="Employees" />
                  <NavItem to="/org-chart" icon={<FaSitemap />} label="Directory" />
                </>
              )}
              {hasModule('core_hr') && hasAccess(['admin', 'manager'], ['departments:read']) && (
                  <NavItem to="/departments" icon={<FaBuilding />} label="Departments" />
              )}
              
              {hasModule('attendance') && (
                <NavItem to="/attendance" icon={<FaCalendarCheck />} label="Attendance" count={notifications.attendance} />
              )}
              {hasModule('leaves') && (
                <NavItem to="/leaves" icon={<FaPlane />} label="Leaves" count={notifications.leaves} />
              )}
              {hasModule('tasks') && (
                <NavItem to="/tasks" icon={<FaTasks />} label="Tasks" count={notifications.tasks} />
              )}
              {hasModule('performance') && (
                <NavItem to="/performance" icon={<FaChartLine />} label="Performance" />
              )}
              
              {hasModule('payroll') && hasAccess(['admin', 'manager'], ['payroll:read']) && (
                <div>
                  <NavItem to="/payroll" icon={<FaMoneyBillWave />} label="Payroll" />
                  {location.pathname.startsWith('/payroll') && (
                    <div className="ml-8 mb-2 space-y-1 border-l-2 border-green-200 pl-3">
                      <SubNavItem to="/payroll/runs" label="Runs" />
                      <SubNavItem to="/payroll/payslip-designer" label="Designer" />
                      <SubNavItem to="/payroll/batch" label="Batch Actions" />
                    </div>
                  )}
                </div>
              )}
              {hasModule('recruitment') && hasAccess(['admin', 'manager'], ['recruitment:read']) && (
                  <NavItem to="/recruitment" icon={<FaUserPlus />} label="Recruitment" />
              )}
              
              {hasModule('documents') && (
                <NavItem to="/documents" icon={<FaFileAlt />} label="Documents" />
              )}
              {hasModule('assets') && (
                <NavItem to="/assets" icon={<FaBoxOpen />} label="Assets" />
              )}

              {hasAccess(['admin', 'manager'], ['support:read']) && (
                <NavSection title="Support" />
              )}
              {hasAccess(['admin', 'manager'], ['support:read']) && (
                <NavItem to="/support" icon={<FaHeadset />} label="Support" />
              )}
              {hasAccess(['admin', 'manager', 'employee'], ['support:read', 'tickets:read']) && (
                <NavItem to="/support/tickets" icon={<FaTicketAlt />} label="Tickets" />
              )}
              {hasAccess(['admin', 'manager'], ['support:read']) && (
                <NavItem to="/support/faq" icon={<FaQuestionCircle />} label="FAQ" />
              )}

              {hasAccess(['admin'], ['reports:read', 'settings:read', 'audit_logs:read']) && (
                <NavSection title="Administration" />
              )}
              
              {hasModule('reports_analytics') && hasAccess(['admin', 'manager'], ['reports:read']) && (
                  <NavItem to="/reports" icon={<FaFileAlt />} label="Reports" />
              )}
              {hasAccess(['admin'], ['settings:update']) && (
                <>
                  <NavItem to="/email-templates" icon={<FaFileAlt />} label="Templates" />
                  <NavItem to="/send-email" icon={<FaEnvelope />} label="Broadcast" />
                </>
              )}
              {hasModule('audit_logs') && hasAccess(['admin'], ['audit_logs:read']) && (
                  <NavItem to="/audit-logs" icon={<FaHistory />} label="Audit" />
              )}
              {hasAccess(['admin'], ['settings:read']) && (
                <>
                  <NavItem to="/settings?tab=billing" icon={<FaCreditCard />} label="Billing" />
                  <NavItem to="/settings" icon={<FaCog />} label="Settings" />
                </>
              )}

              {user.role === 'employee' && (
                <>
                  <NavSection title="My Items" />
                  <NavItem to="/profile" icon={<FaUsers />} label="Profile" />
                  {hasModule('payroll') && (
                    <NavItem to="/my-payslips" icon={<FaMoneyBillWave />} label="Payslips" />
                  )}
                </>
              )}
                  </>
                );
              })()}
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
            <div className="hidden md:flex items-center relative" ref={searchRef}>
              <FaSearch className="absolute left-4 text-neutral-400 text-lg" />
              <input
                type="text"
                placeholder="Search employees, tasks, modules..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={(e) => {
                  if (e.target.value.trim().length >= 2 && !searchResults) {
                    // Trigger search if it was closed
                    setSearchQuery(e.target.value + ' ');
                    setTimeout(() => setSearchQuery(e.target.value), 10);
                  }
                }}
                className="pl-12 pr-6 py-3 bg-white border border-neutral-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 w-80 transition-all shadow-sm hover:shadow-md"
              />
              
              {/* Search Dropdown */}
              {(searchResults || isSearching) && (
                <div className="absolute top-full left-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-neutral-100 z-50 max-h-[70vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
                  <div className="p-3 border-b border-neutral-100 bg-neutral-50 flex justify-between items-center">
                    <span className="text-xs font-semibold text-neutral-500 uppercase">Search Results</span>
                    {isSearching && <span className="text-xs text-green-600 font-medium">Searching...</span>}
                  </div>
                  
                  <div className="overflow-y-auto custom-scrollbar flex-1 p-2 space-y-4">
                    {!isSearching && searchResults && (
                      <>
                        {/* Modules */}
                        {searchResults.modules?.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs font-bold text-neutral-400 mb-1">Modules</div>
                            {searchResults.modules.map(mod => (
                              <button
                                key={mod.path}
                                onClick={() => handleSearchSelect(mod.path)}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-primary-50 text-blue-600 flex items-center justify-center">
                                  <FaBoxOpen className="text-sm" />
                                </div>
                                <span className="text-sm font-medium text-neutral-700">{mod.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                        
                        {/* Employees */}
                        {searchResults.employees?.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs font-bold text-neutral-400 mb-1 leading-none">Employees</div>
                            {searchResults.employees.map(emp => (
                              <button
                                key={emp.employee_id}
                                onClick={() => handleSearchSelect(`/employees/${emp.employee_id}`)}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-green-50 text-green-600 flex items-center justify-center font-bold text-xs uppercase">
                                  {emp.first_name.charAt(0)}{emp.last_name.charAt(0)}
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-neutral-700 leading-tight">{emp.first_name} {emp.last_name}</div>
                                  <div className="text-xs text-neutral-500 leading-tight truncate">{emp.position || emp.department_name || emp.email}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Tasks */}
                        {searchResults.tasks?.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs font-bold text-neutral-400 mb-1 leading-none">Tasks</div>
                            {searchResults.tasks.map(task => (
                              <button
                                key={task.task_id}
                                onClick={() => handleSearchSelect(`/tasks?highlight=${task.task_id}`)}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
                                  <FaTasks className="text-sm" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className="text-sm font-medium text-neutral-700 truncate">{task.title}</div>
                                  <div className="text-xs text-neutral-500 capitalize">{task.status.replace('_', ' ')}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Departments */}
                        {searchResults.departments?.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs font-bold text-neutral-400 mb-1 leading-none">Departments</div>
                            {searchResults.departments.map(dept => (
                              <button
                                key={dept.department_id}
                                onClick={() => handleSearchSelect(`/departments?highlight=${dept.department_id}`)}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-secondary-50 text-secondary-600 flex items-center justify-center">
                                  <FaBuilding className="text-sm" />
                                </div>
                                <span className="text-sm font-medium text-neutral-700">{dept.department_name}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Documents */}
                        {searchResults.documents?.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs font-bold text-neutral-400 mb-1 leading-none">Documents</div>
                            {searchResults.documents.map(doc => (
                              <button
                                key={doc.document_id}
                                onClick={() => handleSearchSelect(`/documents?highlight=${doc.document_id}`)}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center">
                                  <FaFileAlt className="text-sm" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className="text-sm font-medium text-neutral-700 truncate">{doc.document_name}</div>
                                  <div className="text-xs text-neutral-500 capitalize">{doc.document_type} {doc.is_confidential ? '(Confidential)' : ''}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Assets */}
                        {searchResults.assets?.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs font-bold text-neutral-400 mb-1 leading-none">Assets</div>
                            {searchResults.assets.map(asset => (
                              <button
                                key={asset.asset_id}
                                onClick={() => handleSearchSelect(`/assets?highlight=${asset.asset_id}`)}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
                                  <FaBolt className="text-sm" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className="text-sm font-medium text-neutral-700 truncate">{asset.name}</div>
                                  <div className="text-xs text-neutral-500">{asset.serial_number} • {asset.status}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Job Postings */}
                        {searchResults.job_postings?.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs font-bold text-neutral-400 mb-1 leading-none">Job Postings</div>
                            {searchResults.job_postings.map(job => (
                              <button
                                key={job.job_id}
                                onClick={() => handleSearchSelect(`/recruitment/jobs?highlight=${job.job_id}`)}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center">
                                  <FaUserPlus className="text-sm" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className="text-sm font-medium text-neutral-700 truncate">{job.title}</div>
                                  <div className="text-xs text-neutral-500 capitalize">{job.position_type} • {job.status}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Job Applications */}
                        {searchResults.job_applications?.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs font-bold text-neutral-400 mb-1 leading-none">Job Applications</div>
                            {searchResults.job_applications.map(app => (
                              <button
                                key={app.application_id}
                                onClick={() => handleSearchSelect(`/recruitment/applications?highlight=${app.application_id}`)}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50 rounded-lg flex items-center gap-3 transition-colors"
                              >
                                <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
                                  <FaUser className="text-sm" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                  <div className="text-sm font-medium text-neutral-700 truncate">{app.applicant_name}</div>
                                  <div className="text-xs text-neutral-500 truncate">{app.email}</div>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* No results */}
                        {!searchResults.modules?.length && !searchResults.employees?.length && !searchResults.tasks?.length && !searchResults.departments?.length && !searchResults.documents?.length && !searchResults.assets?.length && !searchResults.job_postings?.length && !searchResults.job_applications?.length && (
                          <div className="py-8 text-center">
                            <FaSearch className="text-3xl text-neutral-200 mx-auto mb-2" />
                            <p className="text-sm text-neutral-500">No results found for "{searchQuery}"</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button
              className="md:hidden p-3 rounded-md text-neutral-500 hover:bg-neutral-100 transition-colors duration-200"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <FaSearch className="text-xl" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {(user?.isSuperAdmin || user?.role === 'super_admin') && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-300 rounded-lg text-xs font-black tracking-wide">
                <FaBolt className="text-amber-500 text-[10px]" />
                SUPER ADMIN
              </span>
            )}
            <button className="notification-button relative p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-gray-800 transition-colors" onClick={() => setShowNotifications(!showNotifications)} title="Notifications">
              <FaBell className="text-lg text-neutral-600 dark:text-gray-300" />
              {(notifications.total > 0 || unreadCount > 0) && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-sm">
                  {(notifications.total || unreadCount) > 99 ? '99+' : (notifications.total || unreadCount)}
                </span>
              )}
            </button>
            <button className="p-3 text-neutral-500 hover:text-green-600 transition-colors duration-200 rounded-md hover:bg-neutral-100">
              <FaQuestionCircle className="text-xl" />
            </button>
            <button onClick={toggleTheme} className="p-3 text-neutral-500 hover:text-amber-500 transition-colors duration-200 rounded-md hover:bg-neutral-100" title="Toggle theme">
              {dark ? <FaSun className="text-xl" /> : <FaMoon className="text-xl" />}
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
                  <p className="text-xs text-neutral-500 capitalize leading-tight">{user?.isSuperAdmin ? 'Super Admin' : user?.role}</p>
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
                      {(user?.isSuperAdmin || user?.role === 'super_admin') ? (
                        <>
                          <Link
                            to="/super-admin"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 rounded-lg transition-colors"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <FaBolt className="text-amber-500" />
                            SaaS Control Center
                          </Link>
                          <Link
                            to="/super-admin/demo-requests"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 rounded-lg transition-colors"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <FaUsers className="text-primary-500" />
                            Marketing & Leads
                          </Link>
                          <Link
                            to="/super-admin/website"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-primary-600 rounded-lg transition-colors"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <FaGlobe className="text-indigo-500" />
                            Website Builder
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/profile"
                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-green-600 rounded-lg transition-colors"
                            onClick={() => setIsProfileMenuOpen(false)}
                          >
                            <FaUser className="text-neutral-400" />
                            My Profile
                          </Link>
                          {user?.role === 'admin' ? (
                            <Link
                              to="/settings?tab=billing"
                              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-green-600 rounded-lg transition-colors"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              <FaCreditCard className="text-neutral-400" />
                              Billing & Subscription
                            </Link>
                          ) : (
                            <Link
                              to="/my-payslips"
                              className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 hover:text-green-600 rounded-lg transition-colors"
                              onClick={() => setIsProfileMenuOpen(false)}
                            >
                              <FaFileInvoiceDollar className="text-neutral-400" />
                              My Payslips
                            </Link>
                          )}
                        </>
                      )}
                    </div>

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
          {impersonated && (
            <div className="bg-amber-500 text-white px-6 py-2.5 flex items-center justify-between shadow-md font-medium text-sm border-b border-amber-600">
              <div className="flex items-center gap-2">
                <span className="bg-amber-700/50 text-white px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider">Impersonating</span>
                <span>You are currently viewing tenant: <strong>{impersonatedTenantId}</strong></span>
              </div>
              <button
                onClick={handleExitImpersonation}
                className="bg-white text-amber-900 hover:bg-amber-50 px-3 py-1 rounded-lg font-bold text-xs shadow transition-colors flex items-center gap-1"
              >
                Exit Impersonation & Return to Super Admin
              </button>
            </div>
          )}
          <PlatformBroadcastBanner />
          <SubscriptionBanner />
          <div className="min-h-full p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;