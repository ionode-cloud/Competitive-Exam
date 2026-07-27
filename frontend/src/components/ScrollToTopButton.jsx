import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowUp,
  FaGift,
  FaTimes,
  FaCopy,
  FaCheck,
  FaTag,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa';

export default function ScrollToTopButton() {
  const [scrollVisible, setScrollVisible] = useState(false);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponCopied, setCouponCopied] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setScrollVisible(true);
      } else {
        setScrollVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText('EXTRA50');
    setCouponCopied(true);
    setTimeout(() => setCouponCopied(false), 2000);
  };

  const handleRedeem = (e) => {
    e.preventDefault();
    setSuccessMsg('Coupon EXTRA50 applied successfully! Redirecting to plans...');
    setTimeout(() => {
      setShowCouponModal(false);
      setSuccessMsg('');
      navigate('/subscription');
    }, 1200);
  };

  return (
    <>
      {/* 1. Floating Gift Button (Above Scroll-to-Top) */}
      <button
        onClick={() => setShowCouponModal(true)}
        title="Claim Special Discount Coupon!"
        aria-label="Claim Special Discount Coupon"
        style={{
          position: 'fixed',
          bottom: scrollVisible ? '86px' : '28px',
          right: '28px',
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          color: '#ffffff',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 6px 20px rgba(245, 158, 11, 0.45), 0 2px 8px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '20px',
          zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.1)';
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(245, 158, 11, 0.65)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.45), 0 2px 8px rgba(0,0,0,0.2)';
        }}
      >
        <FaGift />
        {/* Red notification dot */}
        <span style={{
          position: 'absolute',
          top: '-1px',
          right: '-1px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#EF4444',
          border: '2px solid #ffffff'
        }} />
      </button>

      {/* 2. Floating Scroll-to-Top Button */}
      {scrollVisible && (
        <button
          onClick={scrollToTop}
          title="Scroll to Top"
          aria-label="Scroll to Top"
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #cb2f2f 0%, #d42329 100%)',
            color: '#ffffff',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 6px 20px rgba(203, 32, 52, 0.4), 0 2px 8px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            zIndex: 9999,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-4px) scale(1.08)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(164, 28, 48, 0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(203, 32, 52, 0.4), 0 2px 8px rgba(0,0,0,0.2)';
          }}
        >
          <FaArrowUp />
        </button>
      )}

      {/* 3. Discount Coupon Modal */}
      {showCouponModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setShowCouponModal(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '460px',
              background: '#ffffff',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                padding: '24px 24px 20px',
                color: '#ffffff',
                position: 'relative'
              }}
            >
              <button
                onClick={() => setShowCouponModal(false)}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FaTimes />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#FFC93C', fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>
                <FaGift /> Festive Special Offer
              </div>
              <h2 style={{ fontSize: '22px', fontWeight: 900, margin: '6px 0 4px', color: '#ffffff', letterSpacing: '-0.5px', textAlign: 'left' }}>
                🎉 Claim 50% Discount Coupon!
              </h2>
              <p style={{ fontSize: '13px', color: '#94A3B8', margin: 0, textAlign: 'left' }}>
                Get flat 50% instant discount on all test series &amp; study material packages.
              </p>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(245, 158, 11, 0.2)', border: '1px solid rgba(245, 158, 11, 0.4)',
                color: '#FFC93C', fontSize: '12px', fontWeight: 800, padding: '4px 12px', borderRadius: '20px', marginTop: '12px'
              }}>
                <FaClock /> Limited Time Offer — Valid Today
              </div>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px' }}>
              {/* Coupon Box */}
              <div style={{
                background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                border: '2px dashed #F59E0B', borderRadius: '14px', padding: '16px 20px',
                marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    Special Coupon Code
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: 900, color: '#78350F', letterSpacing: '1.5px', marginTop: '2px' }}>
                    EXTRA50
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  style={{
                    padding: '9px 16px', background: '#D97706', color: '#ffffff',
                    border: 'none', borderRadius: '8px', fontWeight: 800, fontSize: '12.5px',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)', transition: 'all 0.15s'
                  }}
                >
                  {couponCopied ? <><FaCheck /> Copied!</> : <><FaCopy /> Copy Code</>}
                </button>
              </div>

              {/* Benefits list */}
              <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                  WHAT YOU GET WITH THIS COUPON:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    'Flat 50% instant discount on all subscription plans',
                    'Access to 100+ Full Length & Sectional Mock Tests',
                    'Free PYQ E-Book Library Access',
                    'All Odisha & National Competitive Exam Series'
                  ].map((benefit, bIdx) => (
                    <div key={bIdx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#1E293B', fontWeight: 600 }}>
                      <span style={{ color: '#0F9D58', fontWeight: 900, display: 'flex', alignItems: 'center' }}><FaCheckCircle /></span>
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleRedeem}>
                <div style={{ marginBottom: '14px', textAlign: 'left' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', marginBottom: '4px', display: 'block' }}>Active Coupon</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value="EXTRA50"
                      readOnly
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #F59E0B',
                        background: '#FFFBEB', fontSize: '14px', fontWeight: '800', color: '#92400E', outline: 'none', boxSizing: 'border-box'
                      }}
                    />
                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#0F9D58', fontWeight: '800', fontSize: '12px', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FaTag /> 50% OFF
                    </span>
                  </div>
                </div>

                <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748B', marginBottom: '4px', display: 'block' }}>Select Subscription Plan</label>
                  <select
                    value={selectedPlan}
                    onChange={e => setSelectedPlan(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid #E2E8F0',
                      background: '#F8FAFC', fontSize: '13.5px', fontWeight: '700', color: '#0F172A', outline: 'none', boxSizing: 'border-box'
                    }}
                  >
                    <option value="starter">Starter Plan — ₹249 (Reg. ₹499)</option>
                    <option value="pro">Pro Package (Best Value) — ₹749 (Reg. ₹1,499)</option>
                    <option value="super">Super Access — ₹1,499 (Reg. ₹2,999)</option>
                  </select>
                </div>

                {successMsg && (
                  <div style={{ background: '#E8F8EE', border: '1px solid #0F9D58', color: '#0F9D58', borderRadius: '8px', padding: '10px 14px', fontSize: '13px', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left' }}>
                    <FaCheckCircle /> {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '12px', background: 'linear-gradient(135deg, #FFC93C 0%, #F59E0B 100%)',
                    color: '#0F172A', border: 'none', borderRadius: '8px', fontWeight: '900', fontSize: '14.5px', cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(245, 158, 11, 0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '0 4px 14px rgba(245, 158, 11, 0.4)';
                  }}
                >
                  Claim 50% Off &amp; Redeem Offer →
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
