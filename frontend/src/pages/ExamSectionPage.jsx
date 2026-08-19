// ExamSectionPage.jsx — Browse all exam categories & live mock tests
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  FaUniversity,
  FaTrain,
  FaLandmark,
  FaShieldAlt,
  FaChalkboardTeacher,
  FaBalanceScale,
  FaClipboardList,
  FaFire,
  FaStar,
  FaBolt,
  FaRegDotCircle
} from 'react-icons/fa';

import { getSocket } from '../utils/socket';

const API_URL = import.meta.env.VITE_API_URL;

const defaultCategories = [
  { icon: <FaLandmark />, label: 'OSSSC', color: '#7C3AED', bg: '#F3ECFE', exams: [] },
  { icon: <FaTrain />, label: 'OSSC', color: '#0F9D58', bg: '#E8F8EE', exams: [] },
  { icon: <FaShieldAlt />, label: 'ODISHA POLICE', color: '#1957D6', bg: '#EAF1FD', exams: [] },
  { icon: <FaLandmark />, label: 'OPSC', color: '#EA7A1E', bg: '#FEF1E4', exams: [] },
];

const iconMap = {
  landmark: <FaLandmark />,
  train: <FaTrain />,
  university: <FaUniversity />,
  shield: <FaShieldAlt />,
  clipboard: <FaClipboardList />,
  scale: <FaBalanceScale />,
  teacher: <FaChalkboardTeacher />
};

const tagDetails = {
  'Hot': { color: '#B4232F', icon: <FaFire /> },
  'Popular': { color: '#1957D6', icon: <FaStar /> },
  'New': { color: '#0F9D58', icon: <FaRegDotCircle /> },
  'Demand': { color: '#EA7A1E', icon: <FaBolt /> },
};

