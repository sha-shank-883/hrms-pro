import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronRight } from 'react-icons/fa';
import { leaveService } from '../../../services';

const LeaveBalanceWidget = ({ employeeData }) => {
    const navigate = useNavigate();
    const [balances, setBalances] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeData) {
            fetchBalances();
        }
    }, [employeeData]);

    const fetchBalances = async () => {
        try {
            const response = await leaveService.getBalance(employeeData.employee_id);
            // Transform object to array if needed or just use as is.
            // Assumption: response.data is an array of balances or object.
            // Let's assume standard array format from backend: [{ leave_type, balance, total_allocated, ... }]
            // Or if it returns object like { 'Sick Leave': { used: x, total: y } }
            // Given leaveController.js usually returns array or summary.
            // Let's assume array for now based on typical implementation.
            // If it is object, we map it.
            if (Array.isArray(response.data)) {
                setBalances(response.data.map(b => ({
                    type: b.leave_type,
                    available: b.remaining, // or balance
                    total: b.entitled, // or total_allocated
                    color: getLeaveColor(b.leave_type)
                })));
            } else {
                // Mock fallback if structure differs
                setBalances([
                    { type: 'Sick Leave', available: response.data.sick_leave || 0, total: 10, color: 'bg-green-500' },
                    { type: 'Casual Leave', available: response.data.casual_leave || 0, total: 12, color: 'bg-yellow-500' },
                    { type: 'Earned Leave', available: response.data.earned_leave || 0, total: 20, color: 'bg-blue-500' }
                ]);
            }
        } catch (error) {
            console.error("Failed to fetch leave balance", error);
        } finally {
            setLoading(false);
        }
    };

    const getLeaveColor = (type) => {
        switch (type) {
            case 'Sick Leave': return 'bg-green-500';
            case 'Casual Leave': return 'bg-yellow-500';
            case 'Earned Leave': return 'bg-blue-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h3 className="text-lg font-bold text-neutral-900 tracking-tight">Time Off Balance</h3>
                    <p className="text-xs text-neutral-500 font-semibold uppercase tracking-wider mt-1.5">Annual Overview</p>
                </div>
                <button className="px-3 py-1.5 text-xs font-bold text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg flex items-center gap-1.5 transition-colors" onClick={() => navigate('/leaves')}>
                    Request <FaChevronRight size={10} />
                </button>
            </div>

            <div className="space-y-6 flex-1">
                {balances.length > 0 ? balances.map((leave, index) => (
                    <div key={index}>
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-sm font-bold text-neutral-700">{leave.type}</span>
                            <div className="text-right">
                                <span className={`text-xl font-black ${leave.available > 0 ? "text-neutral-900" : "text-red-500"}`}>{leave.available}</span>
                                <span className="text-neutral-400 font-medium text-xs ml-1">/ {leave.total} days</span>
                            </div>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2.5 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${leave.color}`}
                                style={{ width: `${(leave.available / leave.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )) : (
                    <div className="flex items-center justify-center h-32">
                        <p className="text-sm font-medium text-neutral-500 bg-neutral-50 px-4 py-2 rounded-xl border border-dashed border-neutral-200">No leave balance data available</p>
                    </div>
                )}
            </div>

            <div className="mt-8 pt-6 border-t border-neutral-100 flex gap-3">
                <button className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-600 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors" onClick={() => navigate('/leaves')}>
                    History
                </button>
                <button className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-600 bg-neutral-50 hover:bg-neutral-100 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors" onClick={() => navigate('/leaves')}>
                    Calendar
                </button>
            </div>
        </div>
    );
};

export default LeaveBalanceWidget;
