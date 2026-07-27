// SubscriptionPage.jsx — Dynamic plans with billing toggle + payment modal & Razorpay Integration
import { useState, useEffect } from 'react';
import {
  FaFileAlt, FaClipboardList, FaVideo, FaTrophy, FaStar, FaDollarSign,
  FaCheck, FaTimes, FaCopy, FaQrcode, FaMobileAlt, FaCreditCard,
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5303/api';

/* ── Icon map matching admin ICON_OPTIONS ids ───────────────────────────────── */
const ICON_MAP = {
  file:      <FaFileAlt />,
  clipboard: <FaClipboardList />,
  video:     <FaVideo />,
  trophy:    <FaTrophy />,
  star:      <FaStar />,
  money:     <FaDollarSign />,
};

/* ── Default fallback data ───────────────────────────────────────────────────── */
const DEFAULT_MONTHLY = [
  {
    name: 'Starter', price: '₹499', duration: '/month',
    color: '#1957D6', bg: '#EAF1FD', highlight: false, badge: null,
    features: [
      { ok: true,  text: '5 Full-Length Mock Tests' }, { ok: true,  text: '10 Subject-Wise Tests' },
      { ok: true,  text: '2 PYQ E-Books (Free Titles)' }, { ok: true,  text: 'Basic Study Materials' },
      { ok: false, text: 'Live Classes Access' }, { ok: false, text: 'Video Course Library' },
      { ok: false, text: 'Doubt Clearing Sessions' }, { ok: false, text: 'All-India Rank & Analytics' },
    ],
  },
  {
    name: 'Pro', price: '₹1,499', duration: '/month',
    color: '#7C3AED', bg: '#F3ECFE', highlight: true, badge: 'Most Popular',
    features: [
      { ok: true,  text: '50 Full-Length Mock Tests' }, { ok: true,  text: 'All Subject-Wise Tests' },
      { ok: true,  text: 'All PYQ E-Books' }, { ok: true,  text: 'Complete Study Materials' },
      { ok: true,  text: 'Live Classes Access' }, { ok: true,  text: 'Video Course Library' },
      { ok: false, text: 'Doubt Clearing Sessions' }, { ok: false, text: 'All-India Rank & Analytics' },
    ],
  },
  {
    name: 'Super', price: '₹2,999', duration: '/month',
    color: '#B4232F', bg: '#FCEBEA', highlight: false, badge: 'Best Value',
    features: [
      { ok: true, text: 'Unlimited Mock Tests' }, { ok: true, text: 'All Subject-Wise Tests' },
      { ok: true, text: 'All PYQ E-Books + New Editions' }, { ok: true, text: 'Premium Study Materials' },
      { ok: true, text: 'All Live Classes + Recordings' }, { ok: true, text: 'Full Video Course Library' },
      { ok: true, text: 'Daily Doubt Clearing Sessions' }, { ok: true, text: 'All-India Rank & Deep Analytics' },
    ],
  },
];

const DEFAULT_YEARLY = DEFAULT_MONTHLY.map(p => ({ ...p, price: '₹' + Math.round(parseInt(p.price.replace(/[₹,]/g, '')) * 12 * 0.6).toLocaleString('en-IN'), duration: '/year' }));

const DEFAULT_COMBOS = [
  { name: 'PDF Course Bundle',     price: '₹3,999', orig: '₹7,999',  icon: 'file',      color: '#1957D6', bg: '#EAF1FD', items: ['All Subject PDFs', 'PYQ E-Books', 'Free Updates 1 Year'] },
  { name: 'Test Series Pack',       price: '₹1,299', orig: '₹2,999',  icon: 'clipboard', color: '#0F9D58', bg: '#E8F8EE', items: ['100+ Mock Tests', 'All-India Rank', 'Detailed Analysis'] },
  { name: 'Live Batch + Materials', price: '₹4,999', orig: '₹9,999',  icon: 'video',     color: '#7C3AED', bg: '#F3ECFE', items: ['60 Live Classes', 'Class Recordings', 'Study Notes'] },
  { name: 'All-in-One Super Plan',  price: '₹7,999', orig: '₹19,999', icon: 'trophy',    color: '#B4232F', bg: '#FCEBEA', items: ['Everything in Super', '6 Months Access', 'Priority Support'] },
];

/* ══════════════════════════════════════════════════════════════════════════════
   PaymentModal
══════════════════════════════════════════════════════════════════════════════ */
function PaymentModal({ item, billing, onClose, globalUpiId }) {
  const [copied, setCopied]   = useState(false);
  const [txnId,  setTxnId]    = useState('');
  const [method, setMethod]   = useState('razorpay'); // 'razorpay' | 'upi' | 'qr'
  const [submitted, setSubmitted] = useState(false);
  const [loadingRazorpay, setLoadingRazorpay] = useState(false);

  if (!item) return null;

  const upiId  = item.upiId  || globalUpiId || 'payment@upi';
  const qrCode = item.qrCode || null;
  const price  = item.price;
  const isCombo = !!item.orig;
  const planType = isCombo ? 'Combo Pack' : (billing === 'monthly' ? 'Monthly Plan' : 'Yearly Plan');

  const upiLink = `upi://pay?pa=${upiId}&pn=ExamPlatform&am=${price.replace(/[₹,]/g, '')}&cu=INR&tn=${encodeURIComponent(item.name + ' ' + planType)}`;

  const copyUpi = () => {
    navigator.clipboard.writeText(upiId).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  };

  const handleRazorpayPayment = async () => {
    try {
      setLoadingRazorpay(true);
      const numAmount = parseInt((price || '').replace(/[₹,]/g, ''), 10) || 0;

      // 1. Create order on backend
      const res = await fetch(`${API_URL}/payments/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          planId: item._id,
          itemName: `${item.name} ${planType}`,
        }),
      }).then(r => r.json());

      if (!res.success) {
        alert(res.message || 'Failed to create payment order');
        setLoadingRazorpay(false);
        return;
      }

      // Dynamically load Razorpay SDK if not present
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
        description: `${item.name} - ${planType}`,
        order_id: res.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await fetch(`${API_URL}/payments/razorpay/verify`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: item._id,
                amount: numAmount,
                isMock: res.isMock,
              }),
            }).then(r => r.json());

            if (verifyRes.success) {
              setTxnId(response.razorpay_payment_id || verifyRes.transactionId || 'PAY_' + Date.now());
              setSubmitted(true);
            } else {
              alert(verifyRes.message || 'Payment verification failed');
            }
          } catch {
            setTxnId(response.razorpay_payment_id || 'PAY_' + Date.now());
            setSubmitted(true);
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: item.color || '#2563eb',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        alert(response.error?.description || 'Payment Failed');
      });
      rzp.open();
    } catch (err) {
      alert('Razorpay Checkout failed to initialize: ' + err.message);
    } finally {
      setLoadingRazorpay(false);
    }
  };

  const handleSubmitManual = () => {
    if (!txnId.trim()) { alert('Please enter your UPI Transaction ID to confirm.'); return; }
    setSubmitted(true);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', padding: '28px 28px 24px', boxShadow: '0 30px 80px rgba(0,0,0,.35)' }}>

        {submitted ? (
          /* ── Success screen ── */
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#0F9D58' }}>Payment Successful!</h3>
            <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
              Your payment of <strong>{price}</strong> for <strong>{item.name} {planType}</strong> has been confirmed.<br />
              Transaction ID: <strong style={{ fontFamily: 'monospace' }}>{txnId}</strong>
            </p>
            <button onClick={onClose}
              style={{ marginTop: 20, padding: '10px 28px', borderRadius: 10, border: 'none', background: '#0F9D58', color: '#fff', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>
              Done & Start Learning
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 1, marginBottom: 4, textTransform: 'uppercase' }}>Complete Payment</div>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>{item.name} {planType}</h3>
              </div>
              <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>

            {/* Price summary card */}
            <div style={{ background: item.highlight ? item.color : (item.bg || '#EAF1FD'), borderRadius: 14, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, color: item.highlight ? 'rgba(255,255,255,.7)' : '#64748b', fontWeight: 600 }}>{billing === 'monthly' ? 'Monthly billing' : billing === 'yearly' ? 'Yearly billing' : 'One-time purchase'}</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: item.highlight ? '#fff' : (item.color || '#1957D6'), marginTop: 2 }}>{price}</div>
              </div>
              {item.orig && (
                <div style={{ fontSize: 12, color: item.highlight ? 'rgba(255,255,255,.6)' : '#94a3b8', textDecoration: 'line-through' }}>{item.orig}</div>
              )}
            </div>

            {/* Razorpay Method Only */}
            <div style={{ textAlign: 'center', padding: '10px 0 16px' }}>
              <div style={{ background: '#f8fafc', borderRadius: 14, padding: '24px 20px', marginBottom: 20, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 44, marginBottom: 10 }}>💳</div>
                <h4 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#0f172a' }}>Instant Checkout via Razorpay</h4>
                <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>
                  Pay securely using Cards, UPI (GPay, PhonePe, Paytm), NetBanking, or Wallet.
                </p>
              </div>
              <button
                onClick={handleRazorpayPayment}
                disabled={loadingRazorpay}
                style={{
                  width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#fff',
                  fontWeight: 800, fontSize: 15, cursor: 'pointer', opacity: loadingRazorpay ? 0.7 : 1,
                  boxShadow: '0 8px 20px rgba(37,99,235,0.25)', transition: 'all .15s',
                }}>
                {loadingRazorpay ? 'Opening Razorpay…' : `Pay ${price} with Razorpay →`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════════
   Main SubscriptionPage
══════════════════════════════════════════════════════════════════════════════ */
export default function SubscriptionPage() {
  const [billing, setBilling]     = useState('yearly'); // 'yearly' | 'monthly'
  const [cfg, setCfg]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [payItem, setPayItem]     = useState(null); // plan or combo selected for payment

  useEffect(() => {
    fetch(`${API_URL}/subscription-config/public`)
      .then(r => r.json())
      .then(j => { if (j.success) setCfg(j.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  /* Dynamic data with fallbacks */
  const monthlyPlans  = cfg?.monthlyPlans?.length ? cfg.monthlyPlans : DEFAULT_MONTHLY;
  const yearlyPlans   = cfg?.yearlyPlans?.length  ? cfg.yearlyPlans  : DEFAULT_YEARLY;
  const combos        = cfg?.combos?.length        ? cfg.combos       : DEFAULT_COMBOS;
  const globalUpiId   = cfg?.globalUpiId || '';
  const plans         = billing === 'yearly' ? yearlyPlans : monthlyPlans;

  const bannerEyebrow  = cfg?.bannerEyebrow  || 'Subscription';
  const bannerHeading  = cfg?.bannerHeading  || 'Choose Your Plan';
  const bannerSubtitle = cfg?.bannerSubtitle || 'Invest in your preparation — unlock everything you need to crack the exam.';
  const bannerStats    = cfg?.bannerStats?.length ? cfg.bannerStats : [{ n: '3', label: 'Plans' }, { n: '4', label: 'Combo Packs' }, { n: '40%', label: 'Yearly Savings' }];
  const comboLabel     = cfg?.comboSectionLabel   || 'COMBO PACKS';
  const comboHeading   = cfg?.comboSectionHeading || 'One-Time Packs — Pay Once, Save More';

  return (
    <div style={{ minHeight: '80vh', background: 'var(--bg)' }}>

      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg, rgb(15,23,42), rgba(234,122,30,0.133))', padding: '22px 0 18px' }}>
        <div className="wrap">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div className="eyebrow" style={{ color: '#FDE68A' }}>{bannerEyebrow}</div>
              <h1 style={{ fontFamily: 'var(--disp)', fontSize: 'clamp(20px,2.8vw,30px)', color: '#fff', margin: '6px 0 8px' }}>{bannerHeading}</h1>
              <p style={{ color: '#94A3B8', fontSize: 13.5, maxWidth: '52ch', lineHeight: 1.6, margin: '0 0 14px' }}>{bannerSubtitle}</p>

              {/* Yearly / Monthly toggle */}
              <div style={{ display: 'inline-flex', background: 'rgba(255,255,255,.15)', borderRadius: 30, padding: 4 }}>
                {[['yearly', 'Yearly'], ['monthly', 'Monthly']].map(([key, label]) => (
                  <button key={key} onClick={() => setBilling(key)} style={{
                    padding: '7px 22px', borderRadius: 26, border: 'none',
                    background: billing === key ? '#fff' : 'transparent',
                    color: billing === key ? '#1a1f35' : '#fff',
                    fontWeight: 800, fontSize: 13, cursor: 'pointer', transition: 'all .2s',
                  }}>
                    {label}
                    {key === 'yearly' && (
                      <span style={{ marginLeft: 6, background: '#0F9D58', color: '#fff', fontSize: 10, padding: '1px 6px', borderRadius: 10, fontWeight: 800 }}>SAVE MORE</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Stat badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', paddingTop: 6 }}>
              {bannerStats.map((s, i) => (
                <div key={i} style={{ textAlign: 'center', background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '10px 16px', minWidth: 72 }}>
                  <div style={{ fontFamily: 'var(--disp)', fontSize: 20, fontWeight: 900, color: '#FFC93C', lineHeight: 1 }}>{s.n}</div>
                  <div style={{ fontSize: 10.5, color: '#CBD5E1', marginTop: 4, letterSpacing: 0.4 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 56 }}>

        {/* ── Plan Cards ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 56 }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              background: plan.highlight ? plan.color : 'var(--card)',
              color: plan.highlight ? '#fff' : 'var(--text)',
              border: plan.highlight ? 'none' : '1px solid var(--line)',
              borderRadius: 18, padding: '32px 28px',
              position: 'relative', overflow: 'hidden',
              transform: plan.highlight ? 'scale(1.04)' : 'none',
              boxShadow: plan.highlight ? '0 12px 40px ' + plan.color + '44' : 'none',
              transition: 'transform .2s',
            }}>
              {plan.badge && (
                <div style={{ position: 'absolute', top: 18, right: -24, background: plan.highlight ? '#fff' : plan.color, color: plan.highlight ? plan.color : '#fff', fontSize: 10, fontWeight: 800, padding: '4px 32px 4px 12px', borderRadius: 4 }}>
                  {plan.badge}
                </div>
              )}
              <div style={{ fontSize: 13, fontWeight: 700, opacity: plan.highlight ? .75 : undefined, color: plan.highlight ? undefined : plan.color, marginBottom: 8 }}>{plan.name}</div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 22 }}>
                <span style={{ fontSize: 36, fontWeight: 900 }}>{plan.price}</span>
                <span style={{ fontSize: 13, opacity: .7, paddingBottom: 6 }}>{plan.duration}</span>
              </div>
              <div style={{ borderTop: plan.highlight ? 'rgba(255,255,255,.25) 1px solid' : '1px solid var(--line)', paddingTop: 20, marginBottom: 22 }}>
                {(plan.features || []).map((f, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10, fontSize: 13.5, opacity: f.ok ? 1 : (plan.highlight ? .45 : .4) }}>
                    <span style={{ width: 18, height: 18, borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: f.ok ? (plan.highlight ? 'rgba(255,255,255,.25)' : plan.color + '22') : 'transparent', fontSize: 10, fontWeight: 900, color: f.ok ? (plan.highlight ? '#fff' : plan.color) : (plan.highlight ? 'rgba(255,255,255,.4)' : 'var(--muted-2)'), flexShrink: 0 }}>
                      {f.ok ? <FaCheck /> : <FaTimes />}
                    </span>
                    {f.text}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setPayItem(plan)}
                style={{ width: '100%', padding: '13px', background: plan.highlight ? '#fff' : plan.color, color: plan.highlight ? plan.color : '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: 15, cursor: 'pointer', transition: 'opacity .15s' }}
                onMouseEnter={e => e.currentTarget.style.opacity = '.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Get {plan.name} Plan →
              </button>
            </div>
          ))}
        </div>

        {/* ── Combo Packs ─────────────────────────────────────────────────────── */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: 2, marginBottom: 8 }}>{comboLabel}</div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{comboHeading}</h2>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 16 }}>
            {combos.map((combo, i) => (
              <div key={i} style={{ background: combo.bg, border: `1.5px solid ${combo.color}33`, borderRadius: 16, padding: '24px 22px', transition: 'transform .18s', cursor: 'pointer', width: '280px', flexGrow: 1, maxWidth: '340px', boxSizing: 'border-box' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}>
                <div style={{ fontSize: 26, color: combo.color, marginBottom: 12, display: 'flex' }}>{ICON_MAP[combo.icon] || <FaFileAlt />}</div>
                <h3 style={{ margin: '0 0 6px', fontSize: 15.5, fontWeight: 800, color: combo.color }}>{combo.name}</h3>
                <div style={{ marginBottom: 14 }}>
                  {(combo.items || []).map((item, j) => (
                    <div key={j} style={{ fontSize: 12.5, color: combo.color, opacity: .8, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <FaCheck fontSize={10} /> {item}
                    </div>
                  ))}
                </div>
                <div style={{ flexWrap: 'wrap', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: 20, fontWeight: 900, color: combo.color }}>{combo.price}</span>
                    <span style={{ fontSize: 12, color: combo.color, opacity: .6, marginLeft: 8, textDecoration: 'line-through' }}>{combo.orig}</span>
                  </div>
                  <button
                    onClick={() => setPayItem(combo)}
                    style={{ padding: '7px 16px', background: combo.color, color: '#fff', border: 'none', borderRadius: 8, fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>
                    Buy Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payment Modal ─────────────────────────────────────────────────────── */}
      {payItem && (
        <PaymentModal
          item={payItem}
          billing={billing}
          globalUpiId={globalUpiId}
          onClose={() => setPayItem(null)}
        />
      )}
    </div>
  );
}
