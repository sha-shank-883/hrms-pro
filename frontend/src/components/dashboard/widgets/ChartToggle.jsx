import React, { memo } from 'react';
import { FaChartBar, FaTable, FaChartPie, FaChartLine } from 'react-icons/fa';

const ChartToggle = memo(({ id, currentType, onToggle }) => {
    let Icon = FaChartBar;
    if (currentType === 'pie' || currentType === 'donut') Icon = FaChartPie;
    if (currentType === 'line' || currentType === 'area') Icon = FaChartLine;
    if (currentType === 'grid') Icon = FaTable;

    return (
        <button
            onClick={() => onToggle(id)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-colors"
            title="Switch View"
        >
            <Icon />
        </button>
    );
});

export default ChartToggle;
