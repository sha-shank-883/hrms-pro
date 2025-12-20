import React from 'react';
import { FaCheckCircle, FaTasks, FaCalendarPlus, FaBullhorn } from 'react-icons/fa';

const TimelineWidget = () => {
    // Mock feed
    const items = [
        { id: 1, type: 'announcement', title: 'Townhall Meeting', time: '10:00 AM', icon: <FaBullhorn />, color: 'text-info', bg: 'bg-info-bg' },
        { id: 2, type: 'task', title: 'Assigned: Review Designs', time: 'Yesterday', icon: <FaTasks />, color: 'text-warning', bg: 'bg-warning-bg' },
        { id: 3, type: 'leave', title: 'Leave Approved (Jan 24)', time: '2 days ago', icon: <FaCheckCircle />, color: 'text-success', bg: 'bg-success-bg' },
        { id: 4, type: 'holiday', title: 'Upcoming: Republic Day', time: 'Jan 26', icon: <FaCalendarPlus />, color: 'text-primary-600', bg: 'bg-primary-50' },
    ];

    return (
        <div className="card h-full">
            <div className="card-header">
                <h3 className="card-title">Timeline</h3>
            </div>

            <div className="relative pl-4 border-l border-neutral-200 space-y-6">
                {items.map((item) => (
                    <div key={item.id} className="relative pl-4">
                        <div className={`absolute -left-[25px] top-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center ${item.bg} ${item.color} shadow-sm`}>
                            <span className="text-xs">{item.icon}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-semibold text-neutral-800">{item.title}</span>
                            <span className="text-xs text-neutral-500">{item.time}</span>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 text-center">
                <button className="text-sm text-primary-600 font-medium hover:underline">View All Notifications</button>
            </div>
        </div>
    );
};

export default TimelineWidget;
