import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Award, Loader, Search } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

export default function AdminCertificates() {
  const [certs,   setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [verify,  setVerify]  = useState('');
  const [verifyResult, setVerifyResult] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try { const r = await axios.get(`${API}/api/certificates`, cfg()); setCerts(r.data); }
    catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleVerify = async () => {
    try {
      const r = await axios.get(`${API}/api/certificates/verify/${verify}`);
      setVerifyResult(r.data);
    } catch(e) {
      setVerifyResult({ valid: false, message: 'Certificate not found' });
    }
  };

  const filtered = certs.filter(c =>
    !search || c.user?.name?.toLowerCase().includes(search.toLowerCase()) || c.certificateNumber?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:'1.8rem', fontWeight:800, background:'var(--orange-gradient)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Certificates</h1>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>{certs.length} certificates issued</p>
        </div>
      </div>

      {/* Verify */}
      <div className="glass" style={{ padding:20, borderRadius:14, border:'1px solid var(--border)', marginBottom:24, display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
        <input value={verify} onChange={e => setVerify(e.target.value)} placeholder="Enter certificate number to verify..."
          style={{ flex:1, minWidth:200, padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.04)', color:'var(--text-primary)' }} />
        <button className="btn btn-primary" onClick={handleVerify}><Search size={14} /> Verify</button>
        {verifyResult && (
          <div style={{ width:'100%', padding:12, borderRadius:10, background: verifyResult.valid ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border:`1px solid ${verifyResult.valid ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, color: verifyResult.valid ? '#22c55e' : '#ef4444', fontSize:'0.88rem' }}>
            {verifyResult.valid ? `✅ Valid — ${verifyResult.certificate?.user?.name} | ${verifyResult.certificate?.mockTest?.testName || 'General'} | ${verifyResult.certificate?.percentage}%` : '❌ ' + (verifyResult.message || 'Invalid')}
          </div>
        )}
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name or cert number..."
        style={{ width:'100%', padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'rgba(255,255,255,0.03)', color:'var(--text-primary)', marginBottom:20, boxSizing:'border-box' }} />

      {loading ? <div style={{ textAlign:'center', padding:60 }}><Loader className="spin" size={32} color="var(--primary)" /></div> : (
        <div className="glass" style={{ borderRadius:16, border:'1px solid var(--border)', overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr style={{ borderBottom:'1px solid var(--border)', background:'rgba(255,255,255,0.02)' }}>
                {['Certificate #','Student','Course / Test','Score','%','Issued On'].map(h => (
                  <th key={h} style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.75rem', textTransform:'uppercase', fontWeight:600, textAlign:'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? <tr><td colSpan={6} style={{ padding:48, textAlign:'center', color:'var(--text-muted)' }}>No certificates yet.</td></tr>
               : filtered.map(c => (
                <tr key={c._id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'12px 16px' }}><span style={{ fontFamily:'monospace', color:'var(--primary)', fontWeight:700, fontSize:'0.82rem' }}>{c.certificateNumber}</span></td>
                  <td style={{ padding:'12px 16px' }}>
                    <div style={{ fontWeight:600, color:'var(--text-primary)', fontSize:'0.88rem' }}>{c.user?.name || '—'}</div>
                    <div style={{ color:'var(--text-muted)', fontSize:'0.74rem' }}>{c.user?.email || ''}</div>
                  </td>
                  <td style={{ padding:'12px 16px', color:'var(--text-secondary)', fontSize:'0.85rem' }}>{c.course?.title || c.mockTest?.testName || '—'}</td>
                  <td style={{ padding:'12px 16px', fontWeight:700, color:'var(--text-primary)' }}>{c.score}/{c.totalMarks}</td>
                  <td style={{ padding:'12px 16px', fontWeight:700, color: c.percentage >= 80 ? '#22c55e' : c.percentage >= 60 ? '#f59e0b' : '#ef4444' }}>{c.percentage}%</td>
                  <td style={{ padding:'12px 16px', color:'var(--text-muted)', fontSize:'0.82rem' }}>{new Date(c.issuedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
