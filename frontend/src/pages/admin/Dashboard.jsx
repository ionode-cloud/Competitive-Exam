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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '8px', background: 'var(--orange-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dashboard Overview</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.975rem' }}>Welcome back, Administrator. Here's what's happening today.</p>
        </div>
        <button onClick={() => window.location.href = '/home'} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} /> View User Tab
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        {loading ? (
          <Skeleton type="card" count={4} style={{ minHeight: '112px' }} />
        ) : (
          <>
            <DashboardCard icon={<FileText color="white" size={24} />} label="Total Exams" value={stats.exams} color="var(--primary)" />
            <DashboardCard icon={<BookOpen color="white" size={24} />} label="Total Questions" value={stats.questions} color="#a855f7" />
            <DashboardCard icon={<Users color="white" size={24} />} label="Total Students" value={stats.students} color="#0ea5e9" />
            <DashboardCard icon={<CheckCircle color="white" size={24} />} label="Test Attempts" value={stats.attempts} color="#22c55e" />
          </>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: 700 }}>Recent Exam Attempts</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Student</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Exam</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Score</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Date</th>
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
                      <tr key={attempt._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px 12px', fontWeight: 500, color: 'var(--text-primary)' }}>{attempt.student?.name || 'Unknown'}</td>
                        <td style={{ padding: '16px 12px', color: 'var(--text-secondary)' }}>{attempt.exam?.title || 'Unknown Exam'}</td>
                        <td style={{ padding: '16px 12px', color: 'var(--success)', fontWeight: 700 }}>{attempt.score} / {maxMarks}</td>
                        <td style={{ padding: '16px 12px', color: 'var(--text-muted)' }}>{new Date(attempt.submittedAt).toLocaleDateString()}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', height: 'fit-content' }}>
          <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: 700 }}>Quick Actions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button onClick={() => window.location.href = '/admin/create-exam'} className="btn btn-primary" style={{ justifyContent: 'flex-start', width: '100%' }}>Create New Exam</button>
            <button onClick={() => window.location.href = '/admin/manage-questions'} className="btn btn-outline" style={{ justifyContent: 'flex-start', width: '100%' }}>Add Question to Bank</button>
            <button onClick={() => window.location.href = '/admin/students'} className="btn btn-outline" style={{ justifyContent: 'flex-start', width: '100%' }}>View Student Profiles</button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

const DashboardCard = ({ icon, label, value, color }) => (
  <div className="glass animate-fade-in" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '20px', alignItems: 'center', border: '1px solid var(--border)' }}>
    <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 24px -4px ${color}55` }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{value}</div>
    </div>
  </div>
);

export default Dashboard;
