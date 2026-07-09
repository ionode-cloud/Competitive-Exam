import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useCourse } from '../../context/CourseContext';
import { useUser } from '../../context/UserContext';
import { useAuth } from '../../context/AuthContext';
import { useExam } from '../../context/ExamContext';
import PublicLayout from '../../layouts/PublicLayout';
import {
  BookOpen, Clock, Users, Star, Lock, Play, ChevronRight, Crown,
  X, Loader, CheckCircle, Tag, Zap, BarChart2, Globe, Award, ArrowLeft
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/* ─── PAYMENT MODAL ─── */
function PaymentModal({ item, type, courseId, onClose, onSuccess }) {
  const [step, setStep]       = useState('coupon'); // coupon → pay → done
  const [coupon, setCoupon]   = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponErr, setCouponErr] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, addPurchase } = useUser();

  const basePrice = type === 'course' ? (item.offerPrice || item.price) : item.price;
  const finalPrice = couponResult ? couponResult.finalAmount : basePrice;

  const validateCoupon = async () => {
    if (!coupon.trim()) return;
    try {
      const res = await axios.post(`${API}/api/coupons/validate`, {
        code: coupon, amount: basePrice,
        courseId: type === 'course' ? item._id : null,
        mockTestId: type === 'mock-test' ? item._id : null,
      });
      setCouponResult(res.data);
      setCouponErr('');
    } catch (err) {
      setCouponErr(err.response?.data?.message || 'Invalid coupon');
      setCouponResult(null);
    }
  };

  const handlePay = async () => {
    setLoading(true);
    try {
      const { data: order } = await axios.post(`${API}/api/payments/create-order`, {
        amount:       finalPrice,
        userId:       user._id,
        mockTestId:   type === 'mock-test' ? item._id : null,
        courseId:     type === 'course'    ? item._id : null,
        purchaseType: type,
        couponCode:   coupon || '',
      });

      // Load Razorpay
      if (!window.Razorpay) {
        await new Promise(resolve => {
          const s = document.createElement('script');
          s.src = 'https://checkout.razorpay.com/v1/checkout.js';
          s.onload = resolve;
          document.body.appendChild(s);
        });
      }

      const rzp = new window.Razorpay({
        key:         order.key,
        amount:      order.amount,
        currency:    'INR',
        name:        'ExamSphere',
        description: type === 'course' ? `Course: ${item.title}` : `Mock Test: ${item.testName}`,
        order_id:    order.orderId,
        theme:       { color: '#ff6b00' },
        handler: async (response) => {
          try {
            const verify = await axios.post(`${API}/api/payments/verify`, {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              userId:       user._id,
              mockTestId:   type === 'mock-test' ? item._id : null,
              courseId:     type === 'course'    ? item._id : null,
              purchaseType: type,
            });
            setStep('done');
            // Update local user purchases
            if (type === 'mock-test') addPurchase(item._id);
            onSuccess?.({ type, item, verify: verify.data });
          } catch (err) {
            console.error('Payment verify error:', err);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      });
      rzp.open();
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock payment for demo
  const handleMockPay = async () => {
    setLoading(true);
    try {
      const { data: order } = await axios.post(`${API}/api/payments/create-order`, {
        amount: finalPrice, userId: user._id,
        mockTestId: type === 'mock-test' ? item._id : null,
        courseId:   type === 'course'    ? item._id : null,
        purchaseType: type, couponCode: coupon || '',
      });

      const verify = await axios.post(`${API}/api/payments/verify`, {
        razorpay_order_id:   order.orderId,
        razorpay_payment_id: `mock_pay_${Date.now()}`,
        razorpay_signature:  'mock_sig',
        userId:       user._id,
        mockTestId:   type === 'mock-test' ? item._id : null,
        courseId:     type === 'course'    ? item._id : null,
        purchaseType: type,
      });

      setStep('done');
      if (type === 'mock-test') addPurchase(item._id);
      onSuccess?.({ type, item, verify: verify.data });
    } catch (err) {
      console.error('Mock pay error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div className="payment-modal"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}>
        <button className="modal-close" onClick={onClose}><X size={20} /></button>

        {step === 'done' ? (
          <div className="payment-modal__done">
            <div className="payment-modal__done-icon"><CheckCircle size={56} color="#22c55e" /></div>
            <h2>Payment Successful!</h2>
            <p>{type === 'course' ? 'All mock tests in this course are now unlocked.' : 'This mock test is now unlocked.'}</p>
            <button className="pay-btn" onClick={onClose}>Start Practicing →</button>
          </div>
        ) : (
          <>
            <div className="payment-modal__header">
              <Crown size={28} color="#ff6b00" />
              <h2>{type === 'course' ? 'Unlock Full Course' : 'Unlock Mock Test'}</h2>
            </div>
            <div className="payment-modal__item">
              <div className="payment-modal__item-name">
                {type === 'course' ? item.title : item.testName}
              </div>
              <div className="payment-modal__item-type">{type === 'course' ? 'Full Course Access' : 'Single Mock Test'}</div>
            </div>

            {/* Coupon */}
            <div className="payment-modal__coupon">
              <input
                type="text" placeholder="Have a coupon code?" value={coupon}
                onChange={e => { setCoupon(e.target.value.toUpperCase()); setCouponResult(null); setCouponErr(''); }}
                className="coupon-input"
              />
              <button className="coupon-apply-btn" onClick={validateCoupon}>Apply</button>
            </div>
            {couponErr && <p className="coupon-error">{couponErr}</p>}
            {couponResult && (
              <div className="coupon-success">
                <CheckCircle size={14} /> Coupon applied! Saving ₹{couponResult.discountAmount}
              </div>
            )}

            {/* Price Summary */}
            <div className="payment-modal__summary">
              {couponResult ? (
                <>
                  <div className="summary-row"><span>Original Price</span><span>₹{basePrice}</span></div>
                  <div className="summary-row discount"><span>Discount</span><span>-₹{couponResult.discountAmount}</span></div>
                  <div className="summary-row total"><span>Total</span><span>₹{finalPrice}</span></div>
                </>
              ) : (
                <div className="summary-row total"><span>Total</span><span>₹{finalPrice}</span></div>
              )}
            </div>

            <button className="pay-btn" onClick={handleMockPay} disabled={loading}>
              {loading ? <><Loader size={16} className="spin" /> Processing...</> : `Pay ₹${finalPrice}`}
            </button>
            <p className="payment-modal__note">🔒 Secure payment powered by Razorpay</p>
          </>
        )}
      </motion.div>
    </div>
  );
}

/* ─── MOCK TEST CARD ─── */
function MockTestCard({ test, index, isUnlocked, isFree, onStart, onBuy }) {
  return (
    <motion.div
      className={`mt-card ${isUnlocked ? 'mt-card--unlocked' : 'mt-card--locked'}`}
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <div className="mt-card__left">
        <div className={`mt-card__num ${isUnlocked ? '' : 'locked'}`}>{index + 1}</div>
        <div className="mt-card__info">
          <h4 className="mt-card__name">{test.testName}</h4>
          <div className="mt-card__meta">
            <span><BookOpen size={12} /> {test.totalQuestions} Qs</span>
            <span><Clock size={12} /> {test.duration} min</span>
            <span><BarChart2 size={12} /> {test.totalMarks} marks</span>
            {test.negativeMarking > 0 && <span>-{test.negativeMarking} neg</span>}
          </div>
        </div>
      </div>

      <div className="mt-card__right">
        {isFree || isUnlocked ? (
          <span className="mt-badge mt-badge--free"><Zap size={11} /> FREE</span>
        ) : (
          <span className="mt-badge mt-badge--locked"><Lock size={11} /> ₹{test.price}</span>
        )}
        {isUnlocked ? (
          <button className="mt-btn mt-btn--start" onClick={() => onStart(test)}>
            <Play size={14} fill="white" /> Start
          </button>
        ) : (
          <button className="mt-btn mt-btn--buy" onClick={() => onBuy(test)}>
            Buy Now
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ─── MAIN PAGE ─── */
export default function CourseDetailPage() {
  const { courseId } = useParams();
  const navigate     = useNavigate();
  const { fetchMockTests, mockTests, selectedCourse, loadingMockTests } = useCourse();
  const { user, openLogin } = useUser();
  const { setExam } = useExam();

  const [paymentModal, setPaymentModal] = useState(null); // { item, type }
  const [selectedTestIndex, setSelectedTestIndex] = useState(0);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [localUnlocked, setLocalUnlocked] = useState(new Set(
    (user?.purchases || []).map(id => id?.toString())
  ));

  const getEmbedUrl = (url) => {
    if (!url) return '';
    let regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    let match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  useEffect(() => {
    fetchMockTests(courseId, user?._id);
  }, [courseId, user?._id]);

  useEffect(() => {
    setLocalUnlocked(new Set((user?.purchases || []).map(id => id?.toString())));
  }, [user]);

  const handleStart = (test) => {
    if (!user) { openLogin(courseId); return; }
    if (test.exam) {
      // Use existing exam engine — store exam data and navigate
      localStorage.setItem('currentMockTestId', test._id);
      navigate(`/instructions?examId=${test.exam._id || test.exam}&mockTestId=${test._id}`);
    } else {
      alert('This mock test has no exam linked yet. Please contact admin.');
    }
  };

  const handleBuy = (test) => {
    if (!user) { openLogin(courseId); return; }
    setPaymentModal({ item: test, type: 'mock-test' });
  };

  const handleBuyCourse = () => {
    if (!user) { openLogin(courseId); return; }
    setPaymentModal({ item: selectedCourse, type: 'course' });
  };

  const handlePaymentSuccess = ({ type, item }) => {
    if (type === 'mock-test') {
      setLocalUnlocked(prev => new Set([...prev, item._id.toString()]));
    } else if (type === 'course') {
      // Unlock all
      const all = new Set(mockTests.map(mt => mt._id.toString()));
      setLocalUnlocked(all);
    }
    setTimeout(() => setPaymentModal(null), 1800);
  };

  const unlockedCount = mockTests.filter(mt => mt.isFree || localUnlocked.has(mt._id?.toString())).length;

  if (loadingMockTests) {
    return (
      <PublicLayout>
        <div className="cd-loading">
          <Loader size={40} className="spin" style={{ color: '#ff6b00' }} />
          <p>Loading course...</p>
        </div>
      </PublicLayout>
    );
  }

  if (!selectedCourse) {
    return (
      <PublicLayout>
        <div className="cd-loading">
          <BookOpen size={48} style={{ opacity: 0.3 }} />
          <h3>Course not found</h3>
          <button className="btn-back" onClick={() => navigate('/courses')}>← Back to Courses</button>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      {/* ─── BANNER ─── */}
      <div className="cd-banner">
        {selectedCourse.banner ? (
          <img src={selectedCourse.banner} alt={selectedCourse.title} className="cd-banner__img" />
        ) : (
          <div className="cd-banner__placeholder" />
        )}
        <div className="cd-banner__overlay">
          <div className="cd-banner__content">
            <button className="cd-back" onClick={() => navigate('/courses')}><ArrowLeft size={16} /> Courses</button>
            <div className="cd-banner__category">{selectedCourse.categoryName || 'General'}</div>
            <h1 className="cd-banner__title">{selectedCourse.title}</h1>
            <p className="cd-banner__desc">{selectedCourse.description}</p>
            {selectedCourse.videoUrl && (
              <button
                onClick={() => setActiveVideoUrl(selectedCourse.videoUrl)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 20px', borderRadius: '30px', background: 'rgba(255,107,0,0.9)',
                  color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.85rem',
                  cursor: 'pointer', marginBottom: '16px', boxShadow: '0 4px 12px rgba(255,107,0,0.4)',
                  transition: 'transform 0.2s', width: 'fit-content'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <Play size={14} fill="white" /> Watch Course Trailer
              </button>
            )}
            <div className="cd-banner__stats">
              <span><Star size={14} fill="#f59e0b" stroke="#f59e0b" /> {selectedCourse.rating || 4.5}</span>
              <span><Users size={14} /> {(selectedCourse.enrolledCount || 0).toLocaleString()} enrolled</span>
              <span><BookOpen size={14} /> {mockTests.length} mock tests</span>
              <span><Globe size={14} /> {(selectedCourse.languages || ['English']).join(', ')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="cd-main">
        {/* ─── MOCK TESTS LIST ─── */}
        <div className="cd-tests">
          <div className="cd-tests__header">
            <div>
              <h2>Mock Tests</h2>
              <p>{unlockedCount} of {mockTests.length} unlocked</p>
            </div>
            {/* Buy Full Course */}
            {selectedCourse.price > 0 && (
              <div className="cd-course-buy">
                <div>
                  <div className="cd-course-buy__label">Buy Full Course</div>
                  <div className="cd-course-buy__price">
                    {selectedCourse.offerPrice > 0 && selectedCourse.offerPrice < selectedCourse.price ? (
                      <><span className="cd-price-current">₹{selectedCourse.offerPrice}</span> <span className="cd-price-old">₹{selectedCourse.price}</span></>
                    ) : <span className="cd-price-current">₹{selectedCourse.price}</span>}
                  </div>
                  <div className="cd-course-buy__note">Unlock all {mockTests.length} tests</div>
                </div>
                <button className="cd-course-buy__btn" onClick={handleBuyCourse}>
                  <Crown size={16} /> Unlock All
                </button>
              </div>
            )}
          </div>

          {mockTests.length === 0 ? (
            <div className="cd-empty">
              <BookOpen size={48} style={{ opacity: 0.2 }} />
              <p>No mock tests available yet. Check back soon!</p>
            </div>
          ) : (
            <div className="cd-box-container" style={{ padding: '24px', borderRadius: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
              <h3 style={{ marginBottom: '16px', color: '#cbd5e1', fontSize: '1rem', fontWeight: 700 }}>Select a Mock Test:</h3>
              <div className="cd-boxes-grid" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
                {mockTests.map((test, i) => {
                  const isUnlocked = test.isFree || test.isUnlocked || localUnlocked.has(test._id?.toString());
                  const isSelected = i === selectedTestIndex;
                  return (
                    <button
                      key={test._id}
                      onClick={() => setSelectedTestIndex(i)}
                      style={{
                        width: '54px', height: '54px', borderRadius: '10px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.05rem', fontWeight: 800, cursor: 'pointer', border: '1px solid',
                        background: isSelected
                          ? 'linear-gradient(135deg, #ff6b00, #ff9a3c)'
                          : isUnlocked
                            ? 'rgba(34,197,94,0.08)'
                            : 'rgba(255,255,255,0.03)',
                        borderColor: isSelected
                          ? '#ff6b00'
                          : isUnlocked
                            ? 'rgba(34,197,94,0.3)'
                            : 'rgba(255,255,255,0.08)',
                        color: isSelected
                          ? '#fff'
                          : isUnlocked
                            ? '#22c55e'
                            : '#94a3b8',
                        position: 'relative',
                        transition: 'all 0.2s',
                        boxShadow: isSelected ? '0 6px 16px rgba(255,107,0,0.3)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.transform = 'scale(1)';
                        }
                      }}
                    >
                      {i + 1}
                      {!isUnlocked && (
                        <span style={{ position: 'absolute', bottom: '3px', right: '3px', fontSize: '0.6rem' }}>
                          🔒
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Test Details Box */}
              {mockTests[selectedTestIndex] && (() => {
                const test = mockTests[selectedTestIndex];
                const isUnlocked = test.isFree || test.isUnlocked || localUnlocked.has(test._id?.toString());
                return (
                  <div className="cd-selected-test-box glass animate-fade-in" style={{
                    padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)',
                    background: 'rgba(255,255,255,0.01)', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: '16px'
                  }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700,
                          background: test.isFree ? 'rgba(34,197,94,0.12)' : 'rgba(255,107,0,0.12)',
                          color: test.isFree ? '#22c55e' : '#ff6b00', border: `1px solid ${test.isFree ? 'rgba(34,197,94,0.25)' : 'rgba(255,107,0,0.25)'}`
                        }}>
                          {test.isFree ? '⚡ FREE' : 'PREMIUM'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Mock Test {selectedTestIndex + 1}</span>
                      </div>
                      <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '8px' }}>{test.testName}</h4>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#94a3b8' }}><BookOpen size={13} /> {test.totalQuestions} Questions</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#94a3b8' }}><Clock size={13} /> {test.duration} Minutes</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#94a3b8' }}><BarChart2 size={13} /> {test.totalMarks} Marks</span>
                        {test.negativeMarking > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: '#ef4444' }}>-{test.negativeMarking} Neg. Marking</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {isUnlocked ? (
                        <button className="btn btn-primary" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '12px 24px', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleStart(test)}>
                          <Play size={15} fill="white" /> Start Exam
                        </button>
                      ) : (
                        <button className="btn" style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '12px 24px', fontWeight: 700, background: 'rgba(255,107,0,0.12)', border: '1px solid rgba(255,107,0,0.25)', color: '#ff6b00', borderRadius: '8px', cursor: 'pointer' }} onClick={() => handleBuy(test)}>
                          <Lock size={15} /> Unlock Mock Test (₹{test.price})
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* ─── SIDEBAR ─── */}
        <div className="cd-sidebar">
          <div className="cd-sidebar__card">
            <h3>Course Details</h3>
            <ul className="cd-details-list">
              <li><BookOpen size={15} /> <span>Mock Tests:</span> <strong>{mockTests.length}</strong></li>
              <li><BarChart2 size={15} /> <span>Questions:</span> <strong>{selectedCourse.totalQuestions || '—'}</strong></li>
              <li><Clock size={15} /> <span>Duration:</span> <strong>{selectedCourse.duration || '—'}</strong></li>
              <li><Globe size={15} /> <span>Language:</span> <strong>{(selectedCourse.languages || ['English']).join(', ')}</strong></li>
              <li><Award size={15} /> <span>Difficulty:</span> <strong>{selectedCourse.difficulty}</strong></li>
            </ul>
          </div>

          <div className="cd-sidebar__card cd-sidebar__free-info">
            <Zap size={20} color="#22c55e" />
            <h4>First {selectedCourse.freeTestsCount || 2} tests are FREE</h4>
            <p>Start practicing without any payment. Upgrade when you need more.</p>
          </div>
        </div>
      </div>

      {/* ─── PAYMENT MODAL ─── */}
      <AnimatePresence>
        {paymentModal && (
          <PaymentModal
            item={paymentModal.item}
            type={paymentModal.type}
            courseId={courseId}
            onClose={() => setPaymentModal(null)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </AnimatePresence>

      {/* Video Modal Popup */}
      <AnimatePresence>
        {activeVideoUrl && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', backdropFilter:'blur(6px)', zIndex:1100, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
            <div className="glass" style={{ width:'100%', maxWidth:800, aspectRatio:'16/9', borderRadius:16, border:'1px solid rgba(255,255,255,0.08)', position:'relative', overflow:'hidden', boxShadow:'0 24px 48px rgba(0,0,0,0.5)' }}>
              <button 
                onClick={() => setActiveVideoUrl(null)} 
                style={{ position:'absolute', top:12, right:12, background:'rgba(0,0,0,0.5)', border:'none', borderRadius:'50%', width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', cursor:'pointer', zIndex:10 }}
              >
                <X size={18} />
              </button>
              <iframe
                title="Intro Video"
                src={getEmbedUrl(activeVideoUrl)}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width:'100%', height:'100%' }}
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </PublicLayout>
  );
}
