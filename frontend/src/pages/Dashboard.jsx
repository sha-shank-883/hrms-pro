import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import ManagerDashboard from '../components/dashboard/ManagerDashboard';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return <div className="loading">Loading user profile...</div>;
  }

  // Super Admin redirects to SaaS Control Center
  if (user.isSuperAdmin || user.role === 'super_admin') {
    return <Navigate to="/super-admin" replace />;
  }

  // Render dashboard based on role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    default:
      return <EmployeeDashboard />;
  }
};
export default Dashboard;