import { useState, useEffect, useCallback } from 'react';
import {
  RiAddLine, RiEditLine, RiDeleteBin2Line, RiDownloadLine,
  RiCheckLine, RiDragMove2Line, RiArrowUpLine, RiArrowDownLine,
  RiComputerLine, RiBookOpenLine, RiFontMono, RiCalculatorLine,
  RiGlobalLine, RiFlaskLine, RiPuzzleLine, RiFileTextLine
} from 'react-icons/ri';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import api from '../api/axios';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';

const ICON_OPTIONS = [
  { id: 'computer',   label: 'Computer / Laptop', icon: <RiComputerLine className="w-4 h-4 text-blue-500" /> },
  { id: 'book',       label: 'Book / Literature', icon: <RiBookOpenLine className="w-4 h-4 text-green-500" /> },
  { id: 'font',       label: 'Language / Text',   icon: <RiFontMono className="w-4 h-4 text-purple-500" /> },
  { id: 'calculator', label: 'Math / Calculator', icon: <RiCalculatorLine className="w-4 h-4 text-red-500" /> },
  { id: 'globe',      label: 'GK / Globe',        icon: <RiGlobalLine className="w-4 h-4 text-amber-500" /> },
  { id: 'flask',      label: 'Science / Flask',   icon: <RiFlaskLine className="w-4 h-4 text-cyan-500" /> },
  { id: 'puzzle',     label: 'Reasoning / Puzzle',icon: <RiPuzzleLine className="w-4 h-4 text-pink-500" /> },
  { id: 'file',       label: 'Document / File',   icon: <RiFileTextLine className="w-4 h-4 text-indigo-500" /> },
];

