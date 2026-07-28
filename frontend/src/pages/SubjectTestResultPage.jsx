// SubjectTestResultPage.jsx — Post-Exam Result Page & View Solutions Review
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaMedal,
  FaChartBar,
  FaKey,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaMinusCircle,
  FaEyeSlash,
  FaBullseye,
  FaClock
} from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5303/api';

export default function SubjectTestResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSolutions, setShowSolutions] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/subject-tests/attempts/${attemptId}/result`, {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    })
      .then(r => r.json())
      .then(j => {
        if (j.success) {
          setResult(j.data);
        } else {
          setError(j.message || 'Failed to load test result');
        }
      })
      .catch(() => setError('Could not connect to server'))
      .finally(() => setLoading(false));
  }, [attemptId]);

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

  const attemptedCount = result.correctCount + result.incorrectCount;
  const unseenCount = Math.max(0, result.totalQuestions - (attemptedCount + result.skippedCount));
  const safeScore = Math.round(result.totalMarks * 0.58);
  const isSafe = result.score >= safeScore;

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

  const formatTime = (sec) => {
    if (!sec || isNaN(sec)) return '0s';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

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

        {/* ── TOP PERFORMANCE CARDS (3 Cards Row from Screenshots) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 16, marginBottom: 24 }}>
          
          {/* Card 1: Score & Safe Range Banner */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #fee2e2', padding: 20, boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#dc2626', fontWeight: 900, fontSize: 16, marginBottom: 4 }}>
                <FaExclamationTriangle /> {isSafe ? `Great Job! ${studentName},` : `Keep Going! ${studentName},`}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                {isSafe ? 'You have reached the Desired Safe Score Range!' : 'You have not reached the Desired Safe Score Range!'}
              </div>

              <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                {/* Your Score */}
                <div style={{ flex: 1, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#991b1b', textTransform: 'uppercase' }}>Your Score</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#dc2626', marginTop: 2 }}>{result.score} <span style={{ fontSize: 12, color: '#991b1b' }}>/ {result.totalMarks}</span></div>
                </div>
                {/* Safe Score Range */}
                <div style={{ flex: 1, background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 10, padding: '10px 12px', textAlign: 'center' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#9a3412', textTransform: 'uppercase' }}>Safe Score Range</div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#ea580c', marginTop: 2 }}>{safeScore} <span style={{ fontSize: 12, color: '#9a3412' }}>/ {result.totalMarks}</span></div>
                </div>
              </div>

              <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626', textTransform: 'uppercase', marginBottom: 6 }}>RECOMMENDED FOR YOU:</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 11.5, color: '#475569', lineHeight: 1.6 }}>
                <li>Analyze weak areas</li>
                <li>Improve speed &amp; accuracy</li>
                <li>Attempt more mocks regularly</li>
              </ul>
            </div>

            <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 800, color: '#c2410c', marginTop: 14, textAlign: 'center' }}>
              ⚠️ Practice more to reach the Safe Score Range!
            </div>
          </div>

          {/* Card 2: Overall Performance */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>YOUR OVERALL PERFORMANCE</div>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3ecfe', color: '#7c3aed', fontSize: 32, marginBottom: 12 }}>
              <FaMedal />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Your Rank (Out of All)</div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#0f172a', margin: '2px 0' }}>1</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Out of 1 Test Takers</div>
          </div>

          {/* Card 3: Percentile */}
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, textAlign: 'center', boxShadow: '0 4px 14px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>YOUR PERCENTILE</div>
            <div style={{ width: 80, height: 80, borderRadius: '50%', border: '4px solid #2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eff6ff', color: '#2563eb', fontSize: 32, marginBottom: 12 }}>
              <FaChartBar />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>You scored better than</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: '#2563eb', margin: '2px 0' }}>{result.percentage}%ile</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>All of Test Takers</div>
          </div>

        </div>

        {/* ── STATISTIC CARDS GRID (10 Cards exactly from Specs) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 28 }}>
          
          {/* 1. Score */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaCheckCircle />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>Score</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{result.score}/{result.totalMarks}</div>
              <span style={{ fontSize: 9.5, fontWeight: 800, background: '#fef2f2', color: '#dc2626', padding: '1px 6px', borderRadius: 10 }}>Below Cutoff</span>
            </div>
          </div>

          {/* 2. Attempted */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef2f2', color: '#991b1b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaBullseye />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#991b1b' }}>Attempted</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{attemptedCount}/{result.totalQuestions}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>{Math.round((attemptedCount / result.totalQuestions) * 100)}%</span>
            </div>
          </div>

          {/* 3. Correct */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaCheckCircle />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#2563eb' }}>Correct</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{result.correctCount}/{result.totalQuestions}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>{Math.round((result.correctCount / result.totalQuestions) * 100)}%</span>
            </div>
          </div>

          {/* 4. InCorrect */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaTimesCircle />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#dc2626' }}>InCorrect</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{result.incorrectCount}/{result.totalQuestions}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>{Math.round((result.incorrectCount / result.totalQuestions) * 100)}%</span>
            </div>
          </div>

          {/* 5. Skipped */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f8fafc', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaMinusCircle />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b' }}>Skipped</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{result.skippedCount}/{result.totalQuestions}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>{Math.round((result.skippedCount / result.totalQuestions) * 100)}%</span>
            </div>
          </div>

          {/* 6. Unseen */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fff7ed', color: '#c2410c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaEyeSlash />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#c2410c' }}>Unseen</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{unseenCount}/{result.totalQuestions}</div>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: '#64748b' }}>{Math.round((unseenCount / result.totalQuestions) * 100)}%</span>
            </div>
          </div>

          {/* 7. Accuracy */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#f3ecfe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaBullseye />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#7c3aed' }}>Accuracy</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{result.accuracy}%</div>
              <span style={{ fontSize: 9.5, fontWeight: 800, background: '#fef2f2', color: '#dc2626', padding: '1px 6px', borderRadius: 10 }}>Average</span>
            </div>
          </div>

          {/* 8. Total Time */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fdf4ff', color: '#c026d3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaClock />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#c026d3' }}>Total Time</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{formatTime(result.timeTakenSec)}</div>
            </div>
          </div>

          {/* 9. Utilized Time */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#e0f7fa', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaClock />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#0891b2' }}>Utilized Time</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{formatTime(Math.round(result.timeTakenSec * 0.7))}</div>
            </div>
          </div>

          {/* 10. Wasted Time */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#eff6ff', color: '#1d4ed8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
              <FaClock />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#1d4ed8' }}>Wasted Time</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#0f172a' }}>{formatTime(Math.round(result.timeTakenSec * 0.3))}</div>
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
                const correctOpt = q.options?.find(o => o.id === q.correctAnswer);

                return (
                  <div key={q._id || idx} style={{ border: `1.5px solid ${q.isCorrect ? '#bbf7d0' : q.isSkipped ? '#cbd5e1' : '#fecaca'}`, borderRadius: 12, padding: 20, background: q.isCorrect ? '#f0fdf4' : q.isSkipped ? '#f8fafc' : '#fef2f2' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 900, color: '#1d4ed8', background: '#eff6ff', padding: '3px 10px', borderRadius: 6 }}>Question {idx + 1}</span>
                      <span style={{ fontSize: 12, fontWeight: 800, color: q.isCorrect ? '#16a34a' : q.isSkipped ? '#64748b' : '#dc2626' }}>
                        {q.isCorrect ? '✓ Correct' : q.isSkipped ? '○ Unattempted' : '✕ Incorrect'}
                      </span>
                    </div>

                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 16, lineHeight: 1.5 }}>
                      {q.questionText}
                    </div>

                    {/* Options List with Color Highlights */}
                    <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
                      {q.options?.map((opt, oIdx) => {
                        const isUserChoice = q.userAnswer === opt.id;
                        const isCorrectChoice = q.correctAnswer === opt.id;

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
                          color = '#b91c1c';
                        }

                        return (
                          <div
                            key={opt.id || oIdx}
                            style={{
                              padding: '12px 16px', borderRadius: 8, border: `2px solid ${border}`,
                              background: bg, color, fontSize: 13.5, fontWeight: (isUserChoice || isCorrectChoice) ? 800 : 500,
                              display: 'flex', alignItems: 'center', gap: 10
                            }}
                          >
                            <span style={{ width: 22, height: 22, borderRadius: '50%', background: isCorrectChoice ? '#16a34a' : (isUserChoice ? '#dc2626' : '#cbd5e1'), color: '#fff', fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              {getOptLetter(oIdx)}
                            </span>
                            <span>{opt.text}</span>
                            {isCorrectChoice && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#16a34a' }}>✓ Correct Answer</span>}
                            {isUserChoice && !isCorrectChoice && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#dc2626' }}>✕ Your Choice</span>}
                          </div>
                        );
                      })}
                    </div>

                    {/* Correct Answer & Explanation Footer */}
                    <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', padding: 14, fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 6, fontWeight: 800, color: '#16a34a' }}>
                        Correct Answer: <span>{correctOpt ? correctOpt.text : q.correctAnswer}</span>
                      </div>
                      <div>
                        <strong style={{ color: '#0f172a' }}>Explanation: </strong>
                        <span>{q.explanation || 'Explanation not available.'}</span>
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
