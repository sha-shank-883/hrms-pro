import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaClock, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { attendanceService } from '../../../services';

const AttendanceCalendarWidget = ({ employeeData }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeData?.employee_id) {
            fetchMonthlyAttendance(currentDate);
        }
    }, [employeeData, currentDate]);

    const fetchMonthlyAttendance = async (date) => {
        setLoading(true);
        try {
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            const startStr = startOfMonth.toISOString().split('T')[0];
            const endStr = endOfMonth.toISOString().split('T')[0];

            const response = await attendanceService.getAll({
                employee_id: employeeData.employee_id,
                start_date: startStr,
                end_date: endStr
            });

            if (response.success && response.data) {
                setAttendanceData(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch attendance calendar data', error);
        } finally {
            setLoading(false);
        }
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    // Calendar generation
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    const getAttendanceForDate = (date) => {
        if (!date) return null;
        const dateStr = date.toISOString().split('T')[0];
        return attendanceData.find(a => a.date.split('T')[0] === dateStr);
    };

    const formatTime = (timeString) => {
        if (!timeString) return '--:--';
        // Handle "HH:MM:SS"
        const [hours, minutes] = timeString.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        const formattedH = h % 12 || 12;
        return `${formattedH}:${minutes} ${ampm}`;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-4 md:p-6 h-full flex flex-col overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-neutral-900 tracking-tight text-lg">My Attendance</h3>
                    <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mt-1">Monthly Calendar</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={prevMonth} className="p-2 rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-colors">
                        <FaChevronLeft size={12} />
                    </button>
                    <span className="text-sm font-bold w-24 text-center text-neutral-800">
                        {currentDate.toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </span>
                    <button onClick={nextMonth} className="p-2 rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-colors">
                        <FaChevronRight size={12} />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black uppercase tracking-widest text-neutral-400 py-2">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {days.map((date, index) => {
                    if (!date) return <div key={`empty-${index}`} className="h-20 bg-neutral-50/50 rounded-xl border border-neutral-50"></div>;

                    const record = getAttendanceForDate(date);
                    const isToday = new Date().toDateString() === date.toDateString();
                    const isFuture = date > new Date();
                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                    let bgClass = "bg-white border-neutral-100";
                    let statusIcon = null;

                    if (record) {
                        if (record.status === 'present') {
                            bgClass = "bg-green-50/50 border-green-100";
                            statusIcon = <FaCheckCircle className="text-green-500" size={10} />;
                        } else if (record.status === 'absent') {
                            bgClass = "bg-red-50/50 border-red-100";
                            statusIcon = <FaTimesCircle className="text-red-500" size={10} />;
                        } else if (record.status === 'half-day') {
                            bgClass = "bg-amber-50/50 border-amber-100";
                            statusIcon = <FaClock className="text-amber-500" size={10} />;
                        }
                    } else if (isWeekend && !isFuture) {
                        bgClass = "bg-neutral-50 border-neutral-100";
                    }

                    if (isToday) {
                        bgClass += " ring-2 ring-primary-500 ring-offset-1";
                    }

                    return (
                        <div key={index} className={`relative flex flex-col min-h-[60px] md:min-h-[80px] rounded-xl border p-1 md:p-2 transition-all hover:shadow-sm overflow-hidden ${bgClass}`}>
                            <div className="flex justify-between items-start">
                                <span className={`text-xs md:text-sm font-bold ${isToday ? 'text-primary-600' : (isWeekend ? 'text-neutral-400' : 'text-neutral-700')}`}>
                                    {date.getDate()}
                                </span>
                                <div className="hidden sm:block">{statusIcon}</div>
                            </div>
                            
                            <div className="mt-auto">
                                {record && record.clock_in ? (
                                    <div className="flex flex-col gap-0.5 mt-1">
                                        <div className="text-[8px] md:text-[9px] font-bold text-neutral-600 truncate bg-white/60 px-1 rounded">
                                            In: {formatTime(record.clock_in)}
                                        </div>
                                        {record.clock_out && (
                                            <div className="text-[8px] md:text-[9px] font-bold text-neutral-500 truncate bg-white/60 px-1 rounded">
                                                Out: {formatTime(record.clock_out)}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    (!isFuture && !isWeekend && !record && date < new Date()) && (
                                        <div className="text-[8px] md:text-[9px] font-bold text-red-400 mt-1">Missing</div>
                                    )
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 flex flex-wrap gap-4 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Present</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Half Day</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Absent</span>
                </div>
                <div className="flex items-center gap-1.5 ml-auto">
                    <span className="w-3 h-3 rounded border-2 border-primary-500"></span>
                    <span className="text-[10px] font-bold text-neutral-600 uppercase tracking-wider">Today</span>
                </div>
            </div>
        </div>
    );
};

export default AttendanceCalendarWidget;
