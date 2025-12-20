import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaCalendarAlt } from 'react-icons/fa';

const PerformanceCycles = () => {
    const [cycles, setCycles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [newCycle, setNewCycle] = useState({
        title: '',
        start_date: '',
        end_date: ''
    });

    const fetchCycles = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/performance/cycles`);
            setCycles(res.data.data);
        } catch (error) {
            console.error('Error fetching cycles:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCycles();
    }, []);

    const handleCreateCycle = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/api/performance/cycles`, newCycle);
            setShowModal(false);
            setNewCycle({ title: '', start_date: '', end_date: '' });
            fetchCycles();
        } catch (error) {
            console.error('Error creating cycle:', error);
        }
    };

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Performance Cycles</h1>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
                >
                    <FaPlus /> Create New Cycle
                </button>
            </div>

            <div className="grid grid-cols-4 gap-4">
                {cycles.map((cycle) => (
                    <div key={cycle.cycle_id} className="bg-white p-4 rounded-lg shadow border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-lg text-gray-800">{cycle.title}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full ${cycle.status === 'active' ? 'bg-green-100 text-green-800' :
                                    cycle.status === 'completed' ? 'bg-gray-100 text-gray-800' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                {cycle.status}
                            </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-gray-400" />
                                <span>Start: {new Date(cycle.start_date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <FaCalendarAlt className="text-gray-400" />
                                <span>End: {new Date(cycle.end_date).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
                {cycles.length === 0 && (
                    <div className="col-span-full text-center py-10 text-gray-500">
                        No performance cycles found. Create one to start.
                    </div>
                )}
            </div>

            {/* Create Cycle Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">Create Performance Cycle</h2>
                        <form onSubmit={handleCreateCycle}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Q4 2025 Performance Review"
                                    className="w-full border border-gray-300 rounded-md p-2"
                                    value={newCycle.title}
                                    onChange={(e) => setNewCycle({ ...newCycle, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-300 rounded-md p-2"
                                        value={newCycle.start_date}
                                        onChange={(e) => setNewCycle({ ...newCycle, start_date: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        className="w-full border border-gray-300 rounded-md p-2"
                                        value={newCycle.end_date}
                                        onChange={(e) => setNewCycle({ ...newCycle, end_date: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    Create Cycle
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PerformanceCycles;
