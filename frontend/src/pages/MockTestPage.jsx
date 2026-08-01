// MockTestPage.jsx — Full-Length (100 Marks) & Sectional (< 100 Marks) Mock Tests
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  FaLandmark,
  FaTrain,
  FaUniversity,
  FaShieldAlt,
  FaClipboardList,
  FaClock,
  FaArrowLeft,
  FaChevronRight,
  FaLayerGroup,
  FaCheckCircle,
  FaLock,
  FaUnlock
} from 'react-icons/fa';
import { getSocket } from '../utils/socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5303/api';

const diffColors = { Easy: '#0F9D58', Medium: '#EA7A1E', Hard: '#B4232F' };

export default function MockTestPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [categoriesList, setCategoriesList] = useState([]);
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeTopic, setActiveTopic]       = useState(null);
  const [testTypeFilter, setTestTypeFilter] = useState('all'); // 'all' | 'full_length' | 'sectional'

  // User Purchased Categories & Payment Modal State
  const [purchasedCatIds, setPurchasedCatIds] = useState([]);
  const [processingId, setProcessingId]       = useState(null);
  const [paymentModalCat, setPaymentModalCat] = useState(null);

  // Check if current logged-in user is premium
  const loggedInUserStr = localStorage.getItem('user');
  let userIsPremium = false;
  if (loggedInUserStr) {
    try {
      const parsed = JSON.parse(loggedInUserStr);
      userIsPremium = Boolean(parsed.isPremium || parsed.isSubscribed || (parsed.purchases && parsed.purchases.length > 0));
    } catch { /* silent */ }
  }

  // Fetch purchased categories for logged in student
  useEffect(() => {
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
  }, []);

  const handleCategoryCheckout = async (category) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to purchase category access');
      navigate('/login');
      return;
    }
    const catId = category._id;
    const amount = category.categoryPrice || 499;
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
          itemName: `Mock Test Category Access: ${category.category}`,
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
        description: `Category Access: ${category.category}`,
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
          alert(`🎉 Payment Successful! All Mock Tests under "${category.category}" are now unlocked!`);
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

  // Fetch live mock tests tree directly from Admin Panel / MongoDB
  const fetchLiveMockTests = useCallback(() => {
    fetch(`${API_URL}/mocktests/public/tree`)
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          const colorList = ['#7C3AED', '#0F9D58', '#1957D6', '#B4232F', '#D97706', '#0369A1'];
          const bgList    = ['#F3ECFE', '#E8F8EE', '#EAF1FD', '#FCEBEA', '#FFFBEB', '#E0F2FE'];

          const formattedLive = json.data.map((catItem, idx) => {
            const rawTests = catItem.tests || [];
            
            // Group tests by topicName if available
            const topicsMap = new Map();
            rawTests.forEach(t => {
              const topName = t.topicName || t.topic || `${catItem.category || catItem.name} Official Papers`;
              if (!topicsMap.has(topName)) {
                topicsMap.set(topName, []);
              }
              topicsMap.get(topName).push(t);
            });

            const topicEntries = Array.from(topicsMap.entries());
            const topics = topicEntries.map(([tName, tList], tIdx) => ({
              id: tIdx + 1,
              name: tName,
              testsCount: tList.length,
              tests: tList.map(item => ({
                _id: item._id,
                title: item.name || item.title,
                subtext: item.subtext || `${item.totalQuestions || 100} Qs • ${item.duration || 120} Mins`,
                questionsCount: item.totalQuestions || 100,
                marks: item.totalMarks || 100,
                durationMins: item.duration || 120,
                pricingType: item.pricingType || 'Free',
                positiveMarks: item.positiveMarks || 1,
                negativeMarks: item.negativeMarks || 0.25,
                difficulty: item.difficulty || 'Medium',
                attemptsCount: item.totalAttempts || 0,
                testType: item.testType || ((item.totalQuestions || 100) >= 100 ? 'full_length' : 'sectional'),
              }))
            }));

            return {
              _id: catItem._id,
              category: catItem.category || catItem.name,
              categoryPrice: catItem.price || 199,
              icon: <FaLandmark />,
              color: colorList[idx % colorList.length],
              bg: bgList[idx % bgList.length],
              topics: topics.length > 0 ? topics : [
                { id: 1, name: 'General Mock Tests', testsCount: 0, tests: [] }
              ]
            };
          });

          setCategoriesList(formattedLive.length > 0 ? formattedLive : [
            { _id: 'osssc', category: 'OSSSC', categoryPrice: 199, icon: <FaLandmark />, color: '#7C3AED', bg: '#F3ECFE', topics: [{ id: 1, name: 'OSSSC Official Papers', testsCount: 0, tests: [] }] },
            { _id: 'ossc', category: 'OSSC', categoryPrice: 199, icon: <FaTrain />, color: '#0F9D58', bg: '#E8F8EE', topics: [{ id: 1, name: 'OSSC Official Papers', testsCount: 0, tests: [] }] },
            { _id: 'police', category: 'ODISHA POLICE', categoryPrice: 199, icon: <FaShieldAlt />, color: '#1957D6', bg: '#EAF1FD', topics: [{ id: 1, name: 'Odisha Police Papers', testsCount: 0, tests: [] }] },
            { _id: 'opsc', category: 'OPSC', categoryPrice: 199, icon: <FaLandmark />, color: '#EA7A1E', bg: '#FEF1E4', topics: [{ id: 1, name: 'OPSC Official Papers', testsCount: 0, tests: [] }] },
          ]);
        }
      })
      .catch(() => { /* silent */ });
  }, []);

  useEffect(() => {
    fetchLiveMockTests();

    const timer = setInterval(fetchLiveMockTests, 3000);

    const handleSync = () => fetchLiveMockTests();
    window.addEventListener('mocktests-updated', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mocktests-updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [fetchLiveMockTests]);

  // Handle URL category parameters whenever searchParams or categoriesList change
  useEffect(() => {
    const rawCat = searchParams.get('cat') || searchParams.get('catId') || searchParams.get('category') || '';
    if (!rawCat || categoriesList.length === 0) return;

    // 1. Try exact ID match
    let foundIdx = categoriesList.findIndex(c => c._id && c._id.toString() === rawCat.toString());

    // 2. Try name string match (e.g. 'OSSSC', 'OSSC', 'ODISHA POLICE', 'OPSC')
    if (foundIdx === -1) {
      const qStr = rawCat.trim().toLowerCase();
      foundIdx = categoriesList.findIndex(c => {
        const catStr = (c.category || c.name || '').trim().toLowerCase();
        return catStr.includes(qStr) || qStr.includes(catStr);
      });
    }

    // 3. Try integer index fallback
    if (foundIdx === -1 && !isNaN(parseInt(rawCat, 10))) {
      foundIdx = Math.min(Math.max(parseInt(rawCat, 10), 0), categoriesList.length - 1);
    }

    if (foundIdx !== -1) {
      setActiveCategory(foundIdx);
      setActiveTopic(null);
    }
  }, [searchParams, categoriesList]);

  const cat = categoriesList[activeCategory] || categoriesList[0] || {
    category: 'Mock Tests',
    icon: <FaLandmark />,
    color: '#7C3AED',
    bg: '#F3ECFE',
    topics: []
  };

  const topic = activeTopic !== null && cat.topics ? cat.topics[activeTopic] : null;

  const handleCategoryChange = (i) => {
    setActiveCategory(i);
    setActiveTopic(null);
  };

  // Filter tests based on paper type filter (Full-length vs Sectional)
  const getFilteredTests = (testsList) => {
    if (!Array.isArray(testsList)) return [];
    if (testTypeFilter === 'full_length') {
      return testsList.filter(t => t.type === 'full_length' || t.marks >= 100);
    }
    if (testTypeFilter === 'sectional') {
      return testsList.filter(t => t.type === 'sectional' || t.marks < 100);
    }
    return testsList;
  };

  return (
    <div style={{ minHeight: '80vh', background: 'var(--bg)' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgb(15, 23, 42), rgba(234, 122, 30, 0.133))', padding: '22px 0 18px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="eyebrow" style={{ color: '#FDE68A' }}>Mock Test Series</div>
              <h1 style={{ fontFamily: 'var(--disp)', fontSize: 'clamp(20px,2.8vw,30px)', color: '#fff', margin: '6px 0 8px' }}>
                Full-Length &amp; Sectional Mock Tests
              </h1>
              <p style={{ color: '#94A3B8', fontSize: 13.5, maxWidth: '52ch', lineHeight: 1.6, margin: 0 }}>
                Attempt 100-mark Full Length Mock Papers or targeted Sectional Tests (&lt;100 Marks) for all Odisha &amp; National competitive exams.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 6 }}>
              {[{ n: `${categoriesList.length}`, l: 'Categories' }, { n: '100 Marks', l: 'Full Length' }, { n: '<100 Marks', l: 'Sectionals' }].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px', minWidth: 72 }}>
                  <div style={{ fontFamily: 'var(--disp)', fontSize: 18, fontWeight: 900, color: '#FFC93C', lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontSize: 10.5, color: '#CBD5E1', marginTop: 4, letterSpacing: 0.4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 28, paddingBottom: 48 }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

          {/* Sidebar — Categories */}
          <div className="responsive-sidebar">
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 1.5, marginBottom: 10 }}>CATEGORIES</div>
            {categoriesList.map((c, i) => (
              <button key={c._id || i} onClick={() => handleCategoryChange(i)} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '11px 14px', borderRadius: 10, border: 'none',
                background: activeCategory === i ? c.bg : 'transparent',
                color: activeCategory === i ? c.color : 'var(--text)',
                fontWeight: activeCategory === i ? 800 : 500,
                fontSize: 13.5, cursor: 'pointer', marginBottom: 4,
                textAlign: 'left', transition: 'all .15s',
                borderLeft: activeCategory === i ? `3px solid ${c.color}` : '3px solid transparent',
              }}>
                <span style={{ fontSize: 16, display: 'flex', alignItems: 'center' }}>{c.icon}</span>
                {c.category}
              </button>
            ))}
          </div>

          {/* Main Panel */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Category Header */}
            <div className="subject-header-responsive" style={{
              background: cat.bg, border: `1.5px solid ${cat.color}33`,
              borderRadius: 14, marginBottom: 18, padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 12,
                background: '#fff', color: cat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}>{cat.icon}</div>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: cat.color }}>{cat.category}</h2>
                  {purchasedCatIds.some(id => String(id) === String(cat._id)) || userIsPremium ? (
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#0F9D58', background: '#E8F8EE', padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <FaUnlock fontSize={10} /> Category Unlocked
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#0F9D58', background: '#E8F8EE', padding: '2px 8px', borderRadius: 20 }}>
                      🎁 1st Test FREE
                    </span>
                  )}
                </div>
                <p style={{ margin: '0 0 6px', fontSize: 12.5, color: cat.color, opacity: .85 }}>
                  {topic ? topic.name : 'Choose an exam or paper type below'}
                </p>
                <div style={{ fontSize: 11.5, color: 'var(--text)', opacity: .9, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ color: '#0F9D58', fontWeight: 800 }}>• 1st Test is 100% Free for everyone.</span>
                  {!purchasedCatIds.some(id => String(id) === String(cat._id)) && !userIsPremium && (
                    <span style={{ color: '#EA7A1E', fontWeight: 700 }}>Unlock remaining papers for ₹{cat.categoryPrice || 199}.</span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto', flexShrink: 0 }}>
                {!purchasedCatIds.some(id => String(id) === String(cat._id)) && !userIsPremium && (
                  <button
                    onClick={() => setPaymentModalCat(cat)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, fontWeight: 800,
                      color: '#fff', background: 'linear-gradient(135deg, #1957D6, #7C3AED)', border: 'none',
                      padding: '8px 16px', borderRadius: 9, cursor: 'pointer',
                      whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    <FaLock fontSize={11} /> Unlock Category (₹{cat.categoryPrice || 199})
                  </button>
                )}

                <div style={{ textAlign: 'right', minWidth: 44 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: cat.color, lineHeight: 1 }}>
                    {topic ? getFilteredTests(topic.tests).length : (cat.topics?.length || 0)}
                  </div>
                  <div style={{ fontSize: 11, color: cat.color, opacity: .7, marginTop: 2 }}>{topic ? 'Tests' : 'Exams'}</div>
                </div>
              </div>
            </div>

            {/* Paper Type Toggle Filter Tabs (Full-Length 100 Marks vs Sectional <100 Marks) */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap',
              background: 'var(--card)', padding: '6px 8px', borderRadius: 12, border: '1px solid var(--line)'
            }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--muted)', marginRight: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <FaLayerGroup /> Paper Type:
              </span>
              <button
                onClick={() => setTestTypeFilter('all')}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  background: testTypeFilter === 'all' ? 'var(--primary)' : 'transparent',
                  color: testTypeFilter === 'all' ? '#fff' : 'var(--text)',
                  fontWeight: testTypeFilter === 'all' ? 800 : 600,
                  fontSize: 12.5, cursor: 'pointer', transition: 'all .15s'
                }}
              >
                All Papers
              </button>
              <button
                onClick={() => setTestTypeFilter('full_length')}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  background: testTypeFilter === 'full_length' ? '#7C3AED' : 'transparent',
                  color: testTypeFilter === 'full_length' ? '#fff' : 'var(--text)',
                  fontWeight: testTypeFilter === 'full_length' ? 800 : 600,
                  fontSize: 12.5, cursor: 'pointer', transition: 'all .15s',
                  display: 'inline-flex', alignItems: 'center', gap: 5
                }}
              >
                 Full Length
              </button>
              <button
                onClick={() => setTestTypeFilter('sectional')}
                style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none',
                  background: testTypeFilter === 'sectional' ? '#0F9D58' : 'transparent',
                  color: testTypeFilter === 'sectional' ? '#fff' : 'var(--text)',
                  fontWeight: testTypeFilter === 'sectional' ? 800 : 600,
                  fontSize: 12.5, cursor: 'pointer', transition: 'all .15s',
                  display: 'inline-flex', alignItems: 'center', gap: 5
                }}
              >
                 Sectional
              </button>
            </div>

            {/* Back button */}
            {topic && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, fontSize: 13 }}>
                <button onClick={() => setActiveTopic(null)} style={{
                  background: cat.bg, border: `1.5px solid ${cat.color}44`,
                  borderRadius: 8, cursor: 'pointer',
                  color: cat.color, fontWeight: 700, fontSize: 13, padding: '5px 12px',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <FaArrowLeft fontSize={11} /> Back to Exams
                </button>
                <span style={{ color: 'var(--muted)', fontSize: 12 }}>›</span>
                <span style={{ color: 'var(--muted)', fontWeight: 600, fontSize: 13 }}>{topic.name}</span>
              </div>
            )}

            {/* Exams Grid */}
            {!topic && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 10 }}>
                {cat.topics?.map((t, j) => {
                  const testsCount = getFilteredTests(t.tests).length;
                  return (
                    <button key={j} onClick={() => setActiveTopic(j)} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '14px 16px', borderRadius: 10,
                      background: 'var(--card)', border: '1px solid var(--line)',
                      cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                      gap: 8, width: '100%',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color + '66'; e.currentTarget.style.boxShadow = `0 2px 10px ${cat.color}18`; e.currentTarget.style.background = cat.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.boxShadow = ''; e.currentTarget.style.background = 'var(--card)'; }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{testsCount} available tests</div>
                      </div>
                      <span style={{ color: cat.color, fontWeight: 900, fontSize: 14, flexShrink: 0, display: 'flex', alignItems: 'center' }}><FaChevronRight /></span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Tests List */}
            {topic && (
              <div style={{ display: 'grid', gap: 14 }}>
                {getFilteredTests(topic.tests).length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', background: 'var(--card)', borderRadius: 12, border: '1px solid var(--line)' }}>
                    <p style={{ color: 'var(--muted)', margin: 0, fontSize: 13.5, fontWeight: 600 }}>
                      No {testTypeFilter === 'full_length' ? '100-mark Full Length' : 'Sectional'} tests found for {topic.name}.
                    </p>
                    <button onClick={() => setTestTypeFilter('all')} style={{ marginTop: 10, color: 'var(--primary)', background: 'none', border: 'none', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>
                      Show All Papers →
                    </button>
                  </div>
                ) : (
                  getFilteredTests(topic.tests).map((test, j) => {
                    const isFirstFree = j === 0 || test.free || test.pricingType === 'free' || test.accessType === 'Free';
                    const isCatPurchased = purchasedCatIds.some(id => String(id) === String(cat._id)) || userIsPremium;
                    const isUnlocked = isFirstFree || isCatPurchased;
                    const catPriceVal = cat.categoryPrice || 199;

                    return (
                      <div key={test._id || j} className="responsive-test-card" style={{ borderLeft: `4px solid ${test.marks === 100 ? '#7C3AED' : cat.color}` }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
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
                            <span style={{
                              fontSize: 10, fontWeight: 800,
                              color: test.marks === 100 ? '#7C3AED' : '#0F9D58',
                              background: test.marks === 100 ? '#F3ECFE' : '#E8F8EE',
                              padding: '2px 8px', borderRadius: 20,
                              display: 'inline-flex', alignItems: 'center', gap: 4
                            }}>
                              {test.marks === 100 ? '🏆 FULL LENGTH • 100 MARKS' : `⚡ SECTIONAL • ${test.marks} MARKS`}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 700, color: diffColors[test.diff] || '#0F9D58', background: (diffColors[test.diff] || '#0F9D58') + '18', padding: '2px 8px', borderRadius: 20 }}>{test.diff}</span>
                          </div>
                          <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700 }}>{test.title}</h3>
                          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--muted)', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaClipboardList /> {test.qs} Questions</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaCheckCircle /> {test.marks} Total Marks</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaClock /> {test.mins} Minutes</span>
                          </div>
                        </div>

                        {isUnlocked ? (
                          <Link to={`/subject-test/instructions/${test._id}`} style={{
                            display: 'inline-block', fontSize: 13, fontWeight: 700,
                            color: '#fff', background: isFirstFree ? '#0F9D58' : (test.marks === 100 ? '#7C3AED' : cat.color),
                            padding: '9px 20px', borderRadius: 9,
                            whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none'
                          }}>
                            {isFirstFree ? 'Start Free →' : 'Attempt Now →'}
                          </Link>
                        ) : (
                          <button
                            disabled={processingId === cat._id}
                            onClick={() => setPaymentModalCat(cat)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 800,
                              color: '#fff', background: 'linear-gradient(135deg, #1957D6, #7C3AED)', border: 'none',
                              padding: '9px 20px', borderRadius: 9, cursor: 'pointer',
                              whiteSpace: 'nowrap', flexShrink: 0, boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)'
                            }}
                          >
                            <FaLock fontSize={12} /> {processingId === cat._id ? 'Processing...' : `Unlock Category ₹${catPriceVal}`}
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
                  {paymentModalCat.category} Pass
                </h3>
              </div>
            </div>

            <p style={{ margin: '0 0 20px', fontSize: 13.5, color: '#64748b', lineHeight: 1.5 }}>
              Unlock unlimited access to all practice and mock tests under <strong>{paymentModalCat.category}</strong> category.
            </p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: 0.5 }}>
                Category Pass Benefits:
              </div>
              <div style={{ display: 'grid', gap: 8, fontSize: 13, color: '#334155', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#0F9D58', fontWeight: 900 }}>✓</span> Unlimited attempts on all tests in {paymentModalCat.category}
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
                ₹{paymentModalCat.categoryPrice || 199}
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
                {processingId === paymentModalCat._id ? 'Processing...' : `Pay ₹${paymentModalCat.categoryPrice || 199} & Unlock`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
