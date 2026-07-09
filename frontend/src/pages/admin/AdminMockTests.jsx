import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Edit2, Trash2, Copy, ToggleLeft, ToggleRight, Loader, X, Lock, Unlock } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const EMPTY = { course:'', exam:'', testName:'', testNumber:1, totalQuestions:0, totalMarks:0, passingMarks:0, negativeMarking:0, duration:60, language:['English'], isFree:false, price:49, isActive:true };

export default function AdminMockTests() {
  const [mockTests, setMockTests] = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [exams,     setExams]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [search,    setSearch]    = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [mt, c, e] = await Promise.all([
        axios.get(`${API}/api/mock-tests`, cfg()),
        axios.get(`${API}/api/courses?active=false`, cfg()),
        axios.get(`${API}/api/exams`, cfg()),
      ]);
      setMockTests(mt.data); setCourses(c.data); setExams(e.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (mt) => { setForm({ ...mt, course: mt.course?._id || mt.course, exam: mt.exam?._id || mt.exam }); setEditId(mt._id); setModal(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editId) await axios.put(`${API}/api/mock-tests/${editId}`, form, cfg());
      else        await axios.post(`${API}/api/mock-tests`, form, cfg());
      setModal(false); fetchAll();
    } catch(e) { alert(e.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const remove    = async (id) => { if (!confirm('Delete this mock test?')) return; await axios.delete(`${API}/api/mock-tests/${id}`, cfg()); fetchAll(); };
  const duplicate = async (id) => { await axios.post(`${API}/api/mock-tests/${id}/duplicate`, {}, cfg()); fetchAll(); };
  const toggle    = async (mt) => { await axios.patch(`${API}/api/mock-tests/${mt._id}/toggle`, {}, cfg()); fetchAll(); };

  const filtered = mockTests.filter(mt => mt.testName?.toLowerCase().includes(search.toLowerCase()));

  const F = ({ label, k, type='text', opts=null }) => (
    <div>
      <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>{label}</label>
      {opts ? (
        <select value={form[k] || ''} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))}
          style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)' }}>
          <option value="">— Select —</option>
          {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
      ) : (
        <input type={type} value={form[k] ?? ''} onChange={e => setForm(p => ({ ...p, [k]: type==='number' ? +e.target.value : e.target.value }))}
          style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box' }} />
      )}
    </div>
  );

  return (
    <AdminLayout>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800, background:'var(--orange-gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Mock Tests</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{mockTests.length} mock tests total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Mock Test</button>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search mock tests..."
        style={{ width:'100%', padding:'12px 16px', borderRadius:10, border:'1px solid var(--border)', color:'var(--text-primary)', background:'rgba(255,255,255,0.03)', marginBottom:20, boxSizing:'border-box' }} />

      {loading ? <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}><Loader className="spin" size={32} /></div> : (
        <div className="glass" style={{ borderRadius:16, border:'1px solid var(--border)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                {['#', 'Test Name', 'Course', 'Qs / Marks', 'Duration', 'Type', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ padding:48, textAlign:'center', color:'var(--text-muted)' }}>No mock tests yet.</td></tr>
              ) : filtered.map(mt => (
                <tr key={mt._id} style={{ borderBottom:'1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <td style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.85rem' }}>{mt.testNumber}</td>
                  <td style={{ padding:'12px 16px', fontWeight:600, color:'var(--text-primary)' }}>{mt.testName}</td>
                  <td style={{ padding:'12px 16px', color:'var(--text-secondary)', fontSize:'0.85rem' }}>{mt.course?.title || '—'}</td>
                  <td style={{ padding:'12px 16px', color:'var(--text-secondary)', fontSize:'0.85rem' }}>{mt.totalQuestions} / {mt.totalMarks}</td>
                  <td style={{ padding:'12px 16px', color:'var(--text-secondary)', fontSize:'0.85rem' }}>{mt.duration} min</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:100, fontSize:'0.72rem', fontWeight:700,
                      background: mt.isFree ? 'rgba(34,197,94,0.1)' : 'rgba(255,107,0,0.1)',
                      color: mt.isFree ? '#22c55e' : '#ff6b00'
                    }}>{mt.isFree ? '⚡ Free' : `₹${mt.price}`}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:100, fontSize:'0.72rem', fontWeight:700,
                      background: mt.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                      color: mt.isActive ? '#22c55e' : '#64748b'
                    }}>{mt.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={() => toggle(mt)} title="Toggle" style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}>{mt.isActive ? <ToggleRight size={16} color="#22c55e" /> : <ToggleLeft size={16} />}</button>
                      <button onClick={() => duplicate(mt._id)} title="Duplicate" style={{ background:'none', border:'none', cursor:'pointer', color:'#a78bfa', padding:4 }}><Copy size={15} /></button>
                      <button onClick={() => openEdit(mt)} style={{ background:'none', border:'none', cursor:'pointer', color:'#60a5fa', padding:4 }}><Edit2 size={15} /></button>
                      <button onClick={() => remove(mt._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:4 }}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="glass" style={{ borderRadius:20, border:'1px solid var(--border)', padding:32, width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
            <button onClick={() => setModal(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-muted)', cursor:'pointer', padding:6 }}><X size={18} /></button>
            <h2 style={{ marginBottom:24, fontWeight:800, color:'var(--text-primary)' }}>{editId ? 'Edit' : 'Add'} Mock Test</h2>
            <div style={{ display:'grid', gap:14 }}>
              <F label="Test Name"  k="testName" />
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <F label="Course"   k="course"  opts={courses.map(c => ({ v: c._id, l: c.title }))} />
                <F label="Linked Exam" k="exam" opts={exams.map(e => ({ v: e._id, l: `${e.subjectName || ''} - ${e.topicName || ''}` }))} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12 }}>
                <F label="Test #"        k="testNumber"     type="number" />
                <F label="Total Qs"      k="totalQuestions" type="number" />
                <F label="Total Marks"   k="totalMarks"     type="number" />
                <F label="Passing Marks" k="passingMarks"   type="number" />
                <F label="Duration (min)"k="duration"       type="number" />
                <F label="Neg. Marking"  k="negativeMarking"type="number" />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <F label="Price (₹)"   k="price" type="number" />
                <div style={{ display:'flex', gap:16, alignItems:'center', paddingTop:20 }}>
                  <label style={{ display:'flex', gap:6, alignItems:'center', cursor:'pointer', color:'var(--text-secondary)', fontSize:'0.9rem' }}>
                    <input type="checkbox" checked={form.isFree} onChange={e => setForm(p => ({ ...p, isFree: e.target.checked }))} /> Free
                  </label>
                  <label style={{ display:'flex', gap:6, alignItems:'center', cursor:'pointer', color:'var(--text-secondary)', fontSize:'0.9rem' }}>
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} /> Active
                  </label>
                </div>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, marginTop:24 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex:1 }}>
                {saving ? <><Loader size={14} className="spin" /> Saving...</> : 'Save Mock Test'}
              </button>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
