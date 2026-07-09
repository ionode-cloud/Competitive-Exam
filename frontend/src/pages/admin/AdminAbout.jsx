import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Target, Save, Loader, User, Image as ImageIcon, Link as LinkIcon, Plus, Trash2, Edit2, Check, X, Users, Heart } from 'lucide-react';
import { alertSuccess, alertError, confirmAction } from '../../utils/alert';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const defaultTeam = [
  { name: 'Arjun Mishra', role: 'Founder & CEO', color: '#ff6b00', desc: '10+ years in EdTech. Former SSC & Banking mentor.' },
  { name: 'Priya Rout', role: 'Head of Content', color: '#8b5cf6', desc: 'UPSC topper. Expert in content strategy and question design.' },
  { name: 'Rajesh Kumar', role: 'CTO', color: '#0ea5e9', desc: 'Full-stack engineer. Built the adaptive learning engine.' },
  { name: 'Sunita Panda', role: 'Lead Educator', color: '#10b981', desc: 'Odisha subject expert. 12+ years in competitive exam coaching.' },
];

const defaultValues = [
  { title: 'Student First', desc: 'Every decision we make is centered around student success and learning outcomes.' },
  { title: 'Trust & Integrity', desc: 'We deliver what we promise — accurate questions, fair tests, real results.' },
  { title: 'Continuous Growth', desc: 'Our platform evolves daily — new questions, updated patterns, better analytics.' },
  { title: 'Accessible to All', desc: 'Quality education should not be a privilege. We keep costs minimal and offer free tiers.' },
];

