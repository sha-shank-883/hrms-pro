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
        <div className="page-container max-w-none mx-0 px-0 md:px-4 lg:px-6">
            {/* Header - More Compact */}
            <div className="page-header pb-3" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="page-title text-xl">Manager Dashboard</h1>
                    <p className="page-subtitle text-xs">Team overview and management</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1f2937' }}>{formatTime(currentTime)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatDate(currentTime, getSetting('date_format'))}</div>
                </div>
            </div>

            {/* Team Stats - More Compact */}
            <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}><FaUsers /></div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.1rem', fontWeight: '700' }}>{stats?.employees?.active || 0}</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>Team Members</p>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}><FaClock /></div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.1rem', fontWeight: '700' }}>{stats?.attendance?.present || 0}</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>Present Today</p>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '0.25rem' }}><FaCalendarAlt /></div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.1rem', fontWeight: '700' }}>{stats?.leaves?.pending || 0}</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>Pending Leave Requests</p>
                </div>
            </div>

            {/* Quick Actions - More Compact */}
            <div className="card p-4">
                <h3 className="section-title mb-3 text-sm">Team Management</h3>
                <div className="flex gap-3 flex-wrap">
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
