import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaUserPlus,
    FaCalendarPlus,
    FaTasks,
    FaFileAlt,
    FaMoneyBillWave,
    FaCog
} from 'react-icons/fa';

const QuickActions = memo(({ userRole }) => {
    const navigate = useNavigate();

    const actions = [
        {
            label: 'Add Employee',
            icon: <FaUserPlus />,
            path: '/employees',
            roles: ['admin', 'manager'],
            theme: 'info'
        },
        {
            label: 'Apply Leave',
            icon: <FaCalendarPlus />,
            path: '/leaves',
            roles: ['admin', 'manager', 'employee'],
            theme: 'success'
        },
        {
            label: 'Assign Task',
            icon: <FaTasks />,
            path: '/tasks',
            roles: ['admin', 'manager'],
            theme: 'warning'
        },
        {
            label: 'Payslips',
            icon: <FaMoneyBillWave />,
            path: '/payroll',
            roles: ['admin'],
            theme: 'danger' // using danger/red for finance distinction or define purple var
        },
        {
            label: 'My Payslips',
            icon: <FaMoneyBillWave />,
            path: '/my-payslips',
            roles: ['employee'],
            theme: 'danger'
        },
        {
            label: 'Settings',
            icon: <FaCog />,
            path: '/settings',
            roles: ['admin'],
            theme: 'secondary'
        }
    ];

    const visibleActions = actions.filter(action => action.roles.includes(userRole));

    const getThemeStyle = (theme) => {
        const map = {
            info: { backgroundColor: 'var(--info-bg)', color: 'var(--info-text)' },
            success: { backgroundColor: 'var(--success-bg)', color: 'var(--success-text)' },
            warning: { backgroundColor: 'var(--warning-bg)', color: 'var(--warning-text)' },
            danger: { backgroundColor: 'var(--danger-bg)', color: 'var(--danger-text)' },
            secondary: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' },
        };
        return map[theme] || map.info;
    };

    return (
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {visibleActions.map((action, index) => (
                <button
                    key={index}
                    onClick={() => navigate(action.path)}
                    className="btn"
                    style={{
                        backgroundColor: 'white',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-secondary)',
                        padding: '0.6rem 1rem',
                        boxShadow: 'var(--shadow-sm)'
                    }}
                >
                    <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '0.5rem',
                        color: action.theme === 'success' ? 'var(--success-color)' :
                            action.theme === 'info' ? 'var(--info-color)' :
                                action.theme === 'warning' ? 'var(--warning-color)' :
                                    action.theme === 'danger' ? 'var(--danger-color)' : 'var(--text-secondary)'
                    }}>
                        {action.icon}
                    </span>
                    {action.label}
                </button>
            ))}
        </div>
    );
});

export default QuickActions;
