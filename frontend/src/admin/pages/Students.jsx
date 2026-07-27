import { useState, useEffect, useCallback } from 'react';
import { RiUserForbidLine, RiCheckLine, RiDeleteBin2Line, RiDownloadLine } from 'react-icons/ri';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/students', { params: { page, limit: 15, search, status: statusFilter } });
      setStudents(data.data); setTotal(data.pagination.total);
    } catch { toast.error('Failed to load students'); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleBan = async (s) => {
    const { value: reason } = await Swal.fire({
      title: `Ban ${s.name}?`, input: 'text', inputLabel: 'Reason',
      inputPlaceholder: 'Enter ban reason...', showCancelButton: true,
      confirmButtonColor: '#ef4444', confirmButtonText: 'Ban',
    });
    if (reason === undefined) return;
    try { await api.patch(`/students/${s._id}/ban`, { reason }); toast.success('Student banned'); fetchStudents(); }
    catch { toast.error('Ban failed'); }
  };

  const handleUnban = async (s) => {
    try { await api.patch(`/students/${s._id}/unban`); toast.success('Student unbanned'); fetchStudents(); }
    catch { toast.error('Unban failed'); }
  };

  const handleDelete = async (s) => {
    const result = await Swal.fire({ title: `Delete ${s.name}?`, text: 'This cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!result.isConfirmed) return;
    try { await api.delete(`/students/${s._id}`); toast.success('Deleted'); fetchStudents(); }
    catch { toast.error('Delete failed'); }
  };

  const handleExport = async () => {
    try {
      const res = await api.get('/students/export', { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url; a.download = 'students.xlsx'; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Export failed'); }
  };

  const columns = [
    { key: 'name', label: 'Student', render: r => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {r.name?.charAt(0)?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-slate-800 dark:text-white text-sm">{r.name}</p>
          <p className="text-xs text-slate-400">{r.email}</p>
        </div>
      </div>
    )},
    { key: 'phone', label: 'Phone', render: r => r.phone || '—' },
    { key: 'status', label: 'Status', render: r => (
      r.isBanned
        ? <span className="admin-badge-red">Banned</span>
        : r.isActive
          ? <span className="admin-badge-green">Active</span>
          : <span className="admin-badge-gray">Inactive</span>
    )},
    { key: 'lastLogin', label: 'Last Login', render: r => r.lastLogin ? new Date(r.lastLogin).toLocaleDateString('en-IN') : 'Never' },
    { key: 'createdAt', label: 'Registered', render: r => new Date(r.createdAt).toLocaleDateString('en-IN') },
    { key: 'actions', label: 'Actions', render: r => (
      <div className="flex items-center gap-1">
        {r.isBanned
          ? <button onClick={() => handleUnban(r)} title="Unban" className="p-1.5 rounded-lg hover:bg-green-50 text-green-600 transition-colors"><RiCheckLine className="w-4 h-4" /></button>
          : <button onClick={() => handleBan(r)} title="Ban" className="p-1.5 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors"><RiUserForbidLine className="w-4 h-4" /></button>
        }
        <button onClick={() => handleDelete(r)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><RiDeleteBin2Line className="w-4 h-4" /></button>
      </div>
    )},
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Students</h2>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className="admin-input w-32">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="inactive">Inactive</option>
          </select>
          <button onClick={handleExport} className="admin-btn-secondary">
            <RiDownloadLine className="w-4 h-4" /> Export
          </button>
        </div>
      </div>
      <DataTable columns={columns} data={students} total={total} page={page} limit={15} loading={loading} onPageChange={setPage}
        search={search} onSearch={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search students..."
        selectedIds={selectedIds} onSelectionChange={setSelectedIds}
        emptyMessage="No students found."
      />
    </div>
  );
}
