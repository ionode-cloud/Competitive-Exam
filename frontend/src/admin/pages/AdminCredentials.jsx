import { useState, useEffect, useCallback } from 'react';
import { RiAddLine, RiEditLine, RiDeleteBin2Line, RiShieldUserLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';

const roleBadgeClass = (role) => {
  if (role === 'admin' || role === 'superadmin') return 'admin-badge-blue';
  if (role === 'sub_admin') return 'admin-badge-green';
  return 'admin-badge-gray';
};

const roleDisplayName = (role) => {
  if (role === 'admin' || role === 'superadmin') return 'Admin';
  if (role === 'sub_admin') return 'Sub Admin';
  return role?.replace('_', ' ') || 'Admin';
};

export default function AdminCredentials() {
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [showPassword, setShowPassword] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'admin',
      isActive: true,
    }
  });

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/students/admins/list', {
        params: { page, limit: 10, search, role: roleFilter }
      });
      setAdmins(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load admin credentials');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const openCreateModal = () => {
    setEditingAdmin(null);
    setShowPassword(true);
    reset({ name: '', email: '', password: '', role: 'admin', isActive: true });
    setModalOpen(true);
  };

  const openEditModal = (adminItem) => {
    setEditingAdmin(adminItem);
    setShowPassword(false);
    reset({
      name: adminItem.name,
      email: adminItem.email,
      password: '',
      role: adminItem.role === 'sub_admin' ? 'sub_admin' : 'admin',
      isActive: adminItem.isActive,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editingAdmin) {
        const payload = { ...values };
        if (!payload.password) delete payload.password;
        await api.put(`/students/admins/${editingAdmin._id}`, payload);
        toast.success('Admin credentials updated successfully!');
      } else {
        if (!values.password) {
          toast.error('Password is required for new admin');
          return;
        }
        await api.post('/students/admins/create', values);
        toast.success('New admin user created successfully!');
      }
      setModalOpen(false);
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (adminItem) => {
    if (adminItem._id === currentUser?._id) {
      toast.error('You cannot delete your own logged-in account!');
      return;
    }
    const result = await Swal.fire({
      title: `Delete Admin "${adminItem.name}"?`,
      text: `Role: ${roleDisplayName(adminItem.role)}. This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Yes, Delete Admin',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/students/admins/${adminItem._id}`);
      toast.success('Admin account deleted');
      fetchAdmins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Admin Name',
      sortable: true,
      render: r => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {r.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-1.5">
              {r.name}
              {r._id === currentUser?._id && (
                <span className="text-[10px] bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-bold px-1.5 py-0.5 rounded">You</span>
              )}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'email',
      label: 'Admin ID / Email',
      render: r => <span className="font-mono text-xs text-slate-700 dark:text-slate-300">{r.email}</span>
    },
    {
      key: 'role',
      label: 'Role',
      render: r => (
        <span className={roleBadgeClass(r.role)}>
          {roleDisplayName(r.role)}
        </span>
      )
    },
    {
      key: 'password',
      label: 'Password',
      render: r => {
        const isVisible = visiblePasswords[r._id];
        return (
          <div className="flex items-center gap-2 font-mono text-xs text-slate-700 dark:text-slate-300">
            <span>{isVisible ? (r.plainPassword || 'Admin@123') : '••••••••'}</span>
            <button
              type="button"
              onClick={() => setVisiblePasswords(prev => ({ ...prev, [r._id]: !prev[r._id] }))}
              className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-primary-600 transition-colors"
              title={isVisible ? 'Hide Password' : 'Show Password'}
            >
              {isVisible ? <RiEyeOffLine className="w-3.5 h-3.5" /> : <RiEyeLine className="w-3.5 h-3.5" />}
            </button>
          </div>
        );
      }
    },
    {
      key: 'isActive',
      label: 'Status',
      render: r => (
        r.isActive
          ? <span className="admin-badge-green">Active</span>
          : <span className="admin-badge-red">Disabled</span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: r => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => openEditModal(r)}
            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"
            title="Edit Admin Credentials"
          >
            <RiEditLine className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(r)}
            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
            title="Delete Admin"
          >
            <RiDeleteBin2Line className="w-4 h-4" />
          </button>
        </div>
      )
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RiShieldUserLine className="w-6 h-6 text-primary-600" /> Admin Credentials
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Create and manage Admin and Sub Admin login credentials
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="admin-input w-40"
          >
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="sub_admin">Sub Admin</option>
          </select>

          <button onClick={openCreateModal} className="admin-btn-primary">
            <RiAddLine className="w-4 h-4" /> Create New Admin
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={admins}
        total={total}
        page={page}
        limit={10}
        loading={loading}
        onPageChange={setPage}
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by admin name or ID..."
        emptyMessage="No admin credentials found."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAdmin ? `Edit Admin: ${editingAdmin.name}` : 'Create New Admin User'}
        size="md"
        footer={
          <>
            <button type="button" onClick={() => setModalOpen(false)} className="admin-btn-secondary">
              Cancel
            </button>
            <button
              form="admin-form"
              type="submit"
              disabled={isSubmitting}
              className="admin-btn-primary"
            >
              {isSubmitting ? 'Saving...' : editingAdmin ? 'Update Admin' : 'Create Admin'}
            </button>
          </>
        }
      >
        <form id="admin-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="admin-label">Admin Name *</label>
            <input
              {...register('name', { required: 'Admin name is required' })}
              className="admin-input"
              placeholder="e.g. Mukesh Kumar"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>

          <div>
            <label className="admin-label">Admin ID / Email *</label>
            <input
              {...register('email', {
                required: 'Admin ID / Email is required',
                pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email format' }
              })}
              type="email"
              className="admin-input"
              placeholder="admin@examplatform.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
          </div>

          <div>
            <label className="admin-label">Role *</label>
            <select {...register('role', { required: 'Role is required' })} className="admin-input">
              <option value="admin">Admin</option>
              <option value="sub_admin">Sub Admin</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Select role access level for this user</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="admin-label mb-0">
                {editingAdmin ? 'New Password (leave blank to keep current)' : 'Password *'}
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 focus:outline-none"
              >
                {showPassword ? (
                  <><RiEyeOffLine className="w-3.5 h-3.5" /> Hide Password</>
                ) : (
                  <><RiEyeLine className="w-3.5 h-3.5" /> Make Password Visible</>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                {...register('password', {
                  minLength: { value: 6, message: 'Password must be at least 6 characters' }
                })}
                type={showPassword ? 'text' : 'password'}
                className="admin-input pr-10"
                placeholder={editingAdmin ? '••••••••' : 'Enter strong password'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <RiEyeOffLine className="w-4 h-4" /> : <RiEyeLine className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>

          <div>
            <label className="admin-label">Status</label>
            <select {...register('isActive')} className="admin-input">
              <option value={true}>Active</option>
              <option value={false}>Disabled</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
}
