import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaMapMarkerAlt, FaHistory } from 'react-icons/fa';
import { attendanceService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';


const ClockInWidget = ({ employeeData }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [status, setStatus] = useState('out'); // 'in', 'out'
    const [loading, setLoading] = useState(false);
    const [todayRecord, setTodayRecord] = useState(null);
    const [shiftData, setShiftData] = useState({ start: '09:00 AM', end: '06:00 PM' });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (employeeData) {
            checkAttendanceStatus();
        }
    }, [employeeData]);

    const checkAttendanceStatus = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await attendanceService.getAll({
                employee_id: employeeData.employee_id,
                date: today
            });

            // Assuming response.data is array. Use the first record found for today.
            if (response.data && response.data.length > 0) {
                const record = response.data[0];
                setTodayRecord(record);
                if (record.clock_in_time && !record.clock_out_time) {
                    setStatus('in');
                } else if (record.clock_in_time && record.clock_out_time) {
                    setStatus('out'); // Already clocked out for the day? Or just currently out.
                    // If multiple check-ins are allowed, we need to check if latest is open.
                    // For now, simple logic: if last record is closed, user is 'out'.
                }
            } else {
                setStatus('out');
                setTodayRecord(null);
            }
        } catch (error) {
            console.error("Failed to fetch attendance status", error);
        }
    };

    const handleClockAction = async () => {
        if (!employeeData) return;
        setLoading(true);
        try {
            if (status === 'out') {
                // Clock In
                await attendanceService.clockIn(employeeData.employee_id);
                setStatus('in');
            } else {
                // Clock Out
                await attendanceService.clockOut(employeeData.employee_id);
                setStatus('out');
            }
            await checkAttendanceStatus(); // Refresh status
        } catch (error) {
            console.error("Clock action failed", error);
            alert("Failed to update attendance: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Calculate duration if clocked in
    const getDuration = () => {
        if (status === 'in' && todayRecord?.clock_in_time) {
            const start = new Date(todayRecord.clock_in_time);
            const diff = currentTime - start;
            if (diff < 0) return "00:00:00";

            const hours = Math.floor(diff / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
        return "00:00:00";
    };

    return (
        <div className="card h-full flex flex-col justify-between">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h3 className="text-lg font-bold text-neutral-800">Attendance</h3>
                    <p className="text-xs text-neutral-500 font-medium mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}</p>
                </div>
                <button className="p-2 text-neutral-400 hover:text-primary-600 transition-colors rounded-full hover:bg-neutral-50" onClick={() => navigate('/attendance')} title="View History">
                    <FaHistory />
                </button>
            </div>

            <div className="flex flex-col items-center justify-center flex-grow">
                <div className="text-4xl font-bold text-neutral-800 mb-2 font-mono tracking-wider">
                    {status === 'in' ? getDuration() : currentTime.toLocaleTimeString('en-US', { hour12: false })}
                </div>
                <div className="text-sm font-medium text-neutral-500 mb-8 flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${status === 'in' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-neutral-300'}`}></span>
                    {status === 'in' ? 'Clocked In' : 'Clocked Out'}
                </div>

                <button
                    className={`rounded-full w-32 h-32 flex flex-col items-center justify-center transition-all shadow-lg hover:shadow-xl active:scale-95 border-4 ${status === 'in' ? 'bg-white border-red-500 text-red-600 hover:bg-red-50' : 'bg-primary-600 border-primary-200 text-white hover:bg-primary-700'}`}
                    onClick={handleClockAction}
                    disabled={loading}
                >
                    <FaClock size={28} className="mb-2" />
                    <span className="font-semibold">{loading ? '...' : (status === 'in' ? 'Clock Out' : 'Clock In')}</span>
                </button>

                <div className="mt-8 w-full grid grid-cols-2 gap-4 text-center">
                    <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                        <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Shift</div>
                        <div className="text-sm font-semibold text-neutral-700">{shiftData.start} - {shiftData.end}</div>
                    </div>
                    <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                        <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-1">Status</div>
                        <div className={`text-sm font-semibold ${status === 'in' ? 'text-green-600' : 'text-neutral-700'}`}>
                            {status === 'in' ? 'On Time' : '-'}
                        </div>
                    </div>
                </div>

                <div className="mt-4 text-xs text-neutral-400 flex items-center gap-1 font-medium">
                    <FaMapMarkerAlt /> Office (Bangalore)
                </div>
            </div>
        </div>
    );
};

export default ClockInWidget;
