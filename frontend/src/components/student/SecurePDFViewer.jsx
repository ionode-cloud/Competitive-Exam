import React, { useEffect, useRef, useState } from 'react';
import { X, Lock, EyeOff, Loader, RefreshCw, ZoomIn, ZoomOut, ShieldAlert, CameraOff } from 'lucide-react';

export default function SecurePDFViewer({ pdfData, title, userInfo, onClose, watermarkTemplate }) {
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [blurred, setBlurred] = useState(false);
  const [scale, setScale] = useState(1.2);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const pdfDocRef = useRef(null);
  const [screenshotAlert, setScreenshotAlert] = useState(false);
  const [securityAlert, setSecurityAlert] = useState(null); // null | string message

  // Extract base64 clean data (strip data:application/pdf;base64, prefix if present)
  const getCleanBase64 = (data) => {
    if (!data) return '';
    if (data.includes(';base64,')) {
      return data.split(';base64,')[1];
    }
    return data;
  };

  // Prevent right-click, selection, copy, save, and print shortcuts
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleKeyDown = (e) => {
      // Check for Ctrl/Cmd shortcuts
      const isCmd = e.ctrlKey || e.metaKey;
      if (
        (isCmd && e.key === 'c') || // Copy
        (isCmd && e.key === 's') || // Save
        (isCmd && e.key === 'p') || // Print
        e.key === 'F12' ||          // Dev tools
        (isCmd && e.shiftKey && e.key === 'I') // Dev tools shortcut
      ) {
        e.preventDefault();
        setSecurityAlert('This action is not permitted in Secure View Mode.');
      }
    };

    // Detect lost focus (e.g., if screenshot tool / another app takes focus)
    const handleWindowBlur = () => {
      setBlurred(true);
    };

    const handleWindowFocus = () => {
      setBlurred(false);
    };

    // Prevent print-screen clipboard copying if possible
    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen') {
        navigator.clipboard.writeText(''); // Clear clipboard immediately
        setScreenshotAlert(true);
      }
    };

    // ── MOBILE SCREENSHOT DETECTION ──────────────────────────────────────────
    // On Android/iOS: when user presses the screenshot button, the browser
    // page momentarily goes hidden then immediately becomes visible again.
    // We detect this rapid hide→show cycle (within 2 seconds) as a screenshot.
    let hiddenAt = null;
    const SCREENSHOT_WINDOW_MS = 2000; // typical screenshot transition is <500ms

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page just went hidden — record when
        hiddenAt = Date.now();
      } else {
        // Page came back — check if it was a rapid toggle
        if (hiddenAt !== null) {
          const elapsed = Date.now() - hiddenAt;
          if (elapsed < SCREENSHOT_WINDOW_MS) {
            // Very fast hide+show → highly likely a screenshot
            setScreenshotAlert(true);
          }
          hiddenAt = null;
        }
      }
    };

    // Prevent long-press context menu on touch devices (iOS save-image, Android share)
    const handleTouchStart = (e) => {
      // Record touch start time for long-press detection
      e.currentTarget._touchStartTime = Date.now();
    };

    const handleTouchEnd = () => { /* noop */ };

    // Prevent image drag-and-drop saving on mobile
    const handleDragStart = (e) => e.preventDefault();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('dragstart', handleDragStart);

    // Inject css to prevent print media and style grid
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @media print {
        body { display: none !important; }
      }
      .pdf-container {
        display: grid !important;
        grid-template-columns: repeat(2, 1fr) !important;
        gap: 24px !important;
        width: 100% !important;
        max-width: 1200px !important;
        margin: 0 auto !important;
        padding-bottom: 40px !important;
        box-sizing: border-box !important;
      }
      .pdf-container canvas {
        max-width: 100% !important;
        height: auto !important;
        filter: ${blurred ? 'blur(15px)' : 'none'};
        transition: filter 0.15s ease;
        /* Block mobile long-press image save */
        -webkit-touch-callout: none !important;
        pointer-events: none !important;
      }
      @media (max-width: 900px) {
        .pdf-container {
          grid-template-columns: 1fr !important;
          padding: 0 12px !important;
        }
      }
      /* Prevent user selection + touch callout globally in viewer */
      .no-select {
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        user-select: none;
        -webkit-touch-callout: none;
        touch-action: pan-y;
      }
      /* Block tap highlight on mobile */
      .no-select * {
        -webkit-tap-highlight-color: transparent;
      }
    `;
    document.head.appendChild(styleEl);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('dragstart', handleDragStart);
      document.head.removeChild(styleEl);
    };
  }, [blurred]);

  // Load PDF.js from CDN and render document
  useEffect(() => {
    let active = true;

    const loadAndRenderPDF = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load PDF.js script dynamically if not available
        if (!window.pdfjsLib) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
            script.onload = () => {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
              resolve();
            };
            script.onerror = () => reject(new Error('Failed to load PDF viewer engine.'));
            document.body.appendChild(script);
          });
        }

        if (!active) return;

        const pdfjsLib = window.pdfjsLib;
        const cleanBase64 = getCleanBase64(pdfData);

        // Convert base64 to Uint8Array
        const raw = window.atob(cleanBase64);
        const rawLength = raw.length;
        const array = new Uint8Array(new ArrayBuffer(rawLength));
        for (let i = 0; i < rawLength; i++) {
          array[i] = raw.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: array });
        const pdf = await loadingTask.promise;
        
        if (!active) return;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        
        renderAllPages(pdf);
      } catch (err) {
        console.error(err);
        if (active) setError('Could not load secure PDF document. Make sure it is a valid PDF.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAndRenderPDF();

    return () => {
      active = false;
    };
  }, [pdfData, scale]);

  const renderAllPages = async (pdf) => {
    if (!containerRef.current) return;
    containerRef.current.innerHTML = ''; // clear previous render

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: scale });

        // Container div for page & watermark overlay
        const pageWrapper = document.createElement('div');
        pageWrapper.style.position = 'relative';
        pageWrapper.style.marginBottom = '28px';
        pageWrapper.style.display = 'block';
        pageWrapper.style.width = '100%';
        pageWrapper.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        pageWrapper.style.borderRadius = '12px';
        pageWrapper.style.overflow = 'hidden';
        pageWrapper.style.border = '1px solid rgba(255, 255, 255, 0.08)';
        pageWrapper.style.backgroundColor = '#1e293b';

        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        canvas.style.display = 'block';

        pageWrapper.appendChild(canvas);
        containerRef.current.appendChild(pageWrapper);

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };
        await page.render(renderContext).promise;

        // Burn the watermark directly into canvas pixels (cannot be removed via CSS/HTML edits)
        const watermarkText = watermarkTemplate || 'EXAMSPHERE SECURE VIEW';
        drawPixelWatermark(canvas, watermarkText);

      } catch (err) {
        console.error(`Error rendering page ${pageNum}:`, err);
      }
    }
  };

  const drawPixelWatermark = (canvas, text) => {
    const ctx = canvas.getContext('2d');
    ctx.save();
    
    // Transparent overlay setup
    ctx.font = 'bold 22px Outfit, Inter, sans-serif';
    ctx.fillStyle = 'rgba(255, 107, 0, 0.13)'; // Brand accent orange with very high transparency
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Rotate diagonal
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-35 * Math.PI / 180);
    
    // Repeat the text in grid pattern
    const textWidth = ctx.measureText(text).width + 120;
    const spacingY = 160;

    for (let x = -canvas.width; x < canvas.width; x += textWidth) {
      for (let y = -canvas.height; y < canvas.height; y += spacingY) {
        ctx.fillText(text, x, y);
      }
    }
    
    ctx.restore();
  };

  const handleZoom = (amount) => {
    setScale((prev) => Math.min(Math.max(prev + amount, 0.8), 2.2));
  };

  return (
    <div className="no-select" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(9, 15, 29, 0.95)',
      backdropFilter: 'blur(10px)',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      color: '#f8fafc'
    }}>
      {/* Top Header Bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(15, 23, 42, 0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            padding: '8px',
            borderRadius: '8px',
            background: 'rgba(255, 107, 0, 0.1)',
            color: '#ff6b00',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Lock size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>{title}</h2>
            <p style={{ fontSize: '0.72rem', color: '#94a3b8', margin: '2px 0 0 0', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <EyeOff size={12} /> Secure Read Mode • Watermarked for {userInfo?.email}
            </p>
          </div>
        </div>

        {/* Toolbar controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {!loading && !error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <button 
                onClick={() => handleZoom(-0.2)} 
                title="Zoom Out"
                style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '6px', cursor: 'pointer', display: 'flex', borderRadius: '4px' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                <ZoomOut size={16} />
              </button>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, minWidth: '40px', textAlign: 'center', color: '#cbd5e1' }}>
                {Math.round(scale * 100)}%
              </span>
              <button 
                onClick={() => handleZoom(0.2)} 
                title="Zoom In"
                style={{ background: 'none', border: 'none', color: '#94a3b8', padding: '6px', cursor: 'pointer', display: 'flex', borderRadius: '4px' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#94a3b8'}
              >
                <ZoomIn size={16} />
              </button>
            </div>
          )}

          <button 
            onClick={onClose} 
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: '#ef4444',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Main Render Area */}
      <div style={{
        flex: 1,
        overflow: 'auto',
        padding: '32px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: '#090d16',
        position: 'relative'
      }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '120px' }}>
            <Loader size={36} className="spin" color="#ff6b00" />
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>Securing and rendering PDF pages...</p>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', marginTop: '120px', maxWidth: '400px', textAlign: 'center' }}>
            <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
              <EyeOff size={32} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Rendition Error</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', lineHeight: '1.5' }}>{error}</p>
            <button onClick={onClose} className="btn btn-outline" style={{ marginTop: '8px' }}>Close Viewer</button>
          </div>
        )}

        {/* Dynamic Canvases */}
        <div 
          ref={containerRef} 
          className="pdf-container" 
          style={{ 
            display: loading || error ? 'none' : 'grid'
          }} 
        />

        {/* Lost Focus Blur Overlay */}
        {blurred && !loading && !error && (
          <div 
            onClick={() => setBlurred(false)}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(9, 13, 22, 0.7)',
              backdropFilter: 'blur(12px)',
              zIndex: 99,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <div className="glass" style={{
              padding: '32px',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
              maxWidth: '360px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              background: 'rgba(15,23,42,0.9)'
            }}>
              <RefreshCw size={36} className="spin" color="#ff6b00" style={{ marginBottom: '16px', animationDuration: '3s' }} />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '8px', color: '#f8fafc' }}>Secure View Suspended</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.5, margin: 0 }}>
                Viewing is paused when focus is switched. Click anywhere inside this screen to resume reading.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── SCREENSHOT BLOCKED ALERT ── */}
      {screenshotAlert && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.88)',
          backdropFilter: 'blur(18px)',
          WebkitBackdropFilter: 'blur(18px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          animation: 'fadeInAlert 0.25s ease'
        }}>
          <style>{`
            @keyframes fadeInAlert {
              from { opacity: 0; transform: scale(0.92); }
              to   { opacity: 1; transform: scale(1); }
            }
            @keyframes pulseRed {
              0%, 100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.45); }
              50%       { box-shadow: 0 0 0 22px rgba(239,68,68,0); }
            }
            @keyframes shakeIcon {
              0%, 100% { transform: rotate(0deg); }
              20%       { transform: rotate(-12deg); }
              40%       { transform: rotate(12deg); }
              60%       { transform: rotate(-8deg); }
              80%       { transform: rotate(8deg); }
            }
          `}</style>
          <div style={{
            background: 'linear-gradient(145deg, #0f172a 0%, #1a0a0a 100%)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: '24px',
            padding: '48px 40px',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(239,68,68,0.12)',
            animation: 'fadeInAlert 0.3s cubic-bezier(0.34,1.56,0.64,1)'
          }}>
            {/* Pulsing shield icon */}
            <div style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '2px solid rgba(239,68,68,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              animation: 'pulseRed 1.8s ease-in-out infinite'
            }}>
              <CameraOff size={36} color="#ef4444" style={{ animation: 'shakeIcon 0.6s ease 0.1s' }} />
            </div>

            {/* Top label */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 14px',
              borderRadius: 100,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              marginBottom: 18
            }}>
              <ShieldAlert size={13} color="#ef4444" />
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Security Violation Detected</span>
            </div>

            <h2 style={{
              fontSize: '1.55rem',
              fontWeight: 800,
              color: '#f8fafc',
              margin: '0 0 12px 0',
              lineHeight: 1.2
            }}>Screenshot Blocked!</h2>

            <p style={{
              fontSize: '0.9rem',
              color: '#94a3b8',
              lineHeight: 1.65,
              margin: '0 0 8px 0'
            }}>
              Screenshots are <strong style={{ color: '#fca5a5' }}>strictly prohibited</strong> in Secure View Mode.
            </p>
            <p style={{
              fontSize: '0.8rem',
              color: '#64748b',
              lineHeight: 1.5,
              margin: '0 0 32px 0'
            }}>
              This document is watermarked with your identity. Any unauthorized reproduction is a violation of our terms.
            </p>

            <button
              onClick={() => setScreenshotAlert(false)}
              style={{
                width: '100%',
                padding: '14px 24px',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                color: '#fff',
                fontSize: '0.95rem',
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.02em',
                boxShadow: '0 8px 24px rgba(239,68,68,0.35)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              I Understand — Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── GENERAL SECURITY ACTION ALERT ── */}
      {securityAlert && (
        <div style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          background: 'rgba(0, 0, 0, 0.82)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0f172a 0%, #0c1320 100%)',
            border: '1px solid rgba(251, 146, 60, 0.35)',
            borderRadius: '20px',
            padding: '40px 36px',
            maxWidth: '400px',
            width: '100%',
            textAlign: 'center',
            boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
            animation: 'fadeInAlert 0.25s ease'
          }}>
            <div style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'rgba(251, 146, 60, 0.1)',
              border: '2px solid rgba(251,146,60,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <ShieldAlert size={30} color="#fb923c" />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 10px 0' }}>Action Not Permitted</h3>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.6, margin: '0 0 28px 0' }}>{securityAlert}</p>
            <button
              onClick={() => setSecurityAlert(null)}
              style={{
                width: '100%',
                padding: '12px 20px',
                borderRadius: 10,
                border: 'none',
                background: 'linear-gradient(135deg, #fb923c 0%, #c2410c 100%)',
                color: '#fff',
                fontSize: '0.9rem',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 6px 20px rgba(251,146,60,0.3)'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
