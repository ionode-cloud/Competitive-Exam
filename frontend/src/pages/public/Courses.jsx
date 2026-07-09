import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCourse } from '../../context/CourseContext';
import { useUser } from '../../context/UserContext';
import PublicLayout from '../../layouts/PublicLayout';
import {
  Search, BookOpen, ChevronLeft, ChevronRight, Zap, X, Play, ChevronDown
} from 'lucide-react';

function CourseCard({ course, onStart, onPlayVideo, index }) {
  const [hovered, setHovered] = useState(false);

  const getYoutubeThumbnail = (url) => {
    if (!url) return null;
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/0.jpg`;
    }
    return null;
  };

  const timeAgo = (dateString) => {
    if (!dateString) return '1 day ago';
    const now = new Date();
    const created = new Date(dateString);
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins || 1} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const getViewCount = (course) => {
    const seed = course._id ? parseInt(course._id.substring(18), 16) || 12 : 12;
    const baseViews = (course.enrolledCount || 0) * 15 + (seed % 95) + 5;
    if (baseViews >= 1000) {
      return `${(baseViews / 1000).toFixed(1)}K views`;
    }
    return `${baseViews} views`;
  };

  const videoThumb = course.videoUrl ? getYoutubeThumbnail(course.videoUrl) : null;

  if (course.videoUrl) {
    const thumbnailUrl = course.thumbnail || videoThumb || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=500';

    return (
      <motion.div
        className="course-card course-card--video"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.07 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onPlayVideo(course.videoUrl)}
        style={{
          position: 'relative',
          height: '380px',
          borderRadius: '16px',
          overflow: 'hidden',
          cursor: 'pointer',
          boxShadow: hovered ? '0 12px 30px rgba(0,0,0,0.5)' : 'var(--shadow-sm)',
          border: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: '#0f172a',
          transition: 'all 0.3s ease',
          transform: hovered ? 'translateY(-6px)' : 'none'
        }}
      >
        <img
          src={thumbnailUrl}
          alt={course.title}
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0,
            transition: 'transform 0.5s ease',
            transform: hovered ? 'scale(1.05)' : 'scale(1)'
          }}
        />
        {/* Dark linear gradient overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.92) 100%)',
          zIndex: 1,
          transition: 'background 0.3s ease'
        }} />

        {/* Category Badge */}
        <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
          <span className="course-card__category-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            {course.category?.icon || '📚'} {course.categoryName || course.category?.name || 'General'}
          </span>
        </div>

        {/* Center Large White Play Button */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: hovered ? 'translate(-50%, -50%) scale(1.1)' : 'translate(-50%, -50%) scale(1)',
          width: '76px',
          height: '76px',
          borderRadius: '50%',
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: hovered ? '0 8px 24px rgba(14, 165, 233, 0.4)' : '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 10,
          transition: 'all 0.3s ease'
        }}>
          <Play size={28} fill="#0ea5e9" color="#0ea5e9" style={{ marginLeft: '4px' }} />
        </div>

        {/* Bottom Details Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          padding: '24px',
          zIndex: 10,
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}>
          <h3 style={{
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#ffffff',
            margin: '0 0 8px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
            letterSpacing: '-0.01em',
            lineHeight: 1.2
          }}>
            {course.title}
          </h3>
          <p style={{
            fontSize: '0.82rem',
            color: '#e2e8f0',
            margin: hovered ? '0 0 12px 0' : '0',
            maxHeight: hovered ? '80px' : '0px',
            opacity: hovered ? 1 : 0,
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4'
          }}>
            {course.description}
          </p>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#ffffff',
            background: 'rgba(255,255,255,0.1)',
            padding: '4px 12px',
            borderRadius: '100px',
            backdropFilter: 'blur(4px)'
          }}>
            {getViewCount(course)} | {timeAgo(course.createdAt)}
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="course-card"
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.07 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onStart(course)}
      style={{ cursor: 'pointer' }}
    >
      {/* Thumbnail */}
      <div className="course-card__thumb" style={{ position: 'relative' }}>
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.title} loading="lazy" />
        ) : videoThumb ? (
          <img src={videoThumb} alt={course.title} loading="lazy" />
        ) : (
          <div className="course-card__thumb-placeholder">
            <BookOpen size={48} style={{ opacity: 0.4 }} />
          </div>
        )}

        {course.videoUrl && (
          <button
            onClick={(e) => { e.stopPropagation(); onPlayVideo(course.videoUrl); }}
            className="course-card__video-btn"
            style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: hovered ? 'translate(-50%, -50%) scale(1.1)' : 'translate(-50%, -50%) scale(0.8)',
              opacity: hovered ? 1 : 0,
              pointerEvents: hovered ? 'auto' : 'none',
              width: '46px', height: '46px', borderRadius: '50%', background: 'rgba(14,165,233,0.95)',
              border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 12px rgba(14,165,233,0.5)',
              transition: 'all 0.3s ease'
            }}
          >
            <Play size={18} fill="white" style={{ marginLeft: '2px' }} />
          </button>
        )}

        <div className="course-card__thumb-overlay">
          <span className="course-card__category-badge">
            {course.category?.icon || '📚'} {course.categoryName || course.category?.name || 'General'}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="course-card__body" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 180px)', justifyContent: 'space-between', boxSizing: 'border-box' }}>
        <div>
          <h3 
            className="course-card__title" 
            style={{ 
              marginBottom: hovered ? '8px' : '16px', 
              transition: 'margin-bottom 0.3s ease' 
            }}
          >
            {course.title}
          </h3>
          <p 
            className="course-card__desc" 
            style={{ 
              display: '-webkit-box',
              WebkitLineClamp: 3, 
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxHeight: hovered ? '100px' : '0px', 
              opacity: hovered ? 1 : 0, 
              marginBottom: hovered ? '16px' : '0px', 
              transition: 'max-height 0.3s ease, opacity 0.3s ease, margin-bottom 0.3s ease'
            }}
          >
            {course.description}
          </p>
        </div>
        {course.videoUrl ? (
          <button
            onClick={(e) => { e.stopPropagation(); onPlayVideo(course.videoUrl); }}
            className="course-card__watch-now-btn"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7, #38bdf8)', border: 'none',
              color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              boxShadow: '0 4px 12px rgba(14,165,233,0.3)', transition: 'all 0.2s',
              marginTop: 'auto'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Play size={14} fill="white" /> Watch Now
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(course); }}
            className="course-card__watch-now-btn"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#cbd5e1', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              transition: 'all 0.2s', marginTop: 'auto'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
          >
            Start Practice
          </button>
        )}
      </div>
    </motion.div>
  );
}

function SkeletonCard() {
  return (
    <div className="course-card course-card--skeleton">
      <div className="course-card__thumb skeleton-block" />
      <div className="course-card__body">
        <div className="skeleton-block" style={{ height: 22, width: '80%', borderRadius: 6, marginBottom: 10 }} />
        <div className="skeleton-block" style={{ height: 14, width: '100%', borderRadius: 4, marginBottom: 6 }} />
        <div className="skeleton-block" style={{ height: 14, width: '70%', borderRadius: 4, marginBottom: 18 }} />
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {[60, 70, 55, 65].map((w, i) => (
            <div key={i} className="skeleton-block" style={{ height: 12, width: w, borderRadius: 4 }} />
          ))}
        </div>
        <div className="skeleton-block" style={{ height: 38, borderRadius: 10, marginTop: 12 }} />
      </div>
    </div>
  );
}

export default function CoursesPage() {
  const { courses, categories, loadingCourses, fetchCourses, fetchCategories } = useCourse();
  const { user, openLogin } = useUser();
  const navigate = useNavigate();
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  const getEmbedUrl = (url) => {
    if (!url) return '';
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  const [search, setSearch] = useState('');
  const [selCategory, setSelCat] = useState('');
  const [selDiff, setSelDiff] = useState('');
  const [selPrice, setSelPrice] = useState('');
  const [page, setPage] = useState(1);
  const PER_PAGE = 20;

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, [fetchCourses, fetchCategories]);

  const filtered = useMemo(() => {
    return courses.filter(c => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) &&
        !(c.description || '').toLowerCase().includes(search.toLowerCase())) return false;
      if (selCategory && c.category?._id !== selCategory && c.categoryName !== selCategory) return false;
      if (selDiff && c.difficulty !== selDiff) return false;
      if (selPrice === 'free' && c.price > 0) return false;
      if (selPrice === 'paid' && c.price === 0) return false;
      return true;
    });
  }, [courses, search, selCategory, selDiff, selPrice]);

  // Compute all courses that have an active video url in the filtered set
  const videoCourses = useMemo(() => {
    return filtered.filter(c => !!c.videoUrl);
  }, [filtered]);

  const activeVideoIndex = useMemo(() => {
    if (!activeVideoUrl) return -1;
    return videoCourses.findIndex(c => c.videoUrl === activeVideoUrl);
  }, [activeVideoUrl, videoCourses]);

  const handlePrevVideo = () => {
    if (videoCourses.length === 0 || activeVideoIndex === -1) return;
    const prevIndex = (activeVideoIndex - 1 + videoCourses.length) % videoCourses.length;
    setActiveVideoUrl(videoCourses[prevIndex].videoUrl);
  };

  const handleNextVideo = () => {
    if (videoCourses.length === 0 || activeVideoIndex === -1) return;
    const nextIndex = (activeVideoIndex + 1) % videoCourses.length;
    setActiveVideoUrl(videoCourses[nextIndex].videoUrl);
  };

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const pageNumbers = useMemo(() => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      let start = Math.max(2, page - 1);
      let end = Math.min(totalPages - 1, page + 1);

      if (page <= 3) {
        end = 4;
      } else if (page >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < totalPages - 1) {
        pages.push('...');
      }

      pages.push(totalPages);
    }
    return pages;
  }, [page, totalPages]);

  const handleStart = (course) => {
    if (!user) {
      openLogin(course._id);
      return;
    }
    navigate(`/courses/${course._id}`);
  };

  const clearFilters = () => {
    setSearch(''); setSelCat(''); setSelDiff(''); setSelPrice(''); setPage(1);
  };
  const hasFilters = search || selCategory || selDiff || selPrice;

  return (
    <PublicLayout>
      {/* ─── HERO with glowing orbs ─── */}
      <section className="courses-hero" style={{ position: 'relative', overflow: 'hidden' }}>
        <div className="orb orb-orange" style={{ width: 500, height: 500, top: -150, right: -100, opacity: 0.35 }} />
        <div className="orb" style={{ width: 300, height: 300, bottom: -80, left: -60, background: 'radial-gradient(circle, rgba(56,189,248,0.18) 0%, transparent 70%)' }} />
        <motion.div
          className="courses-hero__content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="courses-hero__badge"><Zap size={14} /> India's #1 Mock Test Platform</div>
          <h1 className="courses-hero__title">Explore <span className="gradient-text">Courses</span></h1>
          <p className="courses-hero__subtitle">
            Choose from {courses.length}+ courses across Banking, SSC, Railway, UPSC & more.
            Start with free mock tests — upgrade anytime.
          </p>

          {/* Search & Category Filter Row */}
          <div className="courses-hero__search-row" style={{ display: 'flex', gap: '16px', maxWidth: '720px', margin: '0 auto', width: '100%', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
            <div className="courses-hero__search" style={{ flex: '1', minWidth: '280px', position: 'relative' }}>
              <Search size={18} className="courses-hero__search-icon" />
              <input
                className="courses-hero__search-input"
                placeholder="Search courses, exams, topics..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
              {search && (
                <button className="courses-hero__search-clear" onClick={() => setSearch('')}>
                  <X size={16} />
                </button>
              )}
            </div>
            
            <div className="courses-hero__category-select-wrapper">
              <select
                className="courses-hero__category-select"
                value={selCategory}
                onChange={e => { setSelCat(e.target.value); setPage(1); }}
              >
                <option value="" style={{ color: '#000000', backgroundColor: '#ffffff' }}>All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id} style={{ color: '#000000', backgroundColor: '#ffffff' }}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <div className="courses-hero__category-select-arrow">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ─── MAIN CONTENT FULL-WIDTH LAYOUT ─── */}
      <div className="courses-layout">
        <section style={{ width: '100%' }}>
          {/* Grid */}
          {loadingCourses ? (
            <div className="courses-grid">
              {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : paged.length === 0 ? (
            <div className="courses-empty">
              <BookOpen size={64} style={{ opacity: 0.2, marginBottom: 16 }} />
              <h3>No courses found</h3>
              <p>Try different filters or check back later.</p>
              {hasFilters && (
                <button className="btn-primary-sm" onClick={clearFilters}>Clear Filters</button>
              )}
            </div>
          ) : (
            <div className="courses-grid">
              {paged.map((course, i) => (
                <CourseCard key={course._id} course={course} onStart={handleStart} onPlayVideo={setActiveVideoUrl} index={i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="courses-pagination">
              <button
                className="courses-pagination__btn"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >← Prev</button>
              {pageNumbers.map((p, idx) => (
                <button
                  key={idx}
                  className={`courses-pagination__btn ${p === page ? 'active' : ''} ${p === '...' ? 'disabled' : ''}`}
                  disabled={p === '...'}
                  onClick={() => typeof p === 'number' && setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="courses-pagination__btn"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >Next →</button>
            </div>
          )}
        </section>
      </div>

      {/* Video Modal Popup */}
      <AnimatePresence>
        {activeVideoUrl && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 10 }}>
            {/* Previous Video Button */}
            {videoCourses.length > 1 && (
              <button
                onClick={handlePrevVideo}
                style={{
                  position: 'absolute', left: '3%', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '50%', width: 56, height: 56,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', cursor: 'pointer', zIndex: 1200,
                  transition: 'all 0.2s', backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
              >
                <ChevronLeft size={32} />
              </button>
            )}

            {/* Next Video Button */}
            {videoCourses.length > 1 && (
              <button
                onClick={handleNextVideo}
                style={{
                  position: 'absolute', right: '3%', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: '50%', width: 56, height: 56,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', cursor: 'pointer', zIndex: 1200,
                  transition: 'all 0.2s', backdropFilter: 'blur(8px)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
              >
                <ChevronRight size={32} />
              </button>
            )}

            <div className="glass" style={{ width: '82vw', height: '84vh', maxWidth: 1250, borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 48px rgba(0,0,0,0.6)' }}>
              <button
                onClick={() => setActiveVideoUrl(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', cursor: 'pointer', zIndex: 10 }}
              >
                <X size={20} />
              </button>
              <iframe
                title="Intro Video"
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
    </PublicLayout>
  );
}
