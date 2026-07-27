import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import DataTable from '../components/DataTable';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders', { params: { page, limit: 10, search } });
      setOrders(data.data); setTotal(data.pagination.total);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleRefund = async (id) => {
    try { await api.patch(`/orders/${id}/refund`); toast.success('Marked as refunded'); fetchOrders(); }
    catch { toast.error('Refund failed'); }
  };

  const statusColors = {
    completed: 'admin-badge-green', pending: 'admin-badge-yellow',
    failed: 'admin-badge-red', refunded: 'admin-badge-gray', cancelled: 'admin-badge-red',
  };

  const columns = [
    { key: 'orderId', label: 'Order ID', render: r => <span className="font-mono text-xs text-slate-600 dark:text-slate-400">{r.orderId}</span> },
    { key: 'student', label: 'Student', render: r => (
      <div>
        <p className="font-medium text-sm text-slate-800 dark:text-white">{r.student?.name}</p>
        <p className="text-xs text-slate-400">{r.student?.email}</p>
      </div>
    )},
    { key: 'productName', label: 'Product', render: r => <span className="text-sm">{r.productName}</span> },
    { key: 'finalAmount', label: 'Amount', render: r => <span className="font-semibold text-emerald-600">₹{r.finalAmount?.toLocaleString('en-IN')}</span> },
    { key: 'status', label: 'Status', render: r => <span className={statusColors[r.status] || 'admin-badge-gray'}>{r.status}</span> },
    { key: 'createdAt', label: 'Date', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
    { key: 'actions', label: 'Actions', render: r => (
      r.status === 'completed' && (
        <button onClick={() => handleRefund(r._id)} className="text-xs text-orange-600 hover:underline">Refund</button>
      )
    )},
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Orders</h2>
      <DataTable columns={columns} data={orders} total={total} page={page} limit={10} loading={loading}
        onPageChange={setPage} search={search} onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by order ID..." emptyMessage="No orders found."
      />
    </div>
  );
}
