import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Award, TrendingUp, AlertCircle, Filter, Trash2, Search } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import { alertSuccess, alertError, confirmAction } from '../../utils/alert';

const ResultsView = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterExam, setFilterExam] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchResults = async () => {
    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem('admin')).token;
      const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/results`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults(res.data);
    } catch (err) {
      console.error('Failed to fetch results', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, []);

  const handleClearHistory = async () => {
    const confirm1 = await confirmAction(
      'WARNING',
      'This will permanently delete ALL exam results from the database. This action cannot be undone. Are you absolutely sure?'
    );
    if (!confirm1) return;
    const confirm2 = await confirmAction(
      'Final Confirmation',
      'Please confirm once more: Delete entire history?'
    );
    if (!confirm2) return;

    try {
      const token = JSON.parse(localStorage.getItem('admin')).token;
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/results/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResults([]);
      alertSuccess('Cleared!', 'All results have been cleared.');
    } catch (err) {
      alertError('Failed to clear history');
    }
  };

  const uniqueExams = ['All', ...new Set(results.map(r => r.exam ? `${r.exam.topicName} - ${r.exam.subjectName}` : null).filter(Boolean))];

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const examName = r.exam ? `${r.exam.topicName} - ${r.exam.subjectName}` : 'Deleted Exam';
      const studentName = r.student?.name || '';
      
      const matchesFilter = filterExam === 'All' || examName === filterExam;
      const matchesSearch = studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            examName.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesFilter && matchesSearch;
    });
  }, [results, filterExam, searchTerm]);

  const metrics = useMemo(() => {
    const validResults = filteredResults.filter(r => r.exam);
    if (validResults.length === 0) return { average: 0, passRate: 0, alertCount: 0 };
    
    let totalPercentage = 0;
    let passedCount = 0;
    let alertCount = 0;
    
    validResults.forEach(r => {
      const max = r.exam.totalMarks || r.exam.questions?.length || 1; 
      const rawPercentage = (r.score / max) * 100;
      const percentage = Math.min(rawPercentage, 100);
      
      totalPercentage += percentage;
      if (percentage >= 50) passedCount++;
      else alertCount++;
    });
    
    return {
      average: (totalPercentage / validResults.length).toFixed(1),
      passRate: ((passedCount / validResults.length) * 100).toFixed(0),
      alertCount
    };
  }, [filteredResults]);

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '8px', background: 'var(--orange-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Exam Results</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Monitor student performance and live test analytics.</p>
        </div>
        
        {!loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', minWidth: '260px' }}>
              <Search size={18} color="var(--text-muted)" />
              <input 
                type="text" 
                placeholder="Search by student or exam..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-primary)', fontSize: '0.875rem', width: '100%' }}
              />
            </div>

            <button 
              onClick={handleClearHistory}
              className="btn btn-outline" 
              style={{ color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.08)', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
              title="Delete Entire History"
            >
              <Trash2 size={18} />
              Clear All Records
            </button>

            {results.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-glass)', padding: '10px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <Filter size={18} color="var(--primary)" />
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Filter Exam:</span>
                <select 
                  value={filterExam} 
                  onChange={e => setFilterExam(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  {uniqueExams.map(ex => (
                    <option key={ex} value={ex} style={{ background: 'var(--bg-card)', color: 'white' }}>{ex}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <MetricCard label="Average Score" value={loading ? '...' : `${metrics.average}%`} icon={<TrendingUp color="#0ea5e9" />} />
        <MetricCard label="Passing Rate" value={loading ? '...' : `${metrics.passRate}%`} icon={<Award color="#22c55e" />} />
        <MetricCard label="Needs Attention" value={loading ? '...' : metrics.alertCount} icon={<AlertCircle color="#ef4444" />} />
      </div>

      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid var(--border)' }}>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Student</th>
              <th style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Exam</th>
              <th style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Score</th>
              <th style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Status</th>
              <th style={{ padding: '16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <Skeleton type="table-row" count={5} cols={5} />
            ) : filteredResults.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No exam attempts recorded yet.</td></tr>
            ) : (
              filteredResults.map(res => {
                const examAvailable = !!res.exam;
                const maxMarks = examAvailable ? (res.exam.totalMarks || res.exam.questions?.length || 1) : 1;
                const rawPercentage = examAvailable ? ((res.score / maxMarks) * 100) : 0;
                const percentage = Math.min(rawPercentage, 100);
                const isPassing = examAvailable && percentage >= 50;

                return (
                  <tr key={res._id} style={{ borderBottom: '1px solid var(--border)', opacity: examAvailable ? 1 : 0.6 }}>
                    <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>{res.student?.name || 'Unknown'}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>
                      {examAvailable ? `${res.exam.topicName} - ${res.exam.subjectName}` : <span style={{ color: '#ef4444' }}>Exam Deleted</span>}
                    </td>
                    <td style={{ padding: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {examAvailable ? `${res.score} / ${maxMarks}` : `${res.score} (Limit Unknown)`}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        background: isPassing ? 'rgba(34, 197, 94, 0.08)' : 'rgba(239, 68, 68, 0.08)', 
                        color: isPassing ? '#22c55e' : '#ef4444',
                        border: `1px solid ${isPassing ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                      }}>
                        {isPassing ? 'Passed' : 'Failed'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)' }}>{new Date(res.submittedAt).toLocaleDateString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
};

const MetricCard = ({ label, value, icon }) => (
  <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border)' }}>
    <div>
      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{value}</div>
    </div>
    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg-glass-light)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </div>
  </div>
);

export default ResultsView;
