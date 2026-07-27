import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaTimesCircle, FaMinusCircle, FaArrowLeft, FaRedo, FaBookOpen } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5303/api';

export default function SubjectTestResultPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSolutions, setShowSolutions] = useState(true);

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
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#0F9D58', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>Calculating Test Score &amp; Detailed Analytics…</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div style={{ minHeight: '80vh', padding: 32, textAlign: 'center' }}>
        <h3 style={{ color: '#dc2626' }}>{error || 'Result not found'}</h3>
        <button onClick={() => navigate('/subject-test')} className="btn btn-primary" style={{ marginTop: 16 }}>Back to Subject Tests</button>
      </div>
    );
  }

  const formatSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div style={{ minHeight: '90vh', background: '#f8fafc', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto' }}>

        {/* ── Top Result Header Banner ── */}
        <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', borderRadius: 20, padding: 32, color: '#fff', marginBottom: 24, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Test Performance Summary</div>
              <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 900 }}>{result.testTitle}</h1>
              <div style={{ fontSize: 13, color: '#94a3b8' }}>Completed • Time Taken: {formatSec(result.timeTakenSec)}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '14px 24px', borderRadius: 14, textAlign: 'center', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#cbd5e1', textTransform: 'uppercase' }}>Final Score</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#4ade80' }}>{result.score} <span style={{ fontSize: 16, color: '#94a3b8' }}>/ {result.totalMarks}</span></div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginTop: 24, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Percentage</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#fde047' }}>{result.percentage}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Accuracy</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#38bdf8' }}>{result.accuracy}%</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Correct</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#4ade80' }}>{result.correctCount} Qs</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Incorrect</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#f87171' }}>{result.incorrectCount} Qs</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase' }}>Skipped</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#cbd5e1' }}>{result.skippedCount} Qs</div>
            </div>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button onClick={() => navigate('/subject-test')} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#334155', fontWeight: 800, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <FaArrowLeft /> Back to Subject Tests
          </button>
        </div>

        {/* ── Detailed Solutions Section ── */}
        {result.solutions?.length > 0 && (
          <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 24 }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Question-by-Question Solutions &amp; Explanations</h3>

            <div style={{ display: 'grid', gap: 20 }}>
              {result.solutions.map((q, idx) => (
                <div key={q._id} style={{ border: `1.5px solid ${q.isCorrect ? '#bbf7d0' : q.isSkipped ? '#e2e8f0' : '#fecaca'}`, borderRadius: 12, padding: 18, background: q.isCorrect ? '#f0fdf4' : q.isSkipped ? '#f8fafc' : '#fef2f2' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 900, color: '#1957D6', background: '#eff6ff', padding: '2px 8px', borderRadius: 6 }}>Question {idx + 1}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: q.isCorrect ? '#16a34a' : q.isSkipped ? '#64748b' : '#dc2626' }}>
                      {q.isCorrect ? '✓ Correct (+1)' : q.isSkipped ? '○ Skipped (0)' : '✕ Incorrect (-0.25)'}
                    </span>
                  </div>

                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 14 }}>{q.questionText}</div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 8, marginBottom: 14 }}>
                    {q.options?.map(opt => {
                      const isUserChoice = q.userAnswer === opt.id;
                      const isCorrectChoice = q.correctAnswer === opt.id;

                      let border = '#cbd5e1';
                      let bg = '#fff';
                      if (isCorrectChoice) { border = '#16a34a'; bg = '#dcfce7'; }
                      else if (isUserChoice && !isCorrectChoice) { border = '#dc2626'; bg = '#fee2e2'; }

                      return (
                        <div key={opt.id} style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${border}`, background: bg, fontSize: 13, fontWeight: (isUserChoice || isCorrectChoice) ? 800 : 500 }}>
                          <strong>({opt.id})</strong> {opt.text}
                          {isCorrectChoice && <span style={{ marginLeft: 6, color: '#16a34a' }}>✓ Correct</span>}
                          {isUserChoice && !isCorrectChoice && <span style={{ marginLeft: 6, color: '#dc2626' }}> (Your Answer)</span>}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div style={{ background: '#fff', borderRadius: 8, padding: 12, border: '1px solid #e2e8f0', fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
                      <strong style={{ color: '#0f172a' }}>Explanation: </strong>{q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
