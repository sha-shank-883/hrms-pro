import React, { useState, useEffect } from 'react';
import { tenantService, paymentService } from '../services';
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
    EyeIcon,
    ArrowUturnLeftIcon,
    GiftIcon,
    TicketIcon,
    TagIcon,
    TrashIcon,
    SparklesIcon,
    CalendarDaysIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

const SuperAdminBilling = () => {
    const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'coupons'
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

    // Coupons State
    const [coupons, setCoupons] = useState([]);
    const [couponsLoading, setCouponsLoading] = useState(false);

    // Invoice View Modal & Statement View Modal
    const [activeInvoiceId, setActiveInvoiceId] = useState(null);
    const [statementTenant, setStatementTenant] = useState(null);

    // Refund Modal State
    const [refundModal, setRefundModal] = useState({
        show: false,
        txn: null,
        amount: '',
        reason: '',
        adjustPlan: true,
        loading: false,
        error: ''
    });

    // Offline Payment Modal State
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

    // Super Admin Manual Grant / Gift Subscription Modal
    const [grantModal, setGrantModal] = useState({
        show: false,
        loading: false,
        error: '',
        formData: {
            tenantId: '',
            planId: 'scale',
            seats: 25,
            durationMonths: 1,
            customExpiry: '',
            grantType: 'gift', // 'gift' | 'cash' | 'bank_transfer' | 'vip_offer' | 'custom'
            amountPaid: 0,
            currency: 'INR',
            notes: ''
        }
    });

    // Create New Coupon Modal
    const [couponModal, setCouponModal] = useState({
        show: false,
        loading: false,
        error: '',
        formData: {
            code: '',
            discountType: 'percentage',
            discountValue: 20,
            applicablePlans: ['all'],
            applicableCycles: ['all'],
            minSeats: 1,
            maxUses: '',
            validUntil: '',
            description: ''
        }
    });

    useEffect(() => {
        loadBillingData();
        loadCouponsData();
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

    const loadCouponsData = async () => {
        setCouponsLoading(true);
        try {
            const res = await paymentService.getCoupons();
            if (res.success) {
                setCoupons(res.data || []);
            }
        } catch (err) {
            console.error('Failed to load coupons:', err);
        } finally {
            setCouponsLoading(false);
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

    const handleProcessRefund = async (e) => {
        e.preventDefault();
        setRefundModal(prev => ({ ...prev, loading: true, error: '' }));
        try {
            const res = await paymentService.processRefund({
                paymentLogId: refundModal.txn.id,
                amount: refundModal.amount ? parseFloat(refundModal.amount) : undefined,
                reason: refundModal.reason,
                adjustPlan: refundModal.adjustPlan
            });
            setSuccess(res.message || 'Refund successfully processed');
            setRefundModal({ show: false, txn: null, amount: '', reason: '', adjustPlan: true, loading: false, error: '' });
            loadBillingData();
        } catch (err) {
            setRefundModal(prev => ({
                ...prev,
                loading: false,
                error: err.response?.data?.message || err.message || 'Failed to process refund'
            }));
        }
    };

    const handleManualGrantSubmit = async (e) => {
        e.preventDefault();
        setGrantModal(prev => ({ ...prev, loading: true, error: '' }));
        try {
            const res = await paymentService.manualGrantSubscription(grantModal.formData);
            setSuccess(res.message || 'Subscription successfully granted to tenant');
            setGrantModal({
                show: false,
                loading: false,
                error: '',
                formData: {
                    tenantId: '',
                    planId: 'scale',
                    seats: 25,
                    durationMonths: 1,
                    customExpiry: '',
                    grantType: 'gift',
                    amountPaid: 0,
                    currency: 'INR',
                    notes: ''
                }
            });
            loadBillingData();
        } catch (err) {
            setGrantModal(prev => ({
                ...prev,
                loading: false,
                error: err.response?.data?.message || err.message || 'Failed to grant subscription'
            }));
        }
    };

    const handleCreateCouponSubmit = async (e) => {
        e.preventDefault();
        setCouponModal(prev => ({ ...prev, loading: true, error: '' }));
        try {
            const res = await paymentService.createCoupon(couponModal.formData);
            setSuccess(res.message || 'Coupon created successfully');
            setCouponModal({
                show: false,
                loading: false,
                error: '',
                formData: {
                    code: '',
                    discountType: 'percentage',
                    discountValue: 20,
                    applicablePlans: ['all'],
                    applicableCycles: ['all'],
                    minSeats: 1,
                    maxUses: '',
                    validUntil: '',
                    description: ''
                }
            });
            loadCouponsData();
        } catch (err) {
            setCouponModal(prev => ({
                ...prev,
                loading: false,
                error: err.response?.data?.message || err.message || 'Failed to create coupon'
            }));
        }
    };

    const handleToggleCouponActive = async (coupon) => {
        try {
            await paymentService.updateCoupon(coupon.id, { isActive: !coupon.isActive });
            setSuccess(`Coupon "${coupon.code}" is now ${!coupon.isActive ? 'Active' : 'Inactive'}`);
            loadCouponsData();
        } catch (err) {
            setError('Failed to update coupon status');
        }
    };

    const handleDeleteCoupon = async (id, code) => {
        if (!window.confirm(`Are you sure you want to delete coupon "${code}"?`)) return;
        try {
            await paymentService.deleteCoupon(id);
            setSuccess(`Coupon "${code}" deleted`);
            loadCouponsData();
        } catch (err) {
            setError('Failed to delete coupon');
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
                <div className="min-w-0 flex-1">
                    <h1 className="page-title text-xl font-bold text-neutral-900 flex items-center gap-2">
                        <CreditCardIcon className="w-6 h-6 text-emerald-600" />
                        Payments, Invoices & Revenue
                    </h1>
                    <p className="mt-0.5 text-xs text-neutral-500">
                        Platform revenue collected, automated gateways (Razorpay / PayPal), customer tax invoices, gift grants & promo coupon engine
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button onClick={() => { loadBillingData(); loadCouponsData(); }} className="btn btn-secondary btn-xs text-xs">
                        <ArrowPathIcon className="w-3.5 h-3.5 mr-1" />
                        Refresh
                    </button>
                    <button
                        onClick={() => {
                            setGrantModal({
                                show: true,
                                loading: false,
                                error: '',
                                formData: {
                                    tenantId: selectedTenantFilter !== 'all' ? selectedTenantFilter : (tenants[0]?.tenant_id || ''),
                                    planId: 'scale',
                                    seats: 25,
                                    durationMonths: 1,
                                    customExpiry: '',
                                    grantType: 'gift',
                                    amountPaid: 0,
                                    currency: 'INR',
                                    notes: ''
                                }
                            });
                        }}
                        className="btn btn-xs text-xs bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white border-0 shadow-xs flex items-center gap-1"
                    >
                        <GiftIcon className="w-3.5 h-3.5" />
                        🎁 Grant / Gift Plan
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
                            <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">Active Coupons</p>
                            <p className="text-2xl font-black text-amber-600 mt-1">{coupons.filter(c => c.isActive).length}</p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">Custom promo codes</p>
                        </div>
                        <div className="p-2.5 bg-amber-50 rounded-xl">
                            <TicketIcon className="w-5 h-5 text-amber-600" />
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

            {/* Tab Selector */}
            <div className="flex items-center gap-2 mb-4 border-b border-neutral-200">
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'invoices'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    <DocumentTextIcon className="w-4 h-4" />
                    Invoices & Payment Logs ({transactions.length})
                </button>
                <button
                    onClick={() => setActiveTab('coupons')}
                    className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${activeTab === 'coupons'
                        ? 'border-amber-500 text-amber-600'
                        : 'border-transparent text-neutral-500 hover:text-neutral-700'
                        }`}
                >
                    <TicketIcon className="w-4 h-4" />
                    🎟️ Promo & Gift Coupons ({coupons.length})
                </button>
            </div>

            {/* TAB 1: Invoices & Transactions Table */}
            {activeTab === 'invoices' && (
                <div className="card p-0 overflow-hidden border border-neutral-200 shadow-xs rounded-2xl">
                    <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-neutral-50/60">
                        <div>
                            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                <DocumentTextIcon className="w-4 h-4 text-emerald-600" />
                                Customer Payment History & Invoices
                            </h3>
                            <p className="text-[11px] text-neutral-500">All customer subscription payments across Razorpay, PayPal, offline wire & manual gifts</p>
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
                                                <div className="font-bold text-xs text-neutral-900">{txn.tenant_name || txn.tenant_id}</div>
                                                <div className="text-[10px] text-neutral-400 font-mono">{txn.tenant_id}</div>
                                            </td>
                                            <td>
                                                <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                    {txn.invoice_number || `INV-${txn.id}`}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="text-xs font-bold text-neutral-900">
                                                    {txn.currency === 'INR' ? '₹' : '$'}{parseFloat(txn.amount).toLocaleString()} {txn.currency}
                                                </div>
                                                <div className="text-[10px] text-neutral-500 capitalize">
                                                    {txn.plan_id ? txn.plan_id.replace(/_/g, ' ') : 'Subscription'}
                                                </div>
                                                {txn.coupon_code && (
                                                    <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                                                        🎟️ {txn.coupon_code}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge text-[10px] uppercase font-bold ${txn.gateway === 'razorpay' ? 'bg-primary-50 text-primary-700 border-primary-200' :
                                                    txn.gateway === 'paypal' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                        txn.gateway === 'coupon_gift' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                                            'bg-purple-50 text-purple-700 border-purple-200'
                                                    }`}>
                                                    {txn.gateway}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge text-[10px] capitalize font-bold ${txn.refund_status === 'refunded' ? 'bg-red-100 text-red-800' :
                                                    txn.refund_status === 'refund_requested' ? 'bg-amber-100 text-amber-800 animate-pulse' :
                                                        txn.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                                            txn.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {txn.refund_status === 'refund_requested' ? 'Refund Requested' :
                                                        txn.refund_status === 'refunded' ? 'Refunded' : txn.status}
                                                </span>
                                            </td>
                                            <td className="text-[10px] font-mono text-neutral-500">
                                                {txn.transaction_id || txn.razorpay_payment_id || txn.paypal_order_id || 'OFFLINE'}
                                            </td>
                                            <td className="text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => setActiveInvoiceId(txn.id)}
                                                        className="btn btn-secondary btn-xs text-xs flex items-center gap-1 hover:bg-emerald-50 hover:text-emerald-700"
                                                        title="View Invoice"
                                                    >
                                                        <EyeIcon className="w-3.5 h-3.5" />
                                                        Invoice
                                                    </button>
                                                    {txn.status === 'completed' && txn.refund_status !== 'refunded' && (
                                                        <button
                                                            onClick={() => setRefundModal({
                                                                show: true,
                                                                txn,
                                                                amount: String(txn.amount),
                                                                reason: txn.refund_reason || '',
                                                                adjustPlan: true,
                                                                loading: false,
                                                                error: ''
                                                            })}
                                                            className="btn btn-xs text-xs bg-red-50 text-red-700 hover:bg-red-100 border-red-200 flex items-center gap-1"
                                                            title="Process Refund"
                                                        >
                                                            <ArrowUturnLeftIcon className="w-3 h-3" />
                                                            Refund
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB 2: Promo & Gift Coupons Management */}
            {activeTab === 'coupons' && (
                <div className="card p-0 overflow-hidden border border-neutral-200 shadow-xs rounded-2xl">
                    <div className="p-4 border-b border-neutral-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-neutral-50/60">
                        <div>
                            <h3 className="text-sm font-bold text-neutral-900 flex items-center gap-2">
                                <TicketIcon className="w-4 h-4 text-amber-500" />
                                Customized Promo Codes & Free Gift Vouchers
                            </h3>
                            <p className="text-[11px] text-neutral-500">
                                Create percentage discounts, flat offers, or 100% free gift subscriptions for VIP clients and marketing campaigns
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setCouponModal({
                                    show: true,
                                    loading: false,
                                    error: '',
                                    formData: {
                                        code: '',
                                        discountType: 'percentage',
                                        discountValue: 20,
                                        applicablePlans: ['all'],
                                        applicableCycles: ['all'],
                                        minSeats: 1,
                                        maxUses: '',
                                        validUntil: '',
                                        description: ''
                                    }
                                });
                            }}
                            className="btn btn-primary btn-xs text-xs bg-amber-600 hover:bg-amber-700 border-amber-600 flex items-center gap-1"
                        >
                            <PlusIcon className="w-3.5 h-3.5" />
                            Create New Coupon
                        </button>
                    </div>

                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Coupon Code</th>
                                    <th>Discount Type & Value</th>
                                    <th>Eligible Plans</th>
                                    <th>Min Seats</th>
                                    <th>Redemptions</th>
                                    <th>Expiry Date</th>
                                    <th>Status</th>
                                    <th className="text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {couponsLoading ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-8 text-neutral-500 text-xs">Loading coupons...</td>
                                    </tr>
                                ) : coupons.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="text-center py-8 text-neutral-500 text-xs">
                                            <div className="flex flex-col items-center">
                                                <TicketIcon className="w-10 h-10 text-neutral-300 mb-1.5" />
                                                <p className="font-medium">No coupons created yet</p>
                                                <p className="text-[11px] text-neutral-400 mt-0.5">Click "Create New Coupon" to create promo codes</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    coupons.map((c) => (
                                        <tr key={c.id} className="hover:bg-neutral-50/70 transition-colors">
                                            <td>
                                                <span className="font-mono font-black text-xs text-neutral-900 bg-neutral-100 px-2.5 py-1 rounded-lg border border-neutral-300">
                                                    {c.code}
                                                </span>
                                                {c.description && (
                                                    <p className="text-[10px] text-neutral-400 mt-0.5">{c.description}</p>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`text-xs font-black px-2 py-0.5 rounded-md ${c.discountType === 'percentage' && c.discountValue >= 100
                                                    ? 'bg-amber-100 text-amber-800 font-black'
                                                    : c.discountType === 'percentage'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {c.discountType === 'percentage' && c.discountValue >= 100
                                                        ? '🎁 100% Free Gift'
                                                        : c.discountType === 'percentage'
                                                            ? `${c.discountValue}% OFF`
                                                            : `₹ / $ ${c.discountValue} Flat OFF`}
                                                </span>
                                            </td>
                                            <td className="text-xs capitalize text-neutral-600">
                                                {Array.isArray(c.applicablePlans) ? c.applicablePlans.join(', ') : 'All'}
                                            </td>
                                            <td className="text-xs font-bold text-neutral-700">
                                                {c.minSeats || 1} Seats
                                            </td>
                                            <td className="text-xs">
                                                <span className="font-bold text-neutral-900">{c.usedCount || 0}</span>
                                                <span className="text-neutral-400"> / {c.maxUses ? c.maxUses : '∞'}</span>
                                            </td>
                                            <td className="text-xs text-neutral-500">
                                                {c.validUntil ? new Date(c.validUntil).toLocaleDateString() : 'Never'}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleToggleCouponActive(c)}
                                                    className={`badge text-[10px] font-bold cursor-pointer transition-all ${c.isActive
                                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                                        : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                                                        }`}
                                                >
                                                    {c.isActive ? 'Active' : 'Inactive'}
                                                </button>
                                            </td>
                                            <td className="text-right">
                                                <button
                                                    onClick={() => handleDeleteCoupon(c.id, c.code)}
                                                    className="btn btn-ghost btn-xs text-red-600 hover:bg-red-50"
                                                    title="Delete Coupon"
                                                >
                                                    <TrashIcon className="w-3.5 h-3.5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* CREATE NEW COUPON MODAL */}
            {couponModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setCouponModal({ ...couponModal, show: false })}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-amber-50/70">
                            <div>
                                <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                                    <TicketIcon className="w-5 h-5 text-amber-600" />
                                    Create Promo Code or Gift Voucher
                                </h3>
                                <p className="text-xs text-amber-700">Generate customizable coupon codes with limits, percentage discounts or 100% free gift vouchers</p>
                            </div>
                            <button onClick={() => setCouponModal({ ...couponModal, show: false })} className="text-neutral-400 hover:text-neutral-600">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {couponModal.error && (
                            <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
                                <span>{couponModal.error}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateCouponSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Coupon Code *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. WELCOME50, GIFT100"
                                        className="form-input w-full text-xs font-mono font-bold uppercase tracking-wider"
                                        value={couponModal.formData.code}
                                        onChange={(e) => setCouponModal({
                                            ...couponModal,
                                            formData: { ...couponModal.formData, code: e.target.value.toUpperCase() }
                                        })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Discount Type</label>
                                    <select
                                        className="form-input w-full text-xs"
                                        value={couponModal.formData.discountType}
                                        onChange={(e) => setCouponModal({
                                            ...couponModal,
                                            formData: { ...couponModal.formData, discountType: e.target.value }
                                        })}
                                    >
                                        <option value="percentage">Percentage (%) Discount</option>
                                        <option value="fixed">Fixed Amount (Flat Discount)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">
                                        {couponModal.formData.discountType === 'percentage' ? 'Percentage Value (%) *' : 'Flat Discount Value *'}
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        max={couponModal.formData.discountType === 'percentage' ? 100 : undefined}
                                        placeholder={couponModal.formData.discountType === 'percentage' ? 'e.g. 50 or 100 for Free Gift' : 'e.g. 500'}
                                        className="form-input w-full text-xs font-bold"
                                        value={couponModal.formData.discountValue}
                                        onChange={(e) => setCouponModal({
                                            ...couponModal,
                                            formData: { ...couponModal.formData, discountValue: e.target.value }
                                        })}
                                    />
                                    {couponModal.formData.discountType === 'percentage' && parseInt(couponModal.formData.discountValue, 10) === 100 && (
                                        <p className="text-[10px] font-bold text-amber-600 mt-1">
                                            🎁 This will function as a 100% Free Gift Voucher!
                                        </p>
                                    )}
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Minimum Seats Required</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Default: 1"
                                        className="form-input w-full text-xs"
                                        value={couponModal.formData.minSeats}
                                        onChange={(e) => setCouponModal({
                                            ...couponModal,
                                            formData: { ...couponModal.formData, minSeats: parseInt(e.target.value, 10) || 1 }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Maximum Usage Limit (Optional)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        placeholder="Blank for unlimited uses"
                                        className="form-input w-full text-xs"
                                        value={couponModal.formData.maxUses}
                                        onChange={(e) => setCouponModal({
                                            ...couponModal,
                                            formData: { ...couponModal.formData, maxUses: e.target.value }
                                        })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="form-input w-full text-xs"
                                        value={couponModal.formData.validUntil}
                                        onChange={(e) => setCouponModal({
                                            ...couponModal,
                                            formData: { ...couponModal.formData, validUntil: e.target.value }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Description / Campaign Purpose</label>
                                <textarea
                                    className="form-input w-full text-xs"
                                    rows="2"
                                    placeholder="e.g. 50% launch discount for Q4 client onboarding"
                                    value={couponModal.formData.description}
                                    onChange={(e) => setCouponModal({
                                        ...couponModal,
                                        formData: { ...couponModal.formData, description: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button type="button" onClick={() => setCouponModal({ ...couponModal, show: false })} className="btn btn-ghost text-xs">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={couponModal.loading}
                                    className="btn btn-primary text-xs bg-amber-600 hover:bg-amber-700 border-amber-600 text-white"
                                >
                                    {couponModal.loading ? 'Creating...' : 'Create Coupon'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* SUPER ADMIN GRANT / GIFT SUBSCRIPTION MODAL */}
            {grantModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setGrantModal({ ...grantModal, show: false })}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-gradient-to-r from-amber-50 to-amber-100/50">
                            <div>
                                <h3 className="text-base font-black text-amber-950 flex items-center gap-2">
                                    <GiftIcon className="w-5 h-5 text-amber-600" />
                                    Grant / Gift Subscription Plan
                                </h3>
                                <p className="text-xs text-amber-700">Directly allot a subscription tier, custom seats and duration to any client (Free Gift or Cash/Wire)</p>
                            </div>
                            <button onClick={() => setGrantModal({ ...grantModal, show: false })} className="text-neutral-400 hover:text-neutral-600">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {grantModal.error && (
                            <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
                                <span>{grantModal.error}</span>
                            </div>
                        )}

                        <form onSubmit={handleManualGrantSubmit} className="p-6 space-y-4">
                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Target Tenant / Client Company *</label>
                                <select
                                    className="form-input w-full text-xs font-bold"
                                    required
                                    value={grantModal.formData.tenantId}
                                    onChange={(e) => setGrantModal({
                                        ...grantModal,
                                        formData: { ...grantModal.formData, tenantId: e.target.value }
                                    })}
                                >
                                    <option value="">-- Select Company --</option>
                                    {tenants.map(t => (
                                        <option key={t.tenant_id} value={t.tenant_id}>
                                            {t.name} ({t.tenant_id}) — Current: {(t.subscription_plan || 'free').toUpperCase()} ({t.employee_limit || 15} seats)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Subscription Tier</label>
                                    <select
                                        className="form-input w-full text-xs font-bold"
                                        value={grantModal.formData.planId}
                                        onChange={(e) => setGrantModal({
                                            ...grantModal,
                                            formData: { ...grantModal.formData, planId: e.target.value }
                                        })}
                                    >
                                        <option value="hatch">Hatch (Starter Tier)</option>
                                        <option value="scale">Scale (Professional Tier)</option>
                                        <option value="enterprise">Enterprise (Unlimited Tier)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Total Employee Seats</label>
                                    <input
                                        type="number"
                                        min="1"
                                        required
                                        className="form-input w-full text-xs font-bold"
                                        value={grantModal.formData.seats}
                                        onChange={(e) => setGrantModal({
                                            ...grantModal,
                                            formData: { ...grantModal.formData, seats: parseInt(e.target.value, 10) || 1 }
                                        })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Duration Period</label>
                                    <select
                                        className="form-input w-full text-xs"
                                        value={grantModal.formData.durationMonths}
                                        onChange={(e) => setGrantModal({
                                            ...grantModal,
                                            formData: { ...grantModal.formData, durationMonths: parseInt(e.target.value, 10) || 1 }
                                        })}
                                    >
                                        <option value="1">1 Month (30 Days)</option>
                                        <option value="3">3 Months (Quarterly)</option>
                                        <option value="6">6 Months (Half-Yearly)</option>
                                        <option value="12">1 Year (365 Days)</option>
                                        <option value="24">2 Years</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Grant Reason / Type</label>
                                    <select
                                        className="form-input w-full text-xs font-bold text-amber-800"
                                        value={grantModal.formData.grantType}
                                        onChange={(e) => setGrantModal({
                                            ...grantModal,
                                            formData: { ...grantModal.formData, grantType: e.target.value }
                                        })}
                                    >
                                        <option value="gift">🎁 100% Free Gift / Promotional Offer</option>
                                        <option value="cash">💵 Cash Received (Personal / Hand)</option>
                                        <option value="bank_transfer">🏦 Direct Bank Wire / RTGS</option>
                                        <option value="vip_offer">⭐ VIP Client Loyalty Grant</option>
                                        <option value="custom">🤝 Custom Partnership Agreement</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Amount Collected (0 for Free Gift)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        className="form-input w-full text-xs font-bold"
                                        value={grantModal.formData.amountPaid}
                                        onChange={(e) => setGrantModal({
                                            ...grantModal,
                                            formData: { ...grantModal.formData, amountPaid: parseFloat(e.target.value) || 0 }
                                        })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Currency</label>
                                    <select
                                        className="form-input w-full text-xs"
                                        value={grantModal.formData.currency}
                                        onChange={(e) => setGrantModal({
                                            ...grantModal,
                                            formData: { ...grantModal.formData, currency: e.target.value }
                                        })}
                                    >
                                        <option value="INR">INR (₹)</option>
                                        <option value="USD">USD ($)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Notes / Admin Justification</label>
                                <textarea
                                    className="form-input w-full text-xs"
                                    rows="2"
                                    placeholder="e.g. Free gift granted for strategic pilot partnership"
                                    value={grantModal.formData.notes}
                                    onChange={(e) => setGrantModal({
                                        ...grantModal,
                                        formData: { ...grantModal.formData, notes: e.target.value }
                                    })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button type="button" onClick={() => setGrantModal({ ...grantModal, show: false })} className="btn btn-ghost text-xs">
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={grantModal.loading}
                                    className="btn btn-primary text-xs bg-amber-600 hover:bg-amber-700 border-amber-600 text-white flex items-center gap-1.5"
                                >
                                    {grantModal.loading ? 'Granting Plan...' : '🎁 Confirm & Allot Subscription'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* RECORD OFFLINE PAYMENT MODAL */}
            {paymentModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setPaymentModal({ ...paymentModal, show: false })}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-emerald-50/70">
                            <div>
                                <h3 className="text-base font-black text-emerald-950 flex items-center gap-2">
                                    <BanknotesIcon className="w-5 h-5 text-emerald-600" />
                                    Record Offline Client Payment
                                </h3>
                                <p className="text-xs text-emerald-700">Record direct bank transfers (NEFT/RTGS), cash, or cheques to automatically issue an official invoice</p>
                            </div>
                            <button onClick={() => setPaymentModal({ ...paymentModal, show: false })} className="text-neutral-400 hover:text-neutral-600">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleRecordPayment} className="p-6 space-y-4">
                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Target Tenant *</label>
                                <select
                                    className="form-input w-full text-xs font-bold"
                                    required
                                    value={paymentModal.formData.tenant_id}
                                    onChange={(e) => setPaymentModal({
                                        ...paymentModal,
                                        formData: { ...paymentModal.formData, tenant_id: e.target.value }
                                    })}
                                >
                                    <option value="">-- Select Company Tenant --</option>
                                    {tenants.map(t => (
                                        <option key={t.tenant_id} value={t.tenant_id}>{t.name} ({t.tenant_id})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-group">
                                    <label className="form-label block text-xs font-bold text-neutral-700 mb-1">Subscription Plan</label>
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

            {/* ISSUE GATEWAY REFUND MODAL */}
            {refundModal.show && refundModal.txn && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setRefundModal({ ...refundModal, show: false })}>
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-red-50/70">
                            <div>
                                <h3 className="text-base font-black text-red-950 flex items-center gap-2">
                                    <ArrowUturnLeftIcon className="w-5 h-5 text-red-600" />
                                    Issue Gateway Refund
                                </h3>
                                <p className="text-xs text-red-700">Process full or partial refund for transaction #{refundModal.txn.id}</p>
                            </div>
                            <button onClick={() => setRefundModal({ ...refundModal, show: false })} className="text-neutral-400 hover:text-neutral-600">
                                <XCircleIcon className="w-6 h-6" />
                            </button>
                        </div>

                        {refundModal.error && (
                            <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
                                <ExclamationTriangleIcon className="w-4 h-4 text-red-600 shrink-0" />
                                <span>{refundModal.error}</span>
                            </div>
                        )}

                        <form onSubmit={handleProcessRefund} className="p-6 space-y-4">
                            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200 text-xs space-y-1.5">
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Tenant:</span>
                                    <span className="font-bold text-neutral-900">{refundModal.txn.tenant_name || refundModal.txn.tenant_id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Invoice:</span>
                                    <span className="font-mono font-bold text-neutral-900">{refundModal.txn.invoice_number || `INV-${refundModal.txn.id}`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Type:</span>
                                    <span className="font-bold text-neutral-900">{refundModal.txn.is_addon ? 'Seat Add-on' : 'Subscription Plan'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Gateway:</span>
                                    <span className="font-bold uppercase text-neutral-900">{refundModal.txn.gateway}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-500">Gross Paid Amount:</span>
                                    <span className="font-black text-neutral-900">{refundModal.txn.currency === 'INR' ? '₹' : '$'}{parseFloat(refundModal.txn.amount).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-red-600 font-semibold">
                                    <span>Less 3% Processing Fee:</span>
                                    <span>- {refundModal.txn.currency === 'INR' ? '₹' : '$'}{(parseFloat(refundModal.txn.amount) * 0.03).toFixed(2)}</span>
                                </div>
                                <div className="pt-1.5 border-t border-neutral-200 flex justify-between font-black text-emerald-700">
                                    <span>Net Gateway Refund:</span>
                                    <span>{refundModal.txn.currency === 'INR' ? '₹' : '$'}{(parseFloat(refundModal.txn.amount) * 0.97).toFixed(2)}</span>
                                </div>
                            </div>

                            {!refundModal.txn.is_addon && (
                                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                                    💡 <strong>Cascading Policy:</strong> Refunding this main subscription plan will automatically refund all active add-on seat transactions purchased for this cycle (minus 3% fee) and reset the tenant to the Free tier.
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label block text-xs font-bold text-neutral-700 mb-1">
                                    Refund Reason / Justification
                                </label>
                                <textarea
                                    className="form-input w-full text-xs"
                                    rows="2"
                                    required
                                    placeholder="e.g. Customer requested downgrade / duplicate payment resolution"
                                    value={refundModal.reason}
                                    onChange={(e) => setRefundModal({ ...refundModal, reason: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                                <input
                                    type="checkbox"
                                    id="adjustPlan"
                                    checked={refundModal.adjustPlan}
                                    onChange={(e) => setRefundModal({ ...refundModal, adjustPlan: e.target.checked })}
                                    className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                                />
                                <label htmlFor="adjustPlan" className="font-semibold cursor-pointer">
                                    Automatically revert subscription plan or deduct added seat capacity
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-neutral-100">
                                <button
                                    type="button"
                                    disabled={refundModal.loading}
                                    onClick={() => setRefundModal({ ...refundModal, show: false })}
                                    className="btn btn-ghost text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={refundModal.loading}
                                    className="btn btn-primary text-xs bg-red-600 hover:bg-red-700 border-red-600 text-white flex items-center gap-1.5"
                                >
                                    {refundModal.loading ? 'Processing Refund...' : 'Confirm & Process Refund'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* INVOICE VIEWER PORTAL MODAL */}
            {activeInvoiceId && (
                <InvoiceModal
                    paymentId={activeInvoiceId}
                    onClose={() => setActiveInvoiceId(null)}
                />
            )}

            {/* STATEMENT OF ACCOUNT MODAL */}
            {statementTenant && (
                <StatementModal
                    tenant={statementTenant}
                    onClose={() => setStatementTenant(null)}
                />
            )}
        </div>
    );
};

export default SuperAdminBilling;
