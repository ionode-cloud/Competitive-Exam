import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Star, Filter, Download as DownloadIcon, Trash2 } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import { alertSuccess, alertError, confirmAction } from '../../utils/alert';

const StudentsView = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBranch, setFilterBranch] = useState('All');

  const downloadExcel = () => {
    // Construct CSV Data
    const headers = ['Student Name', 'Roll Number', 'Assigned Exam', 'Avg. Score (%)', 'Status', 'Rating'];
    const rows = filteredStudents.map(s => [
      s.name,
      s.rollNumber,
      s.subject ? `${s.subject.topicName} - ${s.subject.subjectName}` : 'N/A',
      s.avgPercentage !== null ? s.avgPercentage.toFixed(1) : '0',
      s.status,
      s.rating
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create Download Link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Student_Report_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('admin')).token;
        const [studentsRes, resultsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/students`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/results`, {
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

  const handleDeleteStudent = async (id) => {
    const confirmed = await confirmAction(
      'Delete Student?',
      'Are you sure you want to delete this student and all their exam results? This action cannot be undone.'
    );
    if (!confirmed) return;
    try {
      const token = JSON.parse(localStorage.getItem('admin')).token;
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/students/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(prev => prev.filter(s => s._id !== id));
      alertSuccess('Deleted!', 'Student deleted successfully');
    } catch (err) {
      alertError('Failed to delete student');
    }
  };

  const handleClearRegistry = async () => {
    const confirm1 = await confirmAction(
      'CRITICAL WARNING',
      'This will permanently delete ALL registered students and ALL of their exam results. This action is irreversible. Proceed?'
    );
    if (!confirm1) return;
    const confirm2 = await confirmAction(
      'Final Confirmation',
      'Are you absolutely sure you want to clear the entire student registry?'
    );
    if (!confirm2) return;

    try {
      const token = JSON.parse(localStorage.getItem('admin')).token;
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/students/bulk/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents([]);
      alertSuccess('Cleared!', 'Student registry cleared successfully.');
    } catch (err) {
      alertError('Failed to clear registry');
    }
  };

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

  const branches = ['All', ...new Set(students.map(s => s.subject?.subjectName).filter(Boolean))];
  const filteredStudents = students.filter(s => filterBranch === 'All' || s.subject?.subjectName === filterBranch);

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Registered Students</h1>
          <p style={{ color: 'var(--text-muted)' }}>View student profiles integrated with live analytical scoring metrics.</p>
        </div>
        
        {!loading && students.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Download Button */}
            <button 
              onClick={downloadExcel}
              className="btn btn-outline" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', borderStyle: 'solid', borderColor: 'var(--primary)', color: 'var(--primary)', padding: '10px 20px' }}
            >
              <DownloadIcon size={18} />
              Download Excel
            </button>

            <button 
              onClick={handleClearRegistry}
              className="btn btn-outline" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', borderColor: '#fee2e2', padding: '10px 16px' }}
              title="Delete All Students"
            >
              <Trash2 size={18} />
              Clear Registry
            </button>

            {/* Filter */}
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
                <th style={{ padding: '16px', fontSize: '0.875rem' }}>Assigned Exam</th>
                <th style={{ padding: '16px', fontSize: '0.875rem' }}>Avg. Score</th>
                <th style={{ padding: '16px', fontSize: '0.875rem' }}>Status</th>
                <th style={{ padding: '16px', fontSize: '0.875rem' }}>Rating</th>
                <th style={{ padding: '16px', fontSize: '0.875rem', textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <Skeleton type="table-row" count={5} cols={7} />
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No students have registered yet.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(student => (
                  <tr key={student._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                        {student.name.charAt(0).toUpperCase()}
                      </div>
                      {student.name}
                    </td>
                    <td style={{ padding: '16px' }}>{student.rollNumber}</td>
                    <td style={{ padding: '16px' }}>
                      {student.subject ? `${student.subject.topicName} - ${student.subject.subjectName}` : 'N/A'}
                    </td>
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
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDeleteStudent(student._id)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '8px' }}
                        title="Delete Student"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
};

export default StudentsView;
