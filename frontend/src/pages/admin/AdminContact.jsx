import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Mail, Phone, MapPin, Clock, Save, Loader, Trash2,
  Image as ImageIcon, Link as LinkIcon, Globe,
  Edit2, Check, X
} from 'lucide-react';
import { alertSuccess, alertError, confirmAction } from '../../utils/alert';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const defaultSocials = [
  { label: 'Facebook',  handle: '@ExamSphereIN', url: 'https://facebook.com', color: '#3b82f6' },
  { label: 'Instagram', handle: '@ExamSphere',   url: 'https://instagram.com', color: '#ec4899' },
  { label: 'Twitter',   handle: '@ExamSphere',   url: 'https://twitter.com',  color: '#0ea5e9' },
];

export default function AdminContact() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  // Hero
  const [heroTitle,    setHeroTitle]    = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [heroImageMain, setHeroImageMain] = useState('');
  const [heroImgType,   setHeroImgType]   = useState('url'); // 'file' | 'url'

  // Contact Cards
  const [cards, setCards] = useState({
    email:        { value: 'support@examsphere.in', sub: 'Reply within 24 hours' },
    phone:        { value: '+91 98765 43210',        sub: 'Mon–Sat, 9AM–6PM IST' },
    address:      { value: 'Bhubaneswar, Odisha',   sub: 'STPI Tech Park, Phase 3' },
    workingHours: { value: '9AM – 6PM IST',         sub: 'Monday to Saturday' },
  });

  // Location
  const [mapLatitude,  setMapLatitude]  = useState('20.296059');
  const [mapLongitude, setMapLongitude] = useState('85.824539');

  // Socials
  const [socials, setSocials]           = useState(defaultSocials);
  const [editingSocIdx, setEditingSocIdx] = useState(null);
  const [editingSocVal, setEditingSocVal] = useState({});

  /* ── Fetch ── */
  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/page-content/contact`);
        const d = res.data || {};
        setHeroTitle(d.heroTitle || "We're Here to Help You");
        setHeroSubtitle(d.heroSubtitle || 'Have questions? Our support team is available Monday to Saturday, 9AM – 6PM IST.');
        setHeroImageMain(d.heroImageMain || '/contact_support.png');
        setCards({
          email:        { value: d.supportEmail   || 'support@examsphere.in', sub: d.emailSub        || 'Reply within 24 hours' },
          phone:        { value: d.supportPhone   || '+91 98765 43210',        sub: d.phoneSub        || 'Mon–Sat, 9AM–6PM IST' },
          address:      { value: d.supportAddress || 'Bhubaneswar, Odisha',   sub: d.addressSub      || 'STPI Tech Park, Phase 3' },
          workingHours: { value: d.supportHours   || '9AM – 6PM IST',         sub: d.workingHoursSub || 'Monday to Saturday' },
        });
        setMapLatitude(d.mapLatitude   || '20.296059');
        setMapLongitude(d.mapLongitude || '85.824539');
        setSocials(d.socials && d.socials.length > 0 ? d.socials : defaultSocials);
      } catch (err) {
        console.error('Failed to fetch contact content:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  /* ── Hero image file handler ── */
  const handleHeroFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alertError('File Too Large', 'Please select an image smaller than 5MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setHeroImageMain(reader.result);
    reader.readAsDataURL(file);
  };

  /* ── Cards helper ── */
  const setCard = (key, field, val) =>
    setCards(prev => ({ ...prev, [key]: { ...prev[key], [field]: val } }));

  /* ── Social helpers ── */
  const startEditSocial = (idx) => {
    setEditingSocIdx(idx);
    setEditingSocVal({ ...socials[idx] });
  };
  const saveEditSocial = () => {
    setSocials(prev => prev.map((s, i) => (i === editingSocIdx ? { ...editingSocVal } : s)));
    setEditingSocIdx(null);
  };
  const cancelEditSocial = () => setEditingSocIdx(null);
  const deleteSocial = async (idx) => {
    const ok = await confirmAction('Delete Social', `Remove "${socials[idx].label}" link?`);
    if (ok) setSocials(prev => prev.filter((_, i) => i !== idx));
  };

  /* ── Save ── */
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        heroTitle,
        heroSubtitle,
        heroImageMain,
        supportEmail:   cards.email.value,
        emailSub:       cards.email.sub,
        supportPhone:   cards.phone.value,
        phoneSub:       cards.phone.sub,
        supportAddress: cards.address.value,
        addressSub:     cards.address.sub,
        supportHours:   cards.workingHours.value,
        workingHoursSub: cards.workingHours.sub,
        mapLatitude,
        mapLongitude,
        socials,
      };
      await axios.put(`${API}/api/page-content/contact`, { content: payload }, cfg());
      alertSuccess('Success', 'Contact page content updated successfully!');
    } catch {
      alertError('Error', 'Failed to update Contact page content.');
    } finally {
      setSaving(false);
    }
  };

  /* ── Styles ── */
  const labelStyle = { fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '5px', fontWeight: 600 };
  const inputStyle = { width: '100%', padding: '9px 13px', borderRadius: 9, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '0.9rem' };
  const sectionCard = { padding: '24px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' };

  const cardDefs = [
    { key: 'email',        icon: Mail,    label: 'Email Us',       color: '#3b82f6', valuePlaceholder: 'support@example.com', subPlaceholder: 'Reply within 24 hours' },
    { key: 'phone',        icon: Phone,   label: 'Call Us',        color: '#10b981', valuePlaceholder: '+91 XXXXX XXXXX',     subPlaceholder: 'Mon–Sat, 9AM–6PM IST' },
    { key: 'address',      icon: MapPin,  label: 'Visit Us',       color: '#ff6b00', valuePlaceholder: 'City, State',          subPlaceholder: 'Office / landmark' },
    { key: 'workingHours', icon: Clock,   label: 'Working Hours',  color: '#8b5cf6', valuePlaceholder: '9AM – 6PM IST',        subPlaceholder: 'Monday to Saturday' },
  ];

  return (
    <AdminLayout>
      {/* Page header */}
      <div style={{ marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '6px', background: 'var(--orange-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Manage Contact Page
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Edit all contact details, social links, map location, and hero images shown on the public Contact page.
          </p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '11px 22px' }}>
          {saving ? <><Loader size={16} className="spin" /> Saving…</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><Loader className="spin" size={32} color="var(--primary)" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* ── Hero Content ── */}
          <div className="glass" style={sectionCard}>
            <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <Globe size={18} color="var(--primary)" /> Hero Content
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Hero Title</label>
                <input type="text" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Hero Subtitle</label>
                <textarea value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              {/* Hero Image */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
                <label style={labelStyle}>Hero Image (Support Visual)</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  {['url', 'file'].map(t => (
                    <button key={t} type="button" onClick={() => setHeroImgType(t)}
                      style={{ flex: 1, padding: '8px', borderRadius: '8px', border: `1px solid ${heroImgType === t ? 'var(--primary)' : 'var(--border)'}`, background: heroImgType === t ? 'var(--primary-ultra)' : 'transparent', color: heroImgType === t ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                      {t === 'file' ? <><ImageIcon size={13} /> Local File (Max 5MB)</> : <><LinkIcon size={13} /> Web Image URL</>}
                    </button>
                  ))}
                </div>
                {heroImgType === 'file' ? (
                  <input type="file" accept="image/*" onChange={handleHeroFileChange} style={inputStyle} />
                ) : (
                  <input type="url" value={heroImageMain} onChange={e => setHeroImageMain(e.target.value)} placeholder="https://example.com/image.png" style={inputStyle} />
                )}
                {heroImageMain && (
                  <div style={{ marginTop: '10px' }}>
                    <img src={heroImageMain} alt="Hero Preview" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Contact Cards ── */}
          <div className="glass" style={sectionCard}>
            <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <Mail size={18} color="var(--primary)" /> Contact Info Cards
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {cardDefs.map(({ key, icon: Icon, label, color, valuePlaceholder, subPlaceholder }) => (
                <div key={key} style={{ padding: '16px', borderRadius: '12px', border: `1px solid ${color}30`, background: `${color}08` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                      <Icon size={16} />
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{label}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <label style={labelStyle}>Main Value</label>
                      <input type="text" value={cards[key].value} onChange={e => setCard(key, 'value', e.target.value)} placeholder={valuePlaceholder} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Sub Text</label>
                      <input type="text" value={cards[key].sub} onChange={e => setCard(key, 'sub', e.target.value)} placeholder={subPlaceholder} style={inputStyle} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Live Location ── */}
          <div className="glass" style={sectionCard}>
            <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <MapPin size={18} color="var(--primary)" /> Live Location (Google Maps)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={labelStyle}>Latitude</label>
                <input type="text" value={mapLatitude} onChange={e => setMapLatitude(e.target.value)} placeholder="e.g. 20.296059" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Longitude</label>
                <input type="text" value={mapLongitude} onChange={e => setMapLongitude(e.target.value)} placeholder="e.g. 85.824539" style={inputStyle} />
              </div>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              💡 Find coordinates at <a href="https://maps.google.com" target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>maps.google.com</a> → right-click on the pin → copy the numbers.
            </p>
            {/* Live Map Preview */}
            {mapLatitude && mapLongitude && (
              <div style={{ borderRadius: '12px', overflow: 'hidden', height: '220px', border: '1px solid var(--border)', position: 'relative' }}>
                <iframe
                  src={`https://maps.google.com/maps?q=${mapLatitude},${mapLongitude}&z=15&output=embed`}
                  width="100%"
                  height="100%"
                  style={{ border: 0, display: 'block' }}
                  loading="lazy"
                  allowFullScreen
                  title="Location Preview"
                />
              </div>
            )}
          </div>

          {/* ── Social Links ── */}
          <div className="glass" style={sectionCard}>
            <h3 style={{ marginBottom: '20px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
              <Globe size={18} color="var(--primary)" /> Follow Us — Social Links
            </h3>

            {/* Existing socials list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {socials.map((s, idx) => (
                <div key={idx} style={{ padding: '12px 16px', borderRadius: '10px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                  {editingSocIdx === idx ? (
                    /* Inline edit form */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <div>
                          <label style={labelStyle}>Platform</label>
                          <input type="text" value={editingSocVal.label} onChange={e => setEditingSocVal(p => ({ ...p, label: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Handle</label>
                          <input type="text" value={editingSocVal.handle} onChange={e => setEditingSocVal(p => ({ ...p, handle: e.target.value }))} style={inputStyle} />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', alignItems: 'flex-end' }}>
                        <div>
                          <label style={labelStyle}>Profile URL</label>
                          <input type="url" value={editingSocVal.url} onChange={e => setEditingSocVal(p => ({ ...p, url: e.target.value }))} placeholder="https://..." style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Color</label>
                          <input type="color" value={editingSocVal.color} onChange={e => setEditingSocVal(p => ({ ...p, color: e.target.value }))} style={{ ...inputStyle, height: '40px', padding: '4px', cursor: 'pointer', width: '56px' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        <button onClick={saveEditSocial} style={{ padding: '7px 16px', borderRadius: '7px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.82rem' }}>
                          <Check size={14} /> Save
                        </button>
                        <button onClick={cancelEditSocial} style={{ padding: '7px 14px', borderRadius: '7px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.82rem' }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display row */
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.9rem' }}>{s.label}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <span>{s.handle}</span>
                          {s.url && <span style={{ color: 'var(--primary)' }}>↗ {s.url.replace(/^https?:\/\//, '')}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => startEditSocial(idx)} title="Edit" style={{ padding: '6px', borderRadius: '7px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => deleteSocial(idx)} title="Delete" style={{ padding: '6px', borderRadius: '7px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </AdminLayout>
  );
}
