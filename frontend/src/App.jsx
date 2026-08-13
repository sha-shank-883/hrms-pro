import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './hooks/useSettings.jsx';
import { ThemeProvider } from './context/ThemeContext';
import './styles/global.css';

// Pages
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Departments from './pages/Departments';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leaves from './pages/Leaves';
import Tasks from './pages/Tasks';
import Payroll from './pages/Payroll';
import PayrollRuns from './pages/PayrollRuns';
import PayslipDesigner from './pages/PayslipDesigner';
import BatchActions from './pages/BatchActions';
import MyPayslips from './pages/MyPayslips';
import Recruitment from './pages/Recruitment';
import Documents from './pages/Documents';
import MyDocuments from './pages/MyDocuments';
import Chat from './pages/Chat';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Performance from './pages/Performance';
import PerformanceReview from './pages/PerformanceReview';
import PerformanceCycles from './pages/PerformanceCycles';
import Onboarding from './pages/Onboarding';
import Assets from './pages/Assets';
import AuditLogs from './pages/AuditLogs';
import SuperAdmin from './pages/SuperAdmin';
import SuperAdminBiometrics from './pages/SuperAdminBiometrics';
import WebsiteBuilder from './pages/WebsiteBuilder';

import MobileAppConfig from './pages/MobileAppConfig';
import DemoRequests from './pages/DemoRequests';
import ChurnRiskReport from './pages/ChurnRiskReport';
import SupportDashboard from './pages/SupportDashboard';
import SupportTickets from './pages/SupportTickets';
import SupportFAQ from './pages/SupportFAQ';
import ChatWidget from './components/support/ChatWidget';
import LiveActivity from './pages/LiveActivity';
import OrgChart from './components/OrgChart';
import EmailTemplates from './pages/EmailTemplates';
import SendEmail from './pages/SendEmail';
import Layout from './components/Layout';
import PublicLayout from './components/layout/PublicLayout';
import { WebsiteBuilderProvider } from './contexts/WebsiteBuilderContext';
import Home from './pages/marketing/Home';
import Demo from './pages/marketing/Demo';
import Features from './pages/marketing/Features';
import Pricing from './pages/marketing/Pricing';
import About from './pages/marketing/About';
import Contact from './pages/marketing/Contact';
import Blog from './pages/marketing/Blog';
import ResourcesMarket from './pages/marketing/Resources';
import BlogPost from './pages/marketing/BlogPost';
import Privacy from './pages/marketing/Privacy';
import Terms from './pages/marketing/Terms';
import CancellationRefund from './pages/marketing/CancellationRefund';
import ShippingPolicy from './pages/marketing/ShippingPolicy';
import FAQPage from './pages/marketing/FAQPage';
import NotFound from './pages/marketing/NotFound';
import DynamicPage from './pages/marketing/DynamicPage';
import VsBambooHR from './pages/marketing/VsBambooHR';
import VsGusto from './pages/marketing/VsGusto';
import VsRippling from './pages/marketing/VsRippling';
import Signup from './pages/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AuthRedirect = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

import PublicIDCard from './pages/PublicIDCard';

