import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Edit2, Trash2, X, Loader, CheckCircle, BookOpen, Target } from 'lucide-react';
import { alertSuccess, alertError, confirmAction } from '../../utils/alert';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const EMPTY_SUB = { name: '', description: '', syllabusPoints: '', preparationStrategy: '', applicableExams: '' };

export default function AdminSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_SUB);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/subjects`);
      setSubjects(res.data);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSubjects(); }, []);

  const openAdd = () => {
    setForm(EMPTY_SUB);
    setEditId(null);
    setModal('subject');
  };

  const openEdit = (sub) => {
    setForm({
      name: sub.name || '',
      description: sub.description || '',
      syllabusPoints: (sub.syllabusPoints || []).join('\n'),
      preparationStrategy: sub.preparationStrategy || '',
      applicableExams: (sub.applicableExams || []).join('\n')
    });
    setEditId(sub._id);
    setModal('subject');
  };

  const save = async () => {
    if (!form.name.trim()) {
      alertError('Validation Error', 'Subject name is required.');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      syllabusPoints: form.syllabusPoints.split('\n').map(s => s.trim()).filter(Boolean),
      preparationStrategy: form.preparationStrategy.trim(),
      applicableExams: form.applicableExams.split('\n').map(s => s.trim()).filter(Boolean)
    };
    try {
      if (editId) {
        await axios.put(`${API}/api/subjects/${editId}`, payload, cfg());
        alertSuccess('Success', 'Subject updated successfully');
      } else {
        await axios.post(`${API}/api/subjects`, payload, cfg());
        alertSuccess('Success', 'Subject created successfully');
      }
      setModal(null);
      fetchSubjects();
    } catch (err) {
      alertError('Failed to Save', err.response?.data?.message || 'Error saving subject');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    const confirmed = await confirmAction('Delete Subject', 'Are you sure you want to delete this subject?', 'Yes, delete', 'Cancel');
    if (!confirmed) return;
    try {
      await axios.delete(`${API}/api/subjects/${id}`, cfg());
      alertSuccess('Success', 'Subject deleted successfully');
      fetchSubjects();
    } catch (err) {
      alertError('Delete Failed', 'Failed to delete subject.');
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px 16px', borderRadius: '10px',
    border: '1px solid var(--border)', background: 'rgba(255,255,255,0.05)',
    color: 'var(--text-primary)', outline: 'none', fontSize: '0.9rem'
  };
  const labelStyle = { fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' };

  return (
    <AdminLayout>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, background: 'var(--orange-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            Manage Subjects
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>Add syllabus coverage and preparation strategy for each exam subject.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> Add Subject
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader size={32} /></div>
      ) : subjects.length === 0 ? (
        <div className="glass" style={{ padding: '40px', borderRadius: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
          No subjects created yet. Click "Add Subject" to begin.
        </div>
      ) : (
        <div className="glass" style={{ overflow: 'hidden', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
              <tr style={{ textAlign: 'left' }}>
                <th style={{ padding: '20px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Subject Name</th>
                <th style={{ padding: '20px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Description</th>
                <th style={{ padding: '20px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Syllabus Coverage</th>
                <th style={{ padding: '20px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Preparation Strategy</th>
                <th style={{ padding: '20px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>Applicable Exams</th>
                <th style={{ padding: '20px 16px', fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.map(sub => (
                <tr key={sub._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                  <td style={{ padding: '16px', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', minWidth: '140px' }}>
                    {sub.name}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '200px' }}>
                    {sub.description ? (
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {sub.description}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not set</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '260px' }}>
                    {sub.syllabusPoints && sub.syllabusPoints.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {sub.syllabusPoints.slice(0, 4).map((pt, i) => (
                          <span key={i} style={{ padding: '2px 8px', background: 'rgba(255,107,0,0.08)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '100px', fontSize: '0.75rem', color: 'var(--primary)' }}>
                            {pt}
                          </span>
                        ))}
                        {sub.syllabusPoints.length > 4 && (
                          <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '100px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            +{sub.syllabusPoints.length - 4} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not set</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '260px' }}>
                    {sub.preparationStrategy
                      ? <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{sub.preparationStrategy}</span>
                      : <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not set</span>
                    }
                  </td>
                  <td style={{ padding: '16px', color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '200px' }}>
                    {sub.applicableExams && sub.applicableExams.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {sub.applicableExams.slice(0, 3).map((ex, i) => (
                          <span key={i} style={{ padding: '2px 8px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '100px', fontSize: '0.75rem', color: '#818cf8' }}>
                            {ex}
                          </span>
                        ))}
                        {sub.applicableExams.length > 3 && (
                          <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: '100px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            +{sub.applicableExams.length - 3} more
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Not set</span>
                    )}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => openEdit(sub)}
                        style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-glass-light)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-glass-light)'}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => remove(sub._id)}
                        style={{ padding: '8px', borderRadius: '8px', borderWidth: '1px', borderStyle: 'solid', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modal === 'subject' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100, padding: '20px' }}>
          <div className="glass" style={{ width: '100%', maxWidth: '560px', borderRadius: '20px', border: '1px solid var(--border)', padding: '32px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setModal(null)} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '28px', color: 'var(--text-primary)' }}>
              {editId ? 'Edit Subject' : 'Add New Subject'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', marginBottom: '28px' }}>
              {/* Subject Name */}
              <div>
                <label style={labelStyle}>Subject Name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Quantitative Aptitude"
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description / Paragraph</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief summary or introduction for this subject..."
                  rows={3}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '80px', lineHeight: '1.6' }}
                />
              </div>

              {/* Syllabus Coverage */}
              <div>
                <label style={labelStyle}>
                  <BookOpen size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                  Syllabus Coverage <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(one topic per line)</span>
                </label>
                <textarea
                  value={form.syllabusPoints}
                  onChange={e => setForm(p => ({ ...p, syllabusPoints: e.target.value }))}
                  placeholder={"Number System\nSimplification\nPercentage\nRatio & Proportion\nAverage"}
                  rows={6}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '130px', lineHeight: '1.6' }}
                />
              </div>

              {/* Preparation Strategy */}
              <div>
                <label style={labelStyle}>
                  <Target size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                  Preparation Strategy
                </label>
                <textarea
                  value={form.preparationStrategy}
                  onChange={e => setForm(p => ({ ...p, preparationStrategy: e.target.value }))}
                  placeholder="Describe the best approach to prepare for this subject..."
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '100px', lineHeight: '1.6' }}
                />
              </div>

              {/* Applicable Exams */}
              <div>
                <label style={labelStyle}>
                  <CheckCircle size={13} style={{ display: 'inline', marginRight: '5px', verticalAlign: 'middle' }} />
                  Applicable Exams <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(one exam per line)</span>
                </label>
                <textarea
                  value={form.applicableExams}
                  onChange={e => setForm(p => ({ ...p, applicableExams: e.target.value }))}
                  placeholder={"SSC CGL\nSSC CHSL\nRailways NTPC\nBank PO"}
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: '100px', lineHeight: '1.6' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setModal(null)}
                style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="btn btn-primary"
                style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}
              >
                {saving ? <Loader size={16} /> : <CheckCircle size={16} />} Save Subject
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
