import React from 'react';
import {
    XCircleIcon,
    PrinterIcon,
    DocumentChartBarIcon,
    CheckCircleIcon,
    BanknotesIcon
} from '@heroicons/react/24/outline';

const StatementModal = ({ tenant, invoices = [], onClose }) => {
    if (!tenant) return null;

    const completedInvoices = invoices.filter(inv => inv.status === 'completed');
    const totalSpentINR = completedInvoices
        .filter(inv => inv.currency === 'INR')
        .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);
    const totalSpentUSD = completedInvoices
        .filter(inv => inv.currency === 'USD')
        .reduce((sum, inv) => sum + parseFloat(inv.amount || 0), 0);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:p-0 print:bg-white" onClick={onClose}>
            <div
                className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 print:shadow-none print:w-full print:max-w-none print:rounded-none"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal Top Controls (Hidden during Print) */}
                <div className="px-6 py-3.5 border-b border-neutral-200 flex justify-between items-center bg-neutral-50 print:hidden">
                    <div className="flex items-center gap-2">
                        <DocumentChartBarIcon className="w-5 h-5 text-indigo-600" />
                        <span className="font-bold text-neutral-800 text-sm">Statement of Account — {tenant.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrint}
                            className="btn btn-secondary btn-xs text-xs flex items-center gap-1.5"
                        >
                            <PrinterIcon className="w-3.5 h-3.5" />
                            Print Statement
                        </button>
                        <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
                            <XCircleIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Printable Statement Container */}
                <div className="p-8 max-h-[85vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-8 space-y-6 text-neutral-800">
                    {/* Header */}
                    <div className="flex justify-between items-start border-b border-neutral-200 pb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white font-black text-base">
                                    H
                                </div>
                                <span className="text-xl font-black tracking-tight text-neutral-900">HRMS PRO</span>
                            </div>
                            <p className="text-xs font-bold text-neutral-700">HRMS Pro Technologies Inc.</p>
                            <p className="text-[11px] text-neutral-500">Subscription Billing & Revenue Division</p>
                            <p className="text-[11px] font-mono text-neutral-500">billing@hrmspro.online</p>
                        </div>

                        <div className="text-right">
                            <h2 className="text-2xl font-black text-neutral-900">STATEMENT OF ACCOUNT</h2>
                            <p className="text-xs text-neutral-500 mt-1">
                                As of: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <p className="text-[11px] font-mono text-neutral-400 mt-0.5">Tenant Slug: {tenant.tenant_id}</p>
                        </div>
                    </div>

                    {/* Account Overview Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Customer Account</p>
                            <h4 className="text-sm font-black text-neutral-900 mt-1">{tenant.name}</h4>
                            <p className="text-xs text-neutral-600 mt-0.5">{tenant.contact_email || 'No email registered'}</p>
                            {tenant.tax_id && (
                                <p className="text-[11px] font-mono text-neutral-500 mt-1">Tax ID: {tenant.tax_id}</p>
                            )}
                        </div>

                        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400">Current Subscription</p>
                            <h4 className="text-sm font-black text-primary-700 uppercase mt-1">{tenant.subscription_plan || 'free'}</h4>
                            <p className="text-xs text-neutral-600 mt-0.5">
                                Expiry: {tenant.subscription_expiry ? new Date(tenant.subscription_expiry).toLocaleDateString() : 'N/A'}
                            </p>
                            <p className="text-[11px] text-neutral-500 mt-1">Status: <span className="font-bold text-emerald-600 uppercase">{tenant.status}</span></p>
                        </div>

                        <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-700 text-white rounded-2xl">
                            <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-100">Total Lifetime Invoiced</p>
                            <h4 className="text-xl font-black mt-1">₹{totalSpentINR.toLocaleString()}</h4>
                            {totalSpentUSD > 0 && (
                                <p className="text-xs text-emerald-100 mt-0.5">+ ${totalSpentUSD.toLocaleString()} USD</p>
                            )}
                            <p className="text-[10px] text-emerald-100 mt-1">{completedInvoices.length} Paid Transactions</p>
                        </div>
                    </div>

                    {/* Transactions Ledger Table */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">Itemized Transaction Ledger</h4>
                        <div className="border border-neutral-200 rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead className="bg-neutral-100/80 border-b border-neutral-200">
                                    <tr>
                                        <th className="p-3 font-bold text-neutral-800">Date</th>
                                        <th className="p-3 font-bold text-neutral-800">Invoice Number</th>
                                        <th className="p-3 font-bold text-neutral-800">Plan Purchased</th>
                                        <th className="p-3 font-bold text-neutral-800">Payment Gateway</th>
                                        <th className="p-3 font-bold text-neutral-800">Status</th>
                                        <th className="p-3 font-bold text-neutral-800 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200">
                                    {invoices.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center py-6 text-neutral-400">No transaction records found for this account</td>
                                        </tr>
                                    ) : (
                                        invoices.map((inv) => (
                                            <tr key={inv.id}>
                                                <td className="p-3 text-neutral-600 whitespace-nowrap">
                                                    {new Date(inv.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="p-3 font-mono font-bold text-neutral-900">
                                                    {inv.invoice_number || `INV-${inv.id}`}
                                                </td>
                                                <td className="p-3 uppercase font-bold text-[10px] text-primary-700">
                                                    {inv.plan_id}
                                                </td>
                                                <td className="p-3 uppercase text-[10px] font-bold text-neutral-600">
                                                    {inv.gateway?.replace('_', ' ')}
                                                </td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        inv.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                                                    }`}>
                                                        {inv.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right font-black text-neutral-900">
                                                    {inv.currency === 'INR' ? '₹' : '$'}{parseFloat(inv.amount).toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Statement Footer */}
                    <div className="pt-6 border-t border-neutral-200 text-center text-[10px] text-neutral-400">
                        <p className="font-semibold text-neutral-600">HRMS Pro Cloud Technologies — Global SaaS Platform</p>
                        <p className="mt-0.5">For billing reconciliations or custom enterprise enterprise contracts, email billing@hrmspro.online</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatementModal;
