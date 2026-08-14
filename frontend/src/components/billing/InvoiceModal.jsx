import React, { useState, useEffect } from 'react';
import { tenantService } from '../../services';
import {
    XCircleIcon,
    PrinterIcon,
    ArrowDownTrayIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    BuildingOffice2Icon
} from '@heroicons/react/24/outline';

const InvoiceModal = ({ invoiceId, onClose }) => {
    const [invoiceData, setInvoiceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (invoiceId) {
            loadInvoice();
        }
    }, [invoiceId]);

    const loadInvoice = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await tenantService.getInvoice(invoiceId);
            if (res.success) {
                setInvoiceData(res.invoice);
            }
        } catch (err) {
            console.error('Failed to load invoice:', err);
            setError(err.response?.data?.message || 'Failed to load invoice details');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (!invoiceId) return null;

    const inv = invoiceData || {};
    const vendor = inv.vendor || {
        company_name: 'HRMS Pro Technologies Inc.',
        address: 'Level 5, Enterprise Tower, Cyber City',
        city: 'Hyderabad, Telangana, 500081',
        country: 'India',
        tax_id: '36AAAAA0000A1Z5',
        support_email: 'billing@hrmspro.online',
        website: 'https://hrmspro.online'
    };

    const isINR = inv.currency === 'INR';
    const amount = parseFloat(inv.amount || 0);
    const symbol = isINR ? '₹' : '$';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:w-full print:max-w-none print:rounded-none"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Top Bar (Hidden during Print) */}
                <div className="px-6 py-3.5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50 print:hidden">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-emerald-600" />
                        <span className="font-bold text-neutral-800 text-sm">Tax Invoice: {inv.invoice_number || `INV-${inv.id || ''}`}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="btn btn-secondary btn-xs text-xs flex items-center gap-1.5"
                        >
                            <PrinterIcon className="w-3.5 h-3.5" />
                            Print / Save PDF
                        </button>
                        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
                            <XCircleIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Printable Invoice Container */}
                <div className="p-8 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
                            <p className="text-xs font-semibold text-neutral-600">Loading invoice document...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 text-red-800 rounded-xl text-xs font-medium">
                            {error}
                        </div>
                    ) : (
                        <div className="space-y-6 text-neutral-800">
                            {/* Invoice Header */}
                            <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black text-base">
                                            H
                                        </div>
                                        <span className="text-xl font-black tracking-tight text-neutral-900">HRMS PRO</span>
                                    </div>
                                    <p className="text-xs font-bold text-neutral-700">{vendor.company_name}</p>
                                    <p className="text-[11px] text-neutral-500">{vendor.address}</p>
                                    <p className="text-[11px] text-neutral-500">{vendor.city}, {vendor.country}</p>
                                    <p className="text-[11px] font-mono text-neutral-600 mt-1">Tax ID / GSTIN: {vendor.tax_id}</p>
                                </div>

                                <div className="text-right">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-black uppercase rounded-full tracking-wider">
                                        {inv.status === 'completed' ? 'PAID' : inv.status}
                                    </span>
                                    <h2 className="text-2xl font-black text-neutral-900 mt-2">TAX INVOICE</h2>
                                    <p className="font-mono text-xs font-bold text-neutral-700 mt-0.5">
                                        Invoice #: {inv.invoice_number || `INV-${inv.id}`}
                                    </p>
                                    <p className="text-[11px] text-neutral-500">
                                        Date: {new Date(inv.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>

                            {/* Billed To / Customer Details */}
                            <div className="grid grid-cols-2 gap-6 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
                                <div>
                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">Billed To (Customer)</p>
                                    <h4 className="text-sm font-black text-neutral-900">{inv.tenant_name || inv.tenant_id}</h4>
                                    {inv.contact_person && (
                                        <p className="text-xs text-neutral-700 mt-0.5 font-medium">Attn: {inv.contact_person}</p>
                                    )}
                                    {inv.billing_address && (
                                        <p className="text-[11px] text-neutral-600 mt-0.5">{inv.billing_address}, {inv.city}</p>
                                    )}
                                    <p className="text-[11px] text-neutral-500">{inv.country || 'India'}</p>
                                    {inv.tax_id && (
                                        <p className="text-[11px] font-mono text-neutral-700 mt-1 font-bold">Tax ID / GSTIN: {inv.tax_id}</p>
                                    )}
                                </div>

                                <div className="text-right">
                                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mb-1">Payment Method & Ref</p>
                                    <p className="text-xs font-bold text-neutral-800 uppercase">{inv.gateway?.replace('_', ' ')}</p>
                                    <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                                        Txn: {inv.transaction_id || inv.razorpay_payment_id || inv.paypal_order_id || 'OFFLINE-RECORD'}
                                    </p>
                                    <p className="text-[11px] text-neutral-500 mt-0.5">Tenant Slug: <span className="font-mono">{inv.tenant_id}</span></p>
                                </div>
                            </div>

                            {/* Line Items Table */}
                            <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead className="bg-neutral-100/80 border-b border-neutral-200">
                                        <tr>
                                            <th className="p-3 font-bold text-neutral-800">Description</th>
                                            <th className="p-3 font-bold text-neutral-800 text-center">Plan Tier</th>
                                            <th className="p-3 font-bold text-neutral-800 text-center">Billing Cycle</th>
                                            <th className="p-3 font-bold text-neutral-800 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-200">
                                        <tr>
                                            <td className="p-3">
                                                <div className="font-bold text-neutral-900">
                                                    HRMS Pro SaaS Cloud Subscription
                                                </div>
                                                <div className="text-[11px] text-neutral-500">
                                                    Multi-tenant cloud HRMS workspace with automated modules
                                                </div>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="px-2 py-0.5 rounded font-bold uppercase text-[10px] bg-primary-50 text-primary-700">
                                                    {inv.plan_id}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center text-neutral-600">
                                                30 Days / Monthly
                                            </td>
                                            <td className="p-3 text-right font-black text-neutral-900">
                                                {symbol}{amount.toLocaleString()}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Summary / Total Section */}
                            <div className="flex justify-end">
                                <div className="w-64 space-y-1.5 text-xs">
                                    <div className="flex justify-between text-neutral-600">
                                        <span>Subtotal:</span>
                                        <span className="font-medium">{symbol}{amount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-neutral-600">
                                        <span>Taxes (Included):</span>
                                        <span className="font-medium">{symbol}0.00</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-black text-neutral-900 pt-2 border-t border-neutral-300">
                                        <span>Total Paid:</span>
                                        <span>{symbol}{amount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer & Authenticity Notes */}
                            <div className="pt-6 border-t border-neutral-200 text-center text-[10px] text-neutral-400">
                                <p className="font-medium text-neutral-600">Thank you for subscribing to HRMS Pro!</p>
                                <p className="mt-0.5">This is a computer-generated tax invoice and requires no physical signature.</p>
                                <p className="mt-0.5">For billing inquiries, please contact {vendor.support_email} or visit {vendor.website}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceModal;
