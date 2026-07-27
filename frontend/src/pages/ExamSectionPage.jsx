// ExamSectionPage.jsx — Browse all exam categories
import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import {
  FaUniversity,
  FaTrain,
  FaLandmark,
  FaShieldAlt,
  FaChalkboardTeacher,
  FaBalanceScale,
  FaFire,
  FaStar,
  FaBolt,
  FaRegDotCircle
} from 'react-icons/fa';

const examCategories = [
  {
    icon: <FaUniversity />, label: 'Bank & Insurance', color: '#1957D6', bg: '#EAF1FD',
    exams: [
      { name: 'IBPS PO', sub: 'Probationary Officer', tag: 'Hot' },
      { name: 'SBI Clerk', sub: 'Junior Associate', tag: 'Popular' },
      { name: 'RBI Grade B', sub: 'Officer Grade B', tag: 'New' },
      { name: 'LIC AAO', sub: 'Assistant Admin Officer', tag: 'Demand' },
    ]
  },
  {
    icon: <FaTrain />, label: 'SSC & Railway', color: '#0F9D58', bg: '#E8F8EE',
    exams: [
      { name: 'SSC CGL', sub: 'Combined Graduate Level', tag: 'Hot' },
      { name: 'SSC CHSL', sub: 'Combined Higher Secondary', tag: 'Popular' },
      { name: 'RRB NTPC', sub: 'Non-Technical Popular Categories', tag: 'Demand' },
      { name: 'RRB Group D', sub: 'Group D Posts', tag: 'New' },
    ]
  },
  {
    icon: <FaLandmark />, label: 'State PSC / SSSC', color: '#7C3AED', bg: '#F3ECFE',
    exams: [
      { name: 'OPSC OAS', sub: 'Odisha Administrative Service', tag: 'Hot' },
      { name: 'OSSSC RI', sub: 'Revenue Inspector', tag: 'Popular' },
      { name: 'OSSC CGL', sub: 'Combined Graduate Level', tag: 'Demand' },
      { name: 'OSSSC ARI', sub: 'Assistant Revenue Inspector', tag: 'New' },
    ]
  },
  {
    icon: <FaShieldAlt />, label: 'Police & Defence', color: '#B4232F', bg: '#FCEBEA',
    exams: [
      { name: 'Odisha Police SI', sub: 'Sub-Inspector', tag: 'Hot' },
      { name: 'Odisha Police Constable', sub: 'Constable Posts', tag: 'Demand' },
      { name: 'NDA', sub: 'National Defence Academy', tag: 'Popular' },
      { name: 'CDS', sub: 'Combined Defence Services', tag: 'New' },
    ]
  },
  {
    icon: <FaChalkboardTeacher />, label: 'Teaching', color: '#EA7A1E', bg: '#FEF1E4',
    exams: [
      { name: 'OTET', sub: 'Odisha Teacher Eligibility Test', tag: 'Hot' },
      { name: 'CTET', sub: 'Central Teacher Eligibility Test', tag: 'Popular' },
      { name: 'KVS PGT', sub: 'Post Graduate Teacher', tag: 'Demand' },
      { name: 'DSSSB TGT', sub: 'Trained Graduate Teacher', tag: 'New' },
    ]
  },
  {
    icon: <FaBalanceScale />, label: 'Regulatory Bodies', color: '#0891B2', bg: '#E0F7FA',
    exams: [
      { name: 'SEBI Grade A', sub: 'Securities & Exchange Board', tag: 'Hot' },
      { name: 'NABARD Grade A', sub: 'National Bank for Agriculture', tag: 'Popular' },
      { name: 'IRDAI', sub: 'Insurance Regulatory Development', tag: 'Demand' },
      { name: 'SIDBI', sub: 'Small Industries Dev Bank', tag: 'New' },
    ]
  },
];

const tagDetails = {
  'Hot': { color: '#B4232F', icon: <FaFire /> },
  'Popular': { color: '#1957D6', icon: <FaStar /> },
  'New': { color: '#0F9D58', icon: <FaRegDotCircle /> },
  'Demand': { color: '#EA7A1E', icon: <FaBolt /> },
};

export default function ExamSectionPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Derive a primitive number — reliable useEffect comparison
  const rawCat = parseInt(searchParams.get('cat') ?? '', 10);
  const urlCat = isNaN(rawCat) ? 0 : Math.min(Math.max(rawCat, 0), examCategories.length - 1);

  const [active, setActive] = useState(urlCat);

  // Re-sync when ?cat= param changes
  useEffect(() => {
    setActive(urlCat);
  }, [urlCat]);

  const cat = examCategories[active];

  return (
    <div style={{ minHeight: '80vh', background: 'var(--bg)' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, rgb(15, 23, 42), rgba(234, 122, 30, 0.133))', padding: '22px 0 18px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="eyebrow" style={{ color: '#FDE68A' }}>Exam Section</div>
              <h1 style={{ fontFamily: 'var(--disp)', fontSize: 'clamp(20px,2.8vw,30px)', color: '#fff', margin: '6px 0 8px' }}>
                Browse All Competitive Exams
              </h1>
              <p style={{ color: '#94A3B8', fontSize: 13.5, maxWidth: '52ch', lineHeight: 1.6, margin: 0 }}>
                Find your target exam category and get structured preparation resources — tests, PDFs &amp; live classes.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 6 }}>
              {[{ n: '50+', l: 'Exams Covered' }, { n: '6', l: 'Categories' }, { n: '10K+', l: 'Students' }].map((s, i) => (
                <div key={i} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px', minWidth: 72 }}>
                  <div style={{ fontFamily: 'var(--disp)', fontSize: 20, fontWeight: 900, color: '#FFC93C', lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontSize: 10.5, color: '#CBD5E1', marginTop: 4, letterSpacing: 0.4 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 36, paddingBottom: 48 }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
          {examCategories.map((catItem, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '9px 18px', borderRadius: 30, border: '2px solid',
                borderColor: active === i ? examCategories[i].color : 'var(--line)',
                background: active === i ? examCategories[i].bg : 'var(--card)',
                color: active === i ? examCategories[i].color : 'var(--text)',
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
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{cat.exams.length} exams available</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
            {cat.exams.map((exam, j) => {
              const tagInfo = tagDetails[exam.tag] || { color: '#1957D6', icon: null };
              return (
                <div
                  key={j}
                  onClick={() => navigate('/subject-test')}
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
                    to="/subject-test"
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
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
