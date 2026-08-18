// PdfViewerModal.jsx — Mobile-responsive PDF viewer with Left Visual Page Thumbnail Sidebar, Scroll Bar, Protected View & No Save/Download/Print Options
import { useEffect, useState, useRef } from 'react';
import {
  FaTimes,
  FaLock,
  FaFilePdf,
  FaChevronLeft,
  FaChevronRight,
  FaListUl,
  FaExpand,
  FaCompress,
  FaSearchPlus,
  FaSearchMinus,
  FaExclamationTriangle,
} from 'react-icons/fa';

export default function PdfViewerModal({ pdf, onClose }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // PDF Loading Progress State (0% to 100%)
  const [progress, setProgress] = useState(0);
  const [loadingPdf, setLoadingPdf] = useState(true);

  // Strict Mode Alert State
  const [strictAlert, setStrictAlert] = useState(null);
  const alertTimeoutRef = useRef(null);

  const showStrictAlert = (msg) => {
    setStrictAlert(msg);
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => {
      setStrictAlert(null);
    }, 2500);
  };

  // Viewer Controls State
  const [navpanes, setNavpanes] = useState(1); // 1 = show left thumbnail sidebar, 0 = hide
  const [zoomLevel, setZoomLevel] = useState(120); // Zoom percentage

  // PDF Title / Key for persistence
  const pdfKey = pdf?._id || pdf?.title || pdf?.pdfUrl || 'pdf';

  // Restore saved page number on mount (persists across page refreshes)
  const [currentPage, setCurrentPage] = useState(() => {
    try {
      const saved = localStorage.getItem(`pdf_last_page_${pdfKey}`);
      return saved ? Math.max(1, parseInt(saved, 10)) : 1;
    } catch {
      return 1;
    }
  });

  const [pageInputVal, setPageInputVal] = useState(() => String(currentPage));

  // Save current page number whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(`pdf_last_page_${pdfKey}`, String(currentPage));
    } catch { /* silent */ }
  }, [currentPage, pdfKey]);


  const timerRef = useRef(null);
  const modalContainerRef = useRef(null);
  const lastWheelTimeRef = useRef(0);
  const touchStartYRef = useRef(null);

  // 1. Mobile screen detector
  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      if (mobile) {
        setNavpanes(0);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 2. Strict Mode Restrictions (Right-Click, Double-Click, and Ctrl+S/Cmd+S inside PDF viewer)
  useEffect(() => {
    const el = modalContainerRef.current;
    if (!el) return;

    // Disable Right-Click context menu inside PDF Viewer
    const handleContextMenu = (e) => {
      e.preventDefault();
      e.stopPropagation();
      showStrictAlert("Right-click is disabled in Strict Mode.");
    };

    // Detect Double-Click inside PDF Viewer
    const handleDblClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      showStrictAlert("Double-click is disabled in Strict Mode.");
    };

    // Detect Ctrl+S / Cmd+S (Save) & Block shortcuts while PDF viewer is open
    const handleKeyDown = (e) => {
      const isSave = (e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S' || e.keyCode === 83);
      if (isSave) {
        e.preventDefault();
        e.stopPropagation();
        showStrictAlert("Saving the PDF is disabled in Strict Mode.");
        return;
      }

      // Also prevent Print (Ctrl+P / Cmd+P) or View Source (Ctrl+U)
      if ((e.ctrlKey || e.metaKey) && ['p', 'P', 'u', 'U'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Keyboard Arrow & Page Navigation
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        setCurrentPage((p) => {
          const next = p + 1;
          setPageInputVal(String(next));
          return next;
        });
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentPage((p) => {
          const prev = Math.max(1, p - 1);
          setPageInputVal(String(prev));
          return prev;
        });
      }
    };

    el.addEventListener('contextmenu', handleContextMenu, true);
    el.addEventListener('dblclick', handleDblClick, true);
    window.addEventListener('keydown', handleKeyDown, true);

    return () => {
      el.removeEventListener('contextmenu', handleContextMenu, true);
      el.removeEventListener('dblclick', handleDblClick, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, []);

  const handleOverlayWheel = (e) => {
    const now = Date.now();
    if (now - lastWheelTimeRef.current < 220) return;
    if (e.deltaY > 20) {
      lastWheelTimeRef.current = now;
      handlePageSelect(currentPage + 1);
    } else if (e.deltaY < -20) {
      lastWheelTimeRef.current = now;
      handlePageSelect(Math.max(1, currentPage - 1));
    }
  };

  const handleOverlayTouchStart = (e) => {
    if (e.touches.length >= 2) {
      e.preventDefault();
      showStrictAlert("Double-click is disabled in Strict Mode.");
    } else if (e.touches.length === 1) {
      touchStartYRef.current = e.touches[0].clientY;
    }
  };

  const handleOverlayTouchEnd = (e) => {
    if (touchStartYRef.current !== null && e.changedTouches.length === 1) {
      const diff = touchStartYRef.current - e.changedTouches[0].clientY;
      if (diff > 45) {
        handlePageSelect(currentPage + 1);
      } else if (diff < -45) {
        handlePageSelect(Math.max(1, currentPage - 1));
      }
      touchStartYRef.current = null;
    }
  };

  // 3. Smooth 0% -> 100% Loader simulation with safety fallback
  useEffect(() => {
    setProgress(0);
    setLoadingPdf(true);

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(timerRef.current);
          return 95;
        }
        const step = prev < 40 ? 6 : prev < 75 ? 4 : 2;
        return Math.min(prev + step, 95);
      });
    }, 30);

    const safetyTimeout = setTimeout(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      setProgress(100);
      setTimeout(() => setLoadingPdf(false), 250);
    }, 2000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTimeout(safetyTimeout);
    };
  }, [pdf]);

  const handleIframeLoaded = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setProgress(100);
    setTimeout(() => setLoadingPdf(false), 250);
  };

  const handlePageSelect = (pageNo) => {
    const target = Math.max(1, pageNo);
    setCurrentPage(target);
    setPageInputVal(String(target));
  };

  const handlePageInputSubmit = (e) => {
    e.preventDefault();
    const p = parseInt(pageInputVal, 10);
    if (!isNaN(p) && p > 0) {
      handlePageSelect(p);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!modalContainerRef.current) return;
    if (!document.fullscreenElement) {
      modalContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  if (!pdf) return null;

  const rawPdfUrl = pdf?.pdfUrl || pdf?.fileUrl || pdf?.url || '';
  let fullPdfUrl = rawPdfUrl.startsWith('http://') || rawPdfUrl.startsWith('https://')
    ? rawPdfUrl
    : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')}${rawPdfUrl.startsWith('/') ? '' : '/'}${rawPdfUrl}`;

  // Automatically upgrade HTTP to HTTPS when current page is HTTPS to prevent Mixed Content blocking
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && fullPdfUrl.startsWith('http://')) {
    fullPdfUrl = fullPdfUrl.replace(/^http:\/\//i, 'https://');
  }

  // Embedded PDF URL with left thumbnail pane (navpanes=1), scrollbar=1, zoom level & page jump enabled
  const iframeSrc = `${fullPdfUrl}#page=${currentPage}&zoom=${zoomLevel}&navpanes=${navpanes}&scrollbar=1&view=FitH`;


  return (
    <div
      ref={modalContainerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="pdf-viewer-root"
      style={{
        position: 'fixed', inset: 0, background: '#0f172a', zIndex: 100000,
        display: 'flex', flexDirection: 'column', width: '100vw', height: '100vh',
        userSelect: 'none', WebkitUserSelect: 'none',
        overflow: 'hidden',
        touchAction: 'pan-x pan-y pinch-zoom',
      }}
    >
      {/* ── RESPONSIVE TOP HEADER BAR (EXACT DESIGN AS SCREENSHOT) ── */}
      <div
        style={{
          height: isMobile ? 48 : 52, background: '#090d16', color: '#f8fafc',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 12px', boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
          zIndex: 30, borderBottom: '1px solid #1e293b', flexShrink: 0, gap: 8,
        }}
      >
        {/* Left Side: Pages Toggle & PDF Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', flex: '1 1 auto' }}>
          <button
            onClick={() => setNavpanes((prev) => (prev === 1 ? 0 : 1))}
            title="Toggle Left Page Thumbnails Sidebar"
            style={{
              background: navpanes === 1 ? '#2563eb' : '#1e293b',
              color: '#fff', border: '1px solid #334155',
              padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s ease', flexShrink: 0,
            }}
          >
            <FaListUl style={{ fontSize: 13 }} />
            Pages
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
            <FaFilePdf style={{ flexShrink: 0, color: '#ef4444', fontSize: isMobile ? 16 : 18 }} />
            <span
              style={{
                fontSize: isMobile ? 12.5 : 14, fontWeight: 700, color: '#f8fafc',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}
            >
              {pdf.title}
            </span>
          </div>
        </div>

        {/* Center: Page Jump Stepper & Zoom Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Page Stepper */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#1e293b', padding: '3px 6px', borderRadius: 8, border: '1px solid #334155' }}>
            <button
              onClick={() => handlePageSelect(currentPage - 1)}
              disabled={currentPage <= 1}
              title="Previous Page"
              style={{
                background: 'transparent', color: currentPage <= 1 ? '#475569' : '#f8fafc',
                border: 'none', padding: '3px 6px', borderRadius: 4,
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', fontSize: 11,
              }}
            >
              <FaChevronLeft />
            </button>

            <form onSubmit={handlePageInputSubmit} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <input
                type="text"
                value={pageInputVal}
                onChange={(e) => setPageInputVal(e.target.value)}
                onBlur={handlePageInputSubmit}
                style={{
                  width: 32, height: 22, background: '#0f172a',
                  border: '1px solid #38bdf8', borderRadius: 4, color: '#38bdf8',
                  textAlign: 'center', fontSize: 11, fontWeight: 800, outline: 'none',
                }}
              />
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>/ ?</span>
            </form>

            <button
              onClick={() => handlePageSelect(currentPage + 1)}
              title="Next Page"
              style={{
                background: 'transparent', color: '#f8fafc',
                border: 'none', padding: '3px 6px', borderRadius: 4,
                cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 11,
              }}
            >
              <FaChevronRight />
            </button>
          </div>

          {/* Zoom Level Controller (available on both Mobile & Desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: '#1e293b', padding: '3px 6px', borderRadius: 8, border: '1px solid #334155' }}>
            <button
              onClick={() => setZoomLevel((z) => Math.max(50, z - 15))}
              title="Zoom Out"
              style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: isMobile ? 10 : 11, padding: 3 }}
            >
              <FaSearchMinus />
            </button>
            <span style={{ fontSize: isMobile ? 10 : 11, fontWeight: 800, color: '#38bdf8', padding: '0 2px', minWidth: isMobile ? 32 : 40, textAlign: 'center' }}>
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(300, z + 15))}
              title="Zoom In"
              style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer', fontSize: isMobile ? 10 : 11, padding: 3 }}
            >
              <FaSearchPlus />
            </button>
          </div>
        </div>

        {/* Right Side: Protected View & Close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!isMobile && (
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: 'rgba(15, 157, 88, 0.15)', border: '1px solid rgba(15, 157, 88, 0.3)',
                borderRadius: 6, padding: '4px 10px', color: '#4ADE80', fontSize: 11, fontWeight: 700,
              }}
            >
              <FaLock style={{ fontSize: 10 }} /> Protected View
            </div>
          )}

          {!isMobile && (
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              style={{
                background: '#1e293b', color: '#94a3b8', border: '1px solid #334155',
                padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', fontSize: 13,
              }}
            >
              {isFullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          )}

          <button
            onClick={onClose}
            style={{
              background: '#DC2626', color: '#fff', border: 'none',
              padding: isMobile ? '5px 10px' : '6px 14px', borderRadius: 8, fontWeight: 800,
              fontSize: isMobile ? 11.5 : 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <FaTimes /> Close
          </button>
        </div>
      </div>

      {/* ── MAIN PDF EMBED AREA (EXACT LAYOUT AS SCREENSHOT) ── */}
      <div
        className="pdf-iframe-container"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          showStrictAlert("Right-click is disabled in Strict Mode.");
        }}
        onDoubleClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          showStrictAlert("Double-click is disabled in Strict Mode.");
        }}
        style={{
          flex: 1, width: '100%', height: `calc(100vh - ${isMobile ? 48 : 52}px)`,
          background: '#1e293b', position: 'relative', overflow: 'hidden',
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y pinch-zoom',
        }}
      >
        {/* ── STRICT MODE ALERT NOTIFICATION OVERLAY ── */}
        {strictAlert && (
          <div
            style={{
              position: 'absolute',
              top: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              background: 'rgba(15, 23, 42, 0.96)',
              border: '1.5px solid #ef4444',
              borderRadius: 10,
              padding: '10px 18px',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#f87171',
              fontSize: 13,
              fontWeight: 700,
              animation: 'strictSlideDown 0.25s ease-out',
              pointerEvents: 'auto',
              maxWidth: '92vw',
            }}
          >
            <FaExclamationTriangle style={{ flexShrink: 0, fontSize: 15, color: '#ef4444' }} />
            <span>{strictAlert}</span>
            <button
              onClick={() => setStrictAlert(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '2px 4px',
                marginLeft: 4,
              }}
            >
              <FaTimes fontSize={12} />
            </button>
          </div>
        )}

        {/* 0-100% PERCENTAGE COUNTER PROGRESS OVERLAY */}
        {loadingPdf && (
          <div
            style={{
              position: 'absolute', inset: 0, zIndex: 60,
              background: '#0f172a', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', padding: 24,
              transition: 'opacity 0.35s ease-out',
            }}
          >
            <div
              style={{
                width: isMobile ? 110 : 130, height: isMobile ? 110 : 130,
                borderRadius: '50%',
                background: 'radial-gradient(circle, #1e293b 65%, #0f172a 66%)',
                border: '4px solid #334155',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(37,99,235,0.25)',
                marginBottom: 20, position: 'relative',
              }}
            >
              <div
                style={{
                  fontSize: isMobile ? 28 : 34, fontWeight: 900,
                  color: '#38bdf8', fontFamily: 'monospace', letterSpacing: -1,
                }}
              >
                {progress}%
              </div>
              <div
                style={{
                  fontSize: 10, color: '#94a3b8', textTransform: 'uppercase',
                  letterSpacing: 1.2, marginTop: 2, fontWeight: 700,
                }}
              >
                Loading PDF
              </div>
            </div>

            <div
              style={{
                width: '100%', maxWidth: 280, background: '#1e293b',
                height: 8, borderRadius: 10, overflow: 'hidden',
                border: '1px solid #334155', marginBottom: 14,
              }}
            >
              <div
                style={{
                  height: '100%', width: `${progress}%`,
                  background: 'linear-gradient(90deg, #2563eb, #38bdf8, #4ade80)',
                  transition: 'width 0.12s ease-out', borderRadius: 10,
                }}
              />
            </div>

            <div style={{ fontSize: 13, color: '#cbd5e1', fontWeight: 600, textAlign: 'center', maxWidth: 300 }}>
              {progress < 100 ? 'Preparing document viewer…' : 'Document Ready!'}
            </div>
          </div>
        )}

        {/* Security Watermark Grid Overlay */}
        <div
          style={{
            position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10,
            display: 'grid',
            gridTemplateColumns: isMobile
              ? 'repeat(auto-fill, minmax(130px, 1fr))'
              : 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: isMobile ? 18 : 36, padding: isMobile ? 12 : 24,
            opacity: 0.12, overflow: 'hidden',
          }}
        >
          {Array.from({ length: 16 }).map((_, i) => (
            <div
              key={i}
              style={{
                transform: 'rotate(-25deg)', fontSize: isMobile ? 10 : 12, fontWeight: 800,
                color: '#fff', textTransform: 'uppercase', letterSpacing: 1.2,
                userSelect: 'none', whiteSpace: 'nowrap',
              }}
            >
              Sunil Sir Academy • Protected
            </div>
          ))}
        </div>

        {/* Top-Right Protective Shield Overlay — Covers ONLY the Download (💾), Save & Print (🖨️) buttons from Chrome's inner toolbar */}
        <div
          title="Save, Download and Print options are disabled in Protected View"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: isMobile ? 120 : 210,
            height: 48,
            background: '#323639', // Matches Chrome PDF viewer toolbar dark grey background
            zIndex: 25,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#94a3b8',
            fontSize: 11,
            fontWeight: 700,
            borderBottomLeftRadius: 6,
            boxShadow: '-2px 2px 8px rgba(0,0,0,0.3)',
            userSelect: 'none',
          }}
        >
          <FaLock style={{ color: '#4ade80', marginRight: 5, fontSize: 10 }} />
          Protected
        </div>

        {/* Full-Coverage PDF Security Interaction Guard (Intercepts Right-Click & Double-Click Before Reaching Browser PDF Plugin) */}
        <div
          className="pdf-security-guard"
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            showStrictAlert("Right-click is disabled in Strict Mode.");
          }}
          onDoubleClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            showStrictAlert("Double-click is disabled in Strict Mode.");
          }}
          onWheel={handleOverlayWheel}
          onTouchStart={handleOverlayTouchStart}
          onTouchEnd={handleOverlayTouchEnd}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 15,
            background: 'rgba(0, 0, 0, 0.001)',
            cursor: 'default',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
        />

        {/* Embedded PDF Viewer iFrame (Matches Screenshot Layout) */}
        <iframe
          key={`${fullPdfUrl}_page_${currentPage}_zoom_${zoomLevel}_nav_${navpanes}`}
          src={iframeSrc}
          title={pdf.title}
          onLoad={handleIframeLoaded}
          allow="fullscreen"
          style={{
            width: '100%', height: '100%', border: 'none',
            background: '#1e293b', WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y pinch-zoom',
          }}
        />
      </div>

      {/* Anti-Print & Touch Styles */}
      <style>{`
        .pdf-viewer-root, .pdf-iframe-container {
          touch-action: pan-x pan-y pinch-zoom !important;
          -webkit-touch-callout: none;
        }
        @keyframes strictSlideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0) scale(1);
          }
        }
        @media print {
          html, body, iframe, div {
            display: none !important;
            visibility: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}
