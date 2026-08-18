// PYQEbookPage.jsx — PYQ E-Books library with exact MaterialsPage payment & PDF view layout
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FaLaptopCode, FaBookOpen, FaFont, FaGlobe, FaCalculator, FaPuzzlePiece,
  FaFileAlt, FaFlask, FaSearch, FaBook, FaCalendarAlt, FaFire, FaStar,
  FaRegDotCircle, FaBolt, FaLock, FaTimes, FaEye, FaDownload,
  FaMobileAlt, FaQrcode, FaCreditCard, FaUniversity, FaExternalLinkAlt
} from 'react-icons/fa';
import PdfViewerModal from '../components/PdfViewerModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SUBJECT_ICON_MAP = {
  'Computer':          { icon: <FaLaptopCode />, color: '#1957D6', bg: '#EAF1FD' },
  'English Language':  { icon: <FaBookOpen />,   color: '#0F9D58', bg: '#E8F8EE' },
  'English':           { icon: <FaBookOpen />,   color: '#0F9D58', bg: '#E8F8EE' },
  'Odia':              { icon: <FaFont />,       color: '#7C3AED', bg: '#F3ECFE' },
  'General Knowledge': { icon: <FaGlobe />,      color: '#EA7A1E', bg: '#FEF1E4' },
  'Mathematics':       { icon: <FaCalculator />, color: '#B4232F', bg: '#FCEBEA' },
  'Reasoning':         { icon: <FaPuzzlePiece />,color: '#0891B2', bg: '#E0F7FA' },
  'General Science':   { icon: <FaFlask />,      color: '#0891B2', bg: '#E0F7FA' },
};
const DEFAULT_ICON_CONFIG = { icon: <FaFileAlt />, color: '#1957D6', bg: '#EAF1FD' };

