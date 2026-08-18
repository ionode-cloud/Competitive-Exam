import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaMedal,
  FaChartBar,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaMinusCircle,
  FaEyeSlash,
  FaBullseye,
  FaKey
} from 'react-icons/fa';
import { getSocket } from '../utils/socket';
import { MathRenderer } from '../admin/components/MathInput';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5303/api';

export default function SubjectTestResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSolutions, setShowSolutions] = useState(false);

  const fetchResult = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/subject-tests/attempts/${attemptId}/result`, {
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
      }).then(r => r.json());

      if (res.success) {
        setResult(res.data);
      } else {
        setError(res.message || 'Failed to load test result');
      }
    } catch {
      setError('Could not connect to server');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    fetchResult();
  }, [fetchResult]);

  // Connect Socket.IO for real-time live score updates
  useEffect(() => {
    const socket = getSocket();
    const handleAttemptUpdate = (data) => {
      if (data && String(data.attemptId) === String(attemptId)) {
        fetchResult();
      }
    };
    socket.on('attempt_submitted', handleAttemptUpdate);
    return () => {
      socket.off('attempt_submitted', handleAttemptUpdate);
    };
  }, [attemptId, fetchResult]);

  if (loading) {
    return (
      <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>Calculating Test Performance &amp; Generating Analytics…</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{ minHeight: '80vh', padding: 32, textAlign: 'center' }}>
        <h3 style={{ color: '#dc2626' }}>{error || 'Result not found'}</h3>
        <button onClick={() => navigate('/mock-test')} className="btn btn-primary" style={{ marginTop: 16 }}>Back to Mock Tests</button>
      </div>
    );
  }

  // Helper to match option against user choice or correct answer
  const checkOptMatch = (opt, val, oIdx) => {
    if (!val) return false;
    const vStr = String(val).trim().toLowerCase();
    const letterMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'option_a': 0, 'option_b': 1, 'option_c': 2, 'option_d': 3 };
    const valIdx = letterMap[vStr];

    const optId = String(opt.id || '').trim().toLowerCase();
    const optLabel = String(opt.label || String.fromCharCode(65 + oIdx)).trim().toLowerCase();
    const optText = String(opt.text || '').trim().toLowerCase();

    return (
      optId === vStr ||
      optLabel === vStr ||
      String.fromCharCode(65 + oIdx).toLowerCase() === vStr ||
      (valIdx !== undefined && oIdx === valIdx) ||
      (optText !== '' && optText === vStr)
    );
  };

  const isQuestionCorrect = (q) => {
    if (!q) return false;
    if (q.isCorrect === true) return true;
    if (!q.userAnswer || !q.correctAnswer || !Array.isArray(q.options)) return false;
    return q.options.some((opt, oIdx) => checkOptMatch(opt, q.userAnswer, oIdx) && checkOptMatch(opt, q.correctAnswer, oIdx));
  };

  const isQuestionSkipped = (q) => {
    return !q || !q.userAnswer;
  };

  // Derive 100% accurate metrics from solution records
  const totalQs = result.totalQuestions || (Array.isArray(result.solutions) ? result.solutions.length : 1);
  const markPerQuestion = (result.totalMarks && totalQs) ? (result.totalMarks / totalQs) : 1;

  const trueCorrectCount = Array.isArray(result.solutions)
    ? result.solutions.filter(q => isQuestionCorrect(q)).length
    : (result.correctCount || 0);

  const trueIncorrectCount = Array.isArray(result.solutions)
    ? result.solutions.filter(q => !isQuestionSkipped(q) && !isQuestionCorrect(q)).length
    : (result.incorrectCount || 0);

  const trueSkippedCount = Array.isArray(result.solutions)
    ? result.solutions.filter(q => isQuestionSkipped(q)).length
    : (result.skippedCount || 0);

  const trueScore = Array.isArray(result.solutions)
    ? parseFloat((trueCorrectCount * markPerQuestion).toFixed(2))
    : (result.score || (trueCorrectCount * markPerQuestion));

  const displayScore = Math.max(0, trueScore);
  const attemptedCount = trueCorrectCount + trueIncorrectCount;
  const unseenCount = Math.max(0, totalQs - (attemptedCount + trueSkippedCount));
  const safeScore = Math.max(1, Math.round((result.totalMarks || totalQs || 1) * 0.5));
  const isSafe = displayScore >= safeScore;

  // Retrieve logged-in student name
  const studentUserStr = localStorage.getItem('user');
  let loggedInName = '';
  if (studentUserStr) {
    try {
      const parsed = JSON.parse(studentUserStr);
      loggedInName = parsed.name || parsed.fullName || parsed.username || '';
    } catch { /* silent */ }
  }
  const studentName = result.userName || loggedInName || 'Student';

  return (
    <div style={{ minHeight: '92vh', background: '#f8fafc', padding: '24px 16px' }}>
      <div style={{ maxWidth: 1140, margin: '0 auto' }}>

        {/* Back Navigation Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button
            onClick={() => navigate('/mock-test')}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FaArrowLeft /> Back to Mock Tests
          </button>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#64748b' }}>{result.testTitle}</span>
        </div>

        {/* ── TOP PERFORMANCE CARDS ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16, marginBottom: 24 }}>
          
          {/* Card 1: Score & Safe Range Banner */}
          <div style={{ background: '#fff', borderRadius: 16, border: `1px solid ${isSafe ? '#bbf7d0' : '#fee2e2'}`, padding: 20, boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: isSafe ? '#16a34a' : '#dc2626', fontWeight: 900, fontSize: 16, marginBottom: 4 }}>
                <FaExclamationTriangle /> {isSafe ? `Great Job! ${studentName},` : `Keep Going! ${studentName},`}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                {isSafe ? 'You have reached the Desired Safe Score Range!' : 'You have not reached the Desired Safe Score Range!'}
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {/* Your Score */}
                <div style={{ flex: 1, background: isSafe ? '#f0fdf4' : '#fef2f2', border: `1px solid ${isSafe ? '#bbf7d0' : '#fecaca'}`, borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: isSafe ? '#15803d' : '#991b1b', textTransform: 'uppercase' }}>Your Score</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: isSafe ? '#16a34a' : '#dc2626', marginTop: 2 }}>{displayScore} <span style={{ fontSize: 12, color: isSafe ? '#15803d' : '#991b1b' }}>/ {result.totalMarks || totalQs}</span></div>
                </div>
                {/* Safe Score Range */}
                <div style={{ flex: 1, background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#9a3412', textTransform: 'uppercase' }}>Safe Score Range</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#ea580c', marginTop: 2 }}>{safeScore} <span style={{ fontSize: 12, color: '#9a3412' }}>/ {result.totalMarks || totalQs}</span></div>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: isSafe ? '#16a34a' : '#dc2626', textTransform: 'uppercase', marginBottom: 6 }}>RECOMMENDED FOR YOU:</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#475569', lineHeight: 1.6 }}>
                <li>Analyze weak areas</li>
                <li>Improve speed &amp; accuracy</li>
                <li>Attempt more mocks regularly</li>
              </ul>
            </div>

            <div style={{ background: isSafe ? '#dcfce7' : '#fff7ed', border: `1px solid ${isSafe ? '#86efac' : '#fed7aa'}`, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 800, color: isSafe ? '#15803d' : '#c2410c', marginTop: 14, textAlign: 'center' }}>
              {isSafe ? '✓ Safe Score Range Achieved!' : '⚠️ Practice more to reach the Safe Score Range!'}
            </div>
          </div>

          {/* Card 2: Overall Performance */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>YOUR OVERALL PERFORMANCE</div>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3ecfe', color: '#7c3aed', fontSize: 32, marginBottom: 12 }}>
              <FaMedal />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Your Rank (Out of All)</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '2px 0' }}>{result.rank || 1}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Out of {result.totalTakers || 1} Test Takers</div>
          </div>

          {/* Card 3: Percentile */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>YOUR PERCENTILE</div>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: '#2563eb', fontSize: 32, marginBottom: 12 }}>
              <FaChartBar />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>You scored better than</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#2563eb', margin: '2px 0' }}>{result.percentile !== undefined ? result.percentile : (result.percentage || 0)}%ile</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>All of Test Takers</div>
          </div>

        </div>

        {/* ── STATISTIC CARDS GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          
          {/* 1. Score */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: isSafe ? '#f0fdf4' : '#fef2f2', color: isSafe ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaCheckCircle />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: isSafe ? '#16a34a' : '#dc2626' }}>Score</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{displayScore}/{result.totalMarks || totalQs}</div>
              <span style={{ fontSize: 9.5, fontWeight: 800, background: isSafe ? '#dcfce7' : '#fef2f2', color: isSafe ? '#15803d' : '#dc2626', padding: '1px 6px', borderRadius: 10 }}>
                {isSafe ? 'Above Cutoff' : 'Below Cutoff'}
              </span>
            </div>
          </div>

          {/* 2. Attempted */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaBullseye />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb' }}>Attempted</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{attemptedCount}/{totalQs}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>{Math.round((attemptedCount / totalQs) * 100)}%</span>
            </div>
          </div>

          {/* 3. Correct */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaCheckCircle />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>Correct</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{trueCorrectCount}/{totalQs}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>{Math.round((trueCorrectCount / totalQs) * 100)}%</span>
            </div>
          </div>

          {/* 4. InCorrect */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaTimesCircle />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626' }}>InCorrect</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{trueIncorrectCount}/{totalQs}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>{Math.round((trueIncorrectCount / totalQs) * 100)}%</span>
            </div>
          </div>

          {/* 5. Skipped */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaMinusCircle />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>Skipped</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{trueSkippedCount}/{totalQs}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>{Math.round((trueSkippedCount / totalQs) * 100)}%</span>
            </div>
          </div>

          {/* 6. Unseen */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff7ed', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaEyeSlash />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#c2410c' }}>Unseen</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{unseenCount}/{totalQs}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>{Math.round((unseenCount / totalQs) * 100)}%</span>
            </div>
          </div>

        </div>

        {/* ── BOTTOM CENTER BUTTON: View Solutions ── */}
        <div style={{ textAlign: 'center', margin: '32px 0 40px' }}>
          <button
            onClick={() => setShowSolutions(!showSolutions)}
            style={{
              padding: '14px 42px', borderRadius: 30, border: 'none',
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
              color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)', display: 'inline-flex', alignItems: 'center', gap: 10
            }}
          >
            <FaKey /> {showSolutions ? 'Hide Solutions ▲' : 'View Solutions ▼'}
          </button>
        </div>

        {/* ── STEP 5: VIEW SOLUTIONS PAGE / SECTION ── */}
        {showSolutions && result.solutions?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottom: '1px solid #e2e8f0', paddingBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: '#0f172a' }}>Detailed Solutions Review</h3>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{result.solutions.length} Questions</span>
            </div>

            <div style={{ display: 'grid', gap: 20 }}>
              {result.solutions.map((q, idx) => {
                const getOptLetter = (oIdx) => String.fromCharCode(65 + oIdx);

                const checkOptMatch = (opt, val, oIdx) => {
                  if (!val) return false;
                  const vStr = String(val).trim().toLowerCase();
                  const letterMap = { 'a': 0, 'b': 1, 'c': 2, 'd': 3, 'option_a': 0, 'option_b': 1, 'option_c': 2, 'option_d': 3 };
                  const valIdx = letterMap[vStr];

                  const optId = String(opt.id || '').trim().toLowerCase();
                  const optLabel = String(opt.label || getOptLetter(oIdx)).trim().toLowerCase();
                  const optText = String(opt.text || '').trim().toLowerCase();

                  return (
                    optId === vStr ||
                    optLabel === vStr ||
                    getOptLetter(oIdx).toLowerCase() === vStr ||
                    (valIdx !== undefined && oIdx === valIdx) ||
                    (optText !== '' && optText === vStr)
                  );
                };

                const correctOpt = q.options?.find((o, oIdx) => checkOptMatch(o, q.correctAnswer, oIdx));

                const qCorrect = isQuestionCorrect(q);
                const qSkipped = isQuestionSkipped(q);

                return (
                  <div key={q._id || idx} style={{ border: `1.5px solid ${qCorrect ? '#bbf7d0' : qSkipped ? '#cbd5e1' : '#fecaca'}`, borderRadius: 12, padding: 20, background: qCorrect ? '#f0fdf4' : qSkipped ? '#f8fafc' : '#fef2f2' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#1d4ed8', background: '#eff6ff', padding: '3px 10px', borderRadius: 6 }}>Question {idx + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: qCorrect ? '#16a34a' : qSkipped ? '#64748b' : '#dc2626' }}>
                        {qCorrect ? '✓ Correct' : qSkipped ? '○ Unattempted' : '✕ Incorrect'}
                      </span>
                    </div>

                    {/* Question Text & Image — Side by Side */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', marginBottom: 16 }}>
                      <div style={{ flex: 1, minWidth: 0, fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.6 }}>
                        <MathRenderer text={q.questionText} />
                      </div>
                      {q.questionImage && (
                        <div style={{ flexShrink: 0, maxWidth: '35%', display: 'flex', justifyContent: 'center' }}>
                          <img
                            src={q.questionImage}
                            alt="Question Diagram"
                            style={{ width: '100%', maxHeight: 200, objectFit: 'contain', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', padding: 4 }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Options List with Color Highlights */}
                    <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                      {q.options?.map((opt, oIdx) => {
                        const isUserChoice = checkOptMatch(opt, q.userAnswer, oIdx);
                        const isCorrectChoice = checkOptMatch(opt, q.correctAnswer, oIdx);

                        let border = '#e2e8f0';
                        let bg = '#fff';
                        let color = '#334155';

                        if (isCorrectChoice) {
                          border = '#16a34a';
                          bg = '#dcfce7';
                          color = '#15803d';
                        } else if (isUserChoice && !isCorrectChoice) {
                          border = '#dc2626';
                          bg = '#fee2e2';
                          color = '#991b1b';
                        }

                        return (
                          <div
                            key={opt.id || opt.label || oIdx}
                            style={{
                              border: `1.5px solid ${border}`,
                              background: bg,
                              color,
                              padding: '10px 14px',
                              borderRadius: 8,
                              fontSize: 13.5,
                              fontWeight: (isCorrectChoice || isUserChoice) ? 700 : 500,
                              display: 'flex', alignItems: 'center', gap: 10
                            }}
                          >
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: isCorrectChoice ? '#16a34a' : (isUserChoice ? '#dc2626' : '#cbd5e1'), color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              {getOptLetter(oIdx)}
                            </span>
                            <span><MathRenderer text={opt.text} /></span>
                            {isCorrectChoice && isUserChoice && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#16a34a' }}>✓ Your Choice (Correct)</span>}
                            {isCorrectChoice && !isUserChoice && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#16a34a' }}>✓ Correct Answer</span>}
                            {isUserChoice && !isCorrectChoice && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#dc2626' }}>✕ Your Choice</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Correct Answer & Explanation Footer */}
                    <div style={{ background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: 16, fontSize: 13, color: '#334155', lineHeight: 1.6, boxShadow: '0 1px 4px rgba(0,0,0,0.03)' }}>
                      <div style={{ marginBottom: 10, fontWeight: 800, color: '#16a34a', fontSize: 13.5 }}>
                        Correct Answer: <span style={{ color: '#15803d' }}><MathRenderer text={correctOpt ? correctOpt.text : q.correctAnswer} /></span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: 260 }}>
                          <strong style={{ color: '#0f172a', display: 'block', marginBottom: 4 }}>💡 Step-by-Step Explanation:</strong>
                          <div style={{ color: '#334155', lineHeight: 1.65 }}>
                            <MathRenderer text={q.explanation || 'Explanation not available.'} />
                          </div>
                        </div>

                        {q.explanationImage && (
                          <div style={{ flexShrink: 0, maxWidth: '38%', minWidth: 200, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                            <img
                              src={q.explanationImage}
                              alt="Explanation Diagram"
                              style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: 8, border: '1px solid #cbd5e1', background: '#f8fafc', padding: 4 }}
                            />
                            <span style={{ fontSize: 10.5, color: '#64748b', fontWeight: 600 }}>Explanation Diagram</span>
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
