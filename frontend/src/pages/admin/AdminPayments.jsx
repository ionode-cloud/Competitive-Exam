import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { CreditCard, TrendingUp, DollarSign, Calendar, Loader } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [revenue,  setRevenue]  = useState({ total:0, today:0, month:0, year:0 });
  const [loading,  setLoading]  = useState(true);
  const [search,   setSearch]   = useState('');
  const [filter,   setFilter]   = useState('all'); // all | success | pending | failed

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        axios.get(`${API}/api/payments`, cfg()),
        axios.get(`${API}/api/payments/stats/revenue`, cfg()),
      ]);
      setPayments(p.data); setRevenue(r.data);
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = payments.filter(p => {
    const matchFilter = filter === 'all' || p.status === filter;
    const matchSearch = !search || p.userId?.name?.toLowerCase().includes(search.toLowerCase()) || p.userId?.email?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const exportCSV = () => {
    const rows = [['Date','User','Type','Amount','Status','Coupon']];
    filtered.forEach(p => rows.push([
      new Date(p.createdAt).toLocaleDateString(),
      p.userId?.email || '—',
      p.purchaseType || '—',
      `₹${(p.amount/100).toFixed(2)}`,
      p.status,
      p.couponCode || '—'
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = 'payments.csv'; a.click();
  };

  const RevCard = ({ label, value, icon: Icon, color }) => (
    <div className="glass" style={{ padding:'20px 24px', borderRadius:14, border:'1px solid var(--border)', display:'flex', gap:16, alignItems:'center' }}>
      <div style={{ width:48, height:48, borderRadius:12, background:color, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 6px 16px ${color}55` }}>
        <Icon size={22} color="white" />
      </div>
      <div>
        <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', fontWeight:600 }}>{label}</div>
        <div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--text-primary)' }}>₹{value.toLocaleString()}</div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800, background:'var(--orange-gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Payments</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{payments.length} total transactions</p>
        </div>
        <button className="btn btn-outline" onClick={exportCSV}>Export CSV</button>
      </div>

      {/* Revenue Cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:16, marginBottom:32 }}>
        <RevCard label="Total Revenue"    value={revenue.total}  icon={TrendingUp}  color="var(--primary)" />
        <RevCard label="Today's Revenue"  value={revenue.today}  icon={Calendar}    color="#22c55e" />
        <RevCard label="This Month"       value={revenue.month}  icon={CreditCard}  color="#a855f7" />
        <RevCard label="This Year"        value={revenue.year}   icon={DollarSign}  color="#0ea5e9" />
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by user..."
          style={{ flex:1, minWidth:200, padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)', color:'var(--text-primary)' }} />
        {['all','success','pending','failed'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ padding:'10px 16px', borderRadius:10, border:'1px solid', cursor:'pointer', fontWeight:600, fontSize:'0.82rem', textTransform:'capitalize',
              background: filter===f ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.03)',
              borderColor: filter===f ? 'var(--primary)' : 'var(--border)',
              color: filter===f ? 'var(--primary)' : 'var(--text-secondary)'
            }}>{f}</button>
        ))}
      </div>

      {loading ? <div style={{ textAlign:'center', padding:60 }}><Loader className="spin" size={32} color="var(--primary)" /></div> : (
        <div className="glass" style={{ borderRadius:16, border:'1px solid var(--border)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                {['Date','User','Purchase Type','Amount','Coupon','Status'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={6} style={{ padding:48, textAlign:'center', color:'var(--text-muted)' }}>No payments found.</td></tr>
               : filtered.map(p => (
                <tr key={p._id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.82rem' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'0.88rem' }}>{p.userId?.name || '—'}</div>
                    <div style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>{p.userId?.email || ''}</div>
                  </td>
                  <td style={{ padding:'12px 16px', color:'var(--text-secondary)', fontSize:'0.85rem', textTransform:'capitalize' }}>{p.purchaseType || '—'}</td>
                  <td style={{ padding:'12px 16px', fontWeight:700, color:'var(--text-primary)' }}>₹{(p.amount/100).toFixed(2)}</td>
                  <td style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.82rem' }}>{p.couponCode || '—'}</td>
                  <td style={{ padding:'12px 16px' }}>
                    <span style={{ padding:'3px 10px', borderRadius:100, fontSize:'0.72rem', fontWeight:700,
                      background: p.status==='success' ? 'rgba(34,197,94,0.1)' : p.status==='failed' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                      color: p.status==='success' ? '#22c55e' : p.status==='failed' ? '#ef4444' : '#f59e0b'
                    }}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
