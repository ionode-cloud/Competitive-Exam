import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Save, Loader, Globe, Mail, Phone, MapPin, AlignLeft, Info, HelpCircle, Link2, Plus, Trash2 } from 'lucide-react';
import { alertSuccess, alertError, confirmAction } from '../../utils/alert';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const DEFAULT_FOOTER = {
  logoText: 'ExamSphere',
  tagline: "India's smartest competitive exam preparation platform. Trusted by 50,000+ students across the nation.",
  email: 'support@examsphere.in',
  phone: '+91 98765 43210',
  address: 'Bhubaneswar, Odisha, India',
  platformLinks: [
    { label: 'Exam Login', path: '/' },
    { label: 'Home', path: '/home' },
    { label: 'About Us', path: '/about' },
    { label: 'Courses', path: '/services' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Contact', path: '/contact' },
  ],
  examLinks: [
    { label: 'Banking & Finance', path: '/services' },
    { label: 'SSC Exams', path: '/services' },
    { label: 'Railway (RRB)', path: '/services' },
    { label: 'UPSC Civil Services', path: '/services' },
    { label: 'Odisha State Exams', path: '/services' },
  ],
  resourceLinks: [
    { label: 'Free Mock Tests', path: '/dashboard' },
    { label: 'Current Affairs', path: '/services' },
    { label: 'Daily Quiz', path: '/dashboard' },
    { label: 'Leaderboard', path: '/dashboard' },
    { label: 'Results & Analysis', path: '/dashboard' },
  ],
  newsletterText: 'Get daily current affairs, exam tips & special offers.',
  newsletterPlaceholder: 'Enter your email',
  copyright: '© 2025 ExamSphere. All rights reserved. Made with ❤️ in India.',
  privacyPolicy: { label: 'Privacy Policy', path: '#' },
  termsOfService: { label: 'Terms of Service', path: '#' },
  refundPolicy: { label: 'Refund Policy', path: '#' },
  facebookUrl: 'https://facebook.com',
  instagramUrl: 'https://instagram.com',
  youtubeUrl: 'https://youtube.com',
  whatsappUrl: 'https://wa.me/919876543210'
};

export default function AdminFooter() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('brand');
  const [form, setForm] = useState(DEFAULT_FOOTER);

  const fetchFooterContent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/page-content/footer`);
      const d = res.data || {};
      setForm({
        logoText:              d.logoText              || DEFAULT_FOOTER.logoText,
        tagline:               d.tagline               || DEFAULT_FOOTER.tagline,
        email:                 d.email                 || DEFAULT_FOOTER.email,
        phone:                 d.phone                 || DEFAULT_FOOTER.phone,
        address:               d.address               || DEFAULT_FOOTER.address,
        platformLinks:         d.platformLinks         || DEFAULT_FOOTER.platformLinks,
        examLinks:             d.examLinks             || DEFAULT_FOOTER.examLinks,
        resourceLinks:         d.resourceLinks         || DEFAULT_FOOTER.resourceLinks,
        newsletterText:        d.newsletterText        || DEFAULT_FOOTER.newsletterText,
        newsletterPlaceholder: d.newsletterPlaceholder || DEFAULT_FOOTER.newsletterPlaceholder,
        copyright:             d.copyright             || DEFAULT_FOOTER.copyright,
        privacyPolicy:         d.privacyPolicy         || DEFAULT_FOOTER.privacyPolicy,
        termsOfService:        d.termsOfService        || DEFAULT_FOOTER.termsOfService,
        refundPolicy:          d.refundPolicy          || DEFAULT_FOOTER.refundPolicy,
        facebookUrl:           d.facebookUrl           || DEFAULT_FOOTER.facebookUrl,
        instagramUrl:          d.instagramUrl          || DEFAULT_FOOTER.instagramUrl,
        youtubeUrl:            d.youtubeUrl            || DEFAULT_FOOTER.youtubeUrl,
        whatsappUrl:           d.whatsappUrl           || DEFAULT_FOOTER.whatsappUrl,
      });
    } catch (err) {
      console.warn('Failed to load Footer content, using defaults.', err);
      setForm(DEFAULT_FOOTER);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFooterContent();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/page-content/footer`, { content: form }, cfg());
      alertSuccess('Saved!', 'Footer settings updated successfully.');
    } catch (err) {
      alertError('Save Error', 'Failed to save Footer settings.');
    } finally {
      setSaving(false);
    }
  };

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const setNestedField = (parentKey, childKey, value) => {
    setForm(prev => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  };

  const updateLink = (group, idx, field, value) => {
    setForm(prev => {
      const nextLinks = prev[group].map((lnk, i) => i === idx ? { ...lnk, [field]: value } : lnk);
      return { ...prev, [group]: nextLinks };
    });
  };

  const deleteLink = async (group, idx) => {
    const ok = await confirmAction('Remove Link', 'Are you sure you want to delete this link?');
    if (ok) {
      setForm(prev => ({
        ...prev,
        [group]: prev[group].filter((_, i) => i !== idx)
      }));
    }
  };

  const addLink = (group) => {
    setForm(prev => ({
      ...prev,
      [group]: [...prev[group], { label: 'New Link', path: '#' }]
    }));
  };

  const TABS = [
    { id: 'brand',     label: 'Brand & Address',  icon: AlignLeft },
    { id: 'platform',  label: 'Platform Links',   icon: Link2 },
    { id: 'exams',     label: 'Exam Categories',  icon: Globe },
    { id: 'resources', label: 'Resource Links',   icon: Info },
    { id: 'legal',     label: 'Newsletter & Legal',icon: HelpCircle },
  ];

  // Inline styling shortcuts
  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: 'var(--shadow-sm)' };
  const inputStyle = { width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' };
  const labelStyle = { display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Globe color="var(--primary)" /> Manage Footer Settings
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.88rem' }}>
            Modify the logo, contact details, link lists, newsletter descriptions, and legal footnotes in the public footer.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {saving ? <><Loader size={16} className="spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <Loader className="spin" size={36} color="var(--primary)" />
          <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Loading Footer settings…</p>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 24, padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid var(--border)' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600, transition: 'all 0.2s',
                  background: activeTab === tab.id ? 'var(--orange-gradient)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                  boxShadow: activeTab === tab.id ? '0 2px 12px rgba(255,107,0,0.3)' : 'none',
                }}
              >
                <tab.icon size={13} /> {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT: BRAND & ADDRESS */}
          {activeTab === 'brand' && (
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Brand Metadata &amp; Addresses</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
                <div>
                  <label style={labelStyle}>Logo Name</label>
                  <input type="text" value={form.logoText} onChange={e => setField('logoText', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Tagline / Description</label>
                  <textarea value={form.tagline} onChange={e => setField('tagline', e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={labelStyle}><Mail size={12} style={{ marginRight: 4 }} /> Support Email</label>
                    <input type="email" value={form.email} onChange={e => setField('email', e.target.value)} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}><Phone size={12} style={{ marginRight: 4 }} /> Support Phone</label>
                    <input type="text" value={form.phone} onChange={e => setField('phone', e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}><MapPin size={12} style={{ marginRight: 4 }} /> Address / Location</label>
                  <input type="text" value={form.address} onChange={e => setField('address', e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Copyright Footnote</label>
                  <input type="text" value={form.copyright} onChange={e => setField('copyright', e.target.value)} style={inputStyle} />
                </div>

                <div style={{ marginTop: 10, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)' }}>Social Media Links</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={labelStyle}>Facebook Link</label>
                      <input type="url" value={form.facebookUrl} onChange={e => setField('facebookUrl', e.target.value)} style={inputStyle} placeholder="https://facebook.com/examsphere" />
                    </div>
                    <div>
                      <label style={labelStyle}>Instagram Link</label>
                      <input type="url" value={form.instagramUrl} onChange={e => setField('instagramUrl', e.target.value)} style={inputStyle} placeholder="https://instagram.com/examsphere" />
                    </div>
                    <div>
                      <label style={labelStyle}>YouTube Link</label>
                      <input type="url" value={form.youtubeUrl} onChange={e => setField('youtubeUrl', e.target.value)} style={inputStyle} placeholder="https://youtube.com/examsphere" />
                    </div>
                    <div>
                      <label style={labelStyle}>WhatsApp Link / Number</label>
                      <input type="text" value={form.whatsappUrl} onChange={e => setField('whatsappUrl', e.target.value)} style={inputStyle} placeholder="https://wa.me/919876543210" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB CONTENT: PLATFORM LINKS */}
          {activeTab === 'platform' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Platform Group Links</h3>
                <button onClick={() => addLink('platformLinks')} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> Add Link
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {form.platformLinks?.map((lnk, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: 10, borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Link Label</label>
                      <input type="text" value={lnk.label} onChange={e => updateLink('platformLinks', idx, 'label', e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <label style={labelStyle}>Link Path</label>
                      <input type="text" value={lnk.path} onChange={e => updateLink('platformLinks', idx, 'path', e.target.value)} style={inputStyle} />
                    </div>
                    <button
                      onClick={() => deleteLink('platformLinks', idx)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', padding: '10px 14px', cursor: 'pointer', marginTop: 22 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: EXAM LINKS */}
          {activeTab === 'exams' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Exam Categories Group Links</h3>
                <button onClick={() => addLink('examLinks')} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> Add Link
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {form.examLinks?.map((lnk, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: 10, borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Link Label</label>
                      <input type="text" value={lnk.label} onChange={e => updateLink('examLinks', idx, 'label', e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <label style={labelStyle}>Link Path</label>
                      <input type="text" value={lnk.path} onChange={e => updateLink('examLinks', idx, 'path', e.target.value)} style={inputStyle} />
                    </div>
                    <button
                      onClick={() => deleteLink('examLinks', idx)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', padding: '10px 14px', cursor: 'pointer', marginTop: 22 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: RESOURCE LINKS */}
          {activeTab === 'resources' && (
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Resources Group Links</h3>
                <button onClick={() => addLink('resourceLinks')} className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} /> Add Link
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {form.resourceLinks?.map((lnk, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'center', background: 'rgba(255,255,255,0.01)', padding: 10, borderRadius: 10, border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                      <label style={labelStyle}>Link Label</label>
                      <input type="text" value={lnk.label} onChange={e => updateLink('resourceLinks', idx, 'label', e.target.value)} style={inputStyle} />
                    </div>
                    <div style={{ flex: 1.5 }}>
                      <label style={labelStyle}>Link Path</label>
                      <input type="text" value={lnk.path} onChange={e => updateLink('resourceLinks', idx, 'path', e.target.value)} style={inputStyle} />
                    </div>
                    <button
                      onClick={() => deleteLink('resourceLinks', idx)}
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#f87171', padding: '10px 14px', cursor: 'pointer', marginTop: 22 }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB CONTENT: NEWSLETTER & LEGAL */}
          {activeTab === 'legal' && (
            <div style={cardStyle}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>Newsletter &amp; Bottom Footnotes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
                <div>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.9rem', color: 'var(--primary)' }}>Newsletter Box</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={labelStyle}>Newsletter Text</label>
                      <input type="text" value={form.newsletterText} onChange={e => setField('newsletterText', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Input Placeholder</label>
                      <input type="text" value={form.newsletterPlaceholder} onChange={e => setField('newsletterPlaceholder', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: 10 }}>
                  <h4 style={{ margin: '0 0 12px', fontSize: '0.9rem', color: 'var(--primary)' }}>Legal Documents Footer Routes</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Privacy Policy */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div>
                        <label style={labelStyle}>Privacy Policy Label</label>
                        <input type="text" value={form.privacyPolicy?.label} onChange={e => setNestedField('privacyPolicy', 'label', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Privacy Policy Path</label>
                        <input type="text" value={form.privacyPolicy?.path} onChange={e => setNestedField('privacyPolicy', 'path', e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    {/* Terms of Service */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div>
                        <label style={labelStyle}>Terms of Service Label</label>
                        <input type="text" value={form.termsOfService?.label} onChange={e => setNestedField('termsOfService', 'label', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Terms of Service Path</label>
                        <input type="text" value={form.termsOfService?.path} onChange={e => setNestedField('termsOfService', 'path', e.target.value)} style={inputStyle} />
                      </div>
                    </div>

                    {/* Refund Policy */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, background: 'rgba(255,255,255,0.01)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                      <div>
                        <label style={labelStyle}>Refund Policy Label</label>
                        <input type="text" value={form.refundPolicy?.label} onChange={e => setNestedField('refundPolicy', 'label', e.target.value)} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Refund Policy Path</label>
                        <input type="text" value={form.refundPolicy?.path} onChange={e => setNestedField('refundPolicy', 'path', e.target.value)} style={inputStyle} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky save bar */}
          <div style={{ position: 'sticky', bottom: 24, display: 'flex', justifyContent: 'flex-end', pointerEvents: 'none' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 24px rgba(255,107,0,0.45)', pointerEvents: 'all' }}
            >
              {saving ? <><Loader size={16} className="spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
