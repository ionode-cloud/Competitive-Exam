// MockTestPage.jsx — Full-Length (100 Marks) & Sectional (< 100 Marks) Mock Tests
import { useState, useEffect } from 'react';
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

const mockTestCategories = [
  {
    category: 'State PSC / SSSC (Odisha)',
    icon: <FaLandmark />,
    color: '#7C3AED',
    bg: '#F3ECFE',
    topics: [
      { name: 'OPSC OAS', tests: [
        { title: 'OPSC OAS Prelims Paper-I (GS)', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Medium', free: true },
        { title: 'OPSC OAS GS Paper-II (CSAT)', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Hard', free: false },
        { title: 'OPSC OAS History & Polity Sectional Test', type: 'sectional', marks: 50, qs: 50, mins: 45, diff: 'Medium', free: true },
        { title: 'OPSC OAS Odisha Geography Sectional', type: 'sectional', marks: 30, qs: 30, mins: 30, diff: 'Easy', free: true },
      ]},
      { name: 'OSSSC RI', tests: [
        { title: 'OSSSC RI Full Length Mock Test 1', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Medium', free: true },
        { title: 'OSSSC RI Full Length Mock Test 2', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Hard', free: false },
        { title: 'OSSSC RI Mathematics Sectional Test', type: 'sectional', marks: 50, qs: 50, mins: 45, diff: 'Medium', free: true },
        { title: 'OSSSC RI Odia & English Sectional', type: 'sectional', marks: 40, qs: 40, mins: 35, diff: 'Easy', free: false },
      ]},
      { name: 'OSSC CGL', tests: [
        { title: 'OSSC CGL Prelims Full Test 1', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Medium', free: true },
        { title: 'OSSC CGL Prelims Full Test 2', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Hard', free: false },
        { title: 'OSSC CGL Reasoning Ability Sectional', type: 'sectional', marks: 35, qs: 35, mins: 30, diff: 'Medium', free: true },
        { title: 'OSSC CGL Computer Awareness Sectional', type: 'sectional', marks: 25, qs: 25, mins: 20, diff: 'Easy', free: true },
      ]},
      { name: 'OSSSC ARI & Amin', tests: [
        { title: 'OSSSC ARI & Amin Model Paper 2026', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Easy', free: true },
        { title: 'OSSSC ARI General Knowledge Sectional', type: 'sectional', marks: 40, qs: 40, mins: 35, diff: 'Medium', free: true },
        { title: 'OSSSC Amin Arithmetic Sectional', type: 'sectional', marks: 30, qs: 30, mins: 25, diff: 'Easy', free: false },
      ]},
      { name: 'OSSSC JE', tests: [
        { title: 'OSSSC JE Technical Full Mock', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Medium', free: false },
        { title: 'OSSSC JE Engineering Mathematics Sectional', type: 'sectional', marks: 50, qs: 50, mins: 45, diff: 'Hard', free: true },
      ]},
      { name: 'OPSC ASO', tests: [
        { title: 'OPSC ASO Full Mock Paper', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Hard', free: false },
        { title: 'OPSC ASO Essay & Drafting Sectional', type: 'sectional', marks: 50, qs: 50, mins: 60, diff: 'Hard', free: true },
      ]},
    ]
  },
  {
    category: 'SSC & Railway',
    icon: <FaTrain />,
    color: '#0F9D58',
    bg: '#E8F8EE',
    topics: [
      { name: 'SSC CGL', tests: [
        { title: 'SSC CGL Tier-1 Complete Mock Test', type: 'full_length', marks: 100, qs: 100, mins: 60, diff: 'Medium', free: true },
        { title: 'SSC CGL Tier-1 Mock Test 2', type: 'full_length', marks: 100, qs: 100, mins: 60, diff: 'Hard', free: false },
        { title: 'SSC CGL Quant Sectional Test', type: 'sectional', marks: 25, qs: 25, mins: 20, diff: 'Hard', free: true },
        { title: 'SSC CGL English Sectional Test', type: 'sectional', marks: 25, qs: 25, mins: 15, diff: 'Medium', free: true },
      ]},
      { name: 'SSC CHSL', tests: [
        { title: 'SSC CHSL 10+2 Full Length Exam', type: 'full_length', marks: 100, qs: 100, mins: 60, diff: 'Easy', free: false },
        { title: 'SSC CHSL General Intelligence Sectional', type: 'sectional', marks: 25, qs: 25, mins: 15, diff: 'Easy', free: true },
      ]},
      { name: 'RRB NTPC', tests: [
        { title: 'RRB NTPC CBT-1 Full Paper', type: 'full_length', marks: 100, qs: 100, mins: 90, diff: 'Medium', free: true },
        { title: 'RRB NTPC General Awareness Sectional', type: 'sectional', marks: 40, qs: 40, mins: 30, diff: 'Medium', free: true },
        { title: 'RRB NTPC Mathematics Sectional', type: 'sectional', marks: 30, qs: 30, mins: 25, diff: 'Hard', free: false },
      ]},
      { name: 'SSC MTS', tests: [
        { title: 'SSC MTS Full Revision Paper', type: 'full_length', marks: 100, qs: 100, mins: 90, diff: 'Easy', free: false },
        { title: 'SSC MTS Numerical Ability Sectional', type: 'sectional', marks: 20, qs: 20, mins: 20, diff: 'Easy', free: true },
      ]},
      { name: 'SSC GD Constable', tests: [
        { title: 'SSC GD Constable Full Mock', type: 'full_length', marks: 100, qs: 100, mins: 60, diff: 'Easy', free: true },
        { title: 'SSC GD General Knowledge Sectional', type: 'sectional', marks: 20, qs: 20, mins: 15, diff: 'Easy', free: true },
      ]},
      { name: 'RRB Group D', tests: [
        { title: 'RRB Group D Full Length Mock', type: 'full_length', marks: 100, qs: 100, mins: 90, diff: 'Medium', free: false },
        { title: 'RRB Group D General Science Sectional', type: 'sectional', marks: 25, qs: 25, mins: 20, diff: 'Medium', free: true },
      ]},
    ]
  },
  {
    category: 'Bank & Insurance',
    icon: <FaUniversity />,
    color: '#1957D6',
    bg: '#EAF1FD',
    topics: [
      { name: 'IBPS PO', tests: [
        { title: 'IBPS PO Prelims Complete Mock', type: 'full_length', marks: 100, qs: 100, mins: 60, diff: 'Hard', free: true },
        { title: 'IBPS PO Reasoning Ability Sectional', type: 'sectional', marks: 35, qs: 35, mins: 20, diff: 'Hard', free: true },
        { title: 'IBPS PO Quantitative Aptitude Sectional', type: 'sectional', marks: 35, qs: 35, mins: 20, diff: 'Hard', free: false },
      ]},
      { name: 'SBI Clerk', tests: [
        { title: 'SBI Clerk Prelims Complete Paper', type: 'full_length', marks: 100, qs: 100, mins: 60, diff: 'Medium', free: false },
        { title: 'SBI Clerk English Language Sectional', type: 'sectional', marks: 30, qs: 30, mins: 20, diff: 'Medium', free: true },
      ]},
      { name: 'RBI Grade B', tests: [
        { title: 'RBI Grade B Phase-1 Full Mock', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Hard', free: false },
        { title: 'RBI Grade B General Awareness Sectional', type: 'sectional', marks: 80, qs: 80, mins: 45, diff: 'Hard', free: true },
      ]},
      { name: 'LIC AAO', tests: [
        { title: 'LIC AAO Generalist Full Mock Test', type: 'full_length', marks: 100, qs: 100, mins: 60, diff: 'Medium', free: true },
        { title: 'LIC AAO Insurance & Financial Sectional', type: 'sectional', marks: 30, qs: 30, mins: 20, diff: 'Medium', free: true },
      ]},
      { name: 'IBPS Clerk', tests: [
        { title: 'IBPS Clerk Prelims Full Paper', type: 'full_length', marks: 100, qs: 100, mins: 60, diff: 'Easy', free: true },
        { title: 'IBPS Clerk Numerical Ability Sectional', type: 'sectional', marks: 35, qs: 35, mins: 20, diff: 'Easy', free: true },
      ]},
      { name: 'SBI PO', tests: [
        { title: 'SBI PO Prelims Full Mock', type: 'full_length', marks: 100, qs: 100, mins: 60, diff: 'Hard', free: false },
        { title: 'SBI PO High-Level Data Interpretation Sectional', type: 'sectional', marks: 35, qs: 35, mins: 20, diff: 'Hard', free: true },
      ]},
    ]
  },
  {
    category: 'Police & Defence',
    icon: <FaShieldAlt />,
    color: '#B4232F',
    bg: '#FCEBEA',
    topics: [
      { name: 'Odisha Police SI', tests: [
        { title: 'Odisha Police SI GS + Language Full Paper', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Medium', free: true },
        { title: 'Odisha Police SI General Studies Sectional', type: 'sectional', marks: 50, qs: 50, mins: 45, diff: 'Medium', free: true },
      ]},
      { name: 'Odisha Police Constable', tests: [
        { title: 'Odisha Police Constable Full Test 1', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Easy', free: false },
        { title: 'Odisha Police Constable Odia Grammar Sectional', type: 'sectional', marks: 25, qs: 25, mins: 20, diff: 'Easy', free: true },
      ]},
      { name: 'NDA', tests: [
        { title: 'NDA Mathematics Full Length Paper', type: 'full_length', marks: 100, qs: 100, mins: 150, diff: 'Hard', free: false },
        { title: 'NDA General Ability Sectional Test', type: 'sectional', marks: 50, qs: 50, mins: 60, diff: 'Medium', free: true },
      ]},
      { name: 'CDS', tests: [
        { title: 'CDS GK & English Full Mock', type: 'full_length', marks: 100, qs: 100, mins: 120, diff: 'Medium', free: true },
        { title: 'CDS Elementary Mathematics Sectional', type: 'sectional', marks: 50, qs: 50, mins: 60, diff: 'Hard', free: false },
      ]},
      { name: 'CAPF', tests: [
        { title: 'CAPF Paper 1 Full Length Mock', type: 'full_length', marks: 100, qs: 100, mins: 150, diff: 'Hard', free: false },
        { title: 'CAPF General Science & Aptitude Sectional', type: 'sectional', marks: 50, qs: 50, mins: 45, diff: 'Hard', free: true },
      ]},
    ]
  },
];

const diffColors = { Easy: '#0F9D58', Medium: '#EA7A1E', Hard: '#B4232F' };

export default function MockTestPage() {
  const [searchParams] = useSearchParams();

  const [categoriesList, setCategoriesList] = useState(mockTestCategories);
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeTopic, setActiveTopic] = useState(null);
  const [testTypeFilter, setTestTypeFilter] = useState('all'); // 'all' | 'full_length' | 'sectional'

  useEffect(() => {
    fetch(`${API_URL}/mocktests/public/tree`)
      .then(res => res.json())
      .then(json => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const formattedLive = json.data.map(catItem => {
            // Transform live structure into topics/tests structure for page display
            const rawTests = catItem.tests || [];
            const isFullList = rawTests.filter(t => t.type === 'full_length' || t.marks >= 100);
            const isSectList = rawTests.filter(t => t.type === 'sectional' || t.marks < 100);

            const topics = [];
            if (rawTests.length > 0) {
              topics.push({ name: `${catItem.category || catItem.name} Official Papers`, tests: rawTests });
            }
            return {
              _id: catItem._id,
              category: catItem.category || catItem.name,
              icon: <FaLandmark />,
              color: catItem.color || '#7C3AED',
              bg: catItem.bg || '#F3ECFE',
              topics: topics.length > 0 ? topics : [{ name: `${catItem.category || catItem.name} General`, tests: [] }]
            };
          });

          // Merge live categories with fallback categories
          const merged = [...formattedLive];
          mockTestCategories.forEach(staticCat => {
            if (!merged.some(m => m.category?.toLowerCase() === staticCat.category?.toLowerCase())) {
              merged.push(staticCat);
            }
          });
          setCategoriesList(merged);
        }
      })
      .catch(() => { /* fallback */ });
  }, []);

  const rawCat = parseInt(searchParams.get('cat') ?? '', 10);
  const urlCat = isNaN(rawCat) ? 0 : Math.min(Math.max(rawCat, 0), categoriesList.length - 1);

  useEffect(() => {
    setActiveCategory(urlCat);
    setActiveTopic(null);
  }, [urlCat]);

  const cat = categoriesList[activeCategory] || categoriesList[0] || mockTestCategories[0];
  const topic = activeTopic !== null ? cat.topics[activeTopic] : null;

  const handleCategoryChange = (i) => {
    setActiveCategory(i);
    setActiveTopic(null);
  };

  // Filter tests based on type filter (Full-length vs Sectional)
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
              {[{ n: '4', l: 'Categories' }, { n: '100 Marks', l: 'Full Length' }, { n: '<100 Marks', l: 'Sectionals' }].map((s, i) => (
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
              <button key={i} onClick={() => handleCategoryChange(i)} style={{
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
                  {topic ? getFilteredTests(topic.tests).length : cat.topics.length}
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
                  background: cat.bg, border: `1px solid ${cat.color}44`,
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
                {cat.topics.map((t, j) => {
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
                    <div key={j} className="responsive-test-card" style={{ borderLeft: `4px solid ${test.marks === 100 ? '#7C3AED' : cat.color}` }}>
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
                          <span style={{ fontSize: 10, fontWeight: 700, color: diffColors[test.diff], background: diffColors[test.diff] + '18', padding: '2px 8px', borderRadius: 20 }}>{test.diff}</span>
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
