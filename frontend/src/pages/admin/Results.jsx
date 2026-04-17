import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Award, TrendingUp, AlertCircle, Filter } from 'lucide-react';

const ResultsView = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterExam, setFilterExam] = useState('All');

  useEffect(() => {
    const fetchResults = async () => {
      try {
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
    fetchResults();
  }, []);

  const uniqueExams = ['All', ...new Set(results.map(r => r.exam?.title).filter(Boolean))];

  const filteredResults = useMemo(() => {
    return results.filter(r => filterExam === 'All' || r.exam?.title === filterExam);
  }, [results, filterExam]);

  const metrics = useMemo(() => {
    if (filteredResults.length === 0) return { average: 0, passRate: 0, alertCount: 0 };
    let totalPercentage = 0;
    let passedCount = 0;
    let alertCount = 0;
    
    filteredResults.forEach(r => {
      const max = r.exam?.questions?.length || 1; 
      const percentage = (r.score / max) * 100;
      totalPercentage += percentage;
      if (percentage >= 50) passedCount++;
      else alertCount++;
    });
    
    return {
      average: (totalPercentage / filteredResults.length).toFixed(1),
      passRate: ((passedCount / filteredResults.length) * 100).toFixed(0),
      alertCount
    };
  }, [filteredResults]);

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Exam Results</h1>
          <p style={{ color: 'var(--text-muted)' }}>Monitor student performance and live test analytics.</p>
        </div>
        
        {!loading && results.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '10px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
            <Filter size={18} color="var(--primary)" />
            <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Filter Exam:</span>
            <select 
              value={filterExam} 
              onChange={e => setFilterExam(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              {uniqueExams.map(ex => (
                <option key={ex} value={ex}>{ex}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <MetricCard label="Average Score" value={loading ? '...' : `${metrics.average}%`} icon={<TrendingUp color="#1976d2" />} />
        <MetricCard label="Passing Rate" value={loading ? '...' : `${metrics.passRate}%`} icon={<Award color="#2e7d32" />} />
        <MetricCard label="Needs Attention" value={loading ? '...' : metrics.alertCount} icon={<AlertCircle color="#ef4444" />} />
      </div>

      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '16px', fontSize: '0.875rem' }}>Student</th>
              <th style={{ padding: '16px', fontSize: '0.875rem' }}>Exam</th>
              <th style={{ padding: '16px', fontSize: '0.875rem' }}>Score</th>
              <th style={{ padding: '16px', fontSize: '0.875rem' }}>Status</th>
              <th style={{ padding: '16px', fontSize: '0.875rem' }}>Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading records...</td></tr>
            ) : filteredResults.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>No exam attempts recorded yet.</td></tr>
            ) : (
              filteredResults.map(res => {
                const maxMarks = res.exam?.questions?.length || 1;
                const percentage = (res.score / maxMarks) * 100;
                const isPassing = percentage >= 50;

                return (
                  <tr key={res._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '16px', fontWeight: 500 }}>{res.student?.name || 'Unknown'}</td>
                    <td style={{ padding: '16px' }}>{res.exam?.title || 'Unknown Exam'}</td>
                    <td style={{ padding: '16px', fontWeight: 700 }}>{res.score} / {maxMarks}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        padding: '4px 12px', 
                        borderRadius: '20px', 
                        fontSize: '0.75rem', 
                        fontWeight: 600, 
                        background: isPassing ? '#f0fdf4' : '#fef2f2', 
                        color: isPassing ? '#15803d' : '#ef4444' 
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
  <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
    </div>
    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
      {icon}
    </div>
  </div>
);

export default ResultsView;