const AuthenticatedChatWidget = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return null;
  return <ChatWidget />;
};

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NotificationProvider>
          <SettingsProvider>
          <ThemeProvider>
            <WebsiteBuilderProvider>
              <Router>
                <AuthenticatedChatWidget />
                <Routes>
                  {/* Public/View-Only Routes */}
                  <Route path="/view/id-card/:id" element={<PublicIDCard />} />

                  <Route path="/login" element={
                    <AuthRedirect>
                      <Login />
                    </AuthRedirect>
                  } />
                  <Route path="/signup" element={
                    <AuthRedirect>
                      <Signup />
                    </AuthRedirect>
                  } />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />

                  {/* Public Marketing Routes */}
                  <Route element={<PublicLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/demo" element={<Demo />} />
                    <Route path="/features" element={<Features />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/resources" element={<ResourcesMarket />} />
                    <Route path="/blog/:id" element={<BlogPost />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/cancellation-refund" element={<CancellationRefund />} />
                    <Route path="/refund-policy" element={<CancellationRefund />} />
                    <Route path="/shipping-policy" element={<ShippingPolicy />} />
                    <Route path="/faq" element={<FAQPage />} />
                    <Route path="/vs-bamboohr" element={<VsBambooHR />} />
                    <Route path="/vs-gusto" element={<VsGusto />} />
                    <Route path="/vs-rippling" element={<VsRippling />} />
                    <Route path="/:slug" element={<DynamicPage />} />
                  </Route>
                <Route path="*" element={<NotFound />} />

                {/* Protected Dashboard Routes */}
                <Route element={
                  <AuthRoute>
                    <Layout />
                  </AuthRoute>
                }>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="departments" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['departments:read']}>
                      <Departments />
                    </ProtectedRoute>
                  } />
                  <Route path="employees" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['employees:read']}>
                      <Employees />
                    </ProtectedRoute>
                  } />
                  <Route path="employees/:id" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                      <Profile />
                    </ProtectedRoute>
                  } />
                  <Route path="attendance" element={<Attendance />} />
                  <Route path="leaves" element={<Leaves />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="onboarding" element={<Onboarding />} />
                  <Route path="offboarding" element={<Onboarding />} />
                  <Route path="performance" element={<Performance />} />
                  <Route path="performance/review/:id" element={<PerformanceReview />} />
                  <Route path="performance/cycles" element={
                    <ProtectedRoute allowedRoles={['admin']} allowedPermissions={['performance:update']}>
                      <PerformanceCycles />
                    </ProtectedRoute>
                  } />
                  <Route path="payroll" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['payroll:read']}>
                      <Payroll />
                    </ProtectedRoute>
                  } />
                  <Route path="payroll/runs" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['payroll:read']}>
                      <PayrollRuns />
                    </ProtectedRoute>
                  } />
                  <Route path="payroll/payslip-designer" element={
                    <ProtectedRoute allowedRoles={['admin']} allowedPermissions={['payroll:read']}>
                      <PayslipDesigner />
                    </ProtectedRoute>
                  } />
                  <Route path="payroll/batch" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['payroll:read']}>
                      <BatchActions />
                    </ProtectedRoute>
                  } />
                  <Route path="my-payslips" element={
                    <ProtectedRoute allowedRoles={['employee']}>
                      <MyPayslips />
                    </ProtectedRoute>
                  } />
                  <Route path="recruitment" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['recruitment:read']}>
                      <Recruitment />
                    </ProtectedRoute>
                  } />
                  <Route path="documents" element={<Documents />} />
                  <Route path="my-documents" element={
                    <ProtectedRoute allowedRoles={['employee']}>
                      <MyDocuments />
                    </ProtectedRoute>
                  } />
                  <Route path="assets" element={<Assets />} />
                  <Route path="audit-logs" element={
                    <ProtectedRoute allowedRoles={['admin']} allowedPermissions={['audit_logs:read']}>
                      <AuditLogs />
                    </ProtectedRoute>
                  } />
                  <Route path="chat" element={<Chat />} />
                  <Route path="reports" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['reports:read']}>
                      <Reports />
                    </ProtectedRoute>
                  } />
                  <Route path="reports/churn-risk" element={
                    <ProtectedRoute allowedRoles={['admin']} allowedPermissions={['reports:read']}>
                      <ChurnRiskReport />
                    </ProtectedRoute>
                  } />
                  <Route path="live-activity" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['reports:read']}>
                      <LiveActivity />
                    </ProtectedRoute>
                  } />
                  <Route path="analytics" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['reports:read']}>
                      <Analytics />
                    </ProtectedRoute>
                  } />
                  <Route path="settings" element={
                    <ProtectedRoute allowedRoles={['admin']} allowedPermissions={['settings:read']}>
                      <Settings />
                    </ProtectedRoute>
                  } />

                  <Route path="email-templates" element={
                    <ProtectedRoute allowedRoles={['admin']} allowedPermissions={['settings:update']}>
                      <EmailTemplates />
                    </ProtectedRoute>
                  } />
                  <Route path="send-email" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['manage_settings']}>
                      <SendEmail />
                    </ProtectedRoute>
                  } />
                  <Route path="super-admin" element={
                    <SuperAdminRoute>
                      <SuperAdmin />
                    </SuperAdminRoute>
                  } />
                  <Route path="super-admin/website" element={
                    <SuperAdminRoute>
                      <WebsiteBuilder />
                    </SuperAdminRoute>
                  } />
                  <Route path="super-admin/biometrics" element={
                    <SuperAdminRoute>
                      <SuperAdminBiometrics />
                    </SuperAdminRoute>
                  } />
                  <Route path="super-admin/mobile-config" element={
                    <SuperAdminRoute>
                      <MobileAppConfig />
                    </SuperAdminRoute>
                  } />
                  <Route path="super-admin/demo-requests" element={
                    <SuperAdminRoute>
                      <DemoRequests />
                    </SuperAdminRoute>
                  } />
                  <Route path="profile" element={<Profile />} />
                  <Route path="org-chart" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                      <OrgChart />
                    </ProtectedRoute>
                  } />
                  <Route path="support" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['support:read']}>
                      <SupportDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="support/tickets" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']} allowedPermissions={['support:read', 'tickets:read']}>
                      <SupportTickets />
                    </ProtectedRoute>
                  } />
                  <Route path="support/faq" element={
                    <ProtectedRoute allowedRoles={['admin', 'manager']} allowedPermissions={['support:read']}>
                      <SupportFAQ />
                    </ProtectedRoute>
                  } />
                </Route>
              </Routes>
            </Router>
          </WebsiteBuilderProvider>
        </ThemeProvider>
          </SettingsProvider>
        </NotificationProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;