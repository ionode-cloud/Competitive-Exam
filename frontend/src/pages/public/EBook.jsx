import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { BookOpen, Search, Lock, Unlock, Eye, Sparkles, Loader, Terminal, Award, BookOpenCheck, X } from 'lucide-react';
import PublicLayout from '../../layouts/PublicLayout';
import SecurePDFViewer from '../../components/student/SecurePDFViewer';
import { useUser } from '../../context/UserContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5117';
const SUBJECTS = ['All', 'Computer', 'Odia', 'English', 'Reasoning'];

const CARD_THEMES = {
  Computer: {
    bg: 'linear-gradient(135deg, #e5e3ea 0%, #d8d6e0 100%)',
    textColor: '#1e293b',
    descColor: '#475569',
    badgeBg: '#ffffff',
    badgeTextColor: '#6b21a8',
    accentColor: '#8b5cf6',
    btnBg: '#8b5cf6',
    btnTextColor: '#ffffff',
    svg: (
      <svg width="120" height="120" viewBox="0 0 100 100" style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.25, pointerEvents: 'none' }}>
        <circle cx="50" cy="50" r="40" fill="#a78bfa" />
        <path d="M 50 10 A 40 40 0 0 1 50 90 Z" fill="#8b5cf6" />
      </svg>
    )
  },
  Odia: {
    bg: 'linear-gradient(135deg, #fae8d7 0%, #f3dec6 100%)',
    textColor: '#1e293b',
    descColor: '#475569',
    badgeBg: '#ffffff',
    badgeTextColor: '#b45309',
    accentColor: '#ea580c',
    btnBg: '#ea580c',
    btnTextColor: '#ffffff',
    svg: (
      <svg width="125" height="125" viewBox="0 0 100 100" style={{ position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.3, pointerEvents: 'none' }}>
        <circle cx="40" cy="65" r="25" fill="#fdba74" />
        <circle cx="65" cy="40" r="28" fill="#f97316" />
        <path d="M 40 40 Q 60 40 60 65 T 80 65" stroke="#ea580c" strokeWidth="6" fill="none" opacity="0.2" />
      </svg>
    )
  },
  English: {
    bg: 'linear-gradient(135deg, #fcebf7 0%, #f6def0 100%)',
    textColor: '#1e293b',
    descColor: '#475569',
    badgeBg: '#ffffff',
    badgeTextColor: '#be185d',
    accentColor: '#db2777',
    btnBg: '#db2777',
    btnTextColor: '#ffffff',
    svg: (
      <svg width="130" height="130" viewBox="0 0 100 100" style={{ position: 'absolute', right: '-15px', bottom: '-15px', opacity: 0.28, pointerEvents: 'none' }}>
        <path d="M 50 15 L 62 48 L 95 50 L 70 72 L 78 105 L 50 85 L 22 105 L 30 72 L 5 50 L 38 48 Z" fill="#f472b6" />
        <circle cx="50" cy="55" r="20" fill="#db2777" opacity="0.2" />
      </svg>
    )
  },
  Reasoning: {
    bg: 'linear-gradient(135deg, #e1ebd5 0%, #d4e2c7 100%)',
    textColor: '#1e293b',
    descColor: '#475569',
    badgeBg: '#ffffff',
    badgeTextColor: '#15803d',
    accentColor: '#16a34a',
    btnBg: '#16a34a',
    btnTextColor: '#ffffff',
    svg: (
      <svg width="125" height="125" viewBox="0 0 100 100" style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.3, pointerEvents: 'none' }}>
        <path d="M 50 15 L 75 45 L 63 45 L 80 70 L 60 70 L 85 95 L 15 95 L 40 70 L 20 70 L 37 45 L 25 45 Z" fill="#86efac" />
        <rect x="46" y="95" width="8" height="10" fill="#16a34a" />
      </svg>
    )
  }
};

const getTheme = (subject) => {
  return CARD_THEMES[subject] || CARD_THEMES['Computer'];
};

