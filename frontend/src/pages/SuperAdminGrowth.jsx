import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { tenantService } from '../services';
import {
  BanknotesIcon,
  CreditCardIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowPathIcon,
  PrinterIcon,
  BuildingOffice2Icon,
  ChartBarIcon,
  CheckBadgeIcon,
  ClockIcon,
  FunnelIcon,
  SparklesIcon,
  ArrowUpRightIcon
} from '@heroicons/react/24/outline';

const SuperAdminGrowth = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currencyView, setCurrencyView] = useState('INR'); // 'INR' | 'USD'

  useEffect(() => {
    loadGrowthReport();
  }, []);

  const loadGrowthReport = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await tenantService.getGrowthAnalytics();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load growth analytics:', err);
      setError(err.response?.data?.message || 'Failed to load growth analytics report');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-bold text-neutral-600">Generating comprehensive growth & sales intelligence report...</p>
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const monthlyRev = data?.monthly_revenue || [];
  const monthlyGrowth = data?.monthly_growth || [];
  const planDist = data?.plan_distribution || [];
  const topTenants = data?.top_tenants || [];
  const recentLeads = data?.recent_leads || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 print:p-0">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-black tracking-wide">
              SUPER ADMIN INTELLIGENCE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-neutral-900 mt-1 flex items-center gap-2">
            <ArrowTrendingUpIcon className="w-6 h-6 text-emerald-600" /> Sales, Marketing & Growth Analytics
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Real-time SaaS revenue, customer acquisition funnel, conversion metrics & tenant retention performance.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto print:hidden">
          {/* Currency Toggle */}
          <div className="inline-flex p-1 bg-neutral-100 rounded-xl border border-neutral-200">
            <button
              onClick={() => setCurrencyView('INR')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${currencyView === 'INR' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
              🇮🇳 INR (₹)
            </button>
            <button
              onClick={() => setCurrencyView('USD')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${currencyView === 'USD' ? 'bg-white text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900'
                }`}
            >
              🇺🇸 USD ($)
            </button>
          </div>

          <button
            onClick={loadGrowthReport}
            className="btn btn-secondary btn-xs text-xs flex items-center gap-1.5"
            title="Refresh Report Data"
          >
            <ArrowPathIcon className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={handlePrint}
            className="btn btn-primary btn-xs text-xs flex items-center gap-1.5"
          >
            <PrinterIcon className="w-3.5 h-3.5" />
            Export / Print
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-xs">
          {error}
        </div>
      )}

      {/* 6 Executive KPI Metric Cards */}
      <div className="grid grid-cols-6 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Monthly Recurring Revenue */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">MRR</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <BanknotesIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-neutral-900">
            {currencyView === 'INR' ? `₹${(metrics.mrr_inr || 0).toLocaleString()}` : `$${(metrics.mrr_usd || 0).toLocaleString()}`}
          </p>
          <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-0.5">
            <ArrowUpRightIcon className="w-3 h-3" /> {metrics.mom_growth_percent}% MoM
          </p>
        </div>

        {/* Annual Run Rate */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">ARR</span>
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
              <ArrowTrendingUpIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-neutral-900">
            {currencyView === 'INR' ? `₹${(metrics.arr_inr || 0).toLocaleString()}` : `$${(metrics.arr_usd || 0).toLocaleString()}`}
          </p>
          <p className="text-[10px] text-neutral-400 mt-1">Annualized Run Rate</p>
        </div>

        {/* Total Lifetime Revenue */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Total Revenue</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
              <CreditCardIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-neutral-900">
            {currencyView === 'INR' ? `₹${(metrics.total_inr || 0).toLocaleString()}` : `$${(metrics.total_usd || 0).toLocaleString()}`}
          </p>
          <p className="text-[10px] text-neutral-400 mt-1">{metrics.completed_transactions || 0} Invoices Settled</p>
        </div>

        {/* Paid Subscriptions */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Paid Tenants</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
              <BuildingOffice2Icon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-purple-700">{metrics.paid_tenants || 0}</p>
          <p className="text-[10px] text-neutral-400 mt-1">Active paid workspaces</p>
        </div>

        {/* Total Inbound Leads */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Demo Leads</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <UsersIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-blue-700">{metrics.total_leads || 0}</p>
          <p className="text-[10px] text-neutral-400 mt-1">{metrics.pending_leads || 0} pending review</p>
        </div>

        {/* Lead Conversion Rate */}
        <div className="p-4 bg-white rounded-2xl border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Conversion %</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckBadgeIcon className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600">{metrics.conversion_rate_percent}%</p>
          <p className="text-[10px] text-neutral-400 mt-1">Lead to Tenant Ratio</p>
        </div>
      </div>

      {/* Marketing & Sales Acquisition Funnel */}
      <div className="card p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
              <FunnelIcon className="w-4 h-4 text-primary-600" /> Customer Acquisition & Lead Conversion Funnel
            </h2>
            <p className="text-[11px] text-neutral-500">Track prospects progressing from inbound website demos to paid active tenants</p>
          </div>
          <Link to="/super-admin/demo-requests" className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 self-start sm:self-auto">
            View All Leads →
          </Link>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Stage 1 */}
          <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80 hover:border-primary-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-neutral-500 tracking-wider">Stage 1: Inbound Leads</span>
                <span className="w-2 h-2 rounded-full bg-neutral-400"></span>
              </div>
              <p className="text-2xl font-black text-neutral-900 mt-2">{metrics.total_leads || 0}</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-neutral-200/70 text-[11px] text-neutral-600 font-medium flex items-center justify-between">
              <span>Top-of-funnel</span>
              <span className="font-bold text-neutral-900">100%</span>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80 hover:border-primary-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-amber-700 tracking-wider">Stage 2: Pending Action</span>
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              </div>
              <p className="text-2xl font-black text-neutral-900 mt-2">{metrics.pending_leads || 0}</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-neutral-200/70 text-[11px] text-neutral-600 font-medium flex items-center justify-between">
              <span>Awaiting demo call</span>
              <span className="font-bold text-amber-700">
                {metrics.total_leads ? Math.round(((metrics.pending_leads || 0) / metrics.total_leads) * 100) : 0}%
              </span>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/80 hover:border-primary-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-primary-700 tracking-wider">Stage 3: Demos Provisioned</span>
                <span className="w-2 h-2 rounded-full bg-primary-500"></span>
              </div>
              <p className="text-2xl font-black text-neutral-900 mt-2">{metrics.converted_leads || 0}</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-neutral-200/70 text-[11px] text-neutral-600 font-medium flex items-center justify-between">
              <span>Active trial workspaces</span>
              <span className="font-bold text-primary-700">{metrics.conversion_rate_percent}%</span>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="p-4 rounded-xl bg-primary-50/70 border border-primary-200 hover:border-primary-400 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-primary-800 tracking-wider">Stage 4: Paid Active Accounts</span>
                <span className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></span>
              </div>
              <p className="text-2xl font-black text-primary-900 mt-2">{metrics.paid_tenants || 0}</p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-primary-200/80 text-[11px] text-primary-800 font-bold flex items-center justify-between">
              <span>Generating MRR</span>
              <span>Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Plan Distribution & Monthly Growth Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Subscription Plan Popularity */}
        <div className="card p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs">
          <h2 className="text-sm font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
            <ChartBarIcon className="w-4 h-4 text-indigo-600" /> Plan Distribution & Share
          </h2>
          <p className="text-[11px] text-neutral-500 mb-4">Tenants breakdown by subscription tier</p>

          <div className="space-y-3">
            {planDist.map((p, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-neutral-100 bg-neutral-50/50">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-neutral-900 capitalize">{p.plan_name}</span>
                  <span className="text-xs font-black text-primary-700">
                    {p.tenant_count} {parseInt(p.tenant_count, 10) === 1 ? 'company' : 'companies'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-500">
                  <span>Price: ₹{p.price_inr} / ${p.price_usd} / mo</span>
                  <span className="font-medium text-emerald-600">{p.active_count} active</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Revenue & Signups Summary */}
        <div className="lg:col-span-2 card p-5 bg-white border border-neutral-200 rounded-2xl shadow-xs">
          <h2 className="text-sm font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
            <ArrowTrendingUpIcon className="w-4 h-4 text-emerald-600" /> Monthly Revenue Influx
          </h2>
          <p className="text-[11px] text-neutral-500 mb-4">Historical transaction volume and new customer additions</p>

          {monthlyRev.length > 0 ? (
            <div className="space-y-3">
              {monthlyRev.map((m, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-neutral-100 bg-neutral-50/60 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-neutral-900">{m.month_label}</span>
                    <p className="text-[11px] text-neutral-500">{m.transaction_count} successful invoice payments</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-black text-emerald-700">
                      ₹{parseFloat(m.revenue_inr || m.revenue || 0).toLocaleString()}
                    </span>
                    <p className="text-[10px] text-neutral-400 font-mono">INR Settled</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-neutral-400 text-xs">
              No historical revenue logs recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Top 10 High-Value Customer Accounts Leaderboard */}
      <div className="card p-0 overflow-hidden border border-neutral-200 rounded-2xl shadow-xs bg-white">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
              <SparklesIcon className="w-4 h-4 text-amber-500" /> Top Revenue-Contributing Customer Accounts
            </h2>
            <p className="text-[11px] text-neutral-500">Highest lifetime value (LTV) companies hosted on the platform</p>
          </div>
          <Link to="/super-admin/billing" className="text-xs font-bold text-primary-600 hover:text-primary-700">
            Billing Hub →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="p-3 font-bold text-neutral-600">Company / Tenant</th>
                <th className="p-3 font-bold text-neutral-600">Plan & Seats</th>
                <th className="p-3 font-bold text-neutral-600">Billing Contact</th>
                <th className="p-3 font-bold text-neutral-600 text-right">Lifetime Paid</th>
                <th className="p-3 font-bold text-neutral-600 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {topTenants.map((t, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-neutral-900">{t.tenant_name || t.tenant_id}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">{t.tenant_id}</div>
                  </td>
                  <td className="p-3">
                    <span className="capitalize font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px]">
                      {t.subscription_plan || 'free'}
                    </span>
                    <div className="text-[10px] text-neutral-500 mt-0.5">{t.employee_limit} staff quota</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-neutral-800">{t.contact_person || 'N/A'}</div>
                    <div className="text-[10px] text-neutral-400">{t.contact_email || 'No email registered'}</div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="font-black text-emerald-700 text-xs">
                      ₹{parseFloat(t.total_paid || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-neutral-400">{t.payment_count} payments</div>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-neutral-100 text-neutral-600'
                      }`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Inbound Leads */}
      <div className="card p-0 overflow-hidden border border-neutral-200 rounded-2xl shadow-xs bg-white">
        <div className="p-4 border-b border-neutral-100 bg-neutral-50/60 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
              <ClockIcon className="w-4 h-4 text-blue-600" /> Recent Marketing Leads & Inquiries
            </h2>
            <p className="text-[11px] text-neutral-500">Latest business inquiries generated from the landing page</p>
          </div>
          <Link to="/super-admin/demo-requests" className="text-xs font-bold text-primary-600 hover:text-primary-700">
            Manage Leads →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="p-3 font-bold text-neutral-600">Prospect & Company</th>
                <th className="p-3 font-bold text-neutral-600">Contact</th>
                <th className="p-3 font-bold text-neutral-600">Requested Date</th>
                <th className="p-3 font-bold text-neutral-600 text-center">Pipeline Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {recentLeads.map((l, idx) => (
                <tr key={idx} className="hover:bg-neutral-50/60 transition-colors">
                  <td className="p-3">
                    <div className="font-bold text-neutral-900">{l.company_name || 'Individual'}</div>
                    <div className="text-[10px] text-neutral-500">{l.name}</div>
                  </td>
                  <td className="p-3">
                    <div className="text-neutral-700">{l.email}</div>
                    <div className="text-[10px] text-neutral-400">{l.phone || 'N/A'}</div>
                  </td>
                  <td className="p-3 text-neutral-600 text-[11px]">
                    {new Date(l.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'provisioned' || l.status === 'converted'
                      ? 'bg-emerald-100 text-emerald-800'
                      : l.status === 'pending' || l.status === 'new'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                      }`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminGrowth;
