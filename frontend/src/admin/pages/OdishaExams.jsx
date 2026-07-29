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
  RiShieldLine,
  RiImageLine,
  RiSlideshowLine,
  RiCloseLine
} from 'react-icons/ri';
import Swal from 'sweetalert2';
import api from '../api/axios';

export default function OdishaExams() {
  const [exams, setExams] = useState([]);
  const [categoryPrices, setCategoryPrices] = useState({});
  const [draggedExamIdx, setDraggedExamIdx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('slides'); // 'slides' | 'banner' | 'categories'

  // Banner Settings State
  const [savingConfig, setSavingConfig] = useState(false);
  const [config, setConfig] = useState({
    bannerEyebrow: 'Exam Section',
    bannerHeading: 'Browse All Competitive Exams',
    bannerSubtitle: 'Find your target exam category and get structured preparation resources â€” tests, PDFs & live classes.',
    bannerStats: [
      { n: '50+', label: 'Exams Covered' },
      { n: '6', label: 'Categories' },
      { n: '10K+', label: 'Students' }
    ]
  });

  // Home Banner Slides State
  const defaultSlides = [
    { tag: 'MAINS QUANT BATCH', title: 'Saviour 4.0 â€” One Stop Solution', desc: '50+ live mains-level quant classes, topic-wise sessions, sectional tests + quizzes.', price: 'â‚¹499', orig: 'â‚¹1,999', cta: 'Grab It Now' },
    { tag: 'OPSC OAS BATCH', title: 'Mission OAS 2026 â€” Comprehensive', desc: 'Integrated Prelims + Mains syllabus coverage with senior civil servant mentors.', price: 'â‚¹2,499', orig: 'â‚¹9,999', cta: 'Enrol Now' },
    { tag: 'OSSSC RI / ARI', title: 'Revenue Inspector Special Batch', desc: 'Complete syllabus of Mathematics, Computer, Odia, English and General Knowledge.', price: 'â‚¹999', orig: 'â‚¹3,999', cta: 'Join Batch' },
    { tag: 'OSSC CGL BATCH', title: 'CGL Target Batch 2026', desc: 'Topic wise video classes, daily quizzes, full-length test series and doubt clearing.', price: 'â‚¹1,199', orig: 'â‚¹4,999', cta: 'Get Admission' },
  ];
  const [slides, setSlides] = useState(defaultSlides);
  const [savingSlides, setSavingSlides] = useState(false);
  const [draggedSlideIdx, setDraggedSlideIdx] = useState(null);
  const [slideModal, setSlideModal] = useState(false);
  const [editingSlideIdx, setEditingSlideIdx] = useState(null);
  const [slideForm, setSlideForm] = useState({ tag: '', title: '', desc: '', price: '', orig: '', cta: 'Get Admission' });

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

  // â”€â”€ Data Fetching â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const fetchConfig = useCallback(async () => {
    try {
      const res = await api.get('/odisha-exams/config');
      if (res.data?.success && res.data?.data) {
        const c = res.data.data;
        setConfig({
          bannerEyebrow: c.bannerEyebrow || 'Exam Section',
          bannerHeading: c.bannerHeading || 'Browse All Competitive Exams',
          bannerSubtitle: c.bannerSubtitle || 'Find your target exam category and get structured preparation resources â€” tests, PDFs & live classes.',
          bannerStats: c.bannerStats || [
            { n: '50+', label: 'Exams Covered' },
            { n: '6', label: 'Categories' },
            { n: '10K+', label: 'Students' }
          ]
        });
        if (Array.isArray(c.homeBannerSlides) && c.homeBannerSlides.length > 0) {
          setSlides(c.homeBannerSlides);
        }
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

  // â”€â”€ Banner Settings Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Home Banner Slides Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleSaveSlides = async () => {
    setSavingSlides(true);
    try {
      await api.put('/odisha-exams/config', { homeBannerSlides: slides });
      Swal.fire('Saved!', 'Home page banner slides updated successfully.', 'success');
      notifyUpdated();
    } catch (err) {
      Swal.fire('Error', err.response?.data?.message || 'Failed to save slides', 'error');
    } finally {
      setSavingSlides(false);
    }
  };

  const openAddSlide = () => {
    setEditingSlideIdx(null);
    setSlideForm({ tag: '', title: '', desc: '', price: '', orig: '', cta: 'Get Admission' });
    setSlideModal(true);
  };

  const openEditSlide = (idx) => {
    setEditingSlideIdx(idx);
    setSlideForm({ ...slides[idx] });
    setSlideModal(true);
  };

  const saveSlide = () => {
    if (!slideForm.title.trim()) return Swal.fire('Error', 'Slide title is required', 'error');
    if (editingSlideIdx !== null) {
      setSlides(prev => prev.map((s, i) => i === editingSlideIdx ? { ...slideForm } : s));
    } else {
      setSlides(prev => [...prev, { ...slideForm }]);
    }
    setSlideModal(false);
    setEditingSlideIdx(null);
  };

  const deleteSlide = (idx) => {
    Swal.fire({ title: 'Delete this slide?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' })
      .then(r => { if (r.isConfirmed) setSlides(prev => prev.filter((_, i) => i !== idx)); });
  };

  const moveSlide = (from, to) => {
    if (to < 0 || to >= slides.length) return;
    const arr = [...slides];
    const [item] = arr.splice(from, 1);
    arr.splice(to, 0, item);
    setSlides(arr);
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

  // â”€â”€ Exam Category Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

      {/* â”€â”€ Page Header â”€â”€ */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <RiShieldLine style={{ color: '#2563eb' }} /> Odisha Exams
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--muted)' }}>
          Manage home banner slides, exam section banner settings, and exam categories & prices
        </p>
      </div>

      {/* â”€â”€ Tab Bar â”€â”€ */}
      <div style={{
        display: 'flex', gap: 0, marginBottom: 24,
        background: '#fff', borderRadius: 14, padding: 6,
        border: '1px solid #e2e8f0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        width: 'fit-content'
      }}>
        {[
          { id: 'slides', label: 'Home Banner Slides' },
          { id: 'banner',  label: 'Banner Settings' },
          { id: 'categories', label: 'Exam Categories' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '9px 20px',
              borderRadius: 10,
              border: 'none',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              transition: 'all 0.18s',
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#64748b',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(37,99,235,0.25)' : 'none',
            }}
          >
            <span style={{ fontSize: 15 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           TAB 1 â€” HOME PAGE AUTO-SCROLL BANNER SLIDES
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'slides' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 28, boxShadow: '0 2px 8px rgba(37,99,235,0.06)' }}>

          {/* Tab Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiSlideshowLine color="#2563eb" fontSize={20} /> Home Page Auto-Scroll Banner Slides
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                These slides auto-rotate on the Home page promo banner. Add, edit, reorder, or delete slides, then click <strong>Save Slides</strong> to publish.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={openAddSlide}
                className="btn btn-primary"
                style={{ padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <RiAddLine /> + Add Slide
              </button>
              <button
                onClick={handleSaveSlides}
                disabled={savingSlides}
                style={{ padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 800, background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, opacity: savingSlides ? 0.7 : 1 }}
              >
                {savingSlides ? 'â³ Saving...' : 'ðŸ’¾ Save Slides'}
              </button>
            </div>
          </div>

          {/* Slides List */}
          {slides.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
              <RiImageLine fontSize={44} style={{ marginBottom: 10, opacity: 0.35 }} />
              <div style={{ fontSize: 14, fontWeight: 600 }}>No slides yet.</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>Click &ldquo;+ Add Slide&rdquo; to create your first home banner slide.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {slides.map((slide, idx) => (
                <div
                  key={idx}
                  draggable
                  onDragStart={() => setDraggedSlideIdx(idx)}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => {
                    if (draggedSlideIdx !== null && draggedSlideIdx !== idx) {
                      moveSlide(draggedSlideIdx, idx);
                      setDraggedSlideIdx(null);
                    }
                  }}
                  style={{
                    display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, alignItems: 'center',
                    background: draggedSlideIdx === idx ? '#eff6ff' : '#f8fafc',
                    border: `1.5px solid ${draggedSlideIdx === idx ? '#93c5fd' : '#e2e8f0'}`,
                    borderRadius: 12, padding: '13px 16px',
                    opacity: draggedSlideIdx === idx ? 0.6 : 1,
                    transition: 'all 0.15s'
                  }}
                >
                  {/* Drag + Number */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, cursor: 'grab', color: '#94a3b8' }}>
                    <RiDragMove2Line fontSize={18} />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#64748b' }}>{idx + 1}</span>
                  </div>

                  {/* Info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                      {slide.tag && (
                        <span style={{ fontSize: 10, fontWeight: 800, background: '#1e40af', color: '#fff', padding: '2px 8px', borderRadius: 20, letterSpacing: 0.5, flexShrink: 0 }}>
                          {slide.tag}
                        </span>
                      )}
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {slide.title}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                      {slide.desc}
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      {slide.price && <span style={{ fontSize: 12, fontWeight: 800, color: '#16a34a' }}>{slide.price}</span>}
                      {slide.orig && <span style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>{slide.orig}</span>}
                      {slide.cta && <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#eff6ff', padding: '1px 8px', borderRadius: 8 }}>{slide.cta}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <button onClick={() => moveSlide(idx, idx - 1)} disabled={idx === 0} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.3 : 1 }} title="Move Up"><RiArrowUpLine fontSize={13} /></button>
                    <button onClick={() => moveSlide(idx, idx + 1)} disabled={idx === slides.length - 1} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: idx === slides.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === slides.length - 1 ? 0.3 : 1 }} title="Move Down"><RiArrowDownLine fontSize={13} /></button>
                    <button onClick={() => openEditSlide(idx)} style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Edit Slide"><RiEditLine fontSize={14} color="#2563eb" /></button>
                    <button onClick={() => deleteSlide(idx)} style={{ padding: '4px 9px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer' }} title="Delete Slide"><RiDeleteBinLine fontSize={14} color="#ef4444" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Live Preview Strip */}
          {slides.length > 0 && (
            <div style={{ marginTop: 24, padding: '18px 22px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                ðŸŽ¬ Live Preview â€” Slide 1 of {slides.length}
              </div>
              {slides[0]?.tag && <span style={{ fontSize: 10, fontWeight: 800, background: '#1e40af', color: '#dbeafe', padding: '2px 8px', borderRadius: 20, letterSpacing: 0.5 }}>{slides[0].tag}</span>}
              <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', margin: '8px 0 4px' }}>{slides[0]?.title}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 10 }}>{slides[0]?.desc}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {slides[0]?.orig && <span style={{ fontSize: 11, color: '#64748b', textDecoration: 'line-through' }}>{slides[0].orig}</span>}
                {slides[0]?.price && <span style={{ fontSize: 17, fontWeight: 900, color: '#FFC93C' }}>{slides[0].price}</span>}
                <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 8, background: '#2563eb', color: '#fff' }}>{slides[0]?.cta}</span>
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                {slides.map((_, i) => (
                  <span key={i} style={{ width: i === 0 ? 22 : 6, height: 6, borderRadius: 3, background: i === 0 ? '#2563eb' : 'rgba(255,255,255,0.25)', transition: 'all 0.3s' }} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           TAB 2 â€” EXAM SECTION BANNER SETTINGS
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'banner' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

          {/* Left: Form */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
              <RiFontColor color="#2563eb" /> Exam Section Banner Text
            </h2>

            {/* Eyebrow */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Eyebrow Label <span style={{ fontSize: 10, fontWeight: 400, color: '#94a3b8', textTransform: 'none' }}>(small text above heading)</span>
              </label>
              <input
                value={config.bannerEyebrow}
                onChange={e => setConfig(prev => ({ ...prev, bannerEyebrow: e.target.value }))}
                placeholder="e.g. Exam Section"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Main Banner Heading
              </label>
              <input
                value={config.bannerHeading}
                onChange={e => setConfig(prev => ({ ...prev, bannerHeading: e.target.value }))}
                placeholder="e.g. Browse All Competitive Exams"
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 800, color: '#0f172a', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Subtitle */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Subtitle / Description
              </label>
              <textarea
                rows={3}
                value={config.bannerSubtitle}
                onChange={e => setConfig(prev => ({ ...prev, bannerSubtitle: e.target.value }))}
                placeholder="Find your target exam category..."
                style={{ width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: 13, outline: 'none', lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {/* Stats Badges */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, margin: 0 }}>
                  Stats Badges
                </label>
                <button onClick={addStatBadge} style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', background: 'none', border: 'none', cursor: 'pointer' }}>
                  + Add Badge
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {config.bannerStats?.map((st, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      value={st.n}
                      onChange={e => updateStatBadge(idx, 'n', e.target.value)}
                      placeholder="50+"
                      style={{ width: 90, padding: '8px 10px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, textAlign: 'center' }}
                    />
                    <input
                      value={st.label}
                      onChange={e => updateStatBadge(idx, 'label', e.target.value)}
                      placeholder="Exams Covered"
                      style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                    />
                    <button onClick={() => removeStatBadge(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
                      <RiDeleteBin2Line fontSize={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={savingConfig}
              className="btn btn-primary"
              style={{ width: '100%', padding: '13px', borderRadius: 10, fontWeight: 800, fontSize: 14 }}
            >
              {savingConfig ? 'â³ Saving...' : 'ðŸ’¾ Save Banner Settings'}
            </button>
          </div>

          {/* Right: Live Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 18, padding: 28, color: '#fff' }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#FDE68A', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>
                {config.bannerEyebrow || 'Exam Section'}
              </div>
              <h3 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: '#fff', lineHeight: 1.3 }}>
                {config.bannerHeading || 'Browse All Competitive Exams'}
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                {config.bannerSubtitle}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {config.bannerStats?.map((st, idx) => (
                  <div key={idx} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 14px', textAlign: 'center', minWidth: 60 }}>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#FFC93C' }}>{st.n}</div>
                    <div style={{ fontSize: 10, color: '#cbd5e1', marginTop: 2 }}>{st.label}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 14, padding: 18 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#16a34a', marginBottom: 6 }}>â„¹ï¸ This is a live preview</div>
              <p style={{ fontSize: 12, color: '#4b5563', margin: 0, lineHeight: 1.6 }}>
                The card above shows how your Exam Section banner heading, subtitle and stats badges will look on the Exam Section page.
                Click <strong>Save Banner Settings</strong> to publish changes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
           TAB 3 â€” EXAM CATEGORIES & PRICES
      â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
      {activeTab === 'categories' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

          {/* Tab Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <RiLayoutGridLine color="#2563eb" /> Exam Categories &amp; Prices
              </h2>
              <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>
                Manage exam categories, topics, and subscription prices for the Exam Section page
              </p>
            </div>
            <button
              onClick={openCreateExam}
              className="btn btn-primary"
              style={{ padding: '9px 18px', borderRadius: 9, fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}
            >
              <RiAddLine /> + Add Exam Category
            </button>
          </div>

          {/* Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 }}>
                  <th style={{ padding: '12px 14px', width: 70 }}>Reorder</th>
                  <th style={{ padding: '12px 14px' }}>Exam Category</th>
                  <th style={{ padding: '12px 14px', width: 190 }}>Category Price (â‚¹)</th>
                  <th style={{ padding: '12px 14px' }}>Status</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>Loading categories...</td></tr>
                ) : exams.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                    No exam categories found. Click &ldquo;+ Add Exam Category&rdquo; to create one.
                  </td></tr>
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
                        opacity: draggedExamIdx === idx ? 0.5 : 1,
                        transition: 'background 0.15s'
                      }}
                    >
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'grab', color: '#94a3b8' }}>
                          <RiDragMove2Line fontSize={16} />
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>{idx + 1}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{ex.name}</div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{ex.description || 'Exam Section Category'}</div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: 14 }}>â‚¹</span>
                          <input
                            type="number"
                            value={categoryPrices[ex._id] !== undefined ? categoryPrices[ex._id] : (ex.price ?? 499)}
                            onChange={e => setCategoryPrices(prev => ({ ...prev, [ex._id]: e.target.value }))}
                            style={{ width: 80, padding: '5px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700 }}
                          />
                          <button
                            onClick={() => handleSaveExamPrice(ex._id, categoryPrices[ex._id] !== undefined ? categoryPrices[ex._id] : (ex.price ?? 499))}
                            style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
                          >
                            Save
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                          background: ex.status === 'inactive' ? '#FEF1E4' : '#dcfce7',
                          color: ex.status === 'inactive' ? '#EA7A1E' : '#16a34a'
                        }}>
                          {ex.status === 'inactive' ? 'Inactive' : 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button onClick={() => moveExam(idx, idx - 1)} disabled={idx === 0} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', opacity: idx === 0 ? 0.3 : 1 }} title="Move Up"><RiArrowUpLine fontSize={13} /></button>
                          <button onClick={() => moveExam(idx, idx + 1)} disabled={idx === exams.length - 1} style={{ padding: '3px 7px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', opacity: idx === exams.length - 1 ? 0.3 : 1 }} title="Move Down"><RiArrowDownLine fontSize={13} /></button>
                          <button onClick={() => openEditExam(ex)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }} title="Edit"><RiEditLine fontSize={14} color="#2563eb" /></button>
                          <button onClick={() => deleteExam(ex._id)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff', cursor: 'pointer' }} title="Delete"><RiDeleteBinLine fontSize={14} color="#ef4444" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
           MODAL: Home Banner Slide Add/Edit
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {slideModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 560, padding: 28, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#0f172a' }}>
                {editingSlideIdx !== null ? 'âœï¸ Edit Banner Slide' : 'âž• Add Banner Slide'}
              </h3>
              <button onClick={() => setSlideModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
                <RiCloseLine fontSize={22} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Slide Tag Badge <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(e.g. "OPSC OAS BATCH")</span>
                </label>
                <input value={slideForm.tag} onChange={e => setSlideForm(f => ({ ...f, tag: e.target.value }))} placeholder="e.g. MAINS QUANT BATCH" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Slide Title *</label>
                <input value={slideForm.title} onChange={e => setSlideForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Saviour 4.0 â€” One Stop Solution" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 14, fontWeight: 800, color: '#0f172a', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</label>
                <textarea rows={2} value={slideForm.desc} onChange={e => setSlideForm(f => ({ ...f, desc: e.target.value }))} placeholder="Brief description..." style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13, lineHeight: 1.5, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sale Price</label>
                  <input value={slideForm.price} onChange={e => setSlideForm(f => ({ ...f, price: e.target.value }))} placeholder="â‚¹499" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 800, color: '#16a34a', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>Original Price <span style={{ fontWeight: 400, textTransform: 'none', color: '#94a3b8' }}>(struck-through)</span></label>
                  <input value={slideForm.orig} onChange={e => setSlideForm(f => ({ ...f, orig: e.target.value }))} placeholder="â‚¹1,999" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13, color: '#94a3b8', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: 0.5 }}>CTA Button Text</label>
                <input value={slideForm.cta} onChange={e => setSlideForm(f => ({ ...f, cta: e.target.value }))} placeholder="e.g. Grab It Now" style={{ width: '100%', padding: '10px 14px', borderRadius: 9, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }} />
              </div>

              {/* Mini Preview */}
              <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 12, padding: '14px 16px' }}>
                <div style={{ fontSize: 9, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Live Preview</div>
                {slideForm.tag && <span style={{ fontSize: 10, fontWeight: 800, background: '#1e40af', color: '#dbeafe', padding: '2px 8px', borderRadius: 20 }}>{slideForm.tag}</span>}
                <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', margin: '6px 0 3px' }}>{slideForm.title || 'Slide Title'}</div>
                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 6 }}>{slideForm.desc || 'Slide description...'}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {slideForm.orig && <span style={{ fontSize: 10, color: '#64748b', textDecoration: 'line-through' }}>{slideForm.orig}</span>}
                  {slideForm.price && <span style={{ fontSize: 14, fontWeight: 900, color: '#FFC93C' }}>{slideForm.price}</span>}
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6, background: '#2563eb', color: '#fff' }}>{slideForm.cta || 'CTA'}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 22 }}>
              <button onClick={() => setSlideModal(false)} style={{ padding: '10px 20px', borderRadius: 9, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>Cancel</button>
              <button onClick={saveSlide} style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 800, fontSize: 13 }}>
                {editingSlideIdx !== null ? 'Update Slide' : 'Add Slide'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
           MODAL: Exam Category Add/Edit
      â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {examModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 520, padding: 24, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{editingExam ? 'Edit Exam Category' : 'Add Exam Category'}</h3>
              <button onClick={() => setExamModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}><RiCloseLine fontSize={22} /></button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Category Name *</label>
              <input value={examForm.name} onChange={e => setExamForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Bank & Insurance" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Description</label>
              <input value={examForm.description} onChange={e => setExamForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description for category" style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Icon Type</label>
                <select value={examForm.icon} onChange={e => setExamForm(f => ({ ...f, icon: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                  <option value="landmark">ðŸ› Landmark / State PSC</option>
                  <option value="train">ðŸš† Train / SSC &amp; Railway</option>
                  <option value="university">ðŸ¦ University / Banking</option>
                  <option value="shield">ðŸ›¡ Shield / Police &amp; Defence</option>
                  <option value="clipboard">ðŸ“‹ Clipboard / General</option>
                  <option value="scale">âš– Balance Scale / Regulatory</option>
                  <option value="teacher">ðŸ‘¨â€ðŸ« Teacher / Teaching</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Category Price (â‚¹)</label>
                <input type="number" value={examForm.price} onChange={e => setExamForm(f => ({ ...f, price: Number(e.target.value) }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13, fontWeight: 700, boxSizing: 'border-box' }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#475569', display: 'block', marginBottom: 4 }}>Status</label>
              <select value={examForm.status} onChange={e => setExamForm(f => ({ ...f, status: e.target.value }))} style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}>
                <option value="active">Active (Visible in User Panel)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setExamModal(false)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 700 }}>Cancel</button>
              <button onClick={saveExam} style={{ padding: '9px 22px', borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: 800 }}>Save Exam Category</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
