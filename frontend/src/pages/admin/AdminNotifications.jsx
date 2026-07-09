import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Bell, Send, Loader, Megaphone } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const TYPE_OPTS = ['broadcast','new_course','new_mock_test','exam_scheduled','result_published','certificate_ready'];

export default function AdminNotifications() {
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [form,    setForm]    = useState({ title:'', message:'', type:'broadcast', link:'' });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/api/notifications`, cfg()); setNotifs(r.data); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleSend = async () => {
    if (!form.title || !form.message) return alert('Title and message required');
    setSending(true);
    try {
      await axios.post(`${API}/api/notifications`, form, cfg());
      setSent(true); setTimeout(() => setSent(false), 3000);
      setForm({ title:'', message:'', type:'broadcast', link:'' });
      fetchAll();
    } catch(e) { alert('Error sending'); }
    finally { setSending(false); }
  };

  const typeColor = {
    broadcast: '#60a5fa', new_course: '#22c55e', new_mock_test: '#a78bfa',
    exam_scheduled: '#f59e0b', result_published: '#ff6b00', certificate_ready: '#fbbf24'
  };

  return (
    <AdminLayout>
      <h1 style={{ fontSize:'1.8rem', fontWeight:800, background:'var(--orange-gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:28 }}>Notifications</h1>

      {/* Send Panel */}
      <div className="glass" style={{ padding:24, borderRadius:16, border:'1px solid var(--border)', marginBottom:32 }}>
        <h3 style={{ marginBottom:20, color:'var(--text-primary)', display:'flex', alignItems:'center', gap:8 }}><Megaphone size={18} color="var(--primary)" /> Send Broadcast Notification</h3>
        <div style={{ display:'grid', gap:12 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Title</label>
              <input value={form.title} onChange={e => setForm(p=>({...p,title:e.target.value}))} placeholder="Notification title"
                style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Type</label>
              <select value={form.type} onChange={e => setForm(p=>({...p,type:e.target.value}))}
                style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)' }}>
                {TYPE_OPTS.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Message</label>
            <textarea rows={3} value={form.message} onChange={e => setForm(p=>({...p,message:e.target.value}))} placeholder="Notification message..."
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', resize:'vertical', boxSizing:'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)', display:'block', marginBottom:4 }}>Link (optional)</label>
            <input value={form.link} onChange={e => setForm(p=>({...p,link:e.target.value}))} placeholder="/courses or /dashboard"
              style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)', boxSizing:'border-box' }} />
          </div>
          <button className="btn btn-primary" onClick={handleSend} disabled={sending} style={{ alignSelf:'flex-start', display:'flex', gap:8, alignItems:'center' }}>
            {sending ? <><Loader size={14} className="spin" /> Sending...</> : sent ? '✅ Sent!' : <><Send size={14} /> Send to All Students</>}
          </button>
        </div>
      </div>

      {/* History */}
      <h3 style={{ marginBottom:16, color:'var(--text-primary)' }}>Notification History ({notifs.length})</h3>
      {loading ? <div style={{ textAlign:'center', padding:40 }}><Loader className="spin" size={28} color="var(--primary)" /></div> : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {notifs.length === 0 ? <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No notifications sent yet.</div>
           : notifs.map(n => (
            <div key={n._id} className="glass" style={{ padding:'14px 18px', borderRadius:12, border:'1px solid var(--border)', display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ width:10, height:10, borderRadius:'50%', background: typeColor[n.type] || '#60a5fa', marginTop:5, flexShrink:0 }} />
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'0.9rem', marginBottom:2 }}>{n.title}</div>
                <div style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>{n.message}</div>
              </div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', whiteSpace:'nowrap', marginTop:2 }}>
                <span style={{ padding:'2px 8px', borderRadius:100, background:`${typeColor[n.type] || '#60a5fa'}22`, color: typeColor[n.type] || '#60a5fa', fontSize:'0.7rem', fontWeight:700 }}>
                  {n.type?.replace(/_/g,' ')}
                </span>
                <br />{new Date(n.createdAt).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
