import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaCheckCircle, FaExclamationTriangle, FaShieldAlt } from 'react-icons/fa';

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
  }, [testId]);

  const handleStartExam = async () => {
    if (!agree) return;
    setStarting(true);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/subject-tests/tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          selectedLanguage,
          isPreview: testId === 'demo'
        })
      }).then(r => r.json());

      if (res.requiresSubscription) {
        alert(res.message);
        navigate('/subscription');
        return;
      }

      if (!res.success) {
        alert(res.message || 'Failed to start exam attempt');
        setStarting(false);
        return;
      }

      // Navigate to CBT Exam Interface
      navigate(`/subject-test/exam/${res.data.attemptId}`);
    } catch (err) {
      alert('Error starting exam: ' + err.message);
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid #e2e8f0', borderTopColor: '#1957D6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}></div>
          <p style={{ color: '#64748b', fontSize: 14, fontWeight: 700 }}>Loading Test Instructions…</p>
        </div>
      </div>
    );
  }

  const test = data?.test || {
    title: 'Subject Practice Test',
    totalQuestions: 25,
    totalMarks: 25,
    duration: 25,
    positiveMarks: 1,
    negativeMarks: 0.25,
  };

  const instruction = data?.instruction || {
    instructions: [
      'You have 25 minutes to complete the test.',
      'The test contains 25 questions.',
      'There is only one correct answer to each question.',
      'You will be awarded +1 mark for correct answer, -0.25 for wrong answer.',
      'You can change answers or clear responses anytime before submitting.',
      'When timer reaches 00:00, test will auto submit.'
    ],
    agreementText: 'I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I agree to follow all examination instructions and rules.'
  };

  return (
    <div style={{ minHeight: '90vh', background: '#f1f5f9', padding: '24px 16px' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 10px 30px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

        {/* Top Header */}
        <div style={{ background: '#1e293b', color: '#fff', padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => navigate('/subject-test')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: '#fff', padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: 13 }}>
              <FaArrowLeft /> Back
            </button>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{test.title}</h2>
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, background: '#3b82f6', padding: '4px 12px', borderRadius: 20 }}>
            {test.accessType || 'FREE'} TEST
          </span>
        </div>

        {/* Summary Bar */}
        <div style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', padding: '16px 24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Questions</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{test.totalQuestions} Qs</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Maximum Marks</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{test.totalMarks} Marks</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Duration</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a' }}>{test.duration} Minutes</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Marking Scheme</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0F9D58' }}>+{test.positiveMarks} / <span style={{ color: '#dc2626' }}>-{test.negativeMarks}</span></div>
          </div>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Section summary table if available */}
          {instruction.sections?.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ margin: '0 0 10px', fontSize: 14, fontWeight: 800, color: '#334155' }}>Sectional Breakdown</h4>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', color: '#475569', fontSize: 11 }}>
                    <th style={{ padding: '8px 12px' }}>S.No.</th>
                    <th style={{ padding: '8px 12px' }}>Section Name</th>
                    <th style={{ padding: '8px 12px' }}>Questions</th>
                    <th style={{ padding: '8px 12px' }}>Max Marks</th>
                    <th style={{ padding: '8px 12px' }}>Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {instruction.sections.map((sec, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '8px 12px', fontWeight: 700 }}>{i + 1}</td>
                      <td style={{ padding: '8px 12px', fontWeight: 700, color: '#1e293b' }}>{sec.name}</td>
                      <td style={{ padding: '8px 12px' }}>{sec.questions}</td>
                      <td style={{ padding: '8px 12px' }}>{sec.marks}</td>
                      <td style={{ padding: '8px 12px' }}>{sec.duration} mins</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Rules List */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>Please read the following instructions carefully:</h4>
            <ol style={{ margin: 0, paddingLeft: 20, color: '#334155', fontSize: 13.5, lineHeight: 1.7 }}>
              {instruction.instructions?.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: 6 }}>{rule}</li>
              ))}
            </ol>
          </div>

          {/* Language Selection */}
          <div style={{ background: '#eff6ff', borderRadius: 12, padding: '16px 20px', marginBottom: 24, border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#1e40af', marginBottom: 2 }}>Choose Your Default Language:</div>
              <div style={{ fontSize: 11.5, color: '#3b82f6' }}>Questions will be presented in this language. You can toggle language during exam if allowed.</div>
            </div>
            <select value={selectedLanguage} onChange={e => setSelectedLanguage(e.target.value)}
              style={{ padding: '8px 14px', borderRadius: 8, border: '1.5px solid #2563eb', fontWeight: 700, fontSize: 13, color: '#1e293b', outline: 'none' }}>
              <option value="en">English</option>
              <option value="or">Odia</option>
              <option value="hi">Hindi</option>
            </select>
          </div>

          {/* Agreement Checkbox */}
          <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer', fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
              <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)}
                style={{ width: 18, height: 18, marginTop: 2, accentColor: '#2563eb', cursor: 'pointer' }} />
              <span>{instruction.agreementText}</span>
            </label>
          </div>

          {/* Start Trigger */}
          <button
            onClick={handleStartExam}
            disabled={!agree || starting}
            style={{
              width: '100%', padding: '16px', borderRadius: 12, border: 'none',
              background: agree ? 'linear-gradient(135deg, #0F9D58 0%, #059669 100%)' : '#cbd5e1',
              color: '#fff', fontWeight: 900, fontSize: 16, cursor: agree ? 'pointer' : 'not-allowed',
              boxShadow: agree ? '0 8px 20px rgba(15, 157, 88, 0.35)' : 'none',
              transition: 'all .2s'
            }}
          >
            {starting ? 'Initializing CBT Exam Engine…' : 'I am ready to begin →'}
          </button>
        </div>

      </div>
    </div>
  );
}
