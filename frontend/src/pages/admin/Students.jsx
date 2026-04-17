import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Star, Filter } from 'lucide-react';

const StudentsView = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBranch, setFilterBranch] = useState('All');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('admin')).token;
        const [studentsRes, resultsRes] = await Promise.all([
          axios.get('http://localhost:5000/api/students', {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get('http://localhost:5000/api/results', {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        const resultsMap = resultsRes.data;
        
        const mappedStudents = studentsRes.data.map(std => {
          const studentResults = resultsMap.filter(r => r.student?._id === std._id);
          let avgPercentage = null;
          let rating = 0;
          let status = 'N/A';

          if (studentResults.length > 0) {
            let totalPerc = 0;
            studentResults.forEach(r => {
              const max = r.exam?.questions?.length || 1;
              totalPerc += (r.score / max) * 100;
            });
            avgPercentage = totalPerc / studentResults.length;
            
            // Calculate Status
            status = avgPercentage >= 50 ? 'Passed' : 'Failed';
            
            // Calculate 5-star Rating
            if (avgPercentage >= 90) rating = 5;
            else if (avgPercentage >= 80) rating = 4;
            else if (avgPercentage >= 60) rating = 3;
            else if (avgPercentage >= 50) rating = 2;
            else rating = 1;
          }

          return { ...std, avgPercentage, status, rating };
        });

        setStudents(mappedStudents);
      } catch (err) {
        console.error('Failed to fetch student metrics', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderStars = (rating) => {
    if (rating === 0) return <span style={{ color: 'var(--text-muted)' }}>No exams</span>;
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            size={16} 
            fill={star <= rating ? '#fbbf24' : 'transparent'} 
            color={star <= rating ? '#fbbf24' : '#cbd5e1'} 
          />
        ))}
      </div>
    );
  };

  const branches = ['All', ...new Set(students.map(s => s.branch).filter(Boolean))];
  const filteredStudents = students.filter(s => filterBranch === 'All' || s.branch === filterBranch);

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Registered Students</h1>
          <p style={{ color: 'var(--text-muted)' }}>View student profiles integrated with live analytical scoring metrics.</p>
        </div>
        
        {!loading && students.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', padding: '10px 16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
            <Filter size={18} color="var(--primary)" />
            <span style={{ fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Branch:</span>
            <select 
              value={filterBranch} 
              onChange={e => setFilterBranch(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              {branches.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '16px', fontSize: '0.875rem' }}>Student Name</th>
                <th style={{ padding: '16px', fontSize: '0.875rem' }}>Roll No.</th>
                <th style={{ padding: '16px', fontSize: '0.875rem' }}>Branch (Sec)</th>
                <th style={{ padding: '16px', fontSize: '0.875rem' }}>Avg. Score</th>
                <th style={{ padding: '16px', fontSize: '0.875rem' }}>Status</th>
                <th style={{ padding: '16px', fontSize: '0.875rem' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                  <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    {student.name}
                  </td>
                  <td style={{ padding: '16px' }}>{student.rollNumber}</td>
                  <td style={{ padding: '16px' }}>{student.branch} ({student.section})</td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>
                    {student.avgPercentage !== null ? `${student.avgPercentage.toFixed(1)}%` : '-'}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '20px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600, 
                      background: student.status === 'Passed' ? '#f0fdf4' : student.status === 'Failed' ? '#fef2f2' : '#f1f5f9', 
                      color: student.status === 'Passed' ? '#15803d' : student.status === 'Failed' ? '#ef4444' : '#64748b' 
                    }}>
                      {student.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {renderStars(student.rating)}
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No students have registered yet.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading global registry metrics...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StudentsView;
