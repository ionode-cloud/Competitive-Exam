import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Search, Filter, Edit, Trash2 } from 'lucide-react';

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
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

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/questions`, newQuestion, {
        headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('admin')).token}` }
      });
      setShowModal(false);
      setNewQuestion({ text: '', options: ['', '', '', ''], correctOption: 0, section: 'English', marks: 1, examId: '' });
      fetchQuestions();
    } catch (err) {
      alert('Failed to add question');
    }
  };

  const filteredQuestions = questions.filter(q => 
    q.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.section.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Question Bank</h1>
          <p style={{ color: 'var(--text-muted)' }}>Manage and organize all your exam questions here.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Add New Question
        </button>
      </div>

      <div className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: '24px', display: 'flex', gap: '16px' }}>
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
        <button className="btn btn-outline"><Filter size={18} /> Filter</button>
      </div>

      <div className="glass" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
            <tr style={{ textAlign: 'left' }}>
              <th style={{ padding: '16px', fontSize: '0.875rem' }}>Question Text</th>
              <th style={{ padding: '16px', fontSize: '0.875rem' }}>Subject (Exam)</th>
              <th style={{ padding: '16px', fontSize: '0.875rem' }}>Section</th>
              <th style={{ padding: '16px', fontSize: '0.875rem' }}>Marks</th>
              <th style={{ padding: '16px', fontSize: '0.875rem' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center' }}>Loading questions...</td></tr>
            ) : filteredQuestions.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '40px', textAlign: 'center' }}>No questions found.</td></tr>
            ) : filteredQuestions.map(q => (
              <tr key={q._id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '16px', maxWidth: '500px' }}>
                  <div style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text}</div>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--primary)' }}>
                    {q.exam ? q.exam.title : 'Unassigned'}
                  </span>
                </td>
                <td style={{ padding: '16px' }}>
                  <span style={{ padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, background: q.section === 'English' ? '#eef2ff' : q.section === 'Reasoning' ? '#f5f3ff' : '#f0fdf4', color: q.section === 'English' ? '#4338ca' : q.section === 'Reasoning' ? '#6d28d9' : '#15803d' }}>
                    {q.section}
                  </span>
                </td>
                <td style={{ padding: '16px', fontWeight: 600 }}>{q.marks}</td>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button style={{ border: 'none', background: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Edit size={18} /></button>
                    <button style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Question Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass" style={{ background: 'white', padding: '32px', borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginBottom: '24px' }}>Add New Question</h2>
            <form onSubmit={handleAddQuestion}>
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
                    {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.title}</option>)}
                  </select>
                </div>
                <div className="input-group">
                  <label>Section</label>
                  <select className="input-field" value={newQuestion.section} onChange={(e) => setNewQuestion({ ...newQuestion, section: e.target.value })}>
                    <option value="English">English</option>
                    <option value="Reasoning">Reasoning</option>
                    <option value="Quant">Quant</option>
                  </select>
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
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageQuestions;
