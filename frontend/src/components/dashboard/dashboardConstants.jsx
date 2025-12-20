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
    FaCalendarAlt
} from 'react-icons/fa';

export const QUICK_ACTIONS_CONFIG = [
    {
        id: 'action-add-employee',
        label: 'Add Employee',
        icon: <FaUserPlus />,
        path: '/employees',
        roles: ['admin', 'manager'],
        theme: 'info'
    },
    {
        id: 'action-apply-leave',
        label: 'Apply Leave',
        icon: <FaCalendarPlus />,
        path: '/leaves',
        roles: ['admin', 'manager', 'employee'],
        theme: 'success'
    },
    {
        id: 'action-assign-task',
        label: 'Assign Task',
        icon: <FaTasks />,
        path: '/tasks',
        roles: ['admin', 'manager'],
        theme: 'warning'
    },
    {
        id: 'action-payroll',
        label: 'Payslips',
        icon: <FaMoneyBillWave />,
        path: '/payroll',
        roles: ['admin'],
        theme: 'danger'
    },
    {
        id: 'action-my-payslips',
        label: 'My Payslips',
        icon: <FaMoneyBillWave />,
        path: '/my-payslips',
        roles: ['employee'],
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
        getSubtext: (stats) => `${stats?.employees?.active || 0} Active`
    },
    {
        id: 'stat-departments',
        title: 'Departments',
        icon: <FaBuilding />,
        colorClass: 'text-info-600 bg-info-50',
        path: '/departments',
        getValue: (stats) => stats?.departments?.total || 0
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
        getSubtext: (stats) => `${stats?.leaves?.approved || 0} Approved`
    }
];
