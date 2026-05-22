import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Plus, Search, Filter, Edit, Trash2,
  ChevronRight, ChevronLeft, Briefcase, BookOpen, X, CheckCircle2
} from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';
import { alertSuccess, alertError, alertWarning, confirmAction } from '../../utils/alert';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const newBlankQ = () => ({
  text: '',
  options: ['', '', '', ''],
  correctOption: 0,
  section: '',
  marks: 1,
});

const emptyEditQ = {
  text: '',
  options: ['', '', '', ''],
  correctOption: 0,
  section: '',
  marks: 1,
  subjectName: '',
  topicName: '',
};

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTopic, setActiveTopic] = useState(null);

  /* ── Add-many MODAL state (from main page) ── */
  const [showAddModal, setShowAddModal] = useState(false);
  const [bankSubject, setBankSubject] = useState('');
  const [bankTopic, setBankTopic] = useState('');
  const [localQs, setLocalQs] = useState([newBlankQ()]);
  const [saving, setSaving] = useState(false);

  /* ── INLINE add card state (inside detail view) ── */
  const [showInlineAdd, setShowInlineAdd] = useState(false);
  const [inlineQs, setInlineQs] = useState([newBlankQ()]);
  const [inlineSaving, setInlineSaving] = useState(false);

  /* ── Single-edit modal state ── */
  const [showEditModal, setShowEditModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editQ, setEditQ] = useState({ ...emptyEditQ });
  const [editSaving, setEditSaving] = useState(false);

  /* ─────────────────────────────────────────────── */

  const fetchQuestions = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('admin')).token;
      const res = await axios.get(`${API}/api/questions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestions(res.data);
    } catch {
      console.error('Failed to fetch questions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, []);

  /* ── Add-many MODAL helpers ── */
  const openAddModal = () => {
    setBankSubject('');
    setBankTopic('');
    setLocalQs([newBlankQ()]);
    setShowAddModal(true);
  };

  const addMoreQ = () => setLocalQs(prev => [...prev, newBlankQ()]);

  const removeQ = (idx) => {
    if (localQs.length === 1) return;
    setLocalQs(prev => prev.filter((_, i) => i !== idx));
  };

  const updateQ = (idx, field, value) => {
    setLocalQs(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updateOpt = (qIdx, optIdx, value) => {
    setLocalQs(prev => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[optIdx] = value;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    if (!bankSubject.trim()) return alertWarning('Validation Error', 'Please enter a Subject Name.');
    if (!bankTopic.trim()) return alertWarning('Validation Error', 'Please enter a Topic Name.');
    const invalid = localQs.some(
      q => !q.text.trim() || q.options.some(o => !o.trim()) || !q.section.trim()
    );
    if (invalid) return alertWarning('Validation Error', 'Please fill in all question texts, all 4 options, and sections.');
    setSaving(true);
    try {
      const token = JSON.parse(localStorage.getItem('admin')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await Promise.all(localQs.map(q =>
        axios.post(`${API}/api/questions`, {
          ...q, subjectName: bankSubject.trim(), topicName: bankTopic.trim(),
        }, config)
      ));
      setShowAddModal(false);
      fetchQuestions();
      alertSuccess('Saved!', 'Questions saved to bank successfully.');
    } catch {
      alertError('Failed to save questions.');
    } finally {
      setSaving(false);
    }
  };

  /* ── INLINE add helpers (inside detail view) ── */
  const openInlineAdd = () => {
    setInlineQs([newBlankQ()]);
    setShowInlineAdd(true);
    // scroll to bottom after short delay
    setTimeout(() => {
      document.getElementById('inline-add-anchor')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const addMoreInlineQ = () => setInlineQs(prev => [...prev, newBlankQ()]);

  const removeInlineQ = (idx) => {
    if (inlineQs.length === 1) { setShowInlineAdd(false); return; }
    setInlineQs(prev => prev.filter((_, i) => i !== idx));
  };

  const updateInlineQ = (idx, field, value) => {
    setInlineQs(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const updateInlineOpt = (qIdx, optIdx, value) => {
    setInlineQs(prev => {
      const next = [...prev];
      const opts = [...next[qIdx].options];
      opts[optIdx] = value;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  // Get subject/topic from the active topic's first question
  const activeTopicSubject = useMemo(() => {
    const qs = questions.filter(q =>
      (q.exam?.topicName || q.topicName || 'General Question Bank') === activeTopic
    );
    return {
      subjectName: qs[0]?.exam?.subjectName || qs[0]?.subjectName || '',
      topicName: qs[0]?.exam?.topicName || qs[0]?.topicName || activeTopic || '',
    };
  }, [questions, activeTopic]);

  const handleSaveInline = async (e) => {
    e.preventDefault();
    const invalid = inlineQs.some(
      q => !q.text.trim() || q.options.some(o => !o.trim()) || !q.section.trim()
    );
    if (invalid) return alertWarning('Validation Error', 'Please fill in all question texts, all 4 options, and sections.');
    setInlineSaving(true);
    try {
      const token = JSON.parse(localStorage.getItem('admin')).token;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await Promise.all(inlineQs.map(q =>
        axios.post(`${API}/api/questions`, {
          ...q,
          subjectName: activeTopicSubject.subjectName,
          topicName: activeTopicSubject.topicName,
        }, config)
      ));
      setShowInlineAdd(false);
      setInlineQs([newBlankQ()]);
      fetchQuestions();
      alertSuccess('Saved!', 'Questions saved successfully.');
    } catch {
      alertError('Failed to save questions.');
    } finally {
      setInlineSaving(false);
    }
  };

  /* ── Edit single question helpers ── */
  const openEditModal = (q) => {
    setEditId(q._id);
    setEditQ({
      text: q.text,
      options: [...q.options],
      correctOption: q.correctOption,
      section: q.section || '',
      marks: q.marks || 1,
      subjectName: q.subjectName || '',
      topicName: q.topicName || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateQ = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const token = JSON.parse(localStorage.getItem('admin')).token;
      await axios.put(`${API}/api/questions/${editId}`, editQ, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setShowEditModal(false);
      fetchQuestions();
      alertSuccess('Updated!', 'Question updated successfully.');
    } catch {
      alertError('Failed to update question.');
    } finally {
      setEditSaving(false);
    }
  };

  /* ── Delete helpers ── */
  const handleDeleteQuestion = async (id) => {
    const confirmed = await confirmAction('Delete Question?', 'Are you sure you want to delete this question?');
    if (!confirmed) return;
    try {
      const token = JSON.parse(localStorage.getItem('admin')).token;
      await axios.delete(`${API}/api/questions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuestions(prev => prev.filter(q => q._id !== id));
      alertSuccess('Deleted!', 'Question deleted successfully.');
    } catch {
      alertError('Failed to delete question');
    }
  };

  const handleDeleteTopic = async (topicKey, e) => {
    if (e) e.stopPropagation();
    const confirmed = await confirmAction(
      'Delete Topic?',
      `Are you sure you want to delete ALL questions in "${topicKey}"? This cannot be undone.`
    );
    if (!confirmed) return;
    try {
      const token = JSON.parse(localStorage.getItem('admin')).token;
      await axios.delete(
        `${API}/api/questions/bulk/topic?topicName=${encodeURIComponent(topicKey)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchQuestions();
      if (activeTopic === topicKey) { setActiveTopic(null); setShowInlineAdd(false); }
      alertSuccess('Deleted!', 'Topic deleted successfully.');
    } catch {
      alertError('Failed to delete topic questions');
    }
  };

  /* ── Derived data ── */
  const filteredQuestions = questions.filter(q =>
    q.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.section || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.subjectName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (q.topicName || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedQuestions = useMemo(() => {
    const groups = {};
    filteredQuestions.forEach(q => {
      const topic = q.exam?.topicName || q.topicName || 'General Question Bank';
      if (!groups[topic]) groups[topic] = [];
      groups[topic].push(q);
    });
    return groups;
  }, [filteredQuestions]);

  /* ════════════════════════════════════════════════════════ */
  return (
    <AdminLayout>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Question Bank</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage and organize all your exam questions here.</p>
        </div>
        <button
          id="add-question-bank-btn"
          onClick={openAddModal}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '0.95rem' }}
        >
          <Plus size={20} /> Add Question Bank
        </button>
      </div>

      {/* ── Search ── */}
      <div className="glass" style={{ padding: '20px 24px', borderRadius: 'var(--radius-lg)', marginBottom: '32px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search questions, sections, subjects or topics..."
            className="input-field"
            style={{ paddingLeft: '48px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          <Skeleton type="card" count={3} />
        </div>

      ) : Object.keys(groupedQuestions).length === 0 && !activeTopic ? (
        <div className="glass" style={{ padding: '60px 40px', textAlign: 'center', borderRadius: 'var(--radius-lg)' }}>
          <BookOpen size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px', color: 'var(--text-muted)' }}>No questions found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Start by adding your first set of questions.</p>
          <button onClick={openAddModal} className="btn btn-primary"><Plus size={18} /> Add Question Bank</button>
        </div>

      ) : !activeTopic ? (
        /* ── Topic Card Grid ── */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {Object.entries(groupedQuestions).map(([topic, qs]) => (
            <div
              key={topic}
              className="glass animate-fade-in"
              onClick={() => { setActiveTopic(topic); setShowInlineAdd(false); }}
              style={{
                padding: '28px', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                transition: 'all 0.3s ease', border: '1px solid var(--border-light)',
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                minHeight: '200px', background: 'white', position: 'relative',
              }}
            >
              <button
                onClick={e => handleDeleteTopic(topic, e)}
                style={{
                  position: 'absolute', top: '16px', right: '16px',
                  color: '#ef4444', background: '#fef2f2', border: '1px solid #fee2e2',
                  padding: '6px', borderRadius: '6px', cursor: 'pointer', zIndex: 2, display: 'flex'
                }}
                title="Delete Whole Topic"
              >
                <Trash2 size={16} />
              </button>
              <div>
                <div style={{ padding: '10px', background: 'var(--primary-light)', borderRadius: '12px', display: 'inline-flex', marginBottom: '20px' }}>
                  <Briefcase size={22} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 700 }}>{topic}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {qs[0]?.exam?.subjectName || qs[0]?.subjectName || 'General Question Bank'}
                </p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '6px 14px', borderRadius: '25px' }}>
                  {qs.length} {qs.length === 1 ? 'Question' : 'Questions'}
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={20} color="var(--primary)" />
                </div>
              </div>
            </div>
          ))}
        </div>

      ) : (
        /* ══════════════════════════════════════════════════
             DETAIL VIEW  (table + inline add cards)
        ══════════════════════════════════════════════════ */
        <div className="animate-fade-in">

          {/* Detail Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <button
              onClick={() => { setActiveTopic(null); setShowInlineAdd(false); setInlineQs([newBlankQ()]); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}
            >
              <ChevronLeft size={20} /> Back to Question Bank
            </button>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={openInlineAdd}
                className="btn btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Plus size={18} /> Add Question
              </button>
              <button
                onClick={e => handleDeleteTopic(activeTopic, e)}
                className="btn btn-outline"
                style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
              >
                <Trash2 size={18} /> Delete This Topic
              </button>
            </div>
          </div>

          {/* Topic Title */}
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--primary-light)', borderRadius: '10px', display: 'flex' }}>
              <Filter size={18} color="var(--primary)" />
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeTopic}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', background: '#f1f5f9', padding: '4px 12px', borderRadius: '15px', marginLeft: '8px' }}>
              {groupedQuestions[activeTopic]?.length || 0} Questions
            </span>
          </h3>

          {/* Existing Questions Table */}
          {groupedQuestions[activeTopic]?.length > 0 && (
            <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '24px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
                  <tr style={{ textAlign: 'left' }}>
                    <th style={{ padding: '18px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', width: '52px' }}>#</th>
                    <th style={{ padding: '18px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Question Text</th>
                    <th style={{ padding: '18px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Section</th>
                    <th style={{ padding: '18px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Marks</th>
                    <th style={{ padding: '18px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedQuestions[activeTopic]?.map((q, idx) => (
                    <tr key={q._id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                      <td style={{ padding: '16px', fontWeight: 800, color: 'var(--primary)', fontSize: '0.9rem' }}>
                        Q{idx + 1}
                      </td>
                      <td style={{ padding: '16px', maxWidth: '520px' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#334155', marginBottom: '6px' }}>{q.text}</div>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {q.options.map((opt, i) => (
                            <span key={i} style={{
                              fontSize: '0.72rem', padding: '2px 10px', borderRadius: '20px',
                              background: q.correctOption === i ? '#d1fae5' : '#f1f5f9',
                              color: q.correctOption === i ? '#065f46' : '#64748b',
                              fontWeight: q.correctOption === i ? 700 : 400,
                              border: q.correctOption === i ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
                            }}>
                              {String.fromCharCode(65 + i)}. {opt}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ padding: '5px 14px', borderRadius: '25px', fontSize: '0.75rem', fontWeight: 700, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                          {q.section}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 800, color: 'var(--primary)', fontSize: '1.05rem' }}>{q.marks}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                          <button onClick={() => openEditModal(q)}
                            style={{ border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex' }} title="Edit">
                            <Edit size={18} />
                          </button>
                          <button onClick={() => handleDeleteQuestion(q._id)}
                            style={{ border: '1px solid #fee2e2', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px', display: 'flex' }} title="Delete">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── INLINE ADD SECTION ── */}
          {showInlineAdd && (
            <div id="inline-add-anchor">
              {/* Section divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, var(--primary) 0%, transparent 100%)' }} />
                <span style={{
                  padding: '6px 18px', background: 'var(--primary)', color: 'white',
                  borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, whiteSpace: 'nowrap'
                }}>
                  + Adding {inlineQs.length} New Question{inlineQs.length > 1 ? 's' : ''} to "{activeTopic}"
                </span>
                <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent 0%, var(--primary) 100%)' }} />
              </div>

              <form onSubmit={handleSaveInline}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {inlineQs.map((q, qIdx) => {
                    const baseCount = groupedQuestions[activeTopic]?.length || 0;
                    return (
                      <div
                        key={qIdx}
                        style={{
                          border: '2px solid var(--primary)',
                          borderRadius: '14px',
                          overflow: 'hidden',
                          background: 'white',
                          boxShadow: '0 4px 20px rgba(25,118,210,0.10)',
                        }}
                      >
                        {/* Card header */}
                        <div style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '12px 20px',
                          background: 'linear-gradient(90deg, var(--primary-light) 0%, #e0f2fe 100%)',
                          borderBottom: '1px solid #bfdbfe',
                        }}>
                          <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                            Q{baseCount + qIdx + 1}
                            <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#64748b', marginLeft: '8px' }}>New</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeInlineQ(qIdx)}
                            style={{
                              background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444',
                              padding: '4px 12px', borderRadius: '6px', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600
                            }}
                          >
                            <X size={14} /> {inlineQs.length > 1 ? 'Remove' : 'Cancel'}
                          </button>
                        </div>

                        <div style={{ padding: '20px' }}>
                          {/* Question Text */}
                          <div className="input-group">
                            <label style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                              Question Text <span style={{ color: '#ef4444' }}>*</span>
                            </label>
                            <textarea
                              className="input-field"
                              style={{ minHeight: '88px', resize: 'vertical', lineHeight: '1.6' }}
                              placeholder="Type your question here..."
                              required
                              value={q.text}
                              onChange={e => updateInlineQ(qIdx, 'text', e.target.value)}
                            />
                          </div>

                          {/* Section & Marks */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px', gap: '16px', marginBottom: '18px' }}>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                                Section <span style={{ color: '#ef4444' }}>*</span>
                              </label>
                              <input
                                type="text" className="input-field"
                                placeholder="e.g. Reasoning, Maths, English..."
                                required
                                value={q.section}
                                onChange={e => updateInlineQ(qIdx, 'section', e.target.value)}
                              />
                            </div>
                            <div className="input-group" style={{ marginBottom: 0 }}>
                              <label style={{ fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>Marks</label>
                              <input
                                type="number" className="input-field" min="1"
                                value={q.marks}
                                onChange={e => updateInlineQ(qIdx, 'marks', parseInt(e.target.value) || 1)}
                              />
                            </div>
                          </div>

                          {/* Options 2×2 grid */}
                          <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                            Answer Options &nbsp;
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                              (click radio = correct answer)
                            </span>
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {q.options.map((opt, i) => (
                              <div
                                key={i}
                                onClick={() => updateInlineQ(qIdx, 'correctOption', i)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '10px',
                                  padding: '10px 14px', borderRadius: '10px', cursor: 'pointer',
                                  border: `2px solid ${q.correctOption === i ? '#6ee7b7' : '#e2e8f0'}`,
                                  background: q.correctOption === i ? '#f0fdf4' : '#f8fafc',
                                  transition: 'all 0.18s',
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`inline-correct-${qIdx}`}
                                  checked={q.correctOption === i}
                                  onChange={() => updateInlineQ(qIdx, 'correctOption', i)}
                                  onClick={e => e.stopPropagation()}
                                  style={{ width: '17px', height: '17px', accentColor: '#10b981', flexShrink: 0 }}
                                />
                                <span style={{ fontWeight: 800, fontSize: '0.875rem', flexShrink: 0, color: q.correctOption === i ? '#059669' : '#94a3b8' }}>
                                  {String.fromCharCode(65 + i)}.
                                </span>
                                <input
                                  type="text" className="input-field"
                                  style={{ border: 'none', background: 'transparent', padding: 0, marginBottom: 0, fontWeight: 500, fontSize: '0.9rem' }}
                                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                  required
                                  value={opt}
                                  onClick={e => e.stopPropagation()}
                                  onChange={e => updateInlineOpt(qIdx, i, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add another + Save row */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  {/* Add Q{n+1} button */}
                  <button
                    type="button"
                    onClick={addMoreInlineQ}
                    style={{
                      flex: 1, padding: '14px', border: '2px dashed var(--primary)',
                      borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)',
                      fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    }}
                  >
                    <Plus size={18} />
                    Add Q{(groupedQuestions[activeTopic]?.length || 0) + inlineQs.length + 1}
                  </button>

                  {/* Cancel */}
                  <button
                    type="button"
                    onClick={() => { setShowInlineAdd(false); setInlineQs([newBlankQ()]); }}
                    className="btn btn-outline"
                    style={{ padding: '14px 24px' }}
                  >
                    Cancel
                  </button>

                  {/* Save */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={inlineSaving}
                    style={{ padding: '14px 28px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: '200px', justifyContent: 'center' }}
                  >
                    {inlineSaving
                      ? 'Saving...'
                      : <><CheckCircle2 size={18} /> Save {inlineQs.length} Question{inlineQs.length > 1 ? 's' : ''}</>
                    }
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Empty topic state — show prompt to add */}
          {!groupedQuestions[activeTopic]?.length && !showInlineAdd && (
            <div style={{ padding: '48px', textAlign: 'center', background: '#f8fafc', borderRadius: '14px', border: '2px dashed #e2e8f0' }}>
              <BookOpen size={40} color="#94a3b8" style={{ marginBottom: '12px' }} />
              <p style={{ color: '#64748b', fontWeight: 600, marginBottom: '16px' }}>No questions in this topic yet.</p>
              <button onClick={openInlineAdd} className="btn btn-primary"><Plus size={18} /> Add First Question</button>
            </div>
          )}

        </div>
      )}

      {/* ══════════════════════════════════════════
          ADD QUESTION BANK MODAL (from main page)
      ══════════════════════════════════════════ */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
          zIndex: 1000, padding: '24px', overflowY: 'auto',
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', width: '100%', maxWidth: '760px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', overflow: 'hidden', marginBottom: '24px',
          }}>
            {/* Modal Header */}
            <div style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
              padding: '24px 28px', color: 'white',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <BookOpen size={22} />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>Add Question Bank</h2>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)}
                style={{ background: 'rgba(255,255,255,0.2)', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', color: 'white', display: 'flex' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveAll}>
              {/* Subject & Topic */}
              <div style={{ padding: '24px 28px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: 600, color: '#374151' }}>Subject Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="input-field" placeholder="e.g. Banking, Railway, SSC..."
                      required value={bankSubject} onChange={e => setBankSubject(e.target.value)} />
                  </div>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label style={{ fontWeight: 600, color: '#374151' }}>Topic Name <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="input-field" placeholder="e.g. Reasoning, Quantitative..."
                      required value={bankTopic} onChange={e => setBankTopic(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {localQs.map((q, qIdx) => (
                  <div key={qIdx} className="animate-fade-in" style={{ border: '1.5px solid var(--border-light)', borderRadius: '14px', overflow: 'hidden', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', background: 'linear-gradient(90deg, var(--primary-light) 0%, #e0f2fe 100%)', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>Q{qIdx + 1}</span>
                      {localQs.length > 1 && (
                        <button type="button" onClick={() => removeQ(qIdx)}
                          style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#ef4444', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                          <Trash2 size={14} /> Remove
                        </button>
                      )}
                    </div>

                    <div style={{ padding: '18px' }}>
                      <div className="input-group">
                        <label style={{ fontWeight: 600, color: '#374151' }}>Question Text <span style={{ color: '#ef4444' }}>*</span></label>
                        <textarea className="input-field" style={{ minHeight: '88px', resize: 'vertical', lineHeight: '1.6' }}
                          placeholder="Type your question here..." required
                          value={q.text} onChange={e => updateQ(qIdx, 'text', e.target.value)} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '16px', marginBottom: '16px' }}>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontWeight: 600, color: '#374151' }}>Section <span style={{ color: '#ef4444' }}>*</span></label>
                          <input type="text" className="input-field" placeholder="e.g. Reasoning, Maths, English..."
                            required value={q.section} onChange={e => updateQ(qIdx, 'section', e.target.value)} />
                        </div>
                        <div className="input-group" style={{ marginBottom: 0 }}>
                          <label style={{ fontWeight: 600, color: '#374151' }}>Marks</label>
                          <input type="number" className="input-field" min="1"
                            value={q.marks} onChange={e => updateQ(qIdx, 'marks', parseInt(e.target.value) || 1)} />
                        </div>
                      </div>

                      <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                        Answer Options &nbsp;<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(click radio = correct)</span>
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        {q.options.map((opt, i) => (
                          <div key={i} onClick={() => updateQ(qIdx, 'correctOption', i)} style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '10px 12px', borderRadius: '10px', cursor: 'pointer',
                            border: `1.5px solid ${q.correctOption === i ? '#bbf7d0' : '#e2e8f0'}`,
                            background: q.correctOption === i ? '#f0fdf4' : 'white', transition: 'all 0.18s'
                          }}>
                            <input type="radio" name={`correct-${qIdx}`} checked={q.correctOption === i}
                              onChange={() => updateQ(qIdx, 'correctOption', i)}
                              onClick={e => e.stopPropagation()}
                              style={{ width: '17px', height: '17px', accentColor: '#10b981', flexShrink: 0 }} />
                            <span style={{ fontWeight: 700, color: q.correctOption === i ? '#059669' : '#94a3b8', flexShrink: 0 }}>
                              {String.fromCharCode(65 + i)}.
                            </span>
                            <input type="text" className="input-field"
                              style={{ border: 'none', background: 'transparent', padding: 0, marginBottom: 0, fontWeight: 500, fontSize: '0.9rem' }}
                              placeholder={`Option ${String.fromCharCode(65 + i)}`} required value={opt}
                              onClick={e => e.stopPropagation()}
                              onChange={e => updateOpt(qIdx, i, e.target.value)} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addMoreQ} style={{
                  width: '100%', padding: '14px', border: '2px dashed var(--primary)',
                  borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)',
                  fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                }}>
                  <Plus size={20} /> Add Q{localQs.length + 1}
                </button>
              </div>

              <div style={{ padding: '16px 28px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '12px', background: '#f8fafc' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={saving}>
                  {saving ? 'Saving...' : `Save ${localQs.length} Question${localQs.length > 1 ? 's' : ''} to Bank`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          EDIT SINGLE QUESTION MODAL
      ══════════════════════════════════════════ */}
      {showEditModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px',
        }}>
          <div style={{
            background: 'white', padding: '32px', borderRadius: '16px',
            width: '100%', maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '4px' }}>Edit Question</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Update question details below.</p>
              </div>
              <button onClick={() => setShowEditModal(false)}
                style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '8px', cursor: 'pointer', display: 'flex', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateQ}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 600, color: '#374151' }}>Subject Name</label>
                  <input type="text" className="input-field" value={editQ.subjectName}
                    onChange={e => setEditQ({ ...editQ, subjectName: e.target.value })} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 600, color: '#374151' }}>Topic Name</label>
                  <input type="text" className="input-field" value={editQ.topicName}
                    onChange={e => setEditQ({ ...editQ, topicName: e.target.value })} />
                </div>
              </div>

              <div className="input-group">
                <label style={{ fontWeight: 600, color: '#374151' }}>Question Text <span style={{ color: '#ef4444' }}>*</span></label>
                <textarea className="input-field" style={{ minHeight: '100px', resize: 'vertical' }}
                  required value={editQ.text} onChange={e => setEditQ({ ...editQ, text: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '16px', marginBottom: '16px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 600, color: '#374151' }}>Section <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" className="input-field" required value={editQ.section}
                    onChange={e => setEditQ({ ...editQ, section: e.target.value })} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontWeight: 600, color: '#374151' }}>Marks</label>
                  <input type="number" className="input-field" min="1" value={editQ.marks}
                    onChange={e => setEditQ({ ...editQ, marks: parseInt(e.target.value) || 1 })} />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: 600, color: '#374151', fontSize: '0.875rem' }}>
                  Answer Options &nbsp;<span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(select correct)</span>
                </label>
                {editQ.options.map((opt, i) => (
                  <div key={i} style={{
                    display: 'flex', gap: '12px', marginBottom: '10px', alignItems: 'center',
                    background: editQ.correctOption === i ? '#f0fdf4' : '#f8fafc',
                    border: `1.5px solid ${editQ.correctOption === i ? '#bbf7d0' : '#e2e8f0'}`,
                    padding: '10px 14px', borderRadius: '10px', transition: 'all 0.2s',
                  }}>
                    <input type="radio" name="edit-correct" checked={editQ.correctOption === i}
                      onChange={() => setEditQ({ ...editQ, correctOption: i })}
                      style={{ width: '18px', height: '18px', accentColor: '#10b981' }} />
                    <span style={{ fontWeight: 700, color: editQ.correctOption === i ? '#059669' : '#94a3b8', width: '22px', flexShrink: 0 }}>
                      {String.fromCharCode(65 + i)}.
                    </span>
                    <input type="text" className="input-field"
                      style={{ border: 'none', background: 'transparent', padding: 0, marginBottom: 0, fontWeight: 500 }}
                      placeholder={`Option ${String.fromCharCode(65 + i)}`} required value={opt}
                      onChange={e => {
                        const next = [...editQ.options]; next[i] = e.target.value;
                        setEditQ({ ...editQ, options: next });
                      }} />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={editSaving}>
                  {editSaving ? 'Updating...' : '✓ Update Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </AdminLayout>
  );
};

export default ManageQuestions;
