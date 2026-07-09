import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Trash2, Clock, Type, ListPlus, AlertTriangle, CheckCircle, BookOpen, Search, X, CheckSquare, Square } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { alertSuccess, alertError, alertWarning } from '../../utils/alert';
import Skeleton from '../../components/Skeleton';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const CreateExam = () => {
  const [examInfo, setExamInfo] = useState({
    subjectName: '',
    topicName: '',
    negativeMarking: 0,
    totalMarks: 100,
    duration: 60,
    isPaid: false,
    price: 0
  });

  const [localQuestions, setLocalQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctOption: 0, section: '', marks: 1 }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [subjectsList, setSubjectsList] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await axios.get(`${API}/api/subjects`);
        setSubjectsList(res.data);
      } catch (err) {
        console.error('Failed to fetch subjects in CreateExam:', err);
      } finally {
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
  }, []);

  // Question Bank Modal State
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankQuestions, setBankQuestions] = useState([]);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBankIds, setSelectedBankIds] = useState(new Set());
  const [bankFilterTopic, setBankFilterTopic] = useState('All');

  const navigate = useNavigate();

  // Marks Calculation
  const usedMarks = useMemo(() => localQuestions.reduce((s, q) => s + (parseInt(q.marks) || 0), 0), [localQuestions]);
  const canAddQuestion = usedMarks < examInfo.totalMarks;
  const isOverLimit = usedMarks > examInfo.totalMarks;
  const isBalanced = usedMarks === examInfo.totalMarks;

  const addQuestion = () => {
    if (!canAddQuestion) {
      alertWarning('Limit Reached', 'Maximum marks reached. You cannot add more questions.');
      return;
    }
    setLocalQuestions([...localQuestions, { text: '', options: ['', '', '', ''], correctOption: 0, section: '', marks: 1 }]);
  };

  const removeQuestion = (index) => {
    if (localQuestions.length === 1) {
      alertWarning('Validation Alert', 'Exam must have at least one question.');
      return;
    }
    setLocalQuestions(localQuestions.filter((_, i) => i !== index));
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

  // ---------- Question Bank Modal Handlers ----------

  const openBankModal = async () => {
    setShowBankModal(true);
    setBankSearch('');
    setSelectedBankIds(new Set());
    setBankFilterTopic('All');
    if (bankQuestions.length === 0) {
      setBankLoading(true);
      try {
        const token = JSON.parse(localStorage.getItem('admin')).token;
        const res = await axios.get(`${API}/api/questions`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBankQuestions(res.data);
      } catch {
        alertError('Error', 'Failed to load question bank');
      } finally {
        setBankLoading(false);
      }
    }
  };

  const toggleSelectBank = (id) => {
    setSelectedBankIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bankTopics = useMemo(() => {
    const topics = new Set(bankQuestions.map(q => q.exam?.topicName || q.topicName || 'General'));
    return ['All', ...topics];
  }, [bankQuestions]);

  const filteredBankQuestions = useMemo(() => {
    return bankQuestions.filter(q => {
      const topic = q.exam?.topicName || q.topicName || 'General';
      const matchTopic = bankFilterTopic === 'All' || topic === bankFilterTopic;
      const matchSearch = !bankSearch ||
        q.text.toLowerCase().includes(bankSearch.toLowerCase()) ||
        (q.section || '').toLowerCase().includes(bankSearch.toLowerCase()) ||
        (q.subjectName || '').toLowerCase().includes(bankSearch.toLowerCase()) ||
        topic.toLowerCase().includes(bankSearch.toLowerCase());
      return matchTopic && matchSearch;
    });
  }, [bankQuestions, bankSearch, bankFilterTopic]);

  const handleAddFromBank = () => {
    if (selectedBankIds.size === 0) {
      alertWarning('Selection Required', 'Please select at least one question.');
      return;
    }
    const toAdd = bankQuestions
      .filter(q => selectedBankIds.has(q._id))
      .map(q => ({
        text: q.text,
        options: [...q.options],
        correctOption: q.correctOption,
        section: q.section || '',
        marks: q.marks || 1,
      }));

    // Remove empty placeholder if it's the only question
    const hasOnlyEmpty = localQuestions.length === 1 &&
      !localQuestions[0].text && localQuestions[0].options.every(o => !o);

    setLocalQuestions(hasOnlyEmpty ? toAdd : [...localQuestions, ...toAdd]);
    setShowBankModal(false);
    setSelectedBankIds(new Set());
  };

  // ---------- Exam Submit ----------

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (usedMarks !== examInfo.totalMarks) {
      alertWarning('Marks Mismatch', `Total marks must equal used marks. Current: ${usedMarks}/${examInfo.totalMarks}`);
      return;
    }
    const invalid = localQuestions.some(q => !q.text || q.options.some(o => !o) || !q.section);
    if (invalid) {
      alertWarning('Incomplete Fields', 'Please fill in all question texts, options, and sections.');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = JSON.parse(localStorage.getItem('admin')).token;
      await axios.post(`${API}/api/exams`, { ...examInfo, questions: localQuestions }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alertSuccess('Success', 'Exam published successfully!');
      navigate('/admin/dashboard');
    } catch {
      alertError('Error', 'Failed to publish exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      {/* Sticky Marks Tracker */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--bg-glass)', backdropFilter: 'blur(12px)',
        padding: '16px 24px', borderRadius: 'var(--radius-lg)', marginBottom: '32px',
        border: '1px solid var(--border)', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        boxShadow: 'var(--shadow-md)'
      }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Used Marks</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: isOverLimit ? '#ef4444' : isBalanced ? '#22c55e' : '#f59e0b' }}>
              {usedMarks} <span style={{ color: 'var(--text-secondary)', fontSize: '1rem', fontWeight: 500 }}>/ {examInfo.totalMarks}</span>
            </span>
            {isBalanced && <CheckCircle size={20} color="#22c55e" />}
            {isOverLimit && <AlertTriangle size={20} color="#ef4444" />}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          {!isBalanced && (
            <p style={{ fontSize: '0.8125rem', color: isOverLimit ? '#ef4444' : '#f59e0b', fontWeight: 600, margin: 0 }}>
              {isOverLimit ? 'Marks exceed total limit!' : `Need ${examInfo.totalMarks - usedMarks} more marks to publish`}
            </p>
          )}
          {isBalanced && <p style={{ fontSize: '0.8125rem', color: '#22c55e', fontWeight: 600, margin: 0 }}>✓ Ready to publish</p>}
        </div>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '8px', background: 'var(--orange-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Create New Exam</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Build your exam by adding questions manually or from the question bank.</p>
        </div>
        <button
          onClick={handleSubmit}
          className="btn btn-primary"
          disabled={isSubmitting || !isBalanced}
          style={{ height: '48px', padding: '0 32px', opacity: !isBalanced ? 0.6 : 1, cursor: !isBalanced ? 'not-allowed' : 'pointer' }}
        >
          {isSubmitting ? 'Publishing...' : 'Publish Exam'}
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', marginBottom: '32px', border: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <Type size={20} color="var(--primary)" /> Basic Information
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div className="input-group">
              <label>Subject Name</label>
              {loadingSubjects ? (
                <select className="input-field" disabled><option>Loading subjects...</option></select>
              ) : (
                <select 
                  className="input-field" 
                  required
                  value={examInfo.subjectName} 
                  onChange={e => setExamInfo({ ...examInfo, subjectName: e.target.value })}
                >
                  <option value="">Select a Subject</option>
                  {subjectsList.filter(s => s.isActive !== false).map(sub => (
                    <option key={sub._id} value={sub.name}>{sub.name}</option>
                  ))}
                </select>
              )}
            </div>
            <div className="input-group">
              <label>Topic Name</label>
              <input type="text" className="input-field" placeholder="e.g. RBI Assistant Pre Mock - 01" required
                value={examInfo.topicName} onChange={e => setExamInfo({ ...examInfo, topicName: e.target.value })} />
            </div>
            <div className="input-group">
              <label>Duration (Mins)</label>
              <input type="number" className="input-field" required
                value={examInfo.duration} onChange={e => setExamInfo({ ...examInfo, duration: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) })} />
            </div>
            <div className="input-group">
              <label>Total Marks</label>
              <input type="number" className="input-field" required
                value={examInfo.totalMarks} onChange={e => setExamInfo({ ...examInfo, totalMarks: e.target.value === '' ? '' : (parseInt(e.target.value) || 0) })} />
            </div>
            <div className="input-group">
              <label>Negative Mark</label>
              <input type="number" step="0.01" className="input-field" required
                value={examInfo.negativeMarking} onChange={e => setExamInfo({ ...examInfo, negativeMarking: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })} />
            </div>

            {/* Free / Paid Toggle */}
            <div className="input-group">
              <label>Exam Type</label>
              <div style={{ display: 'flex', gap: '0', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)', width: 'fit-content' }}>
                <button
                  type="button"
                  onClick={() => setExamInfo({ ...examInfo, isPaid: false, price: 0 })}
                  style={{
                    padding: '10px 22px', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                    background: !examInfo.isPaid ? 'var(--primary)' : 'transparent',
                    color: !examInfo.isPaid ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >Free</button>
                <button
                  type="button"
                  onClick={() => setExamInfo({ ...examInfo, isPaid: true })}
                  style={{
                    padding: '10px 22px', fontWeight: 700, fontSize: '0.9rem', border: 'none', cursor: 'pointer',
                    background: examInfo.isPaid ? '#f59e0b' : 'transparent',
                    color: examInfo.isPaid ? '#fff' : 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                >Paid</button>
              </div>
            </div>

            {/* Price (only if Paid) */}
            {examInfo.isPaid && (
              <div className="input-group">
                <label>Price (₹)</label>
                <input
                  type="number"
                  min="1"
                  className="input-field"
                  placeholder="e.g. 99"
                  value={examInfo.price}
                  onChange={e => setExamInfo({ ...examInfo, price: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                  style={{ borderColor: '#f59e0b' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Questions Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            <ListPlus size={20} color="var(--primary)" /> Questions ({localQuestions.length})
          </h3>
          <div style={{ display: 'flex', gap: '12px' }}>
            {/* ✅ Add from Question Bank Button */}
            <button
              type="button"
              onClick={openBankModal}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--primary-ultra)' }}
            >
              <BookOpen size={18} /> Add from Question Bank
            </button>
            <button
              type="button"
              onClick={addQuestion}
              className="btn btn-outline"
              disabled={!canAddQuestion}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: !canAddQuestion ? 0.5 : 1, cursor: !canAddQuestion ? 'not-allowed' : 'pointer' }}
            >
              <Plus size={18} /> {canAddQuestion ? 'Add Question' : 'Max Marks Reached'}
            </button>
          </div>
        </div>

        {/* Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '32px' }}>
          {localQuestions.map((q, qIdx) => (
            <div key={qIdx} className="glass animate-fade-in" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', position: 'relative', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div style={{ background: 'var(--primary)', color: 'white', padding: '4px 12px', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 700, boxShadow: 'var(--shadow-orange)' }}>
                  Q{qIdx + 1}
                </div>
                <button type="button" onClick={() => removeQuestion(qIdx)}
                  style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', transition: 'var(--transition-fast)' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}>
                  <Trash2 size={18} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 100px', gap: '24px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Question Text</label>
                  <textarea className="input-field" style={{ minHeight: '80px', resize: 'vertical' }}
                    placeholder="Type your question here..."
                    value={q.text} onChange={e => updateQuestion(qIdx, 'text', e.target.value)} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Section</label>
                  <input type="text" className="input-field" placeholder="e.g. Reasoning"
                    value={q.section} onChange={e => updateQuestion(qIdx, 'section', e.target.value)} required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Marks</label>
                  <input type="number" className="input-field" placeholder="1" min="1"
                    value={q.marks} onChange={e => updateQuestion(qIdx, 'marks', parseInt(e.target.value) || 0)} required />
                </div>
              </div>

              <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
                {q.options.map((opt, optIdx) => (
                  <div key={optIdx} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    background: q.correctOption === optIdx ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    padding: '12px', borderRadius: '12px',
                    border: `1.5px solid ${q.correctOption === optIdx ? 'rgba(34, 197, 94, 0.4)' : 'var(--border)'}`,
                    transition: 'all 0.2s'
                  }}>
                    <input type="radio" name={`correct-${qIdx}`} checked={q.correctOption === optIdx}
                      onChange={() => updateQuestion(qIdx, 'correctOption', optIdx)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#22c55e' }} />
                    <span style={{ fontWeight: 700, color: q.correctOption === optIdx ? '#22c55e' : 'var(--text-secondary)', width: '20px' }}>
                      {String.fromCharCode(65 + optIdx)}.
                    </span>
                    <input type="text" className="input-field"
                      style={{ border: 'none', background: 'transparent', padding: '4px', marginBottom: 0 }}
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)}`}
                      value={opt} onChange={e => updateOption(qIdx, optIdx, e.target.value)} required />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Add Another Question (bottom button) */}
        <button
          type="button"
          onClick={addQuestion}
          className="btn btn-outline"
          disabled={!canAddQuestion}
          style={{
            width: '100%', padding: '16px', borderStyle: 'dashed', borderWidth: '2px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            opacity: !canAddQuestion ? 0.5 : 1, cursor: !canAddQuestion ? 'not-allowed' : 'pointer'
          }}
        >
          <Plus size={20} /> {canAddQuestion ? 'Add Another Question' : 'Maximum marks reached'}
        </button>
      </form>

      {/* ============================================================
          QUESTION BANK MODAL
      ============================================================ */}
      {showBankModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(5, 11, 20, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: '16px'
        }}>
          <div style={{
            background: 'var(--bg-dark-2)', borderRadius: '16px', border: '1px solid var(--border)', width: '100%',
            maxWidth: '900px', height: '88vh', display: 'flex', flexDirection: 'column',
            boxShadow: 'var(--shadow-lg)', overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px', borderBottom: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
              background: 'var(--orange-gradient)', color: 'white'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <BookOpen size={22} />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Question Bank</h2>
                </div>
                <p style={{ margin: 0, opacity: 0.85, fontSize: '0.875rem' }}>
                  Select questions to import into this exam
                </p>
              </div>
              <button
                onClick={() => { setShowBankModal(false); setSelectedBankIds(new Set()); }}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'white', display: 'flex' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div style={{ padding: '16px 28px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', background: 'rgba(0,0,0,0.1)' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '220px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search questions..."
                  className="input-field"
                  style={{ paddingLeft: '36px', height: '40px', fontSize: '0.875rem' }}
                  value={bankSearch}
                  onChange={e => setBankSearch(e.target.value)}
                />
              </div>
              <select
                className="input-field"
                style={{ height: '40px', fontSize: '0.875rem', minWidth: '180px', flex: 'none', background: 'var(--bg-card)' }}
                value={bankFilterTopic}
                onChange={e => setBankFilterTopic(e.target.value)}
              >
                {bankTopics.map(t => <option key={t} value={t} style={{ background: 'var(--bg-card)', color: 'white' }}>{t}</option>)}
              </select>
              {selectedBankIds.size > 0 && (
                <div style={{
                  background: 'var(--primary)', color: 'white', padding: '6px 14px',
                  borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  {selectedBankIds.size} selected
                </div>
              )}
            </div>

            {/* Question Cards Scrollable Area */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }} className="admin-main-content">
              {bankLoading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
                  <Skeleton type="card" count={6} />
                </div>
              ) : filteredBankQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                  <Search size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
                  <p>No questions match your search.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
                  {filteredBankQuestions.map(q => {
                    const isSelected = selectedBankIds.has(q._id);
                    const topic = q.exam?.topicName || q.topicName || 'General';
                    const subject = q.exam?.subjectName || q.subjectName || '';
                    return (
                      <div
                        key={q._id}
                        onClick={() => toggleSelectBank(q._id)}
                        style={{
                          border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          background: isSelected ? 'var(--primary-ultra)' : 'var(--bg-card)',
                          transition: 'all 0.2s',
                          boxShadow: isSelected ? 'var(--shadow-orange)' : 'none',
                          position: 'relative'
                        }}
                      >
                        {/* Checkbox + Meta */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {subject && (
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '2px 8px', borderRadius: '10px' }}>
                                {subject}
                              </span>
                            )}
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', padding: '2px 8px', borderRadius: '10px' }}>
                              {topic}
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '10px' }}>
                              {q.section}
                            </span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 700, background: 'rgba(255, 107, 0, 0.1)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '10px' }}>
                              {q.marks} mark{q.marks > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div style={{ color: isSelected ? 'var(--primary)' : 'var(--text-muted)', flexShrink: 0, marginLeft: '8px' }}>
                            {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
                          </div>
                        </div>

                        {/* Question Text */}
                        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '12px', lineHeight: '1.5' }}>
                          {q.text}
                        </p>

                        {/* Options */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                          {q.options.map((opt, i) => (
                            <div
                              key={i}
                              style={{
                                fontSize: '0.78rem',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                background: q.correctOption === i ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                                color: q.correctOption === i ? '#22c55e' : 'var(--text-secondary)',
                                fontWeight: q.correctOption === i ? 700 : 400,
                                border: `1px solid ${q.correctOption === i ? 'rgba(34, 197, 94, 0.3)' : 'var(--border)'}`,
                                display: 'flex', alignItems: 'center', gap: '6px'
                              }}
                            >
                              <span style={{ fontWeight: 800, opacity: 0.7 }}>{String.fromCharCode(65 + i)}.</span>
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 28px', borderTop: '1px solid var(--border)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: 'rgba(0,0,0,0.2)'
            }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                {filteredBankQuestions.length} question{filteredBankQuestions.length !== 1 ? 's' : ''} shown
                {selectedBankIds.size > 0 && (
                  <span style={{ marginLeft: '12px', color: 'var(--primary)', fontWeight: 700 }}>
                    · {selectedBankIds.size} selected
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => { setShowBankModal(false); setSelectedBankIds(new Set()); }}
                  className="btn btn-outline"
                  style={{ padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddFromBank}
                  className="btn btn-primary"
                  disabled={selectedBankIds.size === 0}
                  style={{
                    padding: '10px 24px',
                    opacity: selectedBankIds.size === 0 ? 0.5 : 1,
                    cursor: selectedBankIds.size === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Plus size={18} /> Add {selectedBankIds.size > 0 ? selectedBankIds.size : ''} Question{selectedBankIds.size !== 1 ? 's' : ''} to Exam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default CreateExam;
