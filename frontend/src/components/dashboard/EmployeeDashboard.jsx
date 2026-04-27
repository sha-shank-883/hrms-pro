import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../../utils/settingsHelper';
import ClockInWidget from './widgets/ClockInWidget';
import LeaveBalanceWidget from './widgets/LeaveBalanceWidget';
import AttendanceCalendarWidget from './widgets/AttendanceCalendarWidget';
import TeamWidget from './widgets/TeamWidget';
import { FaFileInvoiceDollar, FaCalendarAlt, FaUserEdit, FaSync } from 'react-icons/fa';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Item Wrapper
const SortableItem = ({ id, children, className, style: propStyle }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        ...propStyle
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={className}>
            {children}
        </div>
    );
};

// Widget Settings Menu Component
const WidgetSettingsMenu = ({ id, config, onClose, updateWidgetConfig, menuPos }) => {
    const sizes = [
        { label: 'Standard (1/3)', value: 4 }, // Based on 12 col grid
        { label: 'Medium (1/2)', value: 6 },
        { label: 'Full Width', value: 12 }
    ];

    const heights = [
        { label: 'Compact', value: '256px' },
        { label: 'Standard', value: '384px' },
        { label: 'Tall', value: '512px' },
        { label: 'Auto Fit', value: 'auto' }
    ];

    return createPortal(
        <div
            className="widget-settings-menu z-[100] absolute bg-white shadow-2xl border border-neutral-100 rounded-xl p-4 w-64"
            style={{
                top: Math.max(10, menuPos.y),
                left: Math.min(window.innerWidth - 270, menuPos.x)
            }}
        >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-neutral-100">
                <span className="font-bold text-sm text-neutral-800">Widget Settings</span>
                <button onClick={onClose} className="text-neutral-400 hover:text-neutral-800 text-lg">&times;</button>
            </div>

            <div className="space-y-4">
                {/* Width Control */}
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 block">Width</label>
                    <div className="grid grid-cols-1 gap-2">
                        {sizes.map(s => (
                            <button
                                key={s.value}
                                onClick={() => updateWidgetConfig(id, 'colSpan', s.value)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${config.colSpan === s.value ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                            >
                                {s.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Height Control */}
                <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 block">Height</label>
                    <div className="grid grid-cols-2 gap-2">
                        {heights.map(h => (
                            <button
                                key={h.value}
                                onClick={() => updateWidgetConfig(id, 'height', h.value)}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${config.height === h.value ? 'bg-primary-50 border-primary-200 text-primary-700' : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'}`}
                            >
                                {h.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};


const EmployeeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [employeeData, setEmployeeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [upcomingHolidays, setUpcomingHolidays] = useState([]);

    // Persistence Helpers
    const getStorageKey = useCallback(() => {
        if (!user) return null;
        return `hrms_emp_dashboard_${user.tenant_id}_${user.id}_config`;
    }, [user]);

    // Initial Layout Configuration
    const getInitialWidgetOrder = () => {
        try {
            const key = getStorageKey();
            if (key) {
                const saved = localStorage.getItem(key);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.widgetOrder) return parsed.widgetOrder;
                }
            }
        } catch (e) {
            console.error("Failed to load widget order", e);
        }
        return [
            'widget-clockin',
            'widget-team',
            'widget-calendar',
            'widget-quick-actions',
            'widget-leave',
            'widget-holidays'
        ];
    };

    const getInitialLayoutConfig = () => {
        const defaults = {
            'widget-clockin': { colSpan: 4, height: 'auto' },
            'widget-team': { colSpan: 4, height: 'auto' },
            'widget-calendar': { colSpan: 8, height: 'auto' },
            'widget-quick-actions': { colSpan: 4, height: 'auto' },
            'widget-leave': { colSpan: 4, height: 'auto' },
            'widget-holidays': { colSpan: 4, height: 'auto' }
        };
        try {
            const key = getStorageKey();
            if (key) {
                const saved = localStorage.getItem(key);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.layoutConfig) return { ...defaults, ...parsed.layoutConfig };
                }
            }
        } catch (e) {
            console.error("Failed to load layout config", e);
        }
        return defaults;
    };

    const [widgetOrder, setWidgetOrder] = useState(getInitialWidgetOrder);
    const [layoutConfig, setLayoutConfig] = useState(getInitialLayoutConfig);

    // Auto-Save Effect
    useEffect(() => {
        const key = getStorageKey();
        if (key) {
            localStorage.setItem(key, JSON.stringify({ widgetOrder, layoutConfig }));
        }
    }, [widgetOrder, layoutConfig, getStorageKey]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const currentUserId = user?.user_id || user?.userId;
            if (currentUserId) {
                const { employeeService, holidayService } = await import('../../services');
                const [empRes, holRes] = await Promise.all([
                    employeeService.getByUserId(currentUserId),
                    holidayService.getAll(new Date().getFullYear())
                ]);

                setEmployeeData(empRes.data);

                if (holRes.success && Array.isArray(holRes.data)) {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const futureHolidays = holRes.data
                        .filter(h => new Date(h.date) >= today)
                        .sort((a, b) => new Date(a.date) - new Date(b.date))
                        .slice(0, 2);
                    setUpcomingHolidays(futureHolidays);
                }
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchDashboardData();
    }, [user]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 18) return 'Good Afternoon';
        return 'Good Evening';
    };

    // UI State for Settings Menu
    const [activeSettings, setActiveSettings] = useState(null);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

    const updateWidgetConfig = useCallback((id, key, value) => {
        setLayoutConfig(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [key]: value
            }
        }));
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        setWidgetOrder((items) => {
            const oldIndex = items.indexOf(active.id);
            const newIndex = items.indexOf(over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    }, []);

    const resetLayout = () => {
        if (window.confirm('Reset dashboard layout to default?')) {
            localStorage.removeItem(getStorageKey());
            window.location.reload();
        }
    };

    // Component Rendering Helper
    const renderWidget = (id) => {
        const config = layoutConfig[id] || { colSpan: 4, height: 'auto' };
        let WidgetContent = null;

        switch (id) {
            case 'widget-clockin':
                WidgetContent = <ClockInWidget employeeData={employeeData} />;
                break;
            case 'widget-team':
                WidgetContent = <TeamWidget employeeData={employeeData} />;
                break;
            case 'widget-calendar':
                WidgetContent = <AttendanceCalendarWidget employeeData={employeeData} />;
                break;
            case 'widget-leave':
                WidgetContent = <LeaveBalanceWidget employeeData={employeeData} />;
                break;
            case 'widget-quick-actions':
                WidgetContent = (
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden h-full flex flex-col">
                        <div className="px-6 py-4 border-b border-neutral-50 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white">
                            <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">Quick Actions</h3>
                        </div>
                        <div className="p-4 grid grid-cols-2 gap-3 flex-1">
                            <div
                                className="p-4 bg-primary-50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-primary-100 transition-colors group text-center border border-primary-100"
                                onClick={() => navigate('/my-payslips')}
                            >
                                <FaFileInvoiceDollar className="text-3xl text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-primary-900">Payslips</span>
                            </div>
                            <div
                                className="p-4 bg-amber-50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-amber-100 transition-colors group text-center border border-amber-100"
                                onClick={() => navigate('/leaves')}
                            >
                                <FaCalendarAlt className="text-3xl text-amber-600 mb-3 group-hover:scale-110 transition-transform" />
                                <span className="text-xs font-bold text-amber-900">Time Off</span>
                            </div>
                        </div>
                    </div>
                );
                break;
            case 'widget-holidays':
                WidgetContent = (
                    <div className="bg-white rounded-2xl shadow-sm border border-neutral-100 overflow-hidden relative h-full flex flex-col">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 to-primary-600"></div>
                        <div className="px-6 py-5 border-b border-neutral-50 flex justify-between items-center">
                            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Upcoming Holidays</h3>
                            <span className="text-xs font-bold px-2 py-1 bg-neutral-100 rounded-md text-neutral-600">{new Date().getFullYear()}</span>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            {upcomingHolidays.length > 0 ? (
                                <div className="space-y-3 flex-1">
                                    {upcomingHolidays.map(holiday => (
                                        <div key={holiday.holiday_id} className="flex items-center gap-4 p-3 rounded-xl border border-neutral-100 hover:border-primary-100 hover:bg-primary-50 hover:shadow-sm transition-all group cursor-default">
                                            <div className="w-12 h-12 rounded-xl bg-primary-50 flex flex-col items-center justify-center text-primary-600 border border-primary-100 group-hover:bg-white transition-colors">
                                                <span className="text-lg font-black leading-none">{new Date(holiday.date).getDate()}</span>
                                                <span className="text-[10px] font-bold uppercase tracking-widest">{new Date(holiday.date).toLocaleString('default', { month: 'short' })}</span>
                                            </div>
                                            <div>
                                                <p className="font-bold text-neutral-900 text-sm leading-tight group-hover:text-primary-700 transition-colors">{holiday.name}</p>
                                                <p className="text-xs text-neutral-500 font-medium mt-0.5">{new Date(holiday.date).toLocaleDateString(undefined, { weekday: 'long' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-sm text-neutral-500 py-6 text-center bg-neutral-50 rounded-xl border border-dashed border-neutral-200 w-full">
                                        No upcoming holidays.
                                    </div>
                                </div>
                            )}
                            <button
                                onClick={() => navigate('/leaves')}
                                className="w-full mt-4 py-2.5 text-xs font-bold text-primary-600 bg-primary-50 hover:text-primary-700 hover:bg-primary-100 rounded-xl transition-colors uppercase tracking-wider">
                                View Full Calendar
                            </button>
                        </div>
                    </div>
                );
                break;
            default:
                return null;
        }

        return (
            <SortableItem 
                key={id} 
                id={id} 
                className={`lg:col-span-${config.colSpan} col-span-12 relative group`}
            >
                <div className="widget-wrapper relative transition-all duration-300 w-full" style={{ height: config.height }}>
                    {/* Settings Trigger Icon */}
                    <button 
                        className="absolute top-4 right-4 z-10 w-8 h-8 bg-white/80 backdrop-blur border border-neutral-200 shadow-sm rounded-lg flex items-center justify-center text-neutral-400 hover:text-primary-600 hover:bg-primary-50 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        onPointerDown={(e) => {
                            e.stopPropagation(); // Prevent drag when clicking settings
                            const rect = e.currentTarget.getBoundingClientRect();
                            setMenuPos({ x: rect.right - 250, y: rect.bottom + 5 });
                            setActiveSettings(activeSettings === id ? null : id);
                        }}
                        title="Widget Settings"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"></path></svg>
                    </button>

                    {/* The Widget */}
                    <div className="h-full w-full pointer-events-auto">
                        {WidgetContent}
                    </div>

                    {/* Settings Menu Portal */}
                    {activeSettings === id && (
                        <WidgetSettingsMenu
                            id={id}
                            config={config}
                            onClose={() => setActiveSettings(null)}
                            updateWidgetConfig={updateWidgetConfig}
                            menuPos={menuPos}
                        />
                    )}
                </div>
            </SortableItem>
        );
    };

    return (
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-neutral-100">
                <div>
                    <h1 className="text-2xl font-bold text-neutral-900 tracking-tight">
                        {getGreeting()}, {user?.first_name}!
                    </h1>
                    <p className="text-neutral-500 font-medium text-sm mt-1 flex items-center gap-2">
                        {formatDate(new Date(), 'DD MMMM YYYY')} &bull; Welcome to your workspace
                    </p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={fetchDashboardData} className="px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 font-bold uppercase tracking-wider text-xs rounded-xl border border-neutral-200 transition-colors shadow-sm flex items-center gap-2" title="Refresh Data" disabled={loading}>
                        <FaSync className={loading ? "animate-spin" : ""} /> Refresh
                    </button>
                    <button onClick={resetLayout} className="px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-600 font-bold uppercase tracking-wider text-xs rounded-xl border border-neutral-200 transition-colors shadow-sm flex items-center gap-2" title="Reset Layout">
                        Reset Layout
                    </button>
                    <button 
                        className="px-4 py-2 bg-primary-50 hover:bg-primary-100 text-primary-700 font-bold uppercase tracking-wider text-xs rounded-xl border border-primary-200 transition-colors shadow-sm flex items-center gap-2" 
                        onClick={() => navigate('/profile')}
                    >
                        <FaUserEdit /> My Profile
                    </button>
                </div>
            </div>

            {/* Drag & Drop Grid */}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-12 gap-6 pb-20">
                        {widgetOrder.map(id => renderWidget(id))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
};

export default EmployeeDashboard;
