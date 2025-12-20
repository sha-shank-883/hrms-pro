import { useState, useEffect } from 'react';
import axios from 'axios';

export const useDepartments = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/departments', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success) {
                    setDepartments(response.data.data);
                }
            } catch (error) {
                console.error("Failed to fetch departments", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDepartments();
    }, []);

    return { departments, loading };
};
