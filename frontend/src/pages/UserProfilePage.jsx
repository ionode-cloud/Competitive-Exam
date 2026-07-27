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

  // Sync tab with URL search param
  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'profile');
  }, [searchParams]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // Student profile form data initialized with registered user object
  const [profileForm, setProfileForm] = useState({
    name: user?.name || 'Student User',
    email: user?.email || 'student@prephub.in',
    phone: user?.phone || '+91 98765 43210',
    targetExam: user?.targetExam || 'OSSSC RI & OPSC OAS 2026',
    state: 'Odisha',
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

  const attendedExams = [
    { id: 'EXT-101', name: 'OSSSC RI Full Length Mock Test 1', category: 'State PSC / SSSC', date: '22 Jul 2026', marks: '88 / 100', accuracy: '92%', timeSpent: '104 mins', rank: '#12', status: 'Completed' },
    { id: 'EXT-102', name: 'OPSC OAS Prelims Paper-I (GS)', category: 'State PSC / SSSC', date: '18 Jul 2026', marks: '76 / 100', accuracy: '84%', timeSpent: '118 mins', rank: '#28', status: 'Completed' },
    { id: 'EXT-103', name: 'SSC CGL Tier-1 Complete Mock', category: 'SSC & Railway', date: '12 Jul 2026', marks: '82 / 100', accuracy: '89%', timeSpent: '54 mins', rank: '#15', status: 'Completed' },
    { id: 'EXT-104', name: 'IBPS PO Prelims Complete Mock', category: 'Bank & Insurance', date: '05 Jul 2026', marks: '68 / 100', accuracy: '78%', timeSpent: '58 mins', rank: '#42', status: 'Completed' },
    { id: 'EXT-105', name: 'Odisha Police SI GS Sectional', category: 'Police & Defence', date: '28 Jun 2026', marks: '44 / 50', accuracy: '95%', timeSpent: '38 mins', rank: '#08', status: 'Completed' },
  ];

  const scoreBoardData = [
    { title: 'OSSSC RI Full Length Mock Test 1', category: 'State PSC / SSSC', date: '22 Jul 2026', time: '104 mins', score: 88, maxMarks: 100, correct: 88, wrong: 8, unattempted: 4, percentile: '98.5%' },
    { title: 'OPSC OAS Prelims Paper-I (GS)', category: 'State PSC / SSSC', date: '18 Jul 2026', time: '118 mins', score: 76, maxMarks: 100, correct: 76, wrong: 16, unattempted: 8, percentile: '94.2%' },
    { title: 'SSC CGL Tier-1 Complete Mock', category: 'SSC & Railway', date: '12 Jul 2026', time: '54 mins', score: 82, maxMarks: 100, correct: 82, wrong: 12, unattempted: 6, percentile: '96.8%' },
    { title: 'IBPS PO Prelims Complete Mock', category: 'Bank & Insurance', date: '05 Jul 2026', time: '58 mins', score: 68, maxMarks: 100, correct: 68, wrong: 20, unattempted: 12, percentile: '89.4%' },
    { title: 'Odisha Police SI GS Sectional', category: 'Police & Defence', date: '28 Jun 2026', time: '38 mins', score: 44, maxMarks: 50, correct: 44, wrong: 4, unattempted: 2, percentile: '95.0%' },
  ];

  const purchases = [
    { id: 'ORD-9821', item: 'Pro Package (1 Year Access)', type: 'Subscription', price: '₹749', date: '15 Jul 2026', status: 'ACTIVE' },
    { id: 'ORD-8412', item: 'OSSSC RI Special Test Series', type: 'Mock Series', price: '₹299', date: '02 Jun 2026', status: 'COMPLETED' },
    { id: 'ORD-7201', item: 'Computer Knowledge PYQ E-Book', type: 'E-Book', price: '₹199', date: '10 May 2026', status: 'COMPLETED' },
  ];

  const leaderboardTop = [
    { rank: 1, name: 'Priyanka Das', score: 98, exam: 'OSSSC RI Mock 1', avatar: 'PD', badge: '🥇 Rank 1' },
    { rank: 2, name: 'Subham Mohanty', score: 96, exam: 'OSSSC RI Mock 1', avatar: 'SM', badge: '🥈 Rank 2' },
    { rank: 3, name: 'Ayush Kumar Jena', score: 94, exam: 'OSSSC RI Mock 1', avatar: 'AJ', badge: '🥉 Rank 3' },
    { rank: 12, name: user?.name || 'You', score: 88, exam: 'OSSSC RI Mock 1', avatar: 'YOU', badge: '⭐ Your Rank' },
  ];

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
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255, 201, 60, 0.15)', color: '#FFC93C', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                <FaCrown /> Premium Student Member
              </div>
              <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#ffffff', margin: '6px 0 2px' }}>
                {user?.name || 'Student User'}
              </h1>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0 }}>
                {user?.email || 'student@prephub.in'} • Target: {profileForm.targetExam}
              </p>
            </div>
            <div style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              border: '1.5px solid #F59E0B', borderRadius: '14px', padding: '12px 18px',
              textAlign: 'left', boxShadow: '0 4px 16px rgba(245, 158, 11, 0.2)'
            }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <FaStar style={{ color: '#F59E0B' }} /> Active Subscription
              </div>
              <div style={{ fontSize: '15px', fontWeight: 900, color: '#78350F', marginTop: '3px' }}>
                Pro Package — Unlimited Access
              </div>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#92400E', marginTop: '3px' }}>
                Valid until: 15 July 2027 (357 days remaining)
              </div>
            </div>
          </div>

          {/* Quick Stat Counter Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginTop: '24px' }}>
            {[
              { label: 'Exams Attended', val: '5 Tests', icon: <FaClipboardList />, color: '#3B82F6' },
              { label: 'Overall Rank', val: '#14 / 1,250', icon: <FaTrophy />, color: '#F59E0B' },
              { label: 'Avg Score Rate', val: '84.6%', icon: <FaChartBar />, color: '#10B981' },
              { label: 'Active Plan', val: 'Pro Package', icon: <FaCreditCard />, color: '#7C3AED' },
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
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--line)', background: '#F8FAFC', fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    readOnly
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--line)', background: '#F1F5F9', fontSize: '13.5px', fontWeight: 600, color: 'var(--muted)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--line)', background: '#F8FAFC', fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Target Exam</label>
                  <input
                    type="text"
                    value={profileForm.targetExam}
                    onChange={e => setProfileForm({ ...profileForm, targetExam: e.target.value })}
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
                        <button onClick={() => handleTabChange('scoreboard')} style={{ padding: '5px 12px', background: '#F1F5F9', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px', fontWeight: 700, color: 'var(--primary)', cursor: 'pointer' }}>
                          View Results
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MY RANK */}
        {activeTab === 'rank' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#F59E0B', fontSize: '13px', fontWeight: 800, textTransform: 'uppercase' }}>
                <FaTrophy /> Student Leaderboard &amp; Ranking
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 850, margin: '6px 0 4px', color: 'var(--ink)' }}>
                Your Rank: #14 (Top 2%)
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '0 0 20px' }}>
                Based on overall accuracy, test completion rate, and speed across all OSSSC &amp; OPSC mock tests.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {leaderboardTop.map((lb, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 16px', borderRadius: '12px',
                    background: lb.rank === 12 ? '#FEF3C7' : '#F8FAFC',
                    border: lb.rank === 12 ? '1.5px solid #F59E0B' : '1px solid var(--line)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: lb.rank === 12 ? '#F59E0B' : '#0F172A', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800
                      }}>
                        {lb.avatar}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--ink)' }}>{lb.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>{lb.badge} • {lb.exam}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#10B981' }}>
                      {lb.score} / 100
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--line)', borderRadius: '16px', padding: '24px', textAlign: 'left' }}>
                <h4 style={{ fontSize: '16px', fontWeight: 850, margin: '0 0 12px', color: 'var(--ink)' }}>
                  Category-Wise Performance Rank
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { cat: 'State PSC / SSSC (Odisha)', rank: '#4', pct: '98.8%' },
                    { cat: 'SSC & Railway', rank: '#15', pct: '95.2%' },
                    { cat: 'Bank & Insurance', rank: '#42', pct: '89.4%' },
                    { cat: 'Police & Defence', rank: '#8', pct: '96.5%' },
                  ].map((r, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid var(--line)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--ink)' }}>{r.cat}</span>
                      <span style={{ fontSize: '13px', fontWeight: 900, color: 'var(--primary)' }}>{r.rank} ({r.pct})</span>
                    </div>
                  ))}
                </div>
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
                        <button onClick={() => alert(`Showing full answer key & solutions for ${sb.title}`)} style={{ padding: '6px 14px', background: 'var(--primary)', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '12px', fontWeight: 800, cursor: 'pointer', transition: 'all 0.15s' }}>
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  Manage active plans, test series subscriptions, and download payment receipts.
                </p>
              </div>
              <button onClick={() => navigate('/subscription')} style={{ padding: '8px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                Upgrade Plan →
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid var(--line)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Order ID</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Item Name</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Type</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Date</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Amount</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)' }}>Status</th>
                    <th style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--muted)', textAlign: 'right' }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.map((pc, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--line)' }}>
                      <td style={{ padding: '14px', fontWeight: 800, color: 'var(--primary)' }}>{pc.id}</td>
                      <td style={{ padding: '14px', fontWeight: 700, color: 'var(--ink)' }}>{pc.item}</td>
                      <td style={{ padding: '14px', color: 'var(--muted)' }}>{pc.type}</td>
                      <td style={{ padding: '14px', color: 'var(--muted)' }}>{pc.date}</td>
                      <td style={{ padding: '14px', fontWeight: 800, color: 'var(--ink)' }}>{pc.price}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 800, color: pc.status === 'ACTIVE' ? '#10B981' : '#3B82F6', background: pc.status === 'ACTIVE' ? '#E8F8EE' : '#EAF1FD', padding: '2px 8px', borderRadius: '12px' }}>
                          {pc.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <button onClick={() => setSelectedReceipt(pc)} style={{ padding: '6px 14px', background: '#F1F5F9', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '12px', fontWeight: 800, color: 'var(--primary)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FaFileAlt /> View Receipt
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
