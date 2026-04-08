import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaMapMarkerAlt, FaHistory, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
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
    const [location, setLocation] = useState(null);

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
        <div className="card h-full flex flex-col justify-between border-0 shadow-xl bg-white overflow-hidden group">
            {/* Header */}
            <div className="p-6 pb-0 flex justify-between items-start">
                <div>
                    <h3 className="text-xl font-black text-neutral-800 tracking-tight flex items-center gap-2">
                        Attendance
                        {status === 'in' && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>}
                    </h3>
                    <p className="text-xs text-neutral-400 font-bold uppercase tracking-widest mt-1">
                        {currentTime.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                    </p>
                </div>
                <button 
                    className="w-10 h-10 rounded-xl bg-neutral-50 text-neutral-400 hover:bg-primary-50 hover:text-primary-600 transition-all flex items-center justify-center border border-neutral-100" 
                    onClick={() => navigate('/attendance')}
                >
                    <FaHistory size={14} />
                </button>
            </div>

            {/* Timer Section */}
            <div className="flex flex-col items-center justify-center p-6 pt-2">
                <div className="text-5xl font-black text-neutral-800 mb-2 font-mono tracking-tighter tabular-nums">
                    {status === 'in' ? getDuration() : currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                
                <div className={`text-[10px] font-black uppercase tracking-[0.2em] mb-8 px-3 py-1 rounded-full border ${status === 'in' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-neutral-50 text-neutral-400 border-neutral-100'}`}>
                    {status === 'in' ? 'Shift Active' : 'Currently Offline'}
                </div>

                {/* Main Action Button */}
                <div className="relative group/btn">
                    <div className={`absolute -inset-4 rounded-full opacity-20 blur-xl transition-all duration-500 group-hover/btn:opacity-40 ${status === 'in' ? 'bg-red-500' : 'bg-primary-500'}`}></div>
                    <button
                        className={`relative rounded-full w-36 h-36 flex flex-col items-center justify-center transition-all border-8 shadow-2xl active:scale-95 ${status === 'in' ? 'bg-white border-red-50 text-red-600 hover:bg-red-50 hover:border-red-100' : 'bg-neutral-900 border-neutral-800 text-white hover:bg-black'}`}
                        onClick={handleClockAction}
                        disabled={loading}
                    >
                        <div className={`mb-2 p-3 rounded-2xl ${status === 'in' ? 'bg-red-50' : 'bg-neutral-800'}`}>
                            <FaClock size={24} className={status === 'in' ? 'text-red-500' : 'text-primary-400'} />
                        </div>
                        <span className="font-black text-xs uppercase tracking-widest">{loading ? '...' : (status === 'in' ? 'Clock Out' : 'Clock In')}</span>
                    </button>
                </div>

                {/* Shift Info */}
                <div className="mt-10 w-full grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100/50 transition-colors hover:bg-neutral-50">
                        <div className="text-[9px] text-neutral-400 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-primary-400"></div>
                            Today's Shift
                        </div>
                        <div className="text-sm font-bold text-neutral-700">{shiftData.start} - {shiftData.end}</div>
                    </div>
                    <div className="bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100/50 transition-colors hover:bg-neutral-50">
                        <div className="text-[9px] text-neutral-400 uppercase font-black tracking-widest mb-1.5 flex items-center gap-1.5">
                            <div className="w-1 h-1 rounded-full bg-orange-400"></div>
                            Efficiency
                        </div>
                        <div className={`text-sm font-bold ${status === 'in' ? 'text-green-600' : 'text-neutral-700'}`}>
                            {status === 'in' ? 'Excellent' : '--'}
                        </div>
                    </div>
                </div>

                {/* Footer / Geolocation Status */}
                <div className="mt-6 w-full flex items-center justify-center gap-3 py-2 px-4 bg-neutral-900 rounded-xl border border-neutral-800 shadow-inner">
                    {location ? (
                        <>
                            <div className="flex h-2 w-2 relative">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                            </div>
                            <span className="text-[10px] font-bold text-neutral-300 uppercase tracking-widest flex items-center gap-2">
                                GPS Secure: <span className="text-primary-400 font-mono text-[11px]">{location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}</span>
                            </span>
                        </>
                    ) : (
                        <>
                            <FaMapMarkerAlt className="text-neutral-600" size={10} />
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
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
