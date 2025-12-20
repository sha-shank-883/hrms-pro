import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSettings } from '../../hooks/useSettings';
import { reportService } from '../../services';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    horizontalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FaSync, FaCalendarAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
// Import Widgets and Config
import AttendanceWidget from './widgets/AttendanceWidget';
import PayrollWidget from './widgets/PayrollWidget';
import LeaveWidget from './widgets/LeaveWidget';
import DepartmentWidget from './widgets/DepartmentWidget';
import StatCard from './widgets/StatCard';
import TaskWidget from './widgets/TaskWidget';
import RequestNotificationsWidget from './widgets/RequestNotificationsWidget';
import ActivityWidget from './widgets/ActivityWidget';
import DashboardSkeleton from './DashboardSkeleton';
import { useAuth } from '../../context/AuthContext';
import { QUICK_ACTIONS_CONFIG, STATS_CONFIG } from './dashboardConstants.jsx';

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

// Widget Settings Menu Component (Extracted)
const WidgetSettingsMenu = ({ id, config, onClose, updateWidgetConfig, menuPos }) => {
    const sizes = [
        { label: 'Standard (1/3)', value: 1 },
        { label: 'Medium (1/2)', value: 2 },
        { label: 'Full Width', value: 4 }
    ];

    const heights = [
        { label: 'Compact', value: '256px' },
        { label: 'Standard', value: '384px' },
        { label: 'Tall', value: '512px' }
    ];

    const chartTypes = ['bar', 'line', 'area', 'pie', 'donut'];

    return createPortal(
        <div
            className="widget-settings-menu"
            style={{
                top: Math.max(10, menuPos.y),
                left: Math.min(window.innerWidth - 270, menuPos.x)
            }}
        >
            <div className="settings-header">
                <span className="settings-title">Widget Settings</span>
                <button onClick={onClose} className="settings-close-btn">&times;</button>
            </div>

            <div className="settings-body">
                {/* Width Control */}
                <div className="settings-section">
                    <label className="settings-label">Width</label>
                    <div className="settings-grid-3">
                        {sizes.map(s => (
                            <button
                                key={s.value}
                                onClick={() => updateWidgetConfig(id, 'colSpan', s.value)}
                                className={`settings-option-btn ${config.colSpan === s.value ? 'active' : ''}`}
                            >
                                {s.label.split(' ')[0]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Height Control */}
                <div className="settings-section">
                    <label className="settings-label">Height</label>
                    <div className="settings-grid-2">
                        {heights.map(h => (
                            <button
                                key={h.value}
                                onClick={() => updateWidgetConfig(id, 'height', h.value)}
                                className={`settings-option-btn ${config.height === h.value ? 'active' : ''}`}
                            >
                                {h.label}
                            </button>
                        ))}
                        <button
                            onClick={() => updateWidgetConfig(id, 'height', 'auto')}
                            className={`settings-option-btn ${config.height === 'auto' ? 'active' : ''}`}
                        >
                            Auto Fit
                        </button>
                    </div>
                </div>

                {/* Chart Type Control */}
                <div className="settings-section">
                    <label className="settings-label">Chart Type</label>
                    <div className="settings-grid-3">
                        {chartTypes.map(t => (
                            <button
                                key={t}
                                onClick={() => updateWidgetConfig(id, 'chartType', t)}
                                className={`settings-option-btn ${config.chartType === t ? 'active' : ''}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

// Extracted WidgetWrapper Component
const WidgetWrapper = ({ id, config, children, activeSettings, setActiveSettings, updateWidgetConfig, onResizeStart, onSettingsClick }) => {
    // Local menu position state - we could lift this if we want strict single-open behavior, but keeping it local per widget (lazy init) is fine
    // Actually, to make Portal work, we need position content.
    // If 'activeSettings' comes from parent, we need to know WHERE to render.
    // So 'menuPos' should be stored where 'activeSettings' is stored or passed down.
    // AdminDashboard is simplified to store menuPos as global state if we want only one.
    // But wait, the original broken code defined menuPos inside renderChart loop.

    // Let's use the parent's menuPos if passed, or local if needed.
    // Based on previous refactor attempt in AdminDashboard component, we had global menuPos.
    return (
        <React.Fragment>
            {children}
        </React.Fragment>
    );
};
// Wait, the wrapper logic needs SortableItem and the div.

const AdminDashboard = () => {
    const { settings } = useSettings();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);

    // Persistence Helpers
    const getStorageKey = useCallback(() => {
        if (!user) return null;
        return `hrms_dashboard_${user.tenant_id}_${user.id}_config`;
    }, [user]);

    // Initial State Helpers
    const getInitialChartOrder = () => {
        try {
            const key = user ? `hrms_dashboard_${user.tenant_id}_${user.id}_config` : null;
            if (key) {
                const saved = localStorage.getItem(key);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.chartOrder) return parsed.chartOrder;
                }
            }
        } catch (e) {
            console.error("Failed to load chart order", e);
        }
        return [
            'chart-attendance',
            'widget-notifications',
            'chart-payroll',
            'chart-leave',
            'chart-department',
            'chart-task',
            'widget-activity'
        ];    };

    const getInitialLayoutConfig = () => {
        const defaults = {
            'chart-attendance': { colSpan: 2, height: '256px', chartType: 'area', label: 'Attendance' },
            'widget-notifications': { colSpan: 1, height: '256px', chartType: 'list', label: 'Recent Requests' },
            'chart-payroll': { colSpan: 1, height: '256px', chartType: 'bar', label: 'Payroll' },
            'chart-leave': { colSpan: 1, height: '256px', chartType: 'pie', label: 'Leave' },
            'chart-department': { colSpan: 2, height: '256px', chartType: 'bar', label: 'Department' },
            'chart-task': { colSpan: 2, height: '256px', chartType: 'bar', label: 'Task' },
            'widget-activity': { colSpan: 2, height: '256px', chartType: 'list', label: 'Live Activity' },
        };        try {
            const key = user ? `hrms_dashboard_${user.tenant_id}_${user.id}_config` : null;
            if (key) {
                const saved = localStorage.getItem(key);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    if (parsed.layoutConfig) {
                        // Merge with defaults to ensure new widgets appear if added later
                        return { ...defaults, ...parsed.layoutConfig };
                    }
                }
            }
        } catch (e) {
            console.error("Failed to load layout config", e);
        }
        return defaults;
    };


    // Drag Orders
    const [actionOrder, setActionOrder] = useState(QUICK_ACTIONS_CONFIG.map(a => a.id));
    const [statOrder, setStatOrder] = useState(STATS_CONFIG.map(s => s.id));
    const [chartOrder, setChartOrder] = useState(getInitialChartOrder);

    // Layout Config State
    const [layoutConfig, setLayoutConfig] = useState(getInitialLayoutConfig);

    // Auto-Save Effect
    useEffect(() => {
        const key = getStorageKey();
        if (key) {
            const dataToSave = {
                chartOrder,
                layoutConfig
            };
            localStorage.setItem(key, JSON.stringify(dataToSave));
        }
    }, [chartOrder, layoutConfig, getStorageKey]);

    // Resize State
    const [isResizing, setIsResizing] = useState(false);
    const resizeRef = useRef(null);

    // UI State for Settings Menu
    const [activeSettings, setActiveSettings] = useState(null);
    const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

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

    // Ref to track the ghost element
    const ghostRef = useRef(null);
    const [resizeGhostState, setResizeGhostState] = useState(null); // { id, width, height, top, left }

    const updateWidgetConfig = useCallback((id, key, value) => {
        setLayoutConfig(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [key]: value
            }
        }));
    }, []);

    // Resize Handle Logic
    const handleResizeStart = (e, id) => {
        e.preventDefault();
        e.stopPropagation();

        const startX = e.clientX;
        const startY = e.clientY;
        const startConfig = layoutConfig[id];
        const cardElement = e.target.closest('.widget-wrapper');
        const startRect = cardElement.getBoundingClientRect();

        // Initial dimensions
        const startWidth = startRect.width;
        const startHeight = startRect.height;

        setIsResizing(true);
        resizeRef.current = { id, startX, startY, startConfig, startWidth, startHeight, startRect };

        // Initialize ghost state
        setResizeGhostState({
            width: startWidth,
            height: startHeight,
            top: startRect.top + window.scrollY,
            left: startRect.left + window.scrollX
        });

        const handleMouseMove = (moveEvent) => {
            if (!resizeRef.current) return;

            // Use requestAnimationFrame for smooth UI updates without React render cycle for every pixel
            requestAnimationFrame(() => {
                const dx = moveEvent.clientX - startX;
                const dy = moveEvent.clientY - startY;

                const newHeight = Math.max(200, startHeight + dy);

                // Visual feedback only via ghost
                if (ghostRef.current) {
                    ghostRef.current.style.height = `${newHeight}px`;
                    ghostRef.current.style.width = `${startWidth + dx}px`; // Show width change intent
                }
            });
        };

        const handleMouseUp = (upEvent) => {
            if (!resizeRef.current) return;

            const dx = upEvent.clientX - startX;
            const dy = upEvent.clientY - startY;
            const { startHeight, startConfig: initialConfig } = resizeRef.current;

            const finalHeight = Math.max(200, startHeight + dy) + 'px';

            // Snap width logic
            let newColSpan = initialConfig.colSpan;
            if (dx > 150) newColSpan = Math.min(4, initialConfig.colSpan + 1);
            if (dx < -150) newColSpan = Math.max(1, initialConfig.colSpan - 1);

            setLayoutConfig(prev => ({
                ...prev,
                [id]: {
                    ...prev[id],
                    height: finalHeight,
                    colSpan: newColSpan === 3 ? 2 : newColSpan
                }
            }));

            // Cleanup
            setIsResizing(false);
            setResizeGhostState(null);
            resizeRef.current = null;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const fetchDashboardData = useCallback(async () => {
        try {
            const statsRes = await reportService.getDashboardStats();

            if (statsRes.data) {
                setStats(statsRes.data);
            }
        } catch (err) {
            console.error('Dashboard Data Error:', err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const handleDragEnd = useCallback((event) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        if (actionOrder.includes(active.id)) {
            setActionOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        } else if (statOrder.includes(active.id)) {
            setStatOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        } else if (chartOrder.includes(active.id)) {
            setChartOrder((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);
                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }, [actionOrder, statOrder, chartOrder]);

    const renderChart = useCallback((id) => {
        const config = layoutConfig[id] || { colSpan: 1, height: 'h-96', chartType: 'bar' };

        // Dynamic class based on colSpan
        let colClass = "col-span-1";
        if (config.colSpan === 2) colClass = "col-span-2";
        if (config.colSpan === 4) colClass = "col-span-4";

        const commonProps = {
            chartType: config.chartType,
            onToggle: (type) => updateWidgetConfig(id, 'chartType', type),
            onSettingsClick: (e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                setMenuPos({ x: rect.right - 270, y: rect.bottom + 5 });
                setActiveSettings(activeSettings === id ? null : id);
            },
            isSettingsOpen: activeSettings === id
        };

        let WidgetComponent = null;

        switch (id) {
            case 'chart-attendance':
                WidgetComponent = <AttendanceWidget {...commonProps} />;
                break;
            case 'chart-payroll':
                WidgetComponent = <PayrollWidget {...commonProps} currencySymbol={settings?.currency_symbol || '$'} />;
                break;
            case 'chart-leave':
                WidgetComponent = <LeaveWidget {...commonProps} />;
                break;
            case 'chart-department':
                WidgetComponent = <DepartmentWidget {...commonProps} />;
                break;
            case 'chart-task':
                WidgetComponent = <TaskWidget {...commonProps} />;
                break;
            case 'widget-notifications':
                WidgetComponent = <RequestNotificationsWidget {...commonProps} />;
                break;
            case 'widget-activity':
                WidgetComponent = <ActivityWidget {...commonProps} />;
                break;
            default:
                return null;
        }
        return (
            <SortableItem key={id} id={id} className={`${colClass} relative group`}>
                <div
                    className="widget-wrapper relative transition-all duration-75"
                    style={{ height: config.height }}
                >
                    {WidgetComponent}

                    {/* Settings Menu (Portal) */}
                    {activeSettings === id && (
                        <WidgetSettingsMenu
                            id={id}
                            config={config}
                            onClose={() => setActiveSettings(null)}
                            updateWidgetConfig={updateWidgetConfig}
                            menuPos={menuPos}
                        />
                    )}

                    {/* Resize Handle */}
                    <div
                        onMouseDown={(e) => handleResizeStart(e, id)}
                        className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-400 hover:text-indigo-600 transition-opacity"
                        title="Drag to resize"
                    >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                            <path d="M10 0L10 10L0 10L10 0Z" />
                        </svg>
                    </div>
                </div>
            </SortableItem>
        );

    }, [layoutConfig, activeSettings, settings, menuPos, updateWidgetConfig]);

    // Helpers
    const getActionConfig = (id) => QUICK_ACTIONS_CONFIG.find(a => a.id === id);
    const getStatConfig = (id) => STATS_CONFIG.find(s => s.id === id);

    const visibleActions = actionOrder.filter(id => {
        const config = getActionConfig(id);
        return config && config.roles.includes(user?.role || 'employee');
    });

    if (loading) return <DashboardSkeleton />;
    if (error) {
        return (
            <div className="p-6 text-center bg-danger-50 rounded-xl border border-danger-200 m-6">
                <p className="text-danger mb-4">{error}</p>
                <button onClick={fetchDashboardData} className="px-4 py-2 bg-white text-danger border border-danger-200 rounded-lg hover:bg-red-50 transition-colors">Retry</button>
            </div>
        );
    }

    return (
        <div className="page-container max-w-none mx-0 px-0 md:px-4 lg:px-6">
            {/* Header - More Compact */}
            <div className="page-header pb-3">
                <div>
                    <h1 className="page-title text-xl">Dashboard Overview</h1>
                    <p className="page-subtitle text-xs">Welcome back, {user?.first_name || 'User'}</p>
                </div>
                <div className="flex gap-1.5">
                    <div className="hidden md:flex px-2.5 py-1 bg-white rounded-lg border border-neutral-200 shadow-sm text-xs text-neutral-600 font-medium items-center">
                        <FaCalendarAlt className="mr-1 text-neutral-400 text-xs" />
                        <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <button onClick={fetchDashboardData} className="btn btn-secondary btn-xs" title="Refresh Data" disabled={loading}>
                        <FaSync className={loading ? "animate-spin text-xs" : "text-xs"} />
                        <span className="hidden sm:inline text-xs">Refresh</span>
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm('Reset dashboard layout to default?')) {
                                localStorage.removeItem(getStorageKey());
                                window.location.reload();
                            }
                        }}
                        className="btn btn-secondary btn-xs"
                        title="Reset Layout"
                    >
                        Reset
                    </button>
                </div>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>

                {/* 1. Quick Actions Zone - More Compact */}
                <SortableContext items={visibleActions} strategy={horizontalListSortingStrategy}>
                    <div className="mb-4">
                        <h3 className="section-title text-xs uppercase tracking-wider text-neutral-500 font-bold mb-2">Quick Actions</h3>
                        <div className="flex gap-1.5 overflow-x-auto pb-2 custom-scrollbar">
                            {visibleActions.map((id) => {
                                const action = getActionConfig(id);
                                return (
                                    <SortableItem key={id} id={id}>
                                        <button
                                            onClick={() => navigate(action.path)}
                                            className="card hover:shadow-sm transition-all flex items-center px-3 py-2.5 whitespace-nowrap group min-w-[120px] bg-white text-xs"
                                            style={{ cursor: 'grab' }}
                                        >
                                            <div className={`p-1 rounded mr-2 ${action.theme === 'success' ? 'bg-green-50 text-green-600' :
                                                action.theme === 'info' ? 'bg-blue-50 text-blue-600' :
                                                    action.theme === 'warning' ? 'bg-yellow-50 text-yellow-600' :
                                                        action.theme === 'danger' ? 'bg-red-50 text-red-600' : 'bg-neutral-50 text-neutral-600'
                                                }`}>
                                                {action.icon}
                                            </div>
                                            <span className="font-medium text-neutral-700 group-hover:text-green-600 transition-colors">
                                                {action.label}
                                            </span>
                                        </button>
                                    </SortableItem>
                                );
                            })}
                        </div>
                    </div>
                </SortableContext>

                {/* 2. Stats Zone - Adjustable Grid */}
                <SortableContext items={statOrder} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {statOrder.map((id) => {
                            const stat = getStatConfig(id);
                            return (
                                <SortableItem key={id} id={id}>
                                    <StatCard
                                        title={stat.title}
                                        value={stat.getValue(stats)}
                                        icon={stat.icon}
                                        subtext={stat.getSubtext ? stat.getSubtext(stats) : null}
                                        colorClass={stat.colorClass}
                                        onClick={() => navigate(stat.path)}
                                    />
                                </SortableItem>
                            );
                        })}
                    </div>
                </SortableContext>

                {/* 3. Charts Zone - Adjustable Grid */}
                <SortableContext items={chartOrder} strategy={rectSortingStrategy}>
                    <div className="grid grid-cols-4 gap-4">
                        {chartOrder.map((id) => (
                            <React.Fragment key={id}>
                                {renderChart(id)}
                            </React.Fragment>
                        ))}
                    </div>
                </SortableContext>

            </DndContext>

            {/* Resize Ghost Overlay */}
            {resizeGhostState && createPortal(
                <div
                    ref={ghostRef}
                    style={{
                        position: 'absolute',
                        top: resizeGhostState.top,
                        left: resizeGhostState.left,
                        width: resizeGhostState.width,
                        height: resizeGhostState.height,
                        border: '2px dashed #6366f1',
                        borderRadius: '0.75rem',
                        pointerEvents: 'none',
                        zIndex: 9999,
                        backgroundColor: 'rgba(99, 102, 241, 0.05)',
                        transition: 'none'
                    }}
                />,
                document.body
            )}
        </div>
    );
};

export default AdminDashboard;
