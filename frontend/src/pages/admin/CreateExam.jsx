import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Check, Clock, Type, ListChecks, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateExam = () => {
  const [questions, setQuestions] = useState([]);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [examInfo, setExamInfo] = useState({ title: '', duration: 60 });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Dynamic Questions State
  const [newQuestions, setNewQuestions] = useState([
    { text: '', options: ['', '', '', ''], correctOption: 0, section: 'English', marks: 1 }
  ]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/questions', {
          headers: { Authorization: `Bearer ${JSON.parse(localStorage.getItem('admin')).token}` }
        });
        setQuestions(res.data);
      } catch (err) {
        console.error('Failed to fetch questions');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, []);

  const toggleQuestion = (id) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };

  // Dynamic Questions Handlers
  const addNewQuestionBlock = () => {
    setNewQuestions([...newQuestions, { text: '', options: ['', '', '', ''], correctOption: 0, section: 'English', marks: 1 }]);
  };

  const removeQuestionBlock = (index) => {
    setNewQuestions(newQuestions.filter((_, i) => i !== index));
  };

  const updateNewQuestion = (index, field, value) => {
    const updated = [...newQuestions];
    updated[index][field] = value;
    setNewQuestions(updated);
  };

  const updateNewQuestionOption = (qIndex, optIndex, value) => {
    const updated = [...newQuestions];
    updated[qIndex].options[optIndex] = value;
    setNewQuestions(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validNewQuestions = newQuestions.filter(q => q.text.trim() !== '');
    
    if (selectedQuestions.length === 0 && validNewQuestions.length === 0) {
      return alert('Please select from the bank or add at least one dynamic question.');
    }

    try {
      setIsSubmitting(true);
      const adminToken = JSON.parse(localStorage.getItem('admin')).token;

      // 1. Create dynamic questions concurrently
      const questionPromises = validNewQuestions.map(q => 
        axios.post('http://localhost:5000/api/questions', q, {
          headers: { Authorization: `Bearer ${adminToken}` }
        })
      );
      
      const createdResponses = await Promise.all(questionPromises);
      const dynamicQuestionIds = createdResponses.map(res => res.data._id);

      // 2. Create exam with all questions
      const payload = {
        ...examInfo,
        sections: ['English', 'Reasoning', 'Quant'], // Default for now
        questions: [...selectedQuestions, ...dynamicQuestionIds]
      };
      
      await axios.post('http://localhost:5000/api/exams', payload, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });
      
      alert('Exam created successfully!');
      navigate('/admin/dashboard');
    } catch (err) {
      alert('Failed to create exam');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px' }}>Create New Exam</h1>
        <p style={{ color: 'var(--text-muted)' }}>Configure exam settings and dynamically add new questions.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Top Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Type size={20} color="var(--primary)" /> Basic Information
            </h3>
            <div className="input-group">
              <label>Exam Title</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="e.g. RBI Assistant Pre Mock - 01" 
                required
                value={examInfo.title}
                onChange={e => setExamInfo({ ...examInfo, title: e.target.value })}
              />
            </div>
            <div className="input-group">
              <label>Duration (Minutes)</label>
              <div style={{ position: 'relative' }}>
                <Clock size={18} style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="number" 
                  className="input-field" 
                  placeholder="60" 
                  required
                  value={examInfo.duration}
                  onChange={e => setExamInfo({ ...examInfo, duration: parseInt(e.target.value) })}
                  min="1"
                />
              </div>
            </div>
          </div>

          <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary)' }}>
              {selectedQuestions.length + newQuestions.filter(q => q.text.trim() !== '').length}
            </div>
            <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Questions Built</div>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '16px', color: 'var(--text-muted)' }}>
              Combine questions from the dynamic builder and the existing bank.
            </p>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', marginTop: '24px' }}>
              {isSubmitting ? 'Publishing...' : 'Publish Exam'}
            </button>
          </div>
        </div>

        {/* Dynamic Questions Builder */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Dynamic Questions Builder</h3>
            <button 
              type="button" 
              onClick={addNewQuestionBlock} 
              className="btn" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary)', borderRadius: '8px', padding: '8px 16px', fontWeight: '600', cursor: 'pointer' }}
            >
              <Plus size={18} /> Add Question
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {newQuestions.map((q, qIndex) => (
              <div key={qIndex} className="glass" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h4 style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--primary)' }}>Question {qIndex + 1}</h4>
                  <button 
                    type="button" 
                    onClick={() => removeQuestionBlock(qIndex)} 
                    style={{ background: '#fef2f2', border: 'none', color: '#ef4444', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="input-group">
                  <label>Question Text</label>
                  <textarea 
                    className="input-field" 
                    rows="2" 
                    placeholder="Enter the question here..." 
                    value={q.text}
                    onChange={(e) => updateNewQuestion(qIndex, 'text', e.target.value)}
                    required
                  ></textarea>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {q.options.map((opt, optIndex) => (
                    <div className="input-group" key={optIndex} style={{ marginBottom: 0 }}>
                      <label>Option {String.fromCharCode(65 + optIndex)}</label>
                      <input 
                        type="text" 
                        className="input-field" 
                        placeholder={`Option ${String.fromCharCode(65 + optIndex)}`} 
                        value={opt}
                        onChange={(e) => updateNewQuestionOption(qIndex, optIndex, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Correct Answer</label>
                    <select 
                      className="input-field" 
                      value={q.correctOption}
                      onChange={(e) => updateNewQuestion(qIndex, 'correctOption', parseInt(e.target.value))}
                    >
                      {q.options.map((_, i) => (
                        <option key={i} value={i}>Option {String.fromCharCode(65 + i)}</option>
                      ))}
                    </select>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Section</label>
                    <select 
                      className="input-field" 
                      value={q.section}
                      onChange={(e) => updateNewQuestion(qIndex, 'section', e.target.value)}
                    >
                      <option value="English">English</option>
                      <option value="Reasoning">Reasoning</option>
                      <option value="Quant">Quant</option>
                    </select>
                  </div>

                  <div className="input-group" style={{ marginBottom: 0 }}>
                    <label>Marks</label>
                    <input 
                      type="number" 
                      className="input-field" 
                      value={q.marks}
                      onChange={(e) => updateNewQuestion(qIndex, 'marks', parseInt(e.target.value))}
                      min="1"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {newQuestions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '32px', border: '2px dashed var(--border-light)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)' }}>
                No dynamic questions currently added. Click "Add Question" to build one here.
              </div>
            )}
          </div>
        </div>

        {/* Existing Question Bank (Optional Addition) */}
        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListChecks size={20} color="var(--primary)" /> Append from Existing Question Bank
          </h3>
          {loading ? (
            <p>Loading question bank...</p>
          ) : questions.length === 0 ? (
            <p>No questions available in the bank. You can dynamically create them above instead.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {questions.map(q => (
                <div 
                  key={q._id}
                  onClick={() => toggleQuestion(q._id)}
                  style={{ 
                    padding: '16px 24px', 
                    borderRadius: '12px', 
                    border: '1.5px solid',
                    borderColor: selectedQuestions.includes(q._id) ? 'var(--primary)' : 'var(--border-light)',
                    background: selectedQuestions.includes(q._id) ? 'var(--primary-light)' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '4px' }}>{q.text}</div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{q.section} • {q.marks} Mark(s)</span>
                  </div>
                  {selectedQuestions.includes(q._id) && (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Check color="white" size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </AdminLayout>
  );
};

export default CreateExam;
