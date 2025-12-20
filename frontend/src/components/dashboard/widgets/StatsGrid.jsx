import React, { memo } from 'react';
import { FaUsers, FaBuilding, FaClock, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import StatCard from './StatCard';

const StatsGrid = memo(({ stats }) => {
    const navigate = useNavigate();

    return (
        <div className="dashboard-stats-grid">
            <StatCard
                title="Total Employees"
                value={stats?.employees?.total || 0}
                icon={<FaUsers />}
                subtext={`${stats?.employees?.active || 0} Active`}
                colorClass="text-indigo-500 bg-indigo-50"
                onClick={() => navigate('/employees')}
            />
            <StatCard
                title="Departments"
                value={stats?.departments?.total || 0}
                icon={<FaBuilding />}
                colorClass="text-purple-500 bg-purple-50"
                onClick={() => navigate('/departments')}
            />
            <StatCard
                title="Present Today"
                value={stats?.attendance?.present || 0}
                icon={<FaClock />}
                subtext={`${stats?.attendance?.absent || 0} Absent`}
                colorClass="text-emerald-500 bg-emerald-50"
                onClick={() => navigate('/attendance')}
            />
            <StatCard
                title="Pending Leaves"
                value={stats?.leaves?.pending || 0}
                icon={<FaCalendarAlt />}
                subtext={`${stats?.leaves?.approved || 0} Approved`}
                colorClass="text-amber-500 bg-amber-50"
                onClick={() => navigate('/leaves')}
            />
        </div>
    );
});

export default StatsGrid;
