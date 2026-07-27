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
  { id: 'computer', label: 'Computer / Laptop', icon: <RiComputerLine className="w-4 h-4 text-blue-500" /> },
  { id: 'book', label: 'Book / Literature', icon: <RiBookOpenLine className="w-4 h-4 text-green-500" /> },
  { id: 'font', label: 'Language / Text', icon: <RiFontMono className="w-4 h-4 text-purple-500" /> },
  { id: 'calculator', label: 'Math / Calculator', icon: <RiCalculatorLine className="w-4 h-4 text-red-500" /> },
  { id: 'globe', label: 'GK / Globe', icon: <RiGlobalLine className="w-4 h-4 text-amber-500" /> },
  { id: 'flask', label: 'Science / Flask', icon: <RiFlaskLine className="w-4 h-4 text-cyan-500" /> },
  { id: 'puzzle', label: 'Reasoning / Puzzle', icon: <RiPuzzleLine className="w-4 h-4 text-pink-500" /> },
  { id: 'file', label: 'Document / File', icon: <RiFileTextLine className="w-4 h-4 text-indigo-500" /> },
];

export default function EBooks() {
  const [ebooks, setEbooks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [subjects, setSubjects] = useState([]);

  /* ── Tab state ───────────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState('ebooks'); // 'ebooks' | 'usertab'

  /* ── Ebook page config (Banner settings) ─────────────────────────────────── */
  const [cfgSaving, setCfgSaving] = useState(false);
  const [bannerEyebrow, setBannerEyebrow] = useState('');
  const [bannerHeading, setBannerHeading] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerStats, setBannerStats] = useState([{ n: '', label: '' }]);

  /* ── PYQ Categories State (/api/pyq-ebooks) ──────────────────────────────── */
  const [pyqCategories, setPyqCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catTitle, setCatTitle] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catIcon, setCatIcon] = useState('book');
  const [catLink, setCatLink] = useState('');
  const [catStatus, setCatStatus] = useState('active');
  const [catDisplayOrder, setCatDisplayOrder] = useState(1);
  const [catSaving, setCatSaving] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  useEffect(() => {
    api.get('/subjects/dropdown').then(r => setSubjects(r.data.data)).catch(() => { });
  }, []);

  /* ── Fetch Ebooks ────────────────────────────────────────────────────────── */
  const fetchEbooks = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/ebooks', { params: { page, limit: 10, search } });
      setEbooks(data.data);
      setTotal(data.pagination.total);
    } catch {
      toast.error('Failed to load e-books');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchEbooks(); }, [fetchEbooks]);

  /* ── Fetch Banner Config ─────────────────────────────────────────────────── */
  const fetchConfig = useCallback(async () => {
    try {
      const { data } = await api.get('/ebooks-config');
      const c = data.data;
      setBannerEyebrow(c.bannerEyebrow || '');
      setBannerHeading(c.bannerHeading || '');
      setBannerSubtitle(c.bannerSubtitle || '');
      setBannerStats(c.bannerStats?.length ? c.bannerStats : [{ n: '', label: '' }]);
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => { fetchConfig(); }, [fetchConfig]);

  /* ── Fetch PYQ Categories (/api/pyq-ebooks) ───────────────────────────── */
  const fetchPyqCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const { data } = await api.get('/pyq-ebooks');
      setPyqCategories(data.data || []);
    } catch {
      toast.error('Failed to load PYQ categories');
    } finally {
      setCatLoading(false);
    }
  }, []);

  useEffect(() => { fetchPyqCategories(); }, [fetchPyqCategories]);

  /* ── Save Banner Settings ────────────────────────────────────────────────── */
  const saveConfig = async () => {
    setCfgSaving(true);
    try {
      await api.put('/ebooks-config', {
        bannerEyebrow,
        bannerHeading,
        bannerSubtitle,
        bannerStats: bannerStats.filter(s => s.n || s.label),
      });
      toast.success('Banner settings saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setCfgSaving(false);
    }
  };

  /* ── Banner stat helpers ─────────────────────────────────────────────────── */
  const addStat = () => setBannerStats(p => [...p, { n: '', label: '' }]);
  const removeStat = (i) => setBannerStats(p => p.filter((_, idx) => idx !== i));
  const updateStat = (i, key, val) => setBannerStats(p => p.map((s, idx) => idx === i ? { ...s, [key]: val } : s));

  /* ── PYQ Category CRUD & Reorder ─────────────────────────────────────────── */
  const openAddCategory = () => {
    setEditingCat(null);
    setCatTitle('');
    setCatDescription('');
    setCatIcon('computer');
    setCatLink('');
    setCatStatus('active');
    setCatDisplayOrder(pyqCategories.length + 1);
    setCatModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditingCat(cat);
    setCatTitle(cat.title || '');
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
        description: catDescription.trim(),
        icon: catIcon,
        link: catLink.trim() || `/pyq-ebook?q=${encodeURIComponent(catTitle.trim())}`,
        status: catStatus,
        displayOrder: Number(catDisplayOrder) || 1,
      };

      if (editingCat) {
        await api.put(`/pyq-ebooks/${editingCat._id}`, payload);
        toast.success('PYQ Category updated!');
      } else {
        await api.post('/pyq-ebooks', payload);
        toast.success('PYQ Category added!');
      }
      setCatModalOpen(false);
      fetchPyqCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (cat) => {
    const result = await Swal.fire({
      title: `Delete "${cat.title}"?`,
      text: 'This item will be removed from the navbar dropdown.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
    });
    if (!result.isConfirmed) return;

    try {
      await api.delete(`/pyq-ebooks/${cat._id}`);
      toast.success('Category deleted');
      fetchPyqCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const saveReorderedCategories = async (newCategories) => {
    setPyqCategories(newCategories);
    try {
      const items = newCategories.map((c, i) => ({ _id: c._id, displayOrder: i + 1 }));
      await api.put('/pyq-ebooks/reorder', { items });
      toast.success('Display order updated!');
    } catch {
      toast.error('Failed to save order');
    }
  };

  const moveCategory = (fromIdx, toIdx) => {
    if (toIdx < 0 || toIdx >= pyqCategories.length) return;
    const updated = [...pyqCategories];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    saveReorderedCategories(updated);
  };

  /* ── Ebook CRUD ──────────────────────────────────────────────────────────── */
  const [instructions, setInstructions] = useState(['']);

  const openCreate = () => {
    setEditing(null);
    setInstructions(['']);
    reset({ pages: '150+ pages', year: '2018-2025', price: 0, isFree: true, status: 'published' });
    setModalOpen(true);
  };

  const openEdit = (e) => {
    setEditing(e);
    setInstructions(e.instructions?.length ? e.instructions : ['']);
    reset({
      title: e.title,
      subject: e.subject?.name || e.subject || '',
      category: e.category || '',
      description: e.description,
      pages: e.pages || '150+ pages',
      year: e.year || '2018-2025',
      tags: e.tags?.join(', ') || '',
      price: e.price,
      status: e.status,
      isFree: e.isFree,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      const formData = new FormData();
      Object.entries(values).forEach(([k, v]) => { if (v !== undefined && v !== null) formData.append(k, v); });
      if (values.pdfFile?.[0]) formData.set('pdf', values.pdfFile[0]);

      instructions.filter(Boolean).forEach(inst => formData.append('instructions[]', inst));

      const headers = { 'Content-Type': 'multipart/form-data' };
      if (editing) await api.put(`/ebooks/${editing._id}`, formData, { headers });
      else await api.post('/ebooks', formData, { headers });
      toast.success(editing ? 'E-Book updated!' : 'E-Book created!');
      setModalOpen(false);
      fetchEbooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const handleDelete = async (e) => {
    const result = await Swal.fire({ title: `Delete "${e.title}"?`, icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444' });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/ebooks/${e._id}`);
      toast.success('Deleted');
      fetchEbooks();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    }
  };

  const columns = [
    {
      key: 'title', label: 'Book Name',
      render: r => (
        <div>
          <p className="font-semibold text-slate-800 dark:text-white text-sm">{r.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-400">{r.subject?.name}</span>
            {r.category && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-300">
                {r.category}
              </span>
            )}
          </div>
        </div>
      )
    },
    { key: 'status', label: 'Status', render: r => <span className={r.status === 'published' ? 'admin-badge-green' : 'admin-badge-yellow'}>{r.status}</span> },
    { key: 'price', label: 'Price', render: r => r.isFree ? <span className="admin-badge-green">Free</span> : `₹${r.price}` },
    {
      key: 'downloadCount', label: 'Downloads',
      render: r => (
        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
          <RiDownloadLine className="w-3 h-3" />{r.downloadCount || 0}
        </span>
      )
    },
    {
      key: 'actions', label: 'Actions',
      render: r => (
        <div className="flex items-center gap-1">
          <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 transition-colors"><RiEditLine className="w-4 h-4" /></button>
          <button onClick={() => handleDelete(r)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"><RiDeleteBin2Line className="w-4 h-4" /></button>
        </div>
      )
    },
  ];

  /* ══════════════════════════════ RENDER ═════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* Page Header + Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">PYQ E-Books</h2>
        <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 gap-1">
          {[
            { id: 'ebooks', label: '📋 All E-Books' },
            { id: 'usertab', label: '🖥 User Tab & Categories' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === t.id
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
          TAB: ALL E-BOOKS
      ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ebooks' && (
        <DataTable
          columns={columns} data={ebooks} total={total} page={page} limit={10} loading={loading} onPageChange={setPage}
          search={search} onSearch={(v) => { setSearch(v); setPage(1); }} searchPlaceholder="Search e-books..."
          emptyMessage="No e-books found."
          actions={<button onClick={openCreate} className="admin-btn-primary"><RiAddLine className="w-4 h-4" /> Add E-Book</button>}
        />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB: USER TAB — Banner Settings + PYQ Categories Management
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
              <input value={bannerEyebrow} onChange={e => setBannerEyebrow(e.target.value)} className="admin-input" placeholder="PYQ Ebook" />
            </div>

            {/* Heading */}
            <div className="mb-3">
              <label className="admin-label">Main Heading *</label>
              <input value={bannerHeading} onChange={e => setBannerHeading(e.target.value)} className="admin-input" placeholder="Previous Year Question E-Books" />
            </div>

            {/* Subtitle */}
            <div className="mb-5">
              <label className="admin-label">Subtitle / Description</label>
              <textarea
                value={bannerSubtitle}
                onChange={e => setBannerSubtitle(e.target.value)}
                rows={3}
                className="admin-input resize-none"
                placeholder="Topic-wise PYQ collections — the most trusted exam resource for Odisha state exams."
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
                      placeholder="e.g. 9+"
                      className="admin-input w-24 flex-shrink-0"
                    />
                    <input
                      value={s.label}
                      onChange={e => updateStat(i, 'label', e.target.value)}
                      placeholder="e.g. E-Books"
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
              <div style={{ background: 'linear-gradient(135deg,#0f172a,rgba(234,122,30,0.15))', borderRadius: 12, padding: '16px 20px' }}>
                <p style={{ color: '#FDE68A', fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
                  {bannerEyebrow || 'PYQ Ebook'}
                </p>
                <p style={{ color: '#fff', fontWeight: 800, fontSize: 16, marginBottom: 6 }}>
                  {bannerHeading || 'Previous Year Question E-Books'}
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

          {/* ═══ RIGHT — PYQ Categories Management ════════════ */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-2">📚 PYQ EBOOK CATEGORIES</h3>
                <p className="text-xs text-slate-400 mt-0.5">Manage items displayed inside the PYQ Ebook navbar dropdown</p>
              </div>
              <button onClick={openAddCategory} className="admin-btn-primary text-xs px-3 py-1.5 flex items-center gap-1">
                <RiAddLine className="w-3.5 h-3.5" /> Add PYQ Category
              </button>
            </div>

            {/* Table layout */}
            {catLoading ? (
              <div className="p-10 text-center text-slate-400 text-sm">Loading categories…</div>
            ) : pyqCategories.length === 0 ? (
              <div className="p-10 text-center">
                <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <RiAddLine className="w-5 h-5" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No PYQ categories found</p>
                <p className="text-slate-400 text-xs mt-1">Click "+ Add PYQ Category" to create your first dropdown item.</p>
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
                    {pyqCategories.map((cat, idx) => {
                      const iconObj = ICON_OPTIONS.find(o => o.id === cat.icon) || ICON_OPTIONS[1];
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
                          className={`hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-all ${draggedIdx === idx ? 'opacity-40 bg-blue-50/50 dark:bg-blue-900/20' : ''
                            }`}
                        >
                          <td className="py-3 px-4 text-slate-400 font-bold text-xs">
                            <div className="flex items-center gap-1 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 transition-colors" title="Drag to reorder">
                              <RiDragMove2Line className="w-4 h-4 flex-shrink-0" />
                              <span className="text-[11px] font-semibold text-slate-400">{idx + 1}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-800 dark:text-white text-sm">{cat.title}</td>
                          <td className="py-3 px-4 text-slate-500 text-xs truncate max-w-[150px]">{cat.description || '—'}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg w-fit">
                              {iconObj.icon}
                              <span className="capitalize">{cat.icon}</span>
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
                                disabled={idx === pyqCategories.length - 1}
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
          ADD / EDIT EBOOK MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit E-Book Details' : 'Upload New E-Book'} size="lg"
        footer={<><button onClick={() => setModalOpen(false)} className="admin-btn-secondary">Cancel</button><button form="ebook-form" type="submit" disabled={isSubmitting} className="admin-btn-primary">{isSubmitting ? 'Saving...' : editing ? 'Update Details' : 'Upload E-Book'}</button></>}
      >
        <form id="ebook-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="admin-label">Book Title *</label>
            <input {...register('title', { required: 'Title required' })} className="admin-input" placeholder="e.g. Computer Science Previous Papers" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="admin-label">Subject *</label>
              <input {...register('subject', { required: 'Subject required' })} className="admin-input" placeholder="e.g. Computer Science" />
              {errors.subject && <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>}
            </div>
            <div>
              <label className="admin-label">Category *</label>
              <select {...register('category', { required: 'Category required' })} className="admin-input">
                <option value="">Select category...</option>
                {pyqCategories.map(c => <option key={c._id} value={c.title}>{c.title}</option>)}
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
            <textarea {...register('description')} rows={2} className="admin-input resize-none" placeholder="Detailed description of topics covered in this e-book..." />
          </div>

          {/* Details: Pages, Year, Tags */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="admin-label">Pages Count</label>
              <input {...register('pages')} className="admin-input" placeholder="e.g. 180 pages" />
            </div>
            <div>
              <label className="admin-label">Year Range</label>
              <input {...register('year')} className="admin-input" placeholder="e.g. 2018-2025" />
            </div>
            <div>
              <label className="admin-label">Exam Tags <span className="text-slate-400 font-normal text-[10px]">(comma separated)</span></label>
              <input {...register('tags')} className="admin-input" placeholder="e.g. OSSSC, OSSC, OPSC" />
            </div>
          </div>

          {/* Instructions for Candidates */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="admin-label mb-0">Instructions for Candidates / Key Features</label>
              <button
                type="button"
                onClick={() => setInstructions(prev => [...prev, ''])}
                className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-1"
              >
                + Add Instruction
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
                    onChange={e => {
                      const updated = [...instructions];
                      updated[idx] = e.target.value;
                      setInstructions(updated);
                    }}
                    placeholder={`e.g. Includes 500+ solved MCQs with explanations`}
                    className="admin-input flex-1 text-xs"
                  />
                  {instructions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setInstructions(instructions.filter((_, i) => i !== idx))}
                      className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                    >
                      <RiDeleteBin2Line className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
            <label className="admin-label">PDF File {!editing && '*'}</label>
            <input {...register('pdfFile', { required: !editing ? 'PDF required' : false })} type="file" accept=".pdf" className="admin-input text-xs" />
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
          ADD / EDIT PYQ CATEGORY MODAL (/api/pyq-ebooks)
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        isOpen={catModalOpen}
        onClose={() => setCatModalOpen(false)}
        title={editingCat ? 'Edit PYQ Category' : 'Add PYQ Category'}
        size="md"
        footer={
          <>
            <button onClick={() => setCatModalOpen(false)} className="admin-btn-secondary">
              Cancel
            </button>
            <button onClick={handleSaveCategory} disabled={catSaving} className="admin-btn-primary flex items-center gap-1.5">
              <RiCheckLine className="w-4 h-4" />
              {catSaving ? 'Saving…' : editingCat ? 'Update Category' : 'Save Category'}
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
              placeholder="e.g. Computer PYQs"
              autoFocus
            />
          </div>

          <div>
            <label className="admin-label">Description</label>
            <input
              value={catDescription}
              onChange={e => setCatDescription(e.target.value)}
              className="admin-input"
              placeholder="e.g. Previous computer science papers"
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
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${catIcon === opt.id
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
              placeholder="e.g. /pyq-ebook?q=Computer"
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
