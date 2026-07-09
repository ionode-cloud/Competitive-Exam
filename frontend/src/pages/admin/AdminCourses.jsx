import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { GraduationCap, Plus, Edit2, Trash2, Eye, EyeOff, X, Loader, BookOpen, Users, Star } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const EMPTY = { title:'', description:'', categoryName:'', difficulty:'Medium', duration:'', totalQuestions:0, price:0, offerPrice:0, freeTestsCount:2, languages:['English'], tags:'', isActive:true, rating:4.5, videoUrl:'', thumbnail:'', banner:'' };

export default function AdminCourses() {
  const [courses,    setCourses]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null); // null | 'add' | 'edit'
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [search,     setSearch]     = useState('');

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [c, cats] = await Promise.all([
        axios.get(`${API}/api/courses?active=false`, cfg()),
        axios.get(`${API}/api/categories`, cfg()),
      ]);
      setCourses(c.data); setCategories(cats.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal('course'); };
  const openEdit = (c) => {
    setForm({ ...c, tags: (c.tags||[]).join(', '), languages: c.languages || ['English'] });
    setEditId(c._id); setModal('course');
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] };
      if (editId) await axios.put(`${API}/api/courses/${editId}`, payload, cfg());
      else        await axios.post(`${API}/api/courses`, payload, cfg());
      setModal(null); fetchAll();
    } catch(e) { alert(e.response?.data?.message || 'Error saving'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!confirm('Delete this course and all its mock tests?')) return;
    await axios.delete(`${API}/api/courses/${id}`, cfg());
    fetchAll();
  };

  const toggle = async (c) => {
    await axios.put(`${API}/api/courses/${c._id}`, { isActive: !c.isActive }, cfg());
    fetchAll();
  };

  const filtered = courses.filter(c => c.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <AdminLayout>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800, background:'var(--orange-gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Courses</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{courses.length} courses total</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Course</button>
      </div>

      {/* Search */}
      <input
        className="glass" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search courses..."
        style={{ width:'100%', padding:'12px 16px', borderRadius:10, border:'1px solid var(--border)', color:'var(--text-primary)', background:'rgba(255,255,255,0.03)', marginBottom:20, boxSizing:'border-box' }}
      />

      {/* Table */}
      {loading ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}><Loader className="spin" size={32} /></div>
      ) : (
        <div className="glass" style={{ borderRadius:16, border:'1px solid var(--border)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                {['Course', 'Category', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={4} style={{ padding:'48px', textAlign:'center', color:'var(--text-muted)' }}>No courses yet. <button className="btn btn-primary btn-sm" onClick={openAdd}>Add one</button></td></tr>
              ) : filtered.map(c => (
                <tr key={c._id} style={{ borderBottom:'1px solid var(--border)', transition:'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ fontWeight:600, color:'var(--text-primary)', marginBottom:2 }}>{c.title}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{(c.description||'').slice(0,50)}...</div>
                  </td>
                  <td style={{ padding:'14px 16px', color:'var(--text-secondary)', fontSize:'0.85rem' }}>{c.categoryName || c.category?.name || '—'}</td>
                  <td style={{ padding:'14px 16px' }}>
                    <span style={{ padding:'4px 10px', borderRadius:100, fontSize:'0.72rem', fontWeight:700,
                      background: c.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                      color: c.isActive ? '#22c55e' : '#64748b'
                    }}>{c.isActive ? 'Active' : 'Hidden'}</span>
                  </td>
                  <td style={{ padding:'14px 16px' }}>
                    <div style={{ display:'flex', gap:8 }}>
                      <button onClick={() => toggle(c)} title={c.isActive ? 'Hide' : 'Show'} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:4 }}>{c.isActive ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                      <button onClick={() => openEdit(c)} style={{ background:'none', border:'none', cursor:'pointer', color:'#60a5fa', padding:4 }}><Edit2 size={16} /></button>
                      <button onClick={() => remove(c._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:4 }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal === 'course' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="glass" style={{ borderRadius:20, border:'1px solid var(--border)', padding:32, width:'100%', maxWidth:560, maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
            <button onClick={() => setModal(null)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-muted)', cursor:'pointer', padding:6 }}><X size={18} /></button>
            <h2 style={{ marginBottom:24, fontWeight:800, color:'var(--text-primary)' }}>{editId ? 'Edit Course' : 'Add Course'}</h2>
            <div style={{ display:'grid', gap:14 }}>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Course Name</label>
                <input type="text" value={form.title || ''} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Category</label>
                <select
                  value={form.category?._id || form.category || ''}
                  onChange={e => {
                    const catId = e.target.value;
                    const catObj = categories.find(cat => cat._id === catId);
                    setForm(p => ({
                      ...p,
                      category: catId || undefined,
                      categoryName: catObj ? catObj.name : ''
                    }));
                  }}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', cursor:'pointer', boxSizing:'border-box' }}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Promo Video Link (YouTube)</label>
                <input type="text" value={form.videoUrl || ''} onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Description</label>
                <textarea rows={3} value={form.description || ''} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', resize:'vertical', boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ display:'flex', gap:12, marginTop:24 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex:1 }}>
                {saving ? <><Loader size={14} className="spin" /> Saving...</> : 'Save Course'}
              </button>
              <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
