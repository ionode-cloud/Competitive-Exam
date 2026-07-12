import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Home, Save, Loader, Image, Upload, Link as LinkIcon, Plus, Trash2,
  Star, BookOpen, Users, Trophy, Target, BarChart2, TrendingUp, Clock,
  Shield, Award, Zap, ChevronUp, ChevronDown, Edit2, X as XIcon,
  CheckCircle, RefreshCw, Eye, Calendar, Activity, Grid
} from 'lucide-react';
import { alertSuccess, alertError, confirmAction } from '../../utils/alert';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const token = () => JSON.parse(localStorage.getItem('admin'))?.token;
const cfg   = () => ({ headers: { Authorization: `Bearer ${token()}` } });

/* ─── helpers ─── */
const ICON_MAP = { Target, BarChart2, TrendingUp, Clock, Shield, Award, Zap, Star, BookOpen, Trophy };
const ICON_OPTIONS = Object.keys(ICON_MAP);

const DEFAULT_STATS = [
  { value: 50, suffix: 'K+', label: 'Students Enrolled' },
  { value: 10, suffix: 'K+', label: 'Practice Questions' },
  { value: 500, suffix: '+',  label: 'Mock Tests' },
  { value: 95,  suffix: '%',  label: 'Success Rate' },
];

const DEFAULT_FEATURES = [
  { icon: 'Target',    title: 'Exam-Pattern Tests',  desc: 'Tests crafted exactly like real competitive exams with updated patterns.' },
  { icon: 'BarChart2', title: 'Deep Analytics',      desc: 'Section-wise performance, accuracy, rank, and improvement suggestions.' },
  { icon: 'TrendingUp',title: 'Adaptive Learning',   desc: 'AI-powered recommendations based on your weak areas.' },
  { icon: 'Clock',     title: 'Real-Time Timer',     desc: 'Actual exam environment with auto-submit and time warnings.' },
];

/* ─── Section Header ─── */
function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <h2 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
        <Icon size={20} color="var(--primary)" /> {title}
      </h2>
      {subtitle && <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{subtitle}</p>}
    </div>
  );
}

/* ─── Card wrapper ─── */
function Card({ children, style }) {
  return (
    <div className="glass" style={{ padding: '28px 32px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', marginBottom: 28, ...style }}>
      {children}
    </div>
  );
}

const inp = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'rgba(255,255,255,0.04)', color: 'var(--text-primary)', boxSizing: 'border-box', fontSize: '0.9rem' };
const lbl = { fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: 6, fontWeight: 600 };

/* ============================================================
   CAROUSEL MANAGER
   ============================================================ */
