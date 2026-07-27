import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from '../components/DataTable';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [revenueStats, setRevenueStats] = useState({ today: 0, thisMonth: 0, total: 0 });
  const [statusFilter, setStatusFilter] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, sRes] = await Promise.all([
        api.get('/payments', { params: { page, limit: 10, status: statusFilter } }),
        api.get('/payments/stats/revenue'),
      ]);
      setPayments(pRes.data.data); setTotal(pRes.data.pagination.total);
      setRevenueStats(sRes.data.data);
    } catch { toast.error('Failed to load payments'); }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const statusColors = { captured: 'admin-badge-green', failed: 'admin-badge-red', refunded: 'admin-badge-gray', created: 'admin-badge-yellow' };

  const columns = [
    { key: 'razorpayPaymentId', label: 'Payment ID', render: r => <span className="font-mono text-xs">{r.razorpayPaymentId || '—'}</span> },
    { key: 'student', label: 'Student', render: r => (
      <div><p className="text-sm font-medium text-slate-800 dark:text-white">{r.student?.name}</p><p className="text-xs text-slate-400">{r.student?.email}</p></div>
    )},
    { key: 'amount', label: 'Amount', render: r => <span className="font-semibold text-emerald-600">₹{r.amount?.toLocaleString('en-IN')}</span> },
    { key: 'method', label: 'Method', render: r => r.method ? <span className="admin-badge-blue capitalize">{r.method}</span> : '—' },
    { key: 'status', label: 'Status', render: r => <span className={statusColors[r.status] || 'admin-badge-gray'}>{r.status}</span> },
    { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Payments</h2>

      {/* Revenue Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Today's Revenue", value: revenueStats.today },
          { label: "This Month", value: revenueStats.thisMonth },
          { label: "Total Revenue", value: revenueStats.total },
        ].map(s => (
          <div key={s.label} className="admin-card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">₹{s.value?.toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 justify-end">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-input w-40">
          <option value="">All Status</option>
          <option value="captured">Success</option>
          <option value="failed">Failed</option>
          <option value="created">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      <DataTable columns={columns} data={payments} total={total} page={page} limit={10} loading={loading}
        onPageChange={setPage} emptyMessage="No payments found."
      />
    </div>
  );
}
