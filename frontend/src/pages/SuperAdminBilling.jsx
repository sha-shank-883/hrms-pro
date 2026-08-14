import React, { useState, useEffect } from 'react';
import { tenantService } from '../services';
import InvoiceModal from '../components/billing/InvoiceModal';
import StatementModal from '../components/billing/StatementModal';
import {
    CreditCardIcon,
    BanknotesIcon,
    DocumentTextIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    PlusIcon,
    XCircleIcon,
    MagnifyingGlassIcon,
    DocumentChartBarIcon,
    PrinterIcon,
    EyeIcon
} from '@heroicons/react/24/outline';

const SuperAdminBilling = () => {
    const [summary, setSummary] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [tenants, setTenants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedTenantFilter, setSelectedTenantFilter] = useState('all');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Invoice View Modal & Statement View Modal
    const [activeInvoiceId, setActiveInvoiceId] = useState(null);
    const [statementTenant, setStatementTenant] = useState(null);

    const [paymentModal, setPaymentModal] = useState({
        show: false,
        formData: {
            tenant_id: '',
            plan_id: 'scale',
            amount: 799,
            currency: 'INR',
            gateway: 'manual_wire',
            duration_days: 30,
            invoice_number: '',
            notes: ''
        }
    });

    useEffect(() => {
        loadBillingData();
    }, []);

    const loadBillingData = async () => {
        setLoading(true);
        try {
            const [billingRes, tenantsData, plansData] = await Promise.all([
                tenantService.getBillingOverview(),
                tenantService.getAll().catch(() => []),
                tenantService.getPlanConfigs().catch(() => ({ plans: [] }))
            ]);

            if (billingRes.success) {
                setSummary(billingRes.summary);
                setTransactions(billingRes.transactions || []);
            }
            setTenants(tenantsData || []);
            if (plansData?.plans) setPlans(plansData.plans);
        } catch (err) {
            console.error('Failed to load billing overview:', err);
            setError('Failed to load billing records');
        } finally {
            setLoading(false);
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        try {
            setError('');
            const res = await tenantService.recordManualPayment(paymentModal.formData);
            setSuccess(res.message || 'Offline payment recorded and subscription extended');
            setPaymentModal({ ...paymentModal, show: false });
            loadBillingData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to record payment');
        }
    };

    const filteredTransactions = transactions.filter(txn => {
        const matchesSearch = (txn.tenant_name || txn.tenant_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (txn.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (txn.transaction_id || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || txn.status === filterStatus;
        const matchesTenant = selectedTenantFilter === 'all' || txn.tenant_id === selectedTenantFilter;
        return matchesSearch && matchesStatus && matchesTenant;
    });

    const activeFilteredTenantObj = tenants.find(t => t.tenant_id === selectedTenantFilter);

    return (
        <div className="w-full pb-8">
            {/* Header */}
            <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="page-title text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <CreditCardIcon className="w-6 h-6 text-emerald-600" />
                        Payments, Invoices & Revenue
                    </h1>
                    <p className="mt-0.5 text-xs text-neutral-500">
                        Platform revenue collected, automated gateways (Razorpay / PayPal), customer tax invoices, and account statements
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={loadBillingData} className="btn btn-secondary btn-xs text-xs">
                        <ArrowPathIcon className="w-3.5 h-3.5 mr-1" />
                        Refresh
                    </button>
                    <button
                        onClick={() => {
                            setPaymentModal({
                                show: true,
                                formData: {
                                    tenant_id: selectedTenantFilter !== 'all' ? selectedTenantFilter : (tenants[0]?.tenant_id || ''),
                                    plan_id: 'scale',
                                    amount: 799,
                                    currency: 'INR',
                                    gateway: 'manual_wire',
                                    duration_days: 30,
                                    invoice_number: '',
                                    notes: ''
                                }
                            });
                        }}
                        className="btn btn-primary btn-xs text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                    >
                        <PlusIcon className="w-3.5 h-3.5 mr-1" />
                        Record Offline Payment
                    </button>
                </div>
            </div>

            {/* Notification Alerts */}
            {success && (
                <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between animate-in fade-in text-xs">
                    <div className="flex items-center gap-2">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="font-medium">{success}</span>
                    </div>
                    <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700"><XCircleIcon className="w-4 h-4" /></button>
                </div>
            )}
            {error && (
                <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center justify-between animate-in fade-in text-xs">
                    <div className="flex items-center gap-2">
                        <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
                        <span className="font-medium">{error}</span>
                    </div>
                    <button onClick={() => setError('')} className="text-red-500 hover:text-red-700"><XCircleIcon className="w-4 h-4" /></button>
                </div>
            )}

            {/* 4-Column Revenue Metrics Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 mb-6">
                <div className="card p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-sm relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">Total Revenue Collected</p>
                        <p className="text-2xl font-black mt-1">₹{parseFloat(summary?.total_inr || 0).toLocaleString()}</p>
                        <p className="text-[11px] text-emerald-100 mt-0.5">
                            + ${parseFloat(summary?.total_usd || 0).toLocaleString()} USD
                        </p>
                    </div>
                    <BanknotesIcon className="w-20 h-20 text-white/10 absolute -right-2 -bottom-2 pointer-events-none" />
                </div>

                <div className="card p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Paid Subscriptions</p>
                            <p className="text-2xl font-black text-neutral-900 mt-1">{summary?.paid_subscriptions || 0}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Active premium companies</p>
                        </div>
                        <div className="p-2.5 bg-primary-50 rounded-xl">
                            <CreditCardIcon className="w-5 h-5 text-primary-600" />
                        </div>
                    </div>
                </div>

                <div className="card p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Processed Invoices</p>
                            <p className="text-2xl font-black text-emerald-600 mt-1">{summary?.total_successful_payments || 0}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Successful transactions</p>
                        </div>
                        <div className="p-2.5 bg-emerald-50 rounded-xl">
                            <CheckCircleIcon className="w-5 h-5 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="card p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Renewals Due</p>
                            <p className="text-2xl font-black text-amber-600 mt-1">{summary?.expiring_soon || 0}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Expiring in 7 days</p>
                        </div>
                        <div className="p-2.5 bg-amber-50 rounded-xl">
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Focused Tenant Statement Banner (When Tenant is Selected) */}
            {activeFilteredTenantObj && (
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-xl text-indigo-700">
                            <DocumentChartBarIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-xs font-black text-indigo-950">
                                Filtered Account: {activeFilteredTenantObj.name} ({activeFilteredTenantObj.tenant_id})
                            </h4>
                            <p className="text-[11px] text-indigo-700">
                                Current Plan: <span className="font-bold uppercase">{activeFilteredTenantObj.subscription_plan || 'free'}</span> • Status: <span className="font-bold uppercase">{activeFilteredTenantObj.status}</span>
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setStatementTenant(activeFilteredTenantObj)}
                        className="btn btn-primary btn-xs text-xs bg-indigo-600 hover:bg-indigo-700 border-indigo-600 flex items-center gap-1.5 whitespace-nowrap"
                    >
                        <DocumentChartBarIcon className="w-3.5 h-3.5" />
                        Generate Statement of Account
                    </button>
                </div>
            )}

            {/* Transactions & Invoices Table */}
            <div className="card p-0 overflow-hidden border border-neutral-200 shadow-xs rounded-2xl">
                <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-neutral-50/60">
                    <div>
                        <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                            <DocumentTextIcon className="w-4 h-4 text-emerald-600" />
                            Customer Payment History & Invoices
                        </h3>
                        <p className="text-[11px] text-neutral-500">All customer subscription payments across Razorpay, PayPal, and offline wire</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {/* Tenant Filter */}
                        <select
                            className="form-input py-1 text-xs font-bold"
                            value={selectedTenantFilter}
                            onChange={(e) => setSelectedTenantFilter(e.target.value)}
                        >
                            <option value="all">All Companies</option>
                            {tenants.map(t => (
                                <option key={t.tenant_id} value={t.tenant_id}>{t.name} ({t.tenant_id})</option>
                            ))}
                        </select>

                        {/* Status Filter */}
                        <select
                            className="form-input py-1 text-xs"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="completed">Completed</option>
                            <option value="pending">Pending</option>
                            <option value="failed">Failed</option>
                        </select>

                        {/* Search Bar */}
                        <div className="relative w-full sm:w-56">
                            <MagnifyingGlassIcon className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search invoice or txn #..."
                                className="form-input pl-8 py-1 text-xs w-full"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="data-table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Date & Time</th>
                                <th>Company Tenant</th>
                                <th>Invoice #</th>
                                <th>Plan & Amount</th>
                                <th>Gateway</th>
                                <th>Status</th>
                                <th>Transaction Ref</th>
                                <th className="text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-neutral-500 text-xs">Loading billing records...</td>
                                </tr>
                            ) : filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-8 text-neutral-500 text-xs">
                                        <div className="flex flex-col items-center">
                                            <CreditCardIcon className="w-10 h-10 text-neutral-300 mb-1.5" />
                                            <p className="font-medium">No payment records found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((txn) => (
                                    <tr key={txn.id} className="hover:bg-neutral-50/70 transition-colors">
                                        <td className="text-xs text-neutral-500 whitespace-nowrap">
                                            {new Date(txn.created_at).toLocaleDateString()} <span className="text-[10px] text-neutral-400">{new Date(txn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </td>
                                        <td>
                                            <div className="font-bold text-neutral-900 text-xs">{txn.tenant_name || txn.tenant_id}</div>
                                            <div className="text-[10px] text-neutral-400 font-mono">{txn.tenant_id}</div>
                                        </td>
                                        <td>
                                            <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-neutral-100 rounded text-neutral-700">
                                                {txn.invoice_number || `INV-${txn.id}`}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="font-bold text-neutral-900 text-xs">
                                                {txn.currency === 'INR' ? '₹' : '$'}{parseFloat(txn.amount).toLocaleString()}
                                            </div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-700">
                                                {txn.plan_id}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-neutral-100 text-neutral-700">
                                                {txn.gateway.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${txn.status === 'completed'
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : txn.status === 'pending'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}>
                                                {txn.status}
                                            </span>
                                        </td>
                                        <td className="font-mono text-[11px] text-neutral-500">
                                            {txn.transaction_id || txn.razorpay_payment_id || txn.paypal_order_id || '-'}
                                        </td>
                                        <td className="text-right">
                                            <button
                                                onClick={() => setActiveInvoiceId(txn.id)}
                                                className="btn btn-secondary btn-xs text-xs flex items-center gap-1 text-emerald-700 hover:text-emerald-800 ml-auto"
                                                title="View & Print Tax Invoice"
                                            >
                                                <EyeIcon className="w-3.5 h-3.5" />
                                                Invoice
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* INVOICE MODAL */}
            {activeInvoiceId && (
                <InvoiceModal invoiceId={activeInvoiceId} onClose={() => setActiveInvoiceId(null)} />
            )}

            {/* STATEMENT OF ACCOUNT MODAL */}
            {statementTenant && (
                <StatementModal
                    tenant={statementTenant}
                    invoices={transactions.filter(t => t.tenant_id === statementTenant.tenant_id)}
                    onClose={() => setStatementTenant(null)}
                />
            )}

            {/* RECORD MANUAL OFFLINE PAYMENT MODAL */}
            {paymentModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setPaymentModal({ ...paymentModal, show: false })}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-emerald-50/50">
                            <div>
                                <h3 className="text-base font-black text-neutral-900 flex items-center gap-2">
                                    <BanknotesIcon className="w-5 h-5 text-emerald-600" />
                                    Record Offline Payment & Extend Subscription
                                </h3>
                                <p className="text-xs text-neutral-500">Record bank wire, cheque, or cash receipts for any company</p>
                            </div>
                            <button onClick={() => setPaymentModal({ ...paymentModal, show: false })} className="text-neutral-400 hover:text-neutral-600">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Company Tenant</label>
                                <select
                                    required
                                    className="form-input w-full text-xs"
                                    value={paymentModal.formData.tenant_id}
                                    onChange={(e) => setPaymentModal({
                                        ...paymentModal,
                                        formData: { ...paymentModal.formData, tenant_id: e.target.value }
                                    })}
                                >
                                    <option value="" disabled>Select Tenant</option>
                                    {tenants.map(t => (
                                        <option key={t.tenant_id} value={t.tenant_id}>{t.name} ({t.tenant_id})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Assigned Plan Tier</label>
                                    <select
                                        className="form-input w-full text-xs font-bold"
                                        value={paymentModal.formData.plan_id}
                                        onChange={(e) => setPaymentModal({
                                            ...paymentModal,
                                            formData: { ...paymentModal.formData, plan_id: e.target.value }
                                        })}
                                    >
                                        {plans.map(p => (
                                            <option key={p.plan_id} value={p.plan_id}>{p.name} ({p.plan_id.toUpperCase()})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Duration</label>
                                    <select
                                        className="form-input w-full text-xs"
                                        value={paymentModal.formData.duration_days}
                                        onChange={(e) => setPaymentModal({
                                            ...paymentModal,
                                            formData: { ...paymentModal.formData, duration_days: parseInt(e.target.value) || 30 }
                                        })}
                                    >
                                        <option value="30">1 Month (30 Days)</option>
                                        <option value="90">3 Months (Quarterly)</option>
                                        <option value="180">6 Months (Half-Yearly)</option>
                                        <option value="365">1 Year (Annual)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="form-group md:col-span-2">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Amount Paid</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        min="0"
                                        className="form-input w-full text-sm font-bold"
                                        value={paymentModal.formData.amount}
                                        onChange={(e) => setPaymentModal({
                                            ...paymentModal,
                                            formData: { ...paymentModal.formData, amount: parseFloat(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Currency</label>
                                    <select
                                        className="form-input w-full text-xs"
                                        value={paymentModal.formData.currency}
                                        onChange={(e) => setPaymentModal({
                                            ...paymentModal,
                                            formData: { ...paymentModal.formData, currency: e.target.value }
                                        })}
                                    >
                                        <option value="INR">INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Payment Method</label>
                                    <select
                                        className="form-input w-full text-xs"
                                        value={paymentModal.formData.gateway}
                                        onChange={(e) => setPaymentModal({
                                            ...paymentModal,
                                            formData: { ...paymentModal.formData, gateway: e.target.value }
                                        })}
                                    >
                                        <option value="manual_wire">Direct Bank Wire (NEFT/RTGS/IMPS)</option>
                                        <option value="manual_cash">Cash Receipt</option>
                                        <option value="manual_cheque">Bank Cheque</option>
                                        <option value="manual_upi">Direct UPI Transfer</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Custom Invoice # (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input w-full text-xs font-mono"
                                        placeholder="e.g. INV-2026-104"
                                        value={paymentModal.formData.invoice_number}
                                        onChange={(e) => setPaymentModal({
                                            ...paymentModal,
                                            formData: { ...paymentModal.formData, invoice_number: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Payment Notes / Reference</label>
                                <textarea
                                    className="form-input w-full text-xs"
                                    rows="2"
                                    placeholder="e.g. Bank transfer ref #123456 received in HDFC account"
                                    value={paymentModal.formData.notes}
                                    onChange={(e) => setPaymentModal({
                                        ...paymentModal,
                                        formData: { ...paymentModal.formData, notes: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button type="button" onClick={() => setPaymentModal({ ...paymentModal, show: false })} className="btn btn-ghost text-xs">Cancel</button>
                                <button type="submit" className="btn btn-primary text-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600">
                                    Save Payment & Extend
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminBilling;
