import { useEffect, useState } from 'react';
import { FaFileAlt, FaTimes, FaLock, FaExclamationTriangle } from 'react-icons/fa';

export default function PdfViewerModal({ pdf, onClose }) {
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  useEffect(() => {
    const triggerScreenshotWarning = () => {
      setShowScreenshotModal(true);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText('');
      }
    };

    // 1. Block keyboard shortcuts for PrintScreen, Snipping tool, Print (Ctrl+P / Cmd+P), Save (Ctrl+S / Cmd+S)
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        e.preventDefault();
        e.stopPropagation();
        triggerScreenshotWarning();
        return false;
      }

      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 's' || e.key === 'S' || e.key === '3' || e.key === '4' || e.key === '5')) {
        e.preventDefault();
        e.stopPropagation();
        triggerScreenshotWarning();
        return false;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        e.stopPropagation();
        triggerScreenshotWarning();
        return false;
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        triggerScreenshotWarning();
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerScreenshotWarning();
      }
    };

    const handleWindowBlur = () => {
      triggerScreenshotWarning();
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (!pdf) return null;

  const rawPdfUrl = pdf.pdfUrl || '';
  const fullPdfUrl = rawPdfUrl.startsWith('http://') || rawPdfUrl.startsWith('https://')
    ? rawPdfUrl
    : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${rawPdfUrl.startsWith('/') ? '' : '/'}${rawPdfUrl}`;

  // Hide native PDF viewer download/save/print toolbars
  const securePdfUrl = fullPdfUrl.includes('#') ? fullPdfUrl : `${fullPdfUrl}#toolbar=0&navpanes=0&scrollbar=0`;

  const isPublicUrl = fullPdfUrl.startsWith('http') && !fullPdfUrl.includes('localhost') && !fullPdfUrl.includes('127.0.0.1');
  const iframeSrc = isPublicUrl
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(fullPdfUrl)}`
    : securePdfUrl;

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        position: 'fixed', inset: 0, background: '#0f172a', zIndex: 100000,
        display: 'flex', flexDirection: 'column',
        userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none',
      }}
    >
      {/* Responsive Security Header */}
      <div style={{
        height: 52, background: '#090d16', color: '#f8fafc',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
        zIndex: 20, borderBottom: '1px solid #1e293b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: 1, marginRight: 8 }}>
          <FaFileAlt style={{ flexShrink: 0, color: '#FFC93C', fontSize: 16 }} />
          <span style={{
            fontSize: isMobile ? 12 : 13.5, fontWeight: 700, color: '#f8fafc',
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
              padding: '6px 12px', borderRadius: 6, fontWeight: 800,
              fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4
            }}
          >
            <FaTimes /> Close
          </button>
        </div>
      </div>

      {/* Main PDF Viewer Frame Container */}
      <div style={{
        flex: 1, width: '100%', height: 'calc(100% - 52px)',
        background: '#1e293b', position: 'relative', overflow: 'hidden',
        WebkitOverflowScrolling: 'touch'
      }}>
        
        {/* Security Watermark Grid Overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
          display: 'grid', gridTemplateColumns: isMobile ? 'repeat(auto-fill, minmax(140px, 1fr))' : 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: isMobile ? 20 : 40, padding: isMobile ? 15 : 30, opacity: 0.12, overflow: 'hidden'
        }}>
          {Array.from({ length: 16 }).map((_, i) => (
            <div key={i} style={{
              transform: 'rotate(-25deg)', fontSize: isMobile ? 10 : 12, fontWeight: 800,
              color: '#fff', textTransform: 'uppercase', letterSpacing: 1.2,
              userSelect: 'none', whiteSpace: 'nowrap'
            }}>
              PrepHub Security • Protected
            </div>
          ))}
        </div>

        {/* PDF Frame — Uses iframe directly on mobile for smooth touch scrolling */}
        {isMobile ? (
          <iframe
            src={iframeSrc}
            title={pdf.title}
            style={{
              width: '100%', height: '100%', border: 'none',
              background: '#1e293b', WebkitOverflowScrolling: 'touch'
            }}
          />
        ) : (
          <object
            data={securePdfUrl}
            type="application/pdf"
            style={{ width: '100%', height: '100%', border: 'none' }}
          >
            <iframe
              src={iframeSrc}
              title={pdf.title}
              style={{ width: '100%', height: '100%', border: 'none', background: '#1e293b' }}
            />
          </object>
        )}
      </div>

      {/* ── Screenshots Not Allowed Popup Modal ────────────────────── */}
      {showScreenshotModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200000,
          background: 'rgba(15, 23, 42, 0.88)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: '#1e293b', border: '1.5px solid #ef4444', borderRadius: 20,
            padding: isMobile ? '24px 18px' : '32px 24px', maxWidth: 420, width: '100%', textAlign: 'center',
            boxShadow: '0 25px 50px -12px rgba(239, 68, 68, 0.35)', color: '#fff'
          }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)',
              border: '2px solid #ef4444', color: '#ef4444', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 16px'
            }}>
              <FaExclamationTriangle />
            </div>

            <h3 style={{ fontSize: 18, fontWeight: 900, color: '#fff', marginBottom: 8, letterSpacing: -0.3 }}>
              Screenshots Not Allowed!
            </h3>

            <p style={{ fontSize: 13, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 20, padding: '0 4px' }}>
              Taking screenshots, screen recording, or saving PDF study material is strictly prohibited on PrepHub to protect copyrighted content.
            </p>

            <button
              onClick={() => setShowScreenshotModal(false)}
              style={{
                width: '100%', padding: '12px', background: '#ef4444', color: '#fff',
                border: 'none', borderRadius: 12, fontWeight: 800, fontSize: 13.5,
                cursor: 'pointer', transition: 'background 0.2s', boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
            >
              I Understand &amp; Agree
            </button>
          </div>
        </div>
      )}

      {/* Anti-Print CSS */}
      <style>{`
        @media print {
          body { display: none !important; }
        }
      `}</style>
    </div>
  );
}
