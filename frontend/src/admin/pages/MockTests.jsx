import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RiAddLine, RiEditLine, RiDeleteBin2Line,
  RiFileCopyLine, RiCheckboxCircleLine, RiPauseLine
} from 'react-icons/ri';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';

const statusBadge = (status) => {
  const map = {
    published: 'admin-badge-green',
    draft: 'admin-badge-yellow',
    scheduled: 'admin-badge-blue',
    deactivated: 'admin-badge-red',
  };
  return <span className={map[status] || 'admin-badge-gray'}>{status}</span>;
};

const priceBadge = (type, price) =>
  type === 'free'
    ? <span className="admin-badge-green">Free</span>
    : <span className="admin-badge-blue">₹{price}</span>;

export default function MockTests() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/mocktests', { params: { page, limit: 10, search } });
      setData(res.data.data);
      setTotal(res.data.pagination.total);
    } catch { toast.error('Failed to load mock tests'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handlePublish = async (id) => {
    try {
      await api.patch(`/mocktests/${id}/publish`);
      toast.success('Mock test published!');
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Publish failed'); }
  };

  const handleDeactivate = async (id) => {
    await api.put(`/mocktests/${id}`, { status: 'deactivated' });
    toast.success('Deactivated'); fetchData();
  };

  const handleDuplicate = async (id) => {
    try {
      await api.post(`/mocktests/${id}/duplicate`);
      toast.success('Mock test duplicated!');
      fetchData();
    } catch { toast.error('Duplicate failed'); }
  };

  const handleDelete = async (row) => {
    const result = await Swal.fire({
      title: `Delete "${row.name}"?`,
      text: 'All questions in this test will be removed.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Delete',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/mocktests/${row._id}`);
      toast.success('Deleted'); fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const handleBulkDelete = async () => {
    const result = await Swal.fire({
      title: `Delete ${selectedIds.length} tests?`,
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444',
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete('/mocktests/bulk', { data: { ids: selectedIds } });
      toast.success(`${selectedIds.length} tests deleted`);
      setSelectedIds([]); fetchData();
    } catch { toast.error('Bulk delete failed'); }
  };

  const handleBulkPublish = async () => {
    try {
      await api.patch('/mocktests/bulk-publish', { ids: selectedIds });
      toast.success('Published ready tests!');
      setSelectedIds([]); fetchData();
    } catch { toast.error('Bulk publish failed'); }
  };

  const columns = [
    { key: 'name', label: 'Mock Test Name', sortable: true, render: r => (
      <div>
        <p className="font-semibold text-slate-800 dark:text-white">{r.name}</p>
        <p className="text-xs text-slate-400">{r.examination?.name} • {r.testType?.replace('_', ' ')}</p>
      </div>
    )},
    { key: 'questions', label: 'Questions', render: r => (
      <div className="text-center">
        <p className="font-semibold text-slate-700 dark:text-slate-200">{r.completedQuestions}/{r.totalQuestions}</p>
        <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-1 mx-auto">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${Math.min(100, (r.completedQuestions / r.totalQuestions) * 100)}%` }}
          />
        </div>
      </div>
    )},
    { key: 'status', label: 'Status', render: r => statusBadge(r.status) },
    { key: 'pricingType', label: 'Price', render: r => priceBadge(r.pricingType, r.price) },
    { key: 'totalAttempts', label: 'Attempts', render: r => r.totalAttempts?.toLocaleString('en-IN') || '0' },
    { key: 'duration', label: 'Duration', render: r => `${r.duration} min` },
    { key: 'createdAt', label: 'Created', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
    { key: 'actions', label: 'Actions', render: r => (
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => navigate(`/admin/mock-tests/${r._id}/edit`)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" title="Edit">
          <RiEditLine className="w-4 h-4" />
        </button>
        {r.status !== 'published' && (
          <button onClick={() => handlePublish(r._id)} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 transition-colors" title="Publish">
            <RiCheckboxCircleLine className="w-4 h-4" />
          </button>
        )}
        {r.status === 'published' && (
          <button onClick={() => handleDeactivate(r._id)} className="p-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 transition-colors" title="Deactivate">
            <RiPauseLine className="w-4 h-4" />
          </button>
        )}
        <button onClick={() => handleDuplicate(r._id)} className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 text-purple-600 transition-colors" title="Duplicate">
          <RiFileCopyLine className="w-4 h-4" />
        </button>
        <button onClick={() => handleDelete(r)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Delete">
          <RiDeleteBin2Line className="w-4 h-4" />
        </button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Mock Tests</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Create and manage all mock tests for each examination</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data}
        total={total}
        page={page}
        limit={10}
        loading={loading}
        onPageChange={setPage}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search mock tests..."
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBulkDelete={handleBulkDelete}
        emptyMessage="No mock tests found. Create your first test."
        actions={
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <button onClick={handleBulkPublish} className="admin-btn-secondary text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                <RiCheckboxCircleLine className="w-4 h-4" /> Bulk Publish
              </button>
            )}
            <button onClick={() => navigate('/admin/mock-tests/create')} className="admin-btn-primary">
              <RiAddLine className="w-4 h-4" /> Create Mock Test
            </button>
          </div>
        }
      />
    </div>
  );
}
