import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Edit2, Trash2, X, Loader, Calendar } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });
const EMPTY = { scheduleName:'', course:'', mockTest:'', startDate:'', endDate:'', startTime:'09:00', endTime:'18:00', timezone:'Asia/Kolkata', maxAttempts:1, mode:'practice', isActive:true };

export default function AdminSchedules() {
  const [schedules, setSchedules] = useState([]);
  const [courses,   setCourses]   = useState([]);
  const [mockTests, setMockTests] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [s, c, mt] = await Promise.all([
        axios.get(`${API}/api/schedules`, cfg()),
        axios.get(`${API}/api/courses?active=false`, cfg()),
        axios.get(`${API}/api/mock-tests`, cfg()),
      ]);
      setSchedules(s.data); setCourses(c.data); setMockTests(mt.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (s) => { setForm({ ...s, course: s.course?._id || s.course || '', mockTest: s.mockTest?._id || s.mockTest || '', startDate: s.startDate?.slice(0,10) || '', endDate: s.endDate?.slice(0,10) || '' }); setEditId(s._id); setModal(true); };
  const save = async () => {
    setSaving(true);
    try {
      if (editId) await axios.put(`${API}/api/schedules/${editId}`, form, cfg());
      else        await axios.post(`${API}/api/schedules`, form, cfg());
      setModal(false); fetchAll();
    } catch(e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };
  const remove = async (id) => { if (!confirm('Delete schedule?')) return; await axios.delete(`${API}/api/schedules/${id}`, cfg()); fetchAll(); };

  const modeColor = { practice: '#60a5fa', scheduled: '#f59e0b', live: '#ef4444' };

  return (
    <AdminLayout>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800, background:'var(--orange-gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Exam Schedules</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{schedules.length} schedules</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Schedule</button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:60 }}><Loader className="spin" size={32} color="var(--primary)" /></div> : (
        <div style={{ display:'grid', gap:12 }}>
          {schedules.length === 0 ? (
            <div className="glass" style={{ padding:48, textAlign:'center', borderRadius:16, border:'1px solid var(--border)', color:'var(--text-muted)' }}>
              <Calendar size={48} style={{ opacity:0.2, marginBottom:12 }} /><p>No schedules yet.</p>
            </div>
          ) : schedules.map(s => (
            <div key={s._id} className="glass" style={{ padding:'20px 24px', borderRadius:14, border:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
              <div>
                <div style={{ fontWeight:700, color:'var(--text-primary)', marginBottom:4 }}>{s.scheduleName}</div>
                <div style={{ fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                  {s.course?.title || '—'} / {s.mockTest?.testName || '—'}
                </div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:4 }}>
                  {new Date(s.startDate).toLocaleDateString()} → {new Date(s.endDate).toLocaleDateString()} | {s.startTime}–{s.endTime}
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ padding:'4px 12px', borderRadius:100, fontSize:'0.75rem', fontWeight:700, background:`${modeColor[s.mode]}22`, color:modeColor[s.mode] }}>{s.mode}</span>
                <button onClick={() => openEdit(s)} style={{ background:'none', border:'none', cursor:'pointer', color:'#60a5fa', padding:4 }}><Edit2 size={15} /></button>
                <button onClick={() => remove(s._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:4 }}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="glass" style={{ borderRadius:20, border:'1px solid var(--border)', padding:32, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
            <button onClick={() => setModal(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-muted)', cursor:'pointer', padding:6 }}><X size={18} /></button>
            <h2 style={{ marginBottom:24, fontWeight:800, color:'var(--text-primary)' }}>{editId ? 'Edit' : 'Add'} Schedule</h2>
            <div style={{ display:'grid', gap:14 }}>
              {[['scheduleName','Schedule Name']].map(([k,l]) => (
                <div key={k}><label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>{l}</label>
                  <input value={form[k]||''} onChange={e => setForm(p=>({...p,[k]:e.target.value}))} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box' }} /></div>
              ))}
              {[['course','Course', courses.map(c=>({v:c._id, l:c.title}))],['mockTest','Mock Test', mockTests.map(mt=>({v:mt._id, l:mt.testName}))]].map(([k,l,opts]) => (
                <div key={k}><label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>{l}</label>
                  <select value={form[k]||''} onChange={e => setForm(p=>({...p,[k]:e.target.value}))} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)' }}>
                    <option value="">— Select —</option>{opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>
              ))}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[['startDate','Start Date','date'],['endDate','End Date','date'],['startTime','Start Time','time'],['endTime','End Time','time']].map(([k,l,t]) => (
                  <div key={k}><label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>{l}</label>
                    <input type={t} value={form[k]||''} onChange={e => setForm(p=>({...p,[k]:e.target.value}))} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box' }} /></div>
                ))}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Mode</label>
                  <select value={form.mode} onChange={e => setForm(p=>({...p,mode:e.target.value}))} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)' }}>
                    <option value="practice">Practice</option><option value="scheduled">Scheduled</option><option value="live">Live</option></select></div>
                <div><label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Max Attempts</label>
                  <input type="number" value={form.maxAttempts} onChange={e => setForm(p=>({...p,maxAttempts:+e.target.value}))} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box' }} /></div>
              </div>
            </div>
            <div style={{ display:'flex', gap:12, marginTop:24 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex:1 }}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