export default function PYQEbookPage() {
  const [searchParams] = useSearchParams();
  const urlQ = searchParams.get('q') ?? '';
  const [search, setSearch] = useState(urlQ);

  const [pageConfig, setPageConfig]       = useState(null);
  const [categories, setCategories]       = useState([]);
  const [selectedCat, setSelectedCat]     = useState(urlQ || 'All');
  const [dbBooks, setDbBooks]             = useState([]);
  const [loading, setLoading]             = useState(true);

  /* Unlocked books state */
  const [unlockedIds, setUnlockedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('unlocked_ebooks') || '[]'); }
    catch { return []; }
  });

  // Check if current logged-in user is admin (bypasses all payment gates)
  const userIsAdmin = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('user') || '{}');
      return ['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'].includes(parsed.role);
    } catch { return false; }
  })();

  /* Modals */
  const [selectedBook, setSelectedBook]               = useState(null);
  const [activePdf, setActivePdf]                     = useState(() => {
    try {
      const saved = localStorage.getItem('active_view_pdf');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.data || null;
      }
    } catch { /* silent */ }
    return null;
  });
  const [paymentBook, setPaymentBook]                 = useState(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess]           = useState(false);

  const cleanPdfData = (book) => {
    if (!book) return null;
    return {
      _id: book._id,
      title: book.title || book.name || book.subjectName || 'PDF Document',
      subjectName: book.subjectName || '',
      pdfUrl: book.pdfUrl || book.fileUrl || book.url || '',
      price: book.price || 0,
      isFree: book.isFree || false,
    };
  };

  const handleOpenPdf = (book) => {
    const cleanData = cleanPdfData(book);
    setActivePdf(cleanData);
    try {
      localStorage.setItem('active_view_pdf', JSON.stringify({ type: 'pyq', data: cleanData }));
    } catch { /* silent */ }
  };

  const handleClosePdf = () => {
    setActivePdf(null);
    try {
      localStorage.removeItem('active_view_pdf');
    } catch { /* silent */ }
  };



  useEffect(() => {
    if (urlQ) {
      setSelectedCat(urlQ);
      setSearch(urlQ);
    }
  }, [urlQ]);

  // Fetch page config & categories
  const fetchPageConfig = useCallback(async () => {
    try {
      const [resCfg, resCats] = await Promise.all([
        fetch(`${API_URL}/ebooks-config/public`),
        fetch(`${API_URL}/pyq-ebooks?publicOnly=true`),
      ]);
      const jsonCfg  = await resCfg.json();
      const jsonCats = await resCats.json();
      if (jsonCfg.success) setPageConfig(jsonCfg.data);
      if (jsonCats.success) setCategories(jsonCats.data || []);
    } catch { /* silent */ }
  }, []);

  // Fetch DB ebooks
  const fetchEbooks = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/ebooks/public`);
      const json = await res.json();
      if (json.success) setDbBooks(json.data || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPageConfig();
    fetchEbooks();
  }, [fetchPageConfig, fetchEbooks]);

  const cfg = pageConfig;

  // Map database ebooks
  const booksToRender = dbBooks.map(b => ({
    _id: b._id,
    subjectName: b.subject?.name || b.title,
    category: b.category || 'Other',
    title: b.title,
    description: b.description || 'Topic-wise previous year questions with detailed solutions',
    exams: b.tags?.length ? b.tags : ['OSSSC', 'OSSC'],
    pages: b.pages || '150+ pages',
    year: b.year || '2018-2025',
    instructions: b.instructions || [],
    tag: b.isFree ? 'Free Access' : 'Premium Edition',
    tagIcon: b.isFree ? <FaStar /> : <FaFire />,
    price: b.price || 0,
    isFree: b.isFree || b.price === 0,
    pdfUrl: b.pdfUrl,
  }));

  const filtered = booksToRender.filter(book => {
    return !search || (
      (book.category || '').toLowerCase().includes(search.toLowerCase()) ||
      (book.subjectName || '').toLowerCase().includes(search.toLowerCase()) ||
      (book.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (book.description || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const checkUnlocked = (book) => {
    if (book.isFree || book.price === 0) return true;
    if (userIsAdmin) return true;
    return unlockedIds.includes(book._id);
  };

  const handleOpenBookDetails = (book) => {
    setSelectedBook(book);
  };

  const handleActionButtonClick = (book) => {
    if (checkUnlocked(book)) {
      handleOpenPdf(book);
    } else {
      setPaymentBook(book);
      setPaymentSuccess(false);
      setIsProcessingPayment(false);
    }
  };

  const handleRazorpayPayment = async (book) => {
    try {
      setIsProcessingPayment(true);
      const amount = Number(book.price) || 0;

      // 1. Create order on backend
      const res = await fetch(`${API_URL}/payments/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          itemName: `PYQ E-Book: ${book.title}`,
        }),
      }).then(r => r.json());

      if (!res.success) {
        alert(res.message || 'Failed to initialize payment');
        setIsProcessingPayment(false);
        return;
      }

      // Load SDK if needed
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
        description: `PYQ E-Book: ${book.title}`,
        order_id: res.orderId,
        handler: async function (response) {
          try {
            await fetch(`${API_URL}/payments/razorpay/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount,
                isMock: res.isMock,
              }),
            });
          } catch { /* proceed */ }

          setIsProcessingPayment(false);
          setPaymentSuccess(true);
          const updated = [...unlockedIds, book._id];
          setUnlockedIds(updated);
          localStorage.setItem('unlocked_ebooks', JSON.stringify(updated));

          setTimeout(() => {
            setPaymentBook(null);
            setPaymentSuccess(false);
            handleOpenPdf(book);
          }, 1000);
        },
        theme: { color: '#1957D6' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(response.error?.description || 'Payment Failed');
        setIsProcessingPayment(false);
      });
      rzp.open();
    } catch (err) {
      alert('Razorpay Checkout failed: ' + err.message);
      setIsProcessingPayment(false);
    }
  };

  const handleConfirmPayment = () => {
    if (selectedPaymentMethod === 'razorpay') {
      handleRazorpayPayment(paymentBook);
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      if (paymentBook) {
        const updated = [...unlockedIds, paymentBook._id];
        setUnlockedIds(updated);
        localStorage.setItem('unlocked_ebooks', JSON.stringify(updated));
      }
      setTimeout(() => {
        const book = paymentBook;
        setPaymentBook(null);
        setPaymentSuccess(false);
        handleOpenPdf(book);
      }, 1000);
    }, 1500);
  };

  return (
    <div style={{ minHeight: '80vh', background: 'var(--bg)' }}>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, rgb(15, 23, 42), rgba(234, 122, 30, 0.133))', padding: '22px 0 18px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="eyebrow" style={{ color: '#FDE68A' }}>
                {cfg?.bannerEyebrow || 'PYQ Ebook'}
              </div>
              <h1 style={{ fontFamily: 'var(--disp)', fontSize: 'clamp(20px,2.8vw,30px)', color: '#fff', margin: '6px 0 8px' }}>
                {cfg?.bannerHeading || 'Previous Year Question E-Books'}
              </h1>
              <p style={{ color: '#94A3B8', fontSize: 13.5, maxWidth: '52ch', lineHeight: 1.6, margin: '0 0 14px' }}>
                {cfg?.bannerSubtitle || 'Topic-wise PYQ collections — the most trusted exam resource for Odisha state exams.'}
              </p>

              {/* Search input */}
              <div style={{ maxWidth: 380, position: 'relative' }}>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search subjects or exams..."
                  style={{
                    width: '100%', padding: '10px 42px 10px 16px',
                    borderRadius: 30, border: 'none', fontSize: 13.5,
                    background: 'rgba(255,255,255,.95)', outline: 'none', boxSizing: 'border-box'
                  }}
                />
                <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: 'var(--muted)', display: 'flex', alignItems: 'center' }}>
                  <FaSearch />
                </span>
              </div>
            </div>

            {/* Stat badges */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 6 }}>
              {(cfg?.bannerStats?.length ? cfg.bannerStats : [
                { n: `${filtered.length}+`, label: 'E-Books' },
                { n: '2', label: 'Free Titles' },
                { n: '7', label: 'Subjects' },
              ]).map((s, i) => (
                <div key={i} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px', minWidth: 72 }}>
                  <div style={{ fontFamily: 'var(--disp)', fontSize: 20, fontWeight: 900, color: '#FFC93C', lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontSize: 10.5, color: '#CBD5E1', marginTop: 4, letterSpacing: 0.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── E-Books Grid ────────────────────────────────────────────────── */}
      <div className="wrap" style={{ paddingTop: 24, paddingBottom: 48 }}>

        {/* ── Filter Bar & All Cards Button ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setSearch('')}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '8px 20px', borderRadius: 20, border: 'none',
                background: !search ? '#0F172A' : '#e2e8f0',
                color: !search ? '#fff' : '#475569',
                fontSize: 13, fontWeight: 800, cursor: 'pointer',
                boxShadow: !search ? '0 2px 8px rgba(15,23,42,0.25)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              📚 All E-Books
            </button>

            {search && (
              <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                Showing results for: <strong style={{ color: '#0F172A' }}>"{search}"</strong>
              </span>
            )}
          </div>

          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                background: '#fff', border: '1px solid #cbd5e1', borderRadius: 20,
                padding: '6px 14px', fontSize: 12, fontWeight: 800, color: '#ef4444',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              ✕ Show All Cards
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            Loading e-books...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            No e-books available matching your search.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {filtered.map((book, i) => {
              const styleCfg  = SUBJECT_ICON_MAP[book.subjectName] || DEFAULT_ICON_CONFIG;
              const unlocked  = checkUnlocked(book);
              const priceText = book.isFree || book.price === 0 ? 'Free' : `₹${book.price}`;

              return (
                <div
                  key={book._id || i}
                  style={{
                    background: 'var(--card)', border: '1px solid var(--line)',
                    borderRadius: 14, padding: 22, position: 'relative', overflow: 'hidden',
                    transition: 'all .18s', cursor: 'pointer',
                  }}
                  onClick={() => handleOpenBookDetails(book)}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--sh-2)'; e.currentTarget.style.borderColor = styleCfg.color + '55'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = ''; e.currentTarget.style.borderColor = 'var(--line)'; }}
                >
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: styleCfg.color, borderRadius: '14px 0 0 14px' }} />
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginLeft: 4 }}>

                    {/* Icon */}
                    <div style={{
                      width: 52, height: 52, borderRadius: 12,
                      background: styleCfg.bg, color: styleCfg.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0
                    }}>
                      {styleCfg.icon}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Badges */}
                      <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: styleCfg.color, background: styleCfg.bg, padding: '2px 8px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {book.tagIcon || <FaStar />} {book.tag || 'Popular'}
                        </span>
                        {(book.isFree || book.price === 0) && (
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#0F9D58', background: '#E8F8EE', padding: '2px 8px', borderRadius: 20 }}>FREE</span>
                        )}
                      </div>

                      <h3 style={{ fontSize: 15, margin: '0 0 4px', fontWeight: 800 }}>{book.title || book.subjectName}</h3>
                      <p style={{ fontSize: 12, color: 'var(--muted)', margin: '0 0 10px', lineHeight: 1.5 }}>{book.description}</p>

                      <div style={{ fontSize: 11, color: 'var(--muted-2)', marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaBook /> {book.pages}</span>
                        <span style={{ margin: '0 8px' }}>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><FaCalendarAlt /> {book.year}</span>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
                        {book.exams.map((ex, j) => (
                          <span key={j} style={{ fontSize: 10, fontWeight: 700, background: 'var(--bg)', border: '1px solid var(--line)', padding: '2px 7px', borderRadius: 6, color: 'var(--muted)' }}>{ex}</span>
                        ))}
                      </div>

                      {/* Price + Details & Action Buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          {!unlocked && <FaLock style={{ color: '#EF4444', fontSize: 12 }} />}
                          <span style={{ fontWeight: 900, fontSize: 16, color: styleCfg.color, whiteSpace: 'nowrap' }}>{priceText}</span>
                        </div>

                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBookDetails(book);
                            }}
                            style={{
                              fontSize: 12, fontWeight: 700, color: 'var(--muted)',
                              background: '#F1F5F9', border: '1px solid var(--line)',
                              padding: '7px 12px', borderRadius: 8, cursor: 'pointer',
                              whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'all 0.15s'
                            }}
                          >
                            <FaFileAlt fontSize={11} /> Details
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionButtonClick(book);
                            }}
                            style={{
                              fontSize: 12.5, fontWeight: 700, color: '#fff',
                              background: unlocked ? styleCfg.color : '#0F9D58',
                              padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                              whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                            }}
                          >
                            {unlocked ? <><FaEye fontSize={13} /> View Book →</> : <>Get E-Book →</>}
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Book Details Modal ────────────────────────────────────────────── */}
      {selectedBook && (() => {
        const bk = selectedBook;
        const st = SUBJECT_ICON_MAP[bk.subjectName] || DEFAULT_ICON_CONFIG;
        const unlocked = checkUnlocked(bk);

        return (
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 9999, padding: 20,
            }}
            onClick={() => setSelectedBook(null)}
          >
            <div
              style={{
                background: '#fff', borderRadius: 18, maxWidth: 520, width: '100%',
                border: '1px solid var(--line)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
                overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ background: st.bg, padding: '20px 24px', borderBottom: '1px solid var(--line)', position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: '#fff', color: st.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}>
                    {st.icon}
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: st.color, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      {bk.subjectName}
                    </span>
                    <h2 style={{ fontSize: 17, fontWeight: 850, margin: 0, color: 'var(--ink)', lineHeight: 1.3 }}>{bk.title}</h2>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedBook(null)}
                  style={{
                    position: 'absolute', top: 16, right: 16,
                    background: 'rgba(0,0,0,0.06)', border: 'none', borderRadius: 50,
                    width: 28, height: 28, fontSize: 14, fontWeight: 800,
                    cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                {bk.description && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaBookOpen /> About this E-Book
                    </h3>
                    <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0, background: '#F8FAFC', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      {bk.description}
                    </p>
                  </div>
                )}

                {bk.exams?.length > 0 && (
                  <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {bk.exams.map((tag, i) => (
                      <span key={i} style={{ fontSize: 11, background: st.bg, color: st.color, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {bk.instructions?.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaFileAlt /> Instructions for Candidates / Features
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {bk.instructions.map((inst, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: 13.5, color: '#475569', lineHeight: 1.5 }}>
                          <span style={{
                            background: st.bg, color: st.color,
                            width: 20, height: 20, borderRadius: 50, fontSize: 11, fontWeight: 800,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
                          }}>
                            {idx + 1}
                          </span>
                          <span>{inst}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid var(--line)',
                borderRadius: '0 0 16px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
              }}>
                <button
                  onClick={() => setSelectedBook(null)}
                  style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--line)', background: '#fff', color: 'var(--muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const book = selectedBook;
                    setSelectedBook(null);
                    handleActionButtonClick(book);
                  }}
                  style={{
                    flex: 1, maxWidth: 260, padding: '12px 20px', borderRadius: 10, border: 'none',
                    background: unlocked ? '#0F9D58' : '#DC2626',
                    color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                    boxShadow: `0 4px 14px ${unlocked ? '#0F9D5844' : '#DC262644'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {unlocked ? <><FaEye /> View Book</> : <><FaLock /> Pay ₹{bk.price} to Unlock</>}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Payment Modal (MaterialsPage Layout) (hidden for admin) ────────────────────────── */}
      {paymentBook && !userIsAdmin && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: 20,
          }}
          onClick={() => !isProcessingPayment && setPaymentBook(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 18, maxWidth: 460, width: '100%',
              border: '1px solid var(--line)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Payment Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '20px 24px', color: '#fff', position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#FFC93C', letterSpacing: 1, textTransform: 'uppercase' }}>Secure Payment</div>
              <h2 style={{ fontSize: 18, fontWeight: 850, margin: '4px 0 0', color: '#fff' }}>Unlock PYQ E-Book</h2>
              <button
                onClick={() => setPaymentBook(null)}
                disabled={isProcessingPayment}
                style={{
                  position: 'absolute', top: 18, right: 18,
                  background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 50,
                  width: 28, height: 28, color: '#fff', fontSize: 14, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <FaTimes />
              </button>
            </div>

            {/* Payment Body */}
            <div style={{ padding: '24px' }}>
              {paymentSuccess ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: 48, color: '#0F9D58', marginBottom: 12 }}>✓</div>
                  <h3 style={{ fontSize: 18, fontWeight: 850, color: '#0F9D58', margin: '0 0 6px' }}>Payment Successful!</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Unlocking E-Book Reader…</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24, color: (SUBJECT_ICON_MAP[paymentBook.subjectName] || DEFAULT_ICON_CONFIG).color }}>
                        {(SUBJECT_ICON_MAP[paymentBook.subjectName] || DEFAULT_ICON_CONFIG).icon}
                      </span>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ink)' }}>{paymentBook.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>PYQ E-Book Document</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)', background: '#fff', padding: '4px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}>
                      ₹{paymentBook.price}
                    </div>
                  </div>

                  {/* Razorpay Method Only */}
                  <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
                    <div style={{ background: '#F8FAFC', borderRadius: 14, padding: '20px', marginBottom: 20, border: '1px solid #E2E8F0' }}>
                      <div style={{ fontSize: 40, marginBottom: 8 }}>💳</div>
                      <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Instant Checkout via Razorpay</h4>
                      <p style={{ fontSize: 12.5, color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                        Pay securely using Credit/Debit Cards, UPI (GPay, PhonePe, Paytm), NetBanking, or Wallets.
                      </p>
                    </div>

                    <button
                      onClick={() => handleRazorpayPayment(paymentBook)}
                      disabled={isProcessingPayment}
                      style={{
                        width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                        background: 'linear-gradient(135deg, #1957D6 0%, #1d4ed8 100%)',
                        color: '#fff', fontWeight: 850, fontSize: 15, cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(25, 87, 214, 0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      {isProcessingPayment ? '⏳ Opening Razorpay…' : <><FaLock /> Pay ₹{paymentBook.price} with Razorpay &amp; View Book →</>}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PDF Full-Screen Viewer ────────────────────────── */}
      {activePdf && (
        <PdfViewerModal pdf={activePdf} onClose={handleClosePdf} />
      )}

    </div>
  );
}
