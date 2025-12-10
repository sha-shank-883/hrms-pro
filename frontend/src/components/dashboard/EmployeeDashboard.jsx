import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../hooks/useSettings.jsx';
import { formatDate } from '../../utils/settingsHelper';
import {
    FaClock,
    FaCalendarCheck,
    FaTasks,
    FaFileInvoiceDollar,
    FaUser
} from 'react-icons/fa';

const EmployeeDashboard = () => {
    const navigate = useNavigate();
    const { getSetting } = useSettings();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    return (
        <div className="container">
            {/* Header */}
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem' }}>
                <div>
                    <h1 className="page-title">My Dashboard</h1>
                    <p className="page-description">Welcome back! Here's your daily overview.</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937' }}>{formatTime(currentTime)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatDate(currentTime, getSetting('date_format'))}</div>
                </div>
            </div>

            {/* Personal Stats */}
            <div className="grid grid-cols-3" style={{ marginBottom: '1.5rem', gap: '1rem' }}>
                <div
                    className="card"
                    style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => navigate('/attendance')}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><FaClock /></div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: '700' }}>Attendance</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>View History</p>
                </div>

                <div
                    className="card"
                    style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => navigate('/leaves')}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><FaCalendarCheck /></div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: '700' }}>Leaves</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>Apply / Balance</p>
                </div>

                <div
                    className="card"
                    style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', color: 'white', cursor: 'pointer', transition: 'transform 0.2s' }}
                    onClick={() => navigate('/tasks')}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}><FaTasks /></div>
                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.25rem', fontWeight: '700' }}>My Tasks</h3>
                    <p style={{ fontSize: '0.9375rem', fontWeight: '500', opacity: 0.95 }}>View Pending</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Quick Actions</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => navigate('/attendance')}>
                        <FaClock /> Clock In/Out
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/leaves')}>
                        <FaCalendarCheck /> Apply Leave
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/my-payslips')}>
                        <FaFileInvoiceDollar /> View Payslips
                    </button>
                    <button className="btn btn-primary" onClick={() => navigate('/profile')}>
                        <FaUser /> My Profile
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
