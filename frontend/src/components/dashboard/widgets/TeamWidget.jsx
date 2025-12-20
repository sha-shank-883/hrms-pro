import React, { useState, useEffect } from 'react';
import { FaUserCircle } from 'react-icons/fa';
import { employeeService } from '../../../services';

const TeamWidget = ({ employeeData }) => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (employeeData) {
            fetchTeam();
        }
    }, [employeeData]);

    const fetchTeam = async () => {
        try {
            // Fetch all employees (optimized for chat/list)
            const response = await employeeService.getForChat();

            if (response.data) {
                // Filter by same department
                // Note: getForChat returns { employee_id, first_name, last_name, department_name ... }
                // We match department_name or could filter by ID if we had it.
                // employeeData has department_name usually
                const myDept = employeeData.department_name;

                if (myDept) {
                    const team = response.data
                        .filter(e => e.department_name === myDept && e.employee_id !== employeeData.employee_id)
                        .slice(0, 5); // Limit to 5
                    setTeamMembers(team);
                } else {
                    setTeamMembers([]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch team", error);
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (first, last) => {
        return `${first?.charAt(0) || ''}${last?.charAt(0) || ''}`.toUpperCase();
    };

    return (
        <div className="card">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-neutral-800">My Team</h3>
                {employeeData?.department_name && (
                    <span className="text-[10px] font-bold tracking-wider text-neutral-500 uppercase bg-neutral-100 px-2 py-1 rounded">
                        {employeeData.department_name}
                    </span>
                )}
            </div>

            <div className="space-y-1">
                {teamMembers.length > 0 ? teamMembers.map((member) => (
                    <div key={member.employee_id} className="flex items-center justify-between p-2.5 hover:bg-neutral-50 rounded-lg transition-colors group cursor-default">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center text-xs font-bold border border-indigo-100">
                                {getInitials(member.first_name, member.last_name)}
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-neutral-800 group-hover:text-primary-600 transition-colors">{member.first_name} {member.last_name}</div>
                                <div className="text-xs text-neutral-500">{member.position}</div>
                            </div>
                        </div>

                        {/* Since we don't have real status access yet, we show generic 'Active' or nothing */}
                        <span className="w-2.5 h-2.5 rounded-full bg-green-500 ring-4 ring-green-50" title="Active"></span>
                    </div>
                )) : (
                    <div className="text-sm text-neutral-500 text-center py-6 bg-neutral-50 rounded-lg border border-neutral-100 border-dashed">
                        {loading ? 'Loading team...' : 'No team members found'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamWidget;
