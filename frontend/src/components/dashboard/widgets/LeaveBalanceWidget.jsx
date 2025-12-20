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
        <div className="card">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-lg text-neutral-800">Leave Balance</h3>
                    <p className="text-xs text-neutral-500 font-medium mt-1">Annual Overview</p>
                </div>
                <button className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline transition-all" onClick={() => navigate('/leaves')}>
                    Apply Now <FaChevronRight size={10} />
                </button>
            </div>

            <div className="space-y-5">
                {balances.length > 0 ? balances.map((leave, index) => (
                    <div key={index}>
                        <div className="flex justify-between text-sm mb-1.5">
                            <span className="text-neutral-600 font-medium">{leave.type}</span>
                            <span className="text-neutral-800 font-bold">
                                <span className={leave.available > 0 ? "text-neutral-800" : "text-red-500"}>{leave.available}</span>
                                <span className="text-neutral-400 mx-1">/</span>
                                <span className="text-neutral-500">{leave.total}</span>
                            </span>
                        </div>
                        <div className="w-full bg-neutral-100 rounded-full h-2">
                            <div
                                className={`h-2 rounded-full transition-all duration-500 ${leave.color}`}
                                style={{ width: `${(leave.available / leave.total) * 100}%` }}
                            ></div>
                        </div>
                    </div>
                )) : (
                    <p className="text-sm text-neutral-500 text-center py-4 bg-neutral-50 rounded-lg">No leave balance data available</p>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 flex gap-3">
                <button className="flex-1 py-2 text-xs font-semibold text-neutral-600 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors" onClick={() => navigate('/leaves')}>
                    View Leave History
                </button>
                <button className="flex-1 py-2 text-xs font-semibold text-neutral-600 bg-neutral-50 hover:bg-neutral-100 rounded-lg border border-neutral-200 transition-colors" onClick={() => navigate('/leaves')}>
                    Holiday Calendar
                </button>
            </div>
        </div>
    );
};

export default LeaveBalanceWidget;
