import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService } from '../../services';
import { useSettings } from '../../hooks/useSettings.jsx';
import { formatDate } from '../../utils/settingsHelper';
import {
    FaUsers,
    FaClock,
    FaCalendarAlt,
    FaTasks,
    FaUserCheck,
    FaClipboardList
} from 'react-icons/fa';

const ManagerDashboard = () => {
    const navigate = useNavigate();
    const { getSetting } = useSettings();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        loadDashboardStats();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const loadDashboardStats = async () => {
        try {
            // Managers see a subset of stats, usually filtered by their department in the backend
            // For now, we use the same endpoint but the backend should ideally filter this
            const response = await reportService.getDashboardStats();
            setStats(response.data);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loading">Loading dashboard...</div>;

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="container">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <div>
                    <h1 className="page-title">Manager Dashboard</h1>
                    <p className="page-description">Team overview and management</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>{formatTime(currentTime)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatDate(currentTime, getSetting('date_format'))}</div>
                </div>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-3" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><FaUsers /></div>
                    <h3 style={{ fontSize: '1.875rem', marginBottom: '0.25rem', fontWeight: '700' }}>{stats?.employees?.active || 0}</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>Team Members</p>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><FaClock /></div>
                    <h3 style={{ fontSize: '1.875rem', marginBottom: '0.25rem', fontWeight: '700' }}>{stats?.attendance?.present || 0}</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>Present Today</p>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><FaCalendarAlt /></div>
                    <h3 style={{ fontSize: '1.875rem', marginBottom: '0.25rem', fontWeight: '700' }}>{stats?.leaves?.pending || 0}</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>Pending Leave Requests</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Team Management</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/leaves')}>
                        <FaUserCheck /> Approve Leaves
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/performance')}>
                        <FaClipboardList /> Team Performance
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/tasks')}>
                        <FaTasks /> Assign Tasks
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManagerDashboard;
