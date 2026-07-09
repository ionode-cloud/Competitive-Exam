import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, Zap, ChevronLeft, ChevronRight, Download, Share2, Play, Pause } from 'lucide-react';
import PublicLayout from '../../layouts/PublicLayout';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5117';

const defaultCategories = ['All', 'Success Stories', 'Online Exams', 'Achievements', 'Events', 'Team'];

// Gallery items — using placeholder colored cards with emoji/icons
const defaultGalleryItems = [
  { id: 1, cat: 'Success Stories', title: 'Rahul Cleared SBI PO', emoji: '🏆', color: '#ff6b00', size: 'tall', desc: 'Rank 47 All India — from a small village in Odisha!' },
  { id: 2, cat: 'Online Exams', title: 'Live Exam Interface', emoji: '💻', color: '#3b82f6', size: 'normal', desc: 'Real-time timer, question palette and analytics' },
  { id: 3, cat: 'Achievements', title: '50K Students Milestone', emoji: '🎯', color: '#10b981', size: 'wide', desc: 'Celebrating 50,000 enrolled students!' },
  { id: 4, cat: 'Success Stories', title: 'Priya Got IBPS Clerk', emoji: '⭐', color: '#8b5cf6', size: 'normal', desc: 'First attempt success story — Priya Sharma' },
  { id: 5, cat: 'Events', title: 'Odisha Exam Workshop', emoji: '📚', color: '#f59e0b', size: 'tall', desc: 'Free workshop for OPSC aspirants in Bhubaneswar' },
  { id: 6, cat: 'Online Exams', title: 'Result Analytics Dashboard', emoji: '📊', color: '#06b6d4', size: 'normal', desc: 'Detailed subject-wise performance breakdown' },
  { id: 7, cat: 'Team', title: 'ExamSphere Core Team', emoji: '👥', color: '#ec4899', size: 'wide', desc: "The passionate team behind India's best exam platform" },
  { id: 8, cat: 'Achievements', title: '95% Success Rate', emoji: '🚀', color: '#84cc16', size: 'normal', desc: 'Industry-leading success rate among our students' },
  { id: 9, cat: 'Success Stories', title: 'SSC CGL AIR-12 Winner', emoji: '🥇', color: '#ff6b00', size: 'normal', desc: 'Deepak Nayak cracked SSC CGL with AIR 12!' },
  { id: 10, cat: 'Events', title: 'Free Webinar — Banking Prep', emoji: '🎙️', color: '#3b82f6', size: 'tall', desc: 'Live webinar with 2000+ concurrent students' },
  { id: 11, cat: 'Online Exams', title: 'Mock Test Leaderboard', emoji: '🏅', color: '#8b5cf6', size: 'wide', desc: 'Top performers across India on a single leaderboard' },
  { id: 12, cat: 'Team', title: 'Content Creation Team', emoji: '✍️', color: '#10b981', size: 'normal', desc: 'Subject experts crafting 100+ questions weekly' },
];

// Keep legacy names for card component
const categories = defaultCategories;

