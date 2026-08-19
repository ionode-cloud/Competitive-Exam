// PdfViewerModal.jsx — Clean, 100% unrestricted original PDF viewer for Desktop, Tablet & Mobile
import { useEffect, useState, useRef } from 'react';
import {
  FaTimes,
  FaFilePdf,
  FaDownload,
  FaExternalLinkAlt,
  FaExpand,
  FaCompress,
  FaPrint,
  FaGoogle
} from 'react-icons/fa';

export default function PdfViewerModal({ pdf, onClose }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [useGoogleViewer, setUseGoogleViewer] = useState(false);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  // 1. Lock background page scrolling & listen for ESC key
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !document.fullscreenElement) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // 2. Mobile screen detector & viewport resize handler
  useEffect(() => {
    const checkMobile = () => {
      const mobile =
        window.innerWidth <= 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 3. Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  if (!pdf) return null;

  const rawPdfUrl = pdf?.pdfUrl || pdf?.fileUrl || pdf?.url || '';
  let fullPdfUrl = rawPdfUrl.startsWith('http://') || rawPdfUrl.startsWith('https://')
    ? rawPdfUrl
    : `${(import.meta.env.VITE_API_URL || 'http://localhost:5303/api').replace(/\/api\/?$/, '')}${rawPdfUrl.startsWith('/') ? '' : '/'}${rawPdfUrl}`;

  // Automatically upgrade HTTP to HTTPS when current page is HTTPS
  if (typeof window !== 'undefined' && window.location.protocol === 'https:' && fullPdfUrl.startsWith('http://')) {
    fullPdfUrl = fullPdfUrl.replace(/^http:\/\//i, 'https://');
  }

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fullPdfUrl;
    a.download = (pdf.title || 'document').replace(/[^a-zA-Z0-9_-]/g, '_') + '.pdf';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenOriginal = () => {
    window.open(fullPdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.open(fullPdfUrl, '_blank')?.print?.();
  };

  const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fullPdfUrl)}&embedded=true`;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '-webkit-fill-available',
        maxHeight: '100dvh',
        background: '#0f172a',
        zIndex: 100000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* ── TOP HEADER BAR (RESPONSIVE FOR ALL SCREEN SIZES) ── */}
      <div
        style={{
          minHeight: isMobile ? 48 : 52,
          height: isMobile ? 'auto' : 52,
          background: '#0b1120',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 'max(6px, env(safe-area-inset-top))',
          paddingBottom: 6,
          paddingLeft: 'max(12px, env(safe-area-inset-left))',
          paddingRight: 'max(12px, env(safe-area-inset-right))',
          boxShadow: '0 2px 10px rgba(0,0,0,0.5)',
          zIndex: 30,
          borderBottom: '1px solid #1e293b',
          flexShrink: 0,
          gap: 10,
          flexWrap: 'nowrap',
        }}
      >
        {/* Left Side: PDF Icon & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', minWidth: 0, flex: '1 1 auto' }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#ef444422',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FaFilePdf style={{ fontSize: 16 }} />
          </div>
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <span
              style={{
                fontSize: isMobile ? 12.5 : 14,
                fontWeight: 700,
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: 'block',
                lineHeight: 1.2,
              }}
              title={pdf.title}
            >
              {pdf.title}
            </span>
            {pdf.subjectName || pdf.category ? (
              <span style={{ fontSize: 10.5, color: '#94a3b8', fontWeight: 600 }}>
                {pdf.subjectName || pdf.category}
              </span>
            ) : null}
          </div>
        </div>

        {/* Right Side Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 8, flexShrink: 0 }}>
          {/* Toggle Google Docs Viewer on mobile if needed */}
          {isMobile && (
            <button
              onClick={() => setUseGoogleViewer(prev => !prev)}
              title="Toggle Google Docs PDF Engine"
              style={{
                background: useGoogleViewer ? '#3b82f6' : '#1e293b',
                color: '#fff',
                border: '1px solid #334155',
                padding: '6px 9px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                touchAction: 'manipulation',
              }}
            >
              <FaGoogle fontSize={10} /> {useGoogleViewer ? 'Original' : 'Alt View'}
            </button>
          )}

          {/* Open Original in New Tab */}
          <button
            onClick={handleOpenOriginal}
            title="Open Original PDF in New Browser Tab"
            style={{
              background: '#1e293b',
              color: '#38bdf8',
              border: '1px solid #334155',
              padding: isMobile ? '6px 9px' : '6px 12px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: isMobile ? 11 : 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              touchAction: 'manipulation',
            }}
          >
            <FaExternalLinkAlt fontSize={11} />
            {!isMobile && 'Open in Tab'}
          </button>

          {/* Direct Download Button */}
          <button
            onClick={handleDownload}
            title="Download PDF Document"
            style={{
              background: '#1e293b',
              color: '#10b981',
              border: '1px solid #334155',
              padding: isMobile ? '6px 9px' : '6px 12px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: isMobile ? 11 : 12,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              touchAction: 'manipulation',
            }}
          >
            <FaDownload fontSize={11} />
            {!isMobile && 'Download'}
          </button>

          {/* Print Button (Desktop) */}
          {!isMobile && (
            <button
              onClick={handlePrint}
              title="Print Document"
              style={{
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                padding: '6px 10px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <FaPrint fontSize={12} />
            </button>
          )}

          {/* Fullscreen Toggle (desktop/tablet) */}
          {!isMobile && (
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              style={{
                background: '#1e293b',
                color: '#f8fafc',
                border: '1px solid #334155',
                padding: '6px 10px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 12,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isFullscreen ? <FaCompress fontSize={12} /> : <FaExpand fontSize={12} />}
            </button>
          )}

          {/* Close Button */}
          <button
            onClick={onClose}
            title="Close PDF Viewer"
            aria-label="Close PDF Viewer"
            style={{
              background: '#dc2626',
              color: '#fff',
              border: 'none',
              padding: isMobile ? '6px 11px' : '6px 14px',
              borderRadius: 8,
              fontWeight: 800,
              fontSize: isMobile ? 11.5 : 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              flexShrink: 0,
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.35)',
              touchAction: 'manipulation',
            }}
          >
            <FaTimes /> Close
          </button>
        </div>
      </div>

      {/* ── MAIN PDF VIEW AREA (ORIGINAL NATIVE PDF VIEWER WITH REAL TOOLS) ── */}
      <div
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          background: '#1e293b',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        {/* Loading Spinner Indicator */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 10,
              background: '#0f172a',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                border: '4px solid #334155',
                borderTopColor: '#38bdf8',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
                marginBottom: 14,
              }}
            />
            <div style={{ fontSize: 13.5, color: '#f8fafc', fontWeight: 700 }}>
              Opening Original PDF Document…
            </div>
            <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 4 }}>
              Loading high-resolution reader
            </div>
            <style>{`
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        )}

        {useGoogleViewer ? (
          <iframe
            src={googleDocsViewerUrl}
            title={pdf.title}
            width="100%"
            height="100%"
            onLoad={() => setLoading(false)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              background: '#fff',
              display: 'block',
            }}
          />
        ) : (
          <object
            data={`${fullPdfUrl}#view=FitH`}
            type="application/pdf"
            width="100%"
            height="100%"
            onLoad={() => setLoading(false)}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block',
              background: '#1e293b',
            }}
          >
            <iframe
              src={fullPdfUrl}
              title={pdf.title}
              width="100%"
              height="100%"
              onLoad={() => setLoading(false)}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: '#1e293b',
                display: 'block',
              }}
            >
              <div style={{ padding: 40, textAlign: 'center', color: '#fff' }}>
                <p style={{ fontSize: 15, marginBottom: 16 }}>
                  Unable to display PDF directly in your browser.
                </p>
                <button
                  onClick={handleOpenOriginal}
                  style={{
                    background: '#38bdf8',
                    color: '#0f172a',
                    padding: '10px 22px',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 800,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  Open PDF in New Window →
                </button>
              </div>
            </iframe>
          </object>
        )}
      </div>
    </div>
  );
}




