import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { BookOpen, Users, FileText, CheckCircle } from 'lucide-react';
import Skeleton from '../../components/Skeleton';

const Dashboard = () => {
  const [stats, setStats] = useState({
    exams: 0,
    questions: 0,
    students: 0,
    attempts: 0
  });
  
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real stats from API
    const fetchStats = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('admin')).token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        
        const [exams, questions, students, results] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams`, config),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/questions`, config),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/students`, config),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/results`, config)
        ]);
        
        setStats({
          exams: exams.data.length,
          questions: questions.data.length,
          students: students.data.length,
          attempts: results.data.length
        });
        
        // Grab the top 5 most recent results 
        setRecentAttempts(results.data.slice(0, 5));
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Dashboard Overview</h1>
        <p style={{ color: 'var(--text-muted)' }}>Welcome back, Administrator. Here's what's happening today.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
        {loading ? (
          <Skeleton type="card" count={4} style={{ minHeight: '112px' }} />
        ) : (
          <>
            <DashboardCard icon={<FileText color="white" />} label="Total Exams" value={stats.exams} color="#1976d2" />
            <DashboardCard icon={<BookOpen color="white" />} label="Total Questions" value={stats.questions} color="#9c27b0" />
            <DashboardCard icon={<Users color="white" />} label="Total Students" value={stats.students} color="#0288d1" />
            <DashboardCard icon={<CheckCircle color="white" />} label="Test Attempts" value={stats.attempts} color="#2e7d32" />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: '20px' }}>Recent Exam Attempts</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-light)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Student</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Exam</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Score</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <Skeleton type="table-row" count={5} cols={4} />
                ) : recentAttempts.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>No exams actively attempted yet.</td></tr>
                ) : (
                  recentAttempts.map((attempt) => {
                    const maxMarks = attempt.exam?.questions?.length || 0; 
                    return (
                      <tr key={attempt._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        <td style={{ padding: '16px 12px', fontWeight: 500 }}>{attempt.student?.name || 'Unknown'}</td>
                        <td style={{ padding: '16px 12px' }}>{attempt.exam?.title || 'Unknown Exam'}</td>
                        <td style={{ padding: '16px 12px', color: 'var(--success)', fontWeight: 600 }}>{attempt.score} / {maxMarks}</td>
                        <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{new Date(attempt.submittedAt).toLocaleDateString()}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: '20px' }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => window.location.href = '/admin/create-exam'} className="btn btn-primary" style={{ justifyContent: 'flex-start' }}>Create New Exam</button>
            <button onClick={() => window.location.href = '/admin/manage-questions'} className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>Add Question to Bank</button>
            <button onClick={() => window.location.href = '/admin/students'} className="btn btn-outline" style={{ justifyContent: 'flex-start' }}>View Student Profiles</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const DashboardCard = ({ icon, label, value, color }) => (
  <div className="glass animate-fade-in" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '20px', alignItems: 'center' }}>
    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 16px -4px ${color}44` }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{value}</div>
    </div>
  </div>
);

export default Dashboard;
