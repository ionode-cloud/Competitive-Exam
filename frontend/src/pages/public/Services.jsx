/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, BookOpen, Calculator, Globe, Cpu, TrendingUp,
  Briefcase, Train, Building2, MapPin, ChevronRight,
  BarChart2, Clock, Target, Award, CheckCircle, ArrowRight, Zap,
  X
} from 'lucide-react';
import PublicLayout from '../../layouts/PublicLayout';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../context/UserContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5117';

const subjects = [
  {
    id: 'reasoning', icon: Brain, label: 'Reasoning', color: '#ec4899',
    syllabus: ['Analogy', 'Coding-Decoding', 'Blood Relations', 'Seating Arrangement', 'Syllogism', 'Number Series', 'Direction & Distance', 'Puzzles'],
    strategy: 'Focus on short-cut techniques. Solve 30-40 questions daily. Start with easy topics like Analogy and gradually move to Puzzles.',
    exams: ['SBI PO', 'IBPS Clerk', 'SSC CGL', 'RRB NTPC'],
    mockTests: 120, questions: 1800, avgScore: 78,
    topics: [{ name: 'Logical Reasoning', qs: 450 }, { name: 'Verbal Reasoning', qs: 380 }, { name: 'Non-Verbal Reasoning', qs: 320 }, { name: 'Analytical Reasoning', qs: 650 }]
  },
  {
    id: 'english', icon: BookOpen, label: 'English', color: '#3b82f6',
    syllabus: ['Reading Comprehension', 'Error Detection', 'Fill in the Blanks', 'Para Jumbles', 'Cloze Test', 'Vocabulary', 'Idioms & Phrases', 'One Word Substitution'],
    strategy: 'Read English newspapers daily. Focus on RC and Error Detection which carry maximum marks. Practice 20 passages per week.',
    exams: ['SBI PO', 'IBPS PO', 'SSC CHSL', 'RRB NTPC'],
    mockTests: 95, questions: 1500, avgScore: 72,
    topics: [{ name: 'Reading Comprehension', qs: 500 }, { name: 'Grammar & Error', qs: 400 }, { name: 'Vocabulary', qs: 350 }, { name: 'Para Jumbles', qs: 250 }]
  },
  {
    id: 'quant', icon: Calculator, label: 'Quantitative Aptitude', color: '#10b981',
    syllabus: ['Number System', 'Simplification', 'Percentage', 'Ratio & Proportion', 'Time & Work', 'Speed & Distance', 'Data Interpretation', 'Profit & Loss'],
    strategy: 'Master the basics first. Learn speed calculation techniques. DI is the most scoring — practice 5 sets daily.',
    exams: ['SBI PO', 'IBPS PO', 'SSC CGL', 'CAT'],
    mockTests: 140, questions: 2100, avgScore: 68,
    topics: [{ name: 'Arithmetic', qs: 700 }, { name: 'Algebra', qs: 400 }, { name: 'Data Interpretation', qs: 600 }, { name: 'Number System', qs: 400 }]
  },
  {
    id: 'gk', icon: Globe, label: 'General Knowledge', color: '#f59e0b',
    syllabus: ['Indian History', 'Indian Geography', 'Indian Polity', 'Economy', 'Science & Technology', 'Sports', 'Awards & Honours', 'International Affairs'],
    strategy: 'Read monthly current affairs capsules. Focus on last 6 months events. Static GK is equally important — use flashcards.',
    exams: ['UPSC', 'SSC CGL', 'RRB NTPC', 'Odisha Police'],
    mockTests: 110, questions: 1650, avgScore: 75,
    topics: [{ name: 'Static GK', qs: 600 }, { name: 'Current Affairs', qs: 550 }, { name: 'Science', qs: 350 }, { name: 'Geography', qs: 150 }]
  },
  {
    id: 'computer', icon: Cpu, label: 'Computer Awareness', color: '#8b5cf6',
    syllabus: ['Computer Fundamentals', 'MS Office', 'Operating Systems', 'Internet & Networking', 'Database', 'Cyber Security', 'Programming Basics', 'Computer History'],
    strategy: 'High-scoring section. Focus on MS Office shortcuts, Computer Fundamentals, and Networking. Can score 90%+ with 2 weeks preparation.',
    exams: ['IBPS Clerk', 'SBI Clerk', 'RRB NTPC', 'IBPS SO IT'],
    mockTests: 75, questions: 1100, avgScore: 82,
    topics: [{ name: 'Fundamentals', qs: 400 }, { name: 'MS Office', qs: 250 }, { name: 'Networking', qs: 250 }, { name: 'Other Topics', qs: 200 }]
  },
  {
    id: 'current', icon: TrendingUp, label: 'Current Affairs', color: '#06b6d4',
    syllabus: ['National News', 'International News', 'Economy & Finance', 'Sports & Awards', 'Science & Tech', 'Government Schemes', 'Appointments', 'Summits & Conferences'],
    strategy: 'Daily 30-minute current affairs reading is essential. Use ExamSphere daily quiz to test retention. Focus on the past 6 months.',
    exams: ['All Competitive Exams'],
    mockTests: 200, questions: 3000, avgScore: 70,
    topics: [{ name: 'National Affairs', qs: 1000 }, { name: 'International Affairs', qs: 800 }, { name: 'Economy', qs: 700 }, { name: 'Sports & Awards', qs: 500 }]
  },
  {
    id: 'banking', icon: Briefcase, label: 'Banking', color: '#4f46e5',
    syllabus: ['Banking Awareness', 'Financial Awareness', 'RBI & Monetary Policy', 'Banking History', 'Capital Markets', 'Insurance', 'Budget & Economic Survey', 'Financial Institutions'],
    strategy: 'Study RBI Annual Report. Focus on banking terminologies and recent policy changes. Read monthly banking current affairs.',
    exams: ['SBI PO', 'SBI Clerk', 'IBPS PO', 'IBPS Clerk', 'RBI Grade B'],
    mockTests: 90, questions: 1350, avgScore: 74,
    topics: [{ name: 'Banking Awareness', qs: 500 }, { name: 'Financial Awareness', qs: 400 }, { name: 'Economy', qs: 300 }, { name: 'Insurance', qs: 150 }]
  },
  {
    id: 'ssc', icon: Building2, label: 'SSC', color: '#84cc16',
    syllabus: ['General Intelligence', 'English Comprehension', 'Quantitative Aptitude', 'General Awareness', 'Tier 2: Statistics', 'Tier 2: General Studies', 'Descriptive Paper'],
    strategy: 'Follow SSC pattern strictly. Tier 1 and Tier 2 have different syllabi. Focus on speed and accuracy for Tier 1.',
    exams: ['SSC CGL', 'SSC CHSL', 'SSC MTS', 'SSC CPO', 'SSC GD'],
    mockTests: 130, questions: 1950, avgScore: 71,
    topics: [{ name: 'General Intelligence', qs: 600 }, { name: 'English', qs: 500 }, { name: 'Quant', qs: 500 }, { name: 'GK', qs: 350 }]
  },
  {
    id: 'railway', icon: Train, label: 'Railway', color: '#0ea5e9',
    syllabus: ['Mathematics', 'General Intelligence', 'General Science', 'General Awareness', 'Technical (Loco Pilot)', 'CBT Stage 1 & 2', 'Document Verification', 'Medical Standards'],
    strategy: 'RRB NTPC has CBT 1 and CBT 2. Focus on Science for RRB NTPC. For Group D, strengthen Mathematics and GS.',
    exams: ['RRB NTPC', 'RRB Group D', 'RRB ALP', 'RRB JE', 'RPF Constable'],
    mockTests: 100, questions: 1500, avgScore: 73,
    topics: [{ name: 'Mathematics', qs: 500 }, { name: 'General Science', qs: 400 }, { name: 'GI & Reasoning', qs: 400 }, { name: 'General Awareness', qs: 200 }]
  },
  {
    id: 'upsc', icon: Globe, label: 'UPSC', color: '#a855f7',
    syllabus: ['History', 'Geography', 'Polity & Governance', 'Economy', 'Environment & Ecology', 'Science & Technology', 'International Relations', 'Essay & Ethics'],
    strategy: 'UPSC is a marathon, not a sprint. Start with NCERT books. Build conceptual clarity before solving PYQs. Maintain answer writing practice.',
    exams: ['UPSC CSE Prelims', 'UPSC CSE Mains', 'UPSC IFS', 'UPSC CAPF'],
    mockTests: 85, questions: 1275, avgScore: 65,
    topics: [{ name: 'History & Culture', qs: 350 }, { name: 'Geography', qs: 300 }, { name: 'Polity', qs: 325 }, { name: 'Economy & Environment', qs: 300 }]
  },
  {
    id: 'odisha', icon: MapPin, label: 'Odisha Exams', color: '#f97316',
    syllabus: ['Odisha History', 'Odisha Geography', 'Odisha Polity', 'Odisha Economy', 'Odia Language', 'General Knowledge', 'Mathematics', 'Current Affairs Odisha'],
    strategy: 'Focus on Odisha-specific content — history, geography, culture, and recent state government schemes. Odia language is an added advantage.',
    exams: ['Odisha Police SI', 'OPSC OAS', 'OSSSC RI', 'Odisha Forest Guard', 'OPSC ORS'],
    mockTests: 70, questions: 1050, avgScore: 76,
    topics: [{ name: 'Odisha History & Culture', qs: 350 }, { name: 'Odisha Geography', qs: 250 }, { name: 'Odisha Polity', qs: 250 }, { name: 'Odia Language', qs: 200 }]
  }
];

