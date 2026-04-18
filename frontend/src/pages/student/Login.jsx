import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Hash, Briefcase, Layers } from 'lucide-react';

const StudentLogin = () => {
  const [details, setDetails] = useState({ name: '', rollNumber: '', subject: '', section: '' });
  const [exams, setExams] = useState([]);
  const { studentLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams`);
        setExams(res.data.filter(e => e.isActive !== false));
      } catch (err) {
        console.error('Failed to fetch exams', err);
      }
    };
    fetchExams();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await studentLogin(details);
      navigate('/instructions');
    } catch (err) {
      alert('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const sections = ['A', 'B', 'C', 'D'];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }}>
      <div className="glass animate-fade-in" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '450px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', color: '#1e293b', marginBottom: '0.5rem' }}>Student Login</h1>
          <p style={{ color: 'var(--text-muted)' }}>Enter your details to access the exam</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label><User size={14} style={{ marginRight: 6 }} /> Full Name</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="e.g. John Doe" 
              required 
              value={details.name}
              onChange={(e) => setDetails({ ...details, name: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label><Hash size={14} style={{ marginRight: 6 }} /> Roll Number</label>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Enter roll number" 
              required 
              value={details.rollNumber}
              onChange={(e) => setDetails({ ...details, rollNumber: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group">
              <label><Briefcase size={14} style={{ marginRight: 6 }} /> Subject</label>
              <select 
                className="input-field" 
                required
                value={details.subject}
                onChange={(e) => setDetails({ ...details, subject: e.target.value })}
              >
                <option value="">Select Subject (Exam)</option>
                {exams.map(exam => <option key={exam._id} value={exam._id}>{exam.title}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label><Layers size={14} style={{ marginRight: 6 }} /> Section</label>
              <select 
                className="input-field" 
                required
                value={details.section}
                onChange={(e) => setDetails({ ...details, section: e.target.value })}
              >
                <option value="">Select Section</option>
                {sections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} disabled={loading}>
            {loading ? 'Logging in...' : <><LogIn size={18} /> Enter Exam Portal</>}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={() => navigate('/admin/login')} 
            style={{ background: 'transparent', border: 'none', color: '#1565c0', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', width: '100%' }}
          >
            <User size={16} /> Go to Admin Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
