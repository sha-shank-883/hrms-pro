import React from 'react';
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

  // Render dashboard based on role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'manager':
      return <ManagerDashboard />;
    case 'employee':
      return <EmployeeDashboard />;
    default:
      // Fallback for unknown roles, or default to employee view
      return <EmployeeDashboard />;
  }
};
export default Dashboard;