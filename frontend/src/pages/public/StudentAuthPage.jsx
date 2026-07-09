import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import {
  Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight,
  BookOpen, Trophy, BarChart2, ShieldCheck, RefreshCw
} from 'lucide-react';

const features = [
  { icon: BookOpen,  text: '10,000+ Practice Questions' },
  { icon: Trophy,    text: '500+ Mock Tests' },
  { icon: BarChart2, text: 'Deep Performance Analytics' },
  { icon: ShieldCheck, text: 'Free Tests, No Credit Card' },
];

export default function StudentAuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { register, verifyOtp, login, user } = useUser();
  const { adminLogin } = useAuth();

  const defaultTab = new URLSearchParams(location.search).get('tab') === 'register' ? 'register' : 'login';
  const [tab, setTab] = useState(defaultTab);
  const [step, setStep] = useState(1); // 1=form, 2=OTP (register only)
  const [showPw, setShowPw]  = useState(false);

  // Form states
  const [loginForm,    setLoginForm]    = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      // Try admin login first
      try {
        await adminLogin(loginForm.email, loginForm.password);
        navigate('/admin/dashboard');
        return;
      } catch (adminErr) {
        // Not an admin or wrong admin credentials, fall back to user login
      }

      await login(loginForm.email, loginForm.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true); setError('');
    try {
      await register(registerForm);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  const handleOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await verifyOtp(registerForm.email, otp);
      // Now login
      await login(registerForm.email, registerForm.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      {/* Left Panel */}
      <div className="auth-left">
        <div className="orb orb-orange" style={{ width: 400, height: 400, top: -100, right: -100 }} />
        <div className="orb orb-purple" style={{ width: 250, height: 250, bottom: 50, left: -50 }} />

        <div className="auth-left__inner">
          <Link to="/home" className="auth-logo">
            <div className="auth-logo__icon"><Zap size={20} strokeWidth={2.5} /></div>
            <span>Exam<span className="text-orange">Sphere</span></span>
          </Link>

          <div className="auth-left__content">
            <h1 className="auth-left__title">
              Your Dream Job
              <span className="gradient-text"> Starts Here</span>
            </h1>
            <p className="auth-left__sub">
              Join 50,000+ students preparing for Banking, SSC, Railway, UPSC and Odisha state exams.
            </p>
            <ul className="auth-features">
              {features.map(({ icon: Icon, text }) => (
                <li key={text} className="auth-feature">
                  <div className="auth-feature__icon"><Icon size={16} /></div>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <motion.div className="auth-float-card glass" animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
            <Trophy size={20} color="var(--primary)" />
            <span>Rahul cleared SBI PO — Rank 47 All India!</span>
          </motion.div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="auth-right">
        <div className="auth-card glass">
          {/* Tabs */}
          {step === 1 && (
            <div className="auth-tabs">
              <button className={`auth-tab ${tab === 'login' ? 'auth-tab--active' : ''}`} onClick={() => { setTab('login'); setError(''); }}>Login</button>
              <button className={`auth-tab ${tab === 'register' ? 'auth-tab--active' : ''}`} onClick={() => { setTab('register'); setError(''); setStep(1); }}>Register</button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* LOGIN */}
            {tab === 'login' && (
              <motion.form key="login" className="auth-form" onSubmit={handleLogin} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="auth-form__title">Welcome Back!</h2>
                <p className="auth-form__sub">Login to access your dashboard</p>

                <div className="input-group">
                  <label htmlFor="login-email">Email Address</label>
                  <div className="auth-input-wrap">
                    <Mail size={16} className="auth-input-icon" />
                    <input id="login-email" type="email" className="input-field auth-input" placeholder="your@email.com" value={loginForm.email} onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="login-password">Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-input-icon" />
                    <input id="login-password" type={showPw ? 'text' : 'password'} className="input-field auth-input auth-input--pw" placeholder="Your password" value={loginForm.password} onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))} required />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(p => !p)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Logging in...' : <>Login <ArrowRight size={16} /></>}
                </button>

                <p className="auth-switch">
                  Don't have an account? <button type="button" className="auth-link" onClick={() => { setTab('register'); setError(''); }}>Register Free</button>
                </p>
              </motion.form>
            )}

            {/* REGISTER — Step 1 */}
            {tab === 'register' && step === 1 && (
              <motion.form key="register" className="auth-form" onSubmit={handleRegister} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="auth-form__title">Create Account</h2>
                <p className="auth-form__sub">Start your exam preparation journey</p>

                <div className="input-group">
                  <label htmlFor="reg-name">Full Name</label>
                  <div className="auth-input-wrap">
                    <User size={16} className="auth-input-icon" />
                    <input id="reg-name" type="text" className="input-field auth-input" placeholder="Your full name" value={registerForm.name} onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))} required />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="reg-email">Email Address</label>
                  <div className="auth-input-wrap">
                    <Mail size={16} className="auth-input-icon" />
                    <input id="reg-email" type="email" className="input-field auth-input" placeholder="your@email.com" value={registerForm.email} onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))} required />
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="reg-password">Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-input-icon" />
                    <input id="reg-password" type={showPw ? 'text' : 'password'} className="input-field auth-input auth-input--pw" placeholder="Min 6 characters" value={registerForm.password} onChange={e => setRegisterForm(f => ({ ...f, password: e.target.value }))} required minLength={6} />
                    <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(p => !p)}>{showPw ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                  </div>
                </div>

                <div className="input-group">
                  <label htmlFor="reg-confirmpassword">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-input-icon" />
                    <input id="reg-confirmpassword" type={showPw ? 'text' : 'password'} className="input-field auth-input auth-input--pw" placeholder="Confirm your password" value={registerForm.confirmPassword} onChange={e => setRegisterForm(f => ({ ...f, confirmPassword: e.target.value }))} required minLength={6} />
                  </div>
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Registering...' : <>Register & Login <ArrowRight size={16} /></>}
                </button>

                <p className="auth-switch">
                  Already have an account? <button type="button" className="auth-link" onClick={() => { setTab('login'); setError(''); }}>Login</button>
                </p>
              </motion.form>
            )}

            {/* OTP VERIFICATION — Step 2 */}
            {tab === 'register' && step === 2 && (
              <motion.form key="otp" className="auth-form" onSubmit={handleOtp} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="otp-icon">📧</div>
                <h2 className="auth-form__title">Verify Your Email</h2>
                <p className="auth-form__sub">We sent a 6-digit OTP to <strong>{registerForm.email}</strong></p>
                {success && <div className="auth-success">{success}</div>}

                <div className="input-group">
                  <label htmlFor="otp-input">Enter OTP</label>
                  <input id="otp-input" type="text" className="input-field otp-input" placeholder="• • • • • •" value={otp} onChange={e => setOtp(e.target.value)} maxLength={6} required />
                </div>

                {error && <div className="auth-error">{error}</div>}

                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                  {loading ? 'Verifying...' : <>Verify & Continue <ShieldCheck size={16} /></>}
                </button>

                <button type="button" className="auth-resend" onClick={() => handleRegister({ preventDefault: () => {} })}>
                  <RefreshCw size={14} /> Resend OTP
                </button>

                <button type="button" className="auth-link" onClick={() => { setStep(1); setError(''); }}>← Back</button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <p className="auth-terms">
          By registering, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
