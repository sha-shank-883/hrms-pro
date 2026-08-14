import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SuperAdminRoute = ({ children }) => {
    const { user, loading } = useAuth();
    const tenantId = localStorage.getItem('tenant_id');

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    // Check if user is Global Super Admin or admin on tenant_default (legacy)
    if (user?.isSuperAdmin || user?.role === 'super_admin' || (user?.role === 'admin' && tenantId === 'tenant_default')) {
        return children;
    }

    return <Navigate to="/" replace />;
};

export default SuperAdminRoute;
