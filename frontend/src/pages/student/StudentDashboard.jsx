/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import SecurePDFViewer from '../../components/student/SecurePDFViewer';
import axios from 'axios';
import {
  Zap, User, BookOpen, Lock, Trophy, BarChart2, Bell,
  Clock, Star, LogOut, CreditCard, CheckCircle,
  X, Loader, Target, Award, ChevronRight, Home, Crown, GraduationCap, FileText, Edit2, Menu, Eye, EyeOff
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5117';

const mockTests = [
  { id: 1, title: 'SBI PO Full Mock Test 1', tag: 'Banking', questions: 100, time: '60 min', difficulty: 'Hard', rating: 4.9, free: true, attempts: 12400 },
  { id: 2, title: 'SSC CGL Tier-1 Mock Test', tag: 'SSC', questions: 100, time: '60 min', difficulty: 'Medium', rating: 4.8, free: true, attempts: 9800 },
  { id: 3, title: 'IBPS PO Prelims Mock Test', tag: 'Banking', questions: 100, time: '60 min', difficulty: 'Hard', rating: 4.9, free: false, attempts: 6200 },
  { id: 4, title: 'RRB NTPC CBT-1 Mock Test', tag: 'Railway', questions: 100, time: '90 min', difficulty: 'Medium', rating: 4.7, free: false, attempts: 5400 },
  { id: 5, title: 'UPSC Prelims Full Mock', tag: 'UPSC', questions: 100, time: '120 min', difficulty: 'Hard', rating: 4.8, free: false, attempts: 4100 },
];



function PaymentModal({ test, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { user } = useUser();

  const handlePay = async () => {
    setLoading(true);
    try {
      // Create Razorpay order
      const { data: order } = await axios.post(`${API}/api/payments/create-order`, {
        amount: 500,
        testId: test.id,
        userId: user?._id,
      });

      // Load Razorpay script dynamically
      if (!window.Razorpay) {
        await new Promise((resolve) => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve;
          document.body.appendChild(s);
        });
      }

      const options = {
        key: order.key,
        amount: order.amount,
        currency: 'INR',
        name: 'ExamSphere',
        description: `Unlock: ${test.title}`,
        order_id: order.orderId,
        handler: async (response) => {
          // Verify payment
          await axios.post(`${API}/api/payments/verify`, {
            ...response,
            testId: test.id,
            userId: user?._id,
          });
          setDone(true);
          setTimeout(() => { onSuccess(test.id); onClose(); }, 2000);
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#4f46e5' },
      };
      new window.Razorpay(options).open();
    } catch {
      // Mock payment for demo
      setTimeout(() => { setDone(true); setTimeout(() => { onSuccess(test.id); onClose(); }, 2000); }, 1500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div className="payment-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        className="payment-modal glass"
        initial={{ scale: 0.85, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.85, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {done ? (
          <div className="payment-modal__success">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300 }}>
              <CheckCircle size={64} color="var(--success)" />
            </motion.div>
            <h3>Payment Successful!</h3>
            <p>Test unlocked. Redirecting...</p>
          </div>
        ) : (
          <>
            <button className="payment-modal__close" onClick={onClose}><X size={18} /></button>
            <div className="payment-modal__badge"><Crown size={20} /> Premium Test</div>
            <h2 className="payment-modal__title">Unlock Premium Mock Test</h2>
            <p className="payment-modal__test-name">{test.title}</p>

            <div className="payment-modal__features">
              {['100 Questions · Full Mock', 'Instant Score & Analytics', 'Rank Among All Students', 'Lifetime Access'].map(f => (
                <div key={f} className="payment-modal__feature">
                  <CheckCircle size={14} color="var(--success)" /> {f}
                </div>
              ))}
            </div>

            <div className="payment-modal__price">
              <div className="payment-modal__price-original">₹1,500</div>
              <div className="payment-modal__price-current">₹500</div>
              <div className="payment-modal__price-badge">67% OFF</div>
            </div>

            <button className="btn btn-primary payment-modal__pay-btn" onClick={handlePay} disabled={loading}>
              {loading ? <><Loader size={16} className="spin" /> Processing...</> : <><CreditCard size={16} /> Pay ₹500 — Unlock Now</>}
            </button>
            <p className="payment-modal__secure">🔒 Secured by Razorpay · 7-day refund guarantee</p>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

function MockTestCard({ test, isPurchased, onAttempt, onPay }) {
  const isFree = test.free || isPurchased;
  return (
    <motion.div
      className={`mock-card glass ${!isFree ? 'mock-card--locked' : ''}`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      {!test.free && !isPurchased && (
        <div className="mock-card__ribbon"><Crown size={12} /> Premium</div>
      )}
      <div className="mock-card__top">
        <span className="badge badge-orange">{test.tag}</span>
        <span className={`mock-card__difficulty ${test.difficulty.toLowerCase()}`}>{test.difficulty}</span>
      </div>
      <h3 className="mock-card__title">{test.title}</h3>
      <div className="mock-card__meta">
        <span><BookOpen size={13} /> {test.questions} Qs</span>
        <span><Clock size={13} /> {test.time}</span>
        <span><Star size={13} fill="#ff6b00" color="#ff6b00" /> {test.rating}</span>
        <span><User size={13} /> {test.attempts.toLocaleString()}</span>
      </div>

      {isFree ? (
        <button className="btn btn-primary mock-card__btn" onClick={() => onAttempt(test)}>
          Start Test <ChevronRight size={16} />
        </button>
      ) : (
        <button className="btn mock-card__lock-btn" onClick={() => onPay(test)}>
          <Lock size={16} /> Unlock for ₹500
        </button>
      )}
    </motion.div>
  );
}

export default function StudentDashboard() {
  const { user, logout, openLogin, notifications, fetchNotifications, markNotificationRead, unreadCount, updateUserProfile } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [payTest, setPayTest] = useState(null);
  const [purchases, setPurchases] = useState(user?.purchases || []);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [payments, setPayments] = useState([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  // Profile editing state
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [collectionFilter, setCollectionFilter] = useState('free');

  // EBook states
  const [dbBooks, setDbBooks] = useState([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [watermarkTemplate, setWatermarkTemplate] = useState('');
  const [activeBook, setActiveBook] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  const fetchDbBooks = async () => {
    setLoadingBooks(true);
    try {
      const res = await axios.get(`${API}/api/question-books`);
      setDbBooks(res.data);
    } catch (e) {
      console.error('Failed to fetch books', e);
    } finally {
      setLoadingBooks(false);
    }
  };

  const fetchWatermark = async () => {
    try {
      const res = await axios.get(`${API}/api/page-content/ebook-settings`);
      if (res.data && res.data.content && res.data.content.watermarkText) {
        setWatermarkTemplate(res.data.content.watermarkText);
      }
    } catch (e) {
      console.warn('Failed to load watermark settings:', e);
    }
  };

  const handleOpenBook = async (book) => {
    setLoadingPdf(true);
    setActiveBook(book);
    try {
      const token = user?.token;
      const res = await axios.get(`${API}/api/question-books/${book._id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPdfData(res.data.pdfData);
    } catch (err) {
      console.error(err);
      alert('Failed to load PDF file.');
      setActiveBook(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  // Read ?tab= from URL and set the active tab on mount / URL change
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const VALID_TABS = ['dashboard', 'profile', 'exams', 'payments', 'courses'];
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (user?._id) {
      fetchNotifications(user._id);
    }
    fetchDbBooks();
    fetchWatermark();
  }, [user?._id, fetchNotifications]);

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);

    if (tab === 'payments' && user?._id && payments.length === 0) {
      setLoadingPayments(true);
      try {
        const r = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payments/user/${user._id}`);
        setPayments(r.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingPayments(false);
      }
    }
  };



  const handleLogout = () => { logout(); navigate('/'); };

  const handlePurchaseSuccess = (testId) => {
    setPurchases(p => [...p, testId]);
  };

  const handleAttempt = () => {
    navigate('/login');
  };

  // Profile avatar pick
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert('Image must be under 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => setProfileAvatar(reader.result);
    reader.readAsDataURL(file);
  };

  const handleProfileSave = async () => {
    if (password && password !== confirmPassword) {
      alert('New Password and Confirm Password do not match.');
      return;
    }
    if (password && password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    setProfileSaving(true);
    try {
      const payload = { name: profileForm.name, phone: profileForm.phone, avatar: profileAvatar };
      if (password) {
        payload.password = password;
      }
      await updateUserProfile(payload);
      alert('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setProfileSaving(false);
    }
  };



  if (!user) {
    return (
      <div className="dashboard-unauth">
        <Zap size={48} color="var(--primary)" />
        <h2>Please login to access your dashboard</h2>
        <button onClick={openLogin} className="btn btn-primary">Login / Register</button>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="dashboard-sidebar-overlay" 
          onClick={() => setIsSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 999
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar glass ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Link to="/home" className="auth-logo" style={{ fontSize: '1.1rem', textDecoration: 'none' }}>
            <div className="auth-logo__icon" style={{ width: 30, height: 30 }}><Zap size={16} strokeWidth={2.5} /></div>
            <span style={{ fontFamily: 'Outfit', fontWeight: 800, color: 'var(--text-primary)' }}>Exam<span className="text-orange">Sphere</span></span>
          </Link>
          <button className="dashboard-close-btn" onClick={() => setIsSidebarOpen(false)} style={{ display: 'none', background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer' }}>
            <X size={22} />
          </button>
        </div>

        <div className="sidebar-user" style={{ flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 12px', gap: 0 }}>
          {profileAvatar ? (
            <img src={profileAvatar} alt="avatar" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', display: 'block' }} />
          ) : (
            <div className="sidebar-user__avatar" style={{ width: 56, height: 56, fontSize: '1.4rem', margin: 0 }}>{user.name?.charAt(0)?.toUpperCase()}</div>
          )}
        </div>

        <nav className="sidebar-nav">
          {[
            { id: 'dashboard', icon: BarChart2, label: 'Dashboard' },
            { id: 'profile', icon: User, label: 'My Profile' },
            { id: 'courses', icon: GraduationCap, label: 'My Collection' },
            { id: 'exams', icon: FileText, label: 'Exams Attended' },
            { id: 'payments', icon: CreditCard, label: 'Payments' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`sidebar-nav__item ${activeTab === id ? 'sidebar-nav__item--active' : ''}`}
              onClick={() => handleTabChange(id)}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <Link to="/home" className="sidebar-nav__item">
            <Home size={18} /> Back to Home
          </Link>
          <button className="sidebar-nav__item sidebar-nav__item--logout" onClick={handleLogout}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        {/* Header */}
        {/* Header */}
        <div className="dashboard-header" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '24px', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="dashboard-toggle-btn" onClick={() => setIsSidebarOpen(true)} style={{ display: 'none', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', cursor: 'pointer', color: 'var(--text-primary)' }}>
              <Menu size={22} />
            </button>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 className="dashboard-header__title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span className="welcome-text-prefix">Welcome back, </span>
                <span className="gradient-text">{user.name?.split(' ')[0]}</span>
                <span className="welcome-text-suffix">! 👋</span>
              </h1>

              {/* Bell icon with notification dropdown (placed directly next to name) */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setShowNotifDropdown(p => !p)}
                  style={{ position: 'relative', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: '50%', width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s' }}
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '1.5px solid var(--bg)' }} />
                  )}
                </button>
                <AnimatePresence>
                  {showNotifDropdown && (
                    <motion.div
                      key="notif-drop"
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      style={{ position: 'absolute', top: 45, left: 0, width: 320, maxHeight: 420, overflowY: 'auto', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.4)', zIndex: 999, padding: '8px 0' }}
                    >
                      <div style={{ padding: '12px 16px 8px', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Bell size={15} color="var(--primary)" /> Notifications
                        {unreadCount > 0 && <span style={{ background: '#ef4444', color: '#fff', borderRadius: 100, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700 }}>{unreadCount} new</span>}
                      </div>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          <Bell size={28} style={{ opacity: 0.2, display: 'block', margin: '0 auto 10px' }} />
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n._id} onClick={() => markNotificationRead(n._id)}
                            style={{ padding: '12px 16px', cursor: 'pointer', background: n.isRead ? 'transparent' : 'rgba(255,107,0,0.05)', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 10, alignItems: 'flex-start', transition: 'background 0.15s' }}
                          >
                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: n.isRead ? '#475569' : '#ff6b00', marginTop: 6, flexShrink: 0 }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: n.isRead ? 600 : 700, color: 'var(--text-primary)', fontSize: '0.85rem', marginBottom: 2 }}>{n.title}</div>
                              <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{n.message}</div>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>{new Date(n.createdAt).toLocaleString()}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
          <p className="dashboard-header__sub welcome-text-desc" style={{ margin: '2px 0 0 0' }}>Continue your exam preparation journey</p>
        </div>


        {/* Tab Content */}
        <AnimatePresence mode="wait">

          {/* ── DASHBOARD TAB ── */}
          {activeTab === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Quick Action Cards — 4 in a single row (Show on top) */}
              <div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                  {[
                    { icon: FileText, label: 'Give Free Exam', desc: '2 tests available', color: '#22c55e', bg: 'rgba(34,197,94,0.08)', tab: 'payments' },
                    { icon: Trophy, label: 'Leaderboard', desc: 'Your rank #142', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', tab: 'leaderboard' },
                    { icon: Clock, label: 'Recent Exams', desc: '3 attempts', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', tab: 'exams' },
                    { icon: User, label: 'Edit Profile', desc: 'Update your info', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', tab: 'profile' },
                  ].map(({ icon: Icon, label, desc, color, bg, tab }) => (
                    <motion.button key={label} whileHover={{ y: -4, scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleTabChange(tab)}
                      style={{ background: bg, border: `1px solid ${color}25`, borderRadius: 18, padding: '22px 18px', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 14, width: '100%', minHeight: 120 }}>
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={20} color={color} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem', marginBottom: 3 }}>{label}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{desc}</div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Free tests CTA */}
              <div style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.10), rgba(16,185,129,0.07))', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 18, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(34,197,94,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Zap size={20} color="#22c55e" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem', marginBottom: 3 }}>2 Free Mock Tests Available</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>SBI PO Mock · SSC CGL Mock — no payment needed</div>
                  </div>
                </div>
                <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 24px', fontSize: '0.88rem', whiteSpace: 'nowrap' }} onClick={handleAttempt}>
                  <Zap size={14} /> Start Now
                </button>
              </div>

              {/* Recent Activity */}
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Recent Activity</div>
                <div className="glass" style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                  {[
                    { icon: FileText, color: '#4f46e5', bg: 'rgba(79,70,229,0.12)', title: 'Attempted IBPS PO Prelims Mock', sub: 'Score: 81/100 · Rank #142', time: '3 days ago' },
                    { icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', title: 'Attempted SSC CGL Tier-1 Mock Test', sub: 'Score: 68/100 · Rank #312', time: '6 days ago' },
                    { icon: FileText, color: '#10b981', bg: 'rgba(16,185,129,0.12)', title: 'Attempted SBI PO Full Mock Test 1', sub: 'Score: 74/100 · Rank #234', time: '9 days ago' },
                    { icon: User, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', title: 'Profile updated', sub: 'Name and phone number changed', time: '12 days ago' },
                    { icon: Star, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', title: 'Joined ExamSphere', sub: 'Welcome! Your journey starts here 🎉', time: user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '' },
                  ].map((item, i) => (
                    <motion.div key={i}
                      initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                    >
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <item.icon size={16} color={item.color} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{item.title}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2 }}>{item.sub}</div>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>{item.time}</div>
                    </motion.div>
                  ))}
                </div>
              </div>


            </motion.div>
          )}

          {/* ── PROFILE TAB ── */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="dashboard-section-title"><User size={18} /> My Profile</div>
              <div className="glass" style={{ borderRadius: 20, padding: '32px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: '28px' }}>

                {/* Avatar Upload */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    {profileAvatar ? (
                      <img src={profileAvatar} alt="Avatar" style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)' }} />
                    ) : (
                      <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.2rem', fontWeight: 800, color: 'white', border: '3px solid var(--primary)' }}>
                        {user.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <label htmlFor="avatar-upload" style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg)' }} title="Change photo">
                      <Edit2 size={13} color="white" />
                      <input id="avatar-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
                    </label>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: 4 }}>{user.email}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 6 }}>Joined {user.joinedAt ? new Date(user.joinedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '—'}</div>
                  </div>
                </div>

                {/* Edit Fields */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '0.9rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Email Address</label>
                    <input
                      type="email"
                      value={user.email}
                      disabled
                      style={{ width: '100%', padding: '11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)', color: 'var(--text-muted)', boxSizing: 'border-box', fontSize: '0.9rem', cursor: 'not-allowed' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>New Password (optional)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••"
                        style={{ width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '0.9rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(p => !p)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'block', marginBottom: 6 }}>Confirm New Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="••••••"
                        style={{ width: '100%', padding: '11px 40px 11px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '0.9rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(p => !p)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleProfileSave}
                  disabled={profileSaving}
                  className="btn btn-primary"
                  style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8, padding: '12px 28px' }}
                >
                  {profileSaving ? <><Loader size={15} className="spin" /> Saving...</> : <><CheckCircle size={15} /> Save Changes</>}
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'courses' && (() => {
            const filteredBooks = collectionFilter === 'free'
              ? dbBooks.filter(b => b.isFree)
              : dbBooks.filter(b => !b.isFree && purchases.map(p => p.toString()).includes(b._id.toString()));

            const filteredMockTests = collectionFilter === 'free'
              ? mockTests.filter(t => t.free)
              : mockTests.filter(t => !t.free && purchases.map(p => p.toString()).includes(t.id.toString()));

            return (
              <motion.div key="courses" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                {/* Section Header with Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
                  <div className="dashboard-section-title" style={{ margin: 0 }}><GraduationCap size={18} /> My Collection</div>
                  <div>
                    <select
                      value={collectionFilter}
                      onChange={e => setCollectionFilter(e.target.value)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        background: 'rgba(255,255,255,0.04)',
                        color: 'var(--text-primary)',
                        fontFamily: 'Outfit',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: 'var(--shadow-sm)',
                        outline: 'none'
                      }}
                    >
                      <option value="free" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Free Content</option>
                      <option value="purchased" style={{ background: 'var(--surface)', color: 'var(--text-primary)' }}>Purchased Content</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                  {/* 1. PYQ Solved PDFs / E-Books */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {collectionFilter === 'free' ? 'Free PYQ PDFs & Study Materials' : 'Purchased PYQ PDFs & Study Materials'}
                      </div>
                      <span style={{ background: 'rgba(255,107,0,0.1)', color: 'var(--primary)', padding: '2px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700 }}>
                        {filteredBooks.length} Available
                      </span>
                    </div>

                    {filteredBooks.length === 0 ? (
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', borderRadius: 16, padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {collectionFilter === 'free' ? 'No free study materials available.' : 'No purchased study materials yet.'}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {filteredBooks.map(book => (
                          <div key={book._id} className="glass" style={{ padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(255,107,0,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                              <span className="badge badge-orange" style={{ marginBottom: 8, fontSize: '0.7rem' }}>{book.subject || 'Previous Year Paper'}</span>
                              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{book.title}</h3>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{book.description}</p>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', padding: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => handleOpenBook(book)}>
                              <BookOpen size={14} /> Read Secure PDF
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Mock Tests */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {collectionFilter === 'free' ? 'Free Practice Mock Tests' : 'Purchased Practice Mock Tests'}
                      </div>
                      <span style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700 }}>
                        {filteredMockTests.length} Available
                      </span>
                    </div>

                    {filteredMockTests.length === 0 ? (
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed var(--border)', borderRadius: 16, padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {collectionFilter === 'free' ? 'No free mock tests available.' : 'No purchased mock tests yet.'}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                        {filteredMockTests.map(test => (
                          <div key={test.id} className="glass" style={{ padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(34,197,94,0.15)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 12 }}>
                            <div>
                              <span className="badge badge-green" style={{ marginBottom: 8, fontSize: '0.7rem' }}>{test.tag}</span>
                              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>{test.title}</h3>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                {test.questions} Questions · {test.time} · {test.difficulty}
                              </div>
                            </div>
                            <button className="btn btn-primary" style={{ width: '100%', padding: '8px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }} onClick={() => handleAttempt(test)}>
                              <Zap size={14} /> Start Mock Test
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })()}







          {/* ── EXAMS ATTENDED TAB ── */}
          {activeTab === 'exams' && (
            <motion.div key="exams" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="dashboard-section-title"><FileText size={18} /> Exams Attended</div>

              {/* Purchased mock tests that can be attended */}
              {purchases.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Your Unlocked Tests</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {mockTests.filter(t => purchases.map(p => p.toString()).includes(t.id.toString())).map((test, i) => (
                      <motion.div key={test.id} className="glass" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                        style={{ padding: '16px 20px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <FileText size={20} color="#4f46e5" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{test.title}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 3 }}>{test.tag} · {test.questions} Qs · {test.time}</div>
                          </div>
                        </div>
                        <button className="btn btn-primary" style={{ padding: '9px 20px', fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: 6 }} onClick={handleAttempt}>
                          <Zap size={14} /> Start Exam
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recently attempted exams (static demo data) */}
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Recent Attempts</div>
              {[
                { id: 'a1', title: 'SBI PO Full Mock Test 1', tag: 'Banking', date: '2026-07-05', score: 74, total: 100, time: '58 min', rank: '#234' },
                { id: 'a2', title: 'SSC CGL Tier-1 Mock Test', tag: 'SSC', date: '2026-07-02', score: 68, total: 100, time: '54 min', rank: '#312' },
                { id: 'a3', title: 'IBPS PO Prelims Mock', tag: 'Banking', date: '2026-06-28', score: 81, total: 100, time: '60 min', rank: '#142' },
              ].map((exam, i) => (
                <motion.div key={exam.id} className="glass" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                  style={{ padding: '18px 22px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: exam.score >= 75 ? 'rgba(34,197,94,0.12)' : exam.score >= 60 ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem', fontWeight: 800, color: exam.score >= 75 ? '#22c55e' : exam.score >= 60 ? '#f59e0b' : '#ef4444' }}>
                      {exam.score}%
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.93rem', marginBottom: 4 }}>{exam.title}</div>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(exam.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Time: {exam.time}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rank {exam.rank}</span>
                        <span style={{ fontSize: '0.73rem', background: 'rgba(255,107,0,0.1)', color: 'var(--primary)', padding: '1px 8px', borderRadius: 100, fontWeight: 600 }}>{exam.tag}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" style={{ padding: '7px 14px', fontSize: '0.8rem' }}>View Report</button>
                    <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 5 }} onClick={handleAttempt}><Zap size={13} /> Reattempt</button>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* ── PAYMENTS TAB ── */}
          {activeTab === 'payments' && (
            <motion.div key="payments" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div className="dashboard-section-title"><CreditCard size={18} /> Payment History</div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Payment Transaction History</div>
              {loadingPayments ? <div style={{ textAlign: 'center', padding: 48 }}><Loader className="spin" size={28} style={{ color: 'var(--primary)' }} /></div>
                : payments.length === 0 ? (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 16, padding: '36px 24px', textAlign: 'center' }}>
                    <CreditCard size={40} style={{ opacity: 0.2, marginBottom: 12 }} />
                    <h3 style={{ color: 'var(--text-secondary)', marginBottom: 6, fontSize: '1rem' }}>No transaction history</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>Payments for premium mock tests or E-Books will show here.</p>
                  </div>
                ) : (
                  <div className="glass" style={{ borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}>
                        {['Date', 'Type', 'Amount', 'Status'].map(h => <th key={h} style={{ padding: '10px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, textAlign: 'left' }}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {payments.map(p => (
                          <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'capitalize' }}>{p.purchaseType || '—'}</td>
                            <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>₹{(p.amount / 100).toFixed(2)}</td>
                            <td style={{ padding: '12px 16px' }}><span style={{ padding: '3px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 700, background: p.status === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: p.status === 'success' ? '#22c55e' : '#f59e0b' }}>{p.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </motion.div>
          )}


        </AnimatePresence>
      </main>

      {/* Payment Modal */}
      <AnimatePresence>
        {payTest && (
          <PaymentModal test={payTest} onClose={() => setPayTest(null)} onSuccess={handlePurchaseSuccess} />
        )}
      </AnimatePresence>

      {/* Secure PDF Viewer Overlay */}
      {activeBook && pdfData && (
        <SecurePDFViewer
          pdfData={pdfData}
          title={activeBook.title}
          watermarkTemplate={watermarkTemplate}
          userInfo={{ name: user?.name, email: user?.email }}
          onClose={() => {
            setActiveBook(null);
            setPdfData(null);
          }}
        />
      )}

      {activeBook && loadingPdf && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          color: 'white', zIndex: 10000, gap: 16, backdropFilter: 'blur(5px)'
        }}>
          <Loader className="spin" size={40} style={{ color: 'var(--primary)' }} />
          <div style={{ fontFamily: 'Outfit', fontWeight: 600, fontSize: '1.1rem' }}>Decrypting Secure PDF... Please wait.</div>
        </div>
      )}
    </div>
  );
}
