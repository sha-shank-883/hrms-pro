import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaMapMarkerAlt, FaHistory, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { attendanceService, shiftService } from '../../../services';
import { useAuth } from '../../../context/AuthContext';

const ClockInWidget = ({ employeeData }) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [status, setStatus] = useState('out'); // 'in', 'out'
    const [loading, setLoading] = useState(false);
    const [todayRecord, setTodayRecord] = useState(null);
    const [shiftData, setShiftData] = useState({ start: '--:--', end: '--:--' });
    const [location, setLocation] = useState(null);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (employeeData) {
            checkAttendanceStatus();
            fetchShiftData();
        }
    }, [employeeData]);

    const fetchShiftData = async () => {
        try {
            // Get shift assignments for this employee
            const response = await shiftService.getAssignments({ employee_id: employeeData.employee_id });
            if (response.success && response.data && response.data.length > 0) {
                // Find current active shift (or the first one as fallback)
                const currentShift = response.data[0]; 
                
                // Format the time (usually HH:MM:SS from db)
                const formatTime = (timeStr) => {
                    if (!timeStr) return '--:--';
                    const [hours, minutes] = timeStr.split(':');
                    const h = parseInt(hours);
                    const ampm = h >= 12 ? 'PM' : 'AM';
                    const formattedH = h % 12 || 12;
                    return `${formattedH}:${minutes} ${ampm}`;
                };

                setShiftData({
                    start: formatTime(currentShift.start_time),
                    end: formatTime(currentShift.end_time)
                });
            } else {
                setShiftData({ start: '09:00 AM', end: '06:00 PM' }); // Default fallback
            }
        } catch (error) {
            console.error("Failed to fetch shift assignments", error);
            setShiftData({ start: '09:00 AM', end: '06:00 PM' }); // Default fallback
        }
    };

    const checkAttendanceStatus = async () => {
        try {
            const today = new Date().toISOString().split('T')[0];
            const response = await attendanceService.getAll({
                employee_id: employeeData.employee_id,
                start_date: today,
                end_date: today
            });

            if (response.success && response.data && response.data.length > 0) {
                const record = response.data[0];
                setTodayRecord(record);
                if (record.clock_in && !record.clock_out) {
                    setStatus('in');
                } else {
                    setStatus('out');
                }
            } else {
                setStatus('out');
                setTodayRecord(null);
            }
        } catch (error) {
            console.error("Failed to fetch attendance status", error);
        }
    };

    const getCoordinates = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({ latitude: null, longitude: null });
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const coords = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    setLocation(coords);
                    resolve(coords);
                },
                (error) => {
                    console.warn("Geolocation warning:", error);
                    resolve({ latitude: null, longitude: null });
                },
                { timeout: 10000, maximumAge: 60000 }
            );
        });
    };

    const handleClockAction = async () => {
        if (!employeeData) return;
        setLoading(true);
        try {
            const { latitude, longitude } = await getCoordinates();
            if (status === 'out') {
                await attendanceService.clockIn(employeeData.employee_id, latitude, longitude);
            } else {
                await attendanceService.clockOut(employeeData.employee_id, latitude, longitude);
            }
            await checkAttendanceStatus();
        } catch (error) {
            console.error("Clock action failed", error);
            const msg = error.response?.data?.message || error.message;
            alert("Failed to update attendance: " + msg);
        } finally {
            setLoading(false);
        }
    };

    const getDuration = () => {
        if (status === 'in' && todayRecord?.clock_in) {
            const [hours, minutes, seconds] = todayRecord.clock_in.split(':').map(Number);
            const start = new Date();
            start.setHours(hours, minutes, seconds, 0);
            const diff = currentTime - start;
            if (diff < 0) return "00:00:00";

            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        }
        return "00:00:00";
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 h-full flex flex-col justify-between overflow-hidden relative">
            {/* Header */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-600"></div>
            <div className="p-6 pb-0 flex justify-between items-start">
                <div>
                    <h3 className="text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
                        Time & Attendance
                        {status === 'in' && <span className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse ring-4 ring-green-50"></span>}
                    </h3>
                    <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mt-1.5">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                </div>
                <button 
                    className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-500 hover:bg-primary-50 hover:text-primary-600 transition-colors flex items-center justify-center border border-neutral-200 shadow-sm" 
                    onClick={() => navigate('/attendance')}
                    title="View History"
                >
                    <FaHistory size={14} />
                </button>
            </div>

            {/* Timer Section */}
            <div className="flex flex-col items-center justify-center p-6 flex-1">
                <div className="text-5xl font-black text-neutral-900 mb-3 font-mono tracking-tight tabular-nums">
                    {status === 'in' ? getDuration() : currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                
                <div className={`text-xs font-bold uppercase tracking-widest mb-8 px-4 py-1.5 rounded-full border ${status === 'in' ? 'bg-green-50 text-green-700 border-green-200 shadow-sm' : 'bg-neutral-50 text-neutral-500 border-neutral-200'}`}>
                    {status === 'in' ? 'Shift Active' : 'Currently Offline'}
                </div>

                {/* Main Action Button */}
                <div className="relative group">
                    <div className={`absolute -inset-4 rounded-full opacity-20 blur-2xl transition-all duration-700 group-hover:opacity-40 ${status === 'in' ? 'bg-red-500' : 'bg-primary-500'}`}></div>
                    <button
                        className={`relative rounded-full w-40 h-40 flex flex-col items-center justify-center transition-all duration-300 border-[12px] shadow-xl hover:-translate-y-1 ${status === 'in' ? 'bg-white border-red-50 text-red-600 hover:border-red-100 hover:shadow-red-100' : 'bg-neutral-900 border-neutral-800 text-white hover:bg-black hover:border-neutral-900'}`}
                        onClick={handleClockAction}
                        disabled={loading}
                    >
                        <div className={`mb-3 p-4 rounded-2xl transition-colors ${status === 'in' ? 'bg-red-50' : 'bg-neutral-800'}`}>
                            <FaClock size={28} className={status === 'in' ? 'text-red-500' : 'text-primary-400'} />
                        </div>
                        <span className="font-bold text-sm tracking-wider">{loading ? 'Processing...' : (status === 'in' ? 'CLOCK OUT' : 'CLOCK IN')}</span>
                    </button>
                </div>

                {/* Shift Info */}
                <div className="mt-10 w-full grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 transition-colors hover:bg-white hover:shadow-sm">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-400"></div>
                            Today's Shift
                        </div>
                        <div className="text-sm font-semibold text-neutral-800">{shiftData.start} - {shiftData.end}</div>
                    </div>
                    <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 transition-colors hover:bg-white hover:shadow-sm">
                        <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-2 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                            Efficiency
                        </div>
                        <div className={`text-sm font-semibold ${status === 'in' ? 'text-green-600 flex items-center gap-1' : 'text-neutral-500'}`}>
                            {status === 'in' ? <><FaCheckCircle size={12}/> Excellent</> : '--'}
                        </div>
                    </div>
                </div>

                {/* Footer / Geolocation Status */}
                <div className="mt-6 w-full flex items-center justify-center gap-3 py-3 px-4 bg-neutral-900 rounded-xl shadow-inner">
                    {location ? (
                        <>
                            <div className="flex h-2.5 w-2.5 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-500"></span>
                            </div>
                            <span className="text-[11px] font-semibold text-neutral-300 uppercase tracking-widest flex items-center gap-2">
                                GPS Secure: <span className="text-primary-400 font-mono tracking-tight">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                            </span>
                        </>
                    ) : (
                        <>
                            <FaMapMarkerAlt className="text-neutral-500" size={12} />
                            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-widest">
                                Geofence: Ready to sync
                            </span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClockInWidget;
