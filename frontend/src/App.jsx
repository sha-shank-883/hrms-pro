import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { SettingsProvider } from './hooks/useSettings.jsx';
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
import ChurnRiskReport from './pages/ChurnRiskReport';
import LiveActivity from './pages/LiveActivity';
import OrgChart from './components/OrgChart';
import EmailTemplates from './pages/EmailTemplates';
import SendEmail from './pages/SendEmail';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
};

import PublicIDCard from './pages/PublicIDCard';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <SettingsProvider>
          <Router>
            <Routes>
              {/* Public/View-Only Routes */}
              <Route path="/view/id-card/:id" element={<PublicIDCard />} />

              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              <Route path="/" element={
                <AuthRoute>
                  <Layout />
                </AuthRoute>
              }>
                <Route index element={<Dashboard />} />
                <Route path="departments" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Departments />
                  </ProtectedRoute>
                } />
                <Route path="employees" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
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
                  <ProtectedRoute allowedRoles={['admin']}>
                    <PerformanceCycles />
                  </ProtectedRoute>
                } />
                <Route path="payroll" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Payroll />
                  </ProtectedRoute>
                } />
                <Route path="my-payslips" element={
                  <ProtectedRoute allowedRoles={['employee']}>
                    <MyPayslips />
                  </ProtectedRoute>
                } />
                <Route path="recruitment" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
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
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AuditLogs />
                  </ProtectedRoute>
                } />
                <Route path="chat" element={<Chat />} />
                <Route path="reports" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Reports />
                  </ProtectedRoute>
                } />
                <Route path="reports/churn-risk" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <ChurnRiskReport />
                  </ProtectedRoute>
                } />
                <Route path="live-activity" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <LiveActivity />
                  </ProtectedRoute>
                } />
                <Route path="analytics" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="settings" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <Settings />
                  </ProtectedRoute>
                } />
                <Route path="email-templates" element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <EmailTemplates />
                  </ProtectedRoute>
                } />
                <Route path="send-email" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager']}>
                    <SendEmail />
                  </ProtectedRoute>
                } />
                <Route path="super-admin" element={
                  <SuperAdminRoute>
                    <SuperAdmin />
                  </SuperAdminRoute>
                } />
                <Route path="profile" element={<Profile />} />
                <Route path="org-chart" element={
                  <ProtectedRoute allowedRoles={['admin', 'manager', 'employee']}>
                    <OrgChart />
                  </ProtectedRoute>
                } />
              </Route>
            </Routes>
          </Router>
        </SettingsProvider>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;