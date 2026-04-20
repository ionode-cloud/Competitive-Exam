import React, { useState, useMemo } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Trash2, Clock, Type, ListPlus, Briefcase, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateExam = () => {
  const [examInfo, setExamInfo] = useState({ 
    subjectName: '', 
    topicName: '', 
    negativeMarking: 0, 
    totalMarks: 100,
    duration: 60 
  });
  
  const [localQuestions, setLocalQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctOption: 0, section: '', marks: 1 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Marks Calculation Logic
  const usedMarks = useMemo(() => {
    return localQuestions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);
  }, [localQuestions]);

  const canAddQuestion = usedMarks < examInfo.totalMarks;
  const isOverLimit = usedMarks > examInfo.totalMarks;
  const isBalanced = usedMarks === examInfo.totalMarks;

  const addQuestion = () => {
    if (!canAddQuestion) {
      return alert("Maximum marks reached. You cannot add more questions.");
    }
    setLocalQuestions([...localQuestions, { text: '', options: ['', '', '', ''], correctOption: 0, section: '', marks: 1 }]);
  };

  const removeQuestion = (index) => {
    if (localQuestions.length === 1) return alert("Exam must have at least one question.");
    const updated = localQuestions.filter((_, i) => i !== index);
    setLocalQuestions(updated);
  };

  const updateQuestion = (index, field, value) => {
    const updated = [...localQuestions];
    updated[index][field] = value;
    setLocalQuestions(updated);
  };

  const updateOption = (qIdx, optIdx, value) => {
    const updated = [...localQuestions];
    updated[qIdx].options[optIdx] = value;
    setLocalQuestions(updated);
  };

  const handleSubmit = async (e) => {
    if(e) e.preventDefault();

    // Limit Validation
    if (usedMarks !== examInfo.totalMarks) {
      return alert(`Total marks must equal used marks before publishing. Current: ${usedMarks}/${examInfo.totalMarks}`);
    }
    
    // Content Validation
    const invalid = localQuestions.some(q => !q.text || q.options.some(opt => !opt) || !q.section);
    if (invalid) return alert("Please fill in all question texts, options, and sections.");

    try {
      setIsSubmitting(true);
      const adminToken = JSON.parse(localStorage.getItem('admin')).token;

      const payload = {
        ...examInfo,
        questions: localQuestions
      };
      
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams`, payload, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      alert('Exam published successfully!');
      navigate('/admin/dashboard');
    } catch (err) {
      alert('Failed to publish exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      {/* Real-time Marks Tracker Sticky Bar */}
      <div style={{ 
        position: 'sticky', 
        top: '0', 
        zIndex: 100, 
        background: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(10px)',
        padding: '16px 24px', 
        borderRadius: 'var(--radius-lg)', 
        marginBottom: '32px', 
        border: '1px solid var(--border-light)',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Used Marks Summary</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontSize: '1.5rem', 
                fontWeight: 800, 
                color: isOverLimit ? '#ef4444' : isBalanced ? '#10b981' : '#f59e0b' 
              }}>
                {usedMarks} <span style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>/ {examInfo.totalMarks}</span>
              </span>
              {isBalanced ? <CheckCircle size={20} color="#10b981" /> : isOverLimit ? <AlertTriangle size={20} color="#ef4444" /> : null}
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          {!isBalanced && (
            <p style={{ 
              fontSize: '0.8125rem', 
              color: isOverLimit ? '#ef4444' : '#f59e0b', 
              fontWeight: 600,
              margin: 0
            }}>
              {isOverLimit ? 'Marks exceed total limit!' : `Need ${examInfo.totalMarks - usedMarks} more marks to publish`}
            </p>
          )}
          {isBalanced && (
            <p style={{ fontSize: '0.8125rem', color: '#10b981', fontWeight: 600, margin: 0 }}>
              Ready to publish
            </p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Create New Exam</h1>
          <p style={{ color: 'var(--text-muted)' }}>Build your exam by adding questions dynamically.</p>
        </div>
        <button 
          onClick={handleSubmit} 
          className="btn btn-primary" 
          disabled={isSubmitting || !isBalanced}
          style={{ 
            height: '48px', 
            padding: '0 32px',
            opacity: !isBalanced ? 0.6 : 1,
            cursor: !isBalanced ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Exam'}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Type size={20} color="var(--primary)" /> Basic Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div className="input-group">
              <label>Subject Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. Banking" 
                required
                value={examInfo.subjectName}
                onChange={e => setExamInfo({ ...examInfo, subjectName: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Topic Name</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. RBI Assistant Pre Mock - 01" 
                required
                value={examInfo.topicName}
                onChange={e => setExamInfo({ ...examInfo, topicName: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Duration (Mins)</label>
              <input 
                type="number" 
                className="input-field" 
                required
                value={examInfo.duration}
                onChange={e => setExamInfo({ ...examInfo, duration: parseInt(e.target.value) })}
              />
            </div>
            <div className="input-group">
              <label>Total Marks</label>
              <input 
                type="number" 
                className="input-field" 
                required
                value={examInfo.totalMarks}
                onChange={e => setExamInfo({ ...examInfo, totalMarks: parseInt(e.target.value) })}
              />
            </div>
            <div className="input-group">
              <label>Negative Mark</label>
              <input 
                type="number" 
                step="0.01"
                className="input-field" 
                required
                value={examInfo.negativeMarking}
                onChange={e => setExamInfo({ ...examInfo, negativeMarking: parseFloat(e.target.value) })}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Questions */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ListPlus size={20} color="var(--primary)" /> Questions ({localQuestions.length})
            </h3>
            <button 
              type="button" 
              onClick={addQuestion} 
              className="btn btn-outline" 
              disabled={!canAddQuestion}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                opacity: !canAddQuestion ? 0.5 : 1,
                cursor: !canAddQuestion ? 'not-allowed' : 'pointer'
              }}
            >
              <Plus size={18} /> {canAddQuestion ? 'Add Question' : 'Max Marks Reached'}
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {localQuestions.map((q, qIdx) => (
              <div key={qIdx} className="glass animate-fade-in" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', position: 'relative', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div style={{ background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 700 }}>
                    Q{qIdx + 1}
                  </div>
                  <button type="button" onClick={() => removeQuestion(qIdx)} style={{ color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={18} />
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 100px', gap: '24px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Question Text</label>
                    <textarea 
                      className="input-field" 
                      style={{ minHeight: '80px', resize: 'vertical', fontSize: '1rem' }}
                      placeholder="Type your question here..."
                      value={q.text}
                      onChange={e => updateQuestion(qIdx, 'text', e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Section (Dynamic)</label>
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder="e.g. Reasoning"
                      value={q.section}
                      onChange={e => updateQuestion(qIdx, 'section', e.target.value)}
                      required
                    />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Marks</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      placeholder="1"
                      value={q.marks}
                      onChange={e => updateQuestion(qIdx, 'marks', parseInt(e.target.value) || 0)}
                      required
                      min="1"
                    />
                  </div>
                </div>

                <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                  {q.options.map((opt, optIdx) => (
                    <div key={optIdx} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.5)', padding: '12px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                      <input 
                        type="radio" 
                        name={`correct-${qIdx}`}
                        checked={q.correctOption === optIdx}
                        onChange={() => updateQuestion(qIdx, 'correctOption', optIdx)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                      />
                      <span style={{ fontWeight: 700, color: 'var(--text-muted)', width: '20px' }}>{String.fromCharCode(65 + optIdx)}.</span>
                      <input 
                        type="text" 
                        className="input-field" 
                        style={{ border: 'none', background: 'transparent', padding: '4px', marginBottom: 0 }}
                        placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                        value={opt}
                        onChange={e => updateOption(qIdx, optIdx, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button 
            type="button" 
            onClick={addQuestion} 
            className="btn btn-outline" 
            disabled={!canAddQuestion}
            style={{ 
              width: '100%', 
              marginTop: '24px', 
              padding: '16px', 
              borderStyle: 'dashed', 
              borderWidth: '2px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '8px', 
              opacity: !canAddQuestion ? 0.5 : 1,
              cursor: !canAddQuestion ? 'not-allowed' : 'pointer'
            }}
          >
            <Plus size={20} /> {canAddQuestion ? 'Add Another Question' : 'Maximum marks reached'}
          </button>
        </div>
      </form>
    </AdminLayout>
  );
};

export default CreateExam;
