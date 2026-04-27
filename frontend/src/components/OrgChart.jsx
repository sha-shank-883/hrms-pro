import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services';
import { FaUserTie, FaUsers, FaSitemap, FaSearchPlus, FaSearchMinus, FaCompressArrowsAlt } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';

const OrgChart = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [zoom, setZoom] = useState(1);
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        fetchOrgData();
    }, []);

    const fetchOrgData = async () => {
        try {
            const response = await employeeService.getOrgChart();
            setEmployees(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to load org chart", err);
            setError("Failed to load organization chart");
            setLoading(false);
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.4));
    const handleResetZoom = () => setZoom(1);

    const buildTree = (items) => {
        const dataMap = {};
        const tree = [];

        // Initialize map
        items.forEach(item => {
            dataMap[item.employee_id] = { ...item, children: [] };
        });

        // Build hierarchy
        items.forEach(item => {
            if (item.reporting_manager_id && dataMap[item.reporting_manager_id]) {
                dataMap[item.reporting_manager_id].children.push(dataMap[item.employee_id]);
            } else {
                // No manager or manager not found -> Root node
                tree.push(dataMap[item.employee_id]);
            }
        });

        return tree;
    };

    const OrgNode = ({ node }) => {
        const hasChildren = node.children && node.children.length > 0;
        
        // Only allow clicking to profile if user has permissions (admin/manager can view all, employee can only view self unless permissions allow, but usually standard HRMS allows directory viewing)
        const canViewProfile = user.role === 'admin' || user.role === 'manager' || user.userId === node.user_id;
        const profileLink = canViewProfile ? `/employees/${node.employee_id}` : '#';

        return (
            <div className="flex flex-col items-center relative">
                {/* Node Card */}
                {canViewProfile ? (
                    <Link to={profileLink} className="relative group z-10 w-64 bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 hover:shadow-lg hover:border-primary-300 transition-all duration-300 transform hover:-translate-y-1 block cursor-pointer">
                         <NodeContent node={node} />
                    </Link>
                ) : (
                    <div className="relative group z-10 w-64 bg-white rounded-2xl shadow-sm border border-neutral-100 p-5 transition-all duration-300 opacity-90">
                         <NodeContent node={node} />
                    </div>
                )}

                {/* Vertical Line from parent to children container */}
                {hasChildren && (
                    <div className="w-px h-8 bg-neutral-300 transition-all"></div>
                )}

                {/* Children Container */}
                {hasChildren && (
                    <div className="flex relative pt-4">
                        {/* Horizontal connecting line spanning all children */}
                        {node.children.length > 1 && (
                            <div className="absolute top-0 left-[50%] right-[50%] h-px bg-neutral-300 transform -translate-x-[50%] w-[calc(100%-16rem)] transition-all"></div>
                        )}
                        
                        {node.children.map((child, index) => (
                            <div key={child.employee_id} className="relative px-4 flex flex-col items-center">
                                {/* Vertical line connecting to the horizontal line */}
                                <div className="absolute top-0 w-px h-4 bg-neutral-300 transition-all"></div>
                                <OrgNode node={child} />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Extracted content to keep the JSX clean whether it's a Link or a Div
    const NodeContent = ({ node }) => (
        <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity pointer-events-none"></div>
            
            <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden mb-3 group-hover:scale-105 transition-transform duration-300">
                    {node.profile_image ? (
                        <img src={node.profile_image} alt={node.first_name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="text-xl font-black text-neutral-400 uppercase tracking-widest">
                            {node.first_name?.[0]}{node.last_name?.[0]}
                        </div>
                    )}
                </div>
                <h4 className="text-[15px] font-bold text-neutral-900 leading-tight mb-1 group-hover:text-primary-700 transition-colors">
                    {node.first_name} {node.last_name}
                </h4>
                <p className="text-xs font-semibold text-primary-600 mb-2">{node.position || 'Employee'}</p>
                
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500 bg-neutral-50 group-hover:bg-white px-2 py-1 rounded-md border border-neutral-100 transition-colors">
                    <FaUsers className="text-neutral-400 group-hover:text-primary-400" />
                    {node.department_name || 'No Department'}
                </div>
            </div>
        </>
    );

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
            <div className="animate-spin w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full mb-4"></div>
            <p className="text-sm font-bold tracking-wider uppercase">Loading Directory...</p>
        </div>
    );
    
    if (error) return (
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl text-center max-w-lg mx-auto mt-10">
            <h3 className="text-red-800 font-bold mb-2">Error Loading Chart</h3>
            <p className="text-red-600 text-sm">{error}</p>
        </div>
    );

    const treeData = buildTree(employees);

    return (
        <div className="pb-12 h-[calc(100vh-100px)] flex flex-col">
            <div className="page-header mb-6 flex justify-between items-end shrink-0">
                <div>
                    <h1 className="page-title flex items-center gap-3">
                        <FaSitemap className="text-primary-600" /> Organization Directory
                    </h1>
                    <p className="page-subtitle">View reporting structures and department alignments.</p>
                </div>
                
                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-neutral-200 shadow-sm">
                    <button 
                        onClick={handleZoomOut} 
                        className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Zoom Out"
                    >
                        <FaSearchMinus size={14} />
                    </button>
                    <div className="w-12 text-center text-xs font-bold text-neutral-600 select-none">
                        {Math.round(zoom * 100)}%
                    </div>
                    <button 
                        onClick={handleZoomIn} 
                        className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Zoom In"
                    >
                        <FaSearchPlus size={14} />
                    </button>
                    <div className="w-px h-5 bg-neutral-200 mx-1"></div>
                    <button 
                        onClick={handleResetZoom} 
                        className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                        title="Reset Zoom"
                    >
                        <FaCompressArrowsAlt size={14} />
                    </button>
                </div>
            </div>

            <div className="bg-neutral-50/50 rounded-3xl border border-neutral-200 overflow-hidden flex-1 relative shadow-inner">
                {/* Decorative background grid */}
                <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(var(--tw-colors-neutral-300) 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
                
                <div className="overflow-auto w-full h-full custom-scrollbar relative">
                    <div 
                        className="min-w-max p-12 transition-transform duration-200 ease-out flex justify-center origin-top"
                        style={{ transform: `scale(${zoom})`, minHeight: '100%' }}
                    >
                        {treeData.length === 0 ? (
                            <div className="text-center py-20 text-neutral-400 mt-20">
                                <FaSitemap size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-sm font-bold uppercase tracking-widest">No Structure Defined</p>
                            </div>
                        ) : (
                            <div className="flex gap-16 justify-center mt-10">
                                {treeData.map(rootNode => (
                                    <OrgNode key={rootNode.employee_id} node={rootNode} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrgChart;
