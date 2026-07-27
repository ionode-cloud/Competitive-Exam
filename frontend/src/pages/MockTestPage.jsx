// MockTestPage.jsx — Full-Length (100 Marks) & Sectional (< 100 Marks) Mock Tests
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  FaCheckCircle
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5303/api';

const diffColors = { Easy: '#0F9D58', Medium: '#EA7A1E', Hard: '#B4232F' };

export default function MockTestPage() {
  const [searchParams] = useSearchParams();

  const [categoriesList, setCategoriesList] = useState([]);
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeTopic, setActiveTopic]       = useState(null);
  const [testTypeFilter, setTestTypeFilter] = useState('all'); // 'all' | 'full_length' | 'sectional'

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

            const topics = [];
            topicsMap.forEach((tList, tName) => {
              topics.push({ name: tName, tests: tList });
            });

            if (topics.length === 0) {
              topics.push({ name: `${catItem.category || catItem.name} General`, tests: [] });
            }

            const iconMap = {
              landmark: <FaLandmark />,
              train: <FaTrain />,
              university: <FaUniversity />,
              shield: <FaShieldAlt />,
              clipboard: <FaClipboardList />
            };

            return {
              _id: catItem._id,
              category: catItem.category || catItem.name,
              icon: iconMap[catItem.icon] || <FaLandmark />,
              color: catItem.color || colorList[idx % colorList.length],
              bg: catItem.bg || bgList[idx % bgList.length],
              topics: topics
            };
          });

          setCategoriesList(formattedLive);
        }
      })
      .catch(() => { /* silent */ });
  }, []);

  useEffect(() => {
    fetchLiveMockTests();

    // Auto-polling every 3 seconds for real-time synchronization
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

  const rawCat = parseInt(searchParams.get('cat') ?? '', 10);
  const urlCat = isNaN(rawCat) ? 0 : Math.min(Math.max(rawCat, 0), Math.max(categoriesList.length - 1, 0));

  useEffect(() => {
    setActiveCategory(urlCat);
    setActiveTopic(null);
  }, [urlCat]);

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
              borderRadius: 14, marginBottom: 18,
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: 12,
                background: '#fff', color: cat.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0
              }}>{cat.icon}</div>
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '0 0 3px', fontSize: 17, fontWeight: 800, color: cat.color }}>{cat.category}</h2>
                <p style={{ margin: 0, fontSize: 12.5, color: cat.color, opacity: .75 }}>
                  {topic ? topic.name : 'Choose an exam or paper type below'}
                </p>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: cat.color }}>
                  {topic ? getFilteredTests(topic.tests).length : (cat.topics?.length || 0)}
                </div>
                <div style={{ fontSize: 11, color: cat.color, opacity: .7 }}>{topic ? 'Tests' : 'Exams'}</div>
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
                  getFilteredTests(topic.tests).map((test, j) => (
                    <div key={test._id || j} className="responsive-test-card" style={{ borderLeft: `4px solid ${test.marks === 100 ? '#7C3AED' : cat.color}` }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          {test.free && (
                            <span style={{ fontSize: 10, fontWeight: 800, color: '#0F9D58', background: '#E8F8EE', padding: '2px 8px', borderRadius: 20 }}>FREE</span>
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
                      <a href="#" style={{
                        display: 'inline-block', fontSize: 13, fontWeight: 700,
                        color: '#fff', background: test.marks === 100 ? '#7C3AED' : cat.color,
                        padding: '9px 20px', borderRadius: 9,
                        whiteSpace: 'nowrap', flexShrink: 0, textDecoration: 'none'
                      }}>
                        {test.free ? 'Start Free →' : 'Attempt →'}
                      </a>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
