import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Hash, BookOpen, Layers } from 'lucide-react';
import { alertError } from '../../utils/alert';

export default function StudentLoginForm({ isEmbedded = false }) {
  const [details, setDetails] = useState({ name: '', rollNumber: '', subject: '' });
  const [exams, setExams] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
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
      alertError('Login Failed', 'Please verify your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const uniqueSubjects = [...new Set(exams.map(e => e.subjectName))];
  const filteredTopics = exams.filter(e => e.subjectName === selectedSubject);

  return (
    <div 
      className="glass animate-fade-in" 
      style={{ 
        padding: isEmbedded ? '2rem' : '2.5rem', 
        borderRadius: 'var(--radius-lg)', 
        width: '100%', 
        maxWidth: '460px', 
        boxShadow: 'var(--shadow-orange)',
        border: '1px solid var(--border-orange)',
        background: 'var(--bg-glass)',
        margin: '0 auto'
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 className="gradient-text" style={{ fontSize: '2rem', marginBottom: '0.5rem', fontWeight: '800' }}>
          Student Exam Login
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Enter your credentials to access the test portal
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label style={{ color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} style={{ color: 'var(--primary)' }} /> Full Name
            </span>
          </label>
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
          <label style={{ color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Hash size={14} style={{ color: 'var(--primary)' }} /> Roll Number
            </span>
          </label>
          <input 
            type="text" 
            className="input-field" 
            placeholder="Enter roll number" 
            required 
            value={details.rollNumber}
            onChange={(e) => setDetails({ ...details, rollNumber: e.target.value })}
          />
        </div>

        <div className="input-group">
          <label style={{ color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={14} style={{ color: 'var(--primary)' }} /> Subject Name
            </span>
          </label>
          <select 
            className="input-field" 
            required
            value={selectedSubject}
            onChange={(e) => {
              setSelectedSubject(e.target.value);
              setDetails({ ...details, subject: '' });
            }}
            style={{ color: selectedSubject ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>Select Subject</option>
            {uniqueSubjects.map(sub => (
              <option key={sub} value={sub} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                {sub}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label style={{ color: 'var(--text-secondary)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={14} style={{ color: 'var(--primary)' }} /> Topic / Exam
            </span>
          </label>
          <select 
            className="input-field" 
            required
            value={details.subject}
            onChange={(e) => setDetails({ ...details, subject: e.target.value })}
            disabled={!selectedSubject}
            style={{ color: details.subject ? 'var(--text-primary)' : 'var(--text-muted)' }}
          >
            <option value="" style={{ background: 'var(--bg-card)', color: 'var(--text-muted)' }}>Select Topic</option>
            {filteredTopics.map(exam => (
              <option key={exam._id} value={exam._id} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                {exam.topicName}
              </option>
            ))}
          </select>
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          style={{ width: '100%', marginTop: '1rem', padding: '0.85rem' }} 
          disabled={loading}
        >
          {loading ? 'Logging in...' : <><LogIn size={18} /> Enter Exam Portal</>}
        </button>
      </form>

      {!isEmbedded && (
        <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={() => navigate('/admin/login')} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--primary)', 
              cursor: 'pointer', 
              fontWeight: '500', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '6px', 
              width: '100%' 
            }}
          >
            Go to Admin Dashboard &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
