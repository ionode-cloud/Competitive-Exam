import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../admin/context/AuthContext';
import api from '../admin/api/axios';
import {
  FaPhoneAlt,
  FaUniversity,
  FaTrain,
  FaLandmark,
  FaShieldAlt,
  FaChalkboardTeacher,
  FaCalculator,
  FaPuzzlePiece,
  FaBookOpen,
  FaGlobe,
  FaLaptopCode,
  FaFont,
  FaFlask,
  FaNewspaper,
  FaFileAlt,
  FaSearch,
  FaUser,
  FaTimes,
  FaCheckCircle,
  FaEye,
  FaEyeSlash,
  FaClipboardList,
  FaTrophy,
  FaChartBar,
  FaCreditCard,
  FaSignOutAlt,
  FaExclamationTriangle,
} from 'react-icons/fa';
import Logo from '../assets/image.png';

/* ─── Marquee Banner ─── */
const trendingItems = [
  'OSSSC RI Notification 2026',
  'OPSC OAS Prelims Result',
  'Odisha Police SI Recruitment',
  'OSSC CGL New Exam Pattern',
  'OSSSC ARI Notification 2026',
];
const allItems = [...trendingItems, ...trendingItems];

function MarqueeBanner() {
  return (
    <div className="marquee-banner">
      <div className="marquee-left">
        <div className="marquee-track-wrapper">
          <div className="marquee-track">
            {allItems.map((item, idx) => (
              <span className="marquee-item" key={idx}>
                <a href="#">{item}</a>
                <span className="marquee-sep">|</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="marquee-right">
        <a href="tel:+919876543210" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><FaPhoneAlt /> +91 98765 43210</a>
        <a href="https://sunilsiracademy.com/">sunilsiracademy.com</a>
      </div>
    </div>
  );
}

/* ─── Nav Tabs ─── */
const TABS = [
  { label: 'Home',          to: '/',              arrow: false },
  { 
    label: 'Exam Section',  
    to: '/exam-section',  
    arrow: true,
    categories: [
      { label: 'OSSSC',        to: '/exam-section?cat=OSSSC',        icon: <FaLandmark />,    desc: 'OSSSC RI, ARI, AMIN & PEO exam modules' },
      { label: 'OSSC',         to: '/exam-section?cat=OSSC',         icon: <FaTrain />,       desc: 'OSSC CGL, CTSA & Accountant prep packs' },
      { label: 'ODISHA POLICE',to: '/exam-section?cat=ODISHA POLICE',icon: <FaShieldAlt />,   desc: 'Odisha Police SI, Constable & Battalion prep' },
      { label: 'OPSC',         to: '/exam-section?cat=OPSC',         icon: <FaUniversity />,  desc: 'OPSC OAS, ASO & Civil Services prep' }
    ]
  },
  { 
    label: 'Moke Test',  
    to: '/mock-test',  
    arrow: true,
    categories: [
      { label: 'OSSSC',        to: '/mock-test?cat=OSSSC',        icon: <FaLandmark />,    desc: 'OSSSC RI, ARI, AMIN & PEO mock exams' },
      { label: 'OSSC',         to: '/mock-test?cat=OSSC',         icon: <FaTrain />,       desc: 'OSSC CGL, CTS & Accountant mock tests' },
      { label: 'ODISHA POLICE',to: '/mock-test?cat=ODISHA POLICE',icon: <FaShieldAlt />,   desc: 'Odisha Police SI & Constable mock tests' },
      { label: 'OPSC',         to: '/mock-test?cat=OPSC',         icon: <FaUniversity />,  desc: 'OPSC OAS & Civil Services mock exams' }
    ]
  },
  { 
    label: 'Subject Test Page', 
    to: '/subject-test', 
    arrow: true,
    categories: [
      { label: 'Mathematics',       icon: <FaCalculator />, desc: 'Quantitative aptitude & shortcuts' },
      { label: 'Reasoning',         icon: <FaPuzzlePiece />, desc: 'Logical, analytical & mental ability' },
      { label: 'English',           icon: <FaBookOpen />, desc: 'Grammar review & vocabulary builder' },
      { label: 'General Knowledge', icon: <FaGlobe />, desc: 'National, world history & current affairs' },
      { label: 'Computer',          icon: <FaLaptopCode />, desc: 'MS Office, networking & OS fundamentals' },
      { label: 'Odia Language',     icon: <FaFont />, desc: 'Odia grammar & syntax mock tests' }
    ]
  },
  { 
    label: 'PYQ Ebook',     
    to: '/pyq-ebook',     
    arrow: true,
    categories: []
  },
  { 
    label: 'Material Page', 
    to: '/materials',     
    arrow: true,
    categories: [
      { label: 'Current Affairs Capsule', icon: <FaNewspaper />, desc: 'Daily, monthly updates for 2026' },
      { label: 'Odisha GK Notes',          icon: <FaLandmark />, desc: 'History, geography & schemes of Odisha' },
      { label: 'Static GK Capsule',       icon: <FaGlobe />, desc: 'Awards, lists & sports summaries' },
      { label: 'Grammar Capsules',        icon: <FaFileAlt />, desc: 'Formulas & syntax shortcut PDFs' }
    ]
  },
  { label: 'Contact Us',    to: '/contact',       arrow: false },
  { label: 'Subscription',  to: '/subscription',  arrow: false, badge: 'NEW' },
];

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CAT_ICON_MAP = {
  'Current Affairs': <FaNewspaper />,
  'Odisha GK':       <FaLandmark />,
  'Static GK':       <FaGlobe />,
  'English':         <FaBookOpen />,
  'Computer':        <FaLaptopCode />,
  'Mathematics':     <FaCalculator />,
  'Reasoning':       <FaPuzzlePiece />,
};

const ICON_NAME_MAP = {
  computer:   <FaLaptopCode />,
  book:       <FaBookOpen />,
  font:       <FaFont />,
  calculator: <FaCalculator />,
  globe:      <FaGlobe />,
  flask:      <FaFlask />,
  puzzle:     <FaPuzzlePiece />,
  file:       <FaFileAlt />,
};

function MegaNav() {
  const location = useLocation();
  const [openTab, setOpenTab] = useState(null);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [dynamicMaterialCategories, setDynamicMaterialCategories] = useState(null);
  const [dynamicEbookCategories, setDynamicEbookCategories]       = useState(null);
  const [dynamicSubjectTestCategories, setDynamicSubjectTestCategories] = useState(null);
  const tabRefs = useRef([]);

  const fetchPyqEbookCategories = useCallback(() => {
    fetch(`${API_URL}/pyq-ebooks?publicOnly=true`)
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          const items = json.data.map(item => ({
            label: item.title,
            desc: item.description || `Previous year ${item.title} papers & solutions`,
            icon: ICON_NAME_MAP[item.icon] || CAT_ICON_MAP[item.title] || <FaBookOpen />,
            to: item.link || `/pyq-ebook?q=${encodeURIComponent(item.title)}`,
          }));
          setDynamicEbookCategories(items);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`${API_URL}/material-categories/public`)
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data?.length > 0) {
          const items = json.data.map(item => ({
            label: item.title || item.name,
            desc: item.description,
            icon: ICON_NAME_MAP[item.icon] || CAT_ICON_MAP[item.name] || <FaFileAlt />,
            to: item.link || `/materials?cat=${encodeURIComponent(item.name || item.title)}`,
          }));
          setDynamicMaterialCategories(items);
        }
      })
      .catch(() => {});

    // 1. Fetch PYQ Ebook categories directly from Admin Panel PYQ Categories
    fetchPyqEbookCategories();

    // 2. Fetch Subject Test Categories
    fetch(`${API_URL}/subject-tests/categories/public`)
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          const activeList = json.data.filter(item => item.isActive !== false && item.status !== 'inactive');
          const subjectTestItems = activeList.map((item) => ({
            label: item.name,
            desc: item.description || 'Subject practice & mock tests',
            icon: ICON_NAME_MAP[item.icon] || CAT_ICON_MAP[item.name] || <FaBookOpen />,
            to: `/subject-test?catId=${item._id}`,
          }));
          setDynamicSubjectTestCategories(subjectTestItems);
        }
      })
      .catch(() => {});

    // Real-time synchronization event listener & interval
    window.addEventListener('pyqCategoriesUpdated', fetchPyqEbookCategories);
    const interval = setInterval(fetchPyqEbookCategories, 4000);

    return () => {
      window.removeEventListener('pyqCategoriesUpdated', fetchPyqEbookCategories);
      clearInterval(interval);
    };
  }, [fetchPyqEbookCategories]);

  // Dynamic TABS with fetched Material Page & PYQ Ebook dropdown items
  const navTabs = TABS.map(tab => {
    if (tab.label === 'Material Page' && dynamicMaterialCategories) {
      return { ...tab, categories: dynamicMaterialCategories };
    }
    if (tab.label === 'PYQ Ebook' && dynamicEbookCategories) {
      return { ...tab, categories: dynamicEbookCategories };
    }
    if (tab.label === 'Subject Test Page' && dynamicSubjectTestCategories) {
      return { ...tab, categories: dynamicSubjectTestCategories };
    }
    return tab;
  });

  const handleClickOutside = useCallback((e) => {
    if (!e.target.closest('.nav-tab-container') && !e.target.closest('.mobile-dropdown-panel')) {
      setOpenTab(null);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => { setOpenTab(null); }, [location.pathname]);

  const ITEMS_PER_COL = 10;

  const toggleDropdown = (i, e) => {
    e.preventDefault();
    if (openTab === i) {
      setOpenTab(null);
      return;
    }
    const rect = tabRefs.current[i]?.getBoundingClientRect();
    if (rect) {
      const isMobile = window.innerWidth <= 768;
      const catCount = navTabs[i]?.categories?.length || 0;
      const colCount = Math.ceil(catCount / ITEMS_PER_COL);
      const colWidth = 260;
      const totalWidth = colCount * colWidth;
      const maxLeft = window.innerWidth - totalWidth - 8;
      const left = Math.min(Math.max(0, rect.left), maxLeft);
      setDropdownStyle(
        isMobile
          ? {
              position: 'fixed',
              top: rect.bottom + 4,
              left: 8,
              right: 8,
              width: 'auto',
              zIndex: 9999,
            }
          : {
              position: 'fixed',
              top: rect.bottom + 4,
              left,
              width: totalWidth,
              zIndex: 9999,
            }
      );
    }
    setOpenTab(i);
  };

  const currentOpenTab = openTab !== null ? navTabs[openTab] : null;

  return (
    <>
      <nav className="mega-nav">
        <div className="wrap">
          {navTabs.map((tab, i) => (
            <div key={i} className="nav-tab-container" ref={el => tabRefs.current[i] = el}>
              {tab.categories ? (
                <button
                  className={`nav-tab nav-tab-btn${location.pathname === tab.to ? ' active' : ''}${openTab === i ? ' tab-open' : ''}`}
                  onClick={(e) => toggleDropdown(i, e)}
                  aria-expanded={openTab === i}
                >
                  {tab.label}
                  <span className={`nav-arrow${openTab === i ? ' rotated' : ''}`}>▾</span>
                  {tab.badge && <span className="badge-new">{tab.badge}</span>}
                </button>
              ) : (
                <Link
                  to={tab.to}
                  className={`nav-tab${location.pathname === tab.to ? ' active' : ''}`}
                >
                  {tab.label}
                  {tab.badge && <span className="badge-new">{tab.badge}</span>}
                </Link>
              )}
            </div>
          ))}
        </div>
      </nav>

      {openTab !== null && currentOpenTab?.categories && (() => {
        const cats = currentOpenTab.categories;
        const COLS = Math.ceil(cats.length / ITEMS_PER_COL);
        const columns = Array.from({ length: COLS }, (_, ci) =>
          cats.slice(ci * ITEMS_PER_COL, ci * ITEMS_PER_COL + ITEMS_PER_COL)
        );
        return (
          <div
            className="mobile-dropdown-panel"
            style={{
              ...dropdownStyle,
              display: 'flex',
              flexDirection: 'row',
              gap: 0,
              padding: 0,
              overflow: 'hidden',
            }}
          >
            <div className="dropdown-arrow-tip" />
            {columns.map((col, ci) => (
              <div
                key={ci}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: '0 0 260px',
                  width: 260,
                  borderRight: ci < columns.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                  padding: '8px 0',
                }}
              >
                {col.map((cat, j) => (
                  <Link
                    key={j}
                    to={cat.to || currentOpenTab.to}
                    className="dropdown-item"
                    onClick={() => setOpenTab(null)}
                  >
                    <span style={{ fontSize: 18, flexShrink: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>{cat.icon}</span>
                    <div>
                      <div className="dropdown-item-title">{cat.label}</div>
                      <div className="dropdown-item-desc">{cat.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        );
      })()}
    </>
  );
}

export default function Header() {
  const { user: authUser, login: authLogin, logout: authLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ name: '', email: '', phone: '', password: '', terms: false });
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [showModalPwd, setShowModalPwd] = useState(false);


  // Sync auth user
  useEffect(() => {
    setUser(authUser);
  }, [authUser]);

  // Open login modal if URL has ?login=true or /login
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('login') === 'true') {
      setShowAuthModal(true);
      setAuthMode('login');
    }
  }, [location.search]);

  const handleLogout = async () => {
    await authLogout();
    setUser(null);
    setShowDropdown(false);
    navigate('/');
  };

  const handleAuthChange = e => {
    const { name, value, type, checked } = e.target;
    setAuthForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authMode === 'login') {
      if (!authForm.email || !authForm.password) {
        setAuthError('Please fill in all fields.');
        return;
      }
      try {
        const loggedUser = await authLogin(authForm.email, authForm.password);
        setAuthSuccess('Logged in successfully!');
        const adminRoles = ['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'];
        if (adminRoles.includes(loggedUser?.role)) {
          setShowAuthModal(false);
          setAuthSuccess('');
          setAuthForm({ name: '', email: '', phone: '', password: '', terms: false });
          const firstTab = (loggedUser?.role === 'sub_admin' && Array.isArray(loggedUser?.permissions) && loggedUser.permissions.length > 0)
            ? (loggedUser.permissions[0].startsWith('/admin') ? loggedUser.permissions[0] : `/admin/${loggedUser.permissions[0]}`)
            : '/admin/dashboard';
          navigate(firstTab, { replace: true });
          return;
        } else {
          setTimeout(() => {
            setShowAuthModal(false);
            setAuthSuccess('');
            setAuthForm({ name: '', email: '', phone: '', password: '', terms: false });
          }, 800);
        }
      } catch (err) {
        setAuthError(err.response?.data?.message || 'Invalid email or password.');
      }
    } else {
      if (!authForm.name || !authForm.email || !authForm.phone || !authForm.password) {
        setAuthError('Please fill in all fields.');
        return;
      }
      if (!authForm.terms) {
        setAuthError('You must agree to the Terms & Conditions.');
        return;
      }
      try {
        await api.post('/auth/register', {
          name: authForm.name,
          email: authForm.email,
          phone: authForm.phone,
          password: authForm.password
        });
        const loggedUser = await authLogin(authForm.email, authForm.password);
        setAuthSuccess('Account created successfully!');
        const adminRoles = ['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'];
        if (adminRoles.includes(loggedUser?.role)) {
          setTimeout(() => {
            setShowAuthModal(false);
            setAuthSuccess('');
            setAuthForm({ name: '', email: '', phone: '', password: '', terms: false });
            const firstTab = (loggedUser?.role === 'sub_admin' && Array.isArray(loggedUser?.permissions) && loggedUser.permissions.length > 0)
              ? (loggedUser.permissions[0].startsWith('/admin') ? loggedUser.permissions[0] : `/admin/${loggedUser.permissions[0]}`)
              : '/admin/dashboard';
            navigate(firstTab);
          }, 400);
        } else {
          setTimeout(() => {
            setShowAuthModal(false);
            setAuthSuccess('');
            setAuthForm({ name: '', email: '', phone: '', password: '', terms: false });
            navigate('/profile');
          }, 800);
        }
      } catch (err) {
        setAuthError(err.response?.data?.message || 'Registration failed.');
      }
    }
  };


  return (
    <>
      <MarqueeBanner />
      <header>
        <div className="top-row wrap">
          <Link to="/" className="brand">
            <span className="mark" style={{ display: 'flex', alignItems: 'center' }}><img style={{borderRadius:'10px'}} src={Logo} alt="Sunil Sir Academy" /></span>Sunil Sir Academy
          </Link>
          <div className="search-cluster">
            <span className="search-icon-prefix" style={{ display: 'flex', alignItems: 'center' }}><FaSearch /></span>
            <input className="search-input" type="text" placeholder="Search courses, tests, PDFs, current affairs..." />
            <button className="search-btn">Search</button>
          </div>
          <div className="sale-cluster" style={{ position: 'relative' }}>
            {user ? (
              <div style={{ position: 'relative' }}>
                <div className="user-chip" onClick={() => setShowDropdown(!showDropdown)} style={{ cursor: 'pointer' }}>
                  <span className="user-avatar">{(user.name || 'User').substring(0, 2).toUpperCase()}</span>
                  {user.name || 'User'} ▾
                </div>
                {showDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                    background: '#fff', border: '1px solid var(--line)', borderRadius: '12px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.12)', width: '210px', zIndex: 100, display: 'flex', flexDirection: 'column', overflow: 'hidden'
                  }}>
                    <div style={{ padding: '12px 14px', fontSize: '11px', color: 'var(--muted)', borderBottom: '1px solid var(--line)', wordBreak: 'break-all', textAlign: 'left' }}>
                      <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '12.5px' }}>{user.name || 'Student'}</div>
                      {user.email || 'user@prephub.in'}
                    </div>

                    {['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'].includes(user?.role) ? (
                      <Link
                        to={
                          (user?.role === 'sub_admin' && Array.isArray(user?.permissions) && user.permissions.length > 0)
                            ? (user.permissions[0].startsWith('/admin') ? user.permissions[0] : `/admin/${user.permissions[0]}`)
                            : '/admin/dashboard'
                        }
                        onClick={() => setShowDropdown(false)}
                        style={{
                          padding: '12px 14px', fontSize: '13px', color: '#2563eb', fontWeight: 800,
                          textDecoration: 'none', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8,
                          background: '#eff6ff', textAlign: 'left'
                        }}
                      >
                        <FaShieldAlt style={{ color: '#2563eb' }} /> {user.role === 'sub_admin' ? 'Sub Admin Panel' : 'Admin Dashboard'}
                      </Link>
                    ) : (
                      <>
                        <Link to="/profile?tab=profile" onClick={() => setShowDropdown(false)} style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--ink)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <FaUser style={{ color: 'var(--primary)' }} /> My Profile
                        </Link>
                        <Link to="/profile?tab=exams" onClick={() => setShowDropdown(false)} style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--ink)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <FaClipboardList style={{ color: '#3B82F6' }} /> Exam Attend
                        </Link>
                        <Link to="/profile?tab=rank" onClick={() => setShowDropdown(false)} style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--ink)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <FaTrophy style={{ color: '#F59E0B' }} /> Rank
                        </Link>
                        <Link to="/profile?tab=scoreboard" onClick={() => setShowDropdown(false)} style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--ink)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <FaChartBar style={{ color: '#10B981' }} /> Score Board
                        </Link>
                        <Link to="/profile?tab=purchase" onClick={() => setShowDropdown(false)} style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--ink)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, textAlign: 'left', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                          <FaCreditCard style={{ color: '#7C3AED' }} /> Purchases &amp; Orders
                        </Link>
                      </>
                    )}

                    <button onClick={handleLogout} style={{
                      padding: '10px 14px', background: 'none', border: 'none', borderTop: '1px solid var(--line)', textAlign: 'left',
                      fontSize: '13px', color: '#EF4444', fontWeight: 700, cursor: 'pointer',
                      transition: 'background .15s', display: 'flex', alignItems: 'center', gap: 8
                    }}
                    onMouseEnter={e => e.target.style.background = '#FCEBEA'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}
                    >
                      <FaSignOutAlt style={{ color: '#EF4444' }} /> Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="user-chip" onClick={() => { setShowAuthModal(true); setAuthMode('login'); }} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="user-avatar" style={{ background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaUser fontSize={12} /></span> Login / Register
              </div>
            )}
          </div>
        </div>
        <MegaNav />
      </header>



      {showAuthModal && (
        <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-card" onClick={e => e.stopPropagation()}>
            <button className="auth-modal-close" onClick={() => setShowAuthModal(false)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaTimes /></button>
            
            <div style={{ display: 'flex', borderBottom: '2px solid #e2e8f0', marginBottom: '24px', paddingBottom: '2px' }}>
              <button 
                onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} 
                style={{ 
                  flex: 1, padding: '10px', background: 'none', border: 'none', 
                  fontSize: '16px', fontWeight: 800, color: authMode === 'login' ? 'var(--primary)' : 'var(--muted)',
                  borderBottom: authMode === 'login' ? '3px solid var(--primary)' : '3px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Login
              </button>
              <button 
                onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }} 
                style={{ 
                  flex: 1, padding: '10px', background: 'none', border: 'none', 
                  fontSize: '16px', fontWeight: 800, color: authMode === 'register' ? 'var(--primary)' : 'var(--muted)',
                  borderBottom: authMode === 'register' ? '3px solid var(--primary)' : '3px solid transparent',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                Register
              </button>
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 850, letterSpacing: '-0.5px', marginBottom: '6px', color: 'var(--ink)', textAlign: 'left' }}>
              {authMode === 'login' ? 'Welcome Back!' : 'Create Premium Account'}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '20px', textAlign: 'left' }}>
              {authMode === 'login' ? 'Log in to access your mock tests and study materials.' : 'Sign up to begin your learning journey.'}
            </p>

            {authError && (
              <div style={{ background: '#FCEBEA', border: '1px solid #B4232F', color: '#B4232F', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 700, marginBottom: '16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaExclamationTriangle /> {authError}
              </div>
            )}

            {authSuccess && (
              <div style={{ background: '#E8F8EE', border: '1px solid #0F9D58', color: '#0F9D58', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 700, marginBottom: '16px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 6 }}>
                <FaCheckCircle /> {authSuccess}
              </div>
            )}

            <form onSubmit={handleAuthSubmit}>
              {authMode === 'register' && (
                <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Full Name *</label>
                  <input 
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--line)',
                      background: '#f8fafc', fontSize: '13px', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box', marginTop: '4px'
                    }} 
                    name="name" type="text" value={authForm.name} onChange={handleAuthChange} placeholder="Enter your name" required 
                  />
                </div>
              )}

              <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Email Address *</label>
                <input 
                  style={{
                    width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--line)',
                    background: '#f8fafc', fontSize: '13px', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box', marginTop: '4px'
                  }} 
                  name="email" type="email" value={authForm.email} onChange={handleAuthChange} placeholder="name@email.com" required 
                />
              </div>

              {authMode === 'register' && (
                <div style={{ marginBottom: '12px', textAlign: 'left' }}>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Phone Number *</label>
                  <input 
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid var(--line)',
                      background: '#f8fafc', fontSize: '13px', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box', marginTop: '4px'
                    }} 
                    name="phone" type="tel" value={authForm.phone} onChange={handleAuthChange} placeholder="+91 XXXXX XXXXX" required 
                  />
                </div>
              )}

              <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)' }}>Password *</label>
                <div style={{ position: 'relative', marginTop: '4px' }}>
                  <input 
                    style={{
                      width: '100%', padding: '10px 38px 10px 12px', borderRadius: '8px', border: '1.5px solid var(--line)',
                      background: '#f8fafc', fontSize: '13px', color: 'var(--ink)', outline: 'none', boxSizing: 'border-box'
                    }} 
                    name="password" type={showModalPwd ? 'text' : 'password'} value={authForm.password} onChange={handleAuthChange} placeholder="••••••••" required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPwd(!showModalPwd)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer',
                      fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}
                    title={showModalPwd ? 'Hide password' : 'See password'}
                  >
                    {showModalPwd ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {authMode === 'login' ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', fontSize: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)', cursor: 'pointer' }}>
                    <input type="checkbox" style={{ cursor: 'pointer' }} /> Remember me
                  </label>
                  <a href="#" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>Forgot?</a>
                </div>
              ) : (
                <div style={{ marginBottom: '20px', fontSize: '12px', textAlign: 'left' }}>
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'var(--muted)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" name="terms" checked={authForm.terms} onChange={handleAuthChange} 
                      style={{ marginTop: '2px', cursor: 'pointer' }} required 
                    />
                    <span>I agree to the Terms & Privacy Policy.</span>
                  </label>
                </div>
              )}

              <button 
                type="submit" 
                style={{
                  width: '100%', padding: '12px', background: 'linear-gradient(135deg, #FFC93C 0%, #F59E0B 100%)',
                  color: '#0F172A', border: 'none', borderRadius: '8px', fontWeight: '800', fontSize: '14.5px', cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.4)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
                }}
              >
                {authMode === 'login' ? 'Login to Portal' : 'Register Account'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12.5px', color: 'var(--muted)' }}>
              {authMode === 'login' ? (
                <span>
                  Don't have an account?{' '}
                  <button 
                    onClick={() => { setAuthMode('register'); setAuthError(''); setAuthSuccess(''); }} 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                  >
                    Register Now
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button 
                    onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} 
                    style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', padding: 0 }}
                  >
                    Login here
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
