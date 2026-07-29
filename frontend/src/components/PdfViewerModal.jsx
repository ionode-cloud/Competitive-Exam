// PdfViewerModal.jsx — Mobile-responsive PDF viewer with 0-100% smooth percentage loader & direct mobile PDF rendering
import { useEffect, useState, useRef } from 'react';
import { FaTimes, FaLock, FaFilePdf } from 'react-icons/fa';

export default function PdfViewerModal({ pdf, onClose }) {
  const [isMobile, setIsMobile] = useState(false);

  // PDF Loading Progress State (0% to 100%)
  const [progress, setProgress] = useState(0);
  const [loadingPdf, setLoadingPdf] = useState(true);

  const timerRef = useRef(null);

  // 1. Mobile screen detector
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 2. Smooth 0% -> 100% Loader simulation with safety fallback
  useEffect(() => {
    setProgress(0);
    setLoadingPdf(true);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timerRef.current);
          return 95;
        }
        const step = prev < 40 ? 5 : prev < 75 ? 3 : 2;
        return Math.min(prev + step, 95);
      });
    }, 35);

    // Safety timeout: dismiss loader after 2.2 seconds if onLoad event doesn't trigger on mobile browsers
    const safetyTimeout = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setTimeout(() => {
        setLoadingPdf(false);
      }, 300);
    }, 2200);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(safetyTimeout);
    };
  }, [pdf]);

  // Handle PDF loaded event
  const handleIframeLoaded = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => {
      setLoadingPdf(false);
    }, 300);
  };

  if (!pdf) return null;

  const rawPdfUrl = pdf.pdfUrl || '';
  const fullPdfUrl = rawPdfUrl.startsWith('http://') || rawPdfUrl.startsWith('https://')
    ? rawPdfUrl
    : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${rawPdfUrl.startsWith('/') ? '' : '/'}${rawPdfUrl}`;

  // Direct PDF URL with toolbar disabled
  const securePdfUrl = fullPdfUrl.includes('#') ? fullPdfUrl : `${fullPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`;

  // On Mobile: Use direct securePdfUrl (native WebKit/Blink PDF engine in Safari & Chrome)
  // On Desktop: Use Google Docs Viewer for public URLs or direct securePdfUrl
  const isPublicUrl = fullPdfUrl.startsWith('http') && !fullPdfUrl.includes('localhost') && !fullPdfUrl.includes('127.0.0.1');
  const iframeSrc = (!isMobile && isPublicUrl)
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fullPdfUrl)}`
    : securePdfUrl;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: '#0f172a', zIndex: 100000,
        display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh',
        userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
        overflow: 'hidden'
      }}
    >
      {/* Responsive Header Bar */}
      <div style={{
        height: isMobile ? 48 : 52, background: '#090d16', color: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        zIndex: 20, borderBottom: '1px solid #1e293b', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1, marginRight: 8 }}>
          <FaFilePdf style={{ flexShrink: 0, color: '#ef4444', fontSize: isMobile ? 16 : 18 }} />
          <span style={{
            fontSize: isMobile ? 12.5 : 14, fontWeight: 700, color: '#f8fafc',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {pdf.title}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!isMobile && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(15, 157, 88, 0.15)', border: '1px solid rgba(15, 157, 88, 0.3)',
              borderRadius: 6, padding: '4px 10px', color: '#4ADE80', fontSize: 11, fontWeight: 700
            }}>
              <FaLock style={{ fontSize: 10 }} /> Protected View
            </div>
          )}
          <button
            onClick={onClose}
            style={{
              background: '#DC2626', color: '#fff', border: 'none',
              padding: isMobile ? '5px 10px' : '6px 14px', borderRadius: 8, fontWeight: 800,
              fontSize: isMobile ? 11.5 : 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            <FaTimes /> Close
          </button>
        </div>
      </div>

      {/* Main PDF View Frame Container */}
      <div style={{
        flex: 1, width: '100%', height: `calc(100vh - ${isMobile ? 48 : 52}px)`,
        background: '#1e293b', position: 'relative', overflow: 'hidden',
        WebkitOverflowScrolling: 'touch'
      }}>
        
        {/* ── 0-100% PERCENTAGE COUNTER PROGRESS OVERLAY ── */}
        {loadingPdf && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 60,
            background: '#0f172a', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', padding: 24,
            transition: 'opacity 0.35s ease-out'
          }}>
            {/* Circular Percentage Badge */}
            <div style={{
              width: isMobile ? 110 : 130, height: isMobile ? 110 : 130,
              borderRadius: '50%',
              background: 'radial-gradient(circle, #1e293b 65%, #0f172a 66%)',
              border: '4px solid #334155',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 40px rgba(37,99,235,0.25)',
              marginBottom: 20, position: 'relative'
            }}>
              <div style={{
                fontSize: isMobile ? 28 : 34, fontWeight: 900,
                color: '#38bdf8', fontFamily: 'monospace', letterSpacing: -1
              }}>
                {progress}%
              </div>
              <div style={{
                fontSize: 10, color: '#94a3b8', textTransform: 'uppercase',
                letterSpacing: 1.2, marginTop: 2, fontWeight: 700
              }}>
                Loading PDF
              </div>
            </div>

            {/* Horizontal Progress Bar */}
            <div style={{
              width: '100%', maxWidth: 280, background: '#1e293b',
              height: 8, borderRadius: 10, overflow: 'hidden',
              border: '1px solid #334155', marginBottom: 14
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'linear-gradient(90deg, #2563eb, #38bdf8, #4ade80)',
                transition: 'width 0.12s ease-out', borderRadius: 10
              }} />
            </div>

            <div style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600, textAlign: 'center', maxWidth: 300 }}>
              {progress < 100 ? 'Preparing document for mobile viewing…' : 'Document Ready!'}
            </div>
          </div>
        )}

        {/* Security Watermark Grid Overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
          display: 'grid', gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(130px, 1fr))' : 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: isMobile ? 18 : 36, padding: isMobile ? 12 : 24, opacity: 0.12, overflow: 'hidden'
        }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} style={{
              transform: 'rotate(-25deg)', fontSize: isMobile ? 10 : 12, fontWeight: 800,
              color: '#fff', textTransform: 'uppercase', letterSpacing: 1.2,
              userSelect: 'none', whiteSpace: 'nowrap'
            }}>
              Sunil Sir Academy • Protected
            </div>
          ))}
        </div>

        {/* Responsive Mobile PDF Frame */}
        <iframe
          src={iframeSrc}
          title={pdf.title}
          onLoad={handleIframeLoaded}
          style={{
            width: '100%', height: '100%', border: 'none',
            background: '#1e293b', WebkitOverflowScrolling: 'touch'
          }}
        />
      </div>

      {/* Anti-Print CSS */}
      <style>{`
        @media print {
          body { display: none !important; }
        }
      `}</style>
    </div>
  );
}
