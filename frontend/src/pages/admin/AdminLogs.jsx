import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { useAuth } from '../../context/AuthContext';

const AdminLogs = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const { admin } = useAuth();
  
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '' });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const token = admin?.token || localStorage.getItem('admin') ? JSON.parse(localStorage.getItem('admin')).token : '';
      const res = await axios.get('http://localhost:5000/api/admins', {
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
      await axios.post('http://localhost:5000/api/admins', newAdmin, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNewAdmin({ email: '', password: '' });
      fetchAdmins();
      alert('Admin created successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create admin');
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Admin Logs</h2>
        <p style={{ color: 'var(--text-muted)' }}>View and create administrator accounts instantly</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem' }}>
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
          {loading ? (
            <p>Loading records...</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-light)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>ID</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Email (ID)</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Password</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.map((a, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{a._id}</td>
                      <td style={{ padding: '12px 16px', fontWeight: '600' }}>{a.email}</td>
                      <td style={{ padding: '12px 16px', color: '#10b981', fontFamily: 'monospace', fontWeight: 'bold' }}>
                        {a.plainPassword || '****** (Legacy)'}
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan="3" style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No admins found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLogs;