export default function EBook() {
  const { user, openLogin, addPurchase } = useUser();
  const location = useLocation();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeSubject, setActiveSubject] = useState('All');
  const [subjectsList, setSubjectsList] = useState(['All', 'Computer', 'Odia', 'English', 'Reasoning']);
  const [watermarkTemplate, setWatermarkTemplate] = useState('');

  // PDF Viewer State
  const [activeBook, setActiveBook] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Checkout State
  const [checkingOutId, setCheckingOutId] = useState(null);
  const [instructionsBook, setInstructionsBook] = useState(null);

  useEffect(() => {
    if (location.state?.subject) {
      setActiveSubject(location.state.subject);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/question-books`);
      setBooks(res.data);
    } catch (e) {
      console.error('Error fetching question books:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API}/api/ebook-subjects`);
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        const names = res.data.map(s => s.name);
        setSubjectsList(['All', ...names]);
      } else {
        setSubjectsList(['All', 'Computer', 'Odia', 'English', 'Reasoning']);
      }
    } catch (e) {
      console.error('Error fetching subjects:', e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/api/page-content/ebook-settings`);
      if (res.data && res.data.content && res.data.content.watermarkText) {
        setWatermarkTemplate(res.data.content.watermarkText);
      }
    } catch (e) {
      console.warn('Failed to load watermark settings:', e);
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchSubjects();
    fetchSettings();
  }, []);

  const handleOpenBook = async (book) => {
    if (!user) {
      openLogin();
      return;
    }

    const isPurchased = book.isFree || user.purchases?.some(p => p && p.toString() === book._id.toString());
    if (!isPurchased) {
      handlePurchase(book);
      return;
    }

    // Load PDF Base64 content securely
    setLoadingPdf(true);
    setActiveBook(book);
    try {
      const token = user.token;
      const res = await axios.get(`${API}/api/question-books/${book._id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPdfData(res.data.pdfData);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download secure PDF file');
      setActiveBook(null);
    } finally {
      setLoadingPdf(false);
    }
  };

  const handlePurchase = async (book) => {
    if (!user) {
      openLogin();
      return;
    }

    setCheckingOutId(book._id);

    try {
      // 1. Create Razorpay order
      const { data: order } = await axios.post(`${API}/api/payments/create-order`, {
        amount: book.offerPrice,
        userId: user._id,
        questionBookId: book._id,
        purchaseType: 'question-book',
        couponCode: ''
      });

      // 2. Load Razorpay script dynamically
      if (!window.Razorpay) {
        await new Promise(resolve => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve;
          document.body.appendChild(s);
        });
      }

      // 3. Launch Checkout Widget
      const options = {
        key: order.key,
        amount: order.amount,
        currency: 'INR',
        name: 'ExamSphere PYQ E-Books',
        description: `EBook: ${book.title}`,
        order_id: order.orderId,
        theme: { color: '#ff6b00' },
        handler: async (response) => {
          try {
            // 4. Verify payment with backend
            const verify = await axios.post(`${API}/api/payments/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              userId: user._id,
              questionBookId: book._id,
              purchaseType: 'question-book'
            });

            // 5. Update local user context state
            addPurchase(book._id);
            alert('E-Book Unlocked Successfully! 🎉');

            // Automatically open the secure viewer
            handleOpenBook({ ...book, isPurchased: true });
          } catch (err) {
            console.error('Payment verify error:', err);
            alert('Payment verification failed.');
          }
        },
        modal: {
          ondismiss: () => {
            setCheckingOutId(null);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (e) {
      console.error('Checkout initialization failed:', e);
      alert(e.response?.data?.message || 'Could not start purchase flow.');
    } finally {
      setCheckingOutId(null);
    }
  };

  const getSubjectIcon = (subject) => {
    switch (subject) {
      case 'Computer':
        return '💻';
      case 'Odia':
        return '📚';
      case 'English':
        return '✍️';
      case 'Reasoning':
        return '🧠';
      default:
        return '📖';
    }
  };

  const filteredBooks = books.filter(b => {
    const matchesSubject = activeSubject === 'All' || b.subject === activeSubject;
    const matchesSearch = b.title.toLowerCase().includes(search.toLowerCase()) || (b.description || '').toLowerCase().includes(search.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <PublicLayout>
      <style>{`
        @media (max-width: 640px) {
          .ebook-hero-section { padding: 60px 16px 32px !important; }
          .ebook-hero-h1 { font-size: 1.8rem !important; }
          .ebook-hero-p { font-size: 0.92rem !important; margin-bottom: 24px !important; }
          .ebook-filter-row { flex-direction: column !important; }
          .ebook-filter-row > div { min-width: 100% !important; flex: none !important; }
          .ebook-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 480px) {
          .ebook-hero-h1 { font-size: 1.5rem !important; letter-spacing: -0.01em !important; }
          .ebook-hero-section { padding: 52px 14px 28px !important; }
        }
      `}</style>
      {/* Hero Banner Section */}
      <section className="ebook-hero-section" style={{
        padding: '20px 24px 48px',
        textAlign: 'center',
        background: 'radial-gradient(circle at top, rgba(255, 107, 0, 0.15) 0%, transparent 70%)',
        position: 'relative'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '100px',
              background: 'rgba(255, 107, 0, 0.08)',
              border: '1px solid rgba(255, 107, 0, 0.2)',
              color: '#ff6b00',
              fontSize: '0.8rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '16px'
            }}>
              <Sparkles size={13} /> Secure Solved E-Books
            </span>
          </motion.div>

          <motion.h1
            className="ebook-hero-h1"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              margin: '0 0 16px 0',
              lineHeight: 1.15,
              background: 'var(--orange-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}
          >
            Previous Year Solved Questions
          </motion.h1>

          <motion.p
            className="ebook-hero-p"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: '0 auto 36px',
              maxWidth: '640px'
            }}
          >
            Unlock chapter-wise solved papers with step-by-step explanations.
            Read securely inside our premium anti-copy canvas e-book reader.
          </motion.p>
        </div>
      </section>

      {/* Main Content Area */}
      <section style={{ maxWidth: '1200px', margin: '0 auto 80px', padding: '0 24px' }}>
        {/* Filters and Search Bar */}
        <div className="ebook-filter-row" style={{
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
          marginBottom: '36px',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: 'var(--shadow-sm)',
          backdropFilter: 'blur(8px)',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}>
          {/* Search Field */}
          <div style={{ position: 'relative', flex: 2, minWidth: '280px' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search previous year question papers..."
              style={{
                width: '100%',
                padding: '14px 16px 14px 46px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'rgba(255,255,255,0.03)',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'all 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#ff6b00'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {/* Dynamic Subjects Dropdown Selector */}
          <div style={{ minWidth: '200px', flex: 1 }}>
            <select
              value={activeSubject}
              onChange={e => setActiveSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-primary)',
                fontSize: '0.92rem',
                outline: 'none',
                cursor: 'pointer',
                boxSizing: 'border-box',
                transition: 'all 0.2s'
              }}
              onFocus={e => e.target.style.borderColor = '#ff6b00'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            >
              {subjectsList.map(sub => (
                <option key={sub} value={sub} style={{ background: '#0f172a', color: '#f8fafc' }}>
                  {sub === 'All' ? 'All Subjects' : sub}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* EBooks Grid Layout */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
            <Loader size={36} className="spin" color="#ff6b00" style={{ marginBottom: '16px' }} />
            <p style={{ fontWeight: 600 }}>Loading available E-Books...</p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 24px',
            border: '1px dashed var(--border)',
            borderRadius: '20px',
            background: 'rgba(255,255,255,0.01)'
          }}>
            <Eye className="hide-mobile" size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>No Solved Papers Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto' }}>
              We could not find any question books matching your filters. Try checking other subjects.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(460px, 1fr))',
            gap: '24px'
          }} className="ebook-grid">
            <style dangerouslySetInnerHTML={{
              __html: `
              .ebook-card {
                display: flex;
                flex-direction: row;
                border-radius: 16px;
                overflow: hidden;
                position: relative;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                min-height: 220px;
                border: 1px solid rgba(0,0,0,0.04);
                box-shadow: 0 4px 20px rgba(0,0,0,0.03);
              }
              .ebook-card-left {
                flex: 1;
                padding: 24px;
                display: flex;
                flex-direction: column;
                justify-content: space-between;
                z-index: 2;
              }
              .ebook-card-right {
                width: 160px;
                padding: 24px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                position: relative;
                z-index: 2;
                box-sizing: border-box;
                border-left: 1px dashed rgba(30, 41, 59, 0.08);
              }
              .ebook-card-badge {
                display: inline-block;
                padding: 4px 12px;
                border-radius: 6px;
                font-size: 0.72rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                margin-bottom: 12px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.05);
              }
              .ebook-card-title {
                font-size: 1.35rem;
                font-weight: 800;
                margin: 0 0 8px 0;
                line-height: 1.25;
              }
              .ebook-card-desc {
                font-size: 0.84rem;
                line-height: 1.45;
                margin: 0 0 16px 0;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
              }
              .ebook-card-learn-more {
                background: none;
                border: none;
                font-weight: 700;
                font-size: 0.85rem;
                cursor: pointer;
                padding: 0;
                display: flex;
                align-items: center;
                gap: 4px;
                text-decoration: underline;
                transition: opacity 0.2s;
              }
              .ebook-card-learn-more:hover {
                opacity: 0.8;
              }
              @media (max-width: 580px) {
                .ebook-card {
                  flex-direction: column;
                  min-height: auto;
                }
                .ebook-card-right {
                  width: 100% !important;
                  padding: 20px 24px 24px !important;
                  border-left: none !important;
                  border-top: 1px dashed rgba(30, 41, 59, 0.08);
                  flex-direction: row !important;
                  justify-content: space-between !important;
                  align-items: center !important;
                }
                .ebook-card-right svg {
                  display: none !important;
                }
              }
            `}} />
            {filteredBooks.map((book, idx) => {
              const isUnlocked = book.isFree || user?.purchases?.some(p => p && p.toString() === book._id.toString());
              const theme = getTheme(book.subject);

              return (
                <motion.div
                  key={book._id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="ebook-card"
                  style={{
                    background: theme.bg,
                    color: theme.textColor
                  }}
                  whileHover={{ y: -6, boxShadow: '0 12px 30px rgba(0, 0, 0, 0.15)' }}
                >
                  {/* Left Section */}
                  <div className="ebook-card-left">
                    <div>
                      {/* Label Badge */}
                      <span className="ebook-card-badge" style={{
                        background: theme.badgeBg,
                        color: theme.badgeTextColor
                      }}>
                        {book.subject}
                      </span>

                      {/* Title */}
                      <h3 className="ebook-card-title" style={{ color: theme.textColor }}>
                        {book.title}
                      </h3>

                      {/* Description */}
                      <p className="ebook-card-desc" style={{ color: theme.descColor }}>
                        {book.description || 'Step-by-step solved questions with clear explanations.'}
                      </p>
                    </div>

                    {/* Learn More link */}
                    <div>
                      <button
                        onClick={() => setInstructionsBook(book)}
                        className="ebook-card-learn-more"
                        style={{ color: theme.textColor }}
                      >
                        Learn more →
                      </button>
                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="ebook-card-right">
                    {/* SVG Graphic Background */}
                    {theme.svg}

                    {/* CTA Actions */}
                    <div style={{ position: 'relative', zIndex: 3, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', width: '100%' }}>
                      {/* Pricing */}
                      <div>
                        {book.isFree ? (
                          <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#15803d' }}>FREE</span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: '1.25rem', fontWeight: 900, color: theme.textColor }}>
                              ₹{book.offerPrice}
                            </span>
                            {book.price > book.offerPrice && (
                              <span style={{ fontSize: '0.75rem', textDecoration: 'line-through', color: '#64748b', fontWeight: 600 }}>
                                ₹{book.price}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Button */}
                      <button
                        onClick={() => handleOpenBook(book)}
                        disabled={checkingOutId === book._id}
                        style={{
                          background: theme.btnBg,
                          color: theme.btnTextColor,
                          border: 'none',
                          borderRadius: '10px',
                          padding: '10px 16px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
                          width: '100%',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '4px'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.filter = 'brightness(1.05)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'none';
                          e.currentTarget.style.filter = 'none';
                        }}
                      >
                        {checkingOutId === book._id ? (
                          <Loader size={12} className="spin" />
                        ) : isUnlocked ? (
                          <>Read Now</>
                        ) : (
                          <>Buy Now</>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>

      {/* Dynamic secure viewer render overlay */}
      <AnimatePresence>
        {activeBook && pdfData && (
          <SecurePDFViewer
            pdfData={pdfData}
            title={activeBook.title}
            userInfo={user}
            watermarkTemplate={watermarkTemplate}
            onClose={() => {
              setActiveBook(null);
              setPdfData(null);
            }}
          />
        )}
        {activeBook && loadingPdf && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(9, 15, 29, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 10001,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#f8fafc'
          }}>
            <Loader size={44} className="spin" color="#ff6b00" style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>Initializing Secure Reader</h3>
            <p style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Decrypting and loading pages securely...</p>
          </div>
        )}
      </AnimatePresence>

      {/* Instructions Modal Overlay */}
      <AnimatePresence>
        {instructionsBook && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(9, 15, 29, 0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 10002,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass"
              style={{
                borderRadius: '20px',
                border: '1px solid rgba(255,255,255,0.1)',
                padding: '32px',
                width: '100%',
                maxWidth: '520px',
                background: 'rgba(15, 23, 42, 0.95)',
                color: '#f8fafc',
                position: 'relative',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
              }}
            >
              <button
                onClick={() => setInstructionsBook(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '6px'
                }}
              >
                <X size={18} />
              </button>

              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpenCheck size={24} color="#ff6b00" /> E-Book Instructions
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#cbd5e1', marginBottom: '20px', fontWeight: 600 }}>
                {instructionsBook.title}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#ff6b00', marginTop: '3px' }}>🔐</div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 2px 0' }}>Anti-Copy Security</h4>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>Text selection, highlighting, and copying have been disabled to protect proprietary material.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#ff6b00', marginTop: '3px' }}>🚫</div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 2px 0' }}>No Downloading & Printing</h4>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>PDF download links are hidden, and print options (including Ctrl+P) are completely disabled.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#ff6b00', marginTop: '3px' }}>🖼️</div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 2px 0' }}>Personalized Pixel Watermark</h4>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>Your registered name and email are permanently stamped diagonally across the pages to deter screenshots.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{ color: '#ff6b00', marginTop: '3px' }}>👁️</div>
                  <div>
                    <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: '0 0 2px 0' }}>Auto-Blur Safeguard</h4>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>The e-book screen blurs automatically if you switch focus, open tools, or minimize the window.</p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    const book = instructionsBook;
                    setInstructionsBook(null);
                    handleOpenBook(book);
                  }}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  {(instructionsBook.isFree || user?.purchases?.some(p => p && p.toString() === instructionsBook._id.toString())) ? 'Start Reading' : `Unlock Now (₹${instructionsBook.offerPrice})`}
                </button>
                <button
                  onClick={() => setInstructionsBook(null)}
                  className="btn btn-outline"
                  style={{ padding: '12px 20px', borderRadius: '10px', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PublicLayout>
  );
}
