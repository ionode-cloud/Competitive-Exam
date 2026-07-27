import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaClock, FaInfoCircle, FaCheck, FaTimes, FaBookmark, FaChevronLeft, FaChevronRight, FaUserAlt } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5303/api';

export default function SubjectTestExamPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [attemptData, setAttemptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [questionStates, setQuestionStates] = useState({});
  const [remainingSec, setRemainingSec] = useState(0);
  const [showInstructionsModal, setShowInstructionsModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync Timer & Exam Attempt State
  const fetchAttempt = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/subject-tests/attempts/${attemptId}`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      }).then(r => r.json());

      if (!res.success) {
        alert(res.message || 'Failed to load exam attempt');
        navigate('/subject-test');
        return;
      }

      const d = res.data;
      setAttemptData(d);
      setAnswers(d.answers || {});
      setQuestionStates(d.questionStates || {});

      // Calculate server-synced remaining time
      const exp = new Date(d.expiryTime).getTime();
      const now = new Date().getTime();
      const diffSec = Math.max(0, Math.floor((exp - now) / 1000));
      setRemainingSec(diffSec);

      if (d.status === 'completed') {
        navigate(`/subject-test/result/${attemptId}`);
      }
    } catch {
      alert('Error connecting to exam server');
    } finally {
      setLoading(false);
    }
  }, [attemptId, navigate]);

  useEffect(() => {
    fetchAttempt();
  }, [fetchAttempt]);

  // Countdown timer ticker
  useEffect(() => {
    if (remainingSec <= 0 || !attemptData) return;
    const timer = setInterval(() => {
      setRemainingSec(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleFinalSubmit(); // Auto-submit on timer expiry
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingSec, attemptData]);

  // Format seconds -> MM:SS
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Save answer to backend
  const saveAnswerToBackend = async (qId, option, newState) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/subject-tests/attempts/${attemptId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ questionId: qId, selectedOption: option, status: newState })
      });
    } catch { /* proceed */ }
  };

  const handleSelectOption = (optId) => {
    if (!attemptData) return;
    const q = attemptData.questions[currentIdx];
    const qId = q._id;
    const newAnswers = { ...answers, [qId]: optId };
    setAnswers(newAnswers);

    const currentState = questionStates[qId];
    let newState = 'ANSWERED';
    if (currentState === 'MARKED' || currentState === 'ANSWERED_MARKED') {
      newState = 'ANSWERED_MARKED';
    }

    setQuestionStates(prev => ({ ...prev, [qId]: newState }));
    saveAnswerToBackend(qId, optId, newState);
  };

  const handleMarkForReview = () => {
    if (!attemptData) return;
    const q = attemptData.questions[currentIdx];
    const qId = q._id;
    const currentOpt = answers[qId];

    const newState = currentOpt ? 'ANSWERED_MARKED' : 'MARKED';
    setQuestionStates(prev => ({ ...prev, [qId]: newState }));
    saveAnswerToBackend(qId, currentOpt || null, newState);

    // Auto-advance to next question
    if (currentIdx < attemptData.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handleClearResponse = () => {
    if (!attemptData) return;
    const q = attemptData.questions[currentIdx];
    const qId = q._id;

    const newAnswers = { ...answers };
    delete newAnswers[qId];
    setAnswers(newAnswers);

    const newState = 'NOT_ANSWERED';
    setQuestionStates(prev => ({ ...prev, [qId]: newState }));
    saveAnswerToBackend(qId, null, newState);
  };

  const handleSaveAndNext = () => {
    if (!attemptData) return;
    const q = attemptData.questions[currentIdx];
    const qId = q._id;
    const currentOpt = answers[qId];

    let currentState = questionStates[qId];
    if (!currentState || currentState === 'NOT_VISITED') {
      currentState = currentOpt ? 'ANSWERED' : 'NOT_ANSWERED';
      setQuestionStates(prev => ({ ...prev, [qId]: currentState }));
      saveAnswerToBackend(qId, currentOpt || null, currentState);
    }

    if (currentIdx < attemptData.questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      setShowSubmitModal(true);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/subject-tests/attempts/${attemptId}/submit`, {
        method: 'POST',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      }).then(r => r.json());

      if (res.success) {
        navigate(`/subject-test/result/${attemptId}`);
      } else {
        alert(res.message || 'Submission failed');
        setSubmitting(false);
      }
    } catch (err) {
      alert('Error submitting test: ' + err.message);
      setSubmitting(false);
    }
  };

  if (loading || !attemptData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid rgba(255,255,255,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ fontSize: 14, fontWeight: 700 }}>Connecting to CBT Exam Server…</p>
        </div>
      </div>
    );
  }

  const currentQ = attemptData.questions[currentIdx];
  const totalQs = attemptData.questions.length;

  // Calculate palette status stats
  let answeredCnt = 0;
  let notAnsweredCnt = 0;
  let markedCnt = 0;
  let notVisitedCnt = 0;

  Object.values(questionStates).forEach(st => {
    if (st === 'ANSWERED') answeredCnt++;
    else if (st === 'NOT_ANSWERED') notAnsweredCnt++;
    else if (st === 'MARKED' || st === 'ANSWERED_MARKED') markedCnt++;
    else notVisitedCnt++;
  });

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Header ── */}
      <header style={{ background: '#1e293b', color: '#fff', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #2563eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontWeight: 900, fontSize: 16, letterSpacing: 0.5, color: '#38bdf8' }}>CompetitiveExam Portal</div>
          <span style={{ color: '#64748b' }}>|</span>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{attemptData.testTitle}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Timer */}
          <div style={{ background: remainingSec < 300 ? '#7f1d1d' : '#0f172a', color: remainingSec < 300 ? '#fca5a5' : '#38bdf8', padding: '6px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 900, fontSize: 16 }}>
            <FaClock /> {formatTimer(remainingSec)}
          </div>
          <button onClick={() => setShowInstructionsModal(true)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '6px 14px', borderRadius: 8, fontWeight: 700, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FaInfoCircle /> View Instructions
          </button>
        </div>
      </header>

      {/* ── Main Exam Container ── */}
      <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap' }}>

        {/* ── Left Area: Question Panel ── */}
        <div style={{ flex: 1, minWidth: 320, padding: 24, display: 'flex', flexDirection: 'column' }}>
          
          {/* Question Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, background: '#fff', padding: '12px 18px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16, fontWeight: 900, color: '#1e293b' }}>Question {currentIdx + 1}</span>
              <span style={{ fontSize: 11, fontWeight: 700, background: '#eff6ff', color: '#2563eb', padding: '2px 8px', borderRadius: 6 }}>Language: {attemptData.selectedLanguage.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#0F9D58' }}>
              Marks: +{currentQ.marks} / <span style={{ color: '#dc2626' }}>-{currentQ.negativeMarks}</span>
            </div>
          </div>

          {/* Question Text & Image */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 24, flex: 1, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.6, marginBottom: 20 }}>
              {currentQ.questionText}
            </div>

            {currentQ.questionImage && (
              <img src={currentQ.questionImage} alt="Question Diagram" style={{ maxWidth: '100%', maxHeight: 220, borderRadius: 8, marginBottom: 20, border: '1px solid #e2e8f0' }} />
            )}

            {/* Option Cards */}
            <div style={{ display: 'grid', gap: 12 }}>
              {currentQ.options?.map(opt => {
                const isSelected = answers[currentQ._id] === opt.id;
                return (
                  <div
                    key={opt.id}
                    onClick={() => handleSelectOption(opt.id)}
                    style={{
                      border: `2px solid ${isSelected ? '#2563eb' : '#e2e8f0'}`,
                      background: isSelected ? '#eff6ff' : '#fff',
                      borderRadius: 10, padding: '14px 18px', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 14, transition: 'all 0.15s',
                      boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.12)' : 'none'
                    }}
                  >
                    <div style={{ width: 26, height: 26, borderRadius: '50%', border: `2px solid ${isSelected ? '#2563eb' : '#94a3b8'}`, background: isSelected ? '#2563eb' : '#fff', color: isSelected ? '#fff' : '#475569', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {opt.id}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: isSelected ? 800 : 500, color: isSelected ? '#1e293b' : '#334155' }}>
                      {opt.text}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Sticky Bottom Action Bar ── */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleMarkForReview} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #7C3AED', background: '#F3ECFE', color: '#7C3AED', fontWeight: 800, fontSize: 12.5, cursor: 'pointer' }}>
                <FaBookmark /> Mark for Review
              </button>
              <button onClick={handleClearResponse} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#475569', fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>
                Clear Response
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
                style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: currentIdx === 0 ? '#f1f5f9' : '#fff', color: '#334155', fontWeight: 700, fontSize: 12.5, cursor: currentIdx === 0 ? 'not-allowed' : 'pointer' }}>
                ‹ Previous
              </button>
              <button onClick={handleSaveAndNext} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
                Save &amp; Next →
              </button>
              <button onClick={() => setShowSubmitModal(true)} style={{ padding: '9px 20px', borderRadius: 8, border: 'none', background: '#0F9D58', color: '#fff', fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>
                Submit Test
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Area: Question Palette Sidebar ── */}
        <div className="responsive-cbt-palette" style={{ width: 280, background: '#fff', borderLeft: '1px solid #e2e8f0', padding: 20, display: 'flex', flexDirection: 'column' }}>
          
          {/* Profile Header */}
          <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
              <FaUserAlt />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#0f172a' }}>Student Candidate</div>
              <div style={{ fontSize: 11, color: '#0F9D58', fontWeight: 700 }}>● Exam Mode Active</div>
            </div>
          </div>

          {/* Question Palette Header */}
          <div style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 10 }}>Question Palette</div>

          {/* Palette Legend */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16, fontSize: 11, fontWeight: 700 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: '#0F9D58' }}></span> Answered ({answeredCnt})</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: '#DC2626' }}></span> Not Answered ({notAnsweredCnt})</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: '#7C3AED' }}></span> Marked ({markedCnt})</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 14, height: 14, borderRadius: 4, background: '#E2E8F0', border: '1px solid #cbd5e1' }}></span> Not Visited ({notVisitedCnt})</div>
          </div>

          {/* Question Buttons Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, flex: 1, alignContent: 'flex-start' }}>
            {attemptData.questions.map((q, idx) => {
              const qId = q._id;
              const state = questionStates[qId] || 'NOT_VISITED';
              const isCurrent = currentIdx === idx;

              let bg = '#E2E8F0';
              let color = '#334155';

              if (state === 'ANSWERED') { bg = '#0F9D58'; color = '#fff'; }
              else if (state === 'NOT_ANSWERED') { bg = '#DC2626'; color = '#fff'; }
              else if (state === 'MARKED' || state === 'ANSWERED_MARKED') { bg = '#7C3AED'; color = '#fff'; }

              return (
                <button
                  key={qId}
                  onClick={() => setCurrentIdx(idx)}
                  style={{
                    height: 38, borderRadius: 8, border: isCurrent ? '2.5px solid #2563eb' : 'none',
                    background: bg, color, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                    boxShadow: isCurrent ? '0 0 0 2px rgba(37,99,235,0.4)' : 'none',
                    position: 'relative'
                  }}
                >
                  {idx + 1}
                  {state === 'ANSWERED_MARKED' && (
                    <span style={{ position: 'absolute', top: 2, right: 2, width: 6, height: 6, borderRadius: '50%', background: '#0F9D58', border: '1px solid #fff' }}></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Submit Confirmation Modal ── */}
      {showSubmitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, padding: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>📝</div>
            <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 900, color: '#0f172a' }}>Submit Examination?</h3>
            <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 20px' }}>Are you sure you want to finish and submit your test?</p>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, textAlign: 'left', fontSize: 13 }}>
              <div>Total Questions: <strong>{totalQs}</strong></div>
              <div>Answered: <strong style={{ color: '#0F9D58' }}>{answeredCnt}</strong></div>
              <div>Not Answered: <strong style={{ color: '#DC2626' }}>{notAnsweredCnt}</strong></div>
              <div>Marked for Review: <strong style={{ color: '#7C3AED' }}>{markedCnt}</strong></div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setShowSubmitModal(false)} style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', fontWeight: 700 }}>Resume Exam</button>
              <button onClick={handleFinalSubmit} disabled={submitting} style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: '#0F9D58', color: '#fff', fontWeight: 900, cursor: 'pointer' }}>
                {submitting ? 'Submitting…' : 'Confirm & Submit →'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Instructions Modal ── */}
      {showInstructionsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 24, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Test Instructions</h3>
              <button onClick={() => setShowInstructionsModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer' }}>✕</button>
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
              <li>Total Duration: {attemptData.durationMins} minutes.</li>
              <li>Questions: {totalQs} questions.</li>
              <li>Positive Marks: +1 per correct answer.</li>
              <li>Negative Marking: -0.25 per wrong answer.</li>
              <li>You can change your selected options or clear responses anytime before final submission.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
