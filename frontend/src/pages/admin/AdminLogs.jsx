import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { Edit2, Trash2, Check, X } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import { alertSuccess, alertError, confirmAction } from '../../utils/alert';

const AdminLogs = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { admin } = useAuth();
  
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ email: '', password: '' });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = admin?.token || localStorage.getItem('admin') ? JSON.parse(localStorage.getItem('admin')).token : '';
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = admin?.token || localStorage.getItem('admin') ? JSON.parse(localStorage.getItem('admin')).token : '';
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admins`, newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewAdmin({ email: '', password: '' });
      fetchAdmins();
      alertSuccess('Created!', 'Admin created successfully');
    } catch (err) {
      alertError(err.response?.data?.message || 'Failed to create admin');
    }
  };

  const handleEditClick = (a) => {
    setEditingId(a._id);
    setEditForm({ email: a.email, password: a.plainPassword || '' });
  };

  const handleCancelClick = () => {
    setEditingId(null);
    setEditForm({ email: '', password: '' });
  };

  const handleUpdate = async (id) => {
    try {
      const token = admin?.token || localStorage.getItem('admin') ? JSON.parse(localStorage.getItem('admin')).token : '';
      await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admins/${id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEditingId(null);
      fetchAdmins();
      alertSuccess('Updated!', 'Admin updated successfully');
    } catch (err) {
      alertError(err.response?.data?.message || 'Failed to update admin');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmAction(
      'Delete Admin Account?',
      'Are you sure you want to delete this admin account? This action cannot be undone.'
    );
    if (!confirmed) return;
    try {
      const token = admin?.token || localStorage.getItem('admin') ? JSON.parse(localStorage.getItem('admin')).token : '';
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/admins/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAdmins();
      alertSuccess('Deleted!', 'Admin deleted successfully');
    } catch (err) {
      alertError(err.response?.data?.message || 'Failed to delete admin');
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Admin Logs</h2>
        <p style={{ color: 'var(--text-muted)' }}>View, edit, and delete administrator accounts instantly</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2.5fr', gap: '2rem' }}>
        {/* Create Admin Form */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)', alignSelf: 'start' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Create Admin</h3>
          <form onSubmit={handleCreate}>
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                required 
                placeholder="e.g. admin2@example.com"
                value={newAdmin.email}
                onChange={e => setNewAdmin({...newAdmin, email: e.target.value})}
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input 
                type="text" 
                className="input-field" 
                required 
                placeholder="e.g. securePass123"
                value={newAdmin.password}
                onChange={e => setNewAdmin({...newAdmin, password: e.target.value})}
              />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Password is saved and displayed for QA purposes.</small>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Create Account
            </button>
          </form>
        </div>

        {/* Admin List */}
        <div className="glass" style={{ padding: '1.5rem', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Existing Admins</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>ID</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Email (ID)</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Password</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <Skeleton type="table-row" count={3} cols={4} />
                ) : admins.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No admins found
                    </td>
                  </tr>
                ) : (
                  admins.map((a, i) => {
                    const isEditing = editingId === a._id;
                    return (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a._id}</td>
                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>
                          {isEditing ? (
                            <input 
                              type="email" 
                              className="input-field" 
                              style={{ padding: '6px 10px', fontSize: '0.875rem', margin: 0, width: '100%' }}
                              value={editForm.email}
                              onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                              required
                            />
                          ) : (
                            a.email
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#10b981', fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {isEditing ? (
                            <input 
                              type="text" 
                              className="input-field" 
                              style={{ padding: '6px 10px', fontSize: '0.875rem', margin: 0, width: '100%', color: '#10b981', fontFamily: 'monospace', fontWeight: 'bold' }}
                              value={editForm.password}
                              onChange={e => setEditForm({ ...editForm, password: e.target.value })}
                              required
                            />
                          ) : (
                            a.plainPassword || '****** (Legacy)'
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          {isEditing ? (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleUpdate(a._id)}
                                style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '4px' }}
                                title="Save"
                              >
                                <Check size={18} />
                              </button>
                              <button 
                                onClick={handleCancelClick}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                title="Cancel"
                              >
                                <X size={18} />
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                              <button 
                                onClick={() => handleEditClick(a)}
                                style={{ background: 'none', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }}
                                title="Edit"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDelete(a._id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                                title="Delete"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;

