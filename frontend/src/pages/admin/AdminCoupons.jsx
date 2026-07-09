import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Edit2, Trash2, X, Loader, Tag } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });
const EMPTY = { code:'', discount:20, discountType:'percent', maxUses:100, expiresAt:'', minAmount:0, isActive:true };

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [form,    setForm]    = useState(EMPTY);
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/api/coupons`, cfg()); setCoupons(r.data); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd  = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (c) => { setForm({ ...c, expiresAt: c.expiresAt?.slice(0,10)||'' }); setEditId(c._id); setModal(true); };
  const save = async () => {
    setSaving(true);
    try {
      if (editId) await axios.put(`${API}/api/coupons/${editId}`, form, cfg());
      else        await axios.post(`${API}/api/coupons`, form, cfg());
      setModal(false); fetchAll();
    } catch(e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };
  const remove = async (id) => { if (!confirm('Delete coupon?')) return; await axios.delete(`${API}/api/coupons/${id}`, cfg()); fetchAll(); };

  return (
    <AdminLayout>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800, background:'var(--orange-gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Coupons</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{coupons.length} coupons</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Coupon</button>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:60 }}><Loader className="spin" size={32} color="var(--primary)" /></div> : (
        <div className="glass" style={{ borderRadius:16, border:'1px solid var(--border)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                {['Code','Discount','Max Uses','Used','Expires','Status','Actions'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={7} style={{ padding:48, textAlign:'center', color:'var(--text-muted)' }}>No coupons yet.</td></tr>
              ) : coupons.map(c => {
                const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
                return (
                  <tr key={c._id} style={{ borderBottom:'1px solid var(--border)' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontFamily:'monospace', fontWeight:700, color:'var(--primary)', fontSize:'0.9rem', background:'rgba(255,107,0,0.08)', padding:'3px 10px', borderRadius:6 }}>{c.code}</span>
                    </td>
                    <td style={{ padding:'12px 16px', color:'#22c55e', fontWeight:700 }}>{c.discountType === 'percent' ? `${c.discount}%` : `₹${c.discount}`} off</td>
                    <td style={{ padding:'12px 16px', color:'var(--text-secondary)' }}>{c.maxUses}</td>
                    <td style={{ padding:'12px 16px', color:'var(--text-secondary)' }}>{c.usedCount}</td>
                    <td style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.8rem' }}>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '∞'}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ padding:'3px 10px', borderRadius:100, fontSize:'0.72rem', fontWeight:700,
                        background: !c.isActive || expired ? 'rgba(100,116,139,0.1)' : 'rgba(34,197,94,0.1)',
                        color: !c.isActive || expired ? '#64748b' : '#22c55e'
                      }}>{!c.isActive ? 'Disabled' : expired ? 'Expired' : 'Active'}</span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={() => openEdit(c)} style={{ background:'none', border:'none', cursor:'pointer', color:'#60a5fa', padding:4 }}><Edit2 size={15} /></button>
                        <button onClick={() => remove(c._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#ef4444', padding:4 }}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="glass" style={{ borderRadius:20, border:'1px solid var(--border)', padding:32, width:'100%', maxWidth:440, position:'relative' }}>
            <button onClick={() => setModal(false)} style={{ position:'absolute', top:16, right:16, background:'rgba(255,255,255,0.05)', border:'1px solid var(--border)', borderRadius:8, color:'var(--text-muted)', cursor:'pointer', padding:6 }}><X size={18} /></button>
            <h2 style={{ marginBottom:24, fontWeight:800, color:'var(--text-primary)' }}>{editId ? 'Edit' : 'Add'} Coupon</h2>
            <div style={{ display:'grid', gap:14 }}>
              {[['code','Coupon Code (auto uppercase)'],['minAmount','Min Order Amount (₹)']].map(([k,l]) => (
                <div key={k}><label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>{l}</label>
                  <input value={form[k]||''} onChange={e => setForm(p=>({...p,[k]:e.target.value.toUpperCase()}))} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box', letterSpacing:k==='code'?2:0 }} /></div>
              ))}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div><label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Discount</label>
                  <input type="number" value={form.discount} onChange={e => setForm(p=>({...p,discount:+e.target.value}))} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box' }} /></div>
                <div><label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Type</label>
                  <select value={form.discountType} onChange={e => setForm(p=>({...p,discountType:e.target.value}))} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)' }}>
                    <option value="percent">Percent (%)</option><option value="flat">Flat (₹)</option></select></div>
                <div><label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Max Uses</label>
                  <input type="number" value={form.maxUses} onChange={e => setForm(p=>({...p,maxUses:+e.target.value}))} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box' }} /></div>
                <div><label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Expires</label>
                  <input type="date" value={form.expiresAt||''} onChange={e => setForm(p=>({...p,expiresAt:e.target.value}))} style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box' }} /></div>
              </div>
              <label style={{ display:'flex', gap:6, alignItems:'center', cursor:'pointer', color:'var(--text-secondary)', fontSize:'0.9rem' }}>
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p=>({...p,isActive:e.target.checked}))} /> Active
              </label>
            </div>
            <div style={{ display:'flex', gap:12, marginTop:24 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex:1 }}>{saving ? 'Saving...' : 'Save Coupon'}</button>
              <button className="btn btn-outline" onClick={() => setModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