function CarouselManager({ images, onChange }) {
  const [sourceType, setSourceType] = useState('file');
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef(null);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const readers = files.map(file => new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) { reject('Not an image'); return; }
      if (file.size > 5 * 1024 * 1024) { reject('File too large (max 5 MB)'); return; }
      const reader = new FileReader();
      reader.onload = ev => resolve(ev.target.result);
      reader.onerror = () => reject('Read error');
      reader.readAsDataURL(file);
    }));
    Promise.allSettled(readers).then(results => {
      const succeeded = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      if (succeeded.length) onChange([...images, ...succeeded]);
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length) alertError('Upload Error', failed.map(f => f.reason).join(', '));
    });
    e.target.value = '';
  };

  const handleAddUrl = () => {
    const u = urlInput.trim();
    if (!u) return;
    if (!u.startsWith('http://') && !u.startsWith('https://') && !u.startsWith('/')) {
      alertError('Invalid URL', 'Please enter a valid http/https URL or a local /path.');
      return;
    }
    onChange([...images, u]);
    setUrlInput('');
  };

  const handleRemove = (idx) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const moveUp = (idx) => {
    if (idx === 0) return;
    const arr = [...images];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
  };

  const moveDown = (idx) => {
    if (idx === images.length - 1) return;
    const arr = [...images];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
  };

  return (
    <div>
      {/* Source type toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setSourceType('file')}
          className={sourceType === 'file' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <Upload size={14} /> Upload Local File
        </button>
        <button
          onClick={() => setSourceType('url')}
          className={sourceType === 'url' ? 'btn btn-primary btn-sm' : 'btn btn-ghost btn-sm'}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}
        >
          <LinkIcon size={14} /> Enter URL
        </button>
      </div>

      {/* Input area */}
      {sourceType === 'file' ? (
        <div>
          <input
            type="file"
            accept="image/*"
            multiple
            ref={fileRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: '2px dashed var(--border)', borderRadius: 12, padding: '20px', textAlign: 'center',
              cursor: 'pointer', background: 'rgba(255,107,0,0.04)',
              transition: 'border-color 0.2s, background 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(255,107,0,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'rgba(255,107,0,0.04)'; }}
          >
            <Upload size={28} color="var(--primary)" style={{ marginBottom: 8 }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
              Click to select images <span style={{ color: 'var(--text-tertiary)' }}>(PNG, JPG, WebP — max 5 MB each)</span>
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="url"
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
            placeholder="https://example.com/image.jpg or /public-path/img.png"
            style={{ ...inp, flex: 1 }}
          />
          <button onClick={handleAddUrl} className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Plus size={14} /> Add
          </button>
        </div>
      )}

      {/* Preview grid */}
      {images.length > 0 && (
        <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {images.map((src, idx) => (
            <div key={idx} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' }}>
              <img
                src={src}
                alt={`Slide ${idx + 1}`}
                style={{ width: '100%', height: 110, objectFit: 'cover', display: 'block' }}
                onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
              />
              <div style={{ display: 'none', height: 110, alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                ❌ Invalid image
              </div>
              {/* Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 8px', background: 'rgba(0,0,0,0.6)' }}>
                <span style={{ fontSize: '0.72rem', color: '#fff', opacity: 0.7 }}>Slide {idx + 1}</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => moveUp(idx)} disabled={idx === 0} style={{ background: 'none', border: 'none', cursor: 'pointer', color: idx === 0 ? '#666' : '#aaa', padding: 2 }}><ChevronUp size={13} /></button>
                  <button onClick={() => moveDown(idx)} disabled={idx === images.length - 1} style={{ background: 'none', border: 'none', cursor: 'pointer', color: idx === images.length - 1 ? '#666' : '#aaa', padding: 2 }}><ChevronDown size={13} /></button>
                  <button onClick={() => handleRemove(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#f87171', padding: 2 }}><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {images.length === 0 && (
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginTop: 12, textAlign: 'center', opacity: 0.7 }}>
          No carousel images yet. Add at least one image above.
        </p>
      )}
    </div>
  );
}

/* ============================================================
   STATS EDITOR
   ============================================================ */
function StatsEditor({ stats, onChange }) {
  const update = (idx, field, value) => {
    const next = stats.map((s, i) => i === idx ? { ...s, [field]: field === 'value' ? Number(value) : value } : s);
    onChange(next);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
      {stats.map((s, idx) => (
        <div key={idx} className="glass" style={{ padding: 16, borderRadius: 12, border: '1px solid var(--border)' }}>
          <p style={{ ...lbl, color: 'var(--primary)', marginBottom: 10, fontSize: '0.8rem' }}>Stat #{idx + 1}</p>
          <label style={lbl}>Value (number)</label>
          <input type="number" value={s.value} onChange={e => update(idx, 'value', e.target.value)} style={{ ...inp, marginBottom: 10 }} />
          <label style={lbl}>Suffix</label>
          <input type="text" value={s.suffix} onChange={e => update(idx, 'suffix', e.target.value)} style={{ ...inp, marginBottom: 10 }} placeholder="K+, %, +" />
          <label style={lbl}>Label</label>
          <input type="text" value={s.label} onChange={e => update(idx, 'label', e.target.value)} style={inp} placeholder="Students Enrolled" />
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   FEATURES EDITOR
   ============================================================ */
function FeaturesEditor({ features, onChange }) {
  const update = (idx, field, value) => {
    const next = features.map((f, i) => i === idx ? { ...f, [field]: value } : f);
    onChange(next);
  };

  const addFeature = () => {
    onChange([...features, { icon: 'Target', title: 'New Feature', desc: 'Feature description' }]);
  };

  const removeFeature = async (idx) => {
    const ok = await confirmAction('Remove Feature', 'Are you sure you want to remove this feature card?');
    if (ok) onChange(features.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 16 }}>
        {features.map((f, idx) => (
          <div key={idx} className="glass" style={{ padding: 18, borderRadius: 12, border: '1px solid var(--border)', position: 'relative' }}>
            <button
              onClick={() => removeFeature(idx)}
              style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: '#f87171', cursor: 'pointer', padding: '3px 6px' }}
            >
              <Trash2 size={12} />
            </button>

            <p style={{ ...lbl, color: 'var(--primary)', fontSize: '0.78rem', marginBottom: 12 }}>Feature #{idx + 1}</p>

            <label style={lbl}>Icon</label>
            <select value={f.icon} onChange={e => update(idx, 'icon', e.target.value)} style={{ ...inp, marginBottom: 10 }}>
              {ICON_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
            </select>

            <label style={lbl}>Title</label>
            <input type="text" value={f.title} onChange={e => update(idx, 'title', e.target.value)} style={{ ...inp, marginBottom: 10 }} />

            <label style={lbl}>Description</label>
            <textarea value={f.desc} onChange={e => update(idx, 'desc', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} />
          </div>
        ))}
      </div>
      <button onClick={addFeature} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Plus size={14} /> Add Feature
      </button>
    </div>
  );
}

/* ============================================================
   LIVE EXAMS SELECTOR (Exams by Subject & Topic)
   ============================================================ */
function LiveExamsViewer({ selected = [], onChange }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/exams`, cfg());
      setExams(res.data || []);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  const toggleSelect = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(x => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => {
    const activeIds = filtered.map(e => e._id);
    const newSelected = Array.from(new Set([...selected, ...activeIds]));
    onChange(newSelected);
  };

  const deselectAll = () => {
    const activeIds = filtered.map(e => e._id);
    onChange(selected.filter(id => !activeIds.includes(id)));
  };

  const filtered = exams.filter(e => 
    e.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
    e.topicName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '24px' }}><Loader size={24} className="spin" color="var(--primary)" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Search exams by subject or topic name..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ ...inp, flex: 1, minWidth: 200 }} 
        />
        <button onClick={selectAll} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>Select All Shown</button>
        <button onClick={deselectAll} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>Deselect All Shown</button>
        <button onClick={fetchExams} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {selected.length} selected of {exams.length} total exams (These show in Prepare for Every Exam)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '400px', overflowY: 'auto', paddingRight: 6 }}>
        {filtered.map((e, i) => {
          const isSelected = selected.includes(e._id);
          
          return (
            <div 
              key={e._id || i} 
              onClick={() => toggleSelect(e._id)}
              className="glass" 
              style={{ 
                padding: '14px 18px', 
                borderRadius: 10, 
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 14, 
                flexWrap: 'wrap',
                cursor: 'pointer',
                background: isSelected ? 'rgba(255,107,0,0.06)' : 'rgba(255,255,255,0.01)',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              <input 
                type="checkbox" 
                checked={isSelected} 
                onChange={() => {}} 
                style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--primary)' }} 
              />
              <div style={{ flex: 1, minWidth: 140 }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{e.topicName || 'Untitled Topic'}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>📚 Subject: {e.subjectName || 'General'}</p>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>❓ {e.questions?.length || 0} Qs</span>
                <span>⏱ {e.duration} min</span>
                <span>Total Marks: {e.totalMarks || 0}</span>
                <span style={{ color: e.isPaid ? '#f97316' : '#22c55e' }}>{e.isPaid ? `Paid (₹${e.price})` : 'Free'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   TRENDING MOCK TESTS SELECTOR (Exams by Subject & Topic)
   ============================================================ */
function TrendingMockTestsViewer({ selected = [], onChange }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/api/exams`, cfg());
      setExams(res.data || []);
    } catch (err) {
      console.error('Failed to fetch exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExams(); }, []);

  const toggleSelect = (id) => {
    if (selected.includes(id)) {
      onChange(selected.filter(x => x !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectAll = () => {
    const activeIds = filtered.map(e => e._id);
    const newSelected = Array.from(new Set([...selected, ...activeIds]));
    onChange(newSelected);
  };

  const deselectAll = () => {
    const activeIds = filtered.map(e => e._id);
    onChange(selected.filter(id => !activeIds.includes(id)));
  };

  const filtered = exams.filter(e => 
    e.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
    e.topicName?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '24px' }}><Loader size={24} className="spin" color="var(--primary)" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <input 
          type="text" 
          placeholder="Search exams by subject or topic name..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          style={{ ...inp, flex: 1, minWidth: 200 }} 
        />
        <button onClick={selectAll} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>Select All Shown</button>
        <button onClick={deselectAll} className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border)' }}>Deselect All Shown</button>
        <button onClick={fetchExams} className="btn btn-ghost btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid var(--border)' }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
          {selected.length} selected of {exams.length} total exams (These show in Trending Mock Tests)
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '400px', overflowY: 'auto', paddingRight: 6 }}>
        {filtered.map((e, i) => {
          const isSelected = selected.includes(e._id);
          
          return (
            <div 
              key={e._id || i} 
              onClick={() => toggleSelect(e._id)}
              className="glass" 
              style={{ 
                padding: '14px 18px', 
                borderRadius: 10, 
                border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 14, 
                flexWrap: 'wrap',
                cursor: 'pointer',
                background: isSelected ? 'rgba(255,107,0,0.06)' : 'rgba(255,255,255,0.01)',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
            >
              <input 
                type="checkbox" 
                checked={isSelected} 
                onChange={() => {}} 
                style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--primary)' }} 
              />
              <div style={{ flex: 1, minWidth: 140 }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.92rem' }}>{e.topicName || 'Untitled Topic'}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 600 }}>📚 Subject: {e.subjectName || 'General'}</p>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span>❓ {e.questions?.length || 0} Qs</span>
                <span>⏱ {e.duration} min</span>
                <span>Total Marks: {e.totalMarks || 0}</span>
                <span style={{ color: e.isPaid ? '#f97316' : '#22c55e' }}>{e.isPaid ? `Paid (₹${e.price})` : 'Free'}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   GALLERY GRID EDITOR
   ============================================================ */
function GalleryGridEditor({ gallery = [], onChange }) {
  const list = gallery.length === 8 ? gallery : Array.from({ length: 8 }).map((_, i) => ({
    url: gallery[i]?.url || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500',
    desc: gallery[i]?.desc || `ExamSphere Learning Center Photo #${i + 1}`,
    sourceType: gallery[i]?.sourceType || 'url'
  }));

  const update = (idx, field, value) => {
    const next = list.map((item, i) => i === idx ? { ...item, [field]: value } : item);
    onChange(next);
  };

  const handleLocalFile = (idx, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alertError('Invalid File', 'Please select a valid image file.');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      alertError('File Too Large', 'Maximum file size allowed is 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      update(idx, 'url', e.target.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {list.map((item, idx) => (
        <div key={idx} className="glass" style={{ padding: 18, borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 700 }}>Photo Card #{idx + 1}</p>
            {item.url && (
              <img 
                src={item.url} 
                alt="Preview" 
                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                onError={e => e.currentTarget.style.display = 'none'}
              />
            )}
          </div>

          {/* Toggle local upload vs URL */}
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.02)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
            <button
              onClick={() => update(idx, 'sourceType', 'file')}
              type="button"
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s',
                background: item.sourceType === 'file' ? 'var(--orange-gradient)' : 'transparent',
                color: item.sourceType === 'file' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Upload Local
            </button>
            <button
              onClick={() => update(idx, 'sourceType', 'url')}
              type="button"
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, transition: 'all 0.2s',
                background: item.sourceType === 'url' ? 'var(--orange-gradient)' : 'transparent',
                color: item.sourceType === 'url' ? '#fff' : 'var(--text-secondary)'
              }}
            >
              Enter URL
            </button>
          </div>

          {item.sourceType === 'file' ? (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 600 }}>Select Local Image</label>
              <div style={{ position: 'relative', display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleLocalFile(idx, e.target.files[0])}
                  style={{ display: 'none' }}
                  id={`file-upload-${idx}`}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById(`file-upload-${idx}`).click()}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                >
                  <Upload size={14} /> {item.url?.startsWith('data:image') ? 'Change File' : 'Select File'}
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>Image URL</label>
              <input 
                type="url" 
                value={item.url?.startsWith('data:image') ? '' : item.url} 
                onChange={e => update(idx, 'url', e.target.value)} 
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem' }} 
                placeholder="https://example.com/image.jpg" 
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 4, fontWeight: 600 }}>Hover Description</label>
            <textarea 
              value={item.desc} 
              onChange={e => update(idx, 'desc', e.target.value)} 
              rows={3} 
              style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.85rem', resize: 'vertical' }} 
              placeholder="Description shown on hover..." 
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function AdminHome() {
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [activeTab, setActiveTab] = useState('hero');

  const [form, setForm] = useState({
    heroBadge:       "India's #1 Exam Prep Platform",
    heroTitle:       'Crack Your Dream Exam with ExamSphere',
    heroDesc:        'Practice with 10,000+ questions, track your progress with deep analytics, and get AI-powered recommendations to maximize your score.',
    carouselImages:  [],
    stats:           DEFAULT_STATS,
    features:        DEFAULT_FEATURES,
    ctaTitle:        'Start Your Success Journey Today',
    ctaDesc:         'Free mock tests, daily current affairs, expert strategies — all in one platform.',
    selectedSchedules: [],
    selectedMockTests: [],
    galleryGrid: [],
  });

  /* fetch */
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API}/api/page-content/home`);
        const d = res.data || {};
        setForm(prev => ({
          ...prev,
          heroBadge:      d.heroBadge      || prev.heroBadge,
          heroTitle:      d.heroTitle      || prev.heroTitle,
          heroDesc:       d.heroDesc       || prev.heroDesc,
          carouselImages: d.carouselImages || prev.carouselImages,
          stats:          (d.stats && d.stats.length) ? d.stats : prev.stats,
          features:       (d.features && d.features.length) ? d.features : prev.features,
          ctaTitle:       d.ctaTitle       || prev.ctaTitle,
          ctaDesc:        d.ctaDesc        || prev.ctaDesc,
          selectedSchedules: d.selectedSchedules || [],
          selectedMockTests: d.selectedMockTests || [],
          galleryGrid: d.galleryGrid || [],
        }));
      } catch (err) {
        console.warn('Failed to load Home page content:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* save */
  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/api/page-content/home`, { content: form }, cfg());
      alertSuccess('Saved!', 'Home page content updated successfully.');
    } catch (err) {
      alertError('Error', 'Failed to save Home page content.');
    } finally {
      setSaving(false);
    }
  };

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  /* ── Tab config ── */
  const TABS = [
    { id: 'hero',     label: 'Hero Section',       icon: Zap },
    { id: 'carousel', label: 'Carousel Images',    icon: Image },
    { id: 'stats',    label: 'Stats',               icon: BarChart2 },
    { id: 'exams',    label: 'Live Exams',          icon: Calendar },
    { id: 'tests',    label: 'Trending Tests',      icon: TrendingUp },
    // { id: 'galleryGrid', label: 'Photo Grid',       icon: Grid },
    { id: 'features', label: 'Features Section',    icon: Star },
    { id: 'cta',      label: 'CTA Section',         icon: Target },
  ];

  return (
    <AdminLayout>
      {/* Page Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, marginBottom: 6, background: 'var(--orange-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Manage Home Page
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Customize all sections of the public-facing Home page — carousel, stats, live exams, trending tests, features, hero &amp; CTA text.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'center' }}
        >
          {saving ? <><Loader size={16} className="spin" /> Saving...</> : <><Save size={16} /> Save All Changes</>}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <Loader className="spin" size={36} color="var(--primary)" />
          <p style={{ color: 'var(--text-secondary)', marginTop: 16 }}>Loading page content…</p>
        </div>
      ) : (
        <>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28, padding: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: 14, border: '1px solid var(--border)' }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: '0.84rem', fontWeight: 600, transition: 'all 0.2s',
                  background: activeTab === tab.id ? 'var(--orange-gradient)' : 'transparent',
                  color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                  boxShadow: activeTab === tab.id ? '0 2px 12px rgba(255,107,0,0.3)' : 'none',
                }}
              >
                <tab.icon size={14} /> {tab.label}
              </button>
            ))}
          </div>

          {/* ─── HERO SECTION ─── */}
          {activeTab === 'hero' && (
            <Card>
              <SectionHeader icon={Zap} title="Hero Section" subtitle="Edit the headline badge, main title, and hero description displayed at the top of the Home page." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
                <div>
                  <label style={lbl}>Hero Badge <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(small label above title)</span></label>
                  <input type="text" value={form.heroBadge} onChange={e => setField('heroBadge', e.target.value)} style={inp} placeholder="India's #1 Exam Prep Platform" />
                </div>
                <div>
                  <label style={lbl}>Hero Title <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(words containing "exam" or "examsphere" get highlighted)</span></label>
                  <input type="text" value={form.heroTitle} onChange={e => setField('heroTitle', e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Hero Description</label>
                  <textarea value={form.heroDesc} onChange={e => setField('heroDesc', e.target.value)} rows={4} style={{ ...inp, resize: 'vertical' }} />
                </div>
                <div style={{ padding: 16, borderRadius: 10, background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                    👁️ <strong>Preview:</strong> <span style={{ fontStyle: 'italic' }}>{form.heroBadge}</span> → <strong>{form.heroTitle}</strong>
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* ─── CAROUSEL ─── */}
          {activeTab === 'carousel' && (
            <Card>
              <SectionHeader icon={Image} title="Hero Carousel Images" subtitle="Upload images from your computer or paste image URLs. These appear in the hero carousel on the right side." />
              <CarouselManager
                images={form.carouselImages}
                onChange={imgs => setField('carouselImages', imgs)}
              />
              <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong>💡 Tips:</strong> Images are stored as base64 (local uploads) or URLs. For best results use images with a 4:3 or 3:2 aspect ratio. Minimum 3 images recommended for a smooth carousel effect.
              </div>
            </Card>
          )}

          {/* ─── STATS ─── */}
          {activeTab === 'stats' && (
            <Card>
              <SectionHeader icon={BarChart2} title="Statistics Section" subtitle='Edit the animated counter cards displayed below the hero (e.g. "50K+ Students Enrolled").' />
              <StatsEditor stats={form.stats} onChange={s => setField('stats', s)} />
            </Card>
          )}

          {/* ─── LIVE EXAMS ─── */}
          {activeTab === 'exams' && (
            <Card>
              <SectionHeader icon={Calendar} title="Live Exams — Prepare for Every Exam" subtitle="Select which scheduled exams are displayed under the Live Exams section on the Home page." />
              <LiveExamsViewer 
                selected={form.selectedSchedules || []}
                onChange={val => setField('selectedSchedules', val)}
              />
            </Card>
          )}

          {/* ─── TRENDING TESTS ─── */}
          {activeTab === 'tests' && (
            <Card>
              <SectionHeader icon={TrendingUp} title="Trending Mock Tests" subtitle="Select which mock tests are displayed under the Trending Mock Tests section on the Home page." />
              <TrendingMockTestsViewer 
                selected={form.selectedMockTests || []}
                onChange={val => setField('selectedMockTests', val)}
              />
            </Card>
          )}

          {/* ─── PHOTO GRID ─── */}
          {/* {activeTab === 'galleryGrid' && (
            <Card>
              <SectionHeader icon={Grid} title="Photo Grid Section" subtitle="Edit the 8 images and hover descriptions displayed in the Photo Grid section of the Home page." />
              <GalleryGridEditor 
                gallery={form.galleryGrid || []}
                onChange={val => setField('galleryGrid', val)}
              />
            </Card>
          )} */}

          {/* ─── FEATURES ─── */}
          {activeTab === 'features' && (
            <Card>
              <SectionHeader icon={Star} title={'"Everything You Need to Succeed" Section'} subtitle="Customize the feature cards shown on the Home page. Each card has an icon, title, and description." />
              <FeaturesEditor features={form.features} onChange={f => setField('features', f)} />
              <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                <strong>Default 4 cards:</strong> Exam-Pattern Tests · Deep Analytics · Adaptive Learning · Real-Time Timer
              </div>
            </Card>
          )}

          {/* ─── CTA ─── */}
          {activeTab === 'cta' && (
            <Card>
              <SectionHeader icon={Target} title="Call to Action (CTA) Section" subtitle="The bottom banner encouraging users to start their journey. Appears at the end of the Home page." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 720 }}>
                <div>
                  <label style={lbl}>CTA Title</label>
                  <input type="text" value={form.ctaTitle} onChange={e => setField('ctaTitle', e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>CTA Description</label>
                  <textarea value={form.ctaDesc} onChange={e => setField('ctaDesc', e.target.value)} rows={3} style={{ ...inp, resize: 'vertical' }} />
                </div>
                <div style={{ padding: 16, borderRadius: 10, background: 'rgba(255,107,0,0.06)', border: '1px solid rgba(255,107,0,0.2)' }}>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-secondary)' }}>
                    👁️ <strong>Preview:</strong> <strong>{form.ctaTitle}</strong> — {form.ctaDesc}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Sticky save bar */}
          <div style={{ position: 'sticky', bottom: 24, display: 'flex', justifyContent: 'flex-end', pointerEvents: 'none' }}>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 24px rgba(255,107,0,0.45)', pointerEvents: 'all' }}
            >
              {saving ? <><Loader size={16} className="spin" /> Saving...</> : <><Save size={16} /> Save All Changes</>}
            </button>
          </div>
        </>
      )}
    </AdminLayout>
  );
}
