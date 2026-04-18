import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Check, Clock, Type, ListChecks } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CreateExam = () => {
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [filterSubject, setFilterSubject] = useState(null);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [examInfo, setExamInfo] = useState({ title: '', duration: 60 });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem('admin'))?.token;
        const [qsRes, examsRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/questions`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams`)
        ]);
        setQuestions(qsRes.data);
        setExams(examsRes.data);
      } catch (err) {
        console.error('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleQuestion = (id) => {
    setSelectedQuestions(prev => 
      prev.includes(id) ? prev.filter(qId => qId !== id) : [...prev, id]
    );
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedQuestions.length === 0) {
      return alert('Please select at least one question from the bank.');
    }

    try {
      setIsSubmitting(true);
      const adminToken = JSON.parse(localStorage.getItem('admin')).token;

      const payload = {
        ...examInfo,
        sections: ['English', 'Reasoning', 'Quant'], // Default for now
        questions: selectedQuestions
      };
      
      await axios.post(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/exams`, payload, {
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
        <p style={{ color: 'var(--text-muted)' }}>Configure exam settings and select questions from the bank.</p>
      </div>

      <form onSubmit={handleSubmit}>
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
              {selectedQuestions.length}
            </div>
            <div style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Total Questions Selected</div>
            <p style={{ textAlign: 'center', fontSize: '0.875rem', marginTop: '16px', color: 'var(--text-muted)' }}>
              Select questions from the bank below to include in this exam.
            </p>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting} style={{ width: '100%', marginTop: '24px' }}>
              {isSubmitting ? 'Publishing...' : 'Publish Exam'}
            </button>
          </div>
        </div>

        <div className="glass" style={{ padding: '32px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ListChecks size={20} color="var(--primary)" /> Select from Question Bank
          </h3>
          
          <div style={{ 
            marginBottom: '32px', 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px',
            borderBottom: '1px solid var(--border-light)',
            paddingBottom: '16px'
          }}>
             <button
               type="button"
               onClick={() => setFilterSubject(null)}
               style={{
                 padding: '10px 20px',
                 borderRadius: '8px',
                 border: 'none',
                 background: filterSubject === null ? 'var(--primary-light)' : 'transparent',
                 color: filterSubject === null ? 'var(--primary)' : 'var(--text-muted)',
                 cursor: 'pointer',
                 fontSize: '0.9rem',
                 fontWeight: 600,
                 transition: 'all 0.2s',
                 display: 'flex',
                 alignItems: 'center',
                 gap: '8px'
               }}
             >
               All Questions
               <span style={{ fontSize: '0.75rem', opacity: 0.7, background: filterSubject === null ? 'rgba(37, 99, 235, 0.1)' : '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                 {questions.length}
               </span>
             </button>
             {exams.map(e => {
               // Robust check: matches if q.exam is the ID string OR a populated object with ._id
               const count = questions.filter(q => {
                 const qExamId = q.exam?._id || q.exam;
                 return qExamId && qExamId.toString() === e._id.toString();
               }).length;
               
               return (
                 <button
                   key={e._id}
                   type="button"
                   onClick={() => setFilterSubject(e._id)}
                   style={{
                     padding: '10px 20px',
                     borderRadius: '8px',
                     border: 'none',
                     background: filterSubject === e._id ? 'var(--primary-light)' : 'transparent',
                     color: filterSubject === e._id ? 'var(--primary)' : 'var(--text-muted)',
                     cursor: 'pointer',
                     fontSize: '0.9rem',
                     fontWeight: 600,
                     transition: 'all 0.2s',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '8px'
                   }}
                 >
                   {e.title}
                   <span style={{ fontSize: '0.75rem', opacity: 0.7, background: filterSubject === e._id ? 'rgba(37, 99, 235, 0.1)' : '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>
                     {count}
                   </span>
                 </button>
               );
             })}
          </div>

          {loading ? (
            <p>Loading question bank...</p>
          ) : questions.filter(q => {
            if (!filterSubject) return true;
            const qExamId = q.exam?._id || q.exam;
            return qExamId && qExamId.toString() === filterSubject.toString();
          }).length === 0 ? (
            <p style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
              {filterSubject ? "No questions found for this subject." : "No questions available in the bank."}
            </p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
              {questions.filter(q => {
                if (!filterSubject) return true;
                const qExamId = q.exam?._id || q.exam;
                return qExamId && qExamId.toString() === filterSubject.toString();
              }).map(q => (
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
