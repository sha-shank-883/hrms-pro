import React from 'react';
import {
    FaUserPlus,
    FaCalendarPlus,
    FaTasks,
    FaMoneyBillWave,
    FaCog,
    FaUsers,
    FaBuilding,
    FaClock,
    FaCalendarAlt,
    FaGlobe,
    FaCogs,
    FaFileAlt,
    FaEnvelope,
    FaHistory,
    FaChartBar,
    FaPlane,
    FaComments,
    FaBoxOpen,
    FaChartLine,
    FaCreditCard,
    FaShieldAlt
} from 'react-icons/fa';

export const QUICK_ACTIONS_CONFIG = [
    {
        id: 'action-add-employee',
        label: 'Employees',
        icon: <FaUsers />,
        path: '/employees',
        roles: ['admin', 'manager'],
        module: 'core_hr',
        theme: 'info'
    },
    {
        id: 'action-attendance',
        label: 'Attendance',
        icon: <FaClock />,
        path: '/attendance',
        roles: ['admin', 'manager', 'employee'],
        module: 'attendance',
        theme: 'success'
    },
    {
        id: 'action-apply-leave',
        label: 'Leaves',
        icon: <FaPlane />,
        path: '/leaves',
        roles: ['admin', 'manager', 'employee'],
        module: 'leaves',
        theme: 'warning'
    },
    {
        id: 'action-assign-task',
        label: 'Tasks',
        icon: <FaTasks />,
        path: '/tasks',
        roles: ['admin', 'manager', 'employee'],
        module: 'tasks',
        theme: 'primary'
    },
    {
        id: 'action-payroll',
        label: 'Payroll',
        icon: <FaMoneyBillWave />,
        path: '/payroll',
        roles: ['admin', 'manager'],
        module: 'payroll',
        theme: 'danger'
    },
    {
        id: 'action-performance',
        label: 'Performance',
        icon: <FaChartLine />,
        path: '/performance',
        roles: ['admin', 'manager'],
        module: 'performance',
        theme: 'primary'
    },
    {
        id: 'action-chat',
        label: 'Team Chat',
        icon: <FaComments />,
        path: '/chat',
        roles: ['admin', 'manager', 'employee'],
        module: 'chat',
        theme: 'info'
    },
    {
        id: 'action-recruitment',
        label: 'Recruitment',
        icon: <FaUserPlus />,
        path: '/recruitment',
        roles: ['admin', 'manager'],
        module: 'recruitment',
        theme: 'success'
    },
    {
        id: 'action-documents',
        label: 'Documents',
        icon: <FaFileAlt />,
        path: '/documents',
        roles: ['admin', 'manager', 'employee'],
        module: 'documents',
        theme: 'secondary'
    },
    {
        id: 'action-assets',
        label: 'Assets',
        icon: <FaBoxOpen />,
        path: '/assets',
        roles: ['admin', 'manager'],
        module: 'assets',
        theme: 'warning'
    },
    {
        id: 'action-reports',
        label: 'Reports',
        icon: <FaChartBar />,
        path: '/reports',
        roles: ['admin', 'manager'],
        module: 'reports_analytics',
        theme: 'info'
    },
    {
        id: 'action-billing',
        label: 'Billing & Plan',
        icon: <FaCreditCard />,
        path: '/settings?tab=billing',
        roles: ['admin'],
        theme: 'danger'
    },
    {
        id: 'action-settings',
        label: 'Settings',
        icon: <FaCog />,
        path: '/settings',
        roles: ['admin'],
        theme: 'secondary'
    }
];

export const STATS_CONFIG = [
    {
        id: 'stat-employees',
        title: 'Total Employees',
        icon: <FaUsers />,
        colorClass: 'text-primary-600 bg-primary-50',
        path: '/employees',
        getValue: (stats) => stats?.employees?.total || 0,
        getSubtext: (stats) => `${stats?.employees?.active || 0} Active Staff`
    },
    {
        id: 'stat-attendance',
        title: 'Present Today',
        icon: <FaClock />,
        colorClass: 'text-success bg-success-50',
        path: '/attendance',
        getValue: (stats) => stats?.attendance?.present || 0,
        getSubtext: (stats) => `${stats?.attendance?.absent || 0} Absent`
    },
    {
        id: 'stat-leaves',
        title: 'Pending Leaves',
        icon: <FaCalendarAlt />,
        colorClass: 'text-warning bg-warning-50',
        path: '/leaves',
        getValue: (stats) => stats?.leaves?.pending || 0,
        getSubtext: (stats) => `${stats?.leaves?.approved || 0} Approved this month`
    },
    {
        id: 'stat-departments',
        title: 'Departments',
        icon: <FaBuilding />,
        colorClass: 'text-info-600 bg-info-50',
        path: '/departments',
        getValue: (stats) => stats?.departments?.total || 0,
        getSubtext: (stats) => 'Active Organization Units'
    }
];
