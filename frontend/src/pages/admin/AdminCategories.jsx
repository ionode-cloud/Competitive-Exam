import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Edit2, Trash2, X, Loader, Folder, CheckCircle } from 'lucide-react';
import { alertSuccess, alertError, confirmAction } from '../../utils/alert';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const EMPTY_CAT = { name: '', icon: '📚', color: '#ff6b00', isActive: true };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState(EMPTY_CAT);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      // Fetch categories. We call the categories list endpoint.
      const res = await axios.get(`${API}/api/categories`);
      setCategories(res.data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openAdd = () => {
    setForm(EMPTY_CAT);
    setEditId(null);
    setModal('category');
  };

  const openEdit = (cat) => {
    setForm({
      name: cat.name || '',
      icon: cat.icon || '📚',
      color: cat.color || '#ff6b00',
      isActive: cat.isActive !== undefined ? cat.isActive : true
    });
    setEditId(cat._id);
    setModal('category');
  };

  const save = async () => {
    if (!form.name.trim()) {
      alertError('Validation Error', 'Category name is required.');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await axios.put(`${API}/api/categories/${editId}`, form, cfg());
        alertSuccess('Success', 'Category updated successfully');
      } else {
        await axios.post(`${API}/api/categories`, form, cfg());
        alertSuccess('Success', 'Category created successfully');
      }
      setModal(null);
      fetchCategories();
    } catch (err) {
      console.error(err);
      alertError('Failed to Save', err.response?.data?.message || 'Error occurred while saving category');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const confirm = await confirmAction(
      'Delete Category',
      'Are you sure you want to delete this category? Associated courses will lose their category association.',
      'Yes, delete',
      'Cancel'
    );
    if (!confirm) return;

    try {
      await axios.delete(`${API}/api/categories/${id}`, cfg());
      alertSuccess('Success', 'Category deleted successfully');
      fetchCategories();
    } catch (err) {
      console.error(err);
      alertError('Delete Failed', 'Failed to delete category.');
    }
  };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, background: 'var(--orange-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            Manage Categories
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Organize and categorize mock tests and course modules.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Plus size={18} /> Add Category
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <Loader size={36} className="spin" style={{ color: 'var(--primary)' }} />
        </div>
      ) : (
        <div className="admin-table-container glass">
          <table className="admin-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                {['Category Name', 'Status', 'Actions'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, textAlign: 'left' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No categories found. Click 'Add Category' to create one.
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>{cat.name}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 100,
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: cat.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                        color: cat.isActive ? '#22c55e' : '#64748b'
                      }}>
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEdit(cat)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', padding: 4 }}>
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => remove(cat._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal === 'category' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="glass" style={{ borderRadius: 20, border: '1px solid var(--border)', padding: 32, width: '100%', maxWidth: 480, position: 'relative' }}>
            <button onClick={() => setModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', padding: 6 }}>
              <X size={18} />
            </button>
            <h2 style={{ marginBottom: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
              {editId ? 'Edit Category' : 'Add Category'}
            </h2>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Category Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box' }} required />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 10 }}>
                <input type="checkbox" id="catActiveChk" checked={form.isActive} onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))} />
                <label htmlFor="catActiveChk" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Active / Visible</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex: 1 }}>
                {saving ? <><Loader size={14} className="spin" /> Saving...</> : 'Save Category'}
              </button>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
