import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock } from 'lucide-react';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(false);
    try {
      await adminLogin(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      alert('Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a' }}>
      <div className="glass animate-fade-in" style={{ padding: '2.5rem', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '400px', background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Shield color="white" size={30} />
          </div>
          <h1 style={{ fontSize: '1.75rem', color: 'white', marginBottom: '0.5rem' }}>Admin Portal</h1>
          <p style={{ color: '#94a3b8' }}>Secure access for exam management</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label style={{ color: '#cbd5e1' }}><Mail size={14} style={{ marginRight: 6 }} /> Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="admin@example.com" 
              required 
              style={{ background: '#1e293b', border: '1px solid #334155', color: 'white' }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label style={{ color: '#cbd5e1' }}><Lock size={14} style={{ marginRight: 6 }} /> Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••" 
              required 
              style={{ background: '#1e293b', border: '1px solid #334155', color: 'white' }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Login as Administrator'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <Link
              to="/admin/forgot-password"
              style={{ color: '#6366f1', fontSize: '13px', textDecoration: 'none', opacity: 0.85 }}
              onMouseOver={e => e.target.style.opacity = 1}
              onMouseOut={e => e.target.style.opacity = 0.85}
            >
              🔑 Forgot Password?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
