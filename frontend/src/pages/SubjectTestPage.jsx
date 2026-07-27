// SubjectTestPage.jsx — Subject-wise tests (2-level: Topics → Tests) with real-time API integration
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  FaCalculator,
  FaPuzzlePiece,
  FaBookOpen,
  FaGlobe,
  FaLaptopCode,
  FaFont,
  FaFileAlt,
  FaClock,
  FaArrowLeft,
  FaChevronRight,
  FaLock,
  FaUnlock
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5303/api';

const diffColors = { Easy: '#0F9D58', Medium: '#EA7A1E', Hard: '#B4232F' };

const getIconComponent = (iconStr) => {
  if (iconStr === 'calculator') return <FaCalculator />;
  if (iconStr === 'puzzle') return <FaPuzzlePiece />;
  if (iconStr === 'book') return <FaBookOpen />;
  if (iconStr === 'globe') return <FaGlobe />;
  if (iconStr === 'laptop') return <FaLaptopCode />;
  if (iconStr === 'font') return <FaFont />;
  return <FaBookOpen />;
};

export default function SubjectTestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Live Subjects & Tests Tree State
  const [subjectList, setSubjectList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Banner Settings State (fetched from API)
  const [bannerConfig, setBannerConfig] = useState({
    bannerEyebrow: '',
    bannerHeading: '',
    bannerSubtitle: '',
    bannerStats: [],
  });

  // Unlocked Tests State (stored in localStorage)
  const [unlockedIds, setUnlockedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('unlockedSubjectTestIds');
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [processingId, setProcessingId] = useState(null);

  const handleRazorpayCheckout = async (test) => {
    const amount = test.price || 49;
    setProcessingId(test._id);

    try {
      // 1. Create Razorpay Order via backend API
      const res = await fetch(`${API_URL}/payments/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          itemName: `Subject Test: ${test.title}`,
        }),
      }).then(r => r.json());

      if (!res.success) {
        alert(res.message || 'Failed to initialize Razorpay payment');
        setProcessingId(null);
        return;
      }

      // 2. Load Razorpay Checkout SDK if not loaded
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      // 3. Open official Razorpay Payment Modal
      const options = {
        key: res.keyId || 'rzp_test_placeholder',
        amount: res.amount,
        currency: res.currency || 'INR',
        name: 'Competitive Exam Platform',
        description: `Unlock Test: ${test.title}`,
        order_id: res.orderId,
        handler: async function (response) {
          try {
            await fetch(`${API_URL}/payments/razorpay/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount,
                isMock: res.isMock,
              }),
            });
          } catch { /* proceed */ }

          // Mark test as unlocked
          const updated = [...unlockedIds, test._id];
          setUnlockedIds(updated);
          localStorage.setItem('unlockedSubjectTestIds', JSON.stringify(updated));
          alert(`🎉 Payment Successful! Test "${test.title}" is now unlocked. Click "Attempt Now →" to start your test.`);
          setProcessingId(null);
        },
        modal: {
          ondismiss: function () {
            setProcessingId(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Razorpay Checkout failed to launch: ' + (err.message || 'Unknown error'));
      setProcessingId(null);
    }
  };

  useEffect(() => {
    // Fetch real-time banner config
    fetch(`${API_URL}/subject-tests/config`)
      .then(r => r.json())
      .then(j => {
        if (j.success && j.data) {
          setBannerConfig(j.data);
        }
      })
      .catch(() => {});

    // Fetch both subject test categories and public tree to build complete live subjects & topics view
    Promise.all([
      fetch(`${API_URL}/subject-tests/categories/public`).then(r => r.json()).catch(() => null),
      fetch(`${API_URL}/subject-tests/public/tree`).then(r => r.json()).catch(() => null)
    ]).then(([resSubjs, resTree]) => {
      const adminSubjs = resSubjs?.success && Array.isArray(resSubjs.data) ? resSubjs.data : [];
      const treeSubjs  = resTree?.success && Array.isArray(resTree.data) ? resTree.data : [];

      const subjectMap = new Map();

      adminSubjs.forEach(sub => {
        const topicsList = (sub.topics || []).map(tName => ({
          _id: tName,
          name: typeof tName === 'string' ? tName : tName.name || 'Topic',
          tests: []
        }));

        subjectMap.set(sub.name, {
          _id: sub._id,
          name: sub.name,
          color: sub.color || '#1957D6',
          bg: (sub.color || '#1957D6') + '18',
          icon: getIconComponent(sub.icon),
          desc: sub.description || 'Subject practice & mock tests',
          topics: topicsList
        });
      });

      treeSubjs.forEach(treeSub => {
        let existing = subjectMap.get(treeSub.name);
        if (!existing) {
          existing = {
            _id: treeSub._id,
            name: treeSub.name,
            color: treeSub.color || '#1957D6',
            bg: treeSub.bg || '#EAF1FD',
            icon: getIconComponent(treeSub.icon),
            desc: treeSub.desc || treeSub.description || 'Subject practice tests',
            topics: []
          };
          subjectMap.set(treeSub.name, existing);
        }

        const topicMap = new Map();
        existing.topics.forEach(t => topicMap.set(t.name, t));

        (treeSub.topics || []).forEach(t => {
          if (topicMap.has(t.name)) {
            const current = topicMap.get(t.name);
            current._id = t._id || current._id;
            current.tests = t.tests || [];
          } else {
            const newTopic = {
              _id: t._id,
              name: t.name,
              tests: t.tests || []
            };
            topicMap.set(t.name, newTopic);
            existing.topics.push(newTopic);
          }
        });
      });

      const result = Array.from(subjectMap.values());
      setSubjectList(result);
    })
    .catch(() => {})
    .finally(() => setLoading(false));
  }, []);

  const rawSub = parseInt(searchParams.get('sub') ?? '', 10);
  const urlSub = isNaN(rawSub) ? 0 : Math.min(Math.max(rawSub, 0), Math.max(0, subjectList.length - 1));

  const [activeSubject, setActiveSubject] = useState(urlSub);
  const [activeTopic, setActiveTopic] = useState(null);

  // Re-sync whenever the ?sub= param value changes
  useEffect(() => {
    setActiveSubject(urlSub);
    setActiveTopic(null);
  }, [urlSub]);

  const sub = subjectList[activeSubject] || subjectList[0];
  const topic = activeTopic !== null && sub?.topics ? sub.topics[activeTopic] : null;

  const handleSubjectChange = (i) => {
    setActiveSubject(i);
    setActiveTopic(null);
  };

  return (
    <div style={{ minHeight: '80vh', background: 'var(--bg)' }}>
      {/* Dynamic Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, rgb(15, 23, 42), rgba(234, 122, 30, 0.133))', padding: '22px 0 18px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="eyebrow" style={{ color: '#FDE68A' }}>
                {bannerConfig.bannerEyebrow || 'Subject Test'}
              </div>
              <h1 style={{ fontFamily: 'var(--disp)', fontSize: 'clamp(20px,2.8vw,30px)', color: '#fff', margin: '6px 0 8px' }}>
                {bannerConfig.bannerHeading || 'Subject-Wise Practice Tests'}
              </h1>
              <p style={{ color: '#94A3B8', fontSize: 13.5, maxWidth: '52ch', lineHeight: 1.6, margin: 0 }}>
                {bannerConfig.bannerSubtitle}
              </p>
            </div>

            {/* Dynamic Stats Badges */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 6 }}>
              {(bannerConfig.bannerStats || []).map((s, i) => (
                <div key={i} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px', minWidth: 72 }}>
                  <div style={{ fontFamily: 'var(--disp)', fontSize: 20, fontWeight: 900, color: '#FFC93C', lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontSize: 10.5, color: '#CBD5E1', marginTop: 4, letterSpacing: 0.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 48 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', fontSize: 14 }}>
            Loading live subject tests...
          </div>
        ) : !sub ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--muted)', fontSize: 14 }}>
            No subject categories found. Create subject categories in the admin panel.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Sidebar — Subjects */}
            <div className="responsive-sidebar">
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1.5, marginBottom: 10 }}>SUBJECTS</div>
              {subjectList.map((s, i) => (
                <button key={i} onClick={() => handleSubjectChange(i)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '11px 14px', borderRadius: 10, border: 'none',
                  background: activeSubject === i ? s.bg : 'transparent',
                  color: activeSubject === i ? s.color : 'var(--text)',
                  fontWeight: activeSubject === i ? 800 : 500,
                  fontSize: 13.5, cursor: 'pointer', marginBottom: 4,
                  textAlign: 'left', transition: 'all .15s',
                  borderLeft: activeSubject === i ? `3px solid ${s.color}` : '3px solid transparent',
                }}>
                  <span style={{ fontSize: 16, display: 'flex', alignItems: 'center' }}>{s.icon}</span>
                  {s.name}
                </button>
              ))}
            </div>

            {/* Main Panel */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Subject Header */}
              <div className="subject-header-responsive" style={{
                background: sub.bg, border: `1.5px solid ${sub.color}33`,
                borderRadius: 14, marginBottom: 16,
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 12,
                  background: '#fff', color: sub.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0
                }}>{sub.icon}</div>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 3px', fontSize: 17, fontWeight: 800, color: sub.color }}>{sub.name}</h2>
                  <p style={{ margin: 0, fontSize: 12.5, color: sub.color, opacity: .75 }}>
                    {topic ? `${topic.name}` : sub.desc}
                  </p>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: sub.color }}>{topic ? topic.tests.length : (sub.topics?.length || 0)}</div>
                  <div style={{ fontSize: 11, color: sub.color, opacity: .7 }}>{topic ? 'Tests' : 'Topics'}</div>
                </div>
              </div>

              {/* Breadcrumb / Back button */}
              {topic && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
                  <button onClick={() => setActiveTopic(null)} style={{
                    background: sub.bg, border: `1px solid ${sub.color}44`,
                    borderRadius: 8, cursor: 'pointer',
                    color: sub.color, fontWeight: 700, fontSize: 13, padding: '5px 12px',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <FaArrowLeft fontSize={11} /> Back to Topics
                  </button>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>›</span>
                  <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13 }}>{topic.name}</span>
                </div>
              )}

              {/* Topics Grid */}
              {!topic && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 9 }}>
                  {(sub.topics || []).map((t, j) => (
                    <button key={j} onClick={() => setActiveTopic(j)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '13px 15px', borderRadius: 10,
                      background: 'var(--card)', border: '1px solid var(--line)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                      gap: 8, width: '100%',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = sub.color + '66'; e.currentTarget.style.boxShadow = `0 2px 10px ${sub.color}18`; e.currentTarget.style.background = sub.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.background = 'var(--card)'; }}
                    >
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', flex: 1, lineHeight: 1.3 }}>{t.name}</span>
                      <span style={{ color: sub.color, fontWeight: 900, fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center' }}><FaChevronRight /></span>
                    </button>
                  ))}
                </div>
              )}

              {/* Tests List */}
              {topic && (
                <div style={{ display: 'grid', gap: 14 }}>
                  {topic.tests.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--muted)', fontSize: 13 }}>
                      No published tests in this topic yet.
                    </div>
                  ) : (
                    topic.tests.map((test, j) => {
                      const isUnlocked = test.free || unlockedIds.includes(test._id);
                      const priceVal   = test.price || 49;

                      return (
                        <div key={j} className="responsive-test-card" style={{ borderLeft: `4px solid ${sub.color}` }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              {test.free ? (
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#0F9D58', background: '#E8F8EE', padding: '2px 8px', borderRadius: 20 }}>FREE</span>
                              ) : isUnlocked ? (
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#0F9D58', background: '#E8F8EE', padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <FaUnlock fontSize={10} /> UNLOCKED
                                </span>
                              ) : (
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#EA7A1E', background: '#FEF1E4', padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <FaLock fontSize={10} /> ₹{priceVal}
                                </span>
                              )}
                              <span style={{ fontSize: 10, fontWeight: 700, color: diffColors[test.diff] || '#0F9D58', background: (diffColors[test.diff] || '#0F9D58') + '18', padding: '2px 8px', borderRadius: 20 }}>{test.diff}</span>
                            </div>
                            <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{test.title}</h3>
                            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaFileAlt /> {test.qs} Questions</span>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaClock /> {test.mins} Minutes</span>
                            </div>
                          </div>

                          {isUnlocked ? (
                            <button onClick={() => navigate(`/subject-test/instructions/${test._id}`)} style={{
                              display: 'inline-block', fontSize: 13, fontWeight: 700,
                              color: '#fff', background: sub.color, border: 'none',
                              padding: '9px 20px', borderRadius: 9, cursor: 'pointer',
                              whiteSpace: 'nowrap', flexShrink: 0
                            }}>
                              {test.free ? 'Start Free →' : 'Attempt Now →'}
                            </button>
                          ) : (
                            <button
                              disabled={processingId === test._id}
                              onClick={() => handleRazorpayCheckout(test)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800,
                                color: '#fff', background: 'linear-gradient(135deg, #1957D6, #7C3AED)', border: 'none',
                                padding: '9px 20px', borderRadius: 9, cursor: 'pointer',
                                whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                              }}
                            >
                              <FaLock fontSize={12} /> {processingId === test._id ? 'Processing...' : `Unlock Now ₹${priceVal}`}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
