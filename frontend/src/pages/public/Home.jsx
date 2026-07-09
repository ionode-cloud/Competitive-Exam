import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useInView } from 'react-intersection-observer';
import CountUp from 'react-countup';
import { TypeAnimation } from 'react-type-animation';
import { useUser } from '../../context/UserContext';
import { useCourse } from '../../context/CourseContext';
import {
  Zap, BookOpen, BarChart2, Users, Star, Trophy, Clock, ChevronRight,
  Target, TrendingUp, Shield, Award, CheckCircle, Play, ArrowRight,
  Brain, Calculator, Globe, Cpu, Briefcase, Train, Building2, MapPin,
  ChevronDown, Quote, Activity, Calendar, X, Image as ImageIcon
} from 'lucide-react';
import PublicLayout from '../../layouts/PublicLayout';

const CountUpComponent = typeof CountUp === 'function' ? CountUp : (CountUp?.default || CountUp);

/* =============================================
   STAT COUNTER CARD
   ============================================= */
function StatCard({ value, suffix, label, icon: Icon, delay = 0 }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.3 });
  return (
    <motion.div
      ref={ref}
      className="stat-card glass"
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      <div className="stat-card__icon">
        <Icon size={22} />
      </div>
      <div className="stat-card__value">
        {inView ? <CountUpComponent end={value} duration={2.5} separator="," suffix={suffix} /> : '0'}
      </div>
      <div className="stat-card__label">{label}</div>
    </motion.div>
  );
}

/* =============================================
   TESTIMONIAL CARD
   ============================================= */
function TestimonialCard({ name, exam, score, text, avatar, delay }) {
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.2 });
  return (
    <motion.div
      ref={ref}
      className="testimonial-card glass"
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay }}
    >
      <Quote size={24} className="testimonial-card__quote" />
      <p className="testimonial-card__text">{text}</p>
      <div className="testimonial-card__author">
        <div className="testimonial-card__avatar">{avatar}</div>
        <div>
          <div className="testimonial-card__name">{name}</div>
          <div className="testimonial-card__exam">{exam} • Score: {score}%</div>
        </div>
        <div className="testimonial-card__stars">
          {[...Array(5)].map((_, i) => <Star key={i} size={12} fill="currentColor" />)}
        </div>
      </div>
    </motion.div>
  );
}

/* =============================================
   FAQ ITEM
   ============================================= */
