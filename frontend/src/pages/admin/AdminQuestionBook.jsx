import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import { BookOpen, Plus, Edit2, Trash2, Eye, EyeOff, X, Loader, FileText, Save, Settings } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5117';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

const EMPTY = {
  title: '',
  description: '',
  subject: '',
  price: 0,
  offerPrice: 0,
  isFree: false,
  isActive: true,
  pdfData: ''
};

const EMPTY_SUBJECT = {
  name: '',
  description: ''
};

export default function AdminQuestionBook() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('books'); // 'books' | 'subjects' | 'settings'
  const [modal, setModal] = useState(null); // null | 'book'
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState('');
  const [fileDetails, setFileDetails] = useState('');

  // eBook Specific Subjects State
  const [dbSubjects, setDbSubjects] = useState([]);
  const [subjectForm, setSubjectForm] = useState(EMPTY_SUBJECT);
  const [editSubjectId, setEditSubjectId] = useState(null);
  const [savingSubject, setSavingSubject] = useState(false);

  // Watermark Settings State
  const [watermarkInput, setWatermarkInput] = useState('{name} ({email}) - EXAMSPHERE SECURE VIEW');
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/admin/question-books`, cfg());
      setBooks(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${API}/api/ebook-subjects`, cfg());
      setDbSubjects(res.data);
    } catch (e) {
      console.error('Failed to fetch eBook subjects:', e);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/api/page-content/ebook-settings`);
      if (res.data && res.data.content && res.data.content.watermarkText) {
        setWatermarkInput(res.data.content.watermarkText);
      }
    } catch (e) {
      console.warn('Ebook settings not seeded yet');
    }
  };

  useEffect(() => {
    fetchBooks();
    fetchSubjects();
    fetchSettings();
  }, []);

  const openAdd = () => {
    setForm({
      ...EMPTY,
      subject: dbSubjects[0]?.name || '' // Default to first dynamic subject
    });
    setEditId(null);
    setFileDetails('');
    setModal('book');
  };

  const openEdit = (b) => {
    setForm({
      title: b.title,
      description: b.description || '',
      subject: b.subject,
      price: b.price || 0,
      offerPrice: b.offerPrice || 0,
      isFree: b.isFree === true,
      isActive: b.isActive !== false,
      pdfData: '' // Clear pdfData so we don't send massive string unless they replace it
    });
    setEditId(b._id);
    setFileDetails(b.pdfData ? 'Keep existing PDF file' : 'No PDF file');
    setModal('book');
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Only PDF files are supported.');
      e.target.value = '';
      return;
    }

    const limit = 12 * 1024 * 1024; // 12MB
    if (file.size > limit) {
      alert('File is too large. Please select a PDF file smaller than 12MB.');
      e.target.value = '';
      return;
    }

    setFileDetails(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
    const reader = new FileReader();
    reader.onload = () => {
      setForm(prev => ({ ...prev, pdfData: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    if (!form.title.trim()) {
      alert('Please enter a title');
      return;
    }
    if (!form.subject) {
      alert('Please select a subject');
      return;
    }
    if (!editId && !form.pdfData) {
      alert('Please upload a PDF file');
      return;
    }

    setSaving(true);
    try {
      const payload = { ...form };
      if (editId) {
        // If updating and pdfData is empty, remove it from payload to avoid overriding with empty string
        if (!payload.pdfData) {
          delete payload.pdfData;
        }
        await axios.put(`${API}/api/admin/question-books/${editId}`, payload, cfg());
      } else {
        await axios.post(`${API}/api/admin/question-books`, payload, cfg());
      }
      setModal(null);
      fetchBooks();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving question book');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm('Are you sure you want to delete this question book? This action is permanent.')) return;
    try {
      await axios.delete(`${API}/api/admin/question-books/${id}`, cfg());
      fetchBooks();
    } catch (e) {
      alert(e.response?.data?.message || 'Error deleting item');
    }
  };

  const toggleActive = async (b) => {
    try {
      await axios.put(`${API}/api/admin/question-books/${b._id}`, { isActive: !b.isActive }, cfg());
      fetchBooks();
    } catch (e) {
      alert('Error updating status');
    }
  };

  /* ─── SUBJECTS CRUD OPERATIONS (FOR EBOOKS ONLY) ─── */
  const saveSubject = async () => {
    if (!subjectForm.name.trim()) {
      alert('Subject name is required');
      return;
    }
    setSavingSubject(true);
    const payload = {
      name: subjectForm.name.trim(),
      description: subjectForm.description.trim()
    };
    try {
      if (editSubjectId) {
        await axios.put(`${API}/api/ebook-subjects/${editSubjectId}`, payload, cfg());
      } else {
        await axios.post(`${API}/api/ebook-subjects`, payload, cfg());
      }
      setSubjectForm(EMPTY_SUBJECT);
      setEditSubjectId(null);
      fetchSubjects();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving subject');
    } finally {
      setSavingSubject(false);
    }
  };

  const removeSubject = async (id) => {
    if (!confirm('Are you sure you want to delete this subject? Books belonging to this subject name may lose their filter mappings.')) return;
    try {
      await axios.delete(`${API}/api/ebook-subjects/${id}`, cfg());
      fetchSubjects();
    } catch (e) {
      alert('Error deleting subject');
    }
  };

  const toggleShowOnHome = async (sub) => {
    try {
      const newValue = !sub.showOnHome;
      await axios.put(`${API}/api/ebook-subjects/${sub._id}`, { showOnHome: newValue }, cfg());
      fetchSubjects();
    } catch (e) {
      alert(e.response?.data?.message || 'Error updating home visibility');
    }
  };

  const startEditSubject = (sub) => {
    setSubjectForm({
      name: sub.name,
      description: sub.description || ''
    });
    setEditSubjectId(sub._id);
  };

  const cancelEditSubject = () => {
    setSubjectForm(EMPTY_SUBJECT);
    setEditSubjectId(null);
  };

  /* ─── WATERMARK SETTINGS ACTIONS ─── */
  const saveSettings = async () => {
    if (!watermarkInput.trim()) {
      alert('Watermark template text cannot be empty.');
      return;
    }
    setSavingSettings(true);
    try {
      await axios.put(`${API}/api/page-content/ebook-settings`, {
        content: { watermarkText: watermarkInput.trim() }
      }, cfg());
      alert('E-Book settings saved successfully!');
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const filtered = books.filter(b => 
    b.title.toLowerCase().includes(search.toLowerCase()) || 
    b.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Top Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, background: 'var(--orange-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Previous Year Question Portal
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Manage secure solved papers, e-book subjects, and watermarks for student catalog.
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid var(--border)', marginBottom: '28px', paddingBottom: '2px' }}>
        <button
          onClick={() => setActiveTab('books')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'books' ? '2px solid #ff6b00' : '2px solid transparent',
            color: activeTab === 'books' ? '#ff6b00' : 'var(--text-secondary)',
            padding: '8px 16px 12px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          E-Books Catalogue
        </button>
        <button
          onClick={() => setActiveTab('subjects')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'subjects' ? '2px solid #ff6b00' : '2px solid transparent',
            color: activeTab === 'subjects' ? '#ff6b00' : 'var(--text-secondary)',
            padding: '8px 16px 12px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          Manage E-Book Subjects
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '2px solid #ff6b00' : '2px solid transparent',
            color: activeTab === 'settings' ? '#ff6b00' : 'var(--text-secondary)',
            padding: '8px 16px 12px',
            fontSize: '0.95rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            outline: 'none'
          }}
        >
          Watermark Settings
        </button>
      </div>

      {/* TAB CONTENT 1: QUESTION BOOKS */}
      {activeTab === 'books' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Question Book</button>
          </div>

          {/* Search bar */}
          <input
            className="glass"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or subject..."
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              background: 'rgba(255,255,255,0.03)',
              marginBottom: 20,
              boxSizing: 'border-box'
            }}
          />

          {/* Data Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}><Loader className="spin" size={32} /></div>
          ) : (
            <div className="glass" style={{ borderRadius: 16, border: '1px solid var(--border)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
                    {['Title', 'Subject', 'Pricing', 'Status', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 600, textAlign: 'left' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No question books uploaded yet. <button className="btn btn-primary btn-sm" onClick={openAdd}>Upload First</button>
                      </td>
                    </tr>
                  ) : filtered.map(b => (
                    <tr key={b._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{b.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(b.description || '').slice(0, 60)}...</div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 6,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: 'rgba(255, 107, 0, 0.1)',
                          color: 'var(--primary)'
                        }}>
                          {b.subject}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {b.isFree ? (
                          <span style={{ color: '#22c55e', fontWeight: 700 }}>FREE</span>
                        ) : (
                          <span>₹{b.offerPrice} <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 4 }}>₹{b.price}</span></span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 100,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: b.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(100,116,139,0.1)',
                          color: b.isActive ? '#22c55e' : '#64748b'
                        }}>
                          {b.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => toggleActive(b)} title={b.isActive ? 'Hide' : 'Show'} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                            {b.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button onClick={() => openEdit(b)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', padding: 4 }}>
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => remove(b._id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
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
        </>
      )}

      {/* TAB CONTENT 2: MANAGE SUBJECTS (FOR E-BOOKS SPECIFICALLY) */}
      {activeTab === 'subjects' && (
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Left Form Box */}
          <div className="glass" style={{ background: 'rgba(255,255,255,0.02)', padding: '28px', borderRadius: '16px', border: '1px solid var(--border)', flex: '1 1 300px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '20px', color: '#ff6b00', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Settings size={18} /> {editSubjectId ? 'Edit E-Book Subject' : 'Add E-Book Subject'}
            </h3>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Subject Name *</label>
                <input type="text" value={subjectForm.name} onChange={e => setSubjectForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Computer Awareness"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '0.88rem' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>Description / Paragraph</label>
                <textarea rows={3} value={subjectForm.description} onChange={e => setSubjectForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide details about exam coverage..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', resize: 'vertical', boxSizing: 'border-box', fontSize: '0.88rem' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                {editSubjectId && (
                  <button className="btn btn-outline" onClick={cancelEditSubject} disabled={savingSubject}>Cancel</button>
                )}
                <button className="btn btn-primary" onClick={saveSubject} disabled={savingSubject} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {savingSubject ? <Loader size={14} className="spin" /> : editSubjectId ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </div>
          </div>

          {/* Right Subject Table List */}
          <div className="glass" style={{ borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden', flex: '1.5 1 400px', overflowX: 'auto' }}>
            <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.01)', borderBottom: '1px solid var(--border)' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Registered E-Book Subjects ({dbSubjects.length})</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)', textAlign: 'left', fontWeight: 600 }}>Name</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)', textAlign: 'left', fontWeight: 600 }}>Description</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>Show on Home</th>
                  <th style={{ padding: '12px 18px', color: 'var(--text-muted)', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dbSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>No E-Book subjects registered yet. Create one on the left.</td>
                  </tr>
                ) : dbSubjects.map(sub => (
                  <tr key={sub._id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 18px', fontWeight: 700, color: 'var(--text-primary)' }}>{sub.name}</td>
                    <td style={{ padding: '12px 18px', color: 'var(--text-secondary)' }}>{sub.description || '—'}</td>
                    <td style={{ padding: '12px 18px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={sub.showOnHome || false} 
                        onChange={() => toggleShowOnHome(sub)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => startEditSubject(sub)}
                          title="Edit Subject"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(96, 165, 250, 0.35)',
                            background: 'rgba(96, 165, 250, 0.1)',
                            color: '#60a5fa',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(96, 165, 250, 0.22)'; e.currentTarget.style.borderColor = '#60a5fa'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(96, 165, 250, 0.1)'; e.currentTarget.style.borderColor = 'rgba(96, 165, 250, 0.35)'; }}
                        >
                          <Edit2 size={13} /> Edit
                        </button>
                        <button
                          onClick={() => removeSubject(sub._id)}
                          title="Delete Subject"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '6px 14px',
                            borderRadius: 8,
                            border: '1px solid rgba(239, 68, 68, 0.35)',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)'; e.currentTarget.style.borderColor = '#ef4444'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'; }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: WATERMARK SETTINGS */}
      {activeTab === 'settings' && (
        <div className="glass" style={{ maxWidth: '600px', padding: '32px', borderRadius: '16px', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: '#ff6b00' }}>Customize Canvas Watermark</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: '1.4' }}>
            This text is burned directly into the PDF rendering canvases.
          </p>

          <div style={{ display: 'grid', gap: '18px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>Watermark Text</label>
              <textarea
                rows={3}
                value={watermarkInput}
                onChange={e => setWatermarkInput(e.target.value)}
                placeholder="e.g. EXAMSPHERE SECURE VIEW"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-primary)',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                  fontSize: '0.9rem',
                  lineHeight: '1.4'
                }}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={saveSettings}
              disabled={savingSettings}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem' }}
            >
              {savingSettings ? <Loader className="spin" size={16} /> : 'Save Watermark Configuration'}
            </button>
          </div>
        </div>
      )}

      {/* Upload/Edit EBook Modal */}
      {modal === 'book' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
          <div className="glass" style={{ borderRadius: 20, border: '1px solid var(--border)', padding: 32, width: '100%', maxWidth: 560, margin: 'auto', position: 'relative' }}>
            <button onClick={() => setModal(null)} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', padding: 6 }}>
              <X size={18} />
            </button>
            <h2 style={{ marginBottom: 24, fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <BookOpen size={22} color="var(--primary)" /> {editId ? 'Edit Question Book' : 'Add Question Book'}
            </h2>
            
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Book Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Odia Grammar PYQ 2018-2024"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Subject *</label>
                  <select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <option value="">-- Select Subject --</option>
                    {dbSubjects.map(sub => (
                      <option key={sub._id} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Free / Premium</label>
                  <select value={form.isFree ? 'free' : 'premium'} onChange={e => setForm(p => ({ ...p, isFree: e.target.value === 'free', price: e.target.value === 'free' ? 0 : p.price, offerPrice: e.target.value === 'free' ? 0 : p.offerPrice }))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', cursor: 'pointer', boxSizing: 'border-box' }}>
                    <option value="premium">Premium (Paid)</option>
                    <option value="free">Free Book</option>
                  </select>
                </div>
              </div>

              {!form.isFree && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Original Price (₹) *</label>
                    <input type="number" value={form.price} onChange={e => setForm(p => ({ ...p, price: parseFloat(e.target.value) || 0 }))} min={0}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Offer Price (₹) *</label>
                    <input type="number" value={form.offerPrice} onChange={e => setForm(p => ({ ...p, offerPrice: parseFloat(e.target.value) || 0 }))} min={0}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box' }} />
                  </div>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Provide details about the contents of this PYQ paper..."
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Upload PDF Document *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px dashed var(--border)', borderRadius: 10, padding: '16px 20px', cursor: 'pointer' }}>
                    <input type="file" accept=".pdf" onChange={handleFileChange} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <FileText size={20} color="var(--primary)" />
                      <span>{editId ? 'Choose a new PDF file to replace' : 'Select PDF file (Max 12MB)'}</span>
                    </div>
                  </div>
                  {fileDetails && (
                    <div style={{ fontSize: '0.78rem', color: '#ff6b00', fontWeight: 600, paddingLeft: 4 }}>
                      Selected: {fileDetails}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))} style={{ cursor: 'pointer' }} />
                <label htmlFor="isActive" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', cursor: 'pointer' }}>Visible to students immediately</label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button className="btn btn-primary" onClick={save} disabled={saving} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {saving ? (
                  <><Loader size={14} className="spin" /> Saving...</>
                ) : (
                  <><Save size={16} /> Save Book</>
                )}
              </button>
              <button className="btn btn-outline" onClick={() => setModal(null)} disabled={saving}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