export default function AdminAbout() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [form, setForm] = useState({
    heroTitle: '',
    heroSubtitle: '',
    heroImageMain: '',
    missionTitle: '',
    missionDesc: '',
    visionTitle: '',
    visionDesc: '',
    founderName: '',
    founderTitle: '',
    founderMessage: '',
    founderImage: ''
  });

  const [teamMembers, setTeamMembers] = useState([]);
  const [valuesList, setValuesList] = useState([]);

  // Input source types
  const [heroImgType, setHeroImgType] = useState('url'); // 'file' or 'url'
  const [founderImgType, setFounderImgType] = useState('url'); // 'file' or 'url'
  const [memberImgType, setMemberImgType] = useState('url'); // 'file' or 'url' for adding new member

  // Add / Edit Member states
  const [editingMemberIdx, setEditingMemberIdx] = useState(null);
  const [editingMemberVal, setEditingMemberVal] = useState({});
  const [editMemberImgType, setEditMemberImgType] = useState('url');
  const [showAddForm, setShowAddForm] = useState(false);

  const [newMember, setNewMember] = useState({
    name: '',
    role: '',
    desc: '',
    image: '',
    color: '#ff6b00'
  });

  // Add / Edit Value states
  const [showAddValueForm, setShowAddValueForm] = useState(false);
  const [newValue, setNewValue] = useState({ title: '', desc: '' });
  const [editingValueIdx, setEditingValueIdx] = useState(null);
  const [editingValueVal, setEditingValueVal] = useState({});

  const fetchContent = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/page-content/about`);
      const d = res.data || {};
      setForm({
        heroTitle:     d.heroTitle     || "Empowering India's Aspirants to Succeed",
        heroSubtitle:  d.heroSubtitle  || "We're on a mission to make world-class competitive exam preparation accessible to every student in India — from metro cities to the smallest villages.",
        heroImageMain: d.heroImageMain || 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=60',
        missionTitle:  d.missionTitle  || 'Our Mission',
        missionDesc:   d.missionDesc   || 'To revolutionize competitive exam preparation in India by providing AI-powered, data-driven, and affordable learning tools that level the playing field for every aspirant — regardless of their background or location.',
        visionTitle:   d.visionTitle   || 'Our Vision',
        visionDesc:    d.visionDesc    || "A future where every deserving candidate in India gets their dream government job — where preparation quality isn't determined by coaching fees or geographical location, but by dedication and the right platform.",
        founderName:    d.founderName    || 'Arjun Mishra',
        founderTitle:   d.founderTitle   || 'Founder & CEO',
        founderMessage: d.founderMessage || 'We started ExamSphere with a simple belief: that quality guidance and practice are key to clearing any competitive exam, and they should be accessible to all regardless of financial status.',
        founderImage:   d.founderImage   || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&auto=format&fit=crop&q=70'
      });
      setTeamMembers(d.team && d.team.length > 0 ? d.team : defaultTeam);
      setValuesList(d.values && d.values.length > 0 ? d.values : defaultValues);
    } catch (err) {
      console.error('Failed to fetch about content:', err);
      setTeamMembers(defaultTeam);
      setValuesList(defaultValues);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleHeroImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alertError('File Too Large', 'Please select an image smaller than 5MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, heroImageMain: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleFounderImgChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alertError('File Too Large', 'Please select an image smaller than 5MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, founderImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleMemberImgChange = (e, isEdit = false) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alertError('File Too Large', 'Please select an image smaller than 5MB.');
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditingMemberVal(prev => ({ ...prev, image: reader.result }));
      } else {
        setNewMember(prev => ({ ...prev, image: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        team: teamMembers,
        values: valuesList
      };
      await axios.put(`${API}/api/page-content/about`, { content: payload }, cfg());
      alertSuccess('Success', 'About page configurations updated successfully!');
    } catch (err) {
      alertError('Error', 'Failed to update About page content.');
    } finally {
      setSaving(false);
    }
  };

  // Team Management Actions
  const handleAddMember = () => {
    if (!newMember.name.trim()) {
      alertError('Validation Error', 'Team member name is required.');
      return;
    }
    setTeamMembers(prev => [...prev, { ...newMember }]);
    setNewMember({ name: '', role: '', desc: '', image: '', color: '#ff6b00' });
    const fileInput = document.getElementById('member-file-input');
    if (fileInput) fileInput.value = '';
    alertSuccess('Member Added', 'Team member added to local list. Click Save Changes to apply.');
  };

  const handleDeleteMember = async (idx) => {
    const confirmed = await confirmAction('Delete Member', 'Remove this team member from the About page?');
    if (confirmed) {
      setTeamMembers(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const startEditMember = (idx) => {
    setEditingMemberIdx(idx);
    setEditingMemberVal({ ...teamMembers[idx] });
    setEditMemberImgType(teamMembers[idx].image && teamMembers[idx].image.startsWith('http') ? 'url' : 'file');
  };

  const saveEditMember = () => {
    if (!editingMemberVal.name.trim()) {
      alertError('Validation Error', 'Team member name is required.');
      return;
    }
    setTeamMembers(prev => prev.map((m, i) => i === editingMemberIdx ? { ...editingMemberVal } : m));
    setEditingMemberIdx(null);
    alertSuccess('Updated Member', 'Member details updated in local list.');
  };

  // Values Management Actions
  const handleAddValue = () => {
    if (!newValue.title.trim()) {
      alertError('Validation Error', 'Value title is required.');
      return;
    }
    setValuesList(prev => [...prev, { ...newValue }]);
    setNewValue({ title: '', desc: '' });
    alertSuccess('Value Added', 'Value added to local list. Click Save Changes to apply.');
  };

  const handleDeleteValue = async (idx) => {
    const confirmed = await confirmAction('Delete Value', 'Remove this value from the About page?');
    if (confirmed) {
      setValuesList(prev => prev.filter((_, i) => i !== idx));
    }
  };

  const startEditValue = (idx) => {
    setEditingValueIdx(idx);
    setEditingValueVal({ ...valuesList[idx] });
  };

  const saveEditValue = () => {
    if (!editingValueVal.title.trim()) {
      alertError('Validation Error', 'Value title is required.');
      return;
    }
    setValuesList(prev => prev.map((v, i) => i === editingValueIdx ? { ...editingValueVal } : v));
    setEditingValueIdx(null);
    alertSuccess('Updated Value', 'Value updated in local list.');
  };

  const labelStyle = { fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px', fontWeight: 600 };
  const inputStyle = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box' };
  const cardStyle = { padding: '32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' };

  return (
    <AdminLayout>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, marginBottom: '8px', background: 'var(--orange-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Manage About Page</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Edit mission statements, vision descriptions, banner images, and founder/team details shown on the public About page.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-primary" style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '12px 24px' }}>
          {saving ? <><Loader size={16} className="spin" /> Saving...</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px' }}><Loader className="spin" size={32} color="var(--primary)" /></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
          
          {/* Hero Content Card */}
          <div className="glass" style={cardStyle}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={20} color="var(--primary)" /> Hero & Mission Content
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Hero Title</label>
                <input type="text" value={form.heroTitle} onChange={e => setForm({ ...form, heroTitle: e.target.value })} style={inputStyle} />
              </div>

              <div>
                <label style={labelStyle}>Hero Subtitle</label>
                <textarea value={form.heroSubtitle} onChange={e => setForm({ ...form, heroSubtitle: e.target.value })} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Hero Banner Image */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                <label style={labelStyle}>Hero Banner Image</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <button type="button" onClick={() => setHeroImgType('url')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${heroImgType === 'url' ? 'var(--primary)' : 'var(--border)'}`, background: heroImgType === 'url' ? 'var(--primary-ultra)' : 'transparent', color: heroImgType === 'url' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <LinkIcon size={16} /> Web Image URL
                  </button>
                  <button type="button" onClick={() => setHeroImgType('file')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${heroImgType === 'file' ? 'var(--primary)' : 'var(--border)'}`, background: heroImgType === 'file' ? 'var(--primary-ultra)' : 'transparent', color: heroImgType === 'file' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <ImageIcon size={16} /> Local File (Max 5MB)
                  </button>
                </div>

                {heroImgType === 'url' ? (
                  <input type="url" value={form.heroImageMain} onChange={e => setForm({ ...form, heroImageMain: e.target.value })} placeholder="https://example.com/banner.jpg" style={inputStyle} />
                ) : (
                  <input type="file" accept="image/*" onChange={handleHeroImgChange} style={inputStyle} />
                )}

                {form.heroImageMain && (
                  <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={form.heroImageMain} alt="Banner Preview" style={{ width: '120px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Banner Image Preview</span>
                  </div>
                )}
              </div>

              {/* Mission & Vision grid */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', marginTop: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontWeight: 700 }}>Mission Section</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Mission Title</label>
                        <input type="text" value={form.missionTitle} onChange={e => setForm({ ...form, missionTitle: e.target.value })} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Mission Description</label>
                        <textarea value={form.missionDesc} onChange={e => setForm({ ...form, missionDesc: e.target.value })} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontWeight: 700 }}>Vision Section</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div>
                        <label style={labelStyle}>Vision Title</label>
                        <input type="text" value={form.visionTitle} onChange={e => setForm({ ...form, visionTitle: e.target.value })} style={inputStyle} />
                      </div>
                      <div>
                        <label style={labelStyle}>Vision Description</label>
                        <textarea value={form.visionDesc} onChange={e => setForm({ ...form, visionDesc: e.target.value })} rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Founder Section */}
          <div className="glass" style={cardStyle}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} color="var(--primary)" /> Founder Information
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={labelStyle}>Founder Name</label>
                  <input type="text" value={form.founderName} onChange={e => setForm({ ...form, founderName: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Founder Title / Role</label>
                  <input type="text" value={form.founderTitle} onChange={e => setForm({ ...form, founderTitle: e.target.value })} style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Founder Message</label>
                <textarea value={form.founderMessage} onChange={e => setForm({ ...form, founderMessage: e.target.value })} rows={4} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <label style={labelStyle}>Founder Image</label>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                  <button type="button" onClick={() => setFounderImgType('url')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${founderImgType === 'url' ? 'var(--primary)' : 'var(--border)'}`, background: founderImgType === 'url' ? 'var(--primary-ultra)' : 'transparent', color: founderImgType === 'url' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <LinkIcon size={16} /> Web Image URL
                  </button>
                  <button type="button" onClick={() => setFounderImgType('file')}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${founderImgType === 'file' ? 'var(--primary)' : 'var(--border)'}`, background: founderImgType === 'file' ? 'var(--primary-ultra)' : 'transparent', color: founderImgType === 'file' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <ImageIcon size={16} /> Local File (Max 5MB)
                  </button>
                </div>

                {founderImgType === 'url' ? (
                  <input type="url" value={form.founderImage} onChange={e => setForm({ ...form, founderImage: e.target.value })} placeholder="https://example.com/founder.jpg" style={inputStyle} />
                ) : (
                  <input type="file" accept="image/*" onChange={handleFounderImgChange} style={inputStyle} />
                )}

                {form.founderImage && (
                  <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={form.founderImage} alt="Founder Preview" style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Founder Image Preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Team Members Section */}
          <div className="glass" style={cardStyle}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={20} color="var(--primary)" /> Meet the People Behind ExamSphere
              </span>
              <button
                type="button"
                onClick={() => setShowAddForm(p => !p)}
                title={showAddForm ? 'Close form' : 'Add new member'}
                style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--primary)', background: showAddForm ? 'var(--primary)' : 'var(--primary-ultra)', color: showAddForm ? 'white' : 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
              >
                <Plus size={18} />
              </button>
            </h3>

            {/* List current members */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              {teamMembers.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No team members configured. Add members below.</p>
              ) : (
                teamMembers.map((member, idx) => (
                  <div key={idx} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    {editingMemberIdx === idx ? (
                      /* Inline Edit Form */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          <div>
                            <label style={labelStyle}>Name *</label>
                            <input type="text" value={editingMemberVal.name} onChange={e => setEditingMemberVal(p => ({ ...p, name: e.target.value }))} style={inputStyle} />
                          </div>
                          <div>
                            <label style={labelStyle}>Role *</label>
                            <input type="text" value={editingMemberVal.role} onChange={e => setEditingMemberVal(p => ({ ...p, role: e.target.value }))} style={inputStyle} />
                          </div>
                        </div>
                        <div>
                          <label style={labelStyle}>Description / Bio</label>
                          <input type="text" value={editingMemberVal.desc} onChange={e => setEditingMemberVal(p => ({ ...p, desc: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Member Image Source</label>
                          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                            <button type="button" onClick={() => setEditMemberImgType('url')}
                              style={{ flex: 1, padding: '6px', borderRadius: '6px', border: `1px solid ${editMemberImgType === 'url' ? 'var(--primary)' : 'var(--border)'}`, background: editMemberImgType === 'url' ? 'var(--primary-ultra)' : 'transparent', color: editMemberImgType === 'url' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                              URL
                            </button>
                            <button type="button" onClick={() => setEditMemberImgType('file')}
                              style={{ flex: 1, padding: '6px', borderRadius: '6px', border: `1px solid ${editMemberImgType === 'file' ? 'var(--primary)' : 'var(--border)'}`, background: editMemberImgType === 'file' ? 'var(--primary-ultra)' : 'transparent', color: editMemberImgType === 'file' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer' }}>
                              Local Image File
                            </button>
                          </div>
                          {editMemberImgType === 'url' ? (
                            <input type="url" value={editingMemberVal.image || ''} onChange={e => setEditingMemberVal(p => ({ ...p, image: e.target.value }))} placeholder="https://example.com/avatar.jpg" style={inputStyle} />
                          ) : (
                            <input type="file" accept="image/*" onChange={e => handleMemberImgChange(e, true)} style={inputStyle} />
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button onClick={saveEditMember} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                            <Check size={14} /> Update Member
                          </button>
                          <button onClick={() => setEditingMemberIdx(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Display Row */
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        {member.image ? (
                          <img src={member.image} alt={member.name} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                        ) : (
                          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: member.color || '#ff6b00', display: 'flex', alignItems: 'center', justifycontent: 'center', fontWeight: 800, color: 'white', fontSize: '0.9rem' }}>
                            {member.name.split(' ').map(n=>n[0]).join('')}
                          </div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{member.name}</h4>
                          <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>{member.role}</span>
                          <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{member.desc}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => startEditMember(idx)} title="Edit Member" style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteMember(idx)} title="Delete Member" style={{ padding: '8px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add New Member Form — toggled by + button */}
            {showAddForm && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontWeight: 700 }}>Add New Team Member</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={labelStyle}>Name *</label>
                      <input type="text" value={newMember.name} onChange={e => setNewMember({ ...newMember, name: e.target.value })} placeholder="e.g. Priyanth Sen" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Role *</label>
                      <input type="text" value={newMember.role} onChange={e => setNewMember({ ...newMember, role: e.target.value })} placeholder="e.g. Lead Math Mentor" style={inputStyle} />
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Bio / Short Description</label>
                    <input type="text" value={newMember.desc} onChange={e => setNewMember({ ...newMember, desc: e.target.value })} placeholder="Brief background of the team member..." style={inputStyle} />
                  </div>

                  <div>
                    <label style={labelStyle}>Member Image</label>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
                      <button type="button" onClick={() => setMemberImgType('url')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${memberImgType === 'url' ? 'var(--primary)' : 'var(--border)'}`, background: memberImgType === 'url' ? 'var(--primary-ultra)' : 'transparent', color: memberImgType === 'url' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <LinkIcon size={16} /> Web Image URL
                      </button>
                      <button type="button" onClick={() => setMemberImgType('file')}
                        style={{ flex: 1, padding: '10px', borderRadius: '8px', border: `1px solid ${memberImgType === 'file' ? 'var(--primary)' : 'var(--border)'}`, background: memberImgType === 'file' ? 'var(--primary-ultra)' : 'transparent', color: memberImgType === 'file' ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <ImageIcon size={16} /> Local File (Max 5MB)
                      </button>
                    </div>

                    {memberImgType === 'url' ? (
                      <input type="url" value={newMember.image} onChange={e => setNewMember({ ...newMember, image: e.target.value })} placeholder="https://example.com/avatar.jpg" style={inputStyle} />
                    ) : (
                      <input id="member-file-input" type="file" accept="image/*" onChange={e => handleMemberImgChange(e, false)} style={inputStyle} />
                    )}

                    {newMember.image && (
                      <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={newMember.image} alt="New Member Preview" style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avatar Preview</span>
                      </div>
                    )}
                  </div>

                  <button type="button" onClick={handleAddMember} className="btn btn-outline" style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--primary-ultra)', width: '100%', marginTop: '8px' }}>
                    <Plus size={16} /> Add Member to List
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* What We Stand For Section */}
          <div className="glass" style={cardStyle}>
            <h3 style={{ marginBottom: '24px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Heart size={20} color="var(--primary)" /> What We Stand For (Our Values)
              </span>
              <button
                type="button"
                onClick={() => setShowAddValueForm(p => !p)}
                title={showAddValueForm ? 'Close form' : 'Add new value'}
                style={{ width: '34px', height: '34px', borderRadius: '8px', border: '1px solid var(--primary)', background: showAddValueForm ? 'var(--primary)' : 'var(--primary-ultra)', color: showAddValueForm ? 'white' : 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
              >
                <Plus size={18} />
              </button>
            </h3>

            {/* List current values */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '400px', overflowY: 'auto', paddingRight: '8px' }}>
              {valuesList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No values configured. Add values below.</p>
              ) : (
                valuesList.map((val, idx) => (
                  <div key={idx} style={{ padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    {editingValueIdx === idx ? (
                      /* Inline Edit Form */
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                          <label style={labelStyle}>Value Title *</label>
                          <input type="text" value={editingValueVal.title} onChange={e => setEditingValueVal(p => ({ ...p, title: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                          <label style={labelStyle}>Value Description *</label>
                          <textarea value={editingValueVal.desc} onChange={e => setEditingValueVal(p => ({ ...p, desc: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                          <button onClick={saveEditValue} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                            <Check size={14} /> Update Value
                          </button>
                          <button onClick={() => setEditingValueIdx(null)} style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem' }}>
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* View Display Row */
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,107,0,0.1)', border: '1px solid rgba(255,107,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }}>
                          <Heart size={16} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{val.title}</h4>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{val.desc}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button onClick={() => startEditValue(idx)} title="Edit Value" style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex' }}>
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDeleteValue(idx)} title="Delete Value" style={{ padding: '8px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Add New Value Form — toggled by + button */}
            {showAddValueForm && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '16px', fontWeight: 700 }}>Add New Value</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={labelStyle}>Value Title *</label>
                    <input type="text" value={newValue.title} onChange={e => setNewValue({ ...newValue, title: e.target.value })} placeholder="e.g. Innovation First" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Value Description *</label>
                    <textarea value={newValue.desc} onChange={e => setNewValue({ ...newValue, desc: e.target.value })} placeholder="Explain what this value stands for..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                  </div>
                  <button type="button" onClick={handleAddValue} className="btn btn-outline" style={{ display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center', borderColor: 'var(--primary)', color: 'var(--primary)', background: 'var(--primary-ultra)', width: '100%', marginTop: '8px' }}>
                    <Plus size={16} /> Add Value to List
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </AdminLayout>
  );
}
