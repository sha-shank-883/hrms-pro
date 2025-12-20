import React, { useState, useEffect } from 'react';
import { FaTimes, FaSave } from 'react-icons/fa';

const TaxDeclarationModal = ({ isOpen, onClose, onSubmit, initialData }) => {
    const [formData, setFormData] = useState({
        financial_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        regime: 'new',
        section_80c: 0,
        section_80d: 0,
        hra: 0,
        lta: 0,
        other_deductions: 0
    });

    useEffect(() => {
        if (initialData) {
            setFormData({
                financial_year: initialData.financial_year,
                regime: initialData.regime || 'new',
                section_80c: initialData.section_80c || 0,
                section_80d: initialData.section_80d || 0,
                hra: initialData.hra || 0,
                lta: initialData.lta || 0,
                other_deductions: initialData.other_deductions || 0
            });
        }
    }, [initialData]);

    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'regime' || name === 'financial_year' ? value : parseFloat(value) || 0
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(formData);
    };

    // Calculate total deductions for display
    const totalDeductions = formData.regime === 'old'
        ? (parseFloat(formData.section_80c) + parseFloat(formData.section_80d) + parseFloat(formData.hra) + parseFloat(formData.lta) + parseFloat(formData.other_deductions))
        : 0; // New regime has practically no deductions, simplified logic

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-xl font-bold text-gray-800">IT Declaration</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <FaTimes size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="form-group">
                            <label className="form-label">Financial Year</label>
                            <select
                                name="financial_year"
                                value={formData.financial_year}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="2024-2025">2024-2025</option>
                                <option value="2025-2026">2025-2026</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Tax Regime</label>
                            <select
                                name="regime"
                                value={formData.regime}
                                onChange={handleChange}
                                className="form-input"
                            >
                                <option value="new">New Regime (Default)</option>
                                <option value="old">Old Regime</option>
                            </select>
                        </div>
                    </div>

                    {formData.regime === 'old' && (
                        <>
                            <h3 className="section-title text-sm uppercase tracking-wider text-gray-500 font-semibold mb-3">Deductions (Old Regime Only)</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label">Section 80C (Max 1.5L)</label>
                                    <input
                                        type="number"
                                        name="section_80c"
                                        value={formData.section_80c}
                                        onChange={handleChange}
                                        className="form-input"
                                        max="150000"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Section 80D (Medical)</label>
                                    <input
                                        type="number"
                                        name="section_80d"
                                        value={formData.section_80d}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">HRA</label>
                                    <input
                                        type="number"
                                        name="hra"
                                        value={formData.hra}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">LTA</label>
                                    <input
                                        type="number"
                                        name="lta"
                                        value={formData.lta}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                                <div className="form-group col-span-2">
                                    <label className="form-label">Other Deductions</label>
                                    <input
                                        type="number"
                                        name="other_deductions"
                                        value={formData.other_deductions}
                                        onChange={handleChange}
                                        className="form-input"
                                    />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center mb-6">
                                <span className="font-semibold text-gray-700">Total Projected Deductions:</span>
                                <span className="text-xl font-bold text-green-600">₹{totalDeductions.toLocaleString()}</span>
                            </div>
                        </>
                    )}

                    {formData.regime === 'new' && (
                        <div className="bg-blue-50 text-blue-800 p-4 rounded-lg mb-6 text-sm">
                            The New Tax Regime offers lower tax rates but does not allow most exemptions and deductions (like 80C, 80D, HRA).
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary flex items-center gap-2">
                            <FaSave /> Submit Declaration
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TaxDeclarationModal;
