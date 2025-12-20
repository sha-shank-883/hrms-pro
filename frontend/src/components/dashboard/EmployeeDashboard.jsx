import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/settingsHelper';
import ClockInWidget from './widgets/ClockInWidget';
import LeaveBalanceWidget from './widgets/LeaveBalanceWidget';
import TimelineWidget from './widgets/TimelineWidget';
import TeamWidget from './widgets/TeamWidget';
import { FaFileInvoiceDollar, FaCalendarAlt, FaUserEdit } from 'react-icons/fa';
import { employeeService } from '../../services';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [upcomingHolidays, setUpcomingHolidays] = useState([]);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                if (user?.userId) {
                    const { employeeService, holidayService } = await import('../../services');
                    const [empRes, holRes] = await Promise.all([
                        employeeService.getByUserId(user.userId),
                        holidayService.getAll(new Date().getFullYear())
                    ]);

                    setEmployeeData(empRes.data);

                    // Filter for upcoming holidays (today or future)
                    if (holRes.success && Array.isArray(holRes.data)) {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const futureHolidays = holRes.data
                            .filter(h => new Date(h.date) >= today)
                            .sort((a, b) => new Date(a.date) - new Date(b.date))
                            .slice(0, 2); // Take next 2
                        setUpcomingHolidays(futureHolidays);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchDashboardData();
    }, [user]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    return (
        <div className="page-container max-w-none mx-0 px-0 md:px-4 lg:px-6">
            {/* Header Section - More Compact */}
            <div className="page-header pb-3" style={{ alignItems: 'flex-end' }}>
                <div>
                    <h1 className="page-title text-xl">
                        {getGreeting()}, {user?.first_name}!
                    </h1>
                    <p className="text-neutral-500 font-medium text-xs">
                        {formatDate(new Date(), 'DD MMMM YYYY')} &bull; Welcome to your dashboard
                    </p>
                </div>
                <div className="hidden md:flex gap-1.5">
                    <button className="btn btn-secondary btn-xs" onClick={() => navigate('/profile')}>
                        <FaUserEdit className="text-xs" /> Update Profile
                    </button>
                </div>
            </div>

            {/* Dashboard Grid - More Compact */}
            <div className="grid grid-cols-4 gap-4">
                {/* Left Column - Attendance & Tasks */}
                <div className="space-y-4">
                    <ClockInWidget employeeData={employeeData} />
                    <TeamWidget employeeData={employeeData} />
                </div>

                {/* Middle Column - Timeline & Feed */}
                <div className="space-y-4">
                    <TimelineWidget />

                    {/* Quick Links Card - More Compact */}
                    <div className="card">
                        <div className="card-header mb-3">
                            <h3 className="card-title text-sm">Quick Actions</h3>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            <div
                                className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-100 transition-colors group"
                                onClick={() => navigate('/my-payslips')}
                            >
                                <div className="p-2 rounded-full bg-primary-50 text-primary-600 mb-2 group-hover:bg-primary-100 transition-colors">
                                    <FaFileInvoiceDollar className="text-base" />
                                </div>
                                <span className="text-sm font-semibold text-neutral-700">Payslips</span>
                            </div>
                            <div
                                className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 flex flex-col items-center justify-center cursor-pointer hover:bg-neutral-100 transition-colors group"
                                onClick={() => navigate('/leaves')}
                            >
                                <div className="p-2 rounded-full bg-warning-50 text-warning mb-2 group-hover:bg-warning-100 transition-colors">
                                    <FaCalendarAlt className="text-base" />
                                </div>
                                <span className="text-sm font-semibold text-neutral-700">Leave Calendar</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Stats & Personal */}
                <div className="space-y-4">
                    <LeaveBalanceWidget employeeData={employeeData} />

                    {/* Upcoming Holidays Widget - More Compact */}
                    <div className="card border-t-4 border-t-primary-600">
                        <div className="card-header">
                            <h3 className="card-title text-neutral-800 text-sm">Upcoming Holidays</h3>
                            <span className="text-xs font-semibold px-2 py-1 bg-neutral-100 rounded text-neutral-600">{new Date().getFullYear()}</span>
                        </div>

                        {upcomingHolidays.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingHolidays.map(holiday => (
                                    <div key={holiday.holiday_id} className="flex items-center gap-3 p-2 rounded-lg border border-neutral-100 hover:border-primary-100 hover:bg-primary-50 transition-all">
                                        <div className="w-10 h-10 rounded-lg bg-primary-50 flex flex-col items-center justify-center text-primary-600 border border-primary-100">
                                            <span className="text-base font-bold leading-none">{new Date(holiday.date).getDate()}</span>
                                            <span className="text-xs font-bold uppercase tracking-wide">{new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-neutral-800 m-0 text-sm">{holiday.name}</p>
                                            <p className="text-xs text-neutral-500 font-medium m-0">{new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'long' })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-neutral-500 italic py-3 text-center bg-neutral-50 rounded-lg">
                                No upcoming holidays found.
                            </div>
                        )}

                        <div className="mt-4 pt-3 border-t border-neutral-100 text-center">
                            <button
                                onClick={() => navigate('/leaves')}
                                className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline uppercase tracking-wide">
                                View Full Holiday Calendar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
