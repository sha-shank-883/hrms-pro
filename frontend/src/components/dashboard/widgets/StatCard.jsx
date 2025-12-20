import React, { memo } from 'react';

const StatCard = memo(({ title, value, icon, subtext, colorClass, onClick }) => (
    <div
        onClick={onClick}
        className="card p-4 cursor-pointer h-full flex flex-col justify-center"
    >
        <div className="flex justify-between items-start">
            <div>
                <p className="text-xs font-medium text-neutral-500 mb-1">{title}</p>
                <h3 className="text-xl font-bold text-neutral-900 m-0 tracking-tight">{value}</h3>
                {subtext && <p className="text-xs text-neutral-400 mt-1 flex items-center gap-1">{subtext}</p>}
            </div>
            <div className={`p-2 rounded-lg ${colorClass} w-10 h-10 flex items-center justify-center`}>
                <div className="text-lg">
                    {icon}
                </div>
            </div>
        </div>
    </div>
));

export default StatCard;