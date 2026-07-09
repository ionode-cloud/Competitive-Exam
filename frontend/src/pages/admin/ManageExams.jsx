import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Trash2, AlertCircle, CheckCircle, Clock, BookOpen, ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import { alertSuccess, alertError, confirmAction } from '../../utils/alert';

const ManageExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState({});

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
      alertSuccess('Success', 'Exam status updated successfully');
    } catch (err) {
      alertError('Failed to update status');
    }
  };

  const deleteExam = async (examId) => {
    const confirmed = await confirmAction(
      'Are you sure?',
      'Are you sure you want to delete this exam PERMANENTLY? This cannot be undone.'
    );
    if (!confirmed) return;
    
    try {
      const adminToken = JSON.parse(localStorage.getItem('admin')).token;
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams/${examId}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setExams(prev => prev.filter(e => e._id !== examId));
      alertSuccess('Deleted!', 'Exam deleted successfully');
    } catch (err) {
      alertError('Failed to delete exam');
    }
  };

  const toggleExpand = (subject) => {
    setExpandedSubjects(prev => ({
      ...prev,
      [subject]: !prev[subject]
    }));
  };

  // Group exams by subjectName
  const groupedExams = exams.reduce((acc, exam) => {
    const sub = exam.subjectName || 'Unassigned';
    if (!acc[sub]) acc[sub] = [];
    acc[sub].push(exam);
    return acc;
  }, {});

  const subjects = Object.keys(groupedExams).sort();

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '8px', background: 'var(--orange-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Manage Exams</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Grouped by Subject. Click a row to show all exams created under that subject.</p>
      </div>

      <div className="glass" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border)' }}>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '20px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, width: '45%' }}>Subject Name</th>
              <th style={{ padding: '20px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, width: '35%' }}>Exams Count</th>
              <th style={{ padding: '20px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, textAlign: 'right', width: '20%' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <Skeleton type="table-row" count={3} cols={3} />
            ) : subjects.length === 0 ? (
              <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No exams found.</td></tr>
            ) : (
              subjects.map(subject => {
                const subExams = groupedExams[subject];
                const isExpanded = !!expandedSubjects[subject];

                return (
                  <React.Fragment key={subject}>
                    {/* Subject Row (Clickable) */}
                    <tr 
                      onClick={() => toggleExpand(subject)}
                      style={{ 
                        borderBottom: '1px solid var(--border)', 
                        background: isExpanded ? 'rgba(255,107,0,0.03)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.2s' 
                      }}
                      onMouseEnter={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isExpanded) e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <td style={{ padding: '20px 16px', fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--primary)' }} /> : <ChevronDown size={18} />}
                          {subject}
                        </div>
                      </td>
                      <td style={{ padding: '20px 16px', color: 'var(--text-secondary)' }}>
                        <span style={{ padding: '4px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 600 }}>
                          {subExams.length} {subExams.length === 1 ? 'Exam' : 'Exams'}
                        </span>
                      </td>
                      <td style={{ padding: '20px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--primary)', fontSize: '0.9rem' }}>
                        {isExpanded ? 'Hide Details' : 'View Details'}
                      </td>
                    </tr>

                    {/* Collapsible Exams List */}
                    {isExpanded && (
                      <tr>
                        <td colSpan="3" style={{ padding: '0 0 24px 0', background: 'rgba(0,0,0,0.1)' }}>
                          <div style={{ padding: '20px 24px', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                              <thead>
                                <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
                                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Topic / Name</th>
                                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Type</th>
                                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Duration</th>
                                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Questions</th>
                                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Total Marks</th>
                                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>Status</th>
                                  <th style={{ padding: '12px 16px', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {subExams.map(e => (
                                  <tr key={e._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600 }}>{e.topicName}</td>
                                    <td style={{ padding: '12px 16px' }}>
                                      {e.isPaid ? (
                                        <span style={{ padding: '2px 8px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '100px', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 700 }}>
                                          Paid (₹{e.price})
                                        </span>
                                      ) : (
                                        <span style={{ padding: '2px 8px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '100px', fontSize: '0.75rem', color: '#22c55e', fontWeight: 700 }}>
                                          Free
                                        </span>
                                      )}
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Clock size={14} /> {e.duration} mins
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <BookOpen size={14} /> {e.questions?.length || 0} Qs
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)', fontWeight: 600, fontSize: '0.85rem' }}>
                                      {e.totalMarks || '-'}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                      <span style={{ 
                                        padding: '4px 10px', 
                                        borderRadius: '20px', 
                                        fontSize: '0.7rem', 
                                        fontWeight: 700, 
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        background: e.isActive !== false ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                                        color: e.isActive !== false ? '#22c55e' : '#ef4444',
                                        border: `1px solid ${e.isActive !== false ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)'}`
                                      }}>
                                        {e.isActive !== false ? 'Active' : 'Inactive'}
                                      </span>
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                        <button 
                                          onClick={(event) => { event.stopPropagation(); toggleExamStatus(e._id, e.isActive !== false); }}
                                          style={{ 
                                            padding: '6px 12px', 
                                            borderRadius: '6px', 
                                            border: '1px solid var(--border)', 
                                            background: 'var(--bg-glass-light)', 
                                            color: 'var(--text-primary)',
                                            cursor: 'pointer',
                                            fontWeight: 600,
                                            fontSize: '0.8rem',
                                            transition: 'all 0.2s'
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-glass-light)'}
                                        >
                                          {e.isActive !== false ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button 
                                          onClick={(event) => { event.stopPropagation(); deleteExam(e._id); }}
                                          title="Delete Exam"
                                          style={{ 
                                            padding: '6px', 
                                            borderRadius: '6px', 
                                            borderWidth: '1px', 
                                            borderStyle: 'solid', 
                                            borderColor: 'rgba(239, 68, 68, 0.2)', 
                                            background: 'rgba(239, 68, 68, 0.08)', 
                                            color: '#ef4444',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s'
                                          }}
                                          onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.4)';
                                          }}
                                          onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                                          }}
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

export default ManageExams;