export default function ExamSectionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [categories, setCategories] = useState(defaultCategories);
  const [bannerConfig, setBannerConfig] = useState({
    bannerEyebrow: 'Exam Section',
    bannerHeading: 'Browse All Competitive Exams',
    bannerSubtitle: 'Find your target exam category and get structured preparation resources — tests, PDFs & live classes.',
    bannerStats: [
      { n: '50+', label: 'Exams Covered' },
      { n: '6', label: 'Categories' },
      { n: '10K+', label: 'Students' }
    ]
  });

  const [active, setActive] = useState(0);

  const rawCatParam = searchParams.get('cat') || searchParams.get('catId') || searchParams.get('category') || '';

  useEffect(() => {
    if (!rawCatParam) return;
    if (categories.length > 0) {
      const matchIdx = categories.findIndex(c => {
        const labelStr = (c.label || c.name || c.category || '').toLowerCase();
        const qStr = rawCatParam.toLowerCase();
        return labelStr.includes(qStr) || qStr.includes(labelStr) || (c._id && c._id.toString() === rawCatParam.toString());
      });
      if (matchIdx !== -1) {
        setActive(matchIdx);
      } else if (!isNaN(parseInt(rawCatParam, 10))) {
        setActive(Math.min(Math.max(parseInt(rawCatParam, 10), 0), categories.length - 1));
      }
    }
  }, [rawCatParam, categories]);

  // Fetch dynamic banner config
  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/odisha-exams/config`);
      const json = await res.json();
      if (json.success && json.data) {
        setBannerConfig({
          bannerEyebrow: json.data.bannerEyebrow || 'Exam Section',
          bannerHeading: json.data.bannerHeading || 'Browse All Competitive Exams',
          bannerSubtitle: json.data.bannerSubtitle || 'Find your target exam category and get structured preparation resources — tests, PDFs & live classes.',
          bannerStats: json.data.bannerStats?.length ? json.data.bannerStats : [
            { n: '50+', label: 'Exams Covered' },
            { n: '6', label: 'Categories' },
            { n: '10K+', label: 'Students' }
          ]
        });
      }
    } catch { /* silent */ }
  }, []);

  // Fetch dynamic exam tree & tests ONLY from Manage MockTest
  const fetchExamTree = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/mocktests/public/tree`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const mapped = json.data.map(cat => {
          // Extract ONLY real tests created in Admin Panel Manage MockTest
          const testItems = (cat.tests || []).map((t, idx) => ({
            id: t._id,
            name: t.title || t.name,
            sub: `${t.type === 'full_length' ? 'Full Length (100 Marks)' : 'Sectional Test'} • ${t.qs || 100} Qs • ${t.mins || 60} Mins`,
            tag: idx % 4 === 0 ? 'Hot' : (idx % 4 === 1 ? 'Popular' : (idx % 4 === 2 ? 'Demand' : 'New'))
          }));

          return {
            _id: cat._id,
            icon: iconMap[cat.icon] || <FaLandmark />,
            label: cat.name,
            color: cat.color || '#7C3AED',
            bg: cat.bg || '#F3ECFE',
            exams: testItems
          };
        });

        setCategories(mapped);
      }
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchConfig();
    fetchExamTree();

    const socket = getSocket();
    const handleUpdate = () => {
      fetchConfig();
      fetchExamTree();
    };

    socket.on('exams_updated', handleUpdate);
    socket.on('mocktests_updated', handleUpdate);
    socket.on('subject_tests_updated', handleUpdate);
    socket.on('subjects_updated', handleUpdate);
    socket.on('subject_categories_updated', handleUpdate);

    const timer = setInterval(handleUpdate, 5000);

    window.addEventListener('examsection-updated', handleUpdate);
    window.addEventListener('mocktests-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      clearInterval(timer);
      socket.off('exams_updated', handleUpdate);
      socket.off('mocktests_updated', handleUpdate);
      socket.off('subject_tests_updated', handleUpdate);
      socket.off('subjects_updated', handleUpdate);
      socket.off('subject_categories_updated', handleUpdate);
      window.removeEventListener('examsection-updated', handleUpdate);
      window.removeEventListener('mocktests-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [fetchConfig, fetchExamTree]);

  const cat = categories[active] || categories[0] || defaultCategories[0];

  return (
    <div style={{ minHeight: '80vh', background: 'var(--bg)' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgb(15, 23, 42), rgba(234, 122, 30, 0.133))', padding: '22px 0 18px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="eyebrow" style={{ color: '#FDE68A' }}>{bannerConfig.bannerEyebrow}</div>
              <h1 style={{ fontFamily: 'var(--disp)', fontSize: 'clamp(20px,2.8vw,30px)', color: '#fff', margin: '6px 0 8px' }}>
                {bannerConfig.bannerHeading}
              </h1>
              <p style={{ color: '#94A3B8', fontSize: 13.5, maxWidth: '52ch', lineHeight: 1.6, margin: 0 }}>
                {bannerConfig.bannerSubtitle}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 6 }}>
              {bannerConfig.bannerStats?.map((s, i) => (
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
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
          {categories.map((catItem, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 30, border: '2px solid',
                borderColor: active === i ? catItem.color : 'var(--line)',
                background: active === i ? catItem.bg : 'var(--card)',
                color: active === i ? catItem.color : 'var(--text)',
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
                transition: 'all .18s',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{catItem.icon}</span> {catItem.label}
            </button>
          ))}
        </div>

        {/* Active Category */}
        <div style={{
          background: 'var(--card)', border: `2px solid ${cat.color}33`,
          borderRadius: 16, padding: 28, marginBottom: 32,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14,
              background: cat.bg, color: cat.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24
            }}>{cat.icon}</div>
            <div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{cat.label}</h2>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{cat.exams.length} tests available</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {!cat.exams || cat.exams.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: 32, textAlign: 'center', color: 'var(--muted)', background: 'var(--bg)', borderRadius: 12, border: '1px dashed var(--line)' }}>
                No mock tests available under <strong>{cat.label}</strong> yet. Tests created in Admin Panel → Manage MockTest will appear here.
              </div>
            ) : (
              cat.exams.map((exam, j) => {
                const tagInfo = tagDetails[exam.tag] || { color: '#1957D6', icon: null };
                const navTarget = `/mock-test?catId=${cat._id || ''}&cat=${active}`;
                return (
                  <div
                    key={j}
                    onClick={() => navigate(navTarget)}
                    style={{
                      background: 'var(--bg)', border: '1px solid var(--line)',
                      borderRadius: 12, padding: '18px 20px',
                      transition: 'all .18s', cursor: 'pointer',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--sh-2)'; e.currentTarget.style.borderColor = cat.color + '55'; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--line)'; }}
                  >
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, color: tagInfo.color,
                      background: tagInfo.color + '18',
                      padding: '3px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8
                    }}>
                      {tagInfo.icon} {exam.tag}
                    </span>
                    <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 800, color: cat.color }}>{exam.name}</h3>
                    <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--muted)' }}>{exam.sub}</p>
                    <Link
                      to={navTarget}
                      onClick={(e) => { e.stopPropagation(); }}
                      style={{
                        display: 'inline-block', fontSize: 12, fontWeight: 700,
                        color: '#fff', background: cat.color,
                        padding: '6px 14px', borderRadius: 8, textDecoration: 'none'
                      }}
                    >
                      Explore Exam →
                    </Link>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
