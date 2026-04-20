import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Search, Filter, Edit, Trash2, ChevronRight, ChevronLeft, Briefcase } from 'lucide-react';

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [activeTopic, setActiveTopic] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    section: 'English',
    marks: 1,
    examId: ''
  });
  const [exams, setExams] = useState([]);

  const fetchQuestions = async () => {
    try {
      const questionsRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/questions`, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('admin')).token}` }
      });
      setQuestions(questionsRes.data);
      
      const examsRes = await axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams`);
      setExams(examsRes.data);
    } catch (err) {
      console.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleSaveQuestion = async (e) => {
    if(e) e.preventDefault();
    try {
      const adminToken = JSON.parse(localStorage.getItem('admin')).token;
      const config = { headers: { Authorization: `Bearer ${adminToken}` } };
      
      if (isEditing) {
        await axios.put(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/questions/${currentId}`, newQuestion, config);
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/questions`, newQuestion, config);
      }
      
      setShowModal(false);
      resetForm();
      fetchQuestions();
    } catch (err) {
      alert('Failed to save question');
    }
  };

  const resetForm = () => {
    setNewQuestion({ text: '', options: ['', '', '', ''], correctOption: 0, section: 'English', marks: 1, examId: '' });
    setIsEditing(false);
    setCurrentId(null);
  };

  const handleEditClick = (q) => {
    setNewQuestion({
      text: q.text,
      options: q.options,
      correctOption: q.correctOption,
      section: q.section,
      marks: q.marks,
      examId: q.exam?._id || ''
    });
    setIsEditing(true);
    setCurrentId(q._id);
    setShowModal(true);
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      const adminToken = JSON.parse(localStorage.getItem('admin')).token;
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/questions/${id}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      setQuestions(prev => prev.filter(q => q._id !== id));
    } catch (err) {
      alert('Failed to delete question');
    }
  };

  const handleDeleteTopic = async (topicName, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Delete ALL questions in "${topicName}"? This cannot be undone.`)) return;
    
    try {
      const adminToken = JSON.parse(localStorage.getItem('admin')).token;
      await axios.delete(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/questions/bulk/topic?topicName=${encodeURIComponent(topicName)}`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      fetchQuestions();
      if (activeTopic === topicName) setActiveTopic(null);
    } catch (err) {
      alert('Failed to delete topic questions');
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedQuestions = useMemo(() => {
    const groups = {};
    filteredQuestions.forEach(q => {
      const topic = q.exam?.topicName || 'General Question Bank';
      if (!groups[topic]) groups[topic] = [];
      groups[topic].push(q);
    });
    return groups;
  }, [filteredQuestions]);

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Question Bank</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage and organize all your exam questions here.</p>
        </div>
      </div>

      <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '32px', display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search questions or sections..." 
            className="input-field" 
            style={{ paddingLeft: '48px' }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>Loading questions...</div>
      ) : Object.keys(groupedQuestions).length === 0 ? (
        <div className="glass" style={{ padding: '40px', textAlign: 'center' }}>No questions found.</div>
      ) : !activeTopic ? (
        // Grid View
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {Object.entries(groupedQuestions).map(([topic, qs]) => (
            <div 
              key={topic} 
              className="glass animate-fade-in" 
              onClick={() => setActiveTopic(topic)}
              style={{ 
                padding: '28px', 
                borderRadius: 'var(--radius-lg)', 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                border: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: '200px',
                background: 'white',
                position: 'relative'
              }}
            >
              <button 
                onClick={(e) => handleDeleteTopic(topic, e)}
                style={{ 
                  position: 'absolute', 
                  top: '16px', 
                  right: '16px', 
                  color: '#ef4444', 
                  background: '#fef2f2', 
                  border: '1px solid #fee2e2', 
                  padding: '6px', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  zIndex: 2,
                  display: 'flex'
                }}
                title="Delete Whole Topic"
              >
                <Trash2 size={16} />
              </button>

              <div>
                <div style={{ padding: '10px', background: 'var(--primary-light)', borderRadius: '12px', display: 'inline-flex', marginBottom: '20px' }}>
                  <Briefcase size={22} color="var(--primary)" />
                </div>
                <h3 style={{ fontSize: '1.25rem', marginBottom: '8px', color: 'var(--text-primary)', fontWeight: 700 }}>{topic}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{qs[0]?.exam?.subjectName || 'Global Question Bank'}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', background: 'var(--primary-light)', padding: '6px 14px', borderRadius: '25px' }}>
                  {qs.length} Questions
                </span>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={20} color="var(--primary)" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Detailed Table View
        <div className="animate-fade-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <button 
              onClick={() => setActiveTopic(null)}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                background: 'none', 
                border: 'none', 
                color: 'var(--primary)', 
                fontWeight: 700, 
                cursor: 'pointer',
                fontSize: '0.95rem'
              }}
            >
              <ChevronLeft size={20} /> Back to Question Bank
            </button>
            <button 
              onClick={(e) => handleDeleteTopic(activeTopic, e)}
              className="btn btn-outline"
              style={{ color: '#ef4444', borderColor: '#fecaca', background: '#fef2f2' }}
            >
              <Trash2 size={18} /> Delete This Topic
            </button>
          </div>

          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'var(--primary-light)', borderRadius: '10px', display: 'flex' }}>
              <Filter size={18} color="var(--primary)" /> 
            </div>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{activeTopic}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', background: '#f1f5f9', padding: '4px 12px', borderRadius: '15px', marginLeft: '8px' }}>
              {groupedQuestions[activeTopic]?.length || 0} Questions
            </span>
          </h3>

          <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
                <tr style={{ textAlign: 'left' }}>
                  <th style={{ padding: '20px 16px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Question Text</th>
                  <th style={{ padding: '20px 16px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Section</th>
                  <th style={{ padding: '20px 16px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Marks</th>
                  <th style={{ padding: '20px 16px', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedQuestions[activeTopic]?.map(q => (
                  <tr key={q._id} style={{ borderBottom: '1px solid var(--border-light)' }} className="table-row-hover">
                    <td style={{ padding: '20px 16px', maxWidth: '600px' }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: '#334155' }}>{q.text}</div>
                    </td>
                    <td style={{ padding: '20px 16px' }}>
                      <span style={{ padding: '5px 14px', borderRadius: '25px', fontSize: '0.75rem', fontWeight: 700, background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
                        {q.section}
                      </span>
                    </td>
                    <td style={{ padding: '20px 16px', fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>{q.marks}</td>
                    <td style={{ padding: '20px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button 
                          onClick={() => handleEditClick(q)}
                          style={{ border: 'none', background: '#f8fafc', color: '#64748b', cursor: 'pointer', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex' }} 
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteQuestion(q._id)}
                          style={{ border: 'none', background: '#fef2f2', color: '#ef4444', cursor: 'pointer', padding: '8px', borderRadius: '8px', border: '1px solid #fee2e2', display: 'flex' }} 
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add/Edit Question Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ background: 'white', padding: '32px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '24px' }}>{isEditing ? 'Edit Question' : 'Add New Question'}</h2>
            <form onSubmit={handleSaveQuestion}>
              <div className="input-group">
                <label>Question Text</label>
                <textarea 
                  className="input-field" 
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  required
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                ></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className="input-group">
                  <label>Assign to Subject (Exam)</label>
                  <select className="input-field" value={newQuestion.examId} onChange={(e) => setNewQuestion({ ...newQuestion, examId: e.target.value })}>
                    <option value="">-- None (Bank Only) --</option>
                    {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.topicName} - {ex.subjectName}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Section</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="e.g. Reasoning"
                    value={newQuestion.section}
                    onChange={(e) => setNewQuestion({ ...newQuestion, section: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Marks</label>
                  <input type="number" className="input-field" value={newQuestion.marks} onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) })} />
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: 600 }}>Options</label>
                {newQuestion.options.map((opt, i) => (
                  <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '8px', alignItems: 'center' }}>
                    <input 
                      type="radio" 
                      name="correct" 
                      checked={newQuestion.correctOption === i} 
                      onChange={() => setNewQuestion({ ...newQuestion, correctOption: i })}
                    />
                    <input 
                      type="text" 
                      className="input-field" 
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      required
                      value={opt}
                      onChange={(e) => {
                        const next = [...newQuestion.options];
                        next[i] = e.target.value;
                        setNewQuestion({ ...newQuestion, options: next });
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => { setShowModal(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>{isEditing ? 'Update Question' : 'Save Question'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageQuestions;
