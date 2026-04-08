import React, { useState, useEffect } from 'react';
import { shiftService, employeeService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { FaPlus, FaTrash, FaCalendarAlt, FaClock } from 'react-icons/fa';

const ShiftsTab = () => {
    const { user } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);

    // Form states
    const [shiftForm, setShiftForm] = useState({ shift_name: '', start_time: '', end_time: '' });
    const [assignmentForm, setAssignmentForm] = useState({ employee_id: '', shift_id: '', start_date: '', end_date: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [shiftsRes, assignRes, empRes] = await Promise.all([
                shiftService.getAllShifts(),
                shiftService.getAssignments(),
                employeeService.getAll()
            ]);
            if (shiftsRes.success) setShifts(shiftsRes.data);
            if (assignRes.success) setAssignments(assignRes.data);
            setEmployees(empRes.data || []);
        } catch (error) {
            console.error('Failed to load shift data', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShift = async (e) => {
        e.preventDefault();
        try {
            await shiftService.createShift(shiftForm);
            setShiftForm({ shift_name: '', start_time: '', end_time: '' });
            loadData();
        } catch (error) {
            alert('Failed to create shift');
        }
    };

    const handleDeleteShift = async (id) => {
        if (!window.confirm('Delete this shift profile?')) return;
        try {
            await shiftService.deleteShift(id);
            loadData();
        } catch (error) {
            alert('Failed to delete shift');
        }
    };

    const handleAssignShift = async (e) => {
        e.preventDefault();
        try {
            await shiftService.assignShift(assignmentForm);
            setAssignmentForm({ employee_id: '', shift_id: '', start_date: '', end_date: '' });
            loadData();
        } catch (error) {
            alert('Failed to assign shift');
        }
    };

    const handleDeleteAssignment = async (id) => {
        if (!window.confirm('Remove this assignment?')) return;
        try {
            await shiftService.deleteAssignment(id);
            loadData();
        } catch (error) {
            alert('Failed to remove assignment');
        }
    };

    const isAssignmentActive = (start, end) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startDate = new Date(start);
        startDate.setHours(0, 0, 0, 0);
        if (end) {
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999);
            return today >= startDate && today <= endDate;
        }
        return today >= startDate;
    };

    return (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
            {/* Shift Definitions */}
            <div className="lg:col-span-5 space-y-6">
                <div className="card border-0 shadow-sm overflow-hidden">
                    <div className="p-5 bg-neutral-900 border-b border-neutral-800">
                        <h3 className="text-white text-lg font-bold flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
                                <FaClock size={16} />
                            </div>
                            Shift Profiles
                        </h3>
                    </div>
                    
                    <div className="p-6">
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                            <form onSubmit={handleCreateShift} className="mb-8 p-5 bg-neutral-50 rounded-xl border border-neutral-200">
                                <h4 className="text-sm font-bold text-neutral-800 mb-4 uppercase tracking-wider">New Profile</h4>
                                <div className="grid grid-cols-2 gap-5 mb-5">
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-bold text-neutral-400 uppercase mb-1 block">Shift Name</label>
                                        <input type="text" className="form-input bg-white" required value={shiftForm.shift_name} onChange={e => setShiftForm({...shiftForm, shift_name: e.target.value})} placeholder="e.g. Night Shift" />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-neutral-400 uppercase mb-1 block">Start Time</label>
                                        <input type="time" className="form-input bg-white" required value={shiftForm.start_time} onChange={e => setShiftForm({...shiftForm, start_time: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-neutral-400 uppercase mb-1 block">End Time</label>
                                        <input type="time" className="form-input bg-white" required value={shiftForm.end_time} onChange={e => setShiftForm({...shiftForm, end_time: e.target.value})} />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-primary w-full shadow-lg shadow-primary-200 py-3 font-bold transition-all hover:scale-[1.01] active:scale-95">
                                    <FaPlus className="mr-2" /> Save Profile
                                </button>
                            </form>
                        )}

                        <div className="space-y-4">
                            {shifts.map(shift => (
                                <div key={shift.shift_id} className="group flex justify-between items-center p-4 bg-white border border-neutral-100 rounded-xl hover:border-primary-300 hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-neutral-50 text-neutral-400 flex items-center justify-center group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                            <FaClock size={14} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-neutral-800 text-base">{shift.shift_name}</div>
                                            <div className="text-sm font-mono font-medium text-primary-600">{shift.start_time.substring(0, 5)} - {shift.end_time.substring(0, 5)}</div>
                                        </div>
                                    </div>
                                    {(user?.role === 'admin' || user?.role === 'manager') && (
                                        <button onClick={() => handleDeleteShift(shift.shift_id)} className="text-neutral-300 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                            <FaTrash size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                            {shifts.length === 0 && (
                                <div className="text-center py-10 px-4 border-2 border-dashed border-neutral-100 rounded-2xl bg-neutral-50/50">
                                    <div className="text-neutral-300 mb-3 flex justify-center"><FaClock size={40} /></div>
                                    <h5 className="text-neutral-500 font-bold">No shifts created</h5>
                                    <p className="text-xs text-neutral-400 mt-1">Start by defining your organization's working hours.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Shift Assignments */}
            <div className="lg:col-span-7 space-y-6">
                <div className="card border-0 shadow-sm overflow-hidden">
                    <div className="p-5 bg-neutral-900 border-b border-neutral-800">
                        <h3 className="text-white text-lg font-bold flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
                                <FaCalendarAlt size={16} />
                            </div>
                            Operational Roster
                        </h3>
                    </div>

                    <div className="p-6">
                        {(user?.role === 'admin' || user?.role === 'manager') && (
                            <form onSubmit={handleAssignShift} className="mb-8 p-5 bg-neutral-50 rounded-xl border border-neutral-200">
                                <h4 className="text-sm font-bold text-neutral-800 mb-4 uppercase tracking-wider">Assign Schedule</h4>
                                <div className="grid grid-cols-2 gap-5 mb-5">
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-bold text-neutral-400 uppercase mb-1 block">Employee</label>
                                        <select className="form-select bg-white" required value={assignmentForm.employee_id} onChange={e => setAssignmentForm({...assignmentForm, employee_id: e.target.value})}>
                                            <option value="">Select Employee</option>
                                            {employees.map(emp => <option key={emp.employee_id} value={emp.employee_id}>{emp.first_name} {emp.last_name}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[11px] font-bold text-neutral-400 uppercase mb-1 block">Shift Profile</label>
                                        <select className="form-select bg-white" required value={assignmentForm.shift_id} onChange={e => setAssignmentForm({...assignmentForm, shift_id: e.target.value})}>
                                            <option value="">Select Shift</option>
                                            {shifts.map(shift => <option key={shift.shift_id} value={shift.shift_id}>{shift.shift_name} ({shift.start_time.substring(0,5)} - {shift.end_time.substring(0,5)})</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-neutral-400 uppercase mb-1 block">Start Date</label>
                                        <input type="date" className="form-input bg-white text-sm" required value={assignmentForm.start_date} onChange={e => setAssignmentForm({...assignmentForm, start_date: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-bold text-neutral-400 uppercase mb-1 block">End Date (Optional)</label>
                                        <input type="date" className="form-input bg-white text-sm" value={assignmentForm.end_date} onChange={e => setAssignmentForm({...assignmentForm, end_date: e.target.value})} />
                                    </div>
                                </div>
                                <button type="submit" className="btn btn-warning w-full shadow-lg shadow-orange-100 py-3 font-bold transition-all hover:scale-[1.01] active:scale-95 text-white">
                                    <FaPlus className="mr-2" /> Save Assignment
                                </button>
                            </form>
                        )}

                        <div className="grid sm:grid-cols-2 gap-4">
                            {assignments.map(assign => {
                                const active = isAssignmentActive(assign.start_date, assign.end_date);
                                return (
                                    <div key={assign.assignment_id} className={`group p-4 border rounded-2xl relative transition-all hover:shadow-lg ${active ? 'bg-white border-primary-200 ring-1 ring-primary-50' : 'bg-neutral-50 border-neutral-100 opacity-80'}`}>
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="font-bold text-neutral-800">{assign.employee_name}</div>
                                            {active && (
                                                <span className="px-2 py-0.5 bg-green-500 text-[9px] text-white font-black uppercase tracking-widest rounded-full animate-pulse">Active</span>
                                            )}
                                        </div>
                                        <div className="text-sm text-primary-700 font-bold mb-3 flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-600"></div>
                                            {assign.shift_name}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-neutral-400 font-bold bg-neutral-100/50 p-2 rounded-lg">
                                            <FaCalendarAlt size={10} className="shrink-0" />
                                            <span className="truncate">
                                                {new Date(assign.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                {assign.end_date ? ` → ${new Date(assign.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ' (Ongoing)'}
                                            </span>
                                        </div>
                                        
                                        {(user?.role === 'admin' || user?.role === 'manager') && (
                                            <button onClick={() => handleDeleteAssignment(assign.assignment_id)} className="absolute top-4 right-4 text-neutral-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100">
                                                <FaTrash size={12} />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            {assignments.length === 0 && (
                                <div className="sm:col-span-2 text-center py-10 px-4 border-2 border-dashed border-neutral-100 rounded-2xl bg-neutral-50/50">
                                    <div className="text-neutral-300 mb-3 flex justify-center"><FaCalendarAlt size={40} /></div>
                                    <h5 className="text-neutral-500 font-bold">No Active Assignments</h5>
                                    <p className="text-xs text-neutral-400 mt-1">Assignments will appear here once published.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShiftsTab;