// ─── Mock Test Card (handles Free / Paid logic) ───────────────────────────────
function MockTestCard({ test, index, activelabel, navigate }) {
  const [showPayModal, setShowPayModal] = useState(false);
  const [paid, setPaid] = useState(() => localStorage.getItem('unlocked_exam_' + test._id) === 'true');
  const [paying, setPaying] = useState(false);

  const isPaid = test.isPaid && !paid;

  const handlePay = () => {
    setPaying(true);
    // Simulate payment (replace with real payment gateway integration)
    setTimeout(() => {
      setPaying(false);
      setPaid(true);
      localStorage.setItem('unlocked_exam_' + test._id, 'true');
      setShowPayModal(false);
    }, 1800);
  };

  return (
    <>
      <div
        className="sc-card glass"
        style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          padding: '1.5rem', borderRadius: '16px',
          border: `1px solid ${test.isPaid ? 'rgba(245,158,11,0.35)' : 'var(--border)'}`,
          transition: 'var(--transition)', position: 'relative', overflow: 'hidden'
        }}
      >
        {/* Paid ribbon */}
        {test.isPaid && !paid && (
          <div style={{
            position: 'absolute', top: 14, right: -22, background: '#f59e0b',
            color: '#fff', fontSize: '0.65rem', fontWeight: 800,
            padding: '4px 32px', transform: 'rotate(40deg)',
            letterSpacing: '0.08em', boxShadow: '0 2px 8px rgba(245,158,11,0.4)'
          }}>PAID</div>
        )}
        {test.isPaid && paid && (
          <div style={{
            position: 'absolute', top: 14, right: -22, background: '#22c55e',
            color: '#fff', fontSize: '0.65rem', fontWeight: 800,
            padding: '4px 32px', transform: 'rotate(40deg)',
            letterSpacing: '0.08em', boxShadow: '0 2px 8px rgba(34,197,94,0.4)'
          }}>UNLOCKED</div>
        )}

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.75rem' }}>
            <span className="badge badge-orange">Mock Test {index + 1}</span>
            {test.isPaid ? (
              <span style={{
                padding: '2px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 800,
                background: paid ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)',
                border: `1px solid ${paid ? 'rgba(34,197,94,0.35)' : 'rgba(245,158,11,0.4)'}`,
                color: paid ? '#22c55e' : '#f59e0b'
              }}>
                {paid ? '✓ Unlocked' : `₹${test.price}`}
              </span>
            ) : (
              <span style={{
                padding: '2px 10px', borderRadius: '100px', fontSize: '0.72rem', fontWeight: 800,
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.35)',
                color: '#22c55e'
              }}>
                Free
              </span>
            )}
          </div>
          <h4 style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', lineHeight: '1.4' }}>
            {test.topicName || `${activelabel} Test #${index + 1}`}
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            <span>📋 {test.questions?.length || 0} Qs</span>
            <span>⏱️ {test.duration} mins</span>
            <span>🏆 {test.totalMarks} Marks</span>
          </div>
        </div>

        {/* CTA Button */}
        {isPaid ? (
          <button
            onClick={() => setShowPayModal(true)}
            style={{
              width: '100%', padding: '12px', borderRadius: '10px', fontWeight: 700,
              fontSize: '0.9rem', border: '1px solid rgba(245,158,11,0.5)',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: '0 4px 14px rgba(245,158,11,0.3)',
              transition: 'all 0.2s'
            }}
          >
            🔓 Unlock for ₹{test.price}
          </button>
        ) : (
          <button
            onClick={() => navigate(`/instructions?examId=${test._id}`)}
            className="btn btn-primary"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            Start Test <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* Payment Modal */}
      {showPayModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px'
        }}>
          <div className="glass" style={{
            width: '100%', maxWidth: '420px', borderRadius: '20px',
            border: '1px solid rgba(245,158,11,0.4)', padding: '36px', textAlign: 'center'
          }}>
            <div style={{
              width: '72px', height: '72px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '2rem', margin: '0 auto 20px'
            }}>💳</div>

            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
              Unlock This Test
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>
              {test.topicName || `Mock Test ${index + 1}`}
            </p>

            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '14px', padding: '16px 20px', marginBottom: '28px'
            }}>
              <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f59e0b' }}>₹{test.price}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>One-time access · No subscription</div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setShowPayModal(false)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '10px',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600
                }}
              >Cancel</button>
              <button
                onClick={handlePay}
                disabled={paying}
                style={{
                  flex: 2, padding: '12px', borderRadius: '10px', fontWeight: 700,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none', color: '#fff', cursor: paying ? 'not-allowed' : 'pointer',
                  opacity: paying ? 0.75 : 1, transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                }}
              >
                {paying ? '⏳ Processing...' : `Pay ₹${test.price} & Start`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function Services() {
  const navigate = useNavigate();
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [dbSubjects, setDbSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(() => localStorage.getItem('last_selected_subject') || '');
  const [showMockCards, setShowMockCards] = useState(false);
  const active = availableSubjects.find(s => s.id === activeId) || null;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.get('subject')) {
      setShowMockCards(false);
    }
    if (activeId) {
      localStorage.setItem('last_selected_subject', activeId);
    }
  }, [activeId]);

  useEffect(() => {
    if (availableSubjects.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const subParam = params.get('subject');
      if (subParam) {
        const found = availableSubjects.find(s => 
          (s.label || '').trim().toLowerCase() === subParam.trim().toLowerCase() ||
          (s.id || '').trim().toLowerCase() === subParam.trim().toLowerCase()
        );
        if (found) {
          setActiveId(found.id);
          setShowMockCards(true);
          setTimeout(() => {
            const el = document.getElementById('mock-tests-section');
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 350);
        }
      }
    }
  }, [availableSubjects]);

  const [heroContent, setHeroContent] = useState({
    heroTitle: 'Master Every Subject',
    heroSubtitle: 'Explore comprehensive preparation material, syllabus, strategies and mock tests for every competitive exam subject.',
  });

  useEffect(() => {
    const fetchContentAndExams = async () => {
      try {
        const pageRes = await fetch(`${API}/api/page-content/courses`);
        const pageData = await pageRes.json();
        if (pageData) setHeroContent(prev => ({ ...prev, ...pageData }));
      } catch (err) {
        console.warn('[Services] Could not load custom page content:', err);
      }

      try {
        // Fetch exams and DB subjects in parallel
        const [examsRes, subjectsRes] = await Promise.all([
          fetch(`${API}/api/exams`),
          fetch(`${API}/api/subjects`)
        ]);
        const examsData = await examsRes.json();
        const subjectsData = await subjectsRes.json();
        setExams(examsData);
        setDbSubjects(subjectsData);

        const dbSubjectNames = new Set(examsData.map(e => (e.subjectName || '').trim().toLowerCase()));

        // Build the dynamic list of subjects from DB matching active exams
        const dynamicSubjects = subjectsData
          .filter(dbSub => dbSubjectNames.has(dbSub.name.trim().toLowerCase()))
          .map((dbSub, idx) => {
            const staticMatch = subjects.find(s =>
              s.label.trim().toLowerCase() === dbSub.name.trim().toLowerCase() ||
              s.id.trim().toLowerCase() === dbSub.name.trim().toLowerCase()
            );

            const fallbackColors = ['#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#4f46e5', '#84cc16', '#0ea5e9', '#a855f7', '#f97316'];
            const color = staticMatch?.color || fallbackColors[idx % fallbackColors.length];
            const icon = staticMatch?.icon || Award;

            return {
              id: dbSub.name.trim().toLowerCase(),
              label: dbSub.name,
              icon,
              color,
              syllabus: dbSub.syllabusPoints && dbSub.syllabusPoints.length > 0 ? dbSub.syllabusPoints : (staticMatch?.syllabus || []),
              strategy: dbSub.preparationStrategy || staticMatch?.strategy || '',
              exams: dbSub.applicableExams && dbSub.applicableExams.length > 0 ? dbSub.applicableExams : (staticMatch?.exams || [])
            };
          });

        setAvailableSubjects(dynamicSubjects);
        if (dynamicSubjects.length > 0) {
          const savedSub = localStorage.getItem('last_selected_subject');
          const isValid = dynamicSubjects.some(s => s.id === savedSub);
          setActiveId(isValid ? savedSub : dynamicSubjects[0].id);
        }
      } catch (err) {
        console.error('[Services] Failed to fetch exams or filter subjects:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContentAndExams();
  }, []);

  return (
    <PublicLayout>
      {/* Hero — Text only, no images */}
      <section className="page-hero page-hero--courses-text">
        <div className="orb orb-orange" style={{ width: 500, height: 500, top: -150, right: -100, opacity: 0.35 }} />
        <div className="orb" style={{ width: 300, height: 300, bottom: -80, left: -60, background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)' }} />
        <div className="container">
          <motion.div
            className="page-hero__text-center"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
            }}
          >
            <motion.div
              className="section-label page-hero__label"
              variants={{
                hidden: { opacity: 0, x: -20 },
                visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
              }}
            >
              <Zap size={12} /> Subject Modules
            </motion.div>

            <motion.h1
              className="page-hero__title"
              variants={{
                hidden: { opacity: 0, y: 24 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.65 } }
              }}
            >
              {heroContent.heroTitle}
            </motion.h1>

            <motion.p
              className="page-hero__subtitle page-hero__subtitle--wide"
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay: 0.1 } }
              }}
            >
              {heroContent.heroSubtitle}
            </motion.p>

            {/* Decorative subject pill strip */}
            <motion.div
              className="courses-hero-pills"
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.25 } }
              }}
            >
              {['Reasoning', 'English', 'Quant', 'GK', 'Computer', 'Banking', 'SSC', 'Railway', 'UPSC', 'Odisha Exams'].map((pill, i) => (
                <span key={pill} className="courses-hero-pill" style={{ animationDelay: `${i * 0.08}s` }}>{pill}</span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>


      {/* Main Layout */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <div className="loading-spinner" style={{ border: '4px solid rgba(255, 107, 0, 0.1)', borderTop: '4px solid var(--primary)', borderRadius: '50%', width: 40, height: 40, animation: 'spin 1s linear infinite' }} />
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      ) : availableSubjects.length === 0 ? (
        <div className="container" style={{ textAlign: 'center', padding: '80px 24px', minHeight: '400px' }}>
          <BookOpen size={64} style={{ opacity: 0.15, marginBottom: 16, color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.4rem', color: 'var(--text-primary)', marginBottom: 8 }}>No subject modules available</h3>
          <p style={{ color: 'var(--text-muted)' }}>There are currently no active exams or topics defined in the database.</p>
        </div>
      ) : (
        <div className="services-layout">
          {/* Left Nav */}
          <aside className="services-nav glass">
            <div className="services-nav__title">Subjects</div>
            {availableSubjects.map((s) => (
              <button
                key={s.id}
                className={`services-nav__item ${activeId === s.id ? 'services-nav__item--active' : ''}`}
                onClick={() => setActiveId(s.id)}
                style={{ '--subject-color': s.color }}
              >
                <div className="services-nav__icon" style={{ background: activeId === s.id ? s.color : 'transparent', borderColor: s.color }}>
                  <s.icon size={16} />
                </div>
                <span>{s.label}</span>
                <ChevronRight size={14} className="services-nav__chevron" />
              </button>
            ))}
          </aside>

          {/* Right Content */}
          <main className="services-content">
            {active && (() => {
              const dbSub = dbSubjects.find(s =>
                s.name.trim().toLowerCase() === active.label.trim().toLowerCase()
              );
              const description = dbSub?.description || '';

              return (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={active.id}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -30 }}
                    transition={{ duration: 0.35 }}
                  >
                    {/* Header */}
                    <div className="sc-header">
                      <div className="sc-header__icon" style={{ background: active.color }}>
                        <active.icon size={28} />
                      </div>
                      <div>
                        <h2 className="sc-header__title">{active.label}</h2>
                        {description && (
                          <p style={{ 
                            color: 'var(--text-secondary)', 
                            fontSize: '0.95rem', 
                            marginTop: '8px', 
                            lineHeight: '1.6',
                            maxWidth: '650px',
                            fontWeight: 400
                          }}>
                            {description}
                          </p>
                        )}
                      </div>
                    </div>

                  {(() => {
                    // Compute live stats
                    const subjectExamsAll = exams.filter(e =>
                      (e.subjectName || '').trim().toLowerCase() === active.label.trim().toLowerCase() ||
                      (e.subjectName || '').trim().toLowerCase() === active.id.trim().toLowerCase()
                    );
                    const liveMockTests = subjectExamsAll.length;
                    const liveQuestions = subjectExamsAll.reduce((sum, e) => sum + (e.questions?.length || 0), 0);
                    const liveAvgScore = subjectExamsAll.length > 0
                      ? Math.round(subjectExamsAll.reduce((sum, e) => sum + (e.totalMarks || 0), 0) / subjectExamsAll.length)
                      : 0;

                    // Get DB subject data for syllabus & strategy
                    const dbSub = dbSubjects.find(s =>
                      s.name.trim().toLowerCase() === active.label.trim().toLowerCase()
                    );
                    const syllabus = dbSub?.syllabusPoints || active.syllabus || [];
                    const strategy = dbSub?.preparationStrategy || active.strategy || '';
                    const applicableExams = (dbSub?.applicableExams?.length > 0)
                      ? dbSub.applicableExams
                      : (active.exams || []);

                    return (
                      <>
                        {/* Live Stats Row */}
                        <div className="sc-stats">
                          <div className="sc-stat glass">
                            <div className="sc-stat__val">{liveMockTests}</div>
                            <div className="sc-stat__label">Mock Tests</div>
                          </div>
                          <div className="sc-stat glass">
                            <div className="sc-stat__val">{liveQuestions.toLocaleString()}</div>
                            <div className="sc-stat__label">Questions</div>
                          </div>
                          <div className="sc-stat glass">
                            <div className="sc-stat__val">{liveAvgScore}</div>
                            <div className="sc-stat__label">Avg. Score</div>
                          </div>
                        </div>

                        <div className="sc-grid">
                          {/* Syllabus */}
                          {syllabus.length > 0 && (
                            <div className="sc-card glass">
                              <h3 className="sc-card__title"><BookOpen size={16} /> Syllabus Coverage</h3>
                              <ul className="sc-list">
                                {syllabus.map((item) => (
                                  <li key={item}><CheckCircle size={13} />{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Strategy */}
                          {strategy && (
                            <div className="sc-card glass">
                              <h3 className="sc-card__title"><Target size={16} /> Preparation Strategy</h3>
                              <p className="sc-card__text">{strategy}</p>
                              {applicableExams.length > 0 && (
                                <div className="sc-exams">
                                  <div className="sc-exams__label">Applicable Exams:</div>
                                  <div className="sc-exams__tags">
                                    {applicableExams.map(e => <span key={e} className="badge badge-orange">{e}</span>)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {/* CTA Section */}
                        <motion.div className="sc-cta glass" whileHover={{ borderColor: 'var(--border-orange)' }}>
                          <div>
                            <h3 className="sc-cta__title">Ready to master {active.label}?</h3>
                            <p className="sc-cta__sub">Access {liveMockTests} mock tests and {liveQuestions.toLocaleString()} practice questions</p>
                          </div>
                          <button
                            onClick={() => {
                              setShowMockCards(true);
                              setTimeout(() => {
                                const el = document.getElementById('mock-tests-section');
                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                              }, 100);
                            }}
                            className="btn btn-primary"
                          >
                            Start Practicing <ArrowRight size={16} />
                          </button>
                        </motion.div>
                      </>
                    );
                  })()}
                  {/* Available Mock Tests Cards Section */}
                  {showMockCards && (() => {
                    const subjectExams = exams.filter(e =>
                      (e.subjectName || '').trim().toLowerCase() === active?.label.trim().toLowerCase() ||
                      (e.subjectName || '').trim().toLowerCase() === active?.id.trim().toLowerCase()
                    );
                    return (
                      <div id="mock-tests-section" style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          Practice Mock Tests for {active.label}
                        </h3>
                        {subjectExams.length === 0 ? (
                          <div className="sc-card glass" style={{ padding: '2rem', textAlign: 'center' }}>
                            <p style={{ color: 'var(--text-muted)' }}>No mock tests uploaded for this subject yet. Check back soon!</p>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
                            {subjectExams.map((test, index) => (
                              <MockTestCard
                                key={test._id}
                                test={test}
                                index={index}
                                activelabel={active.label}
                                navigate={navigate}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </motion.div>
              </AnimatePresence>
            );
          })()}
          </main>
        </div>
      )}
    </PublicLayout>
  );
}
