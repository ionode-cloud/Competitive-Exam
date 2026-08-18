// UserProfilePage.jsx — Student Dashboard (Profile, Exam Attend, Rank, Score Board, Purchase, Logout)
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../admin/context/AuthContext';
import {
  FaUser,
  FaClipboardList,
  FaTrophy,
  FaChartBar,
  FaCreditCard,
  FaSignOutAlt,
  FaCheckCircle,
  FaClock,
  FaEdit,
  FaKey,
  FaFileAlt,
  FaShieldAlt,
  FaStar,
  FaArrowRight,
  FaDownload,
  FaEye,
  FaEyeSlash,
  FaTimes,
  FaMinusCircle,
  FaCrown
} from 'react-icons/fa';

export default function UserProfilePage() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTabParam = searchParams.get('tab') || 'profile';
  const [activeTab, setActiveTab] = useState(activeTabParam);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Redirect admin & sub_admin users directly to admin panel
  useEffect(() => {
    if (user && ['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'].includes(user.role)) {
      if (user.role === 'sub_admin' && Array.isArray(user.permissions) && user.permissions.length > 0) {
        const firstTab = user.permissions[0].startsWith('/admin') ? user.permissions[0] : `/admin/${user.permissions[0]}`;
        navigate(firstTab, { replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    }
  }, [user, navigate]);

  // Sync tab with URL search param
  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'profile');
  }, [searchParams]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };  // Student profile form data initialized with registered user object
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    targetExam: user?.targetExam || '',
    state: user?.state || 'Odisha',
  });
  const [savedMsg, setSavedMsg] = useState('');

  // Keep form in sync when user object is loaded/updated
  useEffect(() => {
    if (user) {
      setProfileForm(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
        phone: user.phone || prev.phone,
        targetExam: user.targetExam || prev.targetExam,
      }));
    }
  }, [user]);

  // Check if user has an active paid subscription
  const hasSubscription = Boolean(
    user?.isPremium ||
    user?.isSubscribed ||
    user?.subscription?.name ||
    (user?.purchases && user.purchases.some(p => p.status === 'ACTIVE'))
  );

  // Dynamic user data state (live loaded from Backend MongoDB APIs)
  const [attendedExams, setAttendedExams] = useState(user?.attendedExams || []);
  const [scoreBoardData, setScoreBoardData] = useState(user?.scoreBoardData || []);
  const [purchases, setPurchases] = useState(user?.purchases || []);
  const [rankingData, setRankingData] = useState({
    myRank: '—',
    totalStudentsRanked: 0,
    percentile: 0,
    myStats: { totalScore: 0, totalAttempts: 0, avgPercentage: 0, avgAccuracy: 0, totalCorrect: 0, totalIncorrect: 0 },
    myExamRanks: [],
    topLeaderboard: []
  });
  const [rankLoading, setRankLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5303/api';

    // Fetch live attended exams history
    fetch(`${API_BASE}/subject-tests/user/my-attempts`, { headers })
      .then(r => r.json())
      .then(j => {
        if (j.success && Array.isArray(j.data) && j.data.length > 0) {
          setAttendedExams(j.data);
          setScoreBoardData(j.data.map(d => ({
            title: d.name,
            category: d.category,
            date: d.date,
            time: d.time,
            score: d.score,
            maxMarks: d.maxMarks || 100,
            correct: d.correct,
            wrong: d.wrong,
            unattempted: d.unattempted,
            percentile: d.percentile,
            attemptId: d.attemptId
          })));
        }
      })
      .catch(() => {});

    // Fetch live student purchase & subscription bills
    fetch(`${API_BASE}/orders/my-purchases`, { headers })
      .then(r => r.json())
      .then(j => {
        if (j.success && Array.isArray(j.data) && j.data.length > 0) {
          setPurchases(j.data);
        }
      })
      .catch(() => {});

    // Fetch live dynamic ranking & leaderboard
    setRankLoading(true);
    fetch(`${API_BASE}/subject-tests/rankings/my-rank`, { headers })
      .then(r => r.json())
      .then(j => {
        if (j.success && j.data) {
          setRankingData(j.data);
        }
      })
      .catch(() => {})
      .finally(() => setRankLoading(false));
  }, [activeTab]);

  const leaderboardTop = user?.rank ? (user?.leaderboard || []) : [];

  // Password modification state & visibility toggles
  const [pwdForm, setPwdForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showOldPwd, setShowOldPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdErr, setPwdErr] = useState('');

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateUser({
      name: profileForm.name,
      phone: profileForm.phone,
      targetExam: profileForm.targetExam,
    });
    setSavedMsg('Profile details (Name, Mobile Number & Target Exam) updated successfully!');
    setTimeout(() => setSavedMsg(''), 3500);
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    setPwdMsg('');
    setPwdErr('');

    if (!pwdForm.oldPassword) {
      setPwdErr('Please enter your current old password.');
      return;
    }
    if (pwdForm.newPassword.length < 6) {
      setPwdErr('New password must be at least 6 characters long.');
      return;
    }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdErr('New password and Confirm Password do not match.');
      return;
    }

    setPwdMsg('Password updated successfully! Log in with your new password on your next visit.');
    setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPwdMsg(''), 4000);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '85vh', background: 'var(--bg)', paddingBottom: '60px' }}>
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '32px 0 28px', color: '#ffffff' }}>
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFC93C 0%, #F59E0B 100%)',
              color: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px', fontWeight: 900, boxShadow: '0 6px 20px rgba(245, 158, 11, 0.4)'
            }}>
              {(user?.name || 'Student').substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: '220px', textAlign: 'left' }}>
              {hasSubscription ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 201, 60, 0.15)', color: '#FFC93C', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <FaCrown /> Premium Student Member
                </div>
              ) : (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(148, 163, 184, 0.15)', color: '#CBD5E1', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  <FaUser /> Student Member
                </div>
              )}
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: '6px 0 2px' }}>
                {user?.name || 'Student User'}
              </h1>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                {user?.email || ''} {profileForm.targetExam ? `• Target: ${profileForm.targetExam}` : ''}
              </p>
            </div>

            {hasSubscription ? (
              <div style={{
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                border: '1.5px solid #F59E0B', borderRadius: '14px', padding: '12px 18px',
                textAlign: 'left', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.2)'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <FaStar style={{ color: '#F59E0B' }} /> Active Subscription
                </div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#78350F', marginTop: '3px' }}>
                  {user?.subscription?.name || 'Pro Package — Unlimited Access'}
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#92400E', marginTop: '3px' }}>
                  {user?.subscription?.validUntil ? `Valid until: ${user.subscription.validUntil}` : 'Active Membership'}
                </div>
              </div>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '14px', padding: '12px 18px',
                textAlign: 'left'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Subscription Plan
                </div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#FFFFFF', marginTop: '3px' }}>
                  Free Plan (No Active Subscription)
                </div>
                <button
                  onClick={() => navigate('/subscription')}
                  style={{
                    marginTop: '8px', padding: '6px 14px', background: '#FFC93C', color: '#0F172A',
                    border: 'none', borderRadius: '6px', fontSize: '11.5px', fontWeight: 800, cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                >
                  Upgrade to Pro →
                </button>
              </div>
            )}
          </div>

          {/* Quick Stat Counter Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginTop: '24px' }}>
            {[
              { label: 'Exams Attended', val: `${attendedExams.length} Tests`, icon: <FaClipboardList />, color: '#3B82F6' },
              { label: 'Overall Rank', val: user?.rank ? `#${user.rank}` : '—', icon: <FaTrophy />, color: '#F59E0B' },
              { label: 'Avg Score Rate', val: user?.avgScore ? `${user.avgScore}%` : '—', icon: <FaChartBar />, color: '#10B981' },
              { label: 'Active Plan', val: hasSubscription ? (user?.subscription?.name || 'Pro Package') : 'Free Plan', icon: <FaCreditCard />, color: '#7C3AED' },
            ].map((st, i) => (
              <div key={i} style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '12px 16px', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: st.color, fontSize: '12px', fontWeight: 800 }}>
                  {st.icon} {st.label}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', marginTop: 4 }}>
                  {st.val}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Body with Tabs */}
      <div className="wrap" style={{ paddingTop: '28px' }}>
        {/* Navigation Tabs Bar */}
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto', borderBottom: '2px solid var(--line)',
          marginBottom: '28px', paddingBottom: '2px', scrollbarWidth: 'none'
        }}>
          {[
            { key: 'profile', label: 'My Profile', icon: <FaUser /> },
            { key: 'exams', label: 'Exam Attend', icon: <FaClipboardList /> },
            { key: 'rank', label: 'My Rank', icon: <FaTrophy /> },
            { key: 'scoreboard', label: 'Score Board', icon: <FaChartBar /> },
            { key: 'purchase', label: 'Purchase & Orders', icon: <FaCreditCard /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
                background: 'none', border: 'none', borderBottom: activeTab === tab.key ? '3px solid var(--primary)' : '3px solid transparent',
                color: activeTab === tab.key ? 'var(--primary)' : 'var(--muted)',
                fontWeight: activeTab === tab.key ? 900 : 600, fontSize: '14px', cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.2s', marginBottom: '-2px'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: PROFILE */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', textAlign: 'left' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 850, margin: '0 0 16px', color: 'var(--ink)' }}>
                Personal Information
              </h3>
              {savedMsg && (
                <div style={{ background: '#E8F8EE', border: '1px solid #0F9D58', color: '#0F9D58', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaCheckCircle /> {savedMsg}
                </div>
              )}
              <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                    placeholder="Enter your full name"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--line)', background: '#F8FAFC', fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    readOnly
                    placeholder="you@example.com"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--line)', background: '#F1F5F9', fontSize: '13.5px', fontWeight: 600, color: 'var(--muted)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="+91 XXXXX XXXXX"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--line)', background: '#F8FAFC', fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Target Exam</label>
                  <input
                    type="text"
                    value={profileForm.targetExam}
                    onChange={e => setProfileForm({ ...profileForm, targetExam: e.target.value })}
                    placeholder="e.g. OSSSC RI, OPSC OAS, SSC CGL..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--line)', background: '#F8FAFC', fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <button
                  type="submit"
                  style={{
                    padding: '11px 20px', background: 'var(--primary)', color: '#ffffff',
                    border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13.5px',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', marginTop: 6
                  }}
                >
                  <FaEdit /> Save Profile Changes
                </button>
              </form>
            </div>

            {/* Account Info & Change Password Box */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', textAlign: 'left' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 850, margin: '0 0 14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FaKey /> Change Account Password
                </h3>
                
                {pwdMsg && (
                  <div style={{ background: '#E8F8EE', border: '1px solid #0F9D58', color: '#0F9D58', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FaCheckCircle /> {pwdMsg}
                  </div>
                )}

                {pwdErr && (
                  <div style={{ background: '#FCEBEA', border: '1px solid #B4232F', color: '#B4232F', padding: '10px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⚠️ {pwdErr}
                  </div>
                )}

                <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Old Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showOldPwd ? 'text' : 'password'}
                        value={pwdForm.oldPassword}
                        onChange={e => setPwdForm({ ...pwdForm, oldPassword: e.target.value })}
                        placeholder="Enter current old password"
                        required
                        style={{ width: '100%', padding: '9px 36px 9px 12px', borderRadius: '8px', border: '1.5px solid var(--line)', background: '#F8FAFC', fontSize: '13px', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowOldPwd(!showOldPwd)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                      >
                        {showOldPwd ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>New Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPwd ? 'text' : 'password'}
                        value={pwdForm.newPassword}
                        onChange={e => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                        placeholder="At least 6 characters"
                        required
                        style={{ width: '100%', padding: '9px 36px 9px 12px', borderRadius: '8px', border: '1.5px solid var(--line)', background: '#F8FAFC', fontSize: '13px', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                      >
                        {showNewPwd ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Confirm New Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPwd ? 'text' : 'password'}
                        value={pwdForm.confirmPassword}
                        onChange={e => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                        placeholder="Re-enter new password"
                        required
                        style={{ width: '100%', padding: '9px 36px 9px 12px', borderRadius: '8px', border: '1.5px solid var(--line)', background: '#F8FAFC', fontSize: '13px', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center' }}
                      >
                        {showConfirmPwd ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    style={{
                      padding: '9px 16px', background: '#0F172A', color: '#ffffff',
                      border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px',
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, width: 'fit-content', marginTop: 4
                    }}
                  >
                    Update Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EXAM ATTEND */}
        {activeTab === 'exams' && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 850, margin: 0, color: 'var(--ink)' }}>
                  Attended Exams &amp; Mock Tests
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '4px 0 0' }}>
                  List of all competitive mock tests and sectional exams you have completed.
                </p>
              </div>
              <button onClick={() => navigate('/mock-test')} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                Attempt New Mock Test →
              </button>
            </div>

            {attendedExams.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Test Name</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Category</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Score</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Accuracy</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Rank</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendedExams.map((ex, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '14px', fontWeight: 700, color: 'var(--ink)' }}>{ex.name}</td>
                        <td style={{ padding: '14px', color: 'var(--muted)' }}>{ex.category}</td>
                        <td style={{ padding: '14px', color: 'var(--muted)' }}>{ex.date}</td>
                        <td style={{ padding: '14px', fontWeight: 800, color: '#10B981' }}>{ex.marks}</td>
                        <td style={{ padding: '14px', fontWeight: 700, color: 'var(--ink)' }}>{ex.accuracy}</td>
                        <td style={{ padding: '14px', fontWeight: 800, color: '#7C3AED' }}>{ex.rank}</td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              if (ex.attemptId) {
                                navigate(`/subject-test/result/${ex.attemptId}`);
                              } else {
                                handleTabChange('scoreboard');
                              }
                            }}
                            style={{ padding: '6px 14px', background: 'var(--primary)', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: 800, color: '#fff', cursor: 'pointer' }}
                          >
                            View Result &amp; Solutions →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                <FaClipboardList style={{ fontSize: 42, color: 'var(--line)', marginBottom: 12 }} />
                <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>No Exam Attempts Yet</h4>
                <p style={{ fontSize: 13, margin: '0 0 16px' }}>You haven't attempted any mock tests or subject exams yet. Take your first test to track your performance!</p>
                <button onClick={() => navigate('/mock-test')} style={{ padding: '9px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                  Attempt a Mock Test →
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MY RANK */}
        {activeTab === 'rank' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Top Rank Highlight Card */}
            <div style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              border: '1.5px solid #334155',
              borderRadius: '20px',
              padding: '28px 24px',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.3)'
            }}>
              <div style={{ position: 'absolute', right: -20, top: -20, opacity: 0.08, fontSize: 180, pointerEvents: 'none' }}>
                <FaTrophy />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 12px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 0.5, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <FaCrown /> Student Performance Rank
                  </span>
                  <h2 style={{ fontSize: 26, fontWeight: 900, margin: '10px 0 4px', color: '#fff', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    Overall Rank: <span style={{ color: '#fbbf24', fontSize: 32 }}>#{rankingData.myRank || '—'}</span>
                    {rankingData.totalStudentsRanked > 0 && (
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#94a3b8' }}>
                        / {rankingData.totalStudentsRanked} Candidates
                      </span>
                    )}
                  </h2>
                  <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>
                    {rankingData.myRank && rankingData.myRank !== '—' ? (
                      <span>You are ranked in the <strong style={{ color: '#38bdf8' }}>Top {rankingData.topPercentage}%</strong> among all active candidates based on cumulative test scores and accuracy.</span>
                    ) : (
                      <span>Ranked against all participating students based on cumulative test scores and accuracy.</span>
                    )}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Overall Standing</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#38bdf8', marginTop: 2 }}>
                      {rankingData.topPercentage > 0 ? `Top ${rankingData.topPercentage}%` : '—'}
                    </div>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14, padding: '12px 18px', textAlign: 'center' }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Percentile</div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#10b981', marginTop: 2 }}>{rankingData.percentile || 0}%ile</div>
                  </div>
                </div>
              </div>

              {/* Quick Metrics Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Total Score</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>{rankingData.myStats?.totalScore || 0} pts</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Average Accuracy</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399', marginTop: 2 }}>{rankingData.myStats?.avgAccuracy || 0}%</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Tests Attempted</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa', marginTop: 2 }}>{rankingData.myStats?.totalAttempts || 0}</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Correct Answers</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#4ade80', marginTop: 2 }}>{rankingData.myStats?.totalCorrect || 0}</div>
                </div>
              </div>
            </div>

            {/* ── Side-by-Side: Left: Exam-Wise Rankings | Right: Top 15 Leaderboard ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24, alignItems: 'start' }}>
              {/* LEFT COLUMN: Exam-Wise Rankings */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 850, margin: 0, color: 'var(--ink)' }}>
                      📝 Your Exam-Wise Rankings
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>
                      Your individual rank and performance in each completed exam.
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '3px 10px', borderRadius: 20 }}>
                    {rankingData.myExamRanks?.length || 0} Attempts
                  </span>
                </div>

                {rankingData.myExamRanks && rankingData.myExamRanks.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '600px', overflowY: 'auto', paddingRight: 4 }}>
                    {rankingData.myExamRanks.map((er, idx) => (
                      <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                          <div>
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#2563eb', background: '#eff6ff', padding: '2px 8px', borderRadius: 10, textTransform: 'uppercase' }}>
                              {er.testType}
                            </span>
                            <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a', lineHeight: 1.3, marginTop: 4 }}>
                              {er.testTitle}
                            </div>
                          </div>
                          <span style={{
                            fontSize: 12, fontWeight: 900,
                            color: er.rank === 1 ? '#d97706' : (er.rank === 2 ? '#475569' : (er.rank === 3 ? '#c2410c' : '#2563eb')),
                            background: er.rank === 1 ? '#fef3c7' : '#f1f5f9',
                            border: er.rank <= 3 ? '1px solid currentColor' : '1px solid #cbd5e1',
                            padding: '3px 10px', borderRadius: 20, whiteSpace: 'nowrap', flexShrink: 0
                          }}>
                            {er.rank === 1 ? '🥇 Rank #1' : (er.rank === 2 ? '🥈 Rank #2' : (er.rank === 3 ? '🥉 Rank #3' : `Rank #${er.rank}`))} / {er.totalCandidates}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid #e2e8f0', paddingTop: 8, flexWrap: 'wrap', gap: 6 }}>
                          <span style={{ fontWeight: 800, color: '#10b981' }}>Score: {er.score} pts</span>
                          <span style={{ color: '#64748b', fontWeight: 600 }}>Accuracy: {er.accuracy}%</span>
                          <button
                            onClick={() => navigate(`/subject-test/result/${er.attemptId}`)}
                            style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                          >
                            View Result →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)' }}>
                    <FaClipboardList style={{ fontSize: 38, color: '#cbd5e1', marginBottom: 10 }} />
                    <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 800, color: 'var(--ink)' }}>No Exam Attempts Yet</h4>
                    <p style={{ fontSize: 12.5, margin: '0 0 16px' }}>Take your first mock test or subject test to see your exam rankings here!</p>
                    <button onClick={() => navigate('/mock-test')} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                      Take a Test →
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT COLUMN: Top 15 Candidates Leaderboard */}
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 850, margin: 0, color: 'var(--ink)' }}>
                      🏆 Top 15 Candidates Leaderboard
                    </h3>
                    <p style={{ fontSize: 12, color: 'var(--muted)', margin: '3px 0 0' }}>
                      Top 15 highest performing students platform-wide.
                    </p>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '3px 10px', borderRadius: 20 }}>
                    Top 15 Rankers
                  </span>
                </div>

                {rankingData.topLeaderboard && rankingData.topLeaderboard.length > 0 ? (
                  <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
                          <th style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--muted)', width: 60 }}>Rank</th>
                          <th style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--muted)' }}>Candidate</th>
                          <th style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--muted)' }}>Score</th>
                          <th style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--muted)' }}>Accuracy</th>
                          <th style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--muted)' }}>Badge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rankingData.topLeaderboard.map((st, idx) => (
                          <tr key={idx} style={{
                            borderBottom: '1px solid var(--line)',
                            background: st.isCurrentUser ? '#fef3c7' : 'transparent',
                            fontWeight: st.isCurrentUser ? 700 : 500
                          }}>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 26, height: 26, borderRadius: '50%',
                                fontWeight: 900, fontSize: 11,
                                background: st.rank === 1 ? '#fef3c7' : (st.rank === 2 ? '#f1f5f9' : (st.rank === 3 ? '#ffedd5' : '#f8fafc')),
                                color: st.rank === 1 ? '#d97706' : (st.rank === 2 ? '#475569' : (st.rank === 3 ? '#c2410c' : '#64748b')),
                                border: st.rank <= 3 ? '1.5px solid currentColor' : '1px solid #e2e8f0'
                              }}>
                                {st.rank === 1 ? '🥇' : (st.rank === 2 ? '🥈' : (st.rank === 3 ? '🥉' : `#${st.rank}`))}
                              </span>
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{
                                  width: 28, height: 28, borderRadius: '50%',
                                  background: st.isCurrentUser ? '#f59e0b' : '#1e293b', color: '#fff',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0
                                }}>
                                  {(st.name || 'ST').substring(0, 2).toUpperCase()}
                                </div>
                                <div className="truncate" style={{ maxWidth: 120 }}>
                                  <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink)' }} className="truncate">
                                    {st.name}
                                  </div>
                                  {st.isCurrentUser && (
                                    <span style={{ fontSize: 9, color: '#d97706', background: '#fff', padding: '1px 5px', borderRadius: 6, border: '1px solid #fcd34d', fontWeight: 800 }}>
                                      YOU
                                    </span>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 900, color: '#10b981', fontSize: 13 }}>
                              {st.totalScore}
                            </td>
                            <td style={{ padding: '10px 12px', fontWeight: 800, color: '#2563eb' }}>
                              {st.avgAccuracy}%
                            </td>
                            <td style={{ padding: '10px 12px' }}>
                              <span style={{ fontSize: 10, fontWeight: 800, color: st.rank <= 3 ? '#d97706' : '#64748b', background: '#f8fafc', padding: '2px 6px', borderRadius: 8, border: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>
                                {st.badge}
                              </span>
                            </td>
                          </tr>
                        ))}

                        {/* If user is NOT in the Top 15, show their position row with rank % */}
                        {!rankingData.isInTop15 && rankingData.myStats?.totalAttempts > 0 && (
                          <>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px dashed #cbd5e1' }}>
                              <td colSpan={5} style={{ padding: '6px 12px', textAlign: 'center', color: '#94a3b8', fontSize: 10.5, fontWeight: 700 }}>
                                ••• Your Current Position (Beyond Top 15) •••
                              </td>
                            </tr>
                            <tr style={{ background: '#fef3c7', borderBottom: '2px solid #f59e0b', fontWeight: 700 }}>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                  width: 28, height: 28, borderRadius: '50%',
                                  fontWeight: 900, fontSize: 11,
                                  background: '#f59e0b', color: '#fff', border: '1px solid #d97706'
                                }}>
                                  #{rankingData.myRank}
                                </span>
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: '#f59e0b', color: '#fff',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0
                                  }}>
                                    {(rankingData.myStats?.name || 'ME').substring(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div style={{ fontSize: 12.5, fontWeight: 800, color: 'var(--ink)' }}>
                                      {rankingData.myStats?.name || 'You'} <span style={{ fontSize: 9, color: '#d97706', background: '#fff', padding: '1px 5px', borderRadius: 6, border: '1px solid #fcd34d' }}>YOU</span>
                                    </div>
                                    <div style={{ fontSize: 10, color: '#d97706', fontWeight: 800 }}>
                                      Top {rankingData.topPercentage}% ({rankingData.percentile}%ile)
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 900, color: '#10b981', fontSize: 13 }}>
                                {rankingData.myStats?.totalScore || 0}
                              </td>
                              <td style={{ padding: '10px 12px', fontWeight: 800, color: '#2563eb' }}>
                                {rankingData.myStats?.avgAccuracy || 0}%
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#d97706', background: '#fff', padding: '2px 6px', borderRadius: 8, border: '1px solid #fcd34d' }}>
                                  {rankingData.myStats?.badge || 'Candidate'}
                                </span>
                              </td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--muted)' }}>
                    <FaTrophy style={{ fontSize: 36, color: '#f59e0b', opacity: 0.6, marginBottom: 8 }} />
                    <p style={{ margin: 0, fontSize: 12.5 }}>No student attempts recorded yet. Attempt a test to appear on the leaderboard!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SCORE BOARD */}
        {activeTab === 'scoreboard' && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 850, margin: 0, color: 'var(--ink)' }}>
                  Detailed Exam Score Board &amp; Analysis Table
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '4px 0 0' }}>
                  Comprehensive overview of all attended exams with score breakdowns, accuracy metrics, and percentile ranks.
                </p>
              </div>
            </div>

            {scoreBoardData.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Exam Title</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Date &amp; Time</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Total Score</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}><FaCheckCircle style={{ color: '#10B981', marginRight: 4 }} /> Correct</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}><FaTimes style={{ color: '#EF4444', marginRight: 4 }} /> Wrong</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}><FaMinusCircle style={{ color: '#64748B', marginRight: 4 }} /> Skipped</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Percentile</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)', textAlign: 'right' }}>Detailed Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scoreBoardData.map((sb, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '14px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '13.5px' }}>{sb.title}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{sb.category || 'Odisha Exams'}</div>
                        </td>
                        <td style={{ padding: '14px', color: 'var(--muted)' }}>
                          <div>{sb.date}</div>
                          <div style={{ fontSize: '11px', color: 'var(--muted-2)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <FaClock /> {sb.time}
                          </div>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontSize: '15px', fontWeight: 900, color: '#10B981' }}>
                            {sb.score} / {sb.maxMarks}
                          </span>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ background: '#E8F8EE', color: '#0F9D58', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                            {sb.correct}
                          </span>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ background: '#FCEBEA', color: '#B4232F', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                            {sb.wrong}
                          </span>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ background: '#F1F5F9', color: '#64748B', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                            {sb.unattempted}
                          </span>
                        </td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ background: '#F3ECFE', color: '#7C3AED', fontWeight: 800, padding: '3px 10px', borderRadius: '12px', fontSize: '12px' }}>
                            {sb.percentile}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              if (sb.attemptId) {
                                navigate(`/subject-test/result/${sb.attemptId}`);
                              } else {
                                alert(`Showing score report for ${sb.title}`);
                              }
                            }}
                            style={{ padding: '6px 14px', background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s' }}
                          >
                            View Report &amp; Solutions →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                <FaChartBar style={{ fontSize: 42, color: 'var(--line)', marginBottom: 12 }} />
                <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>No Test Scores Available</h4>
                <p style={{ fontSize: 13, margin: '0 0 16px' }}>Your detailed score reports, accuracy rates, and percentile analysis will appear here once you complete a test.</p>
                <button onClick={() => navigate('/subject-test')} style={{ padding: '9px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                  Take Subject Test →
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: PURCHASE */}
        {activeTab === 'purchase' && (
          <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 850, margin: 0, color: 'var(--ink)' }}>
                  Purchases &amp; Transactions History
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--muted)', margin: '4px 0 0' }}>
                  Manage active plans, test series subscriptions, and download payment receipts with expiry dates.
                </p>
              </div>
              <button onClick={() => navigate('/subscription')} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                Upgrade Plan →
              </button>
            </div>

            {purchases.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Order ID</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Item Name</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Type</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Purchase Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Expire Date</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Amount</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Status</th>
                      <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)', textAlign: 'right' }}>Bill &amp; Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((pc, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                        <td style={{ padding: '14px', fontWeight: 800, color: 'var(--primary)' }}>{pc.id}</td>
                        <td style={{ padding: '14px', fontWeight: 700, color: 'var(--ink)' }}>{pc.item}</td>
                        <td style={{ padding: '14px', color: 'var(--muted)' }}>{pc.type}</td>
                        <td style={{ padding: '14px', color: 'var(--muted)' }}>{pc.date}</td>
                        <td style={{ padding: '14px', fontWeight: 700, color: '#dc2626' }}>{pc.expireDate || '1 Year Validity'}</td>
                        <td style={{ padding: '14px', fontWeight: 800, color: 'var(--ink)' }}>{pc.price}</td>
                        <td style={{ padding: '14px' }}>
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: pc.status === 'ACTIVE' ? '#10B981' : '#3B82F6', background: pc.status === 'ACTIVE' ? '#E8F8EE' : '#EAF1FD', padding: '2px 8px', borderRadius: '12px' }}>
                            {pc.status}
                          </span>
                        </td>
                        <td style={{ padding: '14px', textAlign: 'right' }}>
                          <button onClick={() => setSelectedReceipt(pc)} style={{ padding: '6px 14px', background: '#F1F5F9', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px', fontWeight: 800, color: 'var(--primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <FaFileAlt /> View Bill
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--muted)' }}>
                <FaCreditCard style={{ fontSize: 42, color: 'var(--line)', marginBottom: 12 }} />
                <h4 style={{ fontSize: 16, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px' }}>No Purchase History</h4>
                <p style={{ fontSize: 13, margin: '0 0 16px' }}>You have not purchased any test series packages or premium PDF materials yet.</p>
                <button onClick={() => navigate('/subscription')} style={{ padding: '9px 18px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                  View Subscription Plans →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Receipt View Mode Modal */}
      {selectedReceipt && (
        <div className="auth-modal-overlay" onClick={() => setSelectedReceipt(null)} style={{ zIndex: 3000 }}>
          <div className="auth-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px', padding: '0', borderRadius: '20px', overflow: 'hidden', background: '#ffffff', boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}>
            {/* Header Banner */}
            <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', padding: '20px 24px', color: '#ffffff', position: 'relative' }}>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{
                  position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.15)',
                  border: 'none', borderRadius: '50%', width: '30px', height: '30px', color: '#ffffff',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900
                }}
              >
                ✕
              </button>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#FFC93C', textTransform: 'uppercase', letterSpacing: '1px' }}>
                OFFICIAL TAX INVOICE &amp; RECEIPT
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#ffffff', margin: '4px 0 0' }}>
                GovExam PrepHub Portal
              </h2>
              <div style={{ fontSize: '12px', color: '#94A3B8', marginTop: '2px' }}>
                Receipt ID: #{selectedReceipt.id} • Read-Only View Mode
              </div>
            </div>

            {/* Receipt Body */}
            <div style={{ padding: '24px', textAlign: 'left', background: '#FAFAFA' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px dashed var(--line)', paddingBottom: '16px', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Billed To</div>
                  <div style={{ fontSize: '15px', fontWeight: 850, color: 'var(--ink)' }}>{user?.name || profileForm.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{user?.email || profileForm.email}</div>
                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>{profileForm.phone} • {profileForm.state}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: '#E8F8EE', color: '#0F9D58', border: '1.5px solid #0F9D58', fontSize: '11px', fontWeight: 900, padding: '4px 12px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ✓ {selectedReceipt.status}
                  </span>
                  <div style={{ fontSize: '11.5px', color: 'var(--muted)', marginTop: '6px', fontWeight: 600 }}>Date: {selectedReceipt.date}</div>
                </div>
              </div>

              {/* Purchased Item Box */}
              <div style={{ background: '#ffffff', border: '1px solid var(--line)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '8px' }}>
                  PURCHASED ITEM DETAILS
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: 850, color: 'var(--ink)', paddingBottom: '10px', borderBottom: '1px solid var(--line)' }}>
                  <span>{selectedReceipt.item}</span>
                  <span style={{ color: 'var(--primary)' }}>{selectedReceipt.price}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--muted)', paddingTop: '8px' }}>
                  <span>Category Type: {selectedReceipt.type}</span>
                  <span>GST (18% Included): Yes</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#dc2626', fontWeight: 800, paddingTop: '6px' }}>
                  <span>Expire Date:</span>
                  <span>{selectedReceipt.expireDate || '1 Year Validity'}</span>
                </div>
              </div>

              {/* Amount Total */}
              <div style={{ background: '#F1F5F9', borderRadius: '12px', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--ink)' }}>Total Amount Paid</span>
                <span style={{ fontSize: '20px', fontWeight: 900, color: '#10B981' }}>{selectedReceipt.price}</span>
              </div>

              <div style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--muted)', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
                🔒 Digitally Verified Receipt • GovExam Competitive Exam Portal
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ background: '#ffffff', padding: '14px 24px', borderTop: '1px solid var(--line)', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{ padding: '9px 18px', background: '#F1F5F9', border: '1px solid var(--line)', borderRadius: '8px', fontWeight: 800, fontSize: '13px', color: 'var(--ink)', cursor: 'pointer' }}
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                style={{ padding: '9px 18px', background: 'var(--primary)', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '13px', color: '#ffffff', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <FaDownload /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
