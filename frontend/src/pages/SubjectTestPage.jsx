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

  // Purchased Categories & Modal State
  const [purchasedCatIds, setPurchasedCatIds] = useState([]);
  const [processingId, setProcessingId] = useState(null);
  const [paymentModalCat, setPaymentModalCat] = useState(null);

  const handleCategoryCheckout = async (category) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to purchase category access');
      navigate('/login');
      return;
    }
    const catId = category._id;
    const amount = category.categoryPrice || 500;
    setProcessingId(catId);

    try {
      const res = await fetch(`${API_URL}/payments/razorpay/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          itemName: `Subject Category Access: ${category.name}`,
        }),
      }).then(r => r.json());

      if (!res.success) {
        alert(res.message || 'Failed to initialize payment');
        setProcessingId(null);
        return;
      }

      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const options = {
        key: res.keyId || 'rzp_test_placeholder',
        amount: res.amount,
        currency: res.currency || 'INR',
        name: 'Competitive Exam Platform',
        description: `Category Access: ${category.name}`,
        order_id: res.orderId,
        handler: async function (response) {
          try {
            await fetch(`${API_URL}/subject-tests/subjects/${catId}/purchase`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                paymentId: response.razorpay_payment_id || 'manual',
                orderId: response.razorpay_order_id,
                amount,
              }),
            });
          } catch { /* proceed */ }

          setPurchasedCatIds(prev => [...prev, String(catId)]);
          alert(`🎉 Payment Successful! All Subject Tests under "${category.name}" are now unlocked!`);
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

    // Fetch user purchased categories
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/subject-tests/purchases/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(j => {
          if (j.success && Array.isArray(j.data)) {
            setPurchasedCatIds(j.data);
          }
        })
        .catch(() => {});
    }

    // Fetch live categories & tests tree directly from backend
    fetch(`${API_URL}/subject-tests/public/tree`)
      .then(r => r.json())
      .then(resTree => {
        if (resTree?.success && Array.isArray(resTree.data)) {
          const formatted = resTree.data.map(cat => ({
            _id: cat._id,
            name: cat.name,
            color: cat.color || '#1957D6',
            bg: cat.bg || (cat.color ? cat.color + '18' : '#EAF1FD'),
            icon: getIconComponent(cat.icon),
            desc: cat.desc || cat.description || 'Subject practice & mock tests',
            categoryPrice: cat.categoryPrice || 0,
            firstFreeTestId: cat.firstFreeTestId,
            topics: (cat.topics || []).map(t => ({
              _id: t._id || t.name,
              name: typeof t.name === 'string' ? t.name : 'Topic',
              tests: t.tests || []
            }))
          }));
          setSubjectList(formatted);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const [activeSubject, setActiveSubject] = useState(0);
  const [activeTopic, setActiveTopic] = useState(null);

  const rawSubParam = searchParams.get('sub') ?? searchParams.get('cat') ?? searchParams.get('catId') ?? searchParams.get('subject') ?? '';

  // Re-sync active subject index whenever URL param or subjectList changes
  useEffect(() => {
    if (!subjectList.length) return;

    if (rawSubParam) {
      // 1. Try matching by category _id
      const idIdx = subjectList.findIndex(s => String(s._id) === rawSubParam);
      if (idIdx !== -1) {
        setActiveSubject(idIdx);
        setActiveTopic(null);
        return;
      }

      // 2. Try matching by category name substring
      const qStr = rawSubParam.toLowerCase().trim();
      const nameIdx = subjectList.findIndex(s => {
        const sName = (s.name || '').toLowerCase().trim();
        return sName.includes(qStr) || qStr.includes(sName);
      });
      if (nameIdx !== -1) {
        setActiveSubject(nameIdx);
        setActiveTopic(null);
        return;
      }

      // 3. Try parsing as numeric index
      const num = parseInt(rawSubParam, 10);
      if (!isNaN(num) && num >= 0 && num < subjectList.length) {
        setActiveSubject(num);
        setActiveTopic(null);
        return;
      }
    }
  }, [rawSubParam, subjectList]);

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
                borderRadius: 14, marginBottom: 16, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
              }}>
                <div style={{
                  width: 50, height: 50, borderRadius: 12,
                  background: '#fff', color: sub.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
                }}>{sub.icon}</div>

                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: sub.color }}>{sub.name}</h2>
                    {purchasedCatIds.some(id => String(id) === String(sub._id)) ? (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#0F9D58', background: '#E8F8EE', padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <FaUnlock fontSize={10} /> Category Unlocked
                      </span>
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#0F9D58', background: '#E8F8EE', padding: '2px 8px', borderRadius: 20 }}>
                        🎁 1st Test FREE
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '0 0 6px', fontSize: 12.5, color: sub.color, opacity: .85 }}>
                    {topic ? `${topic.name}` : sub.desc}
                  </p>
                  <div style={{ fontSize: 11.5, color: 'var(--text)', opacity: .9, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ color: '#0F9D58', fontWeight: 800 }}>• 1st Test is 100% Free for everyone.</span>
                    {!purchasedCatIds.some(id => String(id) === String(sub._id)) && (
                      <span style={{ color: '#EA7A1E', fontWeight: 700 }}>For remaining tests, unlock category pass (₹{sub.categoryPrice || 500}).</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto', flexShrink: 0 }}>
                  {!purchasedCatIds.some(id => String(id) === String(sub._id)) && (
                    <button
                      onClick={() => setPaymentModalCat(sub)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800,
                        color: '#fff', background: 'linear-gradient(135deg, #1957D6, #7C3AED)', border: 'none',
                        padding: '8px 16px', borderRadius: 9, cursor: 'pointer',
                        whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                      }}
                    >
                      <FaLock fontSize={11} /> Unlock Category (₹{sub.categoryPrice || 500})
                    </button>
                  )}

                  <div style={{ textAlign: 'right', minWidth: 44 }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: sub.color, lineHeight: 1 }}>{topic ? topic.tests.length : (sub.topics?.length || 0)}</div>
                    <div style={{ fontSize: 11, color: sub.color, opacity: .7, marginTop: 2 }}>{topic ? 'Tests' : 'Topics'}</div>
                  </div>
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
                      const isFirstFree = test.isFreeTest || test.free || String(test._id) === String(sub.firstFreeTestId);
                      const isCatPurchased = purchasedCatIds.some(id => String(id) === String(sub._id) || String(id) === String(test.categoryId));
                      const isUnlocked = isFirstFree || isCatPurchased;
                      const catPriceVal = sub.categoryPrice || test.price || 500;

                      return (
                        <div key={j} className="responsive-test-card" style={{ borderLeft: `4px solid ${sub.color}` }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              {isFirstFree ? (
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#0F9D58', background: '#E8F8EE', padding: '2px 8px', borderRadius: 20 }}>FREE (1st Test)</span>
                              ) : isCatPurchased ? (
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#0F9D58', background: '#E8F8EE', padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <FaUnlock fontSize={10} /> UNLOCKED
                                </span>
                              ) : (
                                <span style={{ fontSize: 10, fontWeight: 800, color: '#EA7A1E', background: '#FEF1E4', padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <FaLock fontSize={10} /> Category ₹{catPriceVal}
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
                              {isFirstFree ? 'Start Free →' : 'Attempt Now →'}
                            </button>
                          ) : (
                            <button
                              disabled={processingId === sub._id || processingId === test._id}
                              onClick={() => setPaymentModalCat(sub)}
                              style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800,
                                color: '#fff', background: 'linear-gradient(135deg, #1957D6, #7C3AED)', border: 'none',
                                padding: '9px 20px', borderRadius: 9, cursor: 'pointer',
                                whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                              }}
                            >
                              <FaLock fontSize={12} /> {processingId === sub._id ? 'Processing...' : `Unlock Category ₹${catPriceVal}`}
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

      {/* ── CATEGORY ACCESS PAYMENT MODAL ── */}
      {paymentModalCat && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.75)',
          backdropFilter: 'blur(4px)', zIndex: 4000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
        }}>
          <div style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 460,
            padding: '28px 24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: paymentModalCat.bg || '#EAF1FD',
                color: paymentModalCat.color || '#1957D6', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 24, flexShrink: 0
              }}>
                {paymentModalCat.icon}
              </div>
              <div>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#EA7A1E', background: '#FEF1E4', padding: '2px 8px', borderRadius: 12 }}>
                  CATEGORY ACCESS PASS
                </span>
                <h3 style={{ margin: '4px 0 0', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
                  {paymentModalCat.name} Pass
                </h3>
              </div>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: '#64748b', lineHeight: 1.5 }}>
              Unlock unlimited access to all practice and mock tests under <strong>{paymentModalCat.name}</strong> category.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
                Category Pass Benefits:
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: 13, color: '#334155', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#0F9D58', fontWeight: 900 }}>✓</span> Unlimited attempts on all tests in {paymentModalCat.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#0F9D58', fontWeight: 900 }}>✓</span> Instant access to new upcoming tests added in this category
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#0F9D58', fontWeight: 900 }}>✓</span> Detailed analytics &amp; score leaderboard reports
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, padding: '0 4px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>Category Price:</span>
              <span style={{ fontSize: 24, fontWeight: 900, color: '#0f172a' }}>
                ₹{paymentModalCat.categoryPrice || 500}
              </span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setPaymentModalCat(null)}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #cbd5e1',
                  background: '#fff', color: '#475569', fontWeight: 700, fontSize: 13.5, cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                disabled={processingId === paymentModalCat._id}
                onClick={() => {
                  const catToPay = paymentModalCat;
                  setPaymentModalCat(null);
                  handleCategoryCheckout(catToPay);
                }}
                style={{
                  flex: 1.5, padding: '11px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #1957D6, #7C3AED)', color: '#fff',
                  fontWeight: 800, fontSize: 13.5, cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}
              >
                {processingId === paymentModalCat._id ? 'Processing...' : `Pay ₹${paymentModalCat.categoryPrice || 500} & Unlock`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