export default function Materials() {
  /* ── materials state ─────────────────────────────────────────────────────── */
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [instructions, setInstructions] = useState(['']);

  /* ── tab state ───────────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('materials'); // 'materials' | 'usertab'

  /* ── materials page config (User Tab) ───────────────────────────────────── */
  const [cfgSaving, setCfgSaving]         = useState(false);
  const [bannerEyebrow, setBannerEyebrow] = useState('');
  const [bannerHeading, setBannerHeading] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerStats, setBannerStats]     = useState([{ n: '', label: '' }]);

  /* ── Material Categories State (/api/material-categories) ───────────────── */
  const [categories, setCategories]       = useState([]);
  const [catLoading, setCatLoading]       = useState(false);
  const [catModalOpen, setCatModalOpen]   = useState(false);
  const [editingCat, setEditingCat]       = useState(null);
  const [catTitle, setCatTitle]           = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIcon, setCatIcon]             = useState('computer');
  const [catLink, setCatLink]             = useState('');
  const [catStatus, setCatStatus]         = useState('active');
  const [catDisplayOrder, setCatDisplayOrder] = useState(1);
  const [catSaving, setCatSaving]         = useState(false);
  const [draggedIdx, setDraggedIdx]       = useState(null);

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm();

  /* ── fetch categories (/api/material-categories) ────────────────────────── */
  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const { data } = await api.get('/material-categories');
      setCategories(data.data || []);
    } catch {
      toast.error('Failed to load material categories');
    } finally {
      setCatLoading(false);
    }
  }, []);

  /* ── fetch materials ─────────────────────────────────────────────────────── */
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/materials', { params: { page, limit: 10, search } });
      setMaterials(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    api.get('/subjects/dropdown').then(r => setSubjects(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchCategories(); fetchMaterials(); }, [fetchCategories, fetchMaterials]);

  /* ── fetch materialsConfig (Banner Settings) ────────────────────────────── */
  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await api.get('/materials-config');
      const c = data.data;
      setBannerEyebrow(c.bannerEyebrow || '');
      setBannerHeading(c.bannerHeading || '');
      setBannerSubtitle(c.bannerSubtitle || '');
      setBannerStats(c.bannerStats?.length ? c.bannerStats : [{ n: '', label: '' }]);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  /* ── save materialsConfig ──────────────────────────────────────────────── */
  const saveConfig = async () => {
    setCfgSaving(true);
    try {
      await api.put('/materials-config', {
        bannerEyebrow, bannerHeading, bannerSubtitle,
        bannerStats: bannerStats.filter(s => s.n || s.label),
      });
      toast.success('Banner settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setCfgSaving(false); }
  };

  /* ── stat helpers ──────────────────────────────────────────────────────── */
  const addStat    = () => setBannerStats(p => [...p, { n: '', label: '' }]);
  const removeStat = (i) => setBannerStats(p => p.filter((_, idx) => idx !== i));
  const updateStat = (i, key, val) => setBannerStats(p => p.map((s, idx) => idx === i ? { ...s, [key]: val } : s));

  /* ── Material Category CRUD & Reorder ───────────────────────────────────── */
  const openAddCategory = () => {
    setEditingCat(null);
    setCatTitle('');
    setCatDescription('');
    setCatIcon('computer');
    setCatLink('');
    setCatStatus('active');
    setCatDisplayOrder(categories.length + 1);
    setCatModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCat(cat);
    setCatTitle(cat.title || cat.name || '');
    setCatDescription(cat.description || '');
    setCatIcon(cat.icon || 'book');
    setCatLink(cat.link || '');
    setCatStatus(cat.status || 'active');
    setCatDisplayOrder(cat.displayOrder || 1);
    setCatModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!catTitle.trim()) return toast.error('Category title is required');
    setCatSaving(true);
    try {
      const payload = {
        title: catTitle.trim(),
        name: catTitle.trim(),
        description: catDescription.trim(),
        icon: catIcon,
        link: catLink.trim() || `/materials?cat=${encodeURIComponent(catTitle.trim())}`,
        status: catStatus,
        displayOrder: Number(catDisplayOrder) || 1,
      };

      if (editingCat) {
        await api.put(`/material-categories/${editingCat._id}`, payload);
        toast.success('Material Category updated!');
      } else {
        await api.post('/material-categories', payload);
        toast.success('Material Category added!');
      }
      setCatModalOpen(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const result = await Swal.fire({
      title: `Delete "${cat.title || cat.name}"?`,
      text: 'This item will be removed from the frontend Material Page dropdown.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/material-categories/${cat._id}`);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const saveReorderedCategories = async (newCategories) => {
    setCategories(newCategories);
    try {
      const items = newCategories.map((c, i) => ({ _id: c._id, displayOrder: i + 1 }));
      await api.put('/material-categories/reorder', { items });
      toast.success('Display order updated!');
    } catch {
      toast.error('Failed to save order');
    }
  };

  const moveCategory = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= categories.length) return;
    const updated = [...categories];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    saveReorderedCategories(updated);
  };

  /* ── Material CRUD ───────────────────────────────────────────────────────── */
  const openCreate = () => {
    setEditing(null);
    setInstructions(['']);
    reset({ isFree: true, status: 'published' });
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditing(m);
    setInstructions(m.instructions?.length ? m.instructions : ['']);
    reset({
      title: m.title, subject: m.subject?.name || m.subject || '', category: m.category, description: m.description,
      price: m.price, status: m.status, isFree: m.isFree,
      tags: (m.tags || []).join(', '),
    });
    setModalOpen(true);
  };

  /* instruction helpers */
  const addInstruction    = () => setInstructions(p => [...p, '']);
  const removeInstruction = (i) => setInstructions(p => p.filter((_, idx) => idx !== i));
  const updateInstruction = (i, v) => setInstructions(p => p.map((x, idx) => idx === i ? v : x));

  /* submit material */
  const onSubmit = async (values) => {
    try {
      const fd = new FormData();
      ['title', 'subject', 'category', 'description', 'status'].forEach(k => fd.append(k, values[k] ?? ''));
      fd.append('price',  values.price  ?? 0);
      fd.append('isFree', values.isFree ? 'true' : 'false');
      (values.tags || '').split(',').map(t => t.trim()).filter(Boolean).forEach(t => fd.append('tags[]', t));
      instructions.filter(Boolean).forEach(i => fd.append('instructions[]', i));
      if (values.pdfFile?.[0])       fd.set('pdf',       values.pdfFile[0]);
      if (values.thumbnailFile?.[0]) fd.set('thumbnail', values.thumbnailFile[0]);

      const h = { 'Content-Type': 'multipart/form-data' };
      if (editing) { await api.put(`/materials/${editing._id}`, fd, { headers: h }); toast.success('Material updated!'); }
      else         { await api.post('/materials', fd, { headers: h });                toast.success('Material uploaded!'); }
      setModalOpen(false);
      fetchMaterials();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
  };

  /* delete material */
  const handleDelete = async (m) => {
    const r = await Swal.fire({ title: `Delete "${m.title}"?`, text: 'Cannot be undone.', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b' });
    if (!r.isConfirmed) return;
    try { await api.delete(`/materials/${m._id}`); toast.success('Deleted'); fetchMaterials(); }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  /* columns for materials data table */
  const columns = [
    {
      key: 'title', label: 'Title',
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
            PDF
          </div>
          <div>
            <div className="font-semibold text-slate-800 dark:text-white text-sm">{m.title}</div>
            <div className="text-xs text-slate-400">{m.subject?.name ? `Subject: ${m.subject.name}` : m.category}</div>
          </div>
        </div>
      ),
    },
    { key: 'category', label: 'Category' },
    {
      key: 'isFree', label: 'Price',
      render: (m) => m.isFree ? <span className="admin-badge-green">Free</span> : <span className="font-semibold text-slate-700 dark:text-slate-300">₹{m.price}</span>,
    },
    {
      key: 'status', label: 'Status',
      render: (m) => <span className={m.status === 'published' ? 'admin-badge-green' : 'admin-badge-yellow'}>{m.status}</span>,
    },
    {
      key: 'downloadCount', label: 'Downloads',
      render: (m) => (
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <RiDownloadLine className="w-3.5 h-3.5 text-slate-400" />
          {m.downloadCount || 0}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (m) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" title="Edit">
            <RiEditLine className="w-4 h-4" />
          </button>
          <button onClick={() => handleDelete(m)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Delete">
            <RiDeleteBin2Line className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  /* ══════════════════════════════ RENDER ═════════════════════════════════════ */
  return (
    <div className="space-y-5">
      {/* Header + Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Study Materials</h2>
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 gap-1">
          {[
            { id: 'materials', label: '📋 All Materials' },
            { id: 'usertab',   label: '🖥 User Tab & Categories' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === t.id
                  ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: ALL MATERIALS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'materials' && (
        <DataTable
          columns={columns} data={materials} total={total} page={page} limit={10}
          loading={loading} onPageChange={setPage}
          search={search} onSearch={v => { setSearch(v); setPage(1); }}
          searchPlaceholder="Search materials…" emptyMessage="No materials found."
          actions={
            <button onClick={openCreate} className="admin-btn-primary">
              <RiAddLine className="w-4 h-4"/> Add Material
            </button>
          }
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: USER TAB — Banner Settings + Material Categories Management
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'usertab' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ═══ LEFT — Banner Settings ════════════════════════ */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-5 flex items-center gap-2">
              🖼 Banner Text Settings
            </h3>

            {/* Eyebrow */}
            <div className="mb-3">
              <label className="admin-label">Eyebrow Label <span className="text-slate-400 font-normal text-xs">(small text above heading)</span></label>
              <input value={bannerEyebrow} onChange={e => setBannerEyebrow(e.target.value)} className="admin-input" placeholder="Study Materials" />
            </div>

            {/* Heading */}
            <div className="mb-3">
              <label className="admin-label">Main Heading *</label>
              <input value={bannerHeading} onChange={e => setBannerHeading(e.target.value)} className="admin-input" placeholder="Free & Premium Study Materials" />
            </div>

            {/* Subtitle */}
            <div className="mb-5">
              <label className="admin-label">Subtitle / Description</label>
              <textarea
                value={bannerSubtitle}
                onChange={e => setBannerSubtitle(e.target.value)}
                rows={3}
                className="admin-input resize-none"
                placeholder="Brief description shown below the heading…"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-slate-100 dark:border-slate-700 my-4" />

            {/* Stats badges */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="admin-label mb-0">Stats Badges</label>
                <button type="button" onClick={addStat} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                  <RiAddLine className="w-3 h-3" /> Add
                </button>
              </div>
              <div className="space-y-2">
                {bannerStats.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input
                      value={s.n}
                      onChange={e => updateStat(i, 'n', e.target.value)}
                      placeholder="e.g. 50+"
                      className="admin-input w-24 flex-shrink-0"
                    />
                    <input
                      value={s.label}
                      onChange={e => updateStat(i, 'label', e.target.value)}
                      placeholder="e.g. PDFs"
                      className="admin-input flex-1"
                    />
                    {bannerStats.length > 1 && (
                      <button type="button" onClick={() => removeStat(i)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors flex-shrink-0">
                        <RiDeleteBin2Line className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="mb-5 rounded-xl overflow-hidden">
              <p className="text-xs text-slate-400 mb-2 font-medium">Banner Preview</p>
              <div style={{ background: 'linear-gradient(135deg,#0f172a,rgba(25,87,214,0.15))', borderRadius: 12, padding: '16px 20px' }}>
                <p style={{ color: '#FDE68A', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                  {bannerEyebrow || 'Study Materials'}
                </p>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
                  {bannerHeading || 'Free & Premium Study Materials'}
                </p>
                <p style={{ color: '#94A3B8', fontSize: 11.5, marginBottom: 10, lineHeight: 1.5 }}>
                  {bannerSubtitle || '…'}
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {bannerStats.map((s, i) => (
                    <div key={i} style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '6px 10px', textAlign: 'center' }}>
                      <div style={{ color: '#FFC93C', fontWeight: 900, fontSize: 14 }}>{s.n || '—'}</div>
                      <div style={{ color: '#CBD5E1', fontSize: 9, marginTop: 2 }}>{s.label || 'Label'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={saveConfig}
              disabled={cfgSaving}
              className="admin-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <RiCheckLine className="w-4 h-4" />
              {cfgSaving ? 'Saving…' : 'Save Banner Settings'}
            </button>
          </div>

          {/* ═══ RIGHT — Material Categories Management ════════════ */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">📂 MATERIAL PAGE CATEGORIES</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage items displayed inside the Material Page navbar dropdown</p>
              </div>
              <button onClick={openAddCategory} className="admin-btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                <RiAddLine className="w-3.5 h-3.5" /> Add Material Category
              </button>
            </div>

            {/* Table layout */}
            {catLoading ? (
              <div className="p-10 text-center text-slate-400 text-sm">Loading categories…</div>
            ) : categories.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <RiAddLine className="w-5 h-5" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No Material Categories Found</p>
                <p className="text-slate-400 text-xs mt-1">Add your first Material category to display it in the Material Page dropdown.</p>
                <button onClick={openAddCategory} className="admin-btn-primary text-xs mt-3 inline-flex items-center gap-1">
                  <RiAddLine className="w-3.5 h-3.5" /> Add Material
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-100 dark:border-slate-700">
                    <tr>
                      <th className="py-3 px-4 w-14 text-center">Reorder</th>
                      <th className="py-3 px-4">Title</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Icon</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {categories.map((cat, idx) => {
                      const iconObj = ICON_OPTIONS.find(o => o.id === cat.icon) || ICON_OPTIONS[0];
                      return (
                        <tr
                          key={cat._id || idx}
                          draggable
                          onDragStart={() => setDraggedIdx(idx)}
                          onDragOver={e => e.preventDefault()}
                          onDrop={() => {
                            if (draggedIdx !== null && draggedIdx !== idx) {
                              moveCategory(draggedIdx, idx);
                              setDraggedIdx(null);
                            }
                          }}
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all ${
                            draggedIdx === idx ? 'opacity-40 bg-blue-50/50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-slate-400 font-bold text-xs">
                            <div className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 transition-colors" title="Drag to reorder">
                              <RiDragMove2Line className="w-4 h-4 flex-shrink-0" />
                              <span className="text-[11px] font-semibold text-slate-400">{idx + 1}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white text-sm">{cat.title || cat.name}</td>
                          <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-[150px]">{cat.description || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg w-fit">
                              {iconObj.icon}
                              <span className="capitalize">{cat.icon || 'computer'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={cat.status === 'active' ? 'admin-badge-green' : 'admin-badge-yellow'}>
                              {cat.status || 'active'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => moveCategory(idx, idx - 1)}
                                disabled={idx === 0}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                title="Move Up"
                              >
                                <RiArrowUpLine className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => moveCategory(idx, idx + 1)}
                                disabled={idx === categories.length - 1}
                                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                                title="Move Down"
                              >
                                <RiArrowDownLine className="w-4 h-4" />
                              </button>
                              <button onClick={() => openEditCategory(cat)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors" title="Edit Category">
                                <RiEditLine className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteCategory(cat)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors" title="Delete Category">
                                <RiDeleteBin2Line className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ADD / EDIT MATERIAL MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Material' : 'Upload Study Material'}
        size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="admin-btn-secondary">Cancel</button>
            <button form="material-form" type="submit" disabled={isSubmitting} className="admin-btn-primary">
              {isSubmitting ? 'Saving…' : editing ? 'Update' : 'Upload'}
            </button>
          </>
        }
      >
        <form id="material-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="admin-label">Material Title *</label>
            <input {...register('title', { required: 'Title is required' })} className="admin-input" placeholder="e.g. Current Affairs Jan 2025 PDF" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="admin-label">Subject *</label>
              <input {...register('subject', { required: 'Subject is required' })} className="admin-input" placeholder="e.g. Mathematics" />
              {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <label className="admin-label">Category *</label>
              <select {...register('category', { required: 'Category is required' })} className="admin-input">
                <option value="">Select category…</option>
                {categories.map(c => <option key={c._id} value={c.name || c.title}>{c.title || c.name}</option>)}
              </select>
              {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="admin-label">Status</label>
              <select {...register('status')} className="admin-input">
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div>
            <label className="admin-label">Description</label>
            <textarea {...register('description')} rows={2} className="admin-input resize-none" placeholder="Brief overview of contents…" />
          </div>

          <div>
            <label className="admin-label">Tags <span className="text-slate-400 font-normal text-xs">(comma separated)</span></label>
            <input {...register('tags')} className="admin-input" placeholder="e.g. OSSC, OSSSC, RI Exam" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="admin-label mb-0">Instructions for Candidates</label>
              <button type="button" onClick={addInstruction} className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-1">
                + Add Line
              </button>
            </div>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
              {instructions.map((inst, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    value={inst}
                    onChange={e => updateInstruction(idx, e.target.value)}
                    placeholder={`Instruction line ${idx + 1}`}
                    className="admin-input flex-1 text-xs"
                  />
                  {instructions.length > 1 && (
                    <button type="button" onClick={() => removeInstruction(idx)} className="text-red-400 hover:text-red-600 p-1 flex-shrink-0">
                      <RiDeleteBin2Line className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 dark:border-slate-700 pt-3">
            <div>
              <label className="admin-label">PDF File {!editing && '*'}</label>
              <input {...register('pdfFile', { required: !editing ? 'PDF is required' : false })} type="file" accept=".pdf" className="admin-input text-xs" />
            </div>
            <div>
              <label className="admin-label">Thumbnail Image</label>
              <input {...register('thumbnailFile')} type="file" accept="image/*" className="admin-input text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Price (₹)</label>
              <input {...register('price', { valueAsNumber: true })} type="number" min="0" className="admin-input" defaultValue={0} />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input {...register('isFree')} type="checkbox" className="rounded text-primary-600 w-4 h-4" />
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Free Download</label>
            </div>
          </div>
        </form>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD / EDIT MATERIAL CATEGORY MODAL (/api/material-categories)
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? 'Edit Material Category' : 'Add Material Category'}
        size="md"
        footer={
          <>
            <button onClick={() => setCatModalOpen(false)} className="admin-btn-secondary">
              Cancel
            </button>
            <button onClick={handleSaveCategory} disabled={catSaving} className="admin-btn-primary flex items-center gap-1.5">
              <RiCheckLine className="w-4 h-4" />
              {catSaving ? 'Saving…' : editingCat ? 'Update Category' : 'Save Material'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="admin-label">Title *</label>
            <input
              value={catTitle}
              onChange={e => setCatTitle(e.target.value)}
              className="admin-input"
              placeholder="e.g. Computer Material"
              autoFocus
            />
          </div>

          <div>
            <label className="admin-label">Description</label>
            <input
              value={catDescription}
              onChange={e => setCatDescription(e.target.value)}
              className="admin-input"
              placeholder="e.g. Computer notes and study materials"
            />
          </div>

          <div>
            <label className="admin-label">Select Icon</label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {ICON_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCatIcon(opt.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    catIcon === opt.id
                      ? 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 ring-2 ring-primary-500/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="admin-label">Link / Route <span className="text-slate-400 font-normal text-xs">(optional)</span></label>
            <input
              value={catLink}
              onChange={e => setCatLink(e.target.value)}
              className="admin-input"
              placeholder="e.g. /materials?cat=Computer"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="admin-label">Status</label>
              <select
                value={catStatus}
                onChange={e => setCatStatus(e.target.value)}
                className="admin-input"
              >
                <option value="active">Active (Visible in Dropdown)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>
            <div>
              <label className="admin-label">Display Order</label>
              <input
                type="number"
                min="1"
                value={catDisplayOrder}
                onChange={e => setCatDisplayOrder(e.target.value)}
                className="admin-input"
              />
            </div>
          </div>

        </div>
      </Modal>
    </div>
  );
}
