// pages/MaterialsPage.jsx — fully API-driven, no hardcoded data
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FaNewspaper, FaLandmark, FaGlobe, FaBookOpen,
  FaLaptopCode, FaCalculator, FaPuzzlePiece, FaFileAlt,
  FaEye, FaLock, FaFolderOpen, FaClock,
  FaMobileAlt, FaQrcode, FaCreditCard, FaUniversity,
  FaTimes, FaSpinner, FaExternalLinkAlt
} from 'react-icons/fa';
import PdfViewerModal from '../components/PdfViewerModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Fixed icon map per category name — admin sets colors via DB
const CAT_ICON_MAP = {
  'Current Affairs': <FaNewspaper />,
  'Odisha GK':       <FaLandmark />,
  'Static GK':       <FaGlobe />,
  'English':         <FaBookOpen />,
  'Computer':        <FaLaptopCode />,
  'Mathematics':     <FaCalculator />,
  'Reasoning':       <FaPuzzlePiece />,
};
const DEFAULT_ICON = <FaFileAlt />;

function formatSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 86400) return 'Today';
  if (diff < 172800) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MaterialsPage() {
  const [searchParams] = useSearchParams();

  const paramCat = searchParams.get('cat') ?? '';
  const urlCat   = paramCat || 'All';

  const [active, setActive]             = useState('All');
  const [categories, setCategories]     = useState([]);   // from API
  const [pageConfig, setPageConfig]     = useState(null); // from API
  const [materials, setMaterials]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [totalCount, setTotalCount]     = useState(0);

  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [activePdf, setActivePdf]               = useState(() => {
    try {
      const saved = localStorage.getItem('active_view_pdf');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed?.data || null;
      }
    } catch { /* silent */ }
    return null;
  });
  const [paymentMaterial, setPaymentMaterial]   = useState(null);
  const [unlockedIds, setUnlockedIds]           = useState([]);

  // Payment states
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('razorpay');
  const [isProcessingPayment, setIsProcessingPayment]     = useState(false);
  const [paymentSuccess, setPaymentSuccess]               = useState(false);

  // Sync URL category param
  useEffect(() => { setActive(urlCat); }, [urlCat]);

  // Check if current logged-in user is admin (bypasses all payment gates)
  const userIsAdmin = (() => {
    try {
      const parsed = JSON.parse(localStorage.getItem('user') || '{}');
      return ['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'].includes(parsed.role);
    } catch { return false; }
  })();

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/material-categories/public`);
      const json = await res.json();
      if (json.success) setCategories(json.data || []);
    } catch { /* silent — filter still works with 'All' */ }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Fetch page config (banner + dropdown)
  const fetchPageConfig = useCallback(async () => {
    try {
      const res  = await fetch(`${API_URL}/materials-config/public`);
      const json = await res.json();
      if (json.success) setPageConfig(json.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchPageConfig(); }, [fetchPageConfig]);

  // Helper shorthand
  const cfg = pageConfig;

  // Helper: get style for a category from API data
  function getStyle(category) {
    const found = categories.find(c => c.name === category);
    if (found) return { icon: CAT_ICON_MAP[category] || DEFAULT_ICON, color: found.color, bg: found.bg };
    return { icon: DEFAULT_ICON, color: '#475569', bg: '#F1F5F9' };
  }

  // Category tab list: 'All' + API categories
  const categoryTabs = ['All', ...categories.map(c => c.name)];
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (active && active !== 'All') params.set('category', active);
      const res  = await fetch(`${API_URL}/materials/public?${params}`);
      const json = await res.json();
      if (json.success) {
        setMaterials(json.data || []);
        setTotalCount(json.pagination?.total || (json.data || []).length);
      } else {
        throw new Error(json.message || 'Failed to load');
      }
    } catch (err) {
      setError('Could not load materials. Please try again.');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => { fetchMaterials(); }, [fetchMaterials]);

  /* ── actions ────────────────────────────────────────────── */
  const cleanPdfData = (m) => {
    if (!m) return null;
    return {
      _id: m._id,
      title: m.title || m.name || m.category || 'PDF Document',
      category: m.category || '',
      pdfUrl: m.pdfUrl || m.fileUrl || m.url || '',
      price: m.price || 0,
      isFree: m.isFree || false,
    };
  };

  const handleOpenPdfModal = (m) => {
    const cleanData = cleanPdfData(m);
    setActivePdf(cleanData);
    try {
      localStorage.setItem('active_view_pdf', JSON.stringify({ type: 'material', data: cleanData }));
    } catch { /* silent */ }
  };

  const handleClosePdfModal = () => {
    setActivePdf(null);
    try {
      localStorage.removeItem('active_view_pdf');
    } catch { /* silent */ }
  };

  const handleActionButtonClick = (m) => {
    const isUnlocked = m.isFree || unlockedIds.includes(m._id) || userIsAdmin;
    if (isUnlocked) {
      // increment download count (fire-and-forget)
      fetch(`${API_URL}/materials/${m._id}/download`, { method: 'PATCH' }).catch(() => {});
      handleOpenPdfModal(m);
    } else {
      setPaymentMaterial(m);
      setPaymentSuccess(false);
    }
  };

  const handleRazorpayPayment = async (mat) => {
    try {
      setIsProcessingPayment(true);
      const amount = Number(mat.price) || 0;

      // 1. Create order on backend
      const res = await fetch(`${API_URL}/payments/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          itemName: `Material: ${mat.title}`,
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
        description: `Material: ${mat.title}`,
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
          setUnlockedIds(prev => [...prev, mat._id]);
          setTimeout(() => {
            setPaymentMaterial(null);
            setPaymentSuccess(false);
            handleOpenPdfModal(mat);
          }, 1000);
        },
        theme: { color: '#0F9D58' },
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
      handleRazorpayPayment(paymentMaterial);
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);
      setUnlockedIds(prev => [...prev, paymentMaterial._id]);
      setTimeout(() => {
        const mat = paymentMaterial;
        setPaymentMaterial(null);
        setPaymentSuccess(false);
        handleOpenPdfModal(mat);
      }, 1000);
    }, 1500);
  };

  const pdfSource = activePdf?.pdfUrl || '';

  /* ── render ─────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '80vh', background: 'var(--bg)' }}>

      {/* ── Hero ────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, rgb(15, 23, 42), rgba(234, 122, 30, 0.133))', padding: '22px 0 18px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>
            {/* Left — text */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="eyebrow" style={{ color: '#FDE68A' }}>
                {cfg?.bannerEyebrow || 'Study Materials'}
              </div>
              <h1 style={{ fontFamily: 'var(--disp)', fontSize: 'clamp(20px,2.8vw,30px)', color: '#fff', margin: '6px 0 8px' }}>
                {cfg?.bannerHeading || 'Free & Premium Study Materials'}
              </h1>
              <p style={{ color: '#94A3B8', fontSize: 13.5, maxWidth: '52ch', lineHeight: 1.6, margin: '0 0 12px' }}>
                {cfg?.bannerSubtitle || 'Read Current Affairs, Odisha GK, Static GK, English, Computer & more PDFs — curated for Odisha state exams.'}
              </p>


            </div>

            {/* Right — stat badges */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', paddingTop: 6 }}>
              {(cfg?.bannerStats?.length ? cfg.bannerStats : [
                { n: totalCount > 0 ? `${totalCount}+` : '—', label: 'Materials' },
                { n: 'Daily', label: 'CA Updates' },
                { n: '2L+',   label: 'Downloads' },
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

      {/* ── Category filter ───────────────────────────────── */}
      <div style={{ background: '#fff', borderBottom: '1px solid var(--line)', overflowX: 'auto' }}>
        <div className="wrap" style={{ display: 'flex', gap: 6, padding: '12px 32px', alignItems: 'center', flexWrap: 'nowrap' }}>
          {categoryTabs.map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              style={{
                padding: '7px 16px', borderRadius: 20,
                border: active === cat ? 'none' : '1px solid var(--line)',
                background: active === cat ? 'var(--primary)' : '#fff',
                color: active === cat ? '#fff' : 'var(--muted)',
                fontWeight: 600, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap',
                transition: 'all .15s',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Material grid ─────────────────────────────────── */}
      <div className="wrap" style={{ padding: '32px 32px' }}>
        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <FaSpinner style={{ fontSize: 28, animation: 'spin 1s linear infinite', marginBottom: 12 }} />
            <p style={{ fontSize: 14 }}>Loading materials…</p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#DC2626', fontSize: 14, marginBottom: 12 }}>{error}</p>
            <button
              onClick={fetchMaterials}
              style={{ background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontWeight: 700, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && materials.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--muted)' }}>
            <FaFileAlt style={{ fontSize: 36, marginBottom: 12, opacity: 0.3 }} />
            <p style={{ fontSize: 15, fontWeight: 700 }}>No materials available yet</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Check back soon — new materials are added regularly.</p>
          </div>
        )}

        {/* Cards */}
        {!loading && !error && materials.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
            {materials.map(m => {
              const style     = getStyle(m.category);
              const isUnlocked = m.isFree || unlockedIds.includes(m._id) || userIsAdmin;
              return (
                <div
                  key={m._id}
                  style={{
                    background: '#fff', border: '1px solid var(--line)', borderRadius: 12,
                    padding: '16px 18px', display: 'flex', gap: 14, alignItems: 'flex-start',
                    transition: 'box-shadow .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--sh-2)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                >
                  {/* Category icon or thumbnail */}
                  {m.thumbnail
                    ? <img src={m.thumbnail} alt="" style={{ width: 44, height: 52, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }} />
                    : (
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: style.bg, color: style.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                        {style.icon}
                      </div>
                    )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 3 }}>
                      <span style={{
                        fontSize: 10.5,
                        background: isUnlocked ? '#EAF9EF' : '#FEF2F2',
                        color: isUnlocked ? '#16A34A' : '#DC2626',
                        fontWeight: 700, padding: '2px 7px', borderRadius: 20,
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                      }}>
                        {isUnlocked ? <><FaEye fontSize={10} /> Free Access</> : <><FaLock fontSize={10} /> Paid (₹{m.price})</>}
                      </span>
                      {m.tags?.length > 0 && (
                        <span style={{ fontSize: 10, color: 'var(--muted-2)', fontWeight: 600 }}>
                          {m.tags[0]}
                        </span>
                      )}
                    </div>
                    <h3 style={{ fontSize: 13.5, margin: '0 0 4px', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {m.title}
                    </h3>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--muted-2)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <FaFolderOpen /> {formatSize(m.fileSize)}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <FaClock /> {formatDate(m.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setSelectedMaterial({ ...m, style })}
                      style={{
                        background: 'var(--bg)', color: 'var(--ink)',
                        border: '1px solid var(--line)', borderRadius: 8,
                        padding: '7px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background   = style.bg;
                        e.currentTarget.style.borderColor  = style.color + '44';
                        e.currentTarget.style.color        = style.color;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background  = 'var(--bg)';
                        e.currentTarget.style.borderColor = 'var(--line)';
                        e.currentTarget.style.color       = 'var(--ink)';
                      }}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleActionButtonClick({ ...m, style })}
                      style={{
                        background: isUnlocked ? '#0F9D58' : '#DC2626',
                        color: '#fff', border: 'none', borderRadius: 8,
                        padding: '7px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                      }}
                    >
                      {isUnlocked ? <><FaEye /> View PDF</> : <><FaLock /> Unlock</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Details Modal ─────────────────────────────────── */}
      {selectedMaterial && (() => {
        const sm = selectedMaterial;
        const st = sm.style || getStyle(sm.category);
        const isUnlocked = sm.isFree || unlockedIds.includes(sm._id) || userIsAdmin;
        return (
          <div
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 10000, padding: 20,
            }}
            onClick={() => setSelectedMaterial(null)}
          >
            <div
              style={{
                background: '#fff', borderRadius: 16, maxWidth: 560, width: '100%',
                maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--line)',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                animation: 'dropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                display: 'flex', flexDirection: 'column',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 24px', background: st.bg,
                borderBottom: `1.5px solid ${st.color}22`,
                borderRadius: '16px 16px 0 0', display: 'flex', alignItems: 'center', gap: 14,
                position: 'relative',
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: '#fff', color: st.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, boxShadow: '0 4px 12px rgba(0,0,0,0.06)', flexShrink: 0,
                }}>
                  {st.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 10.5, background: '#fff', color: st.color, fontWeight: 800, padding: '2px 8px', borderRadius: 12 }}>
                      {sm.category}
                    </span>
                    <span style={{ fontSize: 11, color: st.color, fontWeight: 700, opacity: 0.8, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <FaFolderOpen /> {formatSize(sm.fileSize)} • <FaClock /> {formatDate(sm.createdAt)}
                    </span>
                  </div>
                  <h2 style={{ fontSize: 17, fontWeight: 850, margin: 0, color: 'var(--ink)', lineHeight: 1.3 }}>{sm.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedMaterial(null)}
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
                {sm.description && (
                  <div style={{ marginBottom: 20 }}>
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaBookOpen /> About this Material
                    </h3>
                    <p style={{ fontSize: 14, color: '#334155', lineHeight: 1.6, margin: 0, background: '#F8FAFC', padding: '14px 16px', borderRadius: 10, border: '1px solid #E2E8F0' }}>
                      {sm.description}
                    </p>
                  </div>
                )}

                {sm.tags?.length > 0 && (
                  <div style={{ marginBottom: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {sm.tags.map((tag, i) => (
                      <span key={i} style={{ fontSize: 11, background: st.bg, color: st.color, fontWeight: 700, padding: '3px 10px', borderRadius: 20 }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {sm.instructions?.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <FaFileAlt /> Instructions for Candidates
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {sm.instructions.map((inst, idx) => (
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
                  onClick={() => setSelectedMaterial(null)}
                  style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--line)', background: '#fff', color: 'var(--muted)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    const mat = selectedMaterial;
                    setSelectedMaterial(null);
                    handleActionButtonClick(mat);
                  }}
                  style={{
                    flex: 1, maxWidth: 260, padding: '12px 20px', borderRadius: 10, border: 'none',
                    background: isUnlocked ? '#0F9D58' : '#DC2626',
                    color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer',
                    boxShadow: `0 4px 14px ${isUnlocked ? '#0F9D5844' : '#DC262644'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {isUnlocked ? <><FaEye /> View PDF</> : <><FaLock /> Pay ₹{sm.price} to Unlock</>}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Payment Modal (hidden for admin) ─────────────────────────────────── */}
      {paymentMaterial && !userIsAdmin && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10000, padding: 20,
          }}
          onClick={() => !isProcessingPayment && setPaymentMaterial(null)}
        >
          <div
            style={{
              background: '#fff', borderRadius: 18, maxWidth: 460, width: '100%',
              border: '1px solid var(--line)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
              overflow: 'hidden', animation: 'dropdownIn 0.2s ease-out',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Payment Header */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '20px 24px', color: '#fff', position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#FFC93C', letterSpacing: 1, textTransform: 'uppercase' }}>Secure Payment</div>
              <h2 style={{ fontSize: 18, fontWeight: 850, margin: '4px 0 0', color: '#fff' }}>Unlock PDF Study Material</h2>
              <button
                onClick={() => setPaymentMaterial(null)}
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
                  <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>Unlocking PDF Reader…</p>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 24, color: getStyle(paymentMaterial.category).color }}>
                        {getStyle(paymentMaterial.category).icon}
                      </span>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--ink)' }}>{paymentMaterial.title}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--muted)' }}>PDF Document • {formatSize(paymentMaterial.fileSize)}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--ink)', background: '#fff', padding: '4px 12px', borderRadius: 8, border: '1px solid #CBD5E1' }}>
                      ₹{paymentMaterial.price}
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
                      onClick={() => handleRazorpayPayment(paymentMaterial)}
                      disabled={isProcessingPayment}
                      style={{
                        width: '100%', padding: '14px', borderRadius: 10, border: 'none',
                        background: 'linear-gradient(135deg, #0F9D58 0%, #059669 100%)',
                        color: '#fff', fontWeight: 850, fontSize: 15, cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(15, 157, 88, 0.35)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      {isProcessingPayment ? '⏳ Opening Razorpay…' : <><FaLock /> Pay ₹{paymentMaterial.price} with Razorpay &amp; View PDF →</>}
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
        <PdfViewerModal pdf={activePdf} onClose={handleClosePdfModal} />
      )}

      {/* Spinner keyframe */}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
