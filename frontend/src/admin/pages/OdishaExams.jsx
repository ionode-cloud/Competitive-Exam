import { useState, useEffect, useCallback } from 'react';
import {
  RiFontColor,
  RiLayoutGridLine,
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiDeleteBin2Line,
  RiDragMove2Line,
  RiArrowUpLine,
  RiArrowDownLine,
  RiShieldLine
} from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '../api/axios';

export default function OdishaExams() {
  const [exams, setExams] = useState([]);
  const [categoryPrices, setCategoryPrices] = useState({});
  const [draggedExamIdx, setDraggedExamIdx] = useState(null);
  const [loading, setLoading] = useState(true);

  // Banner Settings State
  const [savingConfig, setSavingConfig] = useState(false);
  const [config, setConfig] = useState({
    bannerEyebrow: 'Exam Section',
    bannerHeading: 'Browse All Competitive Exams',
    bannerSubtitle: 'Find your target exam category and get structured preparation resources — tests, PDFs & live classes.',
    bannerStats: [
      { n: '50+', label: 'Exams Covered' },
      { n: '6', label: 'Categories' },
      { n: '10K+', label: 'Students' }
    ]
  });

  // Modal State
  const [examModal, setExamModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [examForm, setExamForm] = useState({
    name: '',
    description: '',
    icon: 'landmark',
    price: 499,
    isFree: false,
    status: 'active',
    topics: []
  });
  const [topicInput, setTopicInput] = useState('');

  // Notify listeners on changes
  const notifyUpdated = () => {
    window.dispatchEvent(new Event('examsection-updated'));
    try {
      localStorage.setItem('examsection-updated', Date.now().toString());
    } catch { /* silent */ }
  };

  // ── Data Fetching ─────────────────────────────────────────────────────────────
  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/odisha-exams/config');
      if (res.data?.success && res.data?.data) {
        const c = res.data.data;
        setConfig({
          bannerEyebrow: c.bannerEyebrow || 'Exam Section',
          bannerHeading: c.bannerHeading || 'Browse All Competitive Exams',
          bannerSubtitle: c.bannerSubtitle || 'Find your target exam category and get structured preparation resources — tests, PDFs & live classes.',
          bannerStats: c.bannerStats || [
            { n: '50+', label: 'Exams Covered' },
            { n: '6', label: 'Categories' },
            { n: '10K+', label: 'Students' }
          ]
        });
      }
    } catch { /* silent */ }
  }, []);

  const fetchExams = useCallback(async () => {
    try {
      const res = await api.get('/exams');
      if (res.data?.success) {
        const list = res.data.data || [];
        setExams(list);
        const map = {};
        list.forEach(ex => { map[ex._id] = ex.price ?? 499; });
        setCategoryPrices(map);
      }
    } catch { /* silent */ }
  }, []);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchConfig(), fetchExams()]);
    setLoading(false);
  }, [fetchConfig, fetchExams]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ── Banner Settings Handlers ─────────────────────────────────────────────
  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.put('/odisha-exams/config', config);
      Swal.fire('Saved!', 'Exam Section banner settings updated successfully.', 'success');
      notifyUpdated();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save banner settings', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const addStatBadge = () => {
    setConfig(prev => ({
      ...prev,
      bannerStats: [...(prev.bannerStats || []), { n: '100+', label: 'New Badge' }]
    }));
  };

  const removeStatBadge = (idx) => {
    setConfig(prev => ({
      ...prev,
      bannerStats: prev.bannerStats.filter((_, i) => i !== idx)
    }));
  };

  const updateStatBadge = (idx, field, val) => {
    setConfig(prev => {
      const updated = [...(prev.bannerStats || [])];
      updated[idx] = { ...updated[idx], [field]: val };
      return { ...prev, bannerStats: updated };
    });
  };

  // ── Exam Category Handlers ───────────────────────────────────────────────────
  const handleSaveExamPrice = async (examId, newPrice) => {
    try {
      await api.put(`/exams/${examId}`, { price: Number(newPrice) });
      Swal.fire('Saved!', 'Exam Category price updated successfully', 'success');
      notifyUpdated();
      fetchExams();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to update price', 'error');
    }
  };

  const moveExam = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= exams.length) return;
    const updated = [...exams];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setExams(updated);
    notifyUpdated();
  };

  const openCreateExam = () => {
    setEditingExam(null);
    setExamForm({ name: '', description: '', icon: 'landmark', price: 499, isFree: false, status: 'active', topics: [] });
    setTopicInput('');
    setExamModal(true);
  };

  const openEditExam = (ex) => {
    setEditingExam(ex);
    setExamForm({
      name: ex.name || '',
      description: ex.description || '',
      icon: ex.icon || 'landmark',
      price: ex.price || 0,
      isFree: ex.isFree !== false,
      status: ex.status || 'active',
      topics: Array.isArray(ex.topics) ? [...ex.topics] : []
    });
    setTopicInput('');
    setExamModal(true);
  };

  const addTopicToExamForm = () => {
    if (!topicInput.trim()) return;
    if (examForm.topics?.includes(topicInput.trim())) return;
    setExamForm(prev => ({ ...prev, topics: [...(prev.topics || []), topicInput.trim()] }));
    setTopicInput('');
  };

  const removeTopicFromExamForm = (topName) => {
    setExamForm(prev => ({ ...prev, topics: (prev.topics || []).filter(t => t !== topName) }));
  };

  const saveExam = async () => {
    if (!examForm.name.trim()) return Swal.fire('Error', 'Category name is required', 'error');
    const { _id, __v, createdAt, updatedAt, ...cleanPayload } = examForm;
    try {
      if (editingExam) {
        await api.put(`/exams/${editingExam._id}`, cleanPayload);
        Swal.fire('Success', 'Exam Category updated successfully', 'success');
      } else {
        await api.post('/exams', cleanPayload);
        Swal.fire('Success', 'Exam Category created successfully', 'success');
      }
      setExamModal(false);
      setEditingExam(null);
      notifyUpdated();
      fetchExams();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Save failed', 'error');
    }
  };

  const deleteExam = async (id) => {
    const res = await Swal.fire({ title: 'Delete Category?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!res.isConfirmed) return;
    try {
      await api.delete(`/exams/${id}`);
      Swal.fire('Deleted', 'Exam Category deleted', 'success');
      notifyUpdated();
      fetchExams();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Delete failed', 'error');
    }
  };

  return (
    <div style={{ padding: '24px 28px', minHeight: '85vh', background: 'var(--bg)' }}>
      
      {/* Top Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiShieldLine style={{ color: '#2563eb' }} /> Odisha Exams (Exam Section)
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
          Manage Exam Section banner settings, exam categories, subscription prices, and topic sections
        </p>
      </div>

      {/* Two-Column Manager Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
        
        {/* Left Column: BANNER TEXT SETTINGS & STATS BADGES */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 800, letterSpacing: 0.5, color: '#475569', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RiFontColor color="#2563eb" /> Banner Text Settings
            </h3>

            {/* EYEBROW LABEL */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                Eyebrow Label <span style={{ fontSize: 10, fontWeight: 500, color: '#94a3b8' }}>(Small text above heading)</span>
              </label>
              <input
                value={config.bannerEyebrow}
                onChange={e => setConfig(prev => ({ ...prev, bannerEyebrow: e.target.value }))}
                placeholder="e.g. Exam Section"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, outline: 'none' }}
              />
            </div>

            {/* MAIN HEADING */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                Main Banner Heading
              </label>
              <input
                value={config.bannerHeading}
                onChange={e => setConfig(prev => ({ ...prev, bannerHeading: e.target.value }))}
                placeholder="e.g. Browse All Competitive Exams"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 800, color: '#0f172a', outline: 'none' }}
              />
            </div>

            {/* SUBTITLE / DESCRIPTION */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                Subtitle / Description
              </label>
              <textarea
                rows={3}
                value={config.bannerSubtitle}
                onChange={e => setConfig(prev => ({ ...prev, bannerSubtitle: e.target.value }))}
                placeholder="Find your target exam category and get structured preparation resources..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', lineHeight: 1.5 }}
              />
            </div>

            {/* STATS BADGES */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', margin: 0, textTransform: 'uppercase' }}>
                  Stats Badges
                </label>
                <button
                  onClick={addStatBadge}
                  style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 2 }}
                >
                  + Add
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {config.bannerStats?.map((st, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      value={st.n}
                      onChange={e => updateStatBadge(idx, 'n', e.target.value)}
                      placeholder="50+"
                      style={{ width: 110, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, textAlign: 'center' }}
                    />
                    <input
                      value={st.label}
                      onChange={e => updateStatBadge(idx, 'label', e.target.value)}
                      placeholder="Exams Covered"
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                    <button
                      onClick={() => removeStatBadge(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                    >
                      <RiDeleteBin2Line fontSize={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* LIVE BANNER PREVIEW CARD */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14, padding: 20, color: '#fff' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#FDE68A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                {config.bannerEyebrow || 'Exam Section'}
              </div>
              <h4 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 800, color: '#fff' }}>
                {config.bannerHeading || 'Browse All Competitive Exams'}
              </h4>
              <p style={{ margin: '0 0 16px', fontSize: 11, color: '#94a3b8', lineHeight: 1.4 }}>
                {config.bannerSubtitle}
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                {config.bannerStats?.map((st, idx) => (
                  <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 10px', textAlign: 'center', minWidth: 50 }}>
                    <div style={{ fontSize: 14, fontWeight: 900, color: '#FFC93C' }}>{st.n}</div>
                    <div style={{ fontSize: 9, color: '#cbd5e1', marginTop: 2 }}>{st.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', borderRadius: 10, fontWeight: 800, fontSize: 14 }}
              >
                {savingConfig ? 'Saving Settings...' : 'Save Banner Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: EXAM SECTION CATEGORIES & PRICES MANAGER */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <RiLayoutGridLine /> EXAM SECTION CATEGORIES &amp; PRICES
                </h3>
                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                  Manage exam categories, section topics &amp; subscription prices for Exam Section
                </p>
              </div>
              <button
                onClick={openCreateExam}
                className="btn btn-primary"
                style={{ padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <RiAddLine /> + Add Exam Category
              </button>
            </div>

            {/* Exam Categories Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>
                    <th style={{ padding: '10px 12px', width: 70 }}>REORDER</th>
                    <th style={{ padding: '10px 12px' }}>EXAM CATEGORY</th>
                    <th style={{ padding: '10px 12px', width: 170 }}>CATEGORY PRICE (₹)</th>
                    <th style={{ padding: '10px 12px' }}>STATUS</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>Loading categories...</td></tr>
                  ) : exams.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: 24, color: '#64748b' }}>No exam categories found. Click "+ Add Exam Category" to create one.</td></tr>
                  ) : (
                    exams.map((ex, idx) => (
                      <tr
                        key={ex._id || idx}
                        draggable
                        onDragStart={() => setDraggedExamIdx(idx)}
                        onDragOver={e => e.preventDefault()}
                        onDrop={() => {
                          if (draggedExamIdx !== null && draggedExamIdx !== idx) {
                            moveExam(draggedExamIdx, idx);
                            setDraggedExamIdx(null);
                          }
                        }}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: draggedExamIdx === idx ? '#eff6ff' : 'transparent',
                          opacity: draggedExamIdx === idx ? 0.5 : 1
                        }}
                      >
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'grab' }} title="Drag to reorder">
                            <RiDragMove2Line style={{ color: '#94a3b8' }} />
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{idx + 1}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 800, color: '#0f172a' }}>{ex.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>{ex.description || 'Exam Section Category'}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>₹</span>
                            <input
                              type="number"
                              value={categoryPrices[ex._id] !== undefined ? categoryPrices[ex._id] : (ex.price ?? 499)}
                              onChange={e => setCategoryPrices(prev => ({ ...prev, [ex._id]: e.target.value }))}
                              style={{
                                width: 80, padding: '5px 8px', borderRadius: 6,
                                border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700
                              }}
                            />
                            <button
                              onClick={() => handleSaveExamPrice(ex._id, categoryPrices[ex._id] !== undefined ? categoryPrices[ex._id] : (ex.price ?? 499))}
                              style={{
                                padding: '5px 10px', borderRadius: 6, border: 'none',
                                background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer'
                              }}
                            >
                              Save
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                            background: ex.status === 'inactive' ? '#FEF1E4' : '#EAF1FD',
                            color: ex.status === 'inactive' ? '#EA7A1E' : '#1957D6'
                          }}>
                            {ex.status === 'inactive' ? 'Inactive' : 'Active'}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                            <button
                              onClick={() => moveExam(idx, idx - 1)}
                              disabled={idx === 0}
                              style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }}
                              title="Move Up"
                            >
                              <RiArrowUpLine fontSize={13} />
                            </button>
                            <button
                              onClick={() => moveExam(idx, idx + 1)}
                              disabled={idx === exams.length - 1}
                              style={{ padding: '3px 6px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', opacity: idx === exams.length - 1 ? 0.3 : 1 }}
                              title="Move Down"
                            >
                              <RiArrowDownLine fontSize={13} />
                            </button>
                            <button onClick={() => openEditExam(ex)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Edit">
                              <RiEditLine fontSize={14} color="#2563eb" />
                            </button>
                            <button onClick={() => deleteExam(ex._id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Delete">
                              <RiDeleteBinLine fontSize={14} color="#ef4444" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── EXAM CATEGORY MODAL ── */}
      {examModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 800 }}>{editingExam ? 'Edit Exam Category' : 'Add Exam Category'}</h3>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Category Name *</label>
              <input
                value={examForm.name}
                onChange={e => setExamForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Bank & Insurance"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
              />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Description</label>
              <input
                value={examForm.description}
                onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Brief description for category"
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Icon Type</label>
                <select
                  value={examForm.icon}
                  onChange={e => setExamForm(f => ({ ...f, icon: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                >
                  <option value="landmark">🏛 Landmark / State PSC</option>
                  <option value="train">🚆 Train / SSC &amp; Railway</option>
                  <option value="university">🏦 University / Banking</option>
                  <option value="shield">🛡 Shield / Police &amp; Defence</option>
                  <option value="clipboard">📋 Clipboard / General</option>
                  <option value="scale">⚖ Balance Scale / Regulatory</option>
                  <option value="teacher">👨‍🏫 Teacher / Teaching</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Category Price (₹)</label>
                <input
                  type="number"
                  value={examForm.price}
                  onChange={e => setExamForm(f => ({ ...f, price: Number(e.target.value) }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
              <select
                value={examForm.status}
                onChange={e => setExamForm(f => ({ ...f, status: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
              >
                <option value="active">Active (Visible in User Panel)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setExamModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>
                Cancel
              </button>
              <button onClick={saveExam} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>
                Save Exam Category
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