function GalleryCard({ item, onClick }) {
  return (
    <motion.div
      className={`gallery-card gallery-card--${item.size}`}
      style={{ '--card-color': item.color }}
      whileHover={{ scale: 1.02, zIndex: 10 }}
      transition={{ duration: 0.2 }}
      onClick={() => onClick(item)}
      layout
    >
      <div className="gallery-card__inner">
        {item.url ? (
          <img src={item.url} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div className="gallery-card__emoji">{item.emoji}</div>
        )}
        <div className="gallery-card__overlay">
          <ZoomIn size={20} className="gallery-card__zoom" />
          <div className="gallery-card__info">
            <div className="gallery-card__cat">{item.cat}</div>
            <div className="gallery-card__title">{item.title}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Gallery() {
  const [activeCat, setActiveCat] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [galleryContent, setGalleryContent] = useState({
    heroTitle: "Our Students' Journey",
    heroSubtitle: 'Celebrating the milestones, success stories, and memorable moments from our ExamSphere community.',
    items: defaultGalleryItems,
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const res = await fetch(`${API}/api/page-content/gallery`);
        const data = await res.json();
        if (data) {
          setGalleryContent(prev => ({
            ...prev,
            ...data,
            items: data.items && data.items.length > 0
              ? data.items.map((item, idx) => ({ ...item, id: item.id || idx + 1 }))
              : prev.items,
          }));
        }
      } catch (err) {
        console.warn('[Gallery] Could not load custom page content:', err);
      }
    };
    fetchContent();
  }, []);

  const filtered = activeCat === 'All'
    ? galleryContent.items
    : galleryContent.items.filter(g => g.cat === activeCat);

  // Auto Scroll Slideshow Effect
  useEffect(() => {
    if (lightboxIndex === null || !isPlaying) return;
    const interval = setInterval(() => {
      setLightboxIndex(prev => (prev === filtered.length - 1 ? 0 : prev + 1));
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, lightboxIndex, filtered.length]);

  // Keyboard navigation control
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === 'ArrowRight') {
        setLightboxIndex(prev => (prev === filtered.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex(prev => (prev === 0 ? filtered.length - 1 : prev - 1));
      } else if (e.key === 'Escape') {
        setLightboxIndex(null);
        setIsPlaying(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, filtered.length]);



  return (
    <PublicLayout>
      {/* Hero */}
      <section className="page-hero">
        <div className="orb orb-orange" style={{ width: 400, height: 400, top: -100, right: -50 }} />
        <div className="container">
          <div className="page-hero__grid">
            {/* Left — Motion Text */}
            <motion.div 
              className="page-hero__text-col"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.15 }
                }
              }}
            >
              <motion.div 
                className="section-label page-hero__label"
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 100 } }
                }}
              >
                <Zap size={12} /> Gallery
              </motion.div>
              
              <motion.h1 
                className="page-hero__title"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                }}
              >
                {galleryContent.heroTitle}
              </motion.h1>
              
              <motion.p 
                className="page-hero__subtitle"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
                }}
              >
                {galleryContent.heroSubtitle}
              </motion.p>
            </motion.div>

            {/* Right — Rounded Image */}
            <motion.div 
              className="page-hero__image-col"
              initial={{ opacity: 0, scale: 0.92, x: 30 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="page-hero__image-mixture page-hero__image-mixture--gallery">

                {/* Main large rounded image */}
                <div className="gallery-hero__circle-main">
                  <div className="gallery-hero__ring" />
                  <div className="gallery-hero__ring gallery-hero__ring--2" />
                  <img
                    src={galleryContent.heroImageMain || "/gallery_banner.png"}
                    alt="Students celebrating success"
                  />
                </div>

                {/* Small floating circle image badge */}
                <div className="gallery-hero__circle-badge">
                  <img
                    src={galleryContent.heroImageSub || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=200&auto=format&fit=crop&q=70"}
                    alt="Event highlight"
                  />
                </div>

                {/* Floating stat chip */}
                <div className="gallery-hero__stat-chip">
                  <span className="gallery-hero__stat-num">{galleryContent.statNumber || "50K+"}</span>
                  <span className="gallery-hero__stat-lbl">{galleryContent.statLabel || "Happy Students"}</span>
                </div>

              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* Filters */}
      <section className="gallery-filters">
        <div className="container">
          <div className="filter-tabs">
            {(() => {
              const cats = galleryContent.categories && galleryContent.categories.length > 0
                ? ['All', ...galleryContent.categories]
                : defaultCategories;
              return cats.map(cat => (
                <motion.button
                  key={cat}
                  className={`filter-tab ${activeCat === cat ? 'filter-tab--active' : ''}`}
                  onClick={() => setActiveCat(cat)}
                  whileTap={{ scale: 0.95 }}
                >
                  {cat}
                </motion.button>
              ));
            })()}
          </div>
        </div>
      </section>

      {/* Masonry Grid */}
      <section className="gallery-section">
        <div className="container">
          <motion.div className="gallery-masonry" layout>
            <AnimatePresence>
              {filtered.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.35 }}
                >
                  <GalleryCard item={item} onClick={() => setLightboxIndex(index)} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (() => {
          const activeItem = filtered[lightboxIndex];
          if (!activeItem) return null;

          const handlePrev = () => {
            setLightboxIndex(prev => (prev === 0 ? filtered.length - 1 : prev - 1));
          };

          const handleNext = () => {
            setLightboxIndex(prev => (prev === filtered.length - 1 ? 0 : prev + 1));
          };

          const handleDownload = () => {
            const link = document.createElement('a');
            link.href = activeItem.url || '';
            link.download = `${activeItem.title || 'gallery-image'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          const handleShare = async () => {
            if (navigator.share) {
              try {
                await navigator.share({
                  title: activeItem.title,
                  text: activeItem.desc,
                  url: activeItem.url?.startsWith('http') ? activeItem.url : window.location.href,
                });
              } catch (err) {
                console.log('Share canceled or failed', err);
              }
            } else {
              try {
                await navigator.clipboard.writeText(activeItem.url?.startsWith('http') ? activeItem.url : window.location.href);
                alert('Copied gallery link to clipboard!');
              } catch (err) {
                alert('Failed to copy link.');
              }
            }
          };

          return (
            <motion.div
              className="lightbox"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setLightboxIndex(null); setIsPlaying(false); }}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)',
                backdropFilter: 'blur(12px)', zIndex: 2000, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: '24px', boxSizing: 'border-box'
              }}
            >
              {/* Close Button */}
              <button 
                onClick={() => { setLightboxIndex(null); setIsPlaying(false); }}
                style={{
                  position: 'absolute', top: 24, right: 24, background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                  borderRadius: '50%', width: 44, height: 44, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10
                }}
              >
                <X size={22} />
              </button>

              {/* Central Area: Prev - Image - Next */}
              <div 
                style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  width: '100%', maxWidth: '1000px', flex: 1, position: 'relative' 
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Left Navigation Arrow */}
                <button 
                  onClick={handlePrev}
                  style={{
                    position: 'absolute', left: 0, background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                    borderRadius: '50%', width: 56, height: 56, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                >
                  <ChevronLeft size={32} />
                </button>

                {/* Main Content Card */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '80%', padding: '0 80px' }}>
                  {activeItem.url ? (
                    <img 
                      src={activeItem.url} 
                      alt={activeItem.title} 
                      style={{ 
                        maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', 
                        borderRadius: '16px', border: '1px solid rgba(255,255,255,0.15)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.8)' 
                      }} 
                    />
                  ) : (
                    <div style={{ fontSize: '10rem', filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.6))', display: 'flex', alignItems: 'center', height: '40vh' }}>
                      {activeItem.emoji}
                    </div>
                  )}

                  {/* Title & Description Overlay */}
                  <div style={{ textAlign: 'center', marginTop: '24px', maxWidth: '600px' }}>
                    <span style={{ 
                      fontSize: '0.75rem', padding: '4px 12px', borderRadius: '100px', 
                      background: `${activeItem.color}22`, color: activeItem.color, 
                      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' 
                    }}>
                      {activeItem.cat}
                    </span>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'white', marginTop: '12px', marginBottom: '8px' }}>
                      {activeItem.title}
                    </h2>
                    {activeItem.desc && (
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                        {activeItem.desc}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right Navigation Arrow */}
                <button 
                  onClick={handleNext}
                  style={{
                    position: 'absolute', right: 0, background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)', color: 'white',
                    borderRadius: '50%', width: 56, height: 56, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                >
                  <ChevronRight size={32} />
                </button>
              </div>

              {/* Bottom Control Bar */}
              <div 
                style={{ 
                  display: 'flex', gap: '16px', padding: '16px 28px', borderRadius: '100px', 
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(8px)', marginTop: '20px', zIndex: 10
                }}
                onClick={e => e.stopPropagation()}
              >
                {/* Auto Scroll Play/Pause */}
                <button 
                  onClick={() => setIsPlaying(p => !p)}
                  title={isPlaying ? 'Pause Slideshow' : 'Play Slideshow'}
                  style={{
                    background: 'none', border: 'none', color: isPlaying ? 'var(--primary)' : 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', 
                    fontSize: '0.85rem', fontWeight: 600
                  }}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                  <span>{isPlaying ? 'Playing' : 'Slideshow'}</span>
                </button>

                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />

                {/* Download */}
                <button 
                  onClick={handleDownload}
                  title="Download Image"
                  style={{
                    background: 'none', border: 'none', color: 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '0.85rem', fontWeight: 600
                  }}
                >
                  <Download size={18} />
                  <span>Download</span>
                </button>

                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />

                {/* Share */}
                <button 
                  onClick={handleShare}
                  title="Share Image"
                  style={{
                    background: 'none', border: 'none', color: 'white',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                    fontSize: '0.85rem', fontWeight: 600
                  }}
                >
                  <Share2 size={18} />
                  <span>Share</span>
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </PublicLayout>
  );
}
