import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck, RefreshCw, X, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import authBannerImg from '../../assets/auth_banner.png';

export default function AuthModal({ isOpen, onClose, initialTab = 'login' }) {
  const { register, verifyOtp, login, user, pendingExamId, setPendingExamId } = useUser();
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  
  const [tab, setTab] = useState(initialTab);
  const [step, setStep] = useState(1); // 1 = Form entry, 2 = OTP Verification
  const [showPw, setShowPw] = useState(false);
  
  // Forms
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sync initial tab on open
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      setStep(1);
      setError('');
      setSuccess('');
      setOtp('');
    }
  }, [isOpen, initialTab]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // If already authenticated and modal is open, auto close
  useEffect(() => {
    if (user && isOpen) {
      onClose();
    }
  }, [user, isOpen, onClose]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Try admin login first
      try {
        await adminLogin(loginForm.email, loginForm.password);
        onClose();
        navigate('/admin/dashboard');
        return;
      } catch (adminErr) {
        // Not an admin or invalid admin credentials, fall back to user login
      }

      await login(loginForm.email, loginForm.password);
      onClose();
      // If a pending exam was saved, navigate to instructions
      if (pendingExamId) {
        const examId = pendingExamId;
        setPendingExamId(null);
        navigate(`/instructions?examId=${examId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await register(registerForm);
      onClose();
      // If a pending exam was saved, navigate to instructions
      if (pendingExamId) {
        const examId = pendingExamId;
        setPendingExamId(null);
        navigate(`/instructions?examId=${examId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyOtp(registerForm.email, otp);
      await login(registerForm.email, registerForm.password);
      onClose();
      // If a pending exam was saved, navigate to instructions
      if (pendingExamId) {
        const examId = pendingExamId;
        setPendingExamId(null);
        navigate(`/instructions?examId=${examId}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="auth-modal-overlay" onClick={onClose}>
        <motion.div 
          className="auth-modal-container" 
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: 'spring', duration: 0.4 }}
        >
          {/* Close button */}
          <button className="auth-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>

          {/* Left Column: Image & Text */}
          <div className="auth-modal-left">
            <div className="orb orb-orange" style={{ width: 300, height: 300, top: '-25%', left: '-25%', opacity: 0.15 }} />
            <div className="orb orb-blue" style={{ width: 250, height: 250, bottom: '-25%', right: '-25%', opacity: 0.15 }} />

            <img 
              src={authBannerImg} 
              alt="ExamSphere Prep" 
              style={{ 
                width: '100%', 
                maxWidth: '280px', 
                height: 'auto', 
                marginBottom: '2rem',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-orange)',
                border: '1px solid rgba(255, 107, 0, 0.2)'
              }}
            />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--text-primary)', fontFamily: 'Outfit' }}>
                Start Your Success Journey
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '280px', margin: '0 auto' }}>
                Join over 50,000+ serious aspirants practicing with real exam pattern mocks daily.
              </p>
            </div>
          </div>

          {/* Right Column: Interactive Forms */}
          <div className="auth-modal-right">
            {/* Tabs */}
            {step === 1 && (
              <div className="auth-tabs" style={{ marginBottom: '1.5rem' }}>
                <button 
                  className={`auth-tab ${tab === 'login' ? 'auth-tab--active' : ''}`} 
                  onClick={() => { setTab('login'); setError(''); }}
                >
                  Login
                </button>
                <button 
                  className={`auth-tab ${tab === 'register' ? 'auth-tab--active' : ''}`} 
                  onClick={() => { setTab('register'); setError(''); setStep(1); }}
                >
                  Register
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              {/* LOGIN TAB */}
              {tab === 'login' && (
                <motion.form 
                  key="login" 
                  className="auth-form" 
                  onSubmit={handleLoginSubmit} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="auth-form__title">Welcome Back!</h2>
                  <p className="auth-form__sub">Login to access your dashboard</p>

                  <div className="input-group">
                    <label htmlFor="modal-login-email">Email Address</label>
                    <div className="auth-input-wrap">
                      <Mail size={16} className="auth-input-icon" />
                      <input 
                        id="modal-login-email" 
                        type="email" 
                        className="input-field auth-input" 
                        placeholder="your@email.com" 
                        value={loginForm.email} 
                        onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="modal-login-password">Password</label>
                    <div className="auth-input-wrap">
                      <Lock size={16} className="auth-input-icon" />
                      <input 
                        id="modal-login-password" 
                        type={showPw ? 'text' : 'password'} 
                        className="input-field auth-input auth-input--pw" 
                        placeholder="Your password" 
                        value={loginForm.password} 
                        onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} 
                        required 
                      />
                      <button 
                        type="button" 
                        className="auth-pw-toggle" 
                        onClick={() => setShowPw(p => !p)}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Logging in...' : <>Login <ArrowRight size={16} /></>}
                  </button>

                  <p className="auth-switch">
                    Don't have an account?{' '}
                    <button type="button" className="auth-link" onClick={() => { setTab('register'); setError(''); }}>
                      Register Free
                    </button>
                  </p>
                </motion.form>
              )}

              {/* REGISTER TAB — STEP 1 */}
              {tab === 'register' && step === 1 && (
                <motion.form 
                  key="register" 
                  className="auth-form" 
                  onSubmit={handleRegisterSubmit} 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h2 className="auth-form__title">Create Account</h2>
                  <p className="auth-form__sub">Start your exam preparation journey</p>

                  <div className="input-group">
                    <label htmlFor="modal-reg-name">Full Name</label>
                    <div className="auth-input-wrap">
                      <User size={16} className="auth-input-icon" />
                      <input 
                        id="modal-reg-name" 
                        type="text" 
                        className="input-field auth-input" 
                        placeholder="Your full name" 
                        value={registerForm.name} 
                        onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="modal-reg-email">Email Address</label>
                    <div className="auth-input-wrap">
                      <Mail size={16} className="auth-input-icon" />
                      <input 
                        id="modal-reg-email" 
                        type="email" 
                        className="input-field auth-input" 
                        placeholder="your@email.com" 
                        value={registerForm.email} 
                        onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))} 
                        required 
                      />
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="modal-reg-password">Password</label>
                    <div className="auth-input-wrap">
                      <Lock size={16} className="auth-input-icon" />
                      <input 
                        id="modal-reg-password" 
                        type={showPw ? 'text' : 'password'} 
                        className="input-field auth-input auth-input--pw" 
                        placeholder="Min 6 characters" 
                        value={registerForm.password} 
                        onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))} 
                        required 
                        minLength={6} 
                      />
                      <button 
                        type="button" 
                        className="auth-pw-toggle" 
                        onClick={() => setShowPw(p => !p)}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="input-group">
                    <label htmlFor="modal-reg-confirmpassword">Confirm Password</label>
                    <div className="auth-input-wrap">
                      <Lock size={16} className="auth-input-icon" />
                      <input 
                        id="modal-reg-confirmpassword" 
                        type={showPw ? 'text' : 'password'} 
                        className="input-field auth-input auth-input--pw" 
                        placeholder="Confirm your password" 
                        value={registerForm.confirmPassword} 
                        onChange={e => setRegisterForm(f => ({ ...f, confirmPassword: e.target.value }))} 
                        required 
                        minLength={6} 
                      />
                    </div>
                  </div>

                  {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Registering...' : <>Register & Login <ArrowRight size={16} /></>}
                  </button>

                  <p className="auth-switch">
                    Already have an account?{' '}
                    <button type="button" className="auth-link" onClick={() => { setTab('login'); setError(''); }}>
                      Login
                    </button>
                  </p>
                </motion.form>
              )}

              {/* OTP VERIFICATION — STEP 2 */}
              {tab === 'register' && step === 2 && (
                <motion.form 
                  key="otp" 
                  className="auth-form" 
                  onSubmit={handleOtpSubmit} 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0 }}
                >
                  <div className="otp-icon">📧</div>
                  <h2 className="auth-form__title">Verify Your Email</h2>
                  <p className="auth-form__sub">We sent a 6-digit OTP to <strong>{registerForm.email}</strong></p>
                  
                  {success && <div className="auth-success" style={{ marginBottom: '1rem' }}>{success}</div>}

                  <div className="input-group">
                    <label htmlFor="modal-otp-input">Enter OTP</label>
                    <input 
                      id="modal-otp-input" 
                      type="text" 
                      className="input-field otp-input" 
                      placeholder="• • • • • •" 
                      value={otp} 
                      onChange={e => setOtp(e.target.value)} 
                      maxLength={6} 
                      required 
                    />
                  </div>

                  {error && <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>}

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Verifying...' : <>Verify & Continue <ShieldCheck size={16} /></>}
                  </button>

                  <button 
                    type="button" 
                    className="auth-resend" 
                    onClick={() => handleRegisterSubmit({ preventDefault: () => {} })}
                  >
                    <RefreshCw size={14} /> Resend OTP
                  </button>

                  <button 
                    type="button" 
                    className="auth-link" 
                    onClick={() => { setStep(1); setError(''); }}
                    style={{ margin: '1rem auto 0', display: 'block' }}
                  >
                    &larr; Back
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
