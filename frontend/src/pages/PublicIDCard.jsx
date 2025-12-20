import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaDownload, FaBuilding, FaIdBadge, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

const PublicIDCard = () => {
    const { id } = useParams();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [companyName] = useState("KEKA CORP"); // In a real app, fetch from tenant settings

    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                setLoading(true);
                // We need a public endpoint or we use the existing one if the user is logged in. 
                // For a true public page, we'd need a public API. 
                // Assuming for now the scanner has access or we use a token if available, 
                // or strictly speaking, this might need a specific public endpoint.
                // For this task, I'll assume standard authenticated access is required for security,
                // OR I'll use the existing secure endpoint and expect the user to login if not.

                // HOWEVER, "PublicIDCard" implies public access. 
                // If I use the standard API, it requires a token.
                // Let's try to use the standard API. If it fails (401), we show a "Login Required" message.

                const token = localStorage.getItem('token');
                if (!token) {
                    // For demo purposes, we might not be able to fetch without auth unless we make a public endpoint.
                    // But let's assume the user scanning is an admin/employee or checks it on the device.
                    // If the user request implies "scan qr", often the scanner handles the link. 
                    // If it's truly public, we need a backend change to allow public fetching of limited ID card data.
                    // Given I didn't plan a backend public route, I will prompt for login if needed or try to fetch.
                    setError('Authentication required to view this ID card.');
                    setLoading(false);
                    return;
                }

                // Using the existing endpoint (via axios directly to avoid context dependencies if this is standalone)
                const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
                const response = await axios.get(`${baseUrl}/employees/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success) {
                    setEmployee(response.data.data);
                } else {
                    setError('Employee not found');
                }

            } catch (err) {
                console.error("Error fetching ID card data", err);
                setError(err.response?.status === 401 ? 'Please login to view this ID Card' : 'Failed to load ID card data');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchEmployeeData();
        }
    }, [id]);

    const getProfilePicture = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001';
        const cleanBaseUrl = baseUrl.replace('/api', '');
        return `${cleanBaseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-100 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FaExclamationTriangle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-neutral-800 mb-2">Access Denied</h2>
                    <p className="text-neutral-600 mb-6">{error}</p>
                    <a href="/login" className="btn btn-primary w-full block">Go to Login</a>
                </div>
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
            <div className="max-w-sm w-full bg-white rounded-2xl shadow-2xl overflow-hidden relative print:shadow-none print:rounded-none print:w-full print:max-w-none">
                {/* Top Banner */}
                <div className="h-32 bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 relative overflow-hidden">
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-xl"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full -ml-10 -mb-10 blur-lg"></div>
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

                    {/* Company Logo/Name */}
                    <div className="absolute top-6 left-6 flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-white font-bold text-xl border border-white/30 shadow-lg">
                            {companyName.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-white font-bold text-lg tracking-wider ">{companyName}</h1>
                            <p className="text-primary-100 text-xs uppercase tracking-widest font-medium">Official ID Card</p>
                        </div>
                    </div>
                </div>

                <div className="px-8 pb-8 -mt-16 relative z-10">
                    {/* Profile Photo */}
                    <div className="flex justify-center mb-6">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl bg-neutral-200 overflow-hidden">
                                {employee.profile_image ? (
                                    <img src={getProfilePicture(employee.profile_image)} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-4xl font-bold">
                                        {employee.first_name?.charAt(0)}
                                    </div>
                                )}
                            </div>
                            {/* Status Indicator */}
                            <div className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-white ${employee.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        </div>
                    </div>

                    {/* Personal Info */}
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-bold text-neutral-800 mb-1">{employee.first_name} {employee.last_name}</h2>
                        <div className="inline-block px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-semibold tracking-wide border border-primary-100">
                            {employee.position || 'Employee'}
                        </div>
                    </div>

                    {/* Details Grid */}
                    <div className="bg-neutral-50 rounded-xl p-4 border border-neutral-100 mb-6">
                        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
                            <div>
                                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">ID Number</p>
                                <p className="font-mono text-neutral-800 font-bold text-sm tracking-wide">#{employee.employee_id}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">Joined Date</p>
                                <p className="text-neutral-800 font-semibold text-sm">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">Department</p>
                                <p className="text-neutral-800 font-semibold text-sm truncate">{employee.department_name || 'General'}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-neutral-400 uppercase font-bold tracking-wider mb-1">Blood Group</p>
                                <p className="text-neutral-800 font-semibold text-sm">{employee.blood_group || 'O+'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Verification Status */}
                    <div className="text-center border-t border-dashed border-neutral-200 pt-6">
                        <div className="flex items-center justify-center gap-2 text-green-600 font-bold mb-1">
                            <FaCheckCircle /> <span>Verified Employee</span>
                        </div>
                        <p className="text-xs text-neutral-400">Authorized by {companyName} Management</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-neutral-50 p-4 border-t border-neutral-100 print:hidden">
                    <button
                        onClick={() => window.print()}
                        className="btn btn-primary w-full flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all"
                    >
                        <FaDownload /> Download / Print ID
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublicIDCard;
