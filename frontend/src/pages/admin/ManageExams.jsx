import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Trash2, AlertCircle, CheckCircle, Clock, BookOpen } from 'lucide-react';

const ManageExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams`);
      setExams(res.data);
    } catch (err) {
      console.error('Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleExamStatus = async (examId, currentStatus) => {
    try {
      const adminToken = JSON.parse(localStorage.getItem('admin')).token;
      await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams/${examId}/status`, 
        { isActive: !currentStatus }, 
        { headers: { Authorization: `Bearer ${adminToken}` }}
      );
      setExams(prev => prev.map(e => e._id === examId ? { ...e, isActive: !currentStatus } : e));
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const deleteExam = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam PERMANENTLY? This cannot be undone.')) return;
    
    try {
      const adminToken = JSON.parse(localStorage.getItem('admin')).token;
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setExams(prev => prev.filter(e => e._id !== examId));
      alert('Exam deleted successfully');
    } catch (err) {
      alert('Failed to delete exam');
    }
  };

  if (loading) return <AdminLayout><div style={{ padding: '40px', textAlign: 'center' }}>Loading exams...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Manage Exams</h1>
        <p style={{ color: 'var(--text-muted)' }}>Enable/Disable exams or remove them from the system.</p>
      </div>

      <div className="glass" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '20px 16px', fontSize: '0.875rem' }}>Topic</th>
              <th style={{ padding: '20px 16px', fontSize: '0.875rem' }}>Subject</th>
              <th style={{ padding: '20px 16px', fontSize: '0.875rem' }}>Duration</th>
              <th style={{ padding: '20px 16px', fontSize: '0.875rem' }}>Questions</th>
              <th style={{ padding: '20px 16px', fontSize: '0.875rem' }}>Total Marks</th>
              <th style={{ padding: '20px 16px', fontSize: '0.875rem' }}>Status</th>
              <th style={{ padding: '20px 16px', fontSize: '0.875rem', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No exams found.</td></tr>
            ) : exams.map(e => (
              <tr key={e._id} style={{ borderBottom: '1px solid var(--border-light)', transition: 'background 0.2s' }} className="table-row-hover">
                <td style={{ padding: '16px', fontWeight: 600, fontSize: '1rem' }}>{e.topicName}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{e.subjectName}</td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={16} /> {e.duration} mins
                  </div>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={16} /> {e.questions?.length || 0} Questions
                  </div>
                </td>
                <td style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  {e.totalMarks || '-'}
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ 
                    padding: '6px 14px', 
                    borderRadius: '20px', 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: e.isActive !== false ? '#dcfce7' : '#fee2e2', 
                    color: e.isActive !== false ? '#166534' : '#b91c1c',
                    border: `1px solid ${e.isActive !== false ? '#bbf7d0' : '#fecaca'}`
                  }}>
                    {e.isActive !== false ? <><CheckCircle size={12} /> Active</> : <><AlertCircle size={12} /> Inactive</>}
                  </span>
                </td>
                <td style={{ padding: '16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => toggleExamStatus(e._id, e.isActive !== false)}
                      style={{ 
                        padding: '8px 16px', 
                        borderRadius: '8px', 
                        border: '1px solid var(--border-light)', 
                        background: 'white', 
                        cursor: 'pointer',
                        fontWeight: 600,
                        fontSize: '0.875rem',
                        transition: 'all 0.2s'
                      }}
                    >
                      {e.isActive !== false ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => deleteExam(e._id)}
                      title="Delete Exam"
                      style={{ 
                        padding: '8px', 
                        borderRadius: '8px', 
                        border: '1px solid #fee2e2', 
                        background: '#fef2f2', 
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default ManageExams;
