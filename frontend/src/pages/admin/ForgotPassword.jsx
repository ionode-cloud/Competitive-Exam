import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, KeyRound, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API = `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

// ── Step indicators ──────────────────────────────────────────────────────────
const StepBadge = ({ step, label, active, done }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
    <div style={{
      width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 14, fontWeight: 700, transition: 'all 0.4s',
      background: done ? 'linear-gradient(135deg,#22c55e,#16a34a)' : active ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.07)',
      border: done || active ? 'none' : '2px solid rgba(255,255,255,0.15)',
      color: done || active ? '#fff' : '#64748b',
      boxShadow: active ? '0 0 20px rgba(99,102,241,0.5)' : 'none',
    }}>
      {done ? '✓' : step}
    </div>
    <span style={{ fontSize: 10, color: active ? '#a5b4fc' : done ? '#4ade80' : '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
  </div>
);

const StepLine = ({ done }) => (
  <div style={{ flex: 1, height: 2, borderRadius: 2, background: done ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'rgba(255,255,255,0.08)', marginBottom: 20, transition: 'background 0.4s' }} />
);

// ── OTP Input boxes ──────────────────────────────────────────────────────────
const OtpInputs = ({ value, onChange }) => {
  const digits = 6;
  const refs = Array.from({ length: digits }, () => useRef(null));
  const arr = value.split('');

  const handleKey = (e, i) => {
    if (e.key === 'Backspace') {
      const next = value.split('');
      next[i] = '';
      onChange(next.join(''));
      if (i > 0) refs[i - 1].current.focus();
    }
  };

  const handleChange = (e, i) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = value.split('');
    next[i] = char;
    const joined = next.join('');
    onChange(joined);
    if (char && i < digits - 1) refs[i + 1].current.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, digits);
    if (pasted) { onChange(pasted.padEnd(digits, '').slice(0, digits)); refs[Math.min(pasted.length, digits - 1)].current.focus(); }
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', margin: '24px 0' }}>
      {Array.from({ length: digits }).map((_, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={arr[i] || ''}
          onChange={(e) => handleChange(e, i)}
          onKeyDown={(e) => handleKey(e, i)}
          onPaste={handlePaste}
          style={{
            width: 48, height: 56, borderRadius: 10, textAlign: 'center', fontSize: 22, fontWeight: 700,
            background: arr[i] ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
            border: arr[i] ? '2px solid #6366f1' : '2px solid rgba(255,255,255,0.1)',
            color: '#e2e8f0', outline: 'none', caretColor: '#6366f1',
            transition: 'all 0.2s', boxShadow: arr[i] ? '0 0 12px rgba(99,102,241,0.3)' : 'none',
          }}
        />
      ))}
    </div>
  );
};

// ── Countdown timer ──────────────────────────────────────────────────────────
const Countdown = ({ seconds, onExpire }) => {
  const [remaining, setRemaining] = useState(seconds);
  useEffect(() => {
    setRemaining(seconds);
    const id = setInterval(() => setRemaining(r => { if (r <= 1) { clearInterval(id); onExpire(); return 0; } return r - 1; }), 1000);
    return () => clearInterval(id);
  }, [seconds]);
  const m = Math.floor(remaining / 60).toString().padStart(2, '0');
  const s = (remaining % 60).toString().padStart(2, '0');
  return <span style={{ color: remaining < 30 ? '#f59e0b' : '#4ade80', fontWeight: 600 }}>{m}:{s}</span>;
};

// ── Main component ───────────────────────────────────────────────────────────
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=reset, 4=success
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpExpired, setOtpExpired] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  const clearError = () => setError('');

  // Step 1: Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault(); clearError(); setLoading(true);
    try {
      await axios.post(`${API}/admin/forgot-password/send-otp`, { email });
      setOtpExpired(false);
      setTimerKey(k => k + 1);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally { setLoading(false); }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    clearError(); setLoading(true); setOtp('');
    try {
      await axios.post(`${API}/admin/forgot-password/send-otp`, { email });
      setOtpExpired(false);
      setTimerKey(k => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    } finally { setLoading(false); }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault(); clearError();
    if (otp.length !== 6) { setError('Please enter the complete 6-digit OTP'); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/admin/forgot-password/verify-otp`, { email, otp });
      setResetToken(res.data.resetToken);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally { setLoading(false); }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault(); clearError();
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await axios.post(`${API}/admin/forgot-password/reset`, { resetToken, newPassword });
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
    } finally { setLoading(false); }
  };

  const containerStyle = {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#0f172a', padding: '2rem',
    backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.15) 0%, transparent 70%)',
  };

  const cardStyle = {
    width: '100%', maxWidth: 440, padding: '2.5rem', borderRadius: 20,
    background: 'rgba(15,23,42,0.9)', border: '1px solid rgba(99,102,241,0.2)',
    backdropFilter: 'blur(20px)', boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
  };

  const inputStyle = {
    width: '100%', padding: '0.85rem 1rem', borderRadius: 10, outline: 'none',
    background: 'rgba(30,41,59,0.8)', border: '1px solid rgba(255,255,255,0.1)',
    color: '#e2e8f0', fontSize: 15, boxSizing: 'border-box', transition: 'border 0.2s',
  };

  const btnStyle = {
    width: '100%', padding: '0.9rem', borderRadius: 10, border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: 15, transition: 'all 0.2s',
    background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
    color: '#fff', boxShadow: loading ? 'none' : '0 4px 20px rgba(99,102,241,0.35)',
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', margin: '0 auto 1rem',
            background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(99,102,241,0.4)',
          }}>
            {step === 4 ? <CheckCircle color="#fff" size={30} /> : <KeyRound color="#fff" size={28} />}
          </div>
          <h1 style={{ fontSize: '1.6rem', color: '#fff', margin: '0 0 6px', fontWeight: 700 }}>
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify OTP'}
            {step === 3 && 'New Password'}
            {step === 4 && 'Password Reset!'}
          </h1>
          <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
            {step === 1 && 'Enter your admin email to receive an OTP'}
            {step === 2 && `OTP sent to ${email}`}
            {step === 3 && 'Choose a strong new password'}
            {step === 4 && 'Your password has been updated successfully'}
          </p>
        </div>

        {/* Step Indicators (steps 1-3) */}
        {step <= 3 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: '2rem' }}>
            <StepBadge step={1} label="Email" active={step === 1} done={step > 1} />
            <StepLine done={step > 1} />
            <StepBadge step={2} label="OTP" active={step === 2} done={step > 2} />
            <StepLine done={step > 2} />
            <StepBadge step={3} label="Reset" active={step === 3} done={step > 3} />
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 10, padding: '0.75rem 1rem', marginBottom: '1.25rem',
            color: '#fca5a5', fontSize: 13, display: 'flex', gap: 8,
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── STEP 1: Email ─────────────────────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
                <Mail size={14} /> Email Address
              </label>
              <input
                type="email" required style={inputStyle}
                placeholder="admin@example.com"
                value={email}
                onChange={e => { setEmail(e.target.value); clearError(); }}
              />
            </div>
            <button type="submit" style={btnStyle} disabled={loading}>
              {loading ? '⏳ Sending OTP...' : '📧 Send OTP'}
            </button>
            <button
              type="button" onClick={() => navigate('/admin/login')}
              style={{ width: '100%', marginTop: 12, padding: '0.75rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              <ArrowLeft size={14} /> Back to Login
            </button>
          </form>
        )}

        {/* ── STEP 2: OTP ───────────────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 4px' }}>OTP expires in: <Countdown key={timerKey} seconds={300} onExpire={() => setOtpExpired(true)} /></p>
            </div>

            <OtpInputs value={otp} onChange={v => { setOtp(v); clearError(); }} />

            {otpExpired ? (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>⏰ OTP has expired.</p>
                <button type="button" onClick={handleResendOtp} disabled={loading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer', fontSize: 13 }}>
                  <RefreshCw size={14} /> {loading ? 'Sending...' : 'Resend OTP'}
                </button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <button type="button" onClick={handleResendOtp} disabled={loading}
                  style={{ background: 'transparent', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <RefreshCw size={12} /> Resend OTP
                </button>
              </div>
            )}

            <button type="submit" style={{ ...btnStyle, background: otp.length < 6 ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }} disabled={loading || otp.length < 6}>
              {loading ? '⏳ Verifying...' : '✅ Verify OTP'}
            </button>
            <button type="button" onClick={() => { setStep(1); setOtp(''); clearError(); }}
              style={{ width: '100%', marginTop: 12, padding: '0.75rem', borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ArrowLeft size={14} /> Change Email
            </button>
          </form>
        )}

        {/* ── STEP 3: New Password ──────────────────────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
                <Lock size={14} /> New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required minLength={6} style={{ ...inputStyle, paddingRight: 44 }}
                  placeholder="Min. 6 characters"
                  value={newPassword}
                  onChange={e => { setNewPassword(e.target.value); clearError(); }}
                />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 16 }}>
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 13, marginBottom: 8, fontWeight: 500 }}>
                <Lock size={14} /> Confirm Password
              </label>
              <input
                type="password" required minLength={6} style={{ ...inputStyle, borderColor: confirmPassword && newPassword !== confirmPassword ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)' }}
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={e => { setConfirmPassword(e.target.value); clearError(); }}
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ color: '#f87171', fontSize: 12, marginTop: 4 }}>⚠️ Passwords do not match</p>
              )}
            </div>

            {/* Password strength bar */}
            {newPassword && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4, transition: 'width 0.3s, background 0.3s',
                    width: newPassword.length >= 10 ? '100%' : newPassword.length >= 8 ? '66%' : '33%',
                    background: newPassword.length >= 10 ? '#22c55e' : newPassword.length >= 8 ? '#f59e0b' : '#ef4444',
                  }} />
                </div>
                <p style={{ fontSize: 11, color: newPassword.length >= 10 ? '#4ade80' : newPassword.length >= 8 ? '#fbbf24' : '#f87171', marginTop: 4 }}>
                  {newPassword.length >= 10 ? '💪 Strong' : newPassword.length >= 8 ? '⚡ Medium' : '⚠️ Weak'}
                </p>
              </div>
            )}

            <button type="submit" style={btnStyle} disabled={loading || newPassword.length < 6 || newPassword !== confirmPassword}>
              {loading ? '⏳ Resetting...' : '🔒 Reset Password'}
            </button>
          </form>
        )}

        {/* ── STEP 4: Success ───────────────────────────────────────────── */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: 80, height: 80, borderRadius: '50%', margin: '0 auto 1.5rem',
              background: 'rgba(34,197,94,0.15)', border: '2px solid rgba(34,197,94,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
              animation: 'pulse 2s infinite',
            }}>✅</div>
            <p style={{ color: '#86efac', fontSize: 15, marginBottom: '1.5rem', lineHeight: 1.6 }}>
              Your password has been successfully reset.<br />You can now log in with your new credentials.
            </p>
            <button
              onClick={() => navigate('/admin/login')}
              style={{ ...btnStyle, background: 'linear-gradient(135deg,#22c55e,#16a34a)', boxShadow: '0 4px 20px rgba(34,197,94,0.35)' }}
            >
              🚀 Go to Admin Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
