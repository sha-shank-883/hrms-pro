
import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { employeeService } from '../services';

const OrgChart = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrgData();
    }, []);

    const fetchOrgData = async () => {
        try {
            const response = await employeeService.getOrgChart();
            // Assuming response.data is the flat list of employees
            setEmployees(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to load org chart", err);
            setError("Failed to load organization chart");
            setLoading(false);
        }
    };

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
        return (
            <div className="org-node-wrapper">
                <div className="org-node card">
                    <div className="org-node-image">
                        {node.profile_image ? (
                            <img src={node.profile_image} alt={node.first_name} />
                        ) : (
                            <div className="initials">{node.first_name[0]}{node.last_name[0]}</div>
                        )}
                    </div>
                    <div className="org-node-info">
                        <h4>{node.first_name} {node.last_name}</h4>
                        <p className="role">{node.position}</p>
                        {node.department_name && <p className="dept">{node.department_name}</p>}
                    </div>
                </div>
                {node.children.length > 0 && (
                    <div className="org-children">
                        {node.children.map(child => (
                            <OrgNode key={child.employee_id} node={child} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="loading">Loading Org Chart...</div>;
    if (error) return <div className="error">{error}</div>;

    const treeData = buildTree(employees);

    return (
        <div className="org-chart-container">
            <h2 style={{ marginBottom: '2rem' }}>Organization Chart</h2>
            <div className="org-tree">
                {treeData.length === 0 ? (
                    <p>No employees found or hierarchy not defined.</p>
                ) : (
                    treeData.map(rootNode => (
                        <OrgNode key={rootNode.employee_id} node={rootNode} />
                    ))
                )}
            </div>

            <style>{`
        .org-chart-container {
          padding: 2rem;
          overflow-x: auto;
        }
        .org-tree {
          display: flex;
          justify-content: center;
          gap: 4rem;
          padding-bottom: 2rem;
        }
        .org-node-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
        }
        .org-node-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 2px solid #ccc;
          width: 0;
          height: 20px;
          transform: translateY(-100%);
        }
        .org-tree > .org-node-wrapper::before {
          display: none; /* Hide top line for roots */
        }
        .org-node {
          padding: 1rem;
          min-width: 200px;
          text-align: center;
          background: white;
          border: 1px solid var(--border-color);
          z-index: 2;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          transition: all 0.2s;
        }
        .org-node:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary-color);
        }
        .org-node-image {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          overflow: hidden;
          background: var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          color: var(--text-secondary);
          border: 2px solid white;
          box-shadow: var(--shadow-sm);
        }
        .org-node-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .org-node-info h4 {
          margin: 0;
          font-size: 1rem;
          color: var(--text-primary);
        }
        .org-node-info .role {
          margin: 0;
          font-size: 0.85rem;
          color: var(--primary-color);
          font-weight: 500;
        }
        .org-node-info .dept {
          margin: 0.25rem 0 0;
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .org-children {
          display: flex;
          gap: 2rem;
          position: relative;
          padding-top: 20px;
        }
        .org-children::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          border-left: 2px solid #ccc;
          width: 0;
          height: 20px;
        }
        /* Connectors for siblings */
        .org-children::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          border-top: 2px solid #ccc;
          /* This logic is tricky with pure CSS for variable widths, 
             a better approach for lines is SVG or separate elements. 
             Simplified approach: just lines up. */
        }
        
        /* Better connection lines approach */
        .org-node-wrapper {
             padding-top: 20px; 
             position: relative;
        }
         /* Vertical line up from node */
        .org-node-wrapper::after {
            content: '';
            position: absolute;
            top: 0; 
            left: 50%; 
            border-left: 2px solid #ccc; 
            height: 20px;
        }
         /* Hide line for root */
         .org-tree > .org-node-wrapper::after {
            display: none;
         }
         
         /* Horizontal bars for children */
         .org-children {
            display: flex;
            padding-top: 20px;
            position: relative;
            justify-content: center;
         }
         /* Vertical line down from parent */
         .org-node::after {
            content: '';
            position: absolute;
            bottom: -20px;
            left: 50%;
            border-left: 2px solid #ccc;
            height: 20px;
            /* Only show if has children */
            display: none; 
         } 
         /* We handle lines via wrapper padding and pseudo elements better above. 
            Actually, a library like 'react-org-chart' or similar is easier, 
            but custom CSS flexbox with ::before/::after is feasible for simple trees.
            Refining the CSS for the 'connector' lines to look decent:
         */
         
         .org-children {
            display: flex;
            gap: 2rem;
         }
         
      `}</style>
        </div>
    );
};

export default OrgChart;
