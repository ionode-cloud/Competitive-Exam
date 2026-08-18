// ExamInstructionPage.jsx — Pre-Exam Instructions Screen
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaShieldAlt, FaClock, FaClipboardList, FaAward } from 'react-icons/fa';
import { MathRenderer } from '../admin/components/MathInput';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5303/api';

export default function ExamInstructionPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [agree, setAgree] = useState(false);
  const [starting, setStarting] = useState(false);
  const [alreadyAttemptedInfo, setAlreadyAttemptedInfo] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/subject-tests/tests/${testId}/instructions`)
      .then(r => r.json().catch(() => ({ success: false, message: 'Test not found or has been removed' })))
      .then(j => {
        if (j.success) {
          setData(j.data);
          if (j.data.test?.availableLanguages?.length) {
            setSelectedLanguage(j.data.test.availableLanguages[0]);
          }
        } else {
          setError(j.message || 'Test not found or has been removed');
        }
      })
      .catch(() => setError('Could not connect to server'))
      .finally(() => setLoading(false));

    // Check if current student has already completed an attempt for this test
    const token = localStorage.getItem('token');
    if (token) {
      fetch(`${API_URL}/subject-tests/user/attempted-tests`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(j => {
          if (j.success && j.attemptDetails && j.attemptDetails[String(testId)]) {
            let isAdmin = false;
            try {
              const user = JSON.parse(localStorage.getItem('user') || '{}');
              isAdmin = ['admin', 'superadmin', 'sub_admin', 'content_manager', 'question_creator', 'support'].includes(user.role);
            } catch {}
            if (!isAdmin) {
              setAlreadyAttemptedInfo(j.attemptDetails[String(testId)]);
            }
          }
        })
        .catch(() => {});
    }
  }, [testId]);

  const handleStartExam = async () => {
    if (!agree) return;
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to attend this examination');
      navigate('/login');
      return;
    }
    setStarting(true);

    try {
      const res = await fetch(`${API_URL}/subject-tests/tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          selectedLanguage,
          isPreview: testId === 'demo'
        })
      }).then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          return { success: false, isUnauthorized: true, message: 'Your session has expired. Please log in again.' };
        }
        return r.json();
      });

      if (res.isUnauthorized) {
        alert(res.message || 'Please log in to start the exam');
        navigate('/login');
        return;
      }

      if (res.requiresSubscription) {
        alert(res.message);
        navigate('/subscription');
        return;
      }

      if (res.alreadyAttempted) {
        alert(res.message || 'You have already attempted this exam. Each exam can only be attempted once.');
        if (res.attemptId) {
          navigate(`/subject-test/result/${res.attemptId}`);
        } else {
          navigate('/profile');
        }
        return;
      }

      if (!res.success) {
        alert(res.message || 'Failed to start exam attempt');
        setStarting(false);
        return;
      }

      navigate(`/subject-test/exam/${res.data.attemptId}`);
    } catch (err) {
      alert('Error starting exam: ' + err.message);
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>Loading Test Instructions…</p>
        </div>
      </div>
    );
  }

  const test = data?.test || {
    title: 'Competitive Exam Test',
    totalQuestions: 100,
    totalMarks: 100,
    duration: 120,
    positiveMarks: 1,
    negativeMarks: 0.25,
  };

  const instruction = data?.instruction || {
    instructions: [
      'Read all questions carefully before choosing your answer.',
      'Each question has only one correct answer.',
      'Negative marking applies for incorrect attempts if configured (+1 / -0.25).',
      'Do not refresh or close the browser page during the active test session.',
      'The exam countdown timer starts only after clicking the Start Test button.',
      'Submit your test before the remaining time reaches 00:00.',
      'Use the Question Palette on the right panel for quick question navigation.'
    ],
    agreementText: 'I have read all the instructions carefully. All computer hardware allotted to me are in proper working condition. I agree to follow all examination instructions and rules.'
  };

  return (
    <div style={{ minHeight: '92vh', background: '#f1f5f9', padding: '24px 16px' }}>
      <div style={{ maxWidth: 940, margin: '0 auto', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Header Bar */}
        <div style={{ background: '#1e293b', color: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #2563eb' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => navigate('/mock-test')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
              <FaArrowLeft /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>
              <MathRenderer text={test.title} />
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, fontWeight: 800, background: '#2563eb', padding: '4px 12px', borderRadius: 20 }}>
              {test.accessType || 'FREE'} TEST
            </span>
          </div>
        </div>

        {/* Candidate & Test Metadata Header Card */}
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '20px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Subject Test Name</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>
              <MathRenderer text={test.title} />
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Duration</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{test.duration} Mins</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Questions</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{test.totalQuestions} Qs</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Total Marks</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#0f172a', marginTop: 2 }}>{test.totalMarks} Marks</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Negative Marking</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: '#dc2626', marginTop: 2 }}>-{test.negativeMarks || 0.25}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Default Language</div>
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
              style={{ marginTop: 2, padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontWeight: 800, fontSize: 13 }}
            >
              <option value="en">English</option>
              <option value="or">Odia</option>
              <option value="hi">Hindi</option>
            </select>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Candidate Info Card */}
          <div style={{ background: '#eff6ff', borderRadius: 12, border: '1px solid #bfdbfe', padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 900, color: '#1e3a8a' }}>Student Candidate</div>
              <div style={{ fontSize: 12, color: '#2563eb', marginTop: 2 }}>Exam: <strong>{test.title}</strong> • Type: <strong>{test.totalQuestions >= 100 ? 'Full Length Mock' : 'Sectional Practice'}</strong></div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, background: '#dbeafe', color: '#1d4ed8', padding: '4px 10px', borderRadius: 20 }}>CBT Exam Portal</span>
          </div>

          {/* Instructions List */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 900, color: '#0f172a' }}>General Instructions:</h4>
            <ul style={{ margin: 0, paddingLeft: 20, color: '#334155', fontSize: 13.5, lineHeight: 1.7 }}>
              {instruction.instructions?.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>{rule}</li>
              ))}
            </ul>
          </div>

          {/* Already Attempted Warning Alert */}
          {alreadyAttemptedInfo && (
            <div style={{ background: '#fef3c7', border: '1.5px solid #fde68a', borderRadius: 12, padding: '16px 20px', marginBottom: 20, color: '#92400e', fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 12 }}>
              <FaExclamationTriangle fontSize={22} style={{ flexShrink: 0, color: '#d97706' }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 800 }}>You have already attempted this exam!</div>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: '#b45309', marginTop: 2 }}>
                  Only one attempt is allowed per candidate. You can view your previous result and solution explanations below.
                </div>
              </div>
            </div>
          )}

          {/* Agreement Checkbox */}
          {!alreadyAttemptedInfo && (
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 13.5, color: '#1e293b', fontWeight: 600, lineHeight: 1.5 }}>
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={e => setAgree(e.target.checked)}
                  style={{ width: 18, height: 18, marginTop: 2, accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <span>I have read all the instructions carefully.</span>
              </label>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => navigate('/mock-test')}
              style={{ padding: '14px 24px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', fontWeight: 800, fontSize: 14, cursor: 'pointer' }}
            >
              Back
            </button>
            {alreadyAttemptedInfo ? (
              <button
                onClick={() => navigate(`/subject-test/result/${alreadyAttemptedInfo.attemptId}`)}
                style={{
                  flex: 1, padding: '14px 24px', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', fontWeight: 900, fontSize: 15, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                  transition: 'all .2s'
                }}
              >
                View Your Results & Review Solutions →
              </button>
            ) : (
              <button
                onClick={handleStartExam}
                disabled={!agree || starting}
                style={{
                  flex: 1, padding: '14px 24px', borderRadius: 10, border: 'none',
                  background: agree ? '#2563eb' : '#cbd5e1',
                  color: '#fff', fontWeight: 900, fontSize: 15, cursor: agree ? 'pointer' : 'not-allowed',
                  boxShadow: agree ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
                  transition: 'all .2s'
                }}
              >
                {starting ? 'Initializing Exam Engine…' : 'Start Test →'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
