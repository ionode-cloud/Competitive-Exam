// Payments.jsx — Admin: Payments & Subscription Purchases management
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { RiEditLine, RiDeleteBin2Line, RiRefreshLine, RiCheckLine } from 'react-icons/ri';

const STATUS_COLORS = {
  active:    'admin-badge-green',
  expired:   'admin-badge-red',
  cancelled: 'admin-badge-red',
  suspended: 'admin-badge-yellow',
  pending:   'admin-badge-yellow',
};

const PAYMENT_STATUS_COLORS = {
  paid:     'admin-badge-green',
  pending:  'admin-badge-yellow',
  failed:   'admin-badge-red',
  refunded: 'admin-badge-gray',
  captured: 'admin-badge-green',
  created:  'admin-badge-yellow',
};

/* ── Edit Subscription Modal ──────────────────────────────────────────────── */
function EditSubModal({ sub, plans, onClose, onSaved }) {
  const [form, setForm] = useState({
    expiryDate: sub.expiryDate ? sub.expiryDate.slice(0, 10) : '',
    status:        sub.status || 'active',
    paymentStatus: sub.paymentStatus || 'paid',
    amount:        sub.amount || 0,
    notes:         sub.notes || '',
    transactionId: sub.transactionId || '',
    paymentMethod: sub.paymentMethod || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/subscriptions/subscribers/${sub._id}`, form);
      toast.success('Subscription updated successfully');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to update subscription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Subscription</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        {/* Student Info */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {sub.userId?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">{sub.userId?.name || '—'}</p>
            <p className="text-xs text-slate-400">{sub.userId?.email} • {sub.planId?.name}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Expire Date</label>
              <input type="date" value={form.expiryDate}
                onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                className="admin-input" />
            </div>
            <div>
              <label className="admin-label">Amount (₹)</label>
              <input type="number" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="admin-input" placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="admin-input">
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="suspended">Suspended</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label className="admin-label">Payment Status</label>
              <select value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))} className="admin-input">
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div>
            <label className="admin-label">Transaction ID</label>
            <input type="text" value={form.transactionId}
              onChange={e => setForm(f => ({ ...f, transactionId: e.target.value }))}
              className="admin-input" placeholder="e.g. pay_Px910294" />
          </div>

          <div>
            <label className="admin-label">Payment Method</label>
            <input type="text" value={form.paymentMethod}
              onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}
              className="admin-input" placeholder="e.g. Razorpay / UPI" />
          </div>

          <div>
            <label className="admin-label">Admin Notes</label>
            <textarea value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="admin-input resize-none" rows={2} placeholder="Internal admin notes..." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
              {saving ? <><RiRefreshLine className="animate-spin w-4 h-4" /> Saving…</> : <><RiCheckLine className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Main Payments Page
══════════════════════════════════════════════════════════════════════════ */
export default function Payments() {
  const [activeTab, setActiveTab] = useState('subscriptions'); // 'payments' | 'subscriptions'

  // ── Payment state ──
  const [payments, setPayments]           = useState([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsPage, setPaymentsPage]   = useState(1);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [revenueStats, setRevenueStats]   = useState({ today: 0, thisMonth: 0, total: 0 });
  const [statusFilter, setStatusFilter]   = useState('');

  // ── Subscription state ──
  const [subs, setSubs]           = useState([]);
  const [subsTotal, setSubsTotal] = useState(0);
  const [subsPage, setSubsPage]   = useState(1);
  const [subsLoading, setSubsLoading] = useState(false);
  const [subsSearch, setSubsSearch]   = useState('');
  const [subsStatusFilter, setSubsStatusFilter] = useState('');
  const [editingSub, setEditingSub] = useState(null);
  const [plans, setPlans]           = useState([]);

  // ── Fetch Payments ──
  const fetchPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/payments', { params: { page: paymentsPage, limit: 10, status: statusFilter } }),
        api.get('/payments/stats/revenue'),
      ]);
      setPayments(pRes.data.data);
      setPaymentsTotal(pRes.data.pagination?.total || 0);
      setRevenueStats(sRes.data.data || { today: 0, thisMonth: 0, total: 0 });
    } catch {
      toast.error('Failed to load payment data');
    } finally {
      setPaymentsLoading(false);
    }
  }, [paymentsPage, statusFilter]);

  // ── Fetch Subscriptions ──
  const fetchSubs = useCallback(async () => {
    setSubsLoading(true);
    try {
      const res = await api.get('/subscriptions/subscribers', {
        params: { page: subsPage, limit: 12, search: subsSearch, status: subsStatusFilter },
      });
      setSubs(res.data.data || []);
      setSubsTotal(res.data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load subscriptions');
    } finally {
      setSubsLoading(false);
    }
  }, [subsPage, subsSearch, subsStatusFilter]);

  // ── Fetch Plans (for edit modal) ──
  const fetchPlans = useCallback(async () => {
    try {
      const res = await api.get('/subscriptions/plans');
      setPlans(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);
  useEffect(() => { fetchSubs(); }, [fetchSubs]);
  useEffect(() => { fetchPlans(); }, [fetchPlans]);

  // ── Delete Subscription ──
  const handleDeleteSub = async (sub) => {
    const result = await Swal.fire({
      title: `Delete subscription?`,
      html: `<b>${sub.userId?.name || 'This student'}</b>'s subscription to <b>${sub.planId?.name || 'this plan'}</b> will be permanently deleted.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/subscriptions/subscribers/${sub._id}`);
      toast.success('Subscription deleted');
      fetchSubs();
    } catch {
      toast.error('Failed to delete subscription');
    }
  };

  // ── Format date helper ──
  const fmtDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // ── Remaining days helper ──
  const remainingDays = (expiryDate) => {
    if (!expiryDate) return null;
    const diff = new Date(expiryDate) - new Date();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  // ── Subscription table columns ──
  const subsColumns = [
    {
      key: 'student', label: 'Student',
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {r.userId?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm">{r.userId?.name || '—'}</p>
            <p className="text-xs text-slate-400">{r.userId?.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'plan', label: 'Plan',
      render: r => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-white text-sm">{r.planId?.name || '—'}</p>
          <p className="text-xs text-slate-400 capitalize">{r.planId?.billingCycle || ''}</p>
        </div>
      ),
    },
    {
      key: 'amount', label: 'Amount',
      render: r => <span className="font-bold text-emerald-600 text-sm">₹{(r.amount || 0).toLocaleString('en-IN')}</span>,
    },
    {
      key: 'startDate', label: 'Purchase Date',
      render: r => <span className="text-sm text-slate-600 dark:text-slate-300">{fmtDate(r.startDate)}</span>,
    },
    {
      key: 'expiryDate', label: 'Expire Date',
      render: r => {
        const days = remainingDays(r.expiryDate);
        const isExpiring = days !== null && days >= 0 && days <= 7;
        const isExpired  = days !== null && days < 0;
        return (
          <div>
            <span className={`text-sm font-semibold ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : 'text-slate-700 dark:text-slate-200'}`}>
              {fmtDate(r.expiryDate)}
            </span>
            {days !== null && (
              <p className={`text-xs mt-0.5 ${isExpired ? 'text-red-400' : isExpiring ? 'text-amber-400' : 'text-slate-400'}`}>
                {isExpired ? `Expired ${Math.abs(days)}d ago` : days === 0 ? 'Expires today' : `${days}d left`}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: 'paymentStatus', label: 'Payment',
      render: r => (
        <span className={PAYMENT_STATUS_COLORS[r.paymentStatus] || 'admin-badge-gray'}>
          {r.paymentStatus || '—'}
        </span>
      ),
    },
    {
      key: 'status', label: 'Status',
      render: r => (
        <span className={STATUS_COLORS[r.status] || 'admin-badge-gray'}>
          {r.status || '—'}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEditingSub(r)}
            title="Edit subscription"
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
          >
            <RiEditLine className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteSub(r)}
            title="Delete subscription"
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
          >
            <RiDeleteBin2Line className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  // ── Payment table columns ──
  const paymentStatusColors = { captured: 'admin-badge-green', failed: 'admin-badge-red', refunded: 'admin-badge-gray', created: 'admin-badge-yellow' };
  const paymentsColumns = [
    { key: 'razorpayPaymentId', label: 'Payment ID', render: r => <span className="font-mono text-xs">{r.razorpayPaymentId || '—'}</span> },
    { key: 'student', label: 'Student', render: r => (
      <div>
        <p className="text-sm font-medium text-slate-800 dark:text-white">{r.student?.name}</p>
        <p className="text-xs text-slate-400">{r.student?.email}</p>
      </div>
    )},
    { key: 'amount', label: 'Amount', render: r => <span className="font-semibold text-emerald-600">₹{r.amount?.toLocaleString('en-IN')}</span> },
    { key: 'method', label: 'Method', render: r => r.method ? <span className="admin-badge-blue capitalize">{r.method}</span> : '—' },
    { key: 'status', label: 'Status', render: r => <span className={paymentStatusColors[r.status] || 'admin-badge-gray'}>{r.status}</span> },
    { key: 'createdAt', label: 'Date', render: r => fmtDate(r.createdAt) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payments & Subscriptions</h2>
      </div>

      {/* Revenue Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Revenue",  value: revenueStats.today },
          { label: 'This Month',       value: revenueStats.thisMonth },
          { label: 'Total Revenue',    value: revenueStats.total },
        ].map(s => (
          <div key={s.label} className="admin-card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{s.value?.toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
        {[
          { key: 'subscriptions', label: '📋 Student Subscriptions' },
          { key: 'payments',      label: '💳 Payment Transactions' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2.5 text-sm font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── SUBSCRIPTIONS TAB ── */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-end">
            <select
              value={subsStatusFilter}
              onChange={e => { setSubsStatusFilter(e.target.value); setSubsPage(1); }}
              className="admin-input w-40"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <DataTable
            columns={subsColumns}
            data={subs}
            total={subsTotal}
            page={subsPage}
            limit={12}
            loading={subsLoading}
            onPageChange={setSubsPage}
            search={subsSearch}
            onSearch={v => { setSubsSearch(v); setSubsPage(1); }}
            searchPlaceholder="Search student name, email, subscription ID…"
            emptyMessage="No subscriptions found."
          />
        </div>
      )}

      {/* ── PAYMENTS TAB ── */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 justify-end">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPaymentsPage(1); }}
              className="admin-input w-40"
            >
              <option value="">All Status</option>
              <option value="captured">Success</option>
              <option value="failed">Failed</option>
              <option value="created">Pending</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <DataTable
            columns={paymentsColumns}
            data={payments}
            total={paymentsTotal}
            page={paymentsPage}
            limit={10}
            loading={paymentsLoading}
            onPageChange={setPaymentsPage}
            emptyMessage="No payment transactions found."
          />
        </div>
      )}

      {/* ── Edit Modal ── */}
      {editingSub && (
        <EditSubModal
          sub={editingSub}
          plans={plans}
          onClose={() => setEditingSub(null)}
          onSaved={fetchSubs}
        />
      )}
    </div>
  );
}