function FaqItem({ q, a, index }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      className={`faq-item glass ${open ? 'faq-item--open' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.07 }}
    >
      <button className="faq-item__question" onClick={() => setOpen((p) => !p)}>
        <span>{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <ChevronDown size={18} />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="faq-item__answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <p>{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* =============================================
   DATA
   ============================================= */
const DEFAULT_STATS = [
  { value: 50, suffix: 'K+', label: 'Students Enrolled', icon: Users },
  { value: 10, suffix: 'K+', label: 'Practice Questions', icon: BookOpen },
  { value: 500, suffix: '+', label: 'Mock Tests', icon: Target },
  { value: 95, suffix: '%', label: 'Success Rate', icon: Trophy },
];

const ICON_STAT_MAP = { Users, BookOpen, Target, Trophy, BarChart2, TrendingUp, Star, Clock, Shield, Award };

const testimonials = [
  { name: 'Priya Sharma', exam: 'SBI PO', score: 87, avatar: 'PS', text: 'ExamSphere helped me crack SBI PO in my first attempt! The mock tests are spot-on with the actual exam pattern.', delay: 0 },
  { name: 'Rahul Kumar', exam: 'SSC CGL', score: 92, avatar: 'RK', text: 'The detailed analytics after each test helped me identify my weak areas. Cleared SSC CGL Tier 2 with 98 percentile!', delay: 0.1 },
  { name: 'Anjali Patel', exam: 'IBPS Clerk', score: 84, avatar: 'AP', text: 'Best platform for banking exam prep! The current affairs section is updated daily and extremely helpful.', delay: 0.2 },
  { name: 'Deepak Nayak', exam: 'Odisha Police', score: 79, avatar: 'DN', text: 'Specifically the Odisha exam tests are amazing. Questions are very similar to actual exams. Highly recommended!', delay: 0.3 },
];

const DEFAULT_FEATURES = [
  { icon: 'Target', title: 'Exam-Pattern Tests', desc: 'Tests crafted exactly like real competitive exams with updated patterns.' },
  { icon: 'BarChart2', title: 'Deep Analytics', desc: 'Section-wise performance, accuracy, rank, and improvement suggestions.' },
  { icon: 'TrendingUp', title: 'Adaptive Learning', desc: 'AI-powered recommendations based on your weak areas.' },
  { icon: 'Clock', title: 'Real-Time Timer', desc: 'Actual exam environment with auto-submit and time warnings.' },
];

const FEATURE_ICON_MAP = {
  Target, BarChart2, TrendingUp, Clock, Shield, Award, Zap, Star, BookOpen, Trophy, Brain, Globe, Cpu
};

const faqs = [
  { q: 'Are the mock tests free?', a: 'Yes! Test 1 and Test 2 are completely free. Premium tests (Test 3, 4, 5) can be unlocked for ₹500 which gives you lifetime access.' },
  { q: 'How often is the content updated?', a: 'Our question bank is updated weekly with new questions. Current Affairs section is updated daily to cover the latest events.' },
  { q: 'Can I access ExamSphere on mobile?', a: 'Absolutely! ExamSphere is fully responsive and works seamlessly on mobile, tablet, and desktop devices.' },
  { q: 'What exams does ExamSphere cover?', a: 'We cover Banking (SBI, IBPS, RBI), SSC (CGL, CHSL, MTS), Railway (RRB NTPC, Group D), UPSC, and all major Odisha state competitive exams.' },
  { q: 'How is ranking calculated?', a: 'Rankings are based on your score, time taken, and accuracy compared to all other students who attempted the same test in the last 30 days.' },
  { q: 'Is there a certificate after completing tests?', a: 'Yes! You receive a digital certificate for every test you complete with a score above 60%. These can be shared on LinkedIn or downloaded as PDF.' },
];

/* =============================================
   HOME PAGE
   ============================================= */
const API = import.meta.env.VITE_API_URL || 'http://localhost:5117';

export default function Home() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const { openRegister, openLoginForExam, user } = useUser();
  const navigate = useNavigate();

  // Smart attempt handler: check login then go to instructions
  const handleAttemptExam = (examId) => {
    if (user) {
      // Already logged in → go straight to instructions
      navigate(`/instructions?examId=${examId}`);
    } else {
      // Not logged in → save pending exam, open login/register modal
      openLoginForExam(examId);
    }
  };

  // For cards without an examId (static fallback), just open register
  const handleAttemptStatic = () => {
    if (user) {
      navigate('/dashboard?tab=payments');
    } else {
      openRegister();
    }
  };

  const [activeSlide, setActiveSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const { courses, fetchCourses } = useCourse();
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const videoCourses = (courses || []).filter(c => c.videoUrl);

  const getYoutubeThumbnail = (url) => {
    if (!url) return null;
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/0.jpg`;
    }
    return null;
  };

  const getEmbedUrl = (url) => {
    if (!url) return '';
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  const DEFAULT_GALLERY_GRID = [
    { url: 'https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=500', desc: 'Expert Mentorship Seminars for Bank Exams Prep' },
    { url: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=500', desc: 'High Scoring Study Circle Discussions & Group Work' },
    { url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500', desc: '50K+ Enrolled Students Success Milestone Celebration' },
    { url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=500', desc: 'Live Analytics Dashboard & Real-Time Practice Environment' },
    { url: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=500', desc: 'Interactive Online Live Lectures with Chat & QA Support' },
    { url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500', desc: 'Weekly Doubt Solving Classrooms for OPSC and regional tests' },
    { url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500', desc: 'Comprehensive Syllabus Coverages with PDF Notes' },
    { url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500', desc: 'Industry-Leading Success Ratio achieved in SSC Mocks' },
  ];

  const [content, setContent] = useState({
    heroBadge: "India's #1 Exam Prep Platform",
    heroTitle: "Crack Your Dream Exam with ExamSphere",
    heroDesc: "Practice with 10,000+ questions, track your progress with deep analytics, and get AI-powered recommendations to maximize your score.",
    carouselImages: [
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=60"
    ],
    stats: DEFAULT_STATS,
    features: DEFAULT_FEATURES,
    ctaTitle: "Start Your Success Journey Today",
    ctaDesc: "Free mock tests, daily current affairs, expert strategies — all in one platform.",
    galleryGrid: DEFAULT_GALLERY_GRID
  });

  // Live data from DB
  const [liveSchedules, setLiveSchedules] = useState([]);
  const [trendingTests, setTrendingTests] = useState([]);
  const [liveDataLoading, setLiveDataLoading] = useState(true);
  // Subjects (for "Prepare for Every Exam")
  const [dbSubjects, setDbSubjects] = useState([]);
  // Exams by topic (for "Trending Mock Tests")
  const [dbExams, setDbExams] = useState([]);

  const carouselImages = content.carouselImages && content.carouselImages.length > 0
    ? content.carouselImages
    : [
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=600&auto=format&fit=crop&q=60",
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=600&auto=format&fit=crop&q=60"
    ];

  useEffect(() => {
    if (activeSlide >= carouselImages.length) setActiveSlide(0);
  }, [carouselImages.length, activeSlide]);

  useEffect(() => {
    if (isHovered || carouselImages.length <= 1) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % carouselImages.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isHovered, carouselImages.length]);

  // Fetch page content from admin settings
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5117';
        const res = await axios.get(`${API_URL}/api/page-content/home`);
        if (res.data) {
          setContent(prev => ({
            ...prev,
            ...res.data,
            galleryGrid: res.data.galleryGrid || prev.galleryGrid
          }));
        }
      } catch (err) {
        console.warn('Failed to load customized Home content, using defaults.', err);
      }
    };
    fetchContent();
  }, []);

  // Fetch live schedules, trending tests, subjects, and exams from DB
  useEffect(() => {
    const fetchLiveData = async () => {
      setLiveDataLoading(true);
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5117';

        const liveExamsUrl = content.selectedSchedules && content.selectedSchedules.length > 0
          ? `${API_URL}/api/exams?ids=${content.selectedSchedules.join(',')}`
          : null;

        const trendingExamsUrl = content.selectedMockTests && content.selectedMockTests.length > 0
          ? `${API_URL}/api/exams?ids=${content.selectedMockTests.join(',')}`
          : null;

        const [liveExamsRes, trendingExamsRes, subjectsRes, examsRes] = await Promise.allSettled([
          liveExamsUrl ? axios.get(liveExamsUrl) : Promise.resolve({ data: [] }),
          trendingExamsUrl ? axios.get(trendingExamsUrl) : Promise.resolve({ data: [] }),
          axios.get(`${API_URL}/api/subjects`),
          axios.get(`${API_URL}/api/exams`),
        ]);

        if (liveExamsRes.status === 'fulfilled') setLiveSchedules(liveExamsRes.value.data || []);
        if (trendingExamsRes.status === 'fulfilled') setTrendingTests(trendingExamsRes.value.data || []);
        if (subjectsRes.status === 'fulfilled') setDbSubjects((subjectsRes.value.data || []).filter(s => s.isActive !== false));
        if (examsRes.status === 'fulfilled') setDbExams((examsRes.value.data || []).filter(e => e.isActive !== false));
      } catch (err) {
        console.warn('Failed to load live data', err);
      } finally {
        setLiveDataLoading(false);
      }
    };
    fetchLiveData();
  }, [content.selectedSchedules, content.selectedMockTests]);

  // Build stats array with icon fallback
  const resolvedStats = (content.stats && content.stats.length ? content.stats : DEFAULT_STATS).map((s, i) => ({
    ...s,
    icon: DEFAULT_STATS[i]?.icon || Target,
  }));

  // Build features with icon resolution
  const resolvedFeatures = (content.features && content.features.length ? content.features : DEFAULT_FEATURES).map(f => ({
    ...f,
    iconComponent: FEATURE_ICON_MAP[f.icon] || Target,
  }));

  return (
    <PublicLayout>
      {/* ==============================
          HERO SECTION
          ============================== */}
      <section className="hero" ref={heroRef} style={{ position: 'relative' }}>
        {/* Background */}
        <div className="hero__bg">
          <div className="orb orb-orange" style={{ width: 600, height: 600, top: -100, right: -100, animationDelay: '0s' }} />
          <div className="orb orb-blue" style={{ width: 400, height: 400, bottom: 0, left: -80, animationDelay: '2s' }} />
          <div className="orb orb-purple" style={{ width: 300, height: 300, top: '40%', left: '30%', animationDelay: '4s' }} />
          <div className="hero__dot-grid dot-grid" />
        </div>

        <motion.div className="hero__content" style={{ y: heroY, opacity: heroOpacity }}>
          <div className="container">
            <div className="hero__inner">
              {/* Left — Text */}
              <div className="hero__text">
                <motion.div
                  className="section-label"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <Zap size={12} /> {content.heroBadge}
                </motion.div>

                <motion.h1
                  className="hero__heading"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.1 }}
                >
                  {content.heroTitle.split(' ').map((word, idx) => {
                    if (word.toLowerCase().includes('exam') || word.toLowerCase().includes('examsphere')) {
                      return <span key={idx} className="gradient-text"> {word}</span>;
                    }
                    return <React.Fragment key={idx}> {word}</React.Fragment>;
                  })}
                </motion.h1>

                <motion.div
                  className="hero__typewriter"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                >
                  <TypeAnimation
                    sequence={[
                      "India's Smartest Competitive Exam Platform", 2000,
                      'Prepare for Banking, SSC, Railway & More', 2000,
                      'AI-Powered Mock Tests & Analytics', 2000,
                      '50,000+ Students Trust ExamSphere', 2000,
                    ]}
                    wrapper="span"
                    repeat={Infinity}
                    speed={50}
                  />
                </motion.div>

                <motion.p
                  className="hero__desc"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                >
                  {content.heroDesc}
                </motion.p>

                <motion.div
                  className="hero__actions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.45 }}
                >
                  <button onClick={openRegister} className="btn btn-primary btn-lg">
                    <Zap size={18} /> Start Free Test
                  </button>
                  <Link to="/courses" className="btn btn-ghost btn-lg">
                    <BookOpen size={18} /> Explore Courses
                  </Link>
                </motion.div>

                {/* Trust Badges */}
                <motion.div
                  className="hero__trust"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                >
                  <div className="hero__trust-item">
                    <CheckCircle size={14} className="text-success" />
                    No Credit Card Required
                  </div>
                  <div className="hero__trust-item">
                    <CheckCircle size={14} className="text-success" />
                    Free Forever Plan
                  </div>
                  <div className="hero__trust-item">
                    <CheckCircle size={14} className="text-success" />
                    Updated Daily
                  </div>
                </motion.div>
              </div>

              {/* Right — Auto Scroll Carousel */}
              <div
                className="hero__carousel-container"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <AnimatePresence mode="wait">
                  {carouselImages.map((imageSrc, idx) => {
                    if (idx !== activeSlide) return null;
                    return (
                      <motion.div
                        key={idx}
                        className="hero__carousel-image-wrapper glass"
                        initial={{ opacity: 0, x: 40, scale: 0.96 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -40, scale: 0.96 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                      >
                        <img
                          src={imageSrc}
                          alt={`Slide ${idx + 1}`}
                          className="hero__carousel-image"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=600&auto=format&fit=crop&q=60";
                          }}
                        />
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {/* Navigation Arrows */}
                {carouselImages.length > 1 && (
                  <>
                    <button
                      className="carousel-arrow carousel-arrow--left"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
                      }}
                      aria-label="Previous slide"
                    >
                      <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} />
                    </button>
                    <button
                      className="carousel-arrow carousel-arrow--right"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveSlide((prev) => (prev + 1) % carouselImages.length);
                      }}
                      aria-label="Next slide"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </>
                )}

                {/* Indicator Dots */}
                {carouselImages.length > 1 && (
                  <div className="carousel-dots">
                    {carouselImages.map((_, idx) => (
                      <button
                        key={idx}
                        className={`carousel-dot ${idx === activeSlide ? 'active' : ''}`}
                        onClick={() => setActiveSlide(idx)}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Floating badges */}
                <motion.div
                  className="hero__badge-float hero__badge-float--rank"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Trophy size={16} />
                  <span>Rank #1 in India</span>
                </motion.div>
                <motion.div
                  className="hero__badge-float hero__badge-float--users"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                >
                  <Users size={16} />
                  <span>50K+ Students</span>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="hero__scroll"
          animate={{ y: [0, 8, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown size={24} />
        </motion.div>
      </section>

      {/* ==============================
          STATS SECTION
          ============================== */}
      <section className="section stats-section">
        <div className="container">
          <div className="stats-grid">
            {resolvedStats.map((s, idx) => (
              <StatCard key={s.label} value={s.value} suffix={s.suffix} label={s.label} icon={s.icon} delay={idx * 0.1} />
            ))}
          </div>
        </div>
      </section>

      {/* ==============================
          PREPARE FOR EVERY EXAM — DB SUBJECTS
          ============================== */}
      <section className="section" style={{ background: 'rgba(255, 255, 255, 0.015)', borderTop: '1px solid rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
        <div className="container">
          {/* Section header with View All */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
            <div className="section-header" style={{ marginBottom: 0, flex: 1 }}>
              <motion.div className="section-label" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }}>
                <BookOpen size={12} /> Exam Categories
              </motion.div>
              <motion.h2 className="section-title" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                Prepare for <span className="gradient-text">Every Exam</span>
              </motion.h2>
              <motion.p className="section-subtitle" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                Comprehensive preparation material for all major competitive exams in India
              </motion.p>
            </div>
            <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
              <Link
                to="/dashboard?tab=payments"
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
              >
                View All <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          {/* Live Exams (selected exams from DB) or DB Subjects or static fallback */}
          {liveSchedules.length > 0 ? (
            <div className="exams-grid">
              {liveSchedules.map((exam, i) => (
                <motion.div
                  key={exam._id || i}
                  className="exam-list-card glass"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="elc__top">
                    <span className="badge badge-orange">{exam.subjectName || 'General'}</span>
                    <span className={`elc__difficulty ${exam.isPaid ? 'hard' : 'medium'}`}>
                      {exam.isPaid ? `₹${exam.price || 49}` : 'Free'}
                    </span>
                  </div>
                  <h3 className="elc__title">{exam.topicName || exam.subjectName}</h3>
                  <div className="elc__meta">
                    <span><BookOpen size={13} /> {exam.questions?.length || 0} Qs</span>
                    <span><Clock size={13} /> {exam.duration} min</span>
                    {exam.negativeMarking > 0 && <span>⚡ -{exam.negativeMarking} marking</span>}
                  </div>
                  <button onClick={() => handleAttemptExam(exam._id)} className="btn btn-primary btn-sm elc__btn">
                    Attempt Now <ArrowRight size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : dbSubjects.length > 0 ? (
            <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.75rem' }}>
              {(() => {
                const SUBJECT_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f97316', '#ec4899', '#06b6d4', '#84cc16'];
                const SUBJECT_ICONS = [Briefcase, Building2, Train, Globe, MapPin, Brain, Calculator, Cpu];
                const getPastel = (c) => {
                  switch (c) {
                    case '#3b82f6': return '#e3f2fd';
                    case '#8b5cf6': return '#f3e5f5';
                    case '#10b981': return '#e8f5e9';
                    case '#f59e0b': return '#fff8e1';
                    case '#f97316': return '#fff3e0';
                    case '#ec4899': return '#fce4ec';
                    case '#06b6d4': return '#e0f7fa';
                    case '#84cc16': return '#f1f8e9';
                    default: return '#fff5f0';
                  }
                };
                return dbSubjects.slice(0, 8).map((subj, i) => {
                  const Icon = SUBJECT_ICONS[i % SUBJECT_ICONS.length];
                  const color = SUBJECT_COLORS[i % SUBJECT_COLORS.length];
                  const pastel = getPastel(color);
                  const examCount = dbExams.filter(e => e.subjectName === subj.name).length;
                  return (
                    <motion.div
                      key={subj._id || subj.name}
                      onClick={() => navigate(`/services?subject=${encodeURIComponent(subj.name)}`)}
                      className="category-card"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      whileHover={{ y: -8, scale: 1.02, boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}
                      style={{
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        background: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {/* Top Half: Pastel background with pattern overlay and icon */}
                      <div style={{
                        height: '135px',
                        width: '100%',
                        background: pastel,
                        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 100%), url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h24v24H0V0zm12 12l12-12H0L12 12zm0 0L0 24h24L12 12z' fill='rgba(0,0,0,0.025)' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid rgba(0,0,0,0.06)'
                      }}>
                        <Icon size={38} color={color} style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))' }} />
                      </div>

                      {/* Bottom Half: Solid white block with text content */}
                      <div style={{
                        padding: '1.25rem 1rem',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        flex: 1
                      }}>
                        <h3 className="category-card__label" style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem', textTransform: 'capitalize' }}>
                          {subj.name}
                        </h3>
                        <p className="category-card__count" style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4', margin: 0 }}>
                          {subj.description ? subj.description : `${examCount > 0 ? `${examCount} exams` : 'Practice mock tests'} available for immediate preparation`}
                        </p>
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          ) : (
            /* Static fallback when no subjects in DB */
            <div className="categories-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.75rem' }}>
              {(() => {
                const getPastel = (c) => {
                  switch (c) {
                    case '#3b82f6': return '#e3f2fd';
                    case '#8b5cf6': return '#f3e5f5';
                    case '#10b981': return '#e8f5e9';
                    case '#f59e0b': return '#fff8e1';
                    case '#f97316': return '#fff3e0';
                    case '#ec4899': return '#fce4ec';
                    case '#06b6d4': return '#e0f7fa';
                    case '#84cc16': return '#f1f8e9';
                    default: return '#fff5f0';
                  }
                };
                const STATIC_DESCRIPTIONS = {
                  'Banking & Finance': 'Prepare for SBI PO, IBPS Clerk, and all major banking exams.',
                  'SSC Exams': 'Master SSC CGL, CHSL, MTS with latest pattern mocks.',
                  'Railway (RRB)': 'Cracking NTPC, Group D with standard practice test series.',
                  'UPSC Civil Services': 'In-depth GS and CSAT tests designed by top experts.',
                  'Odisha State Exams': 'Odisha SI, OPSC and regional exam mock test series.',
                  'Reasoning': 'Improve logical flow, syllogism and analytical skills.',
                  'Quantitative Aptitude': 'Sharpen calculation speed, arithmetic and algebra.',
                  'Computer Awareness': 'Excel in basic computer questions, MS Office & networking.'
                };
                return [
                  { icon: Briefcase, label: 'Banking & Finance', count: 120, color: '#3b82f6' },
                  { icon: Building2, label: 'SSC Exams', count: 85, color: '#8b5cf6' },
                  { icon: Train, label: 'Railway (RRB)', count: 60, color: '#10b981' },
                  { icon: Globe, label: 'UPSC Civil Services', count: 45, color: '#f59e0b' },
                  { icon: MapPin, label: 'Odisha State Exams', count: 70, color: '#f97316' },
                  { icon: Brain, label: 'Reasoning', count: 200, color: '#ec4899' },
                  { icon: Calculator, label: 'Quantitative Aptitude', count: 180, color: '#06b6d4' },
                  { icon: Cpu, label: 'Computer Awareness', count: 90, color: '#84cc16' },
                ].map((cat, i) => {
                  const Icon = cat.icon;
                  const pastel = getPastel(cat.color);
                  const desc = STATIC_DESCRIPTIONS[cat.label] || 'Start preparing with our latest pattern mock exams.';
                  return (
                    <motion.div
                      key={cat.label}
                      onClick={() => navigate(`/services?subject=${encodeURIComponent(cat.label)}`)}
                      className="category-card"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: i * 0.05 }}
                      whileHover={{ y: -8, scale: 1.02, boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}
                      style={{
                        borderRadius: '12px',
                        border: '1px solid rgba(0,0,0,0.08)',
                        background: '#ffffff',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                      }}
                    >
                      {/* Top Half: Pastel background with pattern overlay and icon */}
                      <div style={{
                        height: '135px',
                        width: '100%',
                        background: pastel,
                        backgroundImage: `radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 100%), url("data:image/svg+xml,%3Csvg width='24' height='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h24v24H0V0zm12 12l12-12H0L12 12zm0 0L0 24h24L12 12z' fill='rgba(0,0,0,0.025)' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: '1px solid rgba(0,0,0,0.06)'
                      }}>
                        <Icon size={38} color={cat.color} style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))' }} />
                      </div>

                      {/* Bottom Half: Solid white block with text content */}
                      <div style={{
                        padding: '1.25rem 1rem',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        flex: 1
                      }}>
                        <h3 className="category-card__label" style={{ fontSize: '1rem', fontWeight: 800, color: '#1e293b', marginBottom: '0.4rem', textTransform: 'capitalize' }}>
                          {cat.label}
                        </h3>
                        <p className="category-card__count" style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: '1.4', margin: 0 }}>
                          {desc}
                        </p>
                      </div>
                    </motion.div>
                  );
                });
              })()}
            </div>
          )}
        </div>
      </section>

      {/* ==============================
          COURSE VIDEOS INFINITE SCROLL SECTION
          ============================== */}
      <section className="section" style={{ padding: '3.5rem 0', background: 'rgba(255, 107, 0, 0.015)', borderTop: '1px solid rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
        <div className="container" style={{ maxWidth: '100%', padding: 0 }}>
          {/* Header */}
          <div className="container" style={{ marginBottom: '2.5rem' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>
              <motion.div className="section-label" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }}>
                <Play size={12} fill="var(--primary)" color="var(--primary)" /> Video Classes
              </motion.div>
              <motion.h2 className="section-title" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                Learn from <span className="gradient-text">Top Video Courses</span>
              </motion.h2>
              <motion.p className="section-subtitle" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                High-quality video lectures for conceptual clarity, tips and tricks
              </motion.p>
            </div>
          </div>

          {/* Infinite Scroll Marquee Container */}
          {videoCourses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              No video courses loaded.
            </div>
          ) : (
            <div className="marquee-wrapper" style={{
              overflow: 'hidden',
              width: '100%',
              position: 'relative',
              display: 'flex',
              padding: '10px 0'
            }}>
              {/* Left/Right fading glass gradients */}
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                width: '100px',
                background: 'linear-gradient(to right, #090d16 0%, transparent 100%)',
                zIndex: 2,
                pointerEvents: 'none'
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                width: '100px',
                background: 'linear-gradient(to left, #090d16 0%, transparent 100%)',
                zIndex: 2,
                pointerEvents: 'none'
              }} />

              {/* Scrolling track */}
              <div className="marquee-track" style={{
                display: 'flex',
                gap: '24px',
                width: 'max-content',
                animation: 'marquee 35s linear infinite'
              }}>
                {[...videoCourses, ...videoCourses, ...videoCourses].map((course, idx) => {
                  const thumb = course.videoUrl ? getYoutubeThumbnail(course.videoUrl) : 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500';
                  return (
                    <div
                      key={`${course._id}-${idx}`}
                      onClick={() => setActiveVideoUrl(course.videoUrl)}
                      style={{
                        width: '280px',
                        height: '350px',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        position: 'relative',
                        flexShrink: 0,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: '#0f172a',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                        transition: 'transform 0.3s ease'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                    >
                      {/* Thumbnail Image */}
                      <img
                        src={thumb}
                        alt={course.title}
                        loading="lazy"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          zIndex: 0
                        }}
                      />

                      {/* Dark overlay */}
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.9) 100%)',
                        zIndex: 1
                      }} />

                      {/* Play Button Overlay */}
                      <div style={{
                        position: 'absolute',
                        top: '40%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '54px',
                        height: '54px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        zIndex: 3
                      }}>
                        <Play size={20} fill="#ff6b00" color="#ff6b00" style={{ marginLeft: '3px' }} />
                      </div>

                      {/* Details */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '16px',
                        zIndex: 3,
                        color: '#ffffff',
                        textAlign: 'center'
                      }}>
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          background: 'rgba(255,107,0,0.2)',
                          color: '#ff8c00',
                          border: '1px solid rgba(255,107,0,0.4)',
                          padding: '2px 8px',
                          borderRadius: '100px',
                          display: 'inline-block',
                          marginBottom: '8px'
                        }}>
                          {course.categoryName || course.category?.name || 'Video Class'}
                        </span>
                        <h4 style={{
                          fontSize: '1rem',
                          fontWeight: 700,
                          margin: 0,
                          lineHeight: 1.3,
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                        }}>
                          {course.title}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==============================
          TRENDING MOCK TESTS — EXAM TOPIC NAMES FROM DB
          ============================== */}
      <section className="section popular-exams-section">
        <div className="container">
          {/* Section header with View All top-right */}
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 8 }}>
            <div className="section-header" style={{ marginBottom: 0, flex: 1 }}>
              <motion.div className="section-label" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }}>
                <Star size={12} /> Popular Tests
              </motion.div>
              <motion.h2 className="section-title" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                Trending <span className="gradient-text">Mock Tests</span>
              </motion.h2>
            </div>
            <motion.div whileInView={{ opacity: 1 }} initial={{ opacity: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              <Link
                to="/dashboard?tab=payments"
                className="btn btn-outline btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
              >
                View All <ArrowRight size={14} />
              </Link>
            </motion.div>
          </div>

          {/* Selected Trending Mock Tests or DB Exams or static fallback */}
          {trendingTests.length > 0 ? (
            <div className="exams-grid">
              {trendingTests.map((exam, i) => (
                <motion.div
                  key={exam._id || i}
                  className="exam-list-card glass"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="elc__top">
                    <span className="badge badge-orange">{exam.subjectName || 'General'}</span>
                    <span className={`elc__difficulty ${exam.isPaid ? 'hard' : 'medium'}`}>
                      {exam.isPaid ? `₹${exam.price || 49}` : 'Free'}
                    </span>
                  </div>
                  <h3 className="elc__title">{exam.topicName || exam.subjectName}</h3>
                  <div className="elc__meta">
                    <span><BookOpen size={13} /> {exam.questions?.length || 0} Qs</span>
                    <span><Clock size={13} /> {exam.duration} min</span>
                    {exam.negativeMarking > 0 && <span>⚡ -{exam.negativeMarking} marking</span>}
                  </div>
                  <button onClick={() => handleAttemptExam(exam._id)} className="btn btn-primary btn-sm elc__btn">
                    Attempt Now <ArrowRight size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : dbExams.length > 0 ? (
            <div className="exams-grid">
              {dbExams.slice(0, 6).map((exam, i) => (
                <motion.div
                  key={exam._id || i}
                  className="exam-list-card glass"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="elc__top">
                    <span className="badge badge-orange">{exam.subjectName || 'General'}</span>
                    <span className={`elc__difficulty ${exam.isPaid ? 'hard' : 'medium'}`}>
                      {exam.isPaid ? `₹${exam.price || 49}` : 'Free'}
                    </span>
                  </div>
                  <h3 className="elc__title">{exam.topicName || exam.subjectName}</h3>
                  <div className="elc__meta">
                    <span><BookOpen size={13} /> {exam.questions?.length || exam.totalMarks || 0} Qs</span>
                    <span><Clock size={13} /> {exam.duration} min</span>
                    {exam.negativeMarking > 0 && <span>⚡ -{exam.negativeMarking} marking</span>}
                  </div>
                  <button onClick={() => handleAttemptExam(exam._id)} className="btn btn-primary btn-sm elc__btn">
                    Attempt Now <ArrowRight size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Static fallback */
            <div className="exams-grid">
              {[
                { title: 'SBI PO Full Mock Test', tag: 'Banking', questions: 100, time: '60 min', difficulty: 'Hard', rating: 4.9 },
                { title: 'SSC CGL Tier 1 Mock', tag: 'SSC', questions: 100, time: '60 min', difficulty: 'Medium', rating: 4.8 },
                { title: 'RRB NTPC Mock Test', tag: 'Railway', questions: 100, time: '90 min', difficulty: 'Medium', rating: 4.7 },
                { title: 'IBPS PO Prelims Mock', tag: 'Banking', questions: 100, time: '60 min', difficulty: 'Hard', rating: 4.9 },
                { title: 'UPSC Prelims GS-1', tag: 'UPSC', questions: 100, time: '120 min', difficulty: 'Hard', rating: 4.8 },
                { title: 'Odisha Police SI Mock', tag: 'Odisha', questions: 100, time: '90 min', difficulty: 'Medium', rating: 4.6 },
              ].map((exam, i) => (
                <motion.div
                  key={exam.title}
                  className="exam-list-card glass"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="elc__top">
                    <span className="badge badge-orange">{exam.tag}</span>
                    <span className={`elc__difficulty ${exam.difficulty.toLowerCase()}`}>{exam.difficulty}</span>
                  </div>
                  <h3 className="elc__title">{exam.title}</h3>
                  <div className="elc__meta">
                    <span><BookOpen size={13} /> {exam.questions} Qs</span>
                    <span><Clock size={13} /> {exam.time}</span>
                    <span><Star size={13} fill="#ff6b00" color="#ff6b00" /> {exam.rating}</span>
                  </div>
                  <button onClick={handleAttemptStatic} className="btn btn-primary btn-sm elc__btn">
                    Attempt Now <ArrowRight size={14} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==============================
          PHOTO GRID SECTION — IMAGES IN 2 ROWS (4/4) WITH HOVER DESCRIPTION
          ============================== */}
      <section className="section" style={{ padding: '3.5rem 0', background: 'rgba(255, 255, 255, 0.01)', borderTop: '1px solid rgba(255, 255, 255, 0.03)', borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
        <div className="container">
          <div className="section-header section-header--center" style={{ marginBottom: '2.5rem' }}>
            <motion.div className="section-label" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }}>
              <ImageIcon size={12} /> Achievements Gallery
            </motion.div>
            <motion.h2 className="section-title" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              Life at <span className="gradient-text">ExamSphere</span>
            </motion.h2>
            <motion.p className="section-subtitle" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              Explore our study centers, learning environment and milestone achievements
            </motion.p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '1.25rem'
          }}>
            {(content.galleryGrid || DEFAULT_GALLERY_GRID).slice(0, 8).map((img, i) => (
              <motion.div
                key={i}
                className="gallery-card-container"
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                {/* Image */}
                <img
                  src={img.url}
                  alt={`Gallery ${i + 1}`}
                  className="gallery-card-img"
                  onError={e => {
                    e.currentTarget.src = "https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?w=500";
                  }}
                />

                {/* Hover overlay showing description */}
                <div className="gallery-card-overlay">
                  <p style={{
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 600,
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    {img.desc || 'ExamSphere Learning Center'}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==============================
          FEATURES — "Everything You Need to Succeed"
          ============================== */}
      <section className="section features-section">
        <div className="container">
          <div className="section-header section-header--center">
            <motion.div className="section-label" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }}>
              <Zap size={12} /> Why ExamSphere
            </motion.div>
            <motion.h2 className="section-title" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 30 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
              Everything You Need to <span className="gradient-text">Succeed</span>
            </motion.h2>
            <motion.p className="section-subtitle" whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 20 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
              Built for serious aspirants who want the best preparation experience
            </motion.p>
          </div>
          <div className="features-grid">
            {resolvedFeatures.map((f, i) => {
              const Icon = f.iconComponent;
              return (
                <motion.div
                  key={f.title + i}
                  className="feature-card glass"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  whileHover={{ y: -6, borderColor: 'var(--border-orange)' }}
                >
                  <div className="feature-card__icon">
                    <Icon size={24} />
                  </div>
                  <h3 className="feature-card__title">{f.title}</h3>
                  <p className="feature-card__desc">{f.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Video Modal Lightbox */}
      <AnimatePresence>
        {activeVideoUrl && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
            <div className="glass" style={{ width: '82vw', height: '84vh', maxWidth: 1250, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.6)' }}>
              <button
                onClick={() => setActiveVideoUrl(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 10 }}
              >
                <X size={20} />
              </button>
              <iframe
                title="Course Video Player"
                src={getEmbedUrl(activeVideoUrl)}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        .marquee-track:hover {
          animation-play-state: paused !important;
        }
        .gallery-card-container {
          position: relative;
          height: 200px;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        .gallery-card-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .gallery-card-container:hover .gallery-card-img {
          transform: scale(1.06);
        }
        .gallery-card-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: 2;
          text-align: center;
        }
        .gallery-card-container:hover .gallery-card-overlay {
          opacity: 1;
        }
      `}</style>
    </PublicLayout>
  );
}
