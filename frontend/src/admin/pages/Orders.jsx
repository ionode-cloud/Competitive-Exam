// Orders.jsx — Admin: All Purchases & Orders Management (Material, PYQ Ebook, Subject Test, Mock Test, Subscription)
import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import { RiEditLine, RiDeleteBin2Line, RiRefundLine, RiAddLine, RiCheckLine, RiRefreshLine } from 'react-icons/ri';

const STATUS_COLORS = {
  completed: 'admin-badge-green',
  pending:   'admin-badge-yellow',
  failed:    'admin-badge-red',
  refunded:  'admin-badge-gray',
  cancelled: 'admin-badge-red',
};

const PRODUCT_TYPE_BADGES = {
  material:     { label: 'Material',      bg: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' },
  ebook:        { label: 'PYQ E-Book',    bg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' },
  subject:      { label: 'Subject Test',  bg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' },
  mocktest:     { label: 'Mock Test',     bg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' },
  subscription: { label: 'Subscription', bg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800' },
  bundle:       { label: 'Combo Bundle',  bg: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' },
};

/* ── Create / Edit Order Modal ─────────────────────────────────────────────── */
function OrderModal({ order, students, onClose, onSaved }) {
  const isEdit = Boolean(order);
  const [form, setForm] = useState({
    studentId:   order?.student?._id || '',
    productName: order?.productName || '',
    productType: order?.productType || 'subject',
    amount:      order?.finalAmount || order?.amount || 0,
    status:      order?.status || 'completed',
    notes:       order?.notes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isEdit && !form.studentId) { toast.error('Please select a student'); return; }
    if (!form.productName.trim()) { toast.error('Product name is required'); return; }

    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/orders/${order._id}`, form);
        toast.success('Order updated successfully');
      } else {
        await api.post('/orders', form);
        toast.success('Order created & recorded successfully');
      }
      onSaved();
      onClose();
    } catch {
      toast.error(isEdit ? 'Failed to update order' : 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? 'Edit Purchase Order' : '+ Record New Purchase Order'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isEdit && (
            <div>
              <label className="admin-label">Select Student *</label>
              <select
                value={form.studentId}
                onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}
                className="admin-input" required
              >
                <option value="">Select student...</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          {isEdit && order?.student && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {order.student?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{order.student?.name}</p>
                <p className="text-xs text-slate-400">{order.student?.email} • ID: {order.orderId}</p>
              </div>
            </div>
          )}

          <div>
            <label className="admin-label">Product Name *</label>
            <input
              type="text"
              value={form.productName}
              onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
              className="admin-input"
              placeholder="e.g. OPSC OAS Subject Test Series / Mathematics PYQ E-Book"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="admin-label">Purchase Type *</label>
              <select
                value={form.productType}
                onChange={e => setForm(f => ({ ...f, productType: e.target.value }))}
                className="admin-input"
              >
                <option value="subject">Subject Test</option>
                <option value="mocktest">Mock Test</option>
                <option value="material">Study Material</option>
                <option value="ebook">PYQ E-Book</option>
                <option value="subscription">Subscription</option>
                <option value="bundle">Combo Bundle</option>
              </select>
            </div>

            <div>
              <label className="admin-label">Amount (₹) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="admin-input"
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="admin-label">Order Status</label>
            <select
              value={form.status}
              onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
              className="admin-input"
            >
              <option value="completed">Completed (Paid)</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="admin-label">Admin Notes</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="admin-input resize-none" rows={2}
              placeholder="Optional payment notes or transaction details..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit" disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {saving ? <><RiRefreshLine className="animate-spin w-4 h-4" /> Saving…</> : <><RiCheckLine className="w-4 h-4" /> {isEdit ? 'Save Changes' : 'Create Order'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   Main Admin Orders Page
══════════════════════════════════════════════════════════════════════════ */
export default function Orders() {
  const [orders, setOrders]             = useState([]);
  const [total, setTotal]               = useState(0);
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [loading, setLoading]           = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [modalOrder, setModalOrder]     = useState(null); // null = closed, {} = new, orderObj = edit
  const [students, setStudents]         = useState([]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders', {
        params: { page, limit: 12, search, status: statusFilter, productType: typeFilter }
      });
      setOrders(data.data || []);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await api.get('/students', { params: { limit: 100 } });
      setStudents(res.data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleRefund = async (id) => {
    const confirm = await Swal.fire({
      title: 'Refund this order?',
      text: 'This order status will be changed to Refunded.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ea580c',
      confirmButtonText: 'Yes, Refund',
    });
    if (!confirm.isConfirmed) return;

    try {
      await api.patch(`/orders/${id}/refund`);
      toast.success('Marked as refunded');
      fetchOrders();
    } catch {
      toast.error('Refund failed');
    }
  };

  const handleDelete = async (order) => {
    const result = await Swal.fire({
      title: `Delete order ${order.orderId}?`,
      text: 'This purchase order record will be permanently deleted.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/orders/${order._id}`);
      toast.success('Order deleted');
      fetchOrders();
    } catch {
      toast.error('Failed to delete order');
    }
  };

  const columns = [
    {
      key: 'orderId', label: 'Order ID',
      render: r => <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">{r.orderId}</span>
    },
    {
      key: 'student', label: 'Student',
      render: r => (
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {r.student?.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <p className="font-medium text-sm text-slate-800 dark:text-white">{r.student?.name || '—'}</p>
            <p className="text-xs text-slate-400">{r.student?.email || ''}</p>
          </div>
        </div>
      )
    },
    {
      key: 'productName', label: 'Product Name',
      render: r => (
        <div>
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{r.productName || '—'}</p>
        </div>
      )
    },
    {
      key: 'productType', label: 'Category',
      render: r => {
        const badge = PRODUCT_TYPE_BADGES[r.productType] || { label: r.productType || 'Other', bg: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200' };
        return (
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${badge.bg}`}>
            {badge.label}
          </span>
        );
      }
    },
    {
      key: 'finalAmount', label: 'Amount',
      render: r => <span className="font-bold text-emerald-600 text-sm">₹{(r.finalAmount || r.amount || 0).toLocaleString('en-IN')}</span>
    },
    {
      key: 'status', label: 'Status',
      render: r => <span className={STATUS_COLORS[r.status] || 'admin-badge-gray'}>{r.status}</span>
    },
    {
      key: 'createdAt', label: 'Purchase Date',
      render: r => new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setModalOrder(r)}
            title="Edit order"
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 transition-colors"
          >
            <RiEditLine className="w-4 h-4" />
          </button>
          {r.status === 'completed' && (
            <button
              onClick={() => handleRefund(r._id)}
              title="Refund order"
              className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/30 text-orange-600 transition-colors"
            >
              <RiRefundLine className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => handleDelete(r)}
            title="Delete order"
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500 transition-colors"
          >
            <RiDeleteBin2Line className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Purchases & Orders</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            All student purchases across Materials, PYQ E-Books, Subject Tests, Mock Tests, and Subscriptions.
          </p>
        </div>

        <button
          onClick={() => setModalOrder({})}
          className="admin-btn-primary flex items-center gap-2"
        >
          <RiAddLine className="w-4 h-4" /> Record New Purchase
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 justify-end flex-wrap">
        <select
          value={typeFilter}
          onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="admin-input w-44"
        >
          <option value="">All Categories</option>
          <option value="subject">Subject Tests</option>
          <option value="mocktest">Mock Tests</option>
          <option value="material">Study Materials</option>
          <option value="ebook">PYQ E-Books</option>
          <option value="subscription">Subscriptions</option>
          <option value="bundle">Combo Bundles</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="admin-input w-40"
        >
          <option value="">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={orders}
        total={total}
        page={page}
        limit={12}
        loading={loading}
        onPageChange={setPage}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search order ID, student name, or product..."
        emptyMessage="No purchase orders found."
      />

      {/* Modal */}
      {modalOrder !== null && (
        <OrderModal
          order={Object.keys(modalOrder).length ? modalOrder : null}
          students={students}
          onClose={() => setModalOrder(null)}
          onSaved={fetchOrders}
        />
      )}
    </div>
  );
}
